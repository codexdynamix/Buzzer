import { apiRequest } from './apiService';

export type ListingInteractionType = 'view' | 'like' | 'save' | 'share' | 'inquiry';

export interface ListingEngagementStats {
  views: number;
  likes: number;
  saves: number;
  shares: number;
  inquiries: number;
  liked: boolean;
  saved: boolean;
}

export interface ListingCustomerLead {
  id: string;
  name: string;
  profileImageUrl?: string;
  createdAt: string;
}

export interface ListingEngagement {
  stats: ListingEngagementStats;
  customers?: ListingCustomerLead[];
}

function isEngagementStats(value: unknown): value is ListingEngagementStats {
  if (!value || typeof value !== 'object') return false;
  const stats = value as Record<keyof ListingEngagementStats, unknown>;
  return ['views', 'likes', 'saves', 'shares', 'inquiries'].every(key => typeof stats[key as keyof ListingEngagementStats] === 'number') &&
    typeof stats.liked === 'boolean' &&
    typeof stats.saved === 'boolean';
}

export const listingEngagementAPI = {
  async get(listingId: string): Promise<ListingEngagement> {
    const response = await apiRequest(`/listings/${encodeURIComponent(listingId)}/engagement`, 'GET', undefined, false);
    if (!isEngagementStats(response.stats)) throw new Error('The server returned invalid listing engagement');
    return {
      stats: response.stats,
      customers: Array.isArray(response.customers) ? response.customers : undefined,
    };
  },

  async record(listingId: string, type: ListingInteractionType, active?: boolean): Promise<ListingEngagementStats> {
    const response = await apiRequest(
      `/listings/${encodeURIComponent(listingId)}/interactions`,
      'POST',
      { type, ...(active === undefined ? {} : { active }) },
    );
    if (!isEngagementStats(response.stats)) throw new Error('The server returned invalid listing engagement');
    return response.stats;
  },

  async report(listingId: string, reason: string, details: string): Promise<void> {
    const response = await apiRequest('/listing-reports', 'POST', { listingId, reason, details });
    if (response.success !== true) throw new Error('The server could not confirm the report submission');
  },
};
