import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodeListingData(listing: any): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(listing)))); } catch { return ''; }
}

export function normalizeListingSection(section: string): string {
  switch (section) {
    case 'job': return 'jobs';
    case 'service': return 'services';
    case 'event': return 'events';
    default: return section;
  }
}

export function listingDetailPath(section: string, id: string | number, listing: any): string {
  return `/dashboard/${normalizeListingSection(section)}/${id}?d=${encodeListingData(listing)}`;
}
