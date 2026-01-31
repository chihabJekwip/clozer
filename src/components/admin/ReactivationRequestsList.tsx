'use client';

import { useState, useEffect } from 'react';
import { ReactivationRequest, Client, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Check,
  X,
  Clock,
  User as UserIcon,
  Calendar,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import {
  getReactivationRequests,
  reviewReactivationRequest,
  getClient,
  getUser,
} from '@/lib/storage';

interface ReactivationRequestsListProps {
  currentUserId: string;
  onRequestReviewed?: () => void;
}

export default function ReactivationRequestsList({
  currentUserId,
  onRequestReviewed,
}: ReactivationRequestsListProps) {
  const [requests, setRequests] = useState<ReactivationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ReactivationRequest | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [clientsMap, setClientsMap] = useState<Map<string, Client>>(new Map());
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());

  // Load requests
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    const allRequests = getReactivationRequests();
    setRequests(allRequests);

    // Load related clients and users
    const clients = new Map<string, Client>();
    const users = new Map<string, User>();

    allRequests.forEach((req) => {
      const client = getClient(req.clientId);
      if (client) clients.set(req.clientId, client);

      const requester = getUser(req.requestedBy);
      if (requester) users.set(req.requestedBy, requester);

      if (req.reviewedBy) {
        const reviewer = getUser(req.reviewedBy);
        if (reviewer) users.set(req.reviewedBy, reviewer);
      }
    });

    setClientsMap(clients);
    setUsersMap(users);
  };

  const handleReview = async (approved: boolean) => {
    if (!selectedRequest) return;

    setIsReviewing(true);
    try {
      await reviewReactivationRequest(
        selectedRequest.id,
        currentUserId,
        approved,
        reviewComment.trim() || undefined
      );
      loadRequests();
      setSelectedRequest(null);
      setReviewComment('');
      onRequestReviewed?.();
    } catch (error) {
      console.error('Error reviewing request:', error);
    } finally {
      setIsReviewing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Demandes en attente
          {pendingRequests.length > 0 && (
            <Badge variant="warning">{pendingRequests.length}</Badge>
          )}
        </h3>

        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune demande en attente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const client = clientsMap.get(request.clientId);
              const requester = usersMap.get(request.requestedBy);

              return (
                <Card key={request.id} className="border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="font-medium">
                          {client
                            ? `${client.civilite} ${client.nom} ${client.prenom}`
                            : 'Client inconnu'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client?.adresse}, {client?.codePostal} {client?.ville}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-4 h-4" />
                            {requester?.name || 'Utilisateur inconnu'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                        <div className="p-2 bg-muted/50 rounded text-sm">
                          <span className="font-medium">Motif : </span>
                          {request.reason}
                        </div>
                      </div>
                      <Button
                        onClick={() => setSelectedRequest(request)}
                        variant="outline"
                      >
                        Examiner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Processed requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Check className="w-5 h-5 text-gray-500" />
            Demandes traitées
          </h3>

          <div className="space-y-2">
            {processedRequests.slice(0, 10).map((request) => {
              const client = clientsMap.get(request.clientId);
              const requester = usersMap.get(request.requestedBy);
              const reviewer = request.reviewedBy
                ? usersMap.get(request.reviewedBy)
                : null;

              return (
                <Card key={request.id} className="opacity-75">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {client
                              ? `${client.nom} ${client.prenom}`
                              : 'Client inconnu'}
                          </span>
                          <Badge
                            variant={
                              request.status === 'approved'
                                ? 'success'
                                : 'destructive'
                            }
                          >
                            {request.status === 'approved'
                              ? 'Approuvée'
                              : 'Rejetée'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Par {requester?.name || 'Inconnu'} •{' '}
                          {request.reviewedAt
                            ? `Traitée le ${formatDate(request.reviewedAt)} par ${reviewer?.name || 'Inconnu'}`
                            : formatDate(request.createdAt)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Review modal */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Examiner la demande
            </DialogTitle>
            <DialogDescription>
              Approuvez ou rejetez cette demande de réactivation
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 mt-4">
              {/* Client info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="font-medium">
                  {clientsMap.get(selectedRequest.clientId)
                    ? `${clientsMap.get(selectedRequest.clientId)!.civilite} ${clientsMap.get(selectedRequest.clientId)!.nom} ${clientsMap.get(selectedRequest.clientId)!.prenom}`
                    : 'Client inconnu'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {clientsMap.get(selectedRequest.clientId)?.adresse},{' '}
                  {clientsMap.get(selectedRequest.clientId)?.codePostal}{' '}
                  {clientsMap.get(selectedRequest.clientId)?.ville}
                </div>
              </div>

              {/* Deactivation reason */}
              {clientsMap.get(selectedRequest.clientId)?.deactivationReason && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                    <AlertCircle className="w-4 h-4" />
                    Motif de désactivation original
                  </div>
                  <p className="mt-1 text-sm text-amber-600">
                    {clientsMap.get(selectedRequest.clientId)?.deactivationReason}
                  </p>
                </div>
              )}

              {/* Request reason */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                  <MessageSquare className="w-4 h-4" />
                  Motif de réactivation
                </div>
                <p className="mt-1 text-sm text-blue-600">
                  {selectedRequest.reason}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Demandé par{' '}
                  {usersMap.get(selectedRequest.requestedBy)?.name || 'Inconnu'}{' '}
                  le {formatDate(selectedRequest.createdAt)}
                </p>
              </div>

              {/* Review comment */}
              <div>
                <label className="text-sm font-medium">
                  Commentaire (optionnel)
                </label>
                <Textarea
                  placeholder="Ajoutez un commentaire pour expliquer votre décision..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleReview(false)}
                  disabled={isReviewing}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  onClick={() => handleReview(true)}
                  disabled={isReviewing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
