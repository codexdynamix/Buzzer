import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function encodeListingData(listing: any): string {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(listing)))); } catch { return ''; }
}

export function listingDetailPath(section: string, id: string | number, listing: any): string {
  return `/dashboard/${section}/${id}?d=${encodeListingData(listing)}`;
}
