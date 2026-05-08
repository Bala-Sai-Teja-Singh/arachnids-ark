'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, GraduationCap, Search, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalStorage } from '@/mock-db/storage';
import type { Course } from '@/types';
import { formatPrice } from '@/constants/pricing';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  // Modal states
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Course>>({
    title: '', duration: '', price: 0, contentPreview: ''
  });

  useEffect(() => {
    setCourses(LocalStorage.getAll<Course>('courses'));
  }, []);

  const handleOpenEdit = (course: Course | null) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        duration: course.duration,
        price: course.price,
        contentPreview: course.contentPreview || '',
        thumbnail: course.thumbnail,
        difficulty: course.difficulty
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        duration: '',
        price: 0,
        contentPreview: '',
        thumbnail: '',
        difficulty: 'beginner'
      });
    }
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = () => {
    if (editingCourse) {
      const updatedCourse = { ...editingCourse, ...formData };
      LocalStorage.update('courses', updatedCourse.id, updatedCourse);
      toast.success('Course updated');
    } else {
      const newCourse = {
        ...formData,
        id: `course-${Date.now()}`,
        description: formData.description || 'Professional training course.',
        difficulty: formData.difficulty || 'beginner',
        thumbnail: formData.thumbnail || '/images/curlyHair.webp',
        modules: [{ id: 'm1', title: 'Introduction', description: 'Module intro', locked: false }]
      } as Course;
      LocalStorage.create('courses', newCourse);
      toast.success('Course added');
    }
    setCourses(LocalStorage.getAll<Course>('courses'));
    setIsCourseModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      LocalStorage.delete('courses', deleteId);
      setCourses(LocalStorage.getAll<Course>('courses'));
      setDeleteId(null);
      toast.success('Course deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Manage educational content.</p>
        </div>
        <Button className="bg-brand-gold hover:bg-brand-gold/90 text-white" onClick={() => handleOpenEdit(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add Course
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Modules</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No courses found.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <GraduationCap className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="font-medium">{course.title}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{course.difficulty}</Badge></TableCell>
                    <TableCell>{course.modules.length}</TableCell>
                    <TableCell>{course.duration}</TableCell>
                    <TableCell>{formatPrice(course.price)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand-gold" onClick={() => handleOpenEdit(course)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-400" onClick={() => setDeleteId(course.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-border">
          {courses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">No courses found.</div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{course.title}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest mt-1">
                      {course.difficulty}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Modules</p>
                    <p className="font-medium">{course.modules.length} lessons</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{course.duration}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <p className="text-lg font-bold text-brand-gold">{formatPrice(course.price)}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground border-border"
                      onClick={() => handleOpenEdit(course)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground border-border hover:text-red-400"
                      onClick={() => setDeleteId(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit/Add Sheet */}
      <Sheet open={isCourseModalOpen} onOpenChange={setIsCourseModalOpen}>
        <SheetContent className="glass border-border sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail URL</Label>
              <Input
                value={formData.thumbnail || ''}
                placeholder="/images/..."
                onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={val => setFormData({ ...formData, difficulty: val as any })}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Video Preview URL</Label>
              <Input
                value={formData.contentPreview || ''}
                placeholder="https://..."
                onChange={e => setFormData({ ...formData, contentPreview: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input
                  value={formData.duration || ''}
                  placeholder="e.g. 2 hours"
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={e => setFormData({ ...formData, price: Math.max(0, Number(e.target.value)) })}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-8 border-t border-border pt-6">
            <Button variant="outline" onClick={() => setIsCourseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCourse} className="bg-brand-gold hover:bg-brand-gold-light text-white px-8">Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground">Are you sure you want to delete this course? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
