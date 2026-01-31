'use client';

import { useState } from 'react';
import { Client, AbsentStrategy } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, Home, Calendar, MessageSquare, Route } from 'lucide-react';

interface AbsentModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  onSelectStrategy: (strategy: AbsentStrategy, notes?: string, shouldReoptimize?: boolean) => void;
  estimatedExtraTime?: {
    afterNext: number; // minutes supplémentaires
    onReturn: number;
  };
  remainingVisits?: number; // V2: Number of remaining visits for reoptimize info
}

export default function AbsentModal({
  open,
  onClose,
  client,
  onSelectStrategy,
  estimatedExtraTime,
  remainingVisits = 0,
}: AbsentModalProps) {
  const [notes, setNotes] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<AbsentStrategy | null>(null);
  const [wantsReoptimize, setWantsReoptimize] = useState(true); // V2: Default to true

  // V2: Strategies that benefit from re-optimization
  const strategyCanReoptimize = (strategy: AbsentStrategy | null) => {
    return strategy === 'on_return' || strategy === 'another_day';
  };

  const handleConfirm = () => {
    if (selectedStrategy) {
      const shouldReoptimize = strategyCanReoptimize(selectedStrategy) && wantsReoptimize && remainingVisits > 1;
      onSelectStrategy(selectedStrategy, notes || undefined, shouldReoptimize);
      setNotes('');
      setSelectedStrategy(null);
      setWantsReoptimize(true);
      onClose();
    }
  };

  const strategies = [
    {
      id: 'after_next' as AbsentStrategy,
      icon: RotateCcw,
      title: 'Après le prochain client',
      description: 'Repasser juste après avoir visité le prochain client',
      extraTime: estimatedExtraTime?.afterNext,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-500',
    },
    {
      id: 'on_return' as AbsentStrategy,
      icon: Home,
      title: 'Sur le chemin du retour',
      description: 'Repasser à la fin de la tournée, avant de rentrer au bureau',
      extraTime: estimatedExtraTime?.onReturn,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      selectedColor: 'bg-purple-100 border-purple-500 ring-2 ring-purple-500',
    },
    {
      id: 'another_day' as AbsentStrategy,
      icon: Calendar,
      title: 'Reporter à un autre jour',
      description: 'Ne pas repasser aujourd\'hui, reporter la visite',
      extraTime: undefined,
      color: 'bg-gray-50 border-gray-200 hover:bg-gray-100',
      selectedColor: 'bg-gray-100 border-gray-500 ring-2 ring-gray-500',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <span className="text-2xl">!</span>
            Client absent
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {client.civilite} {client.nom} {client.prenom}
            </span>
            <br />
            n'est pas disponible. Que souhaitez-vous faire ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {strategies.map((strategy) => {
            const Icon = strategy.icon;
            const isSelected = selectedStrategy === strategy.id;
            
            return (
              <button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy.id)}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected ? strategy.selectedColor : strategy.color}
                `}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{strategy.title}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {strategy.description}
                    </div>
                    {strategy.extraTime !== undefined && (
                      <div className="text-xs text-muted-foreground mt-1">
                        +{strategy.extraTime} min au trajet total
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Zone de notes */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
            <MessageSquare className="w-4 h-4" />
            Ajouter une note (optionnel)
          </div>
          <Textarea
            placeholder="Ex: Pas de réponse, voiture absente..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* V2: Re-optimization option */}
        {strategyCanReoptimize(selectedStrategy) && remainingVisits > 1 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsReoptimize}
                onChange={(e) => setWantsReoptimize(e.target.checked)}
                className="mt-1 rounded border-blue-300"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium text-blue-700">
                  <Route className="w-4 h-4" />
                  Recalculer l'itinéraire
                </div>
                <p className="text-sm text-blue-600 mt-0.5">
                  Optimiser le parcours pour les {remainingVisits} visites restantes
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStrategy}
            className="flex-1"
          >
            Confirmer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
