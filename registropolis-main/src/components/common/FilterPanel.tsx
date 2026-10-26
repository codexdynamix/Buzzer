
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'range' | 'date';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterPanelProps {
  title?: string;
  description?: string;
  categories?: string[];
  filters: FilterOption[];
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
}

const FilterPanel = ({
  title = 'Filters',
  description = 'Refine your search results',
  categories = [],
  filters,
  onFilterChange,
  className,
}: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'All Categories');
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  
  const handleFilterChange = (id: string, value: any) => {
    const newValues = { ...filterValues, [id]: value };
    setFilterValues(newValues);
  };
  
  const applyFilters = () => {
    onFilterChange({ category: selectedCategory, ...filterValues });
    setIsOpen(false);
  };
  
  const resetFilters = () => {
    setSelectedCategory(categories[0] || 'All Categories');
    setFilterValues({});
    onFilterChange({ category: categories[0] || 'All Categories' });
  };

  return (
    <div className={cn('flex flex-col md:flex-row gap-4', className)}>
      {categories.length > 0 && (
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="ml-auto">
            <Filter className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[300px] sm:w-[450px]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <Label htmlFor={filter.id}>{filter.label}</Label>
                
                {filter.type === 'checkbox' && filter.options && (
                  <div className="space-y-2">
                    {filter.options.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`${filter.id}-${option.value}`} 
                          checked={filterValues[filter.id]?.includes(option.value)} 
                          onCheckedChange={(checked) => {
                            const currentValues = filterValues[filter.id] || [];
                            if (checked) {
                              handleFilterChange(filter.id, [...currentValues, option.value]);
                            } else {
                              handleFilterChange(
                                filter.id, 
                                currentValues.filter((v: string) => v !== option.value)
                              );
                            }
                          }}
                        />
                        <label 
                          htmlFor={`${filter.id}-${option.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                
                {filter.type === 'select' && filter.options && (
                  <Select 
                    value={filterValues[filter.id] || ''} 
                    onValueChange={(value) => handleFilterChange(filter.id, value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={`Select ${filter.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
                
                {filter.type === 'range' && filter.min !== undefined && filter.max !== undefined && (
                  <div className="space-y-4">
                    <Slider
                      min={filter.min}
                      max={filter.max}
                      step={filter.step || 1}
                      defaultValue={[filter.min, filter.max]}
                      value={filterValues[filter.id] || [filter.min, filter.max]}
                      onValueChange={(value) => handleFilterChange(filter.id, value)}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {filterValues[filter.id]?.[0] || filter.min}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {filterValues[filter.id]?.[1] || filter.max}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <SheetFooter className="flex flex-row gap-2 sm:justify-between pt-4">
            <Button variant="outline" onClick={resetFilters} className="flex-1">
              Reset
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FilterPanel;
