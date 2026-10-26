
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import PropertyCard, { PropertyListing } from './PropertyCard';
import Pagination from './Pagination';

interface PropertyGridProps {
  properties: PropertyListing[];
  isLoading?: boolean;
  onFavorite?: (id: string) => void;
  onShare?: (id: string) => void;
  itemsPerPage?: number;
}

const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  isLoading = false,
  onFavorite,
  onShare,
  itemsPerPage = 6
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedProperties, setPaginatedProperties] = useState<PropertyListing[]>([]);
  const totalPages = Math.ceil(properties.length / itemsPerPage);

  useEffect(() => {
    // Reset to first page when properties change
    setCurrentPage(1);
  }, [properties]);

  useEffect(() => {
    // Calculate paginated items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedProperties(properties.slice(startIndex, endIndex));
  }, [properties, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of grid
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="h-60 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (properties.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-muted-foreground">No properties found matching your search criteria.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedProperties.map(property => (
          <PropertyCard 
            key={property.id} 
            property={property} 
            onFavorite={onFavorite} 
            onShare={onShare} 
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default PropertyGrid;
