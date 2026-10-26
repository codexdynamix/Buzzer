import {
  Home,
  MessageCircle,
  ShoppingBag,
  Briefcase,
  Wrench,
  Building2,
  Truck,
  Calendar,
  LayoutList,
  Heart,
  Clock,
  Shield,
  BellRing,
  Play,
} from 'lucide-react';

export const mainMenuItems = [
  {
    title: 'Home',
    icon: Home,
    href: '/dashboard/home',
  },
  {
    title: 'Reels',
    icon: Play,
    href: '/dashboard/reels',
    badge: 'NEW',
  },
  {
    title: 'Messages',
    icon: MessageCircle,
    href: '/dashboard/messages',
  },
  {
    title: 'Marketplace',
    icon: ShoppingBag,
    href: '/dashboard/marketplace',
  },
  {
    title: 'Jobs',
    icon: Briefcase,
    href: '/dashboard/jobs',
  },
  {
    title: 'Services',
    icon: Wrench,
    href: '/dashboard/services',
  },
  {
    title: 'Real Estate',
    icon: Building2,
    href: '/dashboard/real-estate',
  },
  {
    title: 'Transport',
    icon: Truck,
    href: '/dashboard/transport',
  },
  {
    title: 'Events',
    icon: Calendar,
    href: '/dashboard/events',
  },
  {
    title: 'My Listings',
    icon: LayoutList,
    href: '/dashboard/my-listings',
  },
  {
    title: 'Saved',
    icon: Heart,
    href: '/dashboard/saved',
  },
  {
    title: 'Price Alerts',
    icon: BellRing,
    href: '/dashboard/price-alerts',
  },
  {
    title: 'Recently Viewed',
    icon: Clock,
    href: '/dashboard/recently-viewed',
  },
  {
    title: 'Admin',
    icon: Shield,
    href: '/admin',
    adminOnly: true,
  },
];
