'use client';

import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LocalStorage } from '@/mock-db/storage';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleChangeInfo, setRoleChangeInfo] = useState<{ id: string, name: string, targetRole: UserRole } | null>(null);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    setUsers(LocalStorage.getAll<User>('users'));
  }, []);

  const promptRoleChange = (id: string, name: string, currentRole: UserRole) => {
    if (id === currentUser?.id) {
      toast.error('You cannot change your own role.');
      return;
    }
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    setRoleChangeInfo({ id, name, targetRole });
  };

  const confirmRoleChange = () => {
    if (!roleChangeInfo) return;
    const { id, targetRole } = roleChangeInfo;
    LocalStorage.update<User>('users', id, { role: targetRole });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: targetRole } : u));
    toast.success(`Role updated to ${targetRole}`);
    setRoleChangeInfo(null);
  };

  const promptDelete = (id: string) => {
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own account.');
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      LocalStorage.delete('users', deleteId);
      setUsers(users.filter(u => u.id !== deleteId));
      setDeleteId(null);
      toast.success('User deleted');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="vibe-heading text-2xl font-bold tracking-tight">Users</h1>
        <p className="font-heading text-[10px] uppercase tracking-widest text-muted-foreground">Manage user accounts and permissions.</p>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} className="border-border">
                  <TableCell className="font-medium">
                    {u.name}
                    {u.id === currentUser?.id && <Badge variant="outline" className="ml-2 text-[10px] h-4 border-brand-gold/30 text-brand-gold">You</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.role === 'admin' ? 'border-red-400/30 text-red-400 bg-red-400/10' : 'border-border'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-brand-gold"
                      onClick={() => promptRoleChange(u.id, u.name, u.role)}
                      disabled={u.id === currentUser?.id}
                      title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                    >
                      {u.role === 'admin' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-red-400" 
                      onClick={() => promptDelete(u.id)}
                      disabled={u.id === currentUser?.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Role Change Confirmation Modal */}
      <Dialog open={!!roleChangeInfo} onOpenChange={(open) => !open && setRoleChangeInfo(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Role Change</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground leading-relaxed">
            Are you sure you want to change <span className="text-foreground font-medium">{roleChangeInfo?.name}&apos;s</span> role to <span className="text-brand-gold font-bold uppercase">{roleChangeInfo?.targetRole}</span>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeInfo(null)}>Cancel</Button>
            <Button className="bg-brand-gold hover:bg-brand-gold-light text-white" onClick={confirmRoleChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="glass border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="py-4 text-sm text-muted-foreground leading-relaxed">Are you sure you want to delete this user? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
