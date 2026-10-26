
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  isVerified: boolean;
  type?: 'badge' | 'icon';
  className?: string;
  tooltipText?: string;
}

const VerificationBadge = ({
  isVerified,
  type = 'badge',
  className,
  tooltipText = 'This listing has been verified for authenticity'
}: VerificationBadgeProps) => {
  if (!isVerified) return null;
  
  if (type === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCircle2 className={cn('h-4 w-4 text-primary', className)} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={cn('flex items-center gap-1', className)}>
            <CheckCircle2 className="h-3 w-3" />
            <span>Verified</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge;
