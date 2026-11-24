import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
const JWT_EXPIRES_IN = '7d';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      role = 'PATIENT',
      firstName, 
      lastName, 
      phone, 
      address, 
      birthDate,
      specialty, 
      licenseNb, 
      name 
    } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email et mot de passe requis' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({ message: 'Cet email est déjà associé à un compte' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const ALLOWED_PUBLIC_ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY'];
    const userRole = (role || 'PATIENT').toUpperCase();

    if (!ALLOWED_PUBLIC_ROLES.includes(userRole)) {
      res.status(403).json({ message: "Ce rôle ne peut pas être créé via l'inscription publique." });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: userRole,
        ...(userRole === 'PATIENT' && {
          patientInfo: {
            create: {
              firstName: firstName || 'Nouveau',
              lastName: lastName || 'Patient',
              phone: phone || null,
              address: address || null,
              birthDate: birthDate ? new Date(birthDate) : null,
            },
          },
        }),
        ...(userRole === 'DOCTOR' && {
          doctorInfo: {
            create: {
              firstName: firstName || 'Dr.',
              lastName: lastName || 'Médecin',
              specialty: specialty || 'Généraliste',
              licenseNb: licenseNb || `MED-${Date.now()}`,
              phone: phone || null,
            },
          },
        }),
        ...(userRole === 'PHARMACY' && {
          pharmacyInfo: {
            create: {
              name: name || 'Pharmacie Centrale',
              address: address || '1 rue de la Santé',
              phone: phone || null,
            },
          },
        }),
      },
      include: {
        patientInfo: true,
        doctorInfo: true,
        pharmacyInfo: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'Compte créé avec succès',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email et mot de passe requis' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        patientInfo: true,
        doctorInfo: true,
        pharmacyInfo: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Ce compte a été désactivé. Veuillez contacter un administrateur.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: 'Connexion réussie',
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        patientInfo: true,
        doctorInfo: true,
        pharmacyInfo: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    const { firstName, lastName, phone, address, birthDate, specialty, licenseNb, name } = req.body;
    const userRole = req.user.role;

    if (userRole === 'PATIENT') {
      await prisma.patientProfile.upsert({
        where: { userId: req.user.id },
        update: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(address !== undefined && { address }),
          ...(birthDate && { birthDate: new Date(birthDate) }),
        },
        create: {
          userId: req.user.id,
          firstName: firstName || 'Patient',
          lastName: lastName || 'User',
          phone: phone || null,
          address: address || null,
          birthDate: birthDate ? new Date(birthDate) : null,
        },
      });
    } else if (userRole === 'DOCTOR') {
      await prisma.doctorProfile.upsert({
        where: { userId: req.user.id },
        update: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(specialty && { specialty }),
          ...(licenseNb && { licenseNb }),
          ...(phone !== undefined && { phone }),
        },
        create: {
          userId: req.user.id,
          firstName: firstName || 'Dr.',
          lastName: lastName || 'Médecin',
          specialty: specialty || 'Généraliste',
          licenseNb: licenseNb || `MED-${Date.now()}`,
          phone: phone || null,
        },
      });
    } else if (userRole === 'PHARMACY') {
      await prisma.pharmacyProfile.upsert({
        where: { userId: req.user.id },
        update: {
          ...(name && { name }),
          ...(address && { address }),
          ...(phone !== undefined && { phone }),
        },
        create: {
          userId: req.user.id,
          name: name || 'Pharmacie',
          address: address || 'Adresse',
          phone: phone || null,
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        patientInfo: true,
        doctorInfo: true,
        pharmacyInfo: true,
      },
    });

    if (!updatedUser) {
      res.status(404).json({ message: 'Utilisateur introuvable' });
      return;
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Erreur updateProfile:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
};
