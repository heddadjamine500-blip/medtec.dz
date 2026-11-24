import { Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const where: any = {};

    if (user?.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacyProfile.findUnique({
        where: { userId: user.id },
      });
      if (!pharmacy) {
        res.json([]);
        return;
      }
      where.pharmacyId = pharmacy.id;
    } else if (req.query.pharmacyId) {
      where.pharmacyId = String(req.query.pharmacyId);
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        pharmacy: true,
      },
      orderBy: { stock: 'asc' },
    });

    const now = new Date();
    const itemsWithStatus = items.map((item) => {
      const isExpired = item.expiryDate ? new Date(item.expiryDate) < now : false;
      const isExpiringSoon = item.expiryDate
        ? new Date(item.expiryDate).getTime() - now.getTime() < 30 * 24 * 3600 * 1000 && !isExpired
        : false;

      return {
        ...item,
        statusLabel: item.stock < 10 ? 'Critique' : item.stock < 20 ? 'Faible' : 'Normal',
        statusColor: item.stock < 10 ? 'red' : item.stock < 20 ? 'amber' : 'emerald',
        isExpired,
        isExpiringSoon,
      };
    });

    res.json(itemsWithStatus);
  } catch (error) {
    console.error('Erreur getInventory:', error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'inventaire" });
  }
};

export const addInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, stock = 0, price = 0, supplier, barcode, expiryDate } = req.body;
    const user = req.user;

    if (!name || price === undefined) {
      res.status(400).json({ message: 'Nom et prix requis' });
      return;
    }

    let pharmacyId: string | undefined;

    if (user?.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacyProfile.findUnique({
        where: { userId: user.id },
      });
      if (!pharmacy) {
        res.status(400).json({ message: 'Profil pharmacie introuvable' });
        return;
      }
      pharmacyId = pharmacy.id;
    } else if (user?.role === 'ADMIN') {
      const firstPharmacy = await prisma.pharmacyProfile.findFirst();
      if (!firstPharmacy) {
        res.status(400).json({ message: 'Aucune pharmacie enregistrée' });
        return;
      }
      pharmacyId = req.body.pharmacyId || firstPharmacy.id;
    } else {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    if (!pharmacyId) {
      res.status(400).json({ message: 'Identifiant pharmacie manquant' });
      return;
    }

    const initialStock = Math.max(0, parseInt(stock, 10) || 0);

    const item = await prisma.inventoryItem.create({
      data: {
        pharmacyId,
        name,
        description: description || null,
        stock: initialStock,
        price: Math.max(0, parseFloat(price) || 0),
        supplier: supplier || 'Laboratoire',
        barcode: barcode || `BC-${Date.now()}`,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        ...(initialStock > 0 && {
          stockMovements: {
            create: {
              quantity: initialStock,
              type: 'ENTRY',
              reason: 'Stock initial à la création',
            },
          },
        }),
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Erreur addInventoryItem:', error);
    res.status(500).json({ message: "Erreur lors de l'ajout du médicament" });
  }
};

export const updateInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, description, price, supplier, barcode, expiryDate } = req.body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Médicament introuvable' });
      return;
    }

    if (req.user?.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacyProfile.findUnique({ where: { userId: req.user.id } });
      if (!pharmacy || existing.pharmacyId !== pharmacy.id) {
        res.status(403).json({ message: 'Action non autorisée sur cet article' });
        return;
      }
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Math.max(0, parseFloat(price)) }),
        ...(supplier !== undefined && { supplier }),
        ...(barcode !== undefined && { barcode }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateInventoryItem:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du médicament' });
  }
};

export const deleteInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Médicament introuvable' });
      return;
    }

    if (req.user?.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacyProfile.findUnique({ where: { userId: req.user.id } });
      if (!pharmacy || existing.pharmacyId !== pharmacy.id) {
        res.status(403).json({ message: 'Action non autorisée sur cet article' });
        return;
      }
    }

    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ message: 'Médicament supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteInventoryItem:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

export const updateStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { delta, stock, reason } = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ message: 'Médicament introuvable' });
      return;
    }

    if (req.user?.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacyProfile.findUnique({ where: { userId: req.user.id } });
      if (!pharmacy || item.pharmacyId !== pharmacy.id) {
        res.status(403).json({ message: 'Action non autorisée sur cet article' });
        return;
      }
    }

    let newStock = item.stock;
    let movementQty = 0;

    if (delta !== undefined) {
      const deltaInt = parseInt(delta, 10);
      newStock = Math.max(0, item.stock + deltaInt);
      movementQty = newStock - item.stock;
    } else if (stock !== undefined) {
      newStock = Math.max(0, parseInt(stock, 10));
      movementQty = newStock - item.stock;
    }

    const [updated] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id },
        data: { stock: newStock },
      }),
      prisma.stockMovement.create({
        data: {
          itemId: id,
          quantity: movementQty,
          type: movementQty >= 0 ? 'ENTRY' : 'EXIT',
          reason: reason || (movementQty >= 0 ? 'Réapprovisionnement' : 'Ajustement manuel'),
        },
      }),
    ]);

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateStock:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du stock' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const where: any = {};

    if (user?.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (patient) where.patientId = patient.id;
    } else if (user?.role === 'PHARMACY') {
      const pharmacy = await prisma.pharmacyProfile.findUnique({ where: { userId: user.id } });
      if (pharmacy) where.pharmacyId = pharmacy.id;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        patient: true,
        pharmacy: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    console.error('Erreur getOrders:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    let { pharmacyId, items = [], totalPrice } = req.body;
    let patientId: string | undefined;

    if (user?.role === 'PATIENT') {
      const patient = await prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (!patient) {
        res.status(400).json({ message: 'Profil patient introuvable' });
        return;
      }
      patientId = patient.id;
    } else if (user?.role === 'ADMIN') {
      patientId = req.body.patientId;
      if (!patientId) {
        const firstPatient = await prisma.patientProfile.findFirst();
        patientId = firstPatient?.id;
      }
    } else {
      res.status(403).json({ message: 'Action non autorisée' });
      return;
    }

    if (!pharmacyId) {
      const firstPharmacy = await prisma.pharmacyProfile.findFirst();
      pharmacyId = firstPharmacy?.id;
    }

    if (!patientId || !pharmacyId) {
      res.status(400).json({ message: 'Patient et pharmacie requis' });
      return;
    }

    const resolvedItems: Array<{ productId: string; quantity: number }> = [];

    for (const item of items) {
      let prodId = item.productId;
      if (!prodId && item.medicationName) {
        const byName = await prisma.inventoryItem.findFirst({
          where: { name: { contains: item.medicationName.split(' ')[0] } },
        });
        if (byName) prodId = byName.id;
      }
      if (prodId) {
        resolvedItems.push({
          productId: prodId,
          quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
        });
      }
    }

    // If no product resolved, match with any available product from this pharmacy
    if (!resolvedItems.length) {
      const anyProd = await prisma.inventoryItem.findFirst({ where: { pharmacyId } });
      if (anyProd) {
        resolvedItems.push({
          productId: anyProd.id,
          quantity: 1,
        });
      }
    }

    const order = await prisma.order.create({
      data: {
        patientId,
        pharmacyId,
        status: 'EN ATTENTE',
        totalPrice: parseFloat(totalPrice) || 14.80,
        items: {
          create: resolvedItems,
        },
      },
      include: {
        patient: true,
        pharmacy: true,
        items: {
          include: { product: true },
        },
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Erreur createOrder:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la commande' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;

    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      res.status(404).json({ message: 'Commande introuvable' });
      return;
    }

    // If order transitions to 'DÉLIVRÉ' / 'COMPLETED', deduct stock and create stock movements safely
    if ((status === 'DÉLIVRÉ' || status === 'COMPLETED') && existingOrder.status !== status) {
      await prisma.$transaction(async (tx) => {
        for (const item of existingOrder.items) {
          const invItem = await tx.inventoryItem.findUnique({ where: { id: item.productId } });
          if (invItem) {
            const newStock = Math.max(0, invItem.stock - item.quantity);
            await tx.inventoryItem.update({
              where: { id: item.productId },
              data: { stock: newStock },
            });
            await tx.stockMovement.create({
              data: {
                itemId: item.productId,
                quantity: -item.quantity,
                type: 'DISPENSE',
                reason: `Délivrance commande #${id.substring(0, 8)}`,
              },
            });
          }
        }
        await tx.order.update({
          where: { id },
          data: { status },
        });
      });

      const updated = await prisma.order.findUnique({
        where: { id },
        include: {
          patient: true,
          items: { include: { product: true } },
        },
      });
      res.json(updated);
      return;
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        items: { include: { product: true } },
      },
    });

    res.json(order);
  } catch (error) {
    console.error('Erreur updateOrderStatus:', error);
    res.status(500).json({ message: 'Erreur lors du changement de statut' });
  }
};
