'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  Route, 
  User, 
  Target, 
  BarChart3, 
  Settings,
  LogOut,
  Shield,
  UserPlus,
  ClipboardList,
  Package,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/tours', icon: Route, label: 'Tournées' },
  { href: '/pipeline', icon: Target, label: 'Pipeline' },
  { href: '/products', icon: Package, label: 'Produits' },
  { href: '/gamification', icon: Trophy, label: 'Objectifs' },
];

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', icon: BarChart3, label: 'Dashboard', adminOnly: true },
  { href: '/admin/users', icon: UserPlus, label: 'Utilisateurs', adminOnly: true },
  { href: '/admin/assignments', icon: ClipboardList, label: 'Assignations', adminOnly: true },
  { href: '/admin/requests', icon: ClipboardList, label: 'Demandes', adminOnly: true },
];

export default function DesktopSidebar() {
  const pathname = usePathname();
  const { currentUser, isAdmin, logout } = useUser();

  // Hide on tour pages and login
  if (pathname?.startsWith('/tour/') || pathname === '/login') {
    return null;
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 border-r bg-card">
      {/* Logo */}
      <div className="h-16 px-4 flex items-center gap-3 border-b">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex-center shadow-lg shadow-blue-500/20">
          <Route className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Clozer</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isAdmin && <Shield className="w-3 h-3" />}
            {isAdmin ? 'Admin' : 'Commercial'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Main Nav */}
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" size="sm">{item.badge}</Badge>
                )}
                {isActive && <ChevronRight className="w-4 h-4" />}
              </div>
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            </div>
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                    <span className="flex-1">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-2">
        {/* User Info */}
        <Link href="/profile">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
            </div>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
