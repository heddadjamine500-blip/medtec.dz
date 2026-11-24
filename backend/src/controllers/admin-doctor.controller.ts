import { Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logAudit } from '../services/audit.service';

export const createDoctorSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit comporter au moins 6 caractères'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  specialty: z.string().min(1, 'La spécialité est requise'),
  licenseNb: z.string().min(1, "Le numéro d'ordre / licence est requis"),
  phone: z.string().nullable().optional(),
});

export const updateDoctorSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  specialty: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const getAdminDoctors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, specialty, status, page = '1', pageSize = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
    const skip = (pageNum - 1) * limit;

    const where: any = {};

    if (specialty && typeof specialty === 'string' && specialty !== 'ALL') {
      where.specialty = { contains: specialty };
    }

    if (status === 'ACTIVE') {
      where.user = { isActive: true };
    } else if (status === 'INACTIVE') {
      where.user = { isActive: false };
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { licenseNb: { contains: q } },
        { specialty: { contains: q } },
        { user: { email: { contains: q } } },
      ];
    }

    const [total, doctors] = await Promise.all([
      prisma.doctorProfile.count({ where }),
      prisma.doctorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
          availabilities: true,
        },
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      doctors,
    });
  } catch (error) {
    console.error('Erreur getAdminDoctors:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des médecins' });
  }
};

export const createAdminDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      res.status(409).json({ message: 'Un utilisateur avec cette adresse email existe déjà.' });
      return;
    }

    const existingLicense = await prisma.doctorProfile.findUnique({
      where: { licenseNb: data.licenseNb },
    });
    if (existingLicense) {
      res.status(409).json({ message: `Le numéro de licence "${data.licenseNb}" est déjà enregistré.` });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: passwordHash,
          role: 'DOCTOR',
          isActive: true,
        },
      });

      const profile = await tx.doctorProfile.create({
        data: {
          userId: user.id,
          firstName: data.firstName,
          lastName: data.lastName,
          specialty: data.specialty,
          licenseNb: data.licenseNb,
          phone: data.phone || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      });

      return profile;
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_DOCTOR',
      resource: 'DoctorProfile',
      details: {
        doctorId: result.id,
        licenseNb: result.licenseNb,
        name: `Dr. ${result.firstName} ${result.lastName}`,
        email: result.user.email,
      },
      ipAddress: (req.ip as string) || null,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur createAdminDoctor:', error);
    res.status(500).json({ message: 'Erreur lors de la création du médecin' });
  }
};

export const updateAdminDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const data = req.body;

    const existing = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Médecin non trouvé' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      let isAct = existing.user.isActive;
      if (data.isActive !== undefined) {
        const u = await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: data.isActive },
        });
        isAct = u.isActive;
      }

      const p = await tx.doctorProfile.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.specialty !== undefined && { specialty: data.specialty }),
          ...(data.phone !== undefined && { phone: data.phone }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      });

      return p;
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_DOCTOR',
      resource: 'DoctorProfile',
      details: {
        doctorId: id,
        name: `Dr. ${updated.firstName} ${updated.lastName}`,
        isActive: updated.user.isActive,
      },
      ipAddress: (req.ip as string) || null,
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateAdminDoctor:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du médecin' });
  }
};
