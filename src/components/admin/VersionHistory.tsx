"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Version {
  id: string;
  version: number;
  changelog: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface VersionHistoryProps {
  templateId: string;
  currentVersion: number;
  onRestore?: (versionId: string) => void;
}

export function VersionHistory({
  templateId,
  currentVersion,
  onRestore,
}: VersionHistoryProps) {
  const t = useTranslations("admin.templates");
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/templates/${templateId}/versions`);
        if (res.ok) {
          setVersions(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [templateId]);

  if (loading) {
    return <div className="text-sm text-text-muted p-4">Loading versions...</div>;
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12 bg-surface rounded-xl border border-dashed border-border">
        <p className="text-sm text-text-muted">No version history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((v) => (
        <div
          key={v.id}
          className={`flex items-center justify-between p-4 rounded-xl border ${
            v.version === currentVersion
              ? "border-primary bg-primary/5"
              : "border-border bg-white"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text">
                {t("version")} {v.version}
              </span>
              {v.version === currentVersion && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  Current
                </span>
              )}
            </div>
            {v.changelog && (
              <p className="text-xs text-text-secondary mt-1">{v.changelog}</p>
            )}
            <p className="text-xs text-text-muted mt-1">
              {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString()}
            </p>
          </div>
          {v.version !== currentVersion && onRestore && (
            <button
              type="button"
              onClick={() => onRestore(v.id)}
              className="text-xs text-primary hover:text-primary-dark font-medium"
            >
              {t("restoreVersion")}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
