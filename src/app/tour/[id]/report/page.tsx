'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tour, Visit, TourNote, Client, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Edit2,
  Send,
  Save,
  Mic,
  Users,
  Mail,
  Eye,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  getTour,
  getVisitsByTour,
  getTourNotes,
  getClient,
  validateTourReport,
  getCurrentUser,
  getSupervisorIds,
  getUser,
} from '@/lib/storage';
import { sendTourReportEmail, previewTourReportEmail, TourReportEmail } from '@/lib/email-service';

export default function TourReportPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.id as string;

  const [tour, setTour] = useState<Tour | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notes, setNotes] = useState<TourNote[]>([]);
  const [clients, setClients] = useState<Map<string, Client>>(new Map());
  const [finalReport, setFinalReport] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  
  // Email sending states
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<TourReportEmail | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load data
  useEffect(() => {
    const tourData = getTour(tourId);
    if (!tourData) {
      router.push('/');
      return;
    }

    setTour(tourData);
    setFinalReport(tourData.finalReport || '');
    setIsEditing(!tourData.reportValidatedAt);

    const tourVisits = getVisitsByTour(tourId);
    setVisits(tourVisits);

    const tourNotes = getTourNotes(tourId);
    setNotes(tourNotes);

    // Load clients
    const clientsMap = new Map<string, Client>();
    tourVisits.forEach((v) => {
      const client = getClient(v.clientId);
      if (client) clientsMap.set(v.clientId, client);
    });
    setClients(clientsMap);

    // Load supervisors
    const currentUser = getCurrentUser();
    if (currentUser) {
      const supervisorIds = getSupervisorIds(currentUser.id);
      const supervisorUsers = supervisorIds
        .map((id) => getUser(id))
        .filter((u): u is User => u !== undefined);
      setSupervisors(supervisorUsers);
    }
  }, [tourId, router]);

  const handleSaveDraft = async () => {
    if (!tour) return;
    setIsSaving(true);
    await validateTourReport(tour.id, finalReport);
    setIsSaving(false);
  };

  const handleValidate = async () => {
    if (!tour || !finalReport.trim()) return;
    
    setIsSaving(true);
    const updated = await validateTourReport(tour.id, finalReport.trim());
    if (updated) {
      setTour(updated);
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleShowPreview = () => {
    const preview = previewTourReportEmail(tourId);
    setEmailPreview(preview);
    setShowEmailPreview(true);
    setSendResult(null);
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setSendResult(null);

    const result = await sendTourReportEmail(tourId);
    
    setSendResult(result);
    setIsSending(false);

    if (result.success) {
      // Reload tour to get updated reportSentAt
      const updatedTour = getTour(tourId);
      if (updatedTour) {
        setTour(updatedTour);
      }
      
      // Close preview after success
      setTimeout(() => {
        setShowEmailPreview(false);
      }, 2000);
    }
  };

  if (!tour) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Stats
  const completedVisits = visits.filter((v) => v.status === 'completed').length;
  const absentVisits = visits.filter((v) => v.status === 'absent').length;
  const pendingVisits = visits.length - completedVisits - absentVisits;
  const totalDistance = tour.totalDistance ? (tour.totalDistance / 1000).toFixed(1) : '—';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container flex items-center gap-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Accueil
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Rapport de tournée</h1>
            <p className="text-sm text-muted-foreground">{tour.name}</p>
          </div>
          {tour.reportValidatedAt && (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Validé
            </Badge>
          )}
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5" />
              Résumé de la tournée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{completedVisits}</div>
                <div className="text-xs text-muted-foreground">Visites terminées</div>
              </div>
              <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{absentVisits}</div>
                <div className="text-xs text-muted-foreground">Clients absents</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{pendingVisits}</div>
                <div className="text-xs text-muted-foreground">Non visitées</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalDistance}</div>
                <div className="text-xs text-muted-foreground">km parcourus</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tour notes */}
        {notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="w-5 h-5" />
                Notes de terrain ({notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-muted/50 rounded-lg text-sm border-l-4 border-primary/30"
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {new Date(note.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Visits list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5" />
              Détail des visites ({visits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visits.map((visit) => {
              const client = clients.get(visit.clientId);
              return (
                <div
                  key={visit.id}
                  className={`p-3 rounded-xl border-l-4 ${
                    visit.status === 'completed'
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500'
                      : visit.status === 'absent'
                      ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500'
                      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-sm">
                        {client
                          ? `${client.civilite} ${client.nom} ${client.prenom}`
                          : 'Client inconnu'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {client?.adresse}, {client?.ville}
                      </div>
                    </div>
                    <Badge
                      variant={
                        visit.status === 'completed'
                          ? 'success'
                          : visit.status === 'absent'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {visit.status === 'completed'
                        ? 'Terminée'
                        : visit.status === 'absent'
                        ? 'Absent'
                        : 'Non visitée'}
                    </Badge>
                  </div>
                  {visit.notes && (
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      {visit.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Final report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Edit2 className="w-5 h-5" />
              Rapport final
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                  <Mic className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Astuce : Dictée vocale</p>
                    <p className="text-blue-600 dark:text-blue-400">
                      Utilisez le micro de votre clavier pour dicter le rapport.
                    </p>
                  </div>
                </div>

                <Textarea
                  placeholder="Rédigez votre rapport de tournée... Décrivez les points importants, les observations, les actions à suivre..."
                  value={finalReport}
                  onChange={(e) => setFinalReport(e.target.value)}
                  rows={8}
                  className="resize-none"
                />

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{finalReport.length} caractères</span>
                </div>
              </>
            ) : (
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="whitespace-pre-wrap">{finalReport}</p>
              </div>
            )}

            {/* Supervisors info */}
            {supervisors.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">Destinataires du rapport :</span>
                <span className="font-medium">{supervisors.map(s => s.name).join(', ')}</span>
              </div>
            )}
            
            {supervisors.length === 0 && !isEditing && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="w-4 h-4" />
                <span>Aucun superviseur configuré. Demandez à un admin de configurer vos superviseurs.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer brouillon
              </Button>
              <Button
                onClick={handleValidate}
                disabled={isSaving || !finalReport.trim()}
                className="flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Valider le rapport
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex-1"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              {!tour.reportSentAt && supervisors.length > 0 && (
                <Button 
                  className="flex-1"
                  onClick={handleShowPreview}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Prévisualiser et envoyer
                </Button>
              )}
            </>
          )}
        </div>

        {tour.reportSentAt && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <p className="font-medium text-emerald-700 dark:text-emerald-300">
              Rapport envoyé avec succès
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {new Date(tour.reportSentAt).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </main>

      {/* Email Preview Dialog */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Prévisualisation de l'email
            </DialogTitle>
            <DialogDescription>
              Vérifiez le contenu avant d'envoyer aux superviseurs
            </DialogDescription>
          </DialogHeader>

          {emailPreview && (
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Recipients */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-1">Destinataires :</div>
                <div className="flex flex-wrap gap-2">
                  {emailPreview.to.map((recipient, i) => (
                    <Badge key={i} variant="secondary">
                      {recipient.name} ({recipient.email})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-1">Objet :</div>
                <div className="text-sm">{emailPreview.subject}</div>
              </div>

              {/* Email preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs font-medium">Aperçu de l'email</div>
                <div 
                  className="p-4 bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: emailPreview.htmlBody }}
                />
              </div>

              {/* Send result */}
              {sendResult && (
                <div className={`p-4 rounded-lg ${
                  sendResult.success 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {sendResult.success ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">{sendResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEmailPreview(false)}
              disabled={isSending}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending || (sendResult?.success ?? false)}
              className="flex-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : sendResult?.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Envoyé !
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le rapport
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
