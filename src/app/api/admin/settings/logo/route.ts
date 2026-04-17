import { NextRequest } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/api/require-admin';
import { success, error } from '@/lib/api/response';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logo');
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
  'image/webp': 'webp',
};
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const settings = await db.siteSetting.findMany({
    where: { key: { in: ['logo_url', 'logo_height'] } },
  });

  return success({
    logoUrl: settings.find((s) => s.key === 'logo_url')?.value ?? '/images/logo-default.svg',
    logoHeight: parseInt(settings.find((s) => s.key === 'logo_height')?.value ?? '36', 10),
  });
}

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const logoHeightRaw = formData.get('logoHeight') as string | null;

    const logoHeight = logoHeightRaw
      ? Math.min(60, Math.max(20, parseInt(logoHeightRaw, 10) || 36))
      : null;

    let logoUrl: string | null = null;

    if (file) {
      const ext = ALLOWED_TYPES[file.type];
      if (!ext) {
        return error('Invalid file type. Allowed: PNG, JPEG, SVG, WebP', 400, 'INVALID_FILE_TYPE');
      }
      if (file.size > MAX_SIZE) {
        return error('File too large. Maximum 2MB', 400, 'FILE_TOO_LARGE');
      }

      // Delete old uploaded logo
      const oldUrl = await db.siteSetting.findUnique({
        where: { key: 'logo_url' },
      });
      if (oldUrl?.value?.startsWith('/uploads/logo/')) {
        const oldPath = path.join(process.cwd(), 'public', oldUrl.value);
        if (existsSync(oldPath)) {
          await unlink(oldPath);
        }
      }

      // Save new file with a cryptographically random filename — never trust
      // the user-supplied name or extension.
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }

      const filename = `logo-${randomUUID()}.${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      logoUrl = `/uploads/logo/${filename}`;
    }

    // Upsert settings
    if (logoUrl) {
      await db.siteSetting.upsert({
        where: { key: 'logo_url' },
        update: { value: logoUrl },
        create: { key: 'logo_url', value: logoUrl },
      });
    }

    if (logoHeight !== null) {
      await db.siteSetting.upsert({
        where: { key: 'logo_height' },
        update: { value: String(logoHeight) },
        create: { key: 'logo_height', value: String(logoHeight) },
      });
    }

    // Fetch current state
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ['logo_url', 'logo_height'] } },
    });

    return success({
      logoUrl: settings.find((s) => s.key === 'logo_url')?.value ?? '/images/logo-default.svg',
      logoHeight: parseInt(settings.find((s) => s.key === 'logo_height')?.value ?? '36', 10),
    });
  } catch {
    return error('Failed to save logo settings', 500, 'INTERNAL_ERROR');
  }
}

export async function DELETE(request: NextRequest) {
  const { error: authError } = await requireAdmin(request);
  if (authError) return authError;

  try {
    // Delete uploaded file if exists
    const logoUrlSetting = await db.siteSetting.findUnique({
      where: { key: 'logo_url' },
    });
    if (logoUrlSetting?.value?.startsWith('/uploads/logo/')) {
      const filePath = path.join(process.cwd(), 'public', logoUrlSetting.value);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }

    // Delete settings to revert to defaults
    await db.siteSetting.deleteMany({
      where: { key: { in: ['logo_url', 'logo_height'] } },
    });

    return success({
      logoUrl: '/images/logo-default.svg',
      logoHeight: 36,
    });
  } catch {
    return error('Failed to reset logo', 500, 'INTERNAL_ERROR');
  }
}
