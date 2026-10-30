export interface MarketplaceListing {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  condition?: string;
  location?: string;
  seller: string;
  sellerRating?: number;
  verified?: boolean;
  category?: string;
  saved?: boolean;
  timeAgo?: string;
  image?: string;
}
