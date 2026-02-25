import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePdf } from "@/lib/pdf/generator";
import type { TemplateDefinition } from "@/types/template";
import type { Locale } from "@/lib/i18n/routing";
import {
  consumeRateLimit,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit";
import {
  buildRequestContext,
  logApiError,
  logApiWarn,
} from "@/lib/monitoring";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const requestContext = buildRequestContext(request, "api.documents.pdf");
  const session = await auth();
  if (!session?.user?.id) {
    logApiWarn("documents.pdf.unauthorized", requestContext);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = consumeRateLimit({
    key: `documents:pdf:user:${session.user.id}`,
    limit: 10,
    windowMs: 60 * 1000,
  });
  if (!limit.success) {
    logApiWarn("documents.pdf.rate_limited", {
      ...requestContext,
      userId: session.user.id,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return rateLimitExceededResponse(
      limit,
      "Too many PDF requests. Please try again in a moment."
    );
  }

  try {
    const { documentId } = await params;

    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        template: true,
      },
    });

    if (!document || document.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    if (document.status === "DRAFT") {
      return NextResponse.json(
        { error: "Document must be completed or published before generating PDF" },
        { status: 400 }
      );
    }

    const definition = document.template.definition as unknown as TemplateDefinition;
    const data = document.data as Record<string, unknown>;
    const locale = document.locale as Locale;

    const pdfBuffer = await generatePdf(definition, data, locale);

    const filename = `${document.title.replace(/[^a-zA-Z0-9\u0590-\u05FF\u0600-\u06FF]/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    await logApiError("documents.pdf.failed", error, {
      ...requestContext,
      userId: session.user.id,
    });
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
