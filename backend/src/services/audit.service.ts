import prisma from '../utils/prisma';

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  resource: string;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}

export const logAudit = async (params: AuditLogParams) => {
  try {
    let detailsString: string | null = null;
    if (params.details) {
      if (typeof params.details === 'string') {
        detailsString = params.details;
      } else {
        const clean = { ...params.details };
        delete (clean as any).password;
        delete (clean as any).passwordHash;
        delete (clean as any).token;
        detailsString = JSON.stringify(clean);
      }
    }
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resource: params.resource,
        details: detailsString,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to record AuditLog:', error);
  }
};
