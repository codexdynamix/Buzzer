import { apiRequest } from './apiService';

export type SellerOrderStatus = 'new' | 'confirmed' | 'fulfilled' | 'cancelled';

export interface SellerOrder {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  price: number;
  status: SellerOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStore {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  website: string;
  contactPhone: string;
  email: string;
  location: string;
  listingCount: number;
}

export interface PublicStoreListing {
  id: string;
  section: string;
  data: Record<string, unknown>;
  userId: string;
  status: string;
  createdAt: string;
  promotionEndAt?: string;
}

export interface SellerAnalytics {
  periodDays: number;
  totals: { views: number; inquiries: number; saves: number; shares: number };
  daily: Array<{ date: string; views: number; inquiries: number; saves: number; shares: number }>;
  topListings: Array<{
    listingId: string;
    title: string;
    status: string;
    views: number;
    inquiries: number;
    saves: number;
    shares: number;
  }>;
}

export const sellerWorkspaceAPI = {
  async getAnalytics(): Promise<SellerAnalytics> {
    const response = await apiRequest('/seller/analytics');
    const analytics = response.analytics as SellerAnalytics | undefined;
    if (!analytics || !Array.isArray(analytics.daily) || !Array.isArray(analytics.topListings)) {
      throw new Error('The server returned invalid seller analytics');
    }
    return analytics;
  },

  async getOrders(): Promise<SellerOrder[]> {
    const response = await apiRequest('/orders/mine');
    if (!Array.isArray(response.orders)) throw new Error('The server returned an invalid seller orders list');
    return response.orders as SellerOrder[];
  },

  async createOrder(input: { listingId: string; buyerId: string; price: number }): Promise<SellerOrder> {
    const response = await apiRequest('/orders', 'POST', input);
    const order = response.order as SellerOrder | undefined;
    if (!order || typeof order.id !== 'string') {
      throw new Error('The server did not return the created order');
    }
    return order;
  },

  async updateOrderStatus(orderId: string, status: SellerOrderStatus): Promise<SellerOrder> {
    const response = await apiRequest(`/orders/${encodeURIComponent(orderId)}/status`, 'PATCH', { status });
    const order = response.order as SellerOrder | undefined;
    if (!order || typeof order.id !== 'string') {
      throw new Error('The server did not return the updated order');
    }
    return order;
  },

  async setFeatured(listingId: string, active: boolean): Promise<string | undefined> {
    const response = await apiRequest(`/listings/${encodeURIComponent(listingId)}/promotion`, 'PATCH', { active });
    if (response.success !== true) throw new Error('The server could not update listing promotion');
    return typeof response.promotionEndAt === 'string' ? response.promotionEndAt : undefined;
  },

  async getPublicStore(slug: string): Promise<{ store: PublicStore; listings: PublicStoreListing[] }> {
    const response = await apiRequest(`/stores/${encodeURIComponent(slug)}`, 'GET', undefined, false);
    const store = response.store as PublicStore | undefined;
    if (!store || !Array.isArray(response.listings)) {
      throw new Error('The server returned an invalid storefront');
    }
    return {
      store,
      listings: response.listings as PublicStoreListing[],
    };
  },
};
