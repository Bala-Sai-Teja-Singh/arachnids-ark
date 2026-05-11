'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, GraduationCap, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/shared/molecules/modal';
import { LocalStorage } from '@/mock-db/storage';
import type { Course } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { z } from 'zod';
import { FormBuilder, type FormFieldConfig } from '@/components/shared/organisms/form-builder';
import { SectionHeader } from '@/components/shared/molecules/section-header';
import { EmptyState } from '@/components/shared/molecules/empty-state';
import { Loading } from '@/components/shared/molecules/loading';

const courseSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  thumbnail: z.string().url('Invalid URL').or(z.string().startsWith('/')),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
  videoUrl: z.string().url('Invalid video URL'),
  contentPreview: z.string().min(10, 'Preview is too short'),
  duration: z.string().min(2, 'Duration is required'),
  price: z.number().min(0, 'Price cannot be negative'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setCourses(LocalStorage.getAll<Course>('courses'));
    setTimeout(() => setIsLoading(false), 300);
  }, []);

  const fields: FormFieldConfig[] = [
    { name: 'title', label: 'Course Title', type: 'text', placeholder: 'e.g. Tarantula Basics', required: true, gridSpan: 'col-span-2' },
    { name: 'thumbnail', label: 'Thumbnail URL', type: 'text', placeholder: '/images/course-thumb.jpg', required: true, gridSpan: 'col-span-2' },
    { name: 'difficulty', label: 'Difficulty Level', type: 'select', options: [{ label: 'Beginner', value: 'beginner' }, { label: 'Intermediate', value: 'intermediate' }, { label: 'Advanced', value: 'advanced' }, { label: 'Expert', value: 'expert' }], required: true, gridSpan: 'col-span-1' },
    { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 5 hours', required: true, gridSpan: 'col-span-1' },
    { name: 'videoUrl', label: 'Course Video URL', type: 'url', placeholder: 'https://youtube.com/...', required: true, gridSpan: 'col-span-2' },
    { name: 'price', label: 'Price (₹)', type: 'number', placeholder: '0', required: true, gridSpan: 'col-span-1' },
    { name: 'contentPreview', label: 'Short Preview Text', type: 'textarea', placeholder: 'Describe what students will learn...', required: true, gridSpan: 'col-span-2' }
  ];

  const handleOpenEdit = (course: Course | null) => {
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = (values: CourseFormValues) => {
    if (editingCourse) {
      const updatedCourse = { ...editingCourse, ...values };
      LocalStorage.update('courses', updatedCourse.id, updatedCourse as Course);
      toast.success('Course updated');
    } else {
      const newCourse = {
        ...values,
        id: `course-${Date.now()}`,
        description: values.contentPreview,
        featured: false,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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

  if (isLoading) {
    return <Loading text="Retrieving course modules..." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        action={{
          label: "Add Course",
          onClick: () => handleOpenEdit(null),
          icon: Plus
        }}
        className="justify-end"
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState
                      title="No courses found"
                      description="Get started by creating your first professional training course."
                      action={{ label: "Create Course", onClick: () => handleOpenEdit(null) }}
                      className="border-none bg-transparent"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id} className="border-border group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted overflow-hidden shrink-0 border border-border group-hover:border-brand-gold/50 transition-colors">
                          {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <GraduationCap className="m-auto h-4 w-4 opacity-20" />}
                        </div>
                        <div className="font-medium group-hover:text-brand-gold transition-colors">{course.title}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{course.difficulty}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{course.duration}</TableCell>
                    <TableCell className="font-bold text-brand-gold">{formatPrice(course.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(course)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400" onClick={() => setDeleteId(course.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden divide-y divide-border">
          {courses.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic">No courses found.</div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="p-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border">
                    {course.thumbnail ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" /> : <GraduationCap className="m-auto h-5 w-5 opacity-20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{course.title}</h3>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest mt-1">{course.difficulty}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Price</p>
                    <p className="text-lg font-bold text-brand-gold">{formatPrice(course.price)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9 border-border" onClick={() => handleOpenEdit(course)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 border-border text-red-400" onClick={() => setDeleteId(course.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal 
        isOpen={isCourseModalOpen} 
        onClose={() => setIsCourseModalOpen(false)}
        variant="large"
        title={editingCourse ? 'Edit Course' : 'Add New Course'}
      >
          <FormBuilder
            schema={courseSchema}
            fields={fields}
            defaultValues={editingCourse || { difficulty: 'beginner', price: 0 }}
            onSubmit={handleSaveCourse}
            submitLabel={editingCourse ? 'Save Changes' : 'Create Course'}
            className="pb-8"
          />
      </Modal>

      <Modal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)}
        variant="confirm"
        title="Delete Course"
        description="Are you sure you want to delete this course? This action cannot be undone."
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete Course</Button>
          </div>
        )}
      >
        <div className="py-2" />
      </Modal>
    </div>
  );
}
