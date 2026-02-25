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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestContext = buildRequestContext(request, "api.documents.publish");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("documents.publish.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `documents:publish:user:${session.user.id}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("documents.publish.rate_limited", {
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

    if (document.status === "PUBLISHED") {
      return NextResponse.json(
        { error: "Document is already published" },
        { status: 400 }
      );
    }

    const updated = await db.document.update({
      where: { id: documentId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    await logApiError("documents.publish.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to publish document" },
      { status: 500 }
    );
  }
}
