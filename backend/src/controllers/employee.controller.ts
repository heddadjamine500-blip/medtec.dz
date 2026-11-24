import { Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logAudit } from '../services/audit.service';

export const createEmployeeSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  employeeCode: z.string().min(1, "Le matricule d'employé est requis"),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  jobTitle: z.enum([
    'NURSE',
    'ANESTHESIOLOGIST',
    'RECEPTIONIST',
    'TECHNICIAN',
    'PHARMACIST_ASSISTANT',
    'SECURITY',
    'CLEANING',
    'ADMIN_STAFF',
    'OTHER'
  ]),
  department: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  hireDate: z.string().datetime().nullable().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']).default('ACTIVE'),
  notes: z.string().nullable().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  jobTitle: z.enum([
    'NURSE',
    'ANESTHESIOLOGIST',
    'RECEPTIONIST',
    'TECHNICIAN',
    'PHARMACIST_ASSISTANT',
    'SECURITY',
    'CLEANING',
    'ADMIN_STAFF',
    'OTHER'
  ]).optional(),
  department: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  hireDate: z.string().datetime().nullable().optional(),
  status: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']).optional(),
  notes: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, jobTitle, department, status, page = '1', pageSize = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 20));
    const skip = (pageNum - 1) * limit;

    const where: any = {};

    if (jobTitle && typeof jobTitle === 'string' && jobTitle !== 'ALL') {
      where.jobTitle = jobTitle;
    }
    if (department && typeof department === 'string' && department !== 'ALL') {
      where.department = department;
    }
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { employeeCode: { contains: q } },
        { phone: { contains: q } },
        { user: { email: { contains: q } } },
      ];
    }

    const [total, employees] = await Promise.all([
      prisma.employeeProfile.count({ where }),
      prisma.employeeProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
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
      employees,
    });
  } catch (error) {
    console.error('Erreur getEmployees:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des employés' });
  }
};

export const getEmployeeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const employee = await prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            attendances: {
              take: 30,
              orderBy: { date: 'desc' },
            },
            workSchedules: true,
          },
        },
      },
    });

    if (!employee) {
      res.status(404).json({ message: 'Employé non trouvé' });
      return;
    }

    res.json(employee);
  } catch (error) {
    console.error('Erreur getEmployeeById:', error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'employé" });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      res.status(409).json({ message: 'Un utilisateur avec cette adresse email existe déjà.' });
      return;
    }

    const existingCode = await prisma.employeeProfile.findUnique({
      where: { employeeCode: data.employeeCode },
    });
    if (existingCode) {
      res.status(409).json({ message: `Le matricule employé "${data.employeeCode}" est déjà attribué.` });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: passwordHash,
          role: 'EMPLOYEE',
          isActive: data.status !== 'TERMINATED',
        },
      });

      const profile = await tx.employeeProfile.create({
        data: {
          userId: user.id,
          employeeCode: data.employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          jobTitle: data.jobTitle,
          department: data.department || null,
          phone: data.phone || null,
          hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
          status: data.status || 'ACTIVE',
          notes: data.notes || null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
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
      action: 'CREATE_EMPLOYEE',
      resource: 'EmployeeProfile',
      details: {
        employeeId: result.id,
        employeeCode: result.employeeCode,
        name: `${result.firstName} ${result.lastName}`,
        email: result.user.email,
      },
      ipAddress: (req.ip as string) || null,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur createEmployee:', error);
    res.status(500).json({ message: "Erreur lors de la création de l'employé" });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const data = req.body;

    const existing = await prisma.employeeProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Employé non trouvé' });
      return;
    }

    const willBeTerminated = data.status === 'TERMINATED';
    const newIsActive = willBeTerminated ? false : (data.isActive !== undefined ? data.isActive : existing.user.isActive);

    const updated = await prisma.$transaction(async (tx) => {
      if (data.isActive !== undefined || willBeTerminated) {
        await tx.user.update({
          where: { id: existing.userId },
          data: { isActive: newIsActive },
        });
      }

      const resEmp = await tx.employeeProfile.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
          ...(data.department !== undefined && { department: data.department }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.hireDate !== undefined && { hireDate: data.hireDate ? new Date(data.hireDate) : null }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      });

      return resEmp;
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_EMPLOYEE',
      resource: 'EmployeeProfile',
      details: {
        employeeId: id,
        previousStatus: existing.status,
        newStatus: updated.status,
        isActive: newIsActive,
      },
      ipAddress: (req.ip as string) || null,
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateEmployee:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'employé" });
  }
};
