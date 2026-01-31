'use client';

import { AvailabilityProfile } from '@/types';
import { Label } from '@/components/ui/label';
import {
  Home,
  Briefcase,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface AvailabilityProfileSelectorProps {
  value: AvailabilityProfile;
  onChange: (value: AvailabilityProfile) => void;
  disabled?: boolean;
}

export default function AvailabilityProfileSelector({
  value,
  onChange,
  disabled = false,
}: AvailabilityProfileSelectorProps) {
  const options = [
    {
      id: 'retired' as const,
      label: 'Retraité',
      description: 'Disponible en journée',
      icon: Home,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-500',
      iconColor: 'text-blue-600',
    },
    {
      id: 'working' as const,
      label: 'Actif (travailleur)',
      description: 'Privilégier après 17h30',
      icon: Briefcase,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      selectedColor: 'bg-orange-100 border-orange-500 ring-2 ring-orange-500',
      iconColor: 'text-orange-600',
    },
    {
      id: null,
      label: 'Non renseigné',
      description: 'Horaire standard',
      icon: HelpCircle,
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      selectedColor: 'bg-gray-100 border-gray-500 ring-2 ring-gray-500',
      iconColor: 'text-gray-500',
    },
  ];

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Profil de disponibilité
      </Label>
      
      <div className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          
          return (
            <button
              key={option.id ?? 'null'}
              type="button"
              onClick={() => !disabled && onChange(option.id)}
              disabled={disabled}
              className={`
                w-full p-3 rounded-lg border-2 text-left transition-all
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSelected ? option.selectedColor : option.color}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-white ${option.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <div className={`w-2 h-2 rounded-full ${
                    option.id === 'retired' ? 'bg-blue-500' :
                    option.id === 'working' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`} />
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2">
        Ce paramètre influence l'ordre des visites lors de l'optimisation des tournées.
        Les clients "Actifs" seront planifiés en fin de journée quand possible.
      </p>
    </div>
  );
}

// Compact inline version for forms
export function AvailabilityProfileRadio({
  value,
  onChange,
  disabled = false,
}: AvailabilityProfileSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => !disabled && onChange('retired')}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${value === 'retired'
            ? 'bg-blue-100 border-blue-500 text-blue-700'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }
        `}
      >
        <Home className="w-3.5 h-3.5" />
        Retraité
      </button>
      
      <button
        type="button"
        onClick={() => !disabled && onChange('working')}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${value === 'working'
            ? 'bg-orange-100 border-orange-500 text-orange-700'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }
        `}
      >
        <Briefcase className="w-3.5 h-3.5" />
        Actif
      </button>
      
      <button
        type="button"
        onClick={() => !disabled && onChange(null)}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${value === null
            ? 'bg-gray-100 border-gray-500 text-gray-700'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }
        `}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Non défini
      </button>
    </div>
  );
}
