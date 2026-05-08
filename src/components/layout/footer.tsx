import Link from 'next/link';
import { Bug, Mail, MapPin, Phone, Link as LinkIcon, Globe, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-red to-brand-red-light flex items-center justify-center">
                <span className="text-white font-bold text-sm">AA</span>
              </div>
              <span className="text-lg font-bold">
                Arachnids<span className="text-gradient">Ark</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your premier destination for exotic tarantulas, expert care guidance, and professional consultation services.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center hover:bg-brand-red/20 transition-colors">
                <LinkIcon className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center hover:bg-brand-red/20 transition-colors">
                <Globe className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center hover:bg-brand-red/20 transition-colors">
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-gold text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Shop Tarantulas', href: '/shop' },
                { label: 'Courses', href: '/courses' },
                { label: 'Consultation', href: '/consultation' },
                { label: 'Care Guides', href: '/care-guides' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-brand-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-gold text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'My Dashboard', href: '/dashboard' },
                { label: 'Track Orders', href: '/dashboard/inquiries' },
                { label: 'FAQs', href: '/#faq' },
                { label: 'Shipping Info', href: '#' },
              ].map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-brand-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-gold text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-brand-red" />
                info@arachnidsark.com
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-brand-red" />
                +91 98765 43210
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-brand-red mt-0.5" />
                Bangalore, Karnataka, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ArachnidsArk. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-brand-gold transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
