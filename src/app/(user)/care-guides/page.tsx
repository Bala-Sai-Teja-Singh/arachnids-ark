'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Search, Book } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Db } from '@/lib/db';
import { SectionHeader } from '@/components/shared/molecules/section-header';
import { Input } from '@/components/shared/atoms/input';
import { Select } from '@/components/shared/atoms/select';
import { Loading } from '@/components/shared/molecules/loading';
import { EmptyState } from '@/components/shared/molecules/empty-state';
import type { CareGuide } from '@/types';
import Link from 'next/link';

export default function CareGuidesPage() {
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    (async () => {
    setLoading(true);
    const data = await Db.getAll<CareGuide>('care_guides');
    setGuides(data);
    setTimeout(() => setLoading(false), 400);
  })();
  }, []);

  const categories = [
    { label: 'All Categories', value: 'all' },
    ...Array.from(new Set(guides.map(g => g.category))).map(cat => ({
      label: cat,
      value: cat
    }))
  ];

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(search.toLowerCase()) || 
                         guide.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || guide.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto px-4 py-4">
      <SectionHeader />

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search guides..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select
            options={categories}
            value={category}
            onValueChange={(val) => setCategory(val ?? 'all')}
          />
        </div>
      </div>

      {loading ? (
        <Loading text="Opening the archives..." />
      ) : filteredGuides.length === 0 ? (
        <EmptyState 
          icon={Book}
          title="No guides found" 
          description="Try adjusting your search or filter to find what you're looking for." 
          action={{ label: "Clear Filters", onClick: () => { setSearch(''); setCategory('all'); } }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/care-guides/${guide.id}`}>
                <Card className="group border-border bg-card/40 backdrop-blur-sm hover:border-brand-red/20 transition-all h-full cursor-pointer hover:shadow-lg hover:shadow-brand-red/5">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-brand-red/20 to-brand-gold/10 overflow-hidden shrink-0 border border-border group-hover:border-brand-gold/50 transition-colors">
                      {guide.image ? (
                        <img src={guide.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-brand-red/50" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <Badge variant="outline" className="text-xs border-border group-hover:border-brand-gold/30 group-hover:text-brand-gold transition-colors">{guide.category}</Badge>
                      <h3 className="font-semibold group-hover:text-brand-gold transition-colors">{guide.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{guide.excerpt}</p>
                      <div className="flex items-center gap-1 text-xs text-brand-gold">
                        <Clock className="h-3 w-3" />
                        {guide.readTime}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
