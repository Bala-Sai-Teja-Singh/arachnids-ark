'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocalStorage } from '@/mock-db/storage';
import type { CareGuide } from '@/types';

export default function CareGuidesPage() {
  const [guides, setGuides] = useState<CareGuide[]>([]);

  useEffect(() => {
    setGuides(LocalStorage.getAll<CareGuide>('care_guides'));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <Badge variant="outline" className="border-brand-red/30 text-brand-red mb-4">
          <BookOpen className="h-3 w-3 mr-2" />
          Free Resources
        </Badge>
        <h1 className="text-3xl font-bold mb-2">
          Care <span className="text-gradient-red">Guides</span>
        </h1>
        <p className="text-muted-foreground">
          Expert advice and comprehensive guides for tarantula care
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide, i) => (
          <motion.div
            key={guide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="group border-border bg-card hover:border-brand-red/20 transition-all h-full cursor-pointer">
              <CardContent className="p-6 flex gap-4">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-brand-red/20 to-brand-gold/10 overflow-hidden shrink-0 border border-border">
                  {guide.image ? (
                    <img src={guide.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-brand-red/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <Badge variant="outline" className="text-xs border-border">{guide.category}</Badge>
                  <h3 className="font-semibold group-hover:text-brand-gold transition-colors">{guide.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{guide.excerpt}</p>
                  <div className="flex items-center gap-1 text-xs text-brand-gold">
                    <Clock className="h-3 w-3" />
                    {guide.readTime}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
