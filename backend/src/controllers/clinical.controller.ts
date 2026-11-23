import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDoctors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctors = await prisma.doctorProfile.findMany({
      include: {
        user: { select: { email: true, createdAt: true, isActive: true } },
        availabilities: true,
      },
    });
    res.json(doctors);
  } catch (error) {
    console.error('Erreur getDoctors:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des médecins' });
  }
};

export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const where: any = {};

    // If DOCTOR, get patients who have had appointments or consultations with this doctor
    if (user?.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (doctor) {
        where.OR = [
          { appointments: { some: { doctorId: doctor.id } } },
          { consultations: { some: { doctorId: doctor.id } } },
        ];
      }
    }

    const patients = await prisma.patientProfile.findMany({
      where,
      include: {
        user: { select: { email: true, createdAt: true, isActive: true } },
        appointments: {
          take: 5,
          orderBy: { date: 'desc' },
          include: { doctor: true },
        },
        prescriptions: {
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { items: true, doctor: true },
        },
        consultations: {
          take: 3,
          orderBy: { date: 'desc' },
          include: { doctor: true },
        },
      },
    });
    res.json(patients);
  } catch (error) {
    console.error('Erreur getPatients:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des patients' });
  }
};

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      totalPrescriptions,
      totalOrders,
      inventoryItems,
      recentAppointments,
    ] = await Promise.all([
      prisma.patientProfile.count(),
      prisma.doctorProfile.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.prescription.count(),
      prisma.order.count(),
      prisma.inventoryItem.findMany(),
      prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { doctor: true, patient: true },
      }),
    ]);

    const criticalStockCount = inventoryItems.filter((i) => i.stock < 10).length;
    const lowStockCount = inventoryItems.filter((i) => i.stock >= 10 && i.stock < 20).length;

    res.json({
      totalPatients,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      totalPrescriptions,
      totalOrders,
      totalInventoryItems: inventoryItems.length,
      criticalStockCount,
      lowStockCount,
      recentAppointments,
    });
  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};

// Admin Users Management
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        patientInfo: true,
        doctorInfo: true,
        pharmacyInfo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { role, isActive } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    // Soft delete: set isActive to false
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
    res.json({ message: 'Utilisateur désactivé avec succès', user: updated });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({ message: "Erreur lors de la désactivation de l'utilisateur" });
  }
};

// Consultations
export const getConsultations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { patientId } = req.query;
    const where: any = {};

    if (user?.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (patient) where.patientId = patient.id;
    } else if (user?.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (doctor) where.doctorId = doctor.id;
    }

    if (patientId) where.patientId = String(patientId);

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        doctor: true,
        patient: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json(consultations);
  } catch (error) {
    console.error('Erreur getConsultations:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des consultations' });
  }
};

export const createConsultation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { patientId, diagnosis, notes, vitalSigns, date } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    let doctorId: string;
    if (user.role === 'DOCTOR') {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId: user.id } });
      if (!doctor) {
        res.status(400).json({ message: 'Profil médecin introuvable' });
        return;
      }
      doctorId = doctor.id;
    } else if (user.role === 'ADMIN') {
      doctorId = req.body.doctorId;
      if (!doctorId) {
        res.status(400).json({ message: 'Identifiant médecin requis' });
        return;
      }
    } else {
      res.status(403).json({ message: 'Seul un médecin peut enregistrer une consultation' });
      return;
    }

    if (!patientId || !diagnosis) {
      res.status(400).json({ message: 'Patient et diagnostic requis' });
      return;
    }

    const consultation = await prisma.consultation.create({
      data: {
        doctorId,
        patientId,
        diagnosis,
        notes: notes || null,
        vitalSigns: vitalSigns || null,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    res.status(201).json(consultation);
  } catch (error) {
    console.error('Erreur createConsultation:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la consultation' });
  }
};

// Medical Imaging (Radiographies, Scanners, IRM, Échographies)
export const getImagings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { patientId } = req.query;
    const where: any = {};

    if (user?.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (!patient) {
        res.json([]);
        return;
      }
      where.patientId = patient.id;
    } else if (patientId) {
      where.patientId = String(patientId);
    }

    const imagings = await prisma.medicalImaging.findMany({
      where,
      include: {
        patient: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json(imagings);
  } catch (error) {
    console.error('Erreur getImagings:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des examens d'imagerie" });
  }
};

export const createImaging = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { title, type, date, bodyPart, facility, notes, fileUrl, fileName, fileType, patientId: targetPatientId } = req.body;

    let patientId = targetPatientId;
    if (user?.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (!patient) {
        res.status(404).json({ message: 'Profil patient introuvable' });
        return;
      }
      patientId = patient.id;
    }

    if (!patientId || !title || !fileUrl) {
      res.status(400).json({ message: "Titre, document/image et patient requis" });
      return;
    }

    const imaging = await prisma.medicalImaging.create({
      data: {
        patientId,
        title,
        type: type || 'XRAY',
        date: date ? new Date(date) : new Date(),
        bodyPart: bodyPart || null,
        facility: facility || null,
        notes: notes || null,
        fileUrl,
        fileName: fileName || null,
        fileType: fileType || null,
      },
      include: {
        patient: true,
      },
    });

    res.status(201).json(imaging);
  } catch (error) {
    console.error('Erreur createImaging:', error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement de l'examen d'imagerie" });
  }
};

export const deleteImaging = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const id = String(req.params.id);

    const existing = await prisma.medicalImaging.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Examen introuvable' });
      return;
    }

    if (user?.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (!patient || existing.patientId !== patient.id) {
        res.status(403).json({ message: 'Action non autorisée' });
        return;
      }
    }

    await prisma.medicalImaging.delete({ where: { id } });
    res.json({ message: 'Examen supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteImaging:', error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'examen" });
  }
};
