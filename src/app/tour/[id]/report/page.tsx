'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tour, Visit, TourNote, Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Edit2,
  Send,
  Save,
  Mic,
  Users,
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
  const [supervisorNames, setSupervisorNames] = useState<string[]>([]);

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
      const names = supervisorIds
        .map((id) => getUser(id)?.name)
        .filter(Boolean) as string[];
      setSupervisorNames(names);
    }
  }, [tourId, router]);

  const handleSaveDraft = async () => {
    if (!tour) return;
    setIsSaving(true);
    // Just update the final report without validating
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
              Résumé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{completedVisits}</div>
                <div className="text-xs text-muted-foreground">Terminées</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{absentVisits}</div>
                <div className="text-xs text-muted-foreground">Absents</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{pendingVisits}</div>
                <div className="text-xs text-muted-foreground">Non visitées</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{totalDistance}</div>
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
                  className="p-3 bg-muted/50 rounded-lg text-sm"
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
              Visites ({visits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {visits.map((visit) => {
              const client = clients.get(visit.clientId);
              return (
                <div
                  key={visit.id}
                  className={`p-3 rounded-lg border ${
                    visit.status === 'completed'
                      ? 'bg-green-50 border-green-200'
                      : visit.status === 'absent'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-gray-50 border-gray-200'
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
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  <Mic className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Astuce : Dictée vocale</p>
                    <p className="text-blue-600">
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
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{finalReport}</p>
              </div>
            )}

            {/* Supervisors info */}
            {supervisorNames.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Destinataires :</span>
                <span className="font-medium">{supervisorNames.join(', ')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-2">
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
              {!tour.reportSentAt && supervisorNames.length > 0 && (
                <Button className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer aux superviseurs
                </Button>
              )}
            </>
          )}
        </div>

        {tour.reportSentAt && (
          <p className="text-center text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4 inline mr-1" />
            Rapport envoyé le{' '}
            {new Date(tour.reportSentAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </main>
    </div>
  );
}
