
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, DollarSign, Phone, MessageSquare, Clock, Tag, Heart, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/badge';

// Product card component
const ProductCard = ({ 
  title, 
  price, 
  location, 
  category,
  postedTime,
  imageUrl,
  isUrgent = false
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  return (
    <motion.div 
      className="bg-card rounded-lg overflow-hidden border border-border"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
        {isUrgent && (
          <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
            Urgent Sale
          </Badge>
        )}
        <button 
          className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold line-clamp-1">{title}</h3>
          <p className="text-lg font-bold text-primary">${price}</p>
        </div>
        
        <div className="flex items-center text-muted-foreground mt-1 text-sm">
          <MapPin className="h-3.5 w-3.5 mr-1" />
          <span className="line-clamp-1">{location}</span>
        </div>
        
        <div className="flex justify-between mt-3 text-sm">
          <div className="flex items-center">
            <Tag className="h-3.5 w-3.5 mr-1" />
            <span>{category}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{postedTime}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button variant="default" size="sm" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const Marketplace = () => {
  // Sample products data - would come from API in real app
  const products = [
    {
      id: 1, 
      title: "iPhone 13 Pro - Like New",
      price: "799",
      location: "Downtown, West Avenue",
      category: "Electronics",
      postedTime: "2 hours ago",
      imageUrl: "https://images.unsplash.com/photo-1611791484670-ce19152b3be5?auto=format&fit=crop&w=800",
      isUrgent: true
    },
    {
      id: 2, 
      title: "Modern Leather Sofa",
      price: "450",
      location: "Riverside, East Boulevard",
      category: "Furniture",
      postedTime: "Yesterday",
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800",
      isUrgent: false
    },
    {
      id: 3, 
      title: "Mountain Bike - Trek X-Caliber",
      price: "350",
      location: "Hillside, North Street",
      category: "Sports & Outdoors",
      postedTime: "3 days ago",
      imageUrl: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800",
      isUrgent: false
    },
    {
      id: 4, 
      title: "Vintage Record Player",
      price: "120",
      location: "Arts District, South Lane",
      category: "Music & Instruments",
      postedTime: "1 week ago",
      imageUrl: "https://images.unsplash.com/photo-1617444114042-c683cecf122e?auto=format&fit=crop&w=800",
      isUrgent: false
    },
    {
      id: 5, 
      title: "Professional DSLR Camera",
      price: "980",
      location: "Media Center, Main Road",
      category: "Electronics",
      postedTime: "Just now",
      imageUrl: "https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=800",
      isUrgent: true
    },
    {
      id: 6, 
      title: "Wooden Dining Table with 4 Chairs",
      price: "210",
      location: "Suburb Area, Pine Street",
      category: "Furniture",
      postedTime: "3 days ago",
      imageUrl: "https://images.unsplash.com/photo-1591464513421-d835bafc5547?auto=format&fit=crop&w=800",
      isUrgent: false
    },
    {
      id: 7, 
      title: "Gaming PC - i7, RTX 3080",
      price: "1450",
      location: "Tech District, Computer Avenue",
      category: "Electronics",
      postedTime: "Yesterday",
      imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800",
      isUrgent: false
    },
    {
      id: 8, 
      title: "Acoustic Guitar - Gibson",
      price: "499",
      location: "Music Quarter, Melody Street",
      category: "Music & Instruments",
      postedTime: "5 days ago",
      imageUrl: "https://images.unsplash.com/photo-1588449668365-d15e397f6787?auto=format&fit=crop&w=800",
      isUrgent: false
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 overflow-auto pl-64">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Marketplace</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="default" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Sell an Item
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search for items..." 
              className="pl-10 py-6"
            />
          </div>
          
          {/* Category tabs */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            <Button variant="default" className="rounded-full">All Items</Button>
            <Button variant="outline" className="rounded-full">Electronics</Button>
            <Button variant="outline" className="rounded-full">Furniture</Button>
            <Button variant="outline" className="rounded-full">Vehicles</Button>
            <Button variant="outline" className="rounded-full">Fashion</Button>
            <Button variant="outline" className="rounded-full">Sports</Button>
            <Button variant="outline" className="rounded-full">Pets</Button>
          </div>
          
          {/* Urgent sales section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Urgent Sales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.filter(p => p.isUrgent).map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          </div>
          
          {/* All products section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button variant="outline">Load More</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
