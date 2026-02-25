import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import type { LocalizedString } from "@/types/template";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import {
  buildRequestContext,
  logApiError,
  logApiWarn,
} from "@/lib/monitoring";

const createSchema = z.object({
  templateSlug: z.string().min(1),
  locale: z.enum(["he", "ar", "en", "ru"]).default("he"),
});

export async function GET(request: Request) {
  const requestContext = buildRequestContext(request, "api.documents.list");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("documents.list.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `documents:list:user:${session.user.id}`,
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.success) {
    logApiWarn("documents.list.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(rateLimit);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const parsedPage = parseInt(searchParams.get("page") ?? "1", 10);
  const parsedLimit = parseInt(searchParams.get("limit") ?? "20", 10);
  
  // Validate pagination params - fallback to defaults if invalid
  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const pageLimit =
    isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100
      ? 20
      : parsedLimit;

  try {
    const where: Record<string, unknown> = { userId: session.user.id };
    if (status) {
      where.status = status;
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageLimit,
        take: pageLimit,
        include: {
          template: {
            select: { slug: true, name: true, category: { select: { slug: true } } },
          },
        },
      }),
      db.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit: pageLimit,
        total,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    await logApiError("documents.list.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestContext = buildRequestContext(request, "api.documents.create");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("documents.create.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `documents:create:user:${session.user.id}`,
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rateLimit.success) {
    logApiWarn("documents.create.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(rateLimit);
  }

  try {
    const body = await request.json();
    const { templateSlug, locale } = createSchema.parse(body);

    const template = await db.contractTemplate.findUnique({
      where: { slug: templateSlug },
    });

    if (!template || !template.isActive) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const templateName = template.name as unknown as LocalizedString;
    const title = templateName[locale as keyof LocalizedString] ?? templateName.he;

    const document = await db.document.create({
      data: {
        userId: session.user.id,
        templateId: template.id,
        templateVersion: template.version,
        title,
        locale,
        data: {},
        wizardProgress: { currentStep: 0, completedSteps: [] },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    await logApiError("documents.create.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
