'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Upload, Check, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth-store';
import { LocalStorage } from '@/mock-db/storage';
import type { CourseEnrollment, SystemSettings } from '@/types';
import { formatPrice } from '@/constants/pricing';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [selectedUPI, setSelectedUPI] = useState<string>('');
  const [copiedUPI, setCopiedUPI] = useState(false);

  useEffect(() => {
    if (!user) return;
    const data = LocalStorage.getAll<CourseEnrollment>('enrollments')
      .filter(e => e.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setEnrollments(data);

    const settingsData = LocalStorage.getAll<SystemSettings>('system_settings');
    if (settingsData.length > 0) {
      setSystemSettings(settingsData[0]);
      const defaultUPI = settingsData[0].upiIds.find(u => u.isDefault) || settingsData[0].upiIds[0];
      if (defaultUPI) setSelectedUPI(defaultUPI.value);
    }
  }, [user]);

  const handleUpload = (id: string) => {
    if (!selectedFile) {
      setUploadError('Please select a payment screenshot to upload');
      return;
    }
    setUploadError(null);
    LocalStorage.update<CourseEnrollment>('enrollments', id, {
      paymentScreenshot: 'payment_uploaded.jpg',
      status: 'payment_uploaded',
    });
    setEnrollments(prev => prev.map(e =>
      e.id === id ? { ...e, paymentScreenshot: 'payment_uploaded.jpg', status: 'payment_uploaded' as const } : e
    ));

    // Notify Admin
    import('@/store/notification-store').then(m => {
      m.useNotificationStore.getState().addNotification({
        userId: 'admin',
        title: 'Course Payment Received',
        message: `${user?.name} uploaded a payment screenshot for a course.`,
        type: 'payment',
      });
    });

    toast.success('Payment screenshot uploaded successfully!');
    setUploadId(null);
    setSelectedFile(null);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUPI(true);
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="vibe-heading text-2xl font-bold mb-1">My Courses</h1>
        <p className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground mb-6">Track your course enrollments</p>
      </motion.div>

      {enrollments.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No enrollments yet" description="Browse our courses and start your learning journey." />
      ) : (
        <div className="space-y-4">
          {enrollments.map((enr, i) => (
            <motion.div key={enr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-medium">{enr.courseTitle}</h3>
                      <p className="text-xs text-muted-foreground">{new Date(enr.createdAt).toLocaleDateString()}</p>
                      {enr.adminNote && <p className="text-xs text-brand-gold">Admin: {enr.adminNote}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-brand-gold">{formatPrice(enr.totalPrice)}</span>
                      <StatusBadge status={enr.status} />
                      {enr.status === 'awaiting_payment' && (
                        <Dialog open={uploadId === enr.id} onOpenChange={(open) => {
                          setUploadId(open ? enr.id : null);
                          if (!open) {
                            setSelectedFile(null);
                            setUploadError(null);
                          }
                        }}>
                          <DialogTrigger render={<Button size="sm" className="bg-brand-gold hover:bg-brand-gold-light text-white" />}>
                            Pay Now
                          </DialogTrigger>
                          <DialogContent className="glass border-border">
                            <DialogHeader><DialogTitle>Complete Your Payment</DialogTitle></DialogHeader>
                            <div className="py-4 space-y-6">
                              <div className="bg-background/50 border border-border p-4 rounded-lg space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs text-muted-foreground">Select UPI ID</Label>
                                  {systemSettings && systemSettings.upiIds.length > 0 ? (
                                    <Select value={selectedUPI} onValueChange={(val) => setSelectedUPI(val ?? '')}>
                                      <SelectTrigger className="w-full bg-background/50">
                                        <SelectValue placeholder="Select UPI ID" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {systemSettings.upiIds.map((upi) => (
                                          <SelectItem key={upi.id} value={upi.value}>
                                            {upi.label} ({upi.value})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <p className="font-mono text-sm bg-muted/50 p-2 rounded border border-border select-all">payments@arachnidsark</p>
                                  )}
                                  {selectedUPI && (
                                    <div 
                                      onClick={() => handleCopy(selectedUPI)}
                                      className={`mt-2 p-2 rounded border transition-all duration-300 flex items-center justify-between cursor-pointer group ${copiedUPI ? 'bg-green-500/10 border-green-500/50' : 'bg-muted/30 border-border hover:bg-muted/50'}`}
                                    >
                                      <span className="font-mono text-sm select-all">{selectedUPI}</span>
                                      <div className="flex items-center gap-1.5">
                                        {copiedUPI ? (
                                          <>
                                            <Check className="h-3 w-3 text-green-500" />
                                            <span className="text-[10px] text-green-500 uppercase tracking-widest font-black">Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3 text-muted-foreground group-hover:text-brand-gold transition-colors" />
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold group-hover:text-brand-gold transition-colors">Copy</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="space-y-1 mt-2 border-t border-border pt-3">
                                  <p className="text-xs text-muted-foreground">Bank Transfer Details</p>
                                  <div className="font-mono text-xs bg-muted/50 p-2 rounded border border-border space-y-1">
                                    {systemSettings?.bankDetails ? (
                                      <pre className="whitespace-pre-wrap font-mono text-[10px]">{systemSettings.bankDetails}</pre>
                                    ) : (
                                      <>
                                        <p>Bank: HDFC Bank</p>
                                        <p>Account Name: ArachnidsArk Pvt Ltd</p>
                                        <p>A/C Number: <span className="select-all">50200001234567</span></p>
                                        <p>IFSC: <span className="select-all">HDFC0001234</span></p>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <p className="text-[10px] text-brand-gold italic">
                                  {systemSettings?.paymentInstructions || `Please include your enrollment ID (${enr.id.split('-')[1] || enr.id}) in the transfer remarks.`}
                                </p>
                              </div>

                               <div className="space-y-2 border-t border-border pt-4">
                                <Label>Upload Payment Screenshot</Label>
                                <Input 
                                  type="file" 
                                  accept="image/*" 
                                  className={`bg-background/50 cursor-pointer ${uploadError ? 'border-red-500' : ''}`}
                                  onChange={(e) => {
                                    setSelectedFile(e.target.files?.[0] || null);
                                    setUploadError(null);
                                  }}
                                />
                                {uploadError && <p className="text-xs text-red-500 font-medium">{uploadError}</p>}
                                <p className="text-xs text-muted-foreground">Upload your payment proof for verification.</p>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setUploadId(null)}>Cancel</Button>
                              <Button onClick={() => handleUpload(enr.id)} className="bg-brand-red hover:bg-brand-red-light text-white">Submit</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
