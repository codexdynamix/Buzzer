import React from 'react';
import { 
  MessageSquare, ShoppingCart, Navigation, Coffee, 
  Briefcase, Car, Building, Calendar, Truck, 
  Hammer, Wrench, Video, Users, Plane, GraduationCap,
  Hotel, HeartPulse, Music, Utensils, ShoppingBag,
  ShieldCheck, Map, CreditCard, Handshake, DollarSign,
  Landmark, Home, Laptop, FileText, ThumbsUp, Phone
} from 'lucide-react';

export const featureSections = [
  {
    title: "Communication",
    features: [
      { icon: <MessageSquare className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />, name: "Messaging", description: "Connect with friends & businesses" },
      { icon: <Users className="w-6 h-6 text-orange-500 mt-1 flex-shrink-0" />, name: "Group Chats", description: "Create communities around interests" },
      { icon: <Video className="w-6 h-6 text-lime-500 mt-1 flex-shrink-0" />, name: "Video Calls", description: "Connect face-to-face with WebRTC" },
      { icon: <Phone className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />, name: "Voice Calls", description: "Clear audio communication" }
    ]
  },
  {
    title: "Business & Commerce",
    features: [
      { icon: <ShoppingCart className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />, name: "Marketplace", description: "Buy and sell within the community" },
      { icon: <Briefcase className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />, name: "Jobs", description: "Find work and hire talent" },
      { icon: <FileText className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />, name: "Job Applications", description: "Apply with integrated resume" },
      { icon: <Handshake className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" />, name: "Networking", description: "Build professional connections" },
      { icon: <ShoppingBag className="w-6 h-6 text-rose-500 mt-1 flex-shrink-0" />, name: "Local Shopping", description: "Discover nearby shops and products" }
    ]
  },
  {
    title: "Professional Services",
    features: [
      { icon: <Wrench className="w-6 h-6 text-fuchsia-500 mt-1 flex-shrink-0" />, name: "Services", description: "Find professionals for any job" },
      { icon: <Laptop className="w-6 h-6 text-sky-600 mt-1 flex-shrink-0" />, name: "Freelance", description: "Offer your skills on demand" },
      { icon: <Hammer className="w-6 h-6 text-violet-500 mt-1 flex-shrink-0" />, name: "Auctions", description: "Bid on unique items and services" },
      { icon: <ThumbsUp className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />, name: "Ratings & Reviews", description: "Trust through transparency" },
      { icon: <DollarSign className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />, name: "Payment System", description: "Secure transactions" }
    ]
  },
  {
    title: "Mobility & Transport",
    features: [
      { icon: <Car className="w-6 h-6 text-yellow-500 mt-1 flex-shrink-0" />, name: "Taxi Services", description: "Request rides with price negotiation" },
      { icon: <Truck className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />, name: "Transport", description: "Book freight and logistics services" },
      { icon: <Plane className="w-6 h-6 text-sky-500 mt-1 flex-shrink-0" />, name: "Travel", description: "Plan trips and find travel companions" },
      { icon: <Map className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />, name: "Navigation", description: "Interactive maps and directions" }
    ]
  },
  {
    title: "Real Estate & Living",
    features: [
      { icon: <Building className="w-6 h-6 text-emerald-500 mt-1 flex-shrink-0" />, name: "Real Estate", description: "Find properties to buy or rent" },
      { icon: <Home className="w-6 h-6 text-cyan-600 mt-1 flex-shrink-0" />, name: "Housing", description: "Share apartments and find roommates" },
      { icon: <Hotel className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />, name: "Accommodations", description: "Find short and long-term stays" },
      { icon: <Landmark className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />, name: "Investment", description: "Property investment opportunities" }
    ]
  },
  {
    title: "Food & Dining",
    features: [
      { icon: <Coffee className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />, name: "Food Delivery", description: "Order from local restaurants" },
      { icon: <Utensils className="w-6 h-6 text-pink-500 mt-1 flex-shrink-0" />, name: "Dining", description: "Discover and book local restaurants" },
      { icon: <CreditCard className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />, name: "Reservations", description: "Book tables in advance" }
    ]
  },
  {
    title: "Community & Lifestyle",
    features: [
      { icon: <Calendar className="w-6 h-6 text-cyan-500 mt-1 flex-shrink-0" />, name: "Events", description: "Discover and create local events" },
      { icon: <HeartPulse className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />, name: "Healthcare", description: "Connect with local healthcare providers" },
      { icon: <GraduationCap className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />, name: "Education", description: "Find tutors and learning resources" },
      { icon: <ShieldCheck className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />, name: "Community Safety", description: "Stay informed about local safety" },
      { icon: <Music className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />, name: "Entertainment", description: "Discover local entertainment options" }
    ]
  }
];
