import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logAudit } from '../services/audit.service';

export const updatePatientAdminSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  birthDate: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const getAdminPatients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, page = '1', pageSize = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
    const skip = (pageNum - 1) * limit;

    const where: any = {};

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
        { phone: { contains: q } },
        { user: { email: { contains: q } } },
      ];
    }

    // STRICT: Only administrative fields selected. NEVER include consultations, prescriptions, imagings!
    const [total, patients] = await Promise.all([
      prisma.patientProfile.count({ where }),
      prisma.patientProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastName: 'asc' },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          birthDate: true,
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      patients,
    });
  } catch (error) {
    console.error('Erreur getAdminPatients:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération administrative des patients' });
  }
};

export const getAdminPatientById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    // STRICT: Only administrative fields selected. No medical history!
    const patient = await prisma.patientProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        birthDate: true,
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

    if (!patient) {
      res.status(404).json({ message: 'Patient non trouvé' });
      return;
    }

    res.json(patient);
  } catch (error) {
    console.error('Erreur getAdminPatientById:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du patient' });
  }
};

export const updateAdminPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const data = req.body;

    const existing = await prisma.patientProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Patient non trouvé' });
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

      const p = await tx.patientProfile.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.birthDate !== undefined && { birthDate: data.birthDate ? new Date(data.birthDate) : null }),
        },
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          birthDate: true,
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
      action: 'UPDATE_PATIENT_ADMIN',
      resource: 'PatientProfile',
      details: {
        patientId: id,
        name: `${updated.firstName} ${updated.lastName}`,
        isActive: updated.user.isActive,
      },
      ipAddress: (req.ip as string) || null,
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateAdminPatient:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour administrative du patient' });
  }
};
