import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { db } from '../../../src/lib/db';
import { clearDbData, seedTestUser } from '../../test-utils';
import {
  POST as commentPost,
  GET as commentGet,
} from '../../../src/app/api/shared/[token]/comments/route';
import { NextRequest } from 'next/server';

/* eslint-disable @typescript-eslint/no-explicit-any */
describe('Shared Comments API', () => {
  let testUser: any;
  let testTemplate: any;
  let testDocument: any;
  let shareTokenView: string;
  let shareTokenComment: string;

  beforeAll(async () => {
    await clearDbData();
    testUser = await seedTestUser();

    // Create a test category and template
    const category = await db.category.create({
      data: {
        slug: 'test-category',
        nameHe: 'Test',
        nameAr: 'Test',
        nameEn: 'Test',
        nameRu: 'Test',
      },
    });

    testTemplate = await db.template.create({
      data: {
        slug: 'test-template',
        nameHe: 'Test',
        nameAr: 'Test',
        nameEn: 'Test',
        nameRu: 'Test',
        categoryId: category.id,
        definition: { type: 'v1', wizardFields: [], documentBody: { en: 'Hello World' } },
      },
    });

    testDocument = await db.document.create({
      data: {
        title: 'Test Doc',
        userId: testUser.id,
        templateId: testTemplate.id,
        templateVersion: 1,
        wizardData: {},
        renderedBody: 'Hello World',
        status: 'DRAFT',
        locale: 'en',
      },
    });
  });

  afterAll(async () => {
    await clearDbData();
  });

  beforeAll(async () => {
    // Create share links directly to bypass NextAuth mocking for now
    const viewShare = await db.documentShare.create({
      data: {
        documentId: testDocument.id,
        createdBy: testUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        permission: 'VIEW',
      },
    });
    shareTokenView = viewShare.token;

    const commentShare = await db.documentShare.create({
      data: {
        documentId: testDocument.id,
        createdBy: testUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        permission: 'COMMENT',
      },
    });
    shareTokenComment = commentShare.token;
  });

  describe('POST /api/shared/[token]/comments', () => {
    test('should reject comment if token only has VIEW permission', async () => {
      const req = new NextRequest(`http://localhost:3000/api/shared/${shareTokenView}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: 'Tester', content: 'Nice clause' }),
      });
      const res = await commentPost(req, { params: Promise.resolve({ token: shareTokenView }) });
      expect(res.status).toBe(403);
    });

    test('should accept comment if token has COMMENT permission', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/shared/${shareTokenComment}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authorName: 'Tester', content: 'Nice clause', quote: 'Hello' }),
        },
      );
      const res = await commentPost(req, { params: Promise.resolve({ token: shareTokenComment }) });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.content).toBe('Nice clause');
      expect(data.data.authorName).toBe('Tester');
    });

    test('should fail validation without authorName', async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/shared/${shareTokenComment}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: 'Nice clause' }),
        },
      );
      const res = await commentPost(req, { params: Promise.resolve({ token: shareTokenComment }) });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/shared/[token]/comments', () => {
    test('should return list of comments', async () => {
      const req = new NextRequest(`http://localhost:3000/api/shared/${shareTokenView}/comments`, {
        method: 'GET',
      });
      const res = await commentGet(req, { params: Promise.resolve({ token: shareTokenView }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0].content).toBe('Nice clause');
    });
  });
});
