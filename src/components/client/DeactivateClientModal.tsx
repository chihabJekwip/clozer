'use client';

import { useState } from 'react';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  UserX,
} from 'lucide-react';
import { deactivateClient } from '@/lib/storage';

interface DeactivateClientModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  currentUserId: string;
  onDeactivated: (client: Client) => void;
}

export default function DeactivateClientModal({
  open,
  onClose,
  client,
  currentUserId,
  onDeactivated,
}: DeactivateClientModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    if (!reason.trim()) {
      setError('Le motif de désactivation est obligatoire.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedClient = await deactivateClient(client.id, reason.trim(), currentUserId);
      if (updatedClient) {
        onDeactivated(updatedClient);
        setReason('');
        onClose();
      } else {
        setError('Erreur lors de la désactivation du client.');
      }
    } catch (err) {
      setError('Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <UserX className="w-5 h-5" />
            Désactiver ce client ?
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {client.civilite} {client.nom} {client.prenom}
            </span>
            <br />
            {client.adresse}, {client.codePostal} {client.ville}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Conséquences de la désactivation :</p>
              <ul className="mt-1 space-y-1 list-disc list-inside text-amber-600">
                <li>Le client sera grisé dans les listes</li>
                <li>Il ne pourra plus être ajouté aux tournées</li>
                <li>Seul un administrateur pourra le réactiver</li>
              </ul>
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motif de désactivation <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Ex: Déménagement hors zone, client décédé, demande du client..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError(null);
              }}
              rows={3}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDeactivate}
              disabled={isLoading || !reason.trim()}
              variant="destructive"
              className="flex-1"
            >
              {isLoading ? 'Désactivation...' : 'Désactiver le client'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
