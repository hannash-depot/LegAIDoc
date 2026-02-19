/**
 * Admin authorization helpers.
 *
 * Set ADMIN_EMAILS to a comma-separated list of email addresses that should
 * have admin access:
 *   ADMIN_EMAILS="alice@example.com,bob@example.com"
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? "";
  if (!raw.trim()) return false;
  const allowed = raw.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}
