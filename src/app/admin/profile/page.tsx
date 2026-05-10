'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Loader2, Camera, Mail, Phone, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    
    // Sanitize phone number: remove non-digits and leading 91
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    }

    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error('Mobile number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    updateProfile({ name, email, phone: cleanPhone, avatar });
    setPhone(cleanPhone);
    toast.success('Admin profile updated successfully');
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      setUploading(false);
      toast.success('Image preview updated');
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin Profile</h1>
        <p className="text-muted-foreground">Manage your administrator account credentials and information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <Card className="md:col-span-1 border-border h-fit">
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative group mb-4">
              <Avatar className="h-32 w-32 border-4 border-brand-red/10">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-brand-red text-white text-4xl font-black">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="admin-avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer border-2 border-white/20"
              >
                <Camera className="h-8 w-8 text-white" />
              </label>
              <input 
                id="admin-avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg">{name}</h3>
              <p className="text-xs text-brand-red font-bold uppercase tracking-widest bg-brand-red/10 px-3 py-1 rounded-full">
                Administrator
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Edit Form */}
        <Card className="md:col-span-2 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-brand-gold" /> Account Details
            </CardTitle>
            <CardDescription>Update your login email and personal details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-name" className="flex items-center gap-2">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                  </Label>
                  <Input
                    id="admin-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-phone" className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone Number
                  </Label>
                  <Input
                    id="admin-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Login Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 font-medium"
                  required
                />
                <p className="text-[10px] text-muted-foreground italic">Warning: Changing this will require you to log in with the new email next time.</p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full bg-brand-red hover:bg-brand-red-light text-white font-bold h-11 shadow-lg shadow-brand-red/20">
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : 'Save Admin Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
