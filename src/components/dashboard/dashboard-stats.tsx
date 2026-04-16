'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FilePen, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
  total: number;
  drafts: number;
  pendingSignature: number;
  signed: number;
}

const statConfig = [
  { key: 'totalDocuments' as const, icon: FileText, gradient: 'from-blue-500 to-cyan-400' },
  { key: 'drafts' as const, icon: FilePen, gradient: 'from-amber-500 to-yellow-400' },
  { key: 'pendingSig' as const, icon: Clock, gradient: 'from-orange-500 to-rose-400' },
  { key: 'signed' as const, icon: CheckCircle, gradient: 'from-emerald-500 to-green-400' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export function DashboardStats({ total, drafts, pendingSignature, signed }: DashboardStatsProps) {
  const t = useTranslations('dashboard');

  const values = [total, drafts, pendingSignature, signed];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {statConfig.map((stat, i) => (
        <motion.div key={stat.key} variants={itemVariants}>
          <Card className="glass-card group hover:border-primary/30 relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            {/* Gradient background hint */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
            />
            {/* Gradient accent bar */}
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-80`}
            />
            <CardContent className="relative z-10 flex items-center gap-4 pt-6">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-sm font-medium">{t(stat.key)}</p>
                <p className="text-2xl font-bold tracking-tight">{values[i]}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
