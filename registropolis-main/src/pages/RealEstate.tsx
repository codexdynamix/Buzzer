
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Heart, Share2, Filter, Home, Building, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/badge';

// Property card component
const PropertyCard = ({ 
  title, 
  price, 
  location, 
  beds, 
  baths, 
  area, 
  imageUrl,
  isFeatured = false
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  
  return (
    <motion.div 
      className="bg-card rounded-lg overflow-hidden shadow-md"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
        {isFeatured && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
            Featured
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
            <Home className="h-3.5 w-3.5 mr-1" />
            <span>{beds} beds</span>
          </div>
          <div className="flex items-center">
            <span>{baths} baths</span>
          </div>
          <div className="flex items-center">
            <span>{area} m²</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="flex-1">
            Contact
          </Button>
          <Button variant="outline" size="sm" className="w-9 p-0">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const RealEstate = () => {
  // Sample properties data - would come from API in real app
  const properties = [
    {
      id: 1, 
      title: "Modern Apartment with Ocean View",
      price: "1,200",
      location: "Downtown, Seaview District",
      beds: 2,
      baths: 1,
      area: 75,
      imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800",
      isFeatured: true
    },
    {
      id: 2, 
      title: "Spacious Family Home with Garden",
      price: "2,500",
      location: "Suburban Area, Green Valley",
      beds: 4,
      baths: 2,
      area: 150,
      imageUrl: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800",
      isFeatured: false
    },
    {
      id: 3, 
      title: "Luxury Penthouse in City Center",
      price: "3,800",
      location: "Financial District, Highrise Avenue",
      beds: 3,
      baths: 2,
      area: 120,
      imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800",
      isFeatured: true
    },
    {
      id: 4, 
      title: "Cozy Studio for Young Professionals",
      price: "800",
      location: "University District, Knowledge Street",
      beds: 1,
      baths: 1,
      area: 45,
      imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800",
      isFeatured: false
    },
    {
      id: 5, 
      title: "Beachfront Villa with Private Pool",
      price: "5,500",
      location: "Coastal Area, Beach Boulevard",
      beds: 5,
      baths: 4,
      area: 280,
      imageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800",
      isFeatured: true
    },
    {
      id: 6, 
      title: "Rustic Countryside Cottage",
      price: "1,700",
      location: "Rural District, Nature Road",
      beds: 3,
      baths: 1,
      area: 90,
      imageUrl: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800",
      isFeatured: false
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 overflow-auto pl-64">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Real Estate</h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                <MapPin className="w-4 h-4 mr-2" />
                Map View
              </Button>
              <Button variant="default" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Post Listing
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by location, property type, price..." 
              className="pl-10 py-6"
            />
          </div>
          
          {/* Category tabs */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            <Button variant="default" className="rounded-full">All Properties</Button>
            <Button variant="outline" className="rounded-full">For Rent</Button>
            <Button variant="outline" className="rounded-full">For Sale</Button>
            <Button variant="outline" className="rounded-full">Apartments</Button>
            <Button variant="outline" className="rounded-full">Houses</Button>
            <Button variant="outline" className="rounded-full">Commercial</Button>
          </div>
          
          {/* Featured section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Featured Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.filter(p => p.isFeatured).map(property => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          </div>
          
          {/* All properties section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map(property => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealEstate;
