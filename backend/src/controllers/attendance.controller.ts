import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logAudit } from '../services/audit.service';

const formatDateString = (d: Date): string => {
  return d.toISOString().split('T')[0];
};

const parseTimeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const clockIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const today = formatDateString(now);

    const openAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOutAt: null,
      },
    });

    if (openAttendance) {
      res.status(409).json({
        message: 'Vous avez déjà un pointage en cours non clôturé.',
        attendance: openAttendance,
      });
      return;
    }

    const weekday = now.getDay();
    const schedule = await prisma.workSchedule.findUnique({
      where: {
        userId_weekday: { userId, weekday },
      },
    });

    let status = 'PRESENT';
    if (schedule && schedule.isActive) {
      const scheduledMinutes = parseTimeToMinutes(schedule.startTime);
      const toleranceMinutes = 10;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (currentMinutes > scheduledMinutes + toleranceMinutes) {
        status = 'LATE';
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: today,
        checkInAt: now,
        source: 'SELF',
        status,
      },
    });

    res.status(201).json(attendance);
  } catch (error) {
    console.error('Erreur clockIn:', error);
    res.status(500).json({ message: 'Erreur lors du pointage d’arrivée' });
  }
};

export const clockOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const openAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOutAt: null,
      },
      orderBy: { checkInAt: 'desc' },
    });

    if (!openAttendance) {
      res.status(409).json({ message: 'Aucun pointage ouvert trouvé pour cet utilisateur.' });
      return;
    }

    const updated = await prisma.attendance.update({
      where: { id: openAttendance.id },
      data: {
        checkOutAt: now,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur clockOut:', error);
    res.status(500).json({ message: 'Erreur lors du pointage de départ' });
  }
};

export const getMyAttendanceStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const today = formatDateString(new Date());

    const openAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        checkOutAt: null,
      },
      orderBy: { checkInAt: 'desc' },
    });

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        userId,
        date: today,
      },
      orderBy: { checkInAt: 'asc' },
    });

    res.json({
      serverTime: new Date(),
      isClockedIn: !!openAttendance,
      currentAttendance: openAttendance,
      todayRecords: todayAttendances,
    });
  } catch (error) {
    console.error('Erreur getMyAttendanceStatus:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du statut de pointage' });
  }
};

export const getMyAttendances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate, page = '1', pageSize = '30' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 30));
    const skip = (pageNum - 1) * limit;

    const where: any = { userId };
    if (startDate && typeof startDate === 'string') {
      where.date = { ...where.date, gte: startDate };
    }
    if (endDate && typeof endDate === 'string') {
      where.date = { ...where.date, lte: endDate };
    }

    const [total, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInAt: 'desc' },
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      attendances,
    });
  } catch (error) {
    console.error('Erreur getMyAttendances:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de votre historique' });
  }
};

// ==================== ADMIN ENDPOINTS ====================

export const getAdminAttendances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, role, status, startDate, endDate, page = '1', pageSize = '30' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 30));
    const skip = (pageNum - 1) * limit;

    const where: any = {};

    if (userId && typeof userId === 'string' && userId !== 'ALL') {
      where.userId = userId;
    }
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }
    if (role && typeof role === 'string' && role !== 'ALL') {
      where.user = { role };
    }
    if (startDate && typeof startDate === 'string') {
      where.date = { ...where.date, gte: startDate };
    }
    if (endDate && typeof endDate === 'string') {
      where.date = { ...where.date, lte: endDate };
    }

    const [total, attendances] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkInAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              doctorInfo: { select: { firstName: true, lastName: true, specialty: true } },
              employeeInfo: { select: { firstName: true, lastName: true, jobTitle: true, employeeCode: true } },
            },
          },
          correctedByUser: {
            select: { id: true, email: true },
          },
        },
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      attendances,
    });
  } catch (error) {
    console.error('Erreur getAdminAttendances:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des présences' });
  }
};

export const correctionSchema = z.object({
  attendanceId: z.string().optional(),
  userId: z.string().min(1, "L'utilisateur est requis"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date requis: YYYY-MM-DD'),
  checkInAt: z.string().datetime('Format de date invalide'),
  checkOutAt: z.string().datetime('Format de date invalide').nullable().optional(),
  status: z.enum(['PRESENT', 'LATE', 'ABSENT', 'LEAVE']),
  note: z.string().min(1, 'La note de justification est obligatoire pour toute correction'),
});

export const correctAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const adminId = req.user!.id;

    if (data.attendanceId) {
      const existing = await prisma.attendance.findUnique({
        where: { id: data.attendanceId },
      });

      if (!existing) {
        res.status(404).json({ message: 'Pointage non trouvé' });
        return;
      }

      const updated = await prisma.attendance.update({
        where: { id: data.attendanceId },
        data: {
          date: data.date,
          checkInAt: new Date(data.checkInAt),
          checkOutAt: data.checkOutAt ? new Date(data.checkOutAt) : null,
          status: data.status,
          note: data.note,
          correctedByUserId: adminId,
          source: 'ADMIN',
        },
      });

      await logAudit({
        userId: adminId,
        action: 'CORRECT_ATTENDANCE',
        resource: 'Attendance',
        details: {
          attendanceId: data.attendanceId,
          targetUserId: existing.userId,
          previous: {
            checkInAt: existing.checkInAt,
            checkOutAt: existing.checkOutAt,
            status: existing.status,
            note: existing.note,
          },
          updated: {
            checkInAt: updated.checkInAt,
            checkOutAt: updated.checkOutAt,
            status: updated.status,
            note: updated.note,
          },
          justification: data.note,
        },
        ipAddress: (req.ip as string) || null,
      });

      res.json(updated);
    } else {
      const created = await prisma.attendance.create({
        data: {
          userId: data.userId,
          date: data.date,
          checkInAt: new Date(data.checkInAt),
          checkOutAt: data.checkOutAt ? new Date(data.checkOutAt) : null,
          status: data.status,
          note: data.note,
          correctedByUserId: adminId,
          source: 'ADMIN',
        },
      });

      await logAudit({
        userId: adminId,
        action: 'MANUAL_CREATE_ATTENDANCE',
        resource: 'Attendance',
        details: {
          attendanceId: created.id,
          targetUserId: data.userId,
          created,
          justification: data.note,
        },
        ipAddress: (req.ip as string) || null,
      });

      res.status(201).json(created);
    }
  } catch (error) {
    console.error('Erreur correctAttendance:', error);
    res.status(500).json({ message: 'Erreur lors de la correction du pointage' });
  }
};

export const markAbsenceSchema = z.object({
  userId: z.string().min(1, "L'utilisateur est requis"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date requis: YYYY-MM-DD'),
  status: z.enum(['ABSENT', 'LEAVE']),
  note: z.string().min(1, 'Une note de justification est requise'),
});

export const markAbsence = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, date, status, note } = req.body;
    const adminId = req.user!.id;

    const startOfDay = new Date(`${date}T00:00:00.000Z`);

    const record = await prisma.attendance.create({
      data: {
        userId,
        date,
        checkInAt: startOfDay,
        checkOutAt: startOfDay,
        status,
        note,
        source: 'ADMIN',
        correctedByUserId: adminId,
      },
    });

    await logAudit({
      userId: adminId,
      action: 'MARK_ABSENCE',
      resource: 'Attendance',
      details: {
        attendanceId: record.id,
        targetUserId: userId,
        date,
        status,
        justification: note,
      },
      ipAddress: (req.ip as string) || null,
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Erreur markAbsence:', error);
    res.status(500).json({ message: "Erreur lors de l'enregistrement de l'absence" });
  }
};

export const getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, role } = req.query;

    const where: any = {};
    if (startDate && typeof startDate === 'string') {
      where.date = { ...where.date, gte: startDate };
    }
    if (endDate && typeof endDate === 'string') {
      where.date = { ...where.date, lte: endDate };
    }
    if (role && typeof role === 'string' && role !== 'ALL') {
      where.user = { role };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            doctorInfo: { select: { firstName: true, lastName: true } },
            employeeInfo: { select: { firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
    });

    const summaryMap = new Map<string, {
      userId: string;
      email: string;
      name: string;
      role: string;
      daysPresent: number;
      lates: number;
      absences: number;
      leaves: number;
      totalMinutes: number;
    }>();

    for (const a of attendances) {
      const u = a.user;
      let name = u.email;
      if (u.doctorInfo) name = `Dr. ${u.doctorInfo.firstName} ${u.doctorInfo.lastName}`;
      else if (u.employeeInfo) name = `${u.employeeInfo.firstName} ${u.employeeInfo.lastName}`;

      if (!summaryMap.has(a.userId)) {
        summaryMap.set(a.userId, {
          userId: a.userId,
          email: u.email,
          name,
          role: u.role,
          daysPresent: 0,
          lates: 0,
          absences: 0,
          leaves: 0,
          totalMinutes: 0,
        });
      }

      const item = summaryMap.get(a.userId)!;

      if (a.status === 'PRESENT') item.daysPresent += 1;
      else if (a.status === 'LATE') {
        item.daysPresent += 1;
        item.lates += 1;
      } else if (a.status === 'ABSENT') item.absences += 1;
      else if (a.status === 'LEAVE') item.leaves += 1;

      if (a.checkInAt && a.checkOutAt) {
        const diff = (new Date(a.checkOutAt).getTime() - new Date(a.checkInAt).getTime()) / (1000 * 60);
        if (diff > 0) item.totalMinutes += Math.round(diff);
      }
    }

    const result = Array.from(summaryMap.values()).map(item => ({
      ...item,
      totalHours: (item.totalMinutes / 60).toFixed(1),
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur getAttendanceSummary:', error);
    res.status(500).json({ message: 'Erreur lors du calcul du résumé des présences' });
  }
};

export const exportAttendanceCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, role } = req.query;

    const where: any = {};
    if (startDate && typeof startDate === 'string') {
      where.date = { ...where.date, gte: startDate };
    }
    if (endDate && typeof endDate === 'string') {
      where.date = { ...where.date, lte: endDate };
    }
    if (role && typeof role === 'string' && role !== 'ALL') {
      where.user = { role };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { checkInAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            doctorInfo: { select: { firstName: true, lastName: true } },
            employeeInfo: { select: { firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
    });

    const headers = ['ID', 'Date', 'Nom', 'Email', 'Role', 'Statut', 'Arrivee', 'Depart', 'Duree_Minutes', 'Source', 'Note'];
    const rows = attendances.map(a => {
      let name = a.user.email;
      if (a.user.doctorInfo) name = `Dr. ${a.user.doctorInfo.firstName} ${a.user.doctorInfo.lastName}`;
      else if (a.user.employeeInfo) name = `${a.user.employeeInfo.firstName} ${a.user.employeeInfo.lastName}`;

      let duration = 0;
      if (a.checkInAt && a.checkOutAt) {
        duration = Math.round((new Date(a.checkOutAt).getTime() - new Date(a.checkInAt).getTime()) / (1000 * 60));
      }

      return [
        `"${a.id}"`,
        `"${a.date}"`,
        `"${name.replace(/"/g, '""')}"`,
        `"${a.user.email}"`,
        `"${a.user.role}"`,
        `"${a.status}"`,
        `"${a.checkInAt.toISOString()}"`,
        `"${a.checkOutAt ? a.checkOutAt.toISOString() : ''}"`,
        duration,
        `"${a.source}"`,
        `"${(a.note || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pointages_${startDate || 'all'}_${endDate || 'all'}.csv"`);
    res.send('\uFEFF' + csvContent);
  } catch (error) {
    console.error('Erreur exportAttendanceCSV:', error);
    res.status(500).json({ message: "Erreur lors de l'exportation CSV" });
  }
};

export const getWorkSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const schedules = await prisma.workSchedule.findMany({
      where: { userId },
      orderBy: { weekday: 'asc' },
    });
    res.json(schedules);
  } catch (error) {
    console.error('Erreur getWorkSchedules:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des horaires' });
  }
};

export const updateWorkSchedulesSchema = z.object({
  schedules: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format requis HH:mm'),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format requis HH:mm'),
      isActive: z.boolean(),
    })
  ),
});

export const updateWorkSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.params.userId);
    const { schedules } = req.body;
    const adminId = req.user!.id;

    await prisma.$transaction(async (tx) => {
      for (const s of schedules) {
        await tx.workSchedule.upsert({
          where: {
            userId_weekday: { userId, weekday: s.weekday },
          },
          update: {
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: s.isActive,
          },
          create: {
            userId,
            weekday: s.weekday,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: s.isActive,
          },
        });
      }
    });

    await logAudit({
      userId: adminId,
      action: 'UPDATE_WORK_SCHEDULES',
      resource: 'WorkSchedule',
      details: { targetUserId: userId, schedulesCount: schedules.length },
      ipAddress: (req.ip as string) || null,
    });

    const updated = await prisma.workSchedule.findMany({
      where: { userId },
      orderBy: { weekday: 'asc' },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateWorkSchedules:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour des horaires' });
  }
};
