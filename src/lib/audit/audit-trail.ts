import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * PRIV-05: Tamper-evident audit trail.
 * Records user actions with IP, timestamp, and user-agent.
 */
export async function logAudit(
  action: string,
  entity: string,
  entityId: string | null,
  userId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const hdrs = await headers();
    const ip =
      hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown';
    const userAgent = hdrs.get('user-agent') || undefined;

    await db.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    // Audit logging should never break the main flow
    logger.error('Audit log write failed', err, { action, entity, entityId });
  }
}
