interface AdminStatsCardProps {
  label: string;
  value: number | string;
  icon?: string;
}

export function AdminStatsCard({ label, value, icon }: AdminStatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
    </div>
  );
}
