"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("error"));
      } else if (result?.ok) {
        router.push(nextUrl as "/dashboard");
      }
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "facebook") {
    setLoading(true);
    try {
      await signIn(provider, { callbackUrl: nextUrl });
    } catch {
      setError(t("error"));
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
      <h1 className="text-2xl font-bold text-center mb-8">{t("title")}</h1>

      {/* Social Login */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => handleSocialLogin("google")}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-surface-hover transition-colors text-sm disabled:opacity-50">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t("socialGoogle")}
        </button>
        <button
          type="button"
          onClick={() => handleSocialLogin("facebook")}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg hover:bg-surface-hover transition-colors text-sm disabled:opacity-50">
          <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          {t("socialFacebook")}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <hr className="flex-1 border-border" />
        <span className="text-sm text-text-muted">{useTranslations("common")("or")}</span>
        <hr className="flex-1 border-border" />
      </div>

      {/* Email/Password Form */}
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

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            dir="ltr"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div className="text-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? useTranslations("common")("loading") : t("submit")}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-primary hover:underline font-medium">
          {t("signUp")}
        </Link>
      </p>
    </div>
  );
}
