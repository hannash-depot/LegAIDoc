"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const tp = useTranslations("profile");
  const tc = useTranslations("common");
  const { data: session, update } = useSession();

  const [editName, setEditName] = useState(false);
  const [nameValue, setNameValue] = useState(session?.user?.name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
    setNameError(null);
    setNameSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error ?? "Failed to update");
        return;
      }
      setNameSuccess(true);
      setEditName(false);
      await update();
      setTimeout(() => setNameSuccess(false), 3000);
    } catch {
      setNameError("Failed to update");
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError(tp("passwordTooShort") || "Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(tp("passwordMismatch") || "Passwords do not match");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "Failed to change password");
        return;
      }
      setPasswordSuccess(true);
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch {
      setPasswordError("Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">{tp("title")}</h1>

      <div className="space-y-6">
        {/* Profile info card */}
        <div className="bg-white border border-border rounded-xl p-6">
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
            <div className="flex-1">
              {editName ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder={tp("name")}
                    className="w-full px-3 py-2 border border-border rounded-lg text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveName}
                      disabled={nameSaving}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                    >
                      {nameSaving ? tc("loading") : tp("save")}
                    </button>
                    <button
                      onClick={() => {
                        setEditName(false);
                        setNameValue(session?.user?.name ?? "");
                        setNameError(null);
                      }}
                      disabled={nameSaving}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-sm"
                    >
                      {tc("cancel")}
                    </button>
                  </div>
                  {nameError && (
                    <p className="text-sm text-red-600">{nameError}</p>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="font-semibold text-lg text-text">
                    {session?.user?.name || "—"}
                  </h2>
                  <p className="text-sm text-text-muted">{session?.user?.email}</p>
                  <button
                    onClick={() => {
                      setEditName(true);
                      setNameValue(session?.user?.name ?? "");
                    }}
                    className="mt-2 text-sm text-primary hover:underline font-medium"
                  >
                    {tp("editName")}
                  </button>
                </>
              )}
            </div>
          </div>

          {nameSuccess && (
            <p className="text-sm text-green-600 mb-4">{tp("nameUpdated")}</p>
          )}

          <div className="pt-4 border-t border-border">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              {tp("email")}
            </label>
            <p className="text-sm text-text-muted">{session?.user?.email}</p>
          </div>
        </div>

        {/* Change password section */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text mb-4">{tp("changePassword")}</h3>

          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {tp("currentPassword")}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {tp("newPassword")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 border border-border rounded-lg text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  {tp("confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg text-text focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
                >
                  {passwordSaving ? tc("loading") : tp("submit")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError(null);
                  }}
                  disabled={passwordSaving}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover text-sm"
                >
                  {tc("cancel")}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm text-primary hover:underline font-medium"
              >
                {tp("changePassword")}
              </button>
              {passwordSuccess && (
                <p className="mt-2 text-sm text-green-600">{tp("passwordChanged")}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
