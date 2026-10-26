
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from 'lucide-react';

type PropertyTypeMap = {
  [key: string]: string;
};

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  propertyTypeFilter: string;
  setPropertyTypeFilter: (type: string) => void;
  propertyTypes: PropertyTypeMap;
  onFilterClick?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  propertyTypeFilter,
  setPropertyTypeFilter,
  propertyTypes,
  onFilterClick
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by location, features, keywords..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onFilterClick}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex overflow-x-auto py-3 gap-2">
        {Object.entries(propertyTypes).map(([type, label]) => (
          <Button
            key={type}
            variant={propertyTypeFilter === type ? "default" : "outline"}
            size="sm"
            onClick={() => setPropertyTypeFilter(type)}
            className="whitespace-nowrap"
          >
            {label}
          </Button>
        ))}
      </div>
    </>
  );
};

export default FilterBar;
