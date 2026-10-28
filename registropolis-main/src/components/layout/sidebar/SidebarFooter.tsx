import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Settings, LogOut, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import SidebarItem from './SidebarItem';
import { useAuth } from '@/context/AuthContext';
import { isStaffRole } from '@/config/adminAccess';

interface SidebarFooterProps {
  isCollapsed: boolean;
  onItemClick: () => void;
  signOut: () => void;
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({ isCollapsed, onItemClick, signOut }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isStaffAccount = isStaffRole(user?.staffRole) || user?.role === 'moderator';

  return (
    <div className="border-t border-slate-100 px-2 py-3 space-y-1">
      <SidebarItem
        icon={<Settings size={18} />}
        title="Settings"
        href="/dashboard/settings"
        isCollapsed={isCollapsed}
        isActive={location.pathname === '/dashboard/settings'}
        onClick={onItemClick}
      />

      {isAuthenticated && user ? (
        <>
          {!isCollapsed && (
            <div className="mx-1 mt-1">
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2.5 transition-colors hover:bg-slate-100 text-left"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden',
                  isStaffAccount
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-indigo-400 to-violet-500'
                )}>
                  {user.profileImageUrl
                    ? <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    : (user.name?.[0] ?? 'U')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize mt-0.5">View profile</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); signOut(); }}
                  className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </button>
            </div>
          )}
          {isCollapsed && (
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              title="Profile & Settings"
            >
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden',
                isStaffAccount
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : 'bg-gradient-to-br from-indigo-400 to-violet-500'
              )}>
                {user.profileImageUrl
                  ? <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  : (user.name?.[0] ?? 'U')}
              </div>
            </button>
          )}
        </>
      ) : (
        <div className={cn('space-y-1 mt-1', !isCollapsed && 'px-1')}>
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Sign In
            </p>
          )}

          <button
            onClick={() => navigate('/auth')}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:bg-green-50 hover:text-green-700 group',
              isCollapsed && 'justify-center'
            )}
            title="Sign in with WhatsApp"
          >
            <Phone size={17} className="flex-shrink-0 text-green-500 group-hover:text-green-600" />
            {!isCollapsed && <span className="flex-1 text-left">Sign in with Phone</span>}
          </button>

          <button
            onClick={() => navigate('/auth?method=email')}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 group',
              isCollapsed && 'justify-center'
            )}
            title="Sign in with Email"
          >
            <Mail size={17} className="flex-shrink-0 text-indigo-400 group-hover:text-indigo-600" />
            {!isCollapsed && <span className="flex-1 text-left">Sign in with Email</span>}
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;
