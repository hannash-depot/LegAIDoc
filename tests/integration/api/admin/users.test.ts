/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, describe, beforeAll, afterAll, vi } from 'vitest';
import { clearDbData, seedTestAdmin, seedTestUserWithPassword } from '../../../test-utils';
import { NextRequest } from 'next/server';

let adminUser: any;
let regularUser: any;

// Mock auth to return the admin session
vi.mock('@/auth', () => ({
  auth: vi.fn(async () => ({
    user: { id: '', email: '', role: 'ADMIN' },
  })),
}));

vi.mock('@/lib/audit/audit-trail', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

const { auth } = await import('../../../../src/auth');
const { GET } = await import('../../../../src/app/api/admin/users/route');

describe('Admin Users API (/api/admin/users)', () => {
  beforeAll(async () => {
    await clearDbData();
    adminUser = await seedTestAdmin();
    regularUser = await seedTestUserWithPassword();
    // Configure auth mock with real admin user
    vi.mocked(auth).mockResolvedValue({
      user: { id: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
  });

  afterAll(async () => {
    await clearDbData();
  });

  test('should list users with pagination', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/users?page=1&pageSize=10');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items).toBeInstanceOf(Array);
    expect(body.data.items.length).toBeGreaterThanOrEqual(2);
    expect(body.data.total).toBeGreaterThanOrEqual(2);
    expect(body.data.page).toBe(1);
    expect(body.data.pageSize).toBe(10);

    // Verify user shape includes expected select fields
    const user = body.data.items[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('isActive');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('_count');
  });

  test('should filter users by role', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/users?role=ADMIN');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items.every((u: any) => u.role === 'ADMIN')).toBe(true);
  });

  test('should filter users by search term', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/users?search=testpwd');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBe(1);
    expect(body.data.items[0].email).toBe('testpwd@example.com');
  });

  test('should return 401 for unauthenticated user', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as any);
    const req = new NextRequest('http://localhost:3000/api/admin/users');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test('should return 403 for non-admin user', async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: regularUser.id, email: regularUser.email, role: 'USER' },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as any);
    const req = new NextRequest('http://localhost:3000/api/admin/users');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
