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
  RefreshCw,
  Info,
  Send,
  Calendar,
} from 'lucide-react';
import { createReactivationRequest } from '@/lib/storage';

interface ReactivationRequestModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  currentUserId: string;
  onRequestSent: () => void;
}

export default function ReactivationRequestModal({
  open,
  onClose,
  client,
  currentUserId,
  onRequestSent,
}: ReactivationRequestModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Le motif de réactivation est obligatoire.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const request = await createReactivationRequest(client.id, currentUserId, reason.trim());
      if (request) {
        onRequestSent();
        setReason('');
        onClose();
      } else {
        setError('Erreur lors de l\'envoi de la demande.');
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date inconnue';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <RefreshCw className="w-5 h-5" />
            Demander la réactivation
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">
              {client.civilite} {client.nom} {client.prenom}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Deactivation info */}
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Info className="w-4 h-4 text-muted-foreground" />
              Informations de désactivation
            </div>
            
            <div className="text-sm space-y-1 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Désactivé le {formatDate(client.deactivatedAt)}
              </div>
              
              {client.deactivationReason && (
                <div className="mt-2">
                  <span className="font-medium text-foreground">Motif initial :</span>
                  <p className="mt-1 p-2 bg-white rounded border text-foreground">
                    {client.deactivationReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reason input */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motif de réactivation <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Ex: Le client est revenu dans la zone, nouvelle adresse confirmée, erreur de désactivation..."
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
            <p className="text-xs text-muted-foreground">
              Expliquez pourquoi ce client devrait être réactivé. Un administrateur examinera votre demande.
            </p>
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
              onClick={handleSubmit}
              disabled={isLoading || !reason.trim()}
              className="flex-1"
            >
              {isLoading ? (
                'Envoi...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer la demande
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
