'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Route,
  RefreshCw,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface ReoptimizeModalProps {
  open: boolean;
  onClose: () => void;
  remainingVisits: number;
  estimatedSavings?: {
    distance: number; // km
    duration: number; // minutes
  };
  onOptimize: () => Promise<void>;
  onKeepCurrent: () => void;
}

export default function ReoptimizeModal({
  open,
  onClose,
  remainingVisits,
  estimatedSavings,
  onOptimize,
  onKeepCurrent,
}: ReoptimizeModalProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await onOptimize();
      onClose();
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleKeepCurrent = () => {
    onKeepCurrent();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Route className="w-5 h-5" />
            Optimiser l'itinéraire ?
          </DialogTitle>
          <DialogDescription>
            Le client a été marqué comme absent. Voulez-vous recalculer le meilleur parcours ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Remaining visits info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="font-medium">
                {remainingVisits} visite{remainingVisits > 1 ? 's' : ''} restante{remainingVisits > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-muted-foreground">
                à effectuer dans cette tournée
              </div>
            </div>
          </div>

          {/* Estimated savings */}
          {estimatedSavings && (estimatedSavings.distance > 0 || estimatedSavings.duration > 0) && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-700 mb-2">
                Économie potentielle estimée :
              </div>
              <div className="flex gap-4">
                {estimatedSavings.distance > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Route className="w-4 h-4" />
                    <span className="font-medium">~{estimatedSavings.distance.toFixed(1)} km</span>
                  </div>
                )}
                {estimatedSavings.duration > 0 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">~{estimatedSavings.duration} min</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visual representation */}
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="flex gap-1">
              {Array.from({ length: Math.min(remainingVisits, 5) }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium"
                >
                  {i + 1}
                </div>
              ))}
              {remainingVisits > 5 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                  +{remainingVisits - 5}
                </div>
              )}
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleKeepCurrent}
              className="flex-1"
              disabled={isOptimizing}
            >
              Garder l'ordre actuel
            </Button>
            <Button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex-1"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Optimiser
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            L'optimisation recalcule le parcours le plus court pour les visites restantes.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
