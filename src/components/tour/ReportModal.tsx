'use client';

import { useState, useEffect } from 'react';
import { Client, VisitReport } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Mic,
  Save,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  visitId: string;
  onSaveReport: (content: string) => void;
  existingReport?: VisitReport; // Pour édition
}

export default function ReportModal({
  open,
  onClose,
  client,
  visitId,
  onSaveReport,
  existingReport,
}: ReportModalProps) {
  const [reportContent, setReportContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialiser avec le rapport existant si édition
  useEffect(() => {
    if (existingReport) {
      setReportContent(existingReport.content);
    } else {
      setReportContent('');
    }
    setError(null);
  }, [existingReport, open]);

  const handleSave = () => {
    // Vérifier que le rapport n'est pas vide
    const trimmedContent = reportContent.trim();
    if (!trimmedContent) {
      setError('Le rapport de visite est obligatoire pour terminer la visite.');
      return;
    }

    onSaveReport(trimmedContent);
    setReportContent('');
    setError(null);
  };

  const handleClose = () => {
    // Si c'est une édition, on peut fermer sans sauvegarder
    if (existingReport) {
      onClose();
      return;
    }
    // Sinon, on ne peut pas fermer sans rapport
    setError('Vous devez saisir un rapport pour terminer la visite.');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {existingReport ? 'Modifier le rapport' : 'Rapport de visite'}
          </DialogTitle>
          <DialogDescription>
            {client.civilite} {client.nom} {client.prenom} - {client.ville}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Indication pour la dictée vocale */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <Mic className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Astuce : Dictée vocale</p>
              <p className="text-blue-600">
                Touchez le champ ci-dessous, puis appuyez sur l'icône 
                <span className="inline-block mx-1 text-lg">🎤</span> 
                de votre clavier pour dicter votre rapport.
              </p>
            </div>
          </div>

          {/* Zone de texte pour le rapport */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Contenu du rapport <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Décrivez le déroulement de la visite, les points abordés, les besoins du client..."
              value={reportContent}
              onChange={(e) => {
                setReportContent(e.target.value);
                if (e.target.value.trim()) {
                  setError(null);
                }
              }}
              rows={6}
              className="resize-none"
              autoFocus
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Compteur de caractères */}
          <div className="text-xs text-muted-foreground text-right">
            {reportContent.length} caractères
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-2">
            {existingReport && (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            )}
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!reportContent.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {existingReport ? 'Enregistrer les modifications' : 'Valider et terminer la visite'}
            </Button>
          </div>

          {/* Message obligatoire */}
          {!existingReport && (
            <p className="text-xs text-center text-muted-foreground">
              Le rapport est obligatoire pour terminer la visite.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
