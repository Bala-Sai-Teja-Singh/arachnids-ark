'use client';

import { useAuthStore } from '@/store/auth-store';
import { ProfileTemplate } from '@/components/shared/templates/profile-template';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuthStore();

  if (!user) return null;

  return (
    <ProfileTemplate 
      user={user} 
      updateProfile={updateProfile}
      changePassword={changePassword}
    />
  );
}
