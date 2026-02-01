'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  MicOff,
  Save,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  getSpeechRecognition,
} from '@/lib/speech-recognition';

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
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastProcessedIndex = useRef<number>(-1);

  // Check if speech recognition is supported
  useEffect(() => {
    setSpeechSupported(!!getSpeechRecognition());
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Only process new final results to avoid duplicates
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // Skip if we've already processed this result or if it's not final
        if (i <= lastProcessedIndex.current || !event.results[i].isFinal) {
          continue;
        }
        
        const transcript = event.results[i][0].transcript;
        lastProcessedIndex.current = i;
        
        setReportContent(prev => {
          // Add space only if there's existing content and it doesn't end with space
          const needsSpace = prev.length > 0 && !prev.endsWith(' ');
          return prev + (needsSpace ? ' ' : '') + transcript;
        });
        setError(null);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      if (event.error === 'not-allowed') {
        setError('Microphone non autorisé. Vérifiez les permissions de votre navigateur.');
      } else if (event.error === 'no-speech') {
        // Silent - no speech detected, this is normal
      } else {
        setError(`Erreur de reconnaissance vocale: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    return recognition;
  }, []);

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      // Reset the processed index when starting new recording
      lastProcessedIndex.current = -1;
      
      if (!recognitionRef.current) {
        recognitionRef.current = initRecognition();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Recognition might already be running
          recognitionRef.current.stop();
          recognitionRef.current = initRecognition();
          recognitionRef.current?.start();
        }
      }
    }
  };

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      if (existingReport) {
        setReportContent(existingReport.content);
      } else {
        setReportContent('');
      }
      setError(null);
      setIsRecording(false);
    } else {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  }, [existingReport, open]);

  const handleSave = () => {
    // Vérifier que le rapport n'est pas vide
    const trimmedContent = reportContent.trim();
    if (!trimmedContent) {
      setError('Le rapport de visite est obligatoire pour terminer la visite.');
      return;
    }

    recognitionRef.current?.stop();
    onSaveReport(trimmedContent);
    setReportContent('');
    setError(null);
  };

  // Allow closing without saving - this will NOT complete the visit
  const handleCancel = () => {
    recognitionRef.current?.stop();
    setReportContent('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
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
          {/* Bouton de dictée vocale */}
          {speechSupported && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={isRecording ? 'destructive' : 'outline'}
                size="lg"
                className={`flex-1 h-14 ${isRecording ? 'animate-pulse' : ''}`}
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-6 h-6 mr-2" />
                    Arrêter l'enregistrement
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6 mr-2" />
                    Dicter le rapport
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700 animate-pulse">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <p>Enregistrement en cours... Parlez clairement.</p>
            </div>
          )}

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
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              {existingReport ? 'Annuler' : 'Fermer'}
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!reportContent.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              {existingReport ? 'Enregistrer' : 'Valider la visite'}
            </Button>
          </div>

          {/* Message informatif */}
          {!existingReport && (
            <p className="text-xs text-center text-muted-foreground">
              Fermer sans valider annulera la complétion de cette visite.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
