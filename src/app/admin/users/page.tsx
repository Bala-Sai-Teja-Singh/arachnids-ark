'use client';

import { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Trash2, Key, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/shared/molecules/modal';
import { TableMolecule } from '@/components/shared/molecules/table';
import { Db } from '@/lib/db';
import type { User, UserRole } from '@/types';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { Loading } from '@/components/shared/molecules/loading';
import { SectionHeader } from '@/components/shared/molecules/section-header';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [roleChangeInfo, setRoleChangeInfo] = useState<{ id: string, name: string, targetRole: UserRole } | null>(null);
  const [resetPasswordInfo, setResetPasswordInfo] = useState<{ id: string, name: string } | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setUsers(await Db.getAll<User>('users'));
      setIsLoading(false);
    })();
  }, []);

  const promptRoleChange = async (id: string, name: string, currentRole: UserRole) => {
    if (id === currentUser?.id) {
      toast.error('You cannot change your own role.');
      return;
    }
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    setRoleChangeInfo({ id, name, targetRole });
  };

  const confirmRoleChange = async () => {
    if (!roleChangeInfo) return;
    const { id, targetRole } = roleChangeInfo;
    await Db.update<User>('users', id, { role: targetRole });
    // Refresh background content
    setUsers(await Db.getAll<User>('users'));
    toast.success(`Role updated to ${targetRole}`);
    setRoleChangeInfo(null);
  };

  const promptDelete = async (id: string) => {
    if (id === currentUser?.id) {
      toast.error('You cannot delete your own account.');
      return;
    }
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await Db.delete('users', deleteId);
      // Refresh background content
      setUsers(await Db.getAll<User>('users'));
      setDeleteId(null);
      toast.success('User deleted');
    }
  };

  const confirmResetPassword = async () => {
    if (!resetPasswordInfo || !newPassword) return;
    setIsResetting(true);
    await new Promise(r => setTimeout(r, 800));

    await Db.update<User>('users', resetPasswordInfo.id, { password: newPassword });
    toast.success(`Password reset for ${resetPasswordInfo.name}`);
    setResetPasswordInfo(null);
    setNewPassword('');
    setIsResetting(false);
  };

  if (isLoading) {
    return <Loading text="Scanning neural archives for user data..." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader />

      <TableMolecule
        data={users}
        columns={[
          {
            header: 'Name',
            cell: (u) => (
              <div className="font-medium">
                {u.name}
                {u.id === currentUser?.id && <Badge variant="outline" className="ml-2 text-[10px] h-4 border-brand-gold/30 text-brand-gold">You</Badge>}
              </div>
            )
          },
          { header: 'Email', accessorKey: 'email', className: 'text-muted-foreground' },
          {
            header: 'Role',
            cell: (u) => (
              <Badge variant="outline" className={u.role === 'admin' ? 'border-red-400/30 text-red-400 bg-red-400/10' : 'border-border'}>
                {u.role}
              </Badge>
            )
          },
          {
            header: 'Joined',
            cell: (u) => <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
          },
          {
            header: 'Actions',
            align: 'right',
            cell: (u) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-brand-gold h-8 w-8"
                  onClick={() => promptRoleChange(u.id, u.name, u.role)}
                  disabled={u.id === currentUser?.id}
                  title={u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                >
                  {u.role === 'admin' ? <ShieldAlert className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-brand-gold h-8 w-8"
                  onClick={() => setResetPasswordInfo({ id: u.id, name: u.name })}
                  title="Reset Password"
                >
                  <Key className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-400 h-8 w-8"
                  onClick={() => promptDelete(u.id)}
                  disabled={u.id === currentUser?.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          }
        ]}
        emptyDescription="No users found."
      />

      {/* Role Change Confirmation Modal */}
      <Modal
        isOpen={!!roleChangeInfo}
        onClose={() => setRoleChangeInfo(null)}
        variant="confirm"
        title="Confirm Role Change"
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setRoleChangeInfo(null)}>Cancel</Button>
            <Button className="bg-brand-gold hover:bg-brand-gold-light text-white" onClick={confirmRoleChange}>Confirm Change</Button>
          </div>
        )}
      >
        <p className="py-4 text-sm text-muted-foreground leading-relaxed text-center">
          Are you sure you want to change <span className="text-foreground font-medium">{roleChangeInfo?.name}&apos;s</span> role to <span className="text-brand-gold font-bold uppercase">{roleChangeInfo?.targetRole}</span>?
        </p>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        variant="confirm"
        title="Confirm Deletion"
        className='!max-w-100'
        headerClassName='!border-0'
        footerClassName='!border-0'
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        )}
      >
        <p>Are you sure you want to delete this user? This action cannot be undone.</p>
      </Modal>

      {/* Admin Password Reset Modal */}
      <Modal
        isOpen={!!resetPasswordInfo}
        onClose={() => {
          setResetPasswordInfo(null);
          setNewPassword('');
        }}
        variant="confirm"
        title="Admin Password Reset"
        footer={(
          <div className="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setResetPasswordInfo(null)}>Cancel</Button>
            <Button
              className="bg-brand-red hover:bg-brand-red/90 text-white"
              onClick={confirmResetPassword}
              disabled={!newPassword || isResetting}
            >
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset Password
            </Button>
          </div>
        )}
      >
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Enter a new password for <span className="text-foreground font-bold">{resetPasswordInfo?.name}</span>.
            The user will need to use this new password to login.
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1">New Password</label>
            <input
              type="text"
              placeholder="Enter new password"
              className="w-full px-4 h-11 bg-muted/30 border border-border/50 focus:border-brand-gold/50 transition-all rounded-xl outline-none text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
