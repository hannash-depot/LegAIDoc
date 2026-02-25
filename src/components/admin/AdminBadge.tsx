interface AdminBadgeProps {
  variant: "active" | "inactive" | "mandatory" | "optional" | "info";
  children: React.ReactNode;
}

const variantStyles: Record<AdminBadgeProps["variant"], string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-text-muted/10 text-text-muted",
  mandatory: "bg-primary/10 text-primary",
  optional: "bg-accent/10 text-accent",
  info: "bg-primary-light/10 text-primary-light",
};

export function AdminBadge({ variant, children }: AdminBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
