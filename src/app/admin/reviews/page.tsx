'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Check, X, Trash2, Filter, Star,
  Search, AlertCircle, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { useReviewStore } from '@/store/review-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { ReviewStatus } from '@/types';

export default function AdminReviewsPage() {
  const { reviews, loadReviews, updateReviewStatus, deleteReview, isLoading } = useReviewStore();
  const [filter, setFilter] = useState<ReviewStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filteredReviews = reviews.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const confirmDelete = () => {
    if (deleteId) {
      deleteReview(deleteId);
      setDeleteId(null);
      toast.success('Review deleted');
    }
  };

  const confirmReject = () => {
    if (rejectId) {
      updateReviewStatus(rejectId, 'rejected');
      setRejectId(null);
      toast.success('Review rejected');
    }
  };

  const handleStatusChange = (id: string, status: ReviewStatus) => {
    updateReviewStatus(id, status);
    toast.success(`Review ${status} successfully`);
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/20"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-brand-red" />
            Review Management
          </h1>
          <p className="text-muted-foreground text-sm">Approve or reject customer reviews</p>
        </div>
      </div>

      <Card className="border-border bg-card/50">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or content..."
              className="pl-10 bg-background/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1 bg-background/50 p-1 rounded-lg border border-border">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${filter === f ? 'bg-brand-red text-white' : 'hover:bg-accent'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredReviews.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-accent/5 rounded-xl border border-dashed border-border"
            >
              <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No reviews found matching your criteria</p>
            </motion.div>
          ) : (
            filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="border-border bg-card/30 hover:bg-card/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback className="bg-brand-red text-white font-bold">
                            {review.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold">{review.userName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Customer</p>
                          <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${review.rating >= star ? 'text-brand-gold fill-brand-gold' : 'text-muted-foreground'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(review.status)}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(review.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {review.comment}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {review.targetType.charAt(0).toUpperCase() + review.targetType.slice(1)} ID: <code className="bg-accent/30 px-1 rounded">{review.targetId}</code>
                        </p>
                      </div>

                      <div className="flex md:flex-col gap-2 justify-end">
                        {review.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleStatusChange(review.id, 'approved')}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                              onClick={() => setRejectId(review.id)}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {review.status !== 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(review.id, 'pending')}
                          >
                            <Clock className="h-4 w-4 mr-1" /> Reset to Pending
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                          onClick={() => setDeleteId(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>


      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground text-center">
            Are you sure you want to delete this review? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground text-center">
            Are you sure you want to reject this review? It will be hidden from the public shop.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button className="bg-red-500 text-white hover:bg-red-600" onClick={confirmReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
