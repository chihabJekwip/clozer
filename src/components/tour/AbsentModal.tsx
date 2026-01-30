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
import { RotateCcw, Home, Calendar, MessageSquare } from 'lucide-react';

interface AbsentModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  onSelectStrategy: (strategy: AbsentStrategy, notes?: string) => void;
  estimatedExtraTime?: {
    afterNext: number; // minutes supplémentaires
    onReturn: number;
  };
}

export default function AbsentModal({
  open,
  onClose,
  client,
  onSelectStrategy,
  estimatedExtraTime,
}: AbsentModalProps) {
  const [notes, setNotes] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState<AbsentStrategy | null>(null);

  const handleConfirm = () => {
    if (selectedStrategy) {
      onSelectStrategy(selectedStrategy, notes || undefined);
      setNotes('');
      setSelectedStrategy(null);
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
