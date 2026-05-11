'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * Universal StatCard molecule.
 * Used in dashboards to display key metrics with trends and icons.
 */
export interface StatCardProps {
  /** The metric label */
  title: string;
  /** The display value (string or number) */
  value: string | number;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Optional trend percentage (e.g., "+12.5%") */
  trend?: string;
  /** Trend direction */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** Optional link href for the card */
  href?: string;
  /** Icon color class (e.g., "text-brand-gold") */
  iconColor?: string;
  /** Optional description text */
  description?: string;
  /** Animation delay */
  delay?: number;
  /** Custom class name */
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = 'up',
  href,
  iconColor = 'text-brand-gold',
  description,
  delay = 0,
  className
}: StatCardProps) {
  const CardWrapper = href ? Link : 'div';

  const content = (
    <Card className={cn(
      "border-border bg-card/40 backdrop-blur-md hover:border-brand-gold/30 transition-all duration-300 group",
      href && "cursor-pointer",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors")}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {(trend || description) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={cn(
                "text-xs font-bold flex items-center gap-1",
                trendDirection === 'up' ? "text-green-400" : trendDirection === 'down' ? "text-red-400" : "text-muted-foreground"
              )}>
                {trendDirection === 'up' ? <TrendingUp className="h-3 w-3" /> : trendDirection === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                {trend}
              </span>
            )}
            {description && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {href ? <Link href={href}>{content}</Link> : content}
    </motion.div>
  );
}
