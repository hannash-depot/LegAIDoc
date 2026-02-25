import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import {
  buildRequestContext,
  logApiError,
  logApiWarn,
} from "@/lib/monitoring";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestContext = buildRequestContext(request, "api.documents.get");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("documents.get.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `documents:get:user:${session.user.id}`,
    limit: 180,
    windowMs: 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("documents.get.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(limit);
  }

  try {
    const { documentId } = await params;

    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        template: {
          include: {
            category: { select: { slug: true, name: true } },
          },
        },
      },
    });

    if (!document || document.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    await logApiError("documents.get.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestContext = buildRequestContext(request, "api.documents.update");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("documents.update.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `documents:update:user:${session.user.id}`,
    limit: 90,
    windowMs: 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("documents.update.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(limit);
  }

  try {
    const { documentId } = await params;
    const body = await request.json();

    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.status === "PUBLISHED") {
      return NextResponse.json(
        { error: "Cannot edit a published document" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["DRAFT", "COMPLETED"];
    if (body.status && !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status. Use the publish endpoint to publish documents." },
        { status: 400 }
      );
    }

    const updated = await db.document.update({
      where: { id: documentId },
      data: {
        data: body.data ?? document.data,
        wizardProgress: body.wizardProgress ?? document.wizardProgress,
        status: body.status ?? document.status,
        title: body.title ?? document.title,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    await logApiError("documents.update.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestContext = buildRequestContext(request, "api.documents.delete");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("documents.delete.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `documents:delete:user:${session.user.id}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("documents.delete.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(limit);
  }

  try {
    const { documentId } = await params;

    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await db.document.delete({ where: { id: documentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    await logApiError("documents.delete.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
