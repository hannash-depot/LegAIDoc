"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const legalCopy = {
    en: {
      start: "I agree to the",
      and: "and",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      error: "You must accept the Terms and Privacy Policy to continue.",
    },
    he: {
      start: "אני מסכים/ה ל",
      and: "ו",
      terms: "תנאי השימוש",
      privacy: "מדיניות הפרטיות",
      error: "יש לאשר את תנאי השימוש ומדיניות הפרטיות כדי להמשיך.",
    },
    ar: {
      start: "أوافق على",
      and: "و",
      terms: "شروط الاستخدام",
      privacy: "سياسة الخصوصية",
      error: "يجب الموافقة على الشروط وسياسة الخصوصية للمتابعة.",
    },
    ru: {
      start: "Я принимаю",
      and: "и",
      terms: "Условия использования",
      privacy: "Политику конфиденциальности",
      error: "Чтобы продолжить, нужно принять Условия и Политику конфиденциальности.",
    },
  }[locale] ?? {
    start: "I agree to the",
    and: "and",
    terms: "Terms of Service",
    privacy: "Privacy Policy",
    error: "You must accept the Terms and Privacy Policy to continue.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (!acceptedLegal) {
      setError(legalCopy.error);
      return;
    }

    setLoading(true);
    try {
      // Register the user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          acceptedTerms: acceptedLegal,
          acceptedPrivacy: acceptedLegal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || tCommon("error"));
        return;
      }

      // Auto-login after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/dashboard");
      } else {
        // Registration succeeded but login failed - redirect to login page
        router.push("/login");
      }
    } catch {
      setError(tCommon("error"));
    } finally {
      setLoading(false);
    }
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
          <label className="block text-sm font-medium mb-1.5">{t("name")}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

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
            minLength={8}
            dir="ltr"
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t("confirmPassword")}
          </label>
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

        <label className="flex items-start gap-3 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={acceptedLegal}
            onChange={(e) => setAcceptedLegal(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            required
          />
          <span>
            {legalCopy.start}{" "}
            <Link href="/terms" className="text-primary hover:underline">
              {legalCopy.terms}
            </Link>{" "}
            {legalCopy.and}{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              {legalCopy.privacy}
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? tCommon("loading") : t("submit")}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-6">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
