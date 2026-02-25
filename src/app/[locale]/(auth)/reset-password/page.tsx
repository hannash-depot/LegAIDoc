"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("error"));
        return;
      }

      setSuccess(true);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (!token || !email) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-sm text-text-secondary mb-4">{t("invalidLink")}</p>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
          {t("requestNew")}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-text-secondary">{t("success")}</p>
        <Link
          href="/login"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
        >
          {t("goToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <h1 className="text-2xl font-bold text-center mb-8">{t("title")}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-error/10 text-error text-sm rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("newPassword")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            dir="ltr"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("confirmPassword")}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
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
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl shadow-sm border border-border p-8 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
