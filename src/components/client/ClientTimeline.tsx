'use client';

import { useState, useEffect } from 'react';
import { ClientInteraction, InteractionType } from '@/types';
import { getClientInteractionsAsync, addClientInteraction } from '@/lib/storage-v2';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  XCircle,
  StickyNote,
  RefreshCw,
  Plus,
  Clock,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react';

interface ClientTimelineProps {
  clientId: string;
  maxItems?: number;
}

const interactionIcons: Record<InteractionType, React.ReactNode> = {
  visit: <MapPin className="w-4 h-4" />,
  call: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  quote_sent: <FileText className="w-4 h-4" />,
  quote_accepted: <CheckCircle className="w-4 h-4" />,
  quote_rejected: <XCircle className="w-4 h-4" />,
  note: <StickyNote className="w-4 h-4" />,
  status_change: <RefreshCw className="w-4 h-4" />,
  other: <MoreHorizontal className="w-4 h-4" />,
};

const interactionColors: Record<InteractionType, string> = {
  visit: 'bg-blue-100 text-blue-700 border-blue-200',
  call: 'bg-green-100 text-green-700 border-green-200',
  email: 'bg-purple-100 text-purple-700 border-purple-200',
  quote_sent: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  quote_accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  quote_rejected: 'bg-red-100 text-red-700 border-red-200',
  note: 'bg-gray-100 text-gray-700 border-gray-200',
  status_change: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const interactionLabels: Record<InteractionType, string> = {
  visit: 'Visite',
  call: 'Appel',
  email: 'Email',
  quote_sent: 'Devis envoyé',
  quote_accepted: 'Devis accepté',
  quote_rejected: 'Devis refusé',
  note: 'Note',
  status_change: 'Changement de statut',
  other: 'Autre',
};

export function ClientTimeline({ clientId, maxItems = 20 }: ClientTimelineProps) {
  const { currentUser } = useUser();
  const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: 'note' as InteractionType,
    title: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInteractions();
  }, [clientId]);

  const loadInteractions = async () => {
    setIsLoading(true);
    const data = await getClientInteractionsAsync(clientId);
    setInteractions(data.slice(0, maxItems));
    setIsLoading(false);
  };

  const handleAddInteraction = async () => {
    if (!newInteraction.title.trim()) return;
    
    setIsSubmitting(true);
    const result = await addClientInteraction({
      clientId,
      type: newInteraction.type,
      title: newInteraction.title,
      description: newInteraction.description || null,
      metadata: {},
      createdBy: currentUser?.id || null,
    });

    if (result) {
      setInteractions([result, ...interactions].slice(0, maxItems));
      setNewInteraction({ type: 'note', title: '', description: '' });
      setShowAddForm(false);
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `Il y a ${diffMinutes} min`;
      }
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Historique
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add interaction form */}
        {showAddForm && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3 border">
            <div className="flex gap-2 flex-wrap">
              {(['note', 'call', 'email', 'other'] as InteractionType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setNewInteraction({ ...newInteraction, type })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    newInteraction.type === type
                      ? interactionColors[type]
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {interactionIcons[type]}
                  <span className="ml-1.5">{interactionLabels[type]}</span>
                </button>
              ))}
            </div>
            <Input
              placeholder="Titre de l'interaction..."
              value={newInteraction.title}
              onChange={e => setNewInteraction({ ...newInteraction, title: e.target.value })}
            />
            <Textarea
              placeholder="Description (optionnel)..."
              value={newInteraction.description}
              onChange={e => setNewInteraction({ ...newInteraction, description: e.target.value })}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleAddInteraction}
                disabled={!newInteraction.title.trim() || isSubmitting}
              >
                {isSubmitting ? 'Ajout...' : 'Ajouter'}
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        {interactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune interaction enregistrée</p>
            <p className="text-sm">Cliquez sur "Ajouter" pour créer la première</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            
            {/* Timeline items */}
            <div className="space-y-4">
              {interactions.map((interaction, index) => (
                <div key={interaction.id} className="relative flex gap-4 pl-2">
                  {/* Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${interactionColors[interaction.type]}`}>
                    {interactionIcons[interaction.type]}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {interaction.title}
                        </p>
                        {interaction.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            {interaction.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {formatDate(interaction.createdAt)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {interactions.length >= maxItems && (
          <Button variant="ghost" className="w-full" onClick={loadInteractions}>
            Charger plus...
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
