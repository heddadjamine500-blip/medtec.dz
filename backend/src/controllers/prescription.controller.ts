import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getPrescriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, doctorId } = req.query;
    const user = req.user;

    const where: any = {};

    if (user?.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (!patient) {
        res.status(404).json({ message: 'Profil patient introuvable' });
        return;
      }
      where.patientId = patient.id;
    } else if (user?.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (!doctor) {
        res.status(404).json({ message: 'Profil médecin introuvable' });
        return;
      }
      where.doctorId = doctor.id;
    } else if (user?.role === 'ADMIN' || user?.role === 'PHARMACY') {
      if (patientId) where.patientId = String(patientId);
      if (doctorId) where.doctorId = String(doctorId);
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        doctor: true,
        patient: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(prescriptions);
  } catch (error) {
    console.error('Erreur getPrescriptions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des ordonnances' });
  }
};

export const createPrescription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, notes, items = [] } = req.body;
    let { doctorId } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!doctor) {
        res.status(400).json({ message: 'Profil médecin introuvable' });
        return;
      }
      doctorId = doctor.id;
    } else if (user.role === 'ADMIN') {
      if (!doctorId) {
        res.status(400).json({ message: 'Identifiant médecin requis' });
        return;
      }
    } else {
      res.status(403).json({ message: 'Seul un médecin peut émettre une ordonnance' });
      return;
    }

    if (!patientId || !items.length) {
      res.status(400).json({ message: 'Patient et au moins un médicament requis' });
      return;
    }

    // Verify patient exists
    const patient = await prisma.patientProfile.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ message: 'Patient introuvable' });
      return;
    }

    const prescription = await prisma.prescription.create({
      data: {
        doctorId,
        patientId,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            medicationName: item.medicationName || 'Médicament',
            dosage: item.dosage || '1 comprimé par jour',
            duration: item.duration || '7 jours',
          })),
        },
      },
      include: {
        doctor: true,
        patient: true,
        items: true,
      },
    });

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Erreur createPrescription:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'ordonnance' });
  }
};

export const getPrescriptionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const user = req.user;

    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        doctor: true,
        patient: true,
        items: true,
      },
    });

    if (!prescription) {
      res.status(404).json({ message: 'Ordonnance introuvable' });
      return;
    }

    // Confidentiality check
    if (user?.role === 'PATIENT' && prescription.patient.userId !== user.id) {
      res.status(403).json({ message: 'Accès non autorisé à cette ordonnance' });
      return;
    }
    if (user?.role === 'DOCTOR' && prescription.doctor.userId !== user.id) {
      res.status(403).json({ message: 'Accès non autorisé à cette ordonnance' });
      return;
    }

    res.json(prescription);
  } catch (error) {
    console.error('Erreur getPrescriptionById:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
