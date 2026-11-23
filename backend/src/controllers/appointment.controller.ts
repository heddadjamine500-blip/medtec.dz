import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, patientId, status } = req.query;
    const user = req.user;

    const where: any = {};
    if (status) where.status = String(status);

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
    } else if (user?.role === 'ADMIN') {
      if (doctorId) where.doctorId = String(doctorId);
      if (patientId) where.patientId = String(patientId);
    } else {
      // In case another role or guest
      if (doctorId) where.doctorId = String(doctorId);
      if (patientId) where.patientId = String(patientId);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          include: {
            user: { select: { email: true } },
          },
        },
        patient: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Erreur getAppointments:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, date, status = 'CONFIRMED' } = req.body;
    let { patientId } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: 'Non authentifié' });
      return;
    }

    if (user.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({
        where: { userId: user.id },
      });
      if (!patient) {
        res.status(400).json({ message: 'Profil patient introuvable pour cet utilisateur' });
        return;
      }
      patientId = patient.id;
    } else if (user.role === 'ADMIN') {
      if (!patientId) {
        res.status(400).json({ message: 'Identifiant patient requis' });
        return;
      }
    } else {
      res.status(403).json({ message: 'Action non autorisée pour ce rôle' });
      return;
    }

    if (!doctorId || !date) {
      res.status(400).json({ message: 'Médecin et date requis' });
      return;
    }

    // Verify doctor exists
    const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      res.status(404).json({ message: 'Médecin introuvable' });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date: new Date(date),
        status,
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Erreur createAppointment:', error);
    res.status(500).json({ message: 'Erreur lors de la création du rendez-vous' });
  }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const user = req.user;

    if (!id || !status) {
      res.status(400).json({ message: 'ID et statut requis' });
      return;
    }

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true, patient: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Rendez-vous introuvable' });
      return;
    }

    // Check permissions
    if (user?.role === 'DOCTOR' && existing.doctor.userId !== user.id) {
      res.status(403).json({ message: 'Non autorisé à modifier ce rendez-vous' });
      return;
    }
    if (user?.role === 'PATIENT' && existing.patient.userId !== user.id) {
      res.status(403).json({ message: 'Non autorisé à modifier ce rendez-vous' });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        doctor: true,
        patient: true,
      },
    });

    res.json(appointment);
  } catch (error) {
    console.error('Erreur updateAppointmentStatus:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du rendez-vous' });
  }
};

export const deleteAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const user = req.user;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true, patient: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Rendez-vous introuvable' });
      return;
    }

    if (user?.role === 'PATIENT' && existing.patient.userId !== user.id) {
      res.status(403).json({ message: 'Non autorisé à annuler ce rendez-vous' });
      return;
    }
    if (user?.role === 'DOCTOR' && existing.doctor.userId !== user.id) {
      res.status(403).json({ message: 'Non autorisé à annuler ce rendez-vous' });
      return;
    }

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({ message: 'Rendez-vous annulé avec succès' });
  } catch (error) {
    console.error('Erreur deleteAppointment:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};
