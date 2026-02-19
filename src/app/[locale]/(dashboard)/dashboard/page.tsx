"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { DocumentStatus } from "@prisma/client";

interface Document {
  id: string;
  title: string;
  status: DocumentStatus;
  locale: string;
  createdAt: string;
  updatedAt: string;
  template: {
    slug: string;
    name: Record<string, string>;
    category: {
      slug: string;
    };
  };
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status]);

  async function fetchDocuments() {
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch {
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setConfirmId(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  const getStatusBadge = (status: DocumentStatus) => {
    const styles: Record<DocumentStatus, string> = {
      DRAFT: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      PUBLISHED: "bg-blue-100 text-blue-800",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
        {t(`status.${status}` as "status.DRAFT")}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-error mb-4">{error}</p>
        <button
          onClick={fetchDocuments}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          {tCommon("retry")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link
          href="/templates"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          {t("newDocument")}
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl">
          <svg
            className="w-16 h-16 mx-auto text-text-muted mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-text-secondary mb-4">{t("empty")}</p>
          <Link
            href="/templates"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="relative group bg-white rounded-xl border border-border hover:shadow-md transition-shadow"
            >
              <Link
                href={`/documents/${doc.id}`}
                className="block p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg line-clamp-2 pe-8">
                    {doc.title}
                  </h3>
                  {getStatusBadge(doc.status)}
                </div>

                <p className="text-sm text-text-muted mb-4">
                  {doc.template.name[doc.locale] || doc.template.name.he}
                </p>

                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{formatDate(doc.updatedAt)}</span>
                  <span className="capitalize">{doc.locale}</span>
                </div>
              </Link>

              {/* Delete controls — shown on hover */}
              <div className="absolute top-3 end-3">
                {confirmId === doc.id ? (
                  <div className="flex items-center gap-1 bg-white border border-border rounded-lg shadow-sm p-1">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="px-2 py-1 text-xs bg-error text-white rounded hover:bg-error/90 disabled:opacity-50"
                    >
                      {tCommon("confirm")}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="px-2 py-1 text-xs text-text-secondary hover:bg-surface-hover rounded"
                    >
                      {tCommon("cancel")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/5 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    title={t("actions.delete")}
                  >
                    {deletingId === doc.id ? (
                      <div className="w-4 h-4 border-2 border-error border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
