'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { getRandomConfirmationWord } from '@/lib/storage';

interface TourEndConfirmationProps {
  open: boolean;
  onClose: () => void;
  tourName: string;
  onConfirm: () => void;
  stats: {
    completed: number;
    total: number;
    absent: number;
  };
}

export default function TourEndConfirmation({
  open,
  onClose,
  tourName,
  onConfirm,
  stats,
}: TourEndConfirmationProps) {
  const [confirmationWord, setConfirmationWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Generate random word when modal opens
  useEffect(() => {
    if (open) {
      setConfirmationWord(getRandomConfirmationWord());
      setUserInput('');
      setIsValid(false);
    }
  }, [open]);

  // Check if user input matches
  useEffect(() => {
    setIsValid(userInput.toUpperCase().trim() === confirmationWord.toUpperCase());
  }, [userInput, confirmationWord]);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm();
      onClose();
    }
  };

  const pendingCount = stats.total - stats.completed - stats.absent;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Terminer la tournée ?
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{tourName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Stats summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="text-sm font-medium">Résumé de la tournée :</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Terminées</div>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <div className="text-lg font-bold text-orange-600">{stats.absent}</div>
                <div className="text-xs text-muted-foreground">Absents</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-gray-600">{pendingCount}</div>
                <div className="text-xs text-muted-foreground">Non visitées</div>
              </div>
            </div>
          </div>

          {/* Warning if there are pending visits */}
          {pendingCount > 0 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Attention</p>
                <p>
                  Il reste {pendingCount} visite{pendingCount > 1 ? 's' : ''} non effectuée{pendingCount > 1 ? 's' : ''}.
                  Êtes-vous sûr de vouloir terminer ?
                </p>
              </div>
            </div>
          )}

          {/* Confirmation word */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Cette action est définitive. Pour confirmer, tapez :
            </div>
            
            <div className="p-3 bg-gray-100 rounded-lg text-center">
              <span className="text-xl font-mono font-bold tracking-widest">
                {confirmationWord}
              </span>
            </div>

            <Input
              placeholder="Tapez le mot ci-dessus..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className={`text-center font-mono uppercase tracking-wider ${
                userInput && (isValid ? 'border-green-500 bg-green-50' : 'border-red-300')
              }`}
              autoFocus
            />

            {userInput && isValid && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Confirmation validée
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid}
              variant="destructive"
              className="flex-1"
            >
              Terminer la tournée
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Vous serez redirigé vers le rapport de tournée après confirmation.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
