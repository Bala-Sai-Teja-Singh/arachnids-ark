'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen, FileText, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { LocalStorage } from '@/mock-db/storage';
import type { CareGuide } from '@/types';

export default function AdminCareGuidesPage() {
  const [guides, setGuides] = useState<CareGuide[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<CareGuide | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<CareGuide>>({
    title: '', excerpt: '', content: '', image: '', category: '', readTime: ''
  });

  useEffect(() => {
    setGuides(LocalStorage.getAll<CareGuide>('care_guides'));
  }, []);

  const filtered = guides.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase()) || 
    g.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = (guide: CareGuide | null) => {
    if (guide) {
      setEditingGuide(guide);
      setFormData({ ...guide });
    } else {
      setEditingGuide(null);
      setFormData({
        title: '', excerpt: '', content: '', image: '', category: 'General', readTime: '5 min read'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    if (editingGuide) {
      const updated = { ...editingGuide, ...formData } as CareGuide;
      LocalStorage.update('care_guides', updated.id, updated);
      toast.success('Care guide updated');
    } else {
      const newGuide = {
        ...formData,
        id: `guide-${Date.now()}`,
      } as CareGuide;
      LocalStorage.create('care_guides', newGuide);
      toast.success('Care guide added');
    }
    
    setGuides(LocalStorage.getAll<CareGuide>('care_guides'));
    setIsModalOpen(false);
    setLoading(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      LocalStorage.delete('care_guides', deleteId);
      setGuides(guides.filter(g => g.id !== deleteId));
      setDeleteId(null);
      toast.success('Care guide deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient-gold">Care Guides</h1>
          <p className="text-muted-foreground">Manage free educational resources for your users.</p>
        </div>
        <Button className="bg-brand-red hover:bg-brand-red-light text-white" onClick={() => handleOpenEdit(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add Care Guide
        </Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search guides..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border-border"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Guide</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Read Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No care guides found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((guide) => (
                <TableRow key={guide.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border">
                        {guide.image ? (
                          <img src={guide.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <BookOpen className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{guide.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{guide.excerpt}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{guide.category}</Badge></TableCell>
                  <TableCell className="text-xs">{guide.readTime}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-gold" onClick={() => handleOpenEdit(guide)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" onClick={() => setDeleteId(guide.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Add Sheet */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent className="glass border-border sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingGuide ? 'Edit Care Guide' : 'Add Care Guide'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="bg-background/50"
                placeholder="e.g. Complete Beginner's Guide to Tarantula Care"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="bg-background/50"
                  placeholder="e.g. Beginner, Health, Nutrition"
                />
              </div>
              <div className="space-y-2">
                <Label>Read Time</Label>
                <Input
                  value={formData.readTime || ''}
                  onChange={e => setFormData({ ...formData, readTime: e.target.value })}
                  className="bg-background/50"
                  placeholder="e.g. 5 min read"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Excerpt (Short Description)</Label>
              <Textarea
                value={formData.excerpt || ''}
                onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                className="bg-background/50 h-20"
                placeholder="A brief summary of what this guide covers..."
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.image || ''}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
                className="bg-background/50"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Content (Markdown supported)</Label>
              </div>
              <Textarea
                value={formData.content || ''}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                className="bg-background/50 min-h-[300px] font-mono text-sm"
                placeholder="# Introduction\n\nContent goes here..."
              />
            </div>
          </div>
          <SheetFooter className="mt-8 border-t border-border pt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-brand-red hover:bg-brand-red-light text-white px-8">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">Are you sure you want to delete this care guide? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
