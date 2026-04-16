'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

interface PremiumEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PremiumEmptyState({ icon, title, description, action }: PremiumEmptyStateProps) {
  return (
    <Card className="glass-card relative overflow-hidden border-2 border-dashed">
      <div className="from-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent" />
      <CardContent className="relative z-10 flex flex-col items-center justify-center px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
          }}
          className="relative mb-6"
        >
          <div
            className="bg-primary/10 absolute -inset-4 animate-pulse rounded-full blur-xl"
            aria-hidden="true"
          />
          <div className="from-primary/20 to-primary/5 text-primary border-primary/20 relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-inner backdrop-blur-sm">
            {icon}
          </div>
        </motion.div>

        <motion.h3
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-foreground/90 mb-2 font-serif text-2xl font-bold tracking-tight"
        >
          {title}
        </motion.h3>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground/80 mx-auto mb-8 max-w-sm leading-relaxed"
        >
          {description}
        </motion.p>

        {action && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {action}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
