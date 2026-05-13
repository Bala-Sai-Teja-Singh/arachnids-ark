import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getProxiedImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  // If it's already a relative path, local image, or already proxied, return as is
  if (url.startsWith('/') || url.startsWith('data:') || url.includes('/api/image-proxy')) {
    return url;
  }

  // Handle Google Drive specifically because we need the thumbnail API bypass
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    const driveUrl = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w1000`;
    return `/api/image-proxy?url=${encodeURIComponent(driveUrl)}`;
  }

  // Proxy ALL other external images to bypass CORS and Referrer blocks
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
};
