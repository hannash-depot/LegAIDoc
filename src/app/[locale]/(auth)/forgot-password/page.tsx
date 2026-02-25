"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed");
      }

      setSent(true);
    } catch {
      setError(tc("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <h1 className="text-2xl font-bold text-center mb-8">{t("title")}</h1>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">{t("sent")}</p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 text-sm text-primary hover:underline font-medium"
          >
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-error/10 text-error text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? tc("loading") : t("submit")}
          </button>

          <p className="text-center">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline font-medium"
            >
              {t("backToLogin")}
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
