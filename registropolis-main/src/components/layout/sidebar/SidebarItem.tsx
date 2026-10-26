import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  isCollapsed: boolean;
  isActive?: boolean;
  subItems?: { title: string; href: string }[];
  badge?: string;
  isNew?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon, title, href, isCollapsed, isActive, subItems, badge, isNew = false, onClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubItems = subItems && subItems.length > 0;
  const location = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className="w-full" data-testid={`sidebar-item-${title?.toLowerCase() ?? 'item'}`}>
      <Link
        to={href}
        className={cn(
          'group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 w-full relative select-none',
          isActive
            ? 'bg-primary/8 text-primary [&_svg]:text-primary'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 [&_svg]:text-slate-400 hover:[&_svg]:text-slate-600'
        )}
        style={isActive ? { backgroundColor: 'color-mix(in srgb, hsl(var(--primary)) 8%, transparent)' } : undefined}
        onClick={handleClick}
      >
        <div className={cn('relative flex-shrink-0', isCollapsed ? 'mx-auto' : '')}>
          {icon}
          {badge && isCollapsed && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">
              {parseInt(badge) > 9 ? '9+' : badge}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{title}</span>
            {isNew && (
              <span className="text-[10px] font-semibold bg-primary text-white px-1.5 py-0.5 rounded-full leading-none">
                New
              </span>
            )}
            {badge && (
              <span className={cn(
                'text-[11px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none',
                isActive ? 'bg-primary text-white' : 'bg-red-500 text-white'
              )}>
                {parseInt(badge) > 99 ? '99+' : badge}
              </span>
            )}
            {hasSubItems && (
              <ChevronRight
                className={cn('h-3.5 w-3.5 text-slate-400 transition-transform duration-150', isOpen && 'rotate-90')}
              />
            )}
          </>
        )}
      </Link>

      {hasSubItems && isOpen && !isCollapsed && (
        <div className="pl-8 mt-0.5 space-y-0.5">
          {subItems!.map((item, idx) => (
            <Link
              key={idx}
              to={item.href}
              className={cn(
                'block px-3 py-1.5 rounded-lg text-sm transition-colors',
                location.pathname === item.href
                  ? 'text-primary font-medium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              )}
              onClick={onClick}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
