'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, Route, User, Target, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/tours', icon: Route, label: 'Tournées' },
  { href: '/pipeline', icon: Target, label: 'Pipeline' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export default function MobileNav() {
  const pathname = usePathname();

  // Hide on tour pages and login
  if (pathname?.startsWith('/tour/') || pathname === '/login') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50" />
      
      {/* Content */}
      <div className="relative flex items-stretch h-16 safe-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5",
                "transition-all duration-200 active:scale-95",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-colors",
                isActive && "bg-primary/10"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "stroke-[2.5px]"
                )} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
