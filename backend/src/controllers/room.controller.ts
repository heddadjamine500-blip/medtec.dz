import { Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logAudit } from '../services/audit.service';

export const roomSchema = z.object({
  name: z.string().min(1, 'Le nom de la salle est obligatoire'),
  type: z.enum(['CONSULTATION', 'OPERATING', 'WARD', 'EMERGENCY', 'ICU', 'LAB', 'OTHER']).default('CONSULTATION'),
  floor: z.number().int().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  status: z.enum(['AVAILABLE', 'MAINTENANCE', 'CLOSED']).default('AVAILABLE'),
  notes: z.string().nullable().optional(),
});

export const updateRoomSchema = roomSchema.partial();

export const roomBookingSchema = z.object({
  roomId: z.string().min(1, 'La salle est obligatoire'),
  startAt: z.string().datetime('Format de date invalide pour startAt'),
  endAt: z.string().datetime('Format de date invalide pour endAt'),
  purpose: z.string().min(1, 'Le motif de la réservation est obligatoire'),
  doctorId: z.string().nullable().optional(),
});

export const getRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, status } = req.query;
    const now = new Date();

    const where: any = {};
    if (type && typeof type === 'string' && type !== 'ALL') {
      where.type = type;
    }
    if (status && typeof status === 'string' && status !== 'ALL' && status !== 'OCCUPIED') {
      where.status = status;
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        bookings: {
          where: {
            status: 'SCHEDULED',
            startAt: { lte: now },
            endAt: { gte: now },
          },
          include: {
            doctor: { select: { firstName: true, lastName: true, specialty: true } },
            bookedByUser: { select: { email: true } },
          },
          take: 1,
        },
      },
    });

    const result = rooms.map(room => {
      const isOccupied = room.bookings.length > 0;
      const displayStatus = room.status === 'AVAILABLE' && isOccupied ? 'OCCUPIED' : room.status;
      return {
        ...room,
        displayStatus,
        currentBooking: room.bookings[0] || null,
      };
    });

    const filteredResult = status === 'OCCUPIED'
      ? result.filter(r => r.displayStatus === 'OCCUPIED')
      : result;

    res.json(filteredResult);
  } catch (error) {
    console.error('Erreur getRooms:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des salles' });
  }
};

export const getRoomById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { startAt: 'desc' },
          take: 20,
          include: {
            doctor: { select: { firstName: true, lastName: true, specialty: true } },
            bookedByUser: { select: { email: true } },
          },
        },
      },
    });

    if (!room) {
      res.status(404).json({ message: 'Salle non trouvée' });
      return;
    }

    const now = new Date();
    const isOccupied = (room.bookings || []).some((b: any) => b.status === 'SCHEDULED' && b.startAt <= now && b.endAt >= now);
    const displayStatus = room.status === 'AVAILABLE' && isOccupied ? 'OCCUPIED' : room.status;

    res.json({ ...room, displayStatus });
  } catch (error) {
    console.error('Erreur getRoomById:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la salle' });
  }
};

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;

    const existing = await prisma.room.findUnique({ where: { name: data.name } });
    if (existing) {
      res.status(409).json({ message: `Une salle nommée "${data.name}" existe déjà.` });
      return;
    }

    const room = await prisma.room.create({
      data: {
        name: data.name,
        type: data.type || 'CONSULTATION',
        floor: data.floor !== undefined ? data.floor : null,
        capacity: data.capacity !== undefined ? data.capacity : null,
        status: data.status || 'AVAILABLE',
        notes: data.notes || null,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_ROOM',
      resource: 'Room',
      details: { roomId: room.id, name: room.name, type: room.type },
      ipAddress: (req.ip as string) || null,
    });

    res.status(201).json(room);
  } catch (error) {
    console.error('Erreur createRoom:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la salle' });
  }
};

export const updateRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const data = req.body;

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Salle non trouvée' });
      return;
    }

    if (data.name && data.name !== existing.name) {
      const conflict = await prisma.room.findUnique({ where: { name: data.name } });
      if (conflict) {
        res.status(409).json({ message: `Une autre salle porte déjà le nom "${data.name}".` });
        return;
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.floor !== undefined && { floor: data.floor }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_ROOM',
      resource: 'Room',
      details: { roomId: updated.id, previous: existing, updated },
      ipAddress: (req.ip as string) || null,
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateRoom:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la salle' });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Salle non trouvée' });
      return;
    }

    const now = new Date();
    const futureBookings = await prisma.roomBooking.count({
      where: {
        roomId: id,
        status: { not: 'CANCELLED' },
        endAt: { gte: now },
      },
    });

    if (futureBookings > 0) {
      res.status(409).json({
        message: 'Impossible de supprimer cette salle car elle possède des réservations en cours ou futures.',
      });
      return;
    }

    await prisma.room.delete({ where: { id } });

    await logAudit({
      userId: req.user?.id,
      action: 'DELETE_ROOM',
      resource: 'Room',
      details: { roomId: id, name: existing.name },
      ipAddress: (req.ip as string) || null,
    });

    res.json({ message: 'Salle supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteRoom:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la salle' });
  }
};

export const getRoomBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId, date, page = '1', pageSize = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string, 10) || 50));
    const skip = (pageNum - 1) * limit;

    const where: any = {};
    if (roomId && typeof roomId === 'string') {
      where.roomId = roomId;
    }

    if (date && typeof date === 'string') {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.OR = [
        {
          startAt: { gte: startOfDay, lte: endOfDay },
        },
        {
          endAt: { gte: startOfDay, lte: endOfDay },
        },
        {
          startAt: { lte: startOfDay },
          endAt: { gte: endOfDay },
        },
      ];
    }

    const [total, bookings] = await Promise.all([
      prisma.roomBooking.count({ where }),
      prisma.roomBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startAt: 'asc' },
        include: {
          room: { select: { id: true, name: true, type: true } },
          doctor: { select: { id: true, firstName: true, lastName: true, specialty: true } },
          bookedByUser: { select: { id: true, email: true, role: true } },
        },
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
      bookings,
    });
  } catch (error) {
    console.error('Erreur getRoomBookings:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des réservations' });
  }
};

export const createRoomBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId, startAt, endAt, purpose, doctorId } = req.body;
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (startDate >= endDate) {
      res.status(400).json({ message: "L'heure de début doit être strictement antérieure à l'heure de fin" });
      return;
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      res.status(404).json({ message: 'Salle non trouvée' });
      return;
    }

    if (room.status !== 'AVAILABLE') {
      res.status(409).json({
        message: `La salle "${room.name}" n'est pas disponible pour réservation (statut actuel: ${room.status}).`,
      });
      return;
    }

    const overlapping = await prisma.roomBooking.findFirst({
      where: {
        roomId,
        status: { not: 'CANCELLED' },
        startAt: { lt: endDate },
        endAt: { gt: startDate },
      },
    });

    if (overlapping) {
      res.status(409).json({
        message: 'Un créneau de réservation chevauche déjà cette période pour cette salle.',
      });
      return;
    }

    const booking = await prisma.roomBooking.create({
      data: {
        roomId,
        startAt: startDate,
        endAt: endDate,
        purpose,
        bookedByUserId: req.user!.id,
        doctorId: doctorId || null,
        status: 'SCHEDULED',
      },
      include: {
        room: true,
        doctor: true,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_ROOM_BOOKING',
      resource: 'RoomBooking',
      details: {
        bookingId: booking.id,
        roomId: booking.roomId,
        roomName: room.name,
        startAt: booking.startAt,
        endAt: booking.endAt,
      },
      ipAddress: (req.ip as string) || null,
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Erreur createRoomBooking:', error);
    res.status(500).json({ message: 'Erreur lors de la réservation de la salle' });
  }
};

export const cancelRoomBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const booking = await prisma.roomBooking.findUnique({
      where: { id },
      include: { room: true },
    });

    if (!booking) {
      res.status(404).json({ message: 'Réservation non trouvée' });
      return;
    }

    if (booking.status === 'CANCELLED') {
      res.status(400).json({ message: 'Cette réservation est déjà annulée' });
      return;
    }

    const updated = await prisma.roomBooking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { room: true },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CANCEL_ROOM_BOOKING',
      resource: 'RoomBooking',
      details: { bookingId: id, roomId: booking.roomId, roomName: updated.room?.name },
      ipAddress: (req.ip as string) || null,
    });

    res.json({ message: 'Réservation annulée avec succès', booking: updated });
  } catch (error) {
    console.error('Erreur cancelRoomBooking:', error);
    res.status(500).json({ message: "Erreur lors de l'annulation de la réservation" });
  }
};
