'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Camera, Mail, UserCircle, Phone, Shield, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormBuilder, type FormFieldConfig } from '@/components/shared/organisms/form-builder';

// Define the validation schema
export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine((val) => {
    const clean = val.replace(/\D/g, '');
    return clean.length === 10 || clean.length === 0;
  }, "Mobile number must be exactly 10 digits"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileTemplateProps {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role?: string;
  };
  updateProfile: (data: Partial<{ name: string; email: string; phone: string; avatar: string }>) => void;
  title?: string;
  description?: string;
  isAdmin?: boolean;
}

export function ProfileTemplate({ 
  user, 
  updateProfile, 
  title = "Profile Settings", 
  description = "Standardize your personal presence across the platform",
  isAdmin = false 
}: ProfileTemplateProps) {
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      leftIcon: <UserCircle className="h-4 w-4" />,
      required: true,
      gridSpan: 'col-span-2'
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email',
      leftIcon: <Mail className="h-4 w-4" />,
      required: true,
      gridSpan: 'col-span-2'
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      placeholder: '10-digit mobile number',
      leftIcon: <Phone className="h-4 w-4" />,
      description: "Enter 10 digits (we'll sanitize it automatically)",
      gridSpan: 'col-span-2'
    }
  ];

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 800));

    // Sanitize phone
    let cleanPhone = values.phone.replace(/\D/g, '');
    if (cleanPhone.length > 10 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.substring(2);
    }

    updateProfile({ 
      name: values.name, 
      email: values.email,
      phone: cleanPhone, 
      avatar 
    });

    toast.success('Profile updated successfully');
    setIsSubmitting(false);
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

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 px-4">

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-border overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-3 font-bold uppercase tracking-widest text-brand-gold">
              {isAdmin ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />} 
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            
            {/* Avatar Selection Molecule */}
            <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-muted/10 border border-dashed border-border/50 group/avatar">
              <div className="relative">
                <Avatar className={cn(
                  "h-32 w-32 border-4 shadow-2xl transition-transform duration-500 group-hover/avatar:scale-105",
                  isAdmin ? "border-brand-red/20" : "border-brand-gold/20"
                )}>
                  <AvatarImage src={avatar} />
                  <AvatarFallback className={cn(
                    "text-white text-4xl font-black",
                    isAdmin ? "bg-brand-red" : "bg-brand-gold text-black"
                  )}>
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 rounded-full cursor-pointer backdrop-blur-sm"
                >
                  <Camera className="h-8 w-8 text-brand-gold animate-in zoom-in" />
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </div>
              <div className="text-center space-y-1">
                <h4 className="font-bold text-foreground">Profile Picture</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">JPG, PNG or WEBP • Max 2MB</p>
              </div>
            </div>

            <FormBuilder
              schema={profileSchema}
              defaultValues={{
                name: user.name,
                email: user.email,
                phone: user.phone || ''
              }}
              fields={fields}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              submitLabel={isAdmin ? "Save Admin Profile" : "Save Profile Changes"}
              className="space-y-6"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Internal cn helper for the template
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
