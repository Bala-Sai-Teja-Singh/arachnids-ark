'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, BookOpen, FileText, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/shared/atoms/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TableMolecule } from '@/components/shared/molecules/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/shared/molecules/modal';
import { LocalStorage } from '@/mock-db/storage';
import type { CareGuide } from '@/types';
import { SectionHeader } from '@/components/shared/molecules/section-header';

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
      <SectionHeader
        className="justify-end"
        action={{
          label: "Add Care Guide",
          onClick: () => handleOpenEdit(null),
          icon: Plus,
          variant: 'primary'
        }}
      >
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card border-border h-10"
            startContent={<Search className="h-4 w-4 text-muted-foreground" />}
            isClearable
            onClear={() => setSearch('')}
          />
        </div>
      </SectionHeader>

      <TableMolecule
        data={filtered}
        columns={[
          {
            header: 'Guide',
            cell: (guide) => (
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
            )
          },
          {
            header: 'Category',
            cell: (guide) => <Badge variant="outline">{guide.category}</Badge>
          },
          { header: 'Read Time', accessorKey: 'readTime', className: 'text-xs' },
          {
            header: 'Actions',
            align: 'right',
            cell: (guide) => (
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-brand-gold" onClick={() => handleOpenEdit(guide)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" onClick={() => setDeleteId(guide.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        ]}
        emptyDescription="No care guides found."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variant="extra-large"
        title={editingGuide ? 'Edit Care Guide' : 'Add Care Guide'}
      >
        <div className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border/50">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={loading} className="bg-brand-red hover:bg-brand-red-light text-white px-8">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        variant="confirm"
        title="Confirm Deletion"
        description="Are you sure you want to delete this care guide? This action cannot be undone."
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        )}
      >
        <div className="py-2" />
      </Modal>
    </div>
  );
}
