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
  const tc = useTranslations("common");
  const { data: session, status } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const getStatusBadge = (status: DocumentStatus) => {
    const styles = {
      DRAFT: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      PUBLISHED: "bg-blue-100 text-blue-800",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status]}`}>
        {status}
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
          {tc("retry")}
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
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="block bg-white rounded-xl border border-border hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-lg line-clamp-2">
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
          ))}
        </div>
      )}
    </div>
  );
}
