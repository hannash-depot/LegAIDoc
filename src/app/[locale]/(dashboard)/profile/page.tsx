"use client";

import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const { data: session } = useSession();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">{t("profile")}</h1>

      <div className="bg-white border border-border rounded-xl p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            {session?.user?.name
              ? session.user.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "U"}
          </div>
          <div>
            <h2 className="font-semibold text-lg text-text">
              {session?.user?.name || "—"}
            </h2>
            <p className="text-sm text-text-muted">{session?.user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {tc("appName")}
            </label>
            <p className="text-sm text-text-muted">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
