'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Users, Route, User, Settings } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/tours', icon: Route, label: 'Tournées' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export default function MobileNav() {
  const pathname = usePathname();

  // Ne pas afficher si on est sur une page de tournée en cours
  if (pathname?.startsWith('/tour/')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center flex-1 h-full px-2
                transition-colors touch-manipulation
                ${isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 active:text-gray-900'
                }
              `}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
