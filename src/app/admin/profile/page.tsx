'use client';

import { useAuthStore } from '@/store/auth-store';
import { ProfileTemplate } from '@/components/shared/templates/profile-template';

export default function AdminProfilePage() {
  const { user, updateProfile } = useAuthStore();

  if (!user) return null;

  return (
    <ProfileTemplate 
      user={user} 
      updateProfile={updateProfile}
      title="Admin Profile"
      description="Manage your administrator account credentials and information."
      isAdmin={true}
    />
  );
}
