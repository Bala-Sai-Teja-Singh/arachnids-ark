'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronLeft, Calendar, Share2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Db } from '@/lib/db';
import type { CareGuide } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useModules } from '@/hooks/use-modules';

export default function CareGuideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [guide, setGuide] = useState<CareGuide | null>(null);
  const router = useRouter();
  const { isVisible } = useModules();

  useEffect(() => {
      (async () => {
      const allGuides = await Db.getAll<CareGuide>('care_guides');
      const found = allGuides.find(g => g.id === id);
      if (found) {
        setGuide(found);
      }
      })();
  }, [id]);

  if (!guide) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Guide not found</h2>
        <Button onClick={() => router.push('/care-guides')}>Back to Guides</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
        <Link href="/care-guides" className="text-muted-foreground hover:text-brand-gold flex items-center gap-2 text-sm font-medium transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Care Guides
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-brand-red/30 text-brand-red">
              <BookOpen className="h-3 w-3 mr-2" />
              Free Care Guide
            </Badge>
            <Badge variant="outline" className="border-border text-muted-foreground">
              {guide.category}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            {guide.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border/50 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-gold" />
              {guide.readTime}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-gold" />
              Updated recently
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-brand-gold/10 hover:text-brand-gold">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-brand-red/10 hover:text-brand-red" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {guide.image && (
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border shadow-2xl">
            <img src={guide.image} alt={guide.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-invert prose-brand max-w-none">
          <div className="text-xl text-muted-foreground italic mb-10 leading-relaxed border-l-4 border-brand-gold pl-6 py-2 bg-brand-gold/5 rounded-r-lg">
            {guide.excerpt}
          </div>
          
          <div className="whitespace-pre-wrap leading-relaxed text-lg space-y-6 text-foreground/90">
            {guide.content}
          </div>
        </div>

        {(isVisible('consultations') || isVisible('courses')) && (
          <div className="mt-20 p-8 rounded-2xl bg-gradient-to-br from-brand-red/10 to-brand-gold/5 border border-brand-red/20 text-center space-y-4">
            <h3 className="text-2xl font-bold">Want to learn more?</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our expert consultation services can help you with specific questions about your tarantula's health, housing, or behavior.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              {isVisible('consultations') && (
                <Button render={<Link href="/consultation" />} className="bg-brand-red hover:bg-brand-red-light text-white px-8">
                  Book a Consultation
                </Button>
              )}
              {isVisible('courses') && (
                <Button variant="outline" render={<Link href="/courses" />} className="border-border hover:bg-accent">
                  Explore Courses
                </Button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
