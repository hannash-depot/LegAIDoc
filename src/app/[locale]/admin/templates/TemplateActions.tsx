"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TemplateActionsProps {
  templateId: string;
  isActive: boolean;
  editHref: string;
}

export function TemplateActions({ templateId, isActive, editHref }: TemplateActionsProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    await fetch(`/api/admin/templates/${templateId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    router.refresh();
  }

  async function deleteTemplate() {
    setLoading(true);
    await fetch(`/api/admin/templates/${templateId}`, { method: "DELETE" });
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">Delete?</span>
        <button
          onClick={deleteTemplate}
          disabled={loading}
          className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 rounded border border-border hover:bg-surface"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={editHref}
        className="text-xs px-3 py-1 rounded border border-border hover:bg-surface transition-colors"
      >
        Edit
      </Link>
      <button
        onClick={toggleActive}
        disabled={loading}
        className="text-xs px-3 py-1 rounded border border-border hover:bg-surface transition-colors disabled:opacity-50"
      >
        {loading ? "…" : isActive ? "Deactivate" : "Activate"}
      </button>
      <button
        onClick={() => setConfirming(true)}
        className="text-xs px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
