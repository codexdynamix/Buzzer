
import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingDisplayProps {
  rating: number;
  reviews?: number;
  showCount?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const RatingDisplay = ({ 
  rating, 
  reviews = 0, 
  showCount = true, 
  className,
  size = 'md' 
}: RatingDisplayProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  const starSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex text-yellow-500">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} className={cn(starSize[size], 'fill-current')} />;
          } else if (i === fullStars && hasHalfStar) {
            return <StarHalf key={i} className={cn(starSize[size], 'fill-current')} />;
          } else {
            return <Star key={i} className={cn(starSize[size], 'text-muted-foreground/30')} />;
          }
        })}
      </div>
      {showCount && (
        <span className={cn('ml-1.5 text-muted-foreground', textSize[size])}>
          {rating.toFixed(1)} {reviews > 0 && `(${reviews})`}
        </span>
      )}
    </div>
  );
};

export default RatingDisplay;
