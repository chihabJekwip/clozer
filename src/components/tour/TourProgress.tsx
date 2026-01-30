'use client';

import { Visit } from '@/types';
import { formatDistance, formatDuration, formatTime } from '@/lib/utils';
import { Clock, MapPin, Check, AlertTriangle } from 'lucide-react';

interface TourProgressProps {
  visits: Visit[];
  currentIndex: number;
  totalDistance: number | null;
  totalDuration: number | null;
  estimatedEndTime: Date | null;
}

export default function TourProgress({
  visits,
  currentIndex,
  totalDistance,
  totalDuration,
  estimatedEndTime,
}: TourProgressProps) {
  const completedCount = visits.filter(v => v.status === 'completed').length;
  const absentCount = visits.filter(v => v.status === 'absent' || v.status === 'skipped').length;
  const pendingCount = visits.filter(v => v.status === 'pending' || v.status === 'in_progress').length;
  const totalCount = visits.length;

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calculer la distance et durée restantes
  const remainingVisits = visits.slice(currentIndex);
  const remainingDistance = remainingVisits.reduce(
    (sum, v) => sum + (v.distanceFromPrevious || 0),
    0
  );
  const remainingDuration = remainingVisits.reduce(
    (sum, v) => sum + (v.durationFromPrevious || 0) + (v.estimatedDuration * 60),
    0
  );

  return (
    <div className="bg-white border-b px-4 py-3">
      {/* Barre de progression */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">Progression</span>
          <span className="text-muted-foreground">
            {completedCount}/{totalCount} visites
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-green-50 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-green-700">
            <Check className="w-4 h-4" />
            <span className="font-bold">{completedCount}</span>
          </div>
          <div className="text-xs text-green-600">Terminés</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-2">
          <div className="flex items-center justify-center gap-1 text-gray-700">
            <Clock className="w-4 h-4" />
            <span className="font-bold">{pendingCount}</span>
          </div>
          <div className="text-xs text-gray-600">Restants</div>
        </div>

        {absentCount > 0 && (
          <div className="bg-orange-50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-orange-700">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-bold">{absentCount}</span>
            </div>
            <div className="text-xs text-orange-600">Absents</div>
          </div>
        )}

        {absentCount === 0 && (
          <div className="bg-blue-50 rounded-lg p-2">
            <div className="flex items-center justify-center gap-1 text-blue-700">
              <MapPin className="w-4 h-4" />
              <span className="font-bold">{formatDistance(remainingDistance)}</span>
            </div>
            <div className="text-xs text-blue-600">Restant</div>
          </div>
        )}
      </div>

      {/* Estimation de fin */}
      {estimatedEndTime && pendingCount > 0 && (
        <div className="mt-3 pt-3 border-t text-center">
          <div className="text-sm text-muted-foreground">
            Fin estimée : <span className="font-medium text-foreground">{formatTime(estimatedEndTime)}</span>
            <span className="mx-2">•</span>
            <span>{formatDuration(remainingDuration)}</span>
          </div>
        </div>
      )}

      {/* Message de fin */}
      {pendingCount === 0 && completedCount > 0 && (
        <div className="mt-3 pt-3 border-t text-center">
          <div className="text-green-600 font-medium">
            Tournée terminée !
          </div>
        </div>
      )}
    </div>
  );
}
