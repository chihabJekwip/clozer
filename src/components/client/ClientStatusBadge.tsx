'use client';

import { ClientStatus, AvailabilityProfile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, Briefcase, Home } from 'lucide-react';

interface ClientStatusBadgeProps {
  status: ClientStatus;
  availabilityProfile?: AvailabilityProfile;
  showAvailability?: boolean;
  size?: 'sm' | 'default';
}

export default function ClientStatusBadge({
  status,
  availabilityProfile,
  showAvailability = false,
  size = 'default',
}: ClientStatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0' : '';
  
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Status badge */}
      {status === 'active' ? (
        <Badge variant="success" className={sizeClasses}>
          <UserCheck className={`mr-1 ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          Actif
        </Badge>
      ) : (
        <Badge variant="secondary" className={`bg-gray-200 text-gray-600 ${sizeClasses}`}>
          <UserX className={`mr-1 ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          Inactif
        </Badge>
      )}
      
      {/* Availability profile badge */}
      {showAvailability && availabilityProfile && (
        <>
          {availabilityProfile === 'retired' ? (
            <Badge variant="info" className={sizeClasses}>
              <Home className={`mr-1 ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
              Retraité
            </Badge>
          ) : (
            <Badge variant="warning" className={sizeClasses}>
              <Briefcase className={`mr-1 ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
              Actif (17h30+)
            </Badge>
          )}
        </>
      )}
    </div>
  );
}

// Inline badge for lists - just the icon
export function ClientStatusIcon({
  status,
  className = '',
}: {
  status: ClientStatus;
  className?: string;
}) {
  if (status === 'active') {
    return <UserCheck className={`w-4 h-4 text-green-600 ${className}`} />;
  }
  return <UserX className={`w-4 h-4 text-gray-400 ${className}`} />;
}

// Availability icon only
export function AvailabilityIcon({
  profile,
  className = '',
}: {
  profile: AvailabilityProfile;
  className?: string;
}) {
  if (!profile) return null;
  
  if (profile === 'retired') {
    return (
      <span title="Retraité">
        <Home className={`w-4 h-4 text-blue-500 ${className}`} />
      </span>
    );
  }
  return (
    <span title="Actif (après 17h30)">
      <Briefcase className={`w-4 h-4 text-orange-500 ${className}`} />
    </span>
  );
}
