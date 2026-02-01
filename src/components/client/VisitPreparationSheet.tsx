'use client';

import { useState, useEffect } from 'react';
import { VisitPreparationSheet as PrepSheet, Client, Product } from '@/types';
import { getVisitPreparationSheet } from '@/lib/storage-v2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Gift,
  TrendingUp,
  AlertTriangle,
  FileText,
  Package,
  StickyNote,
  ChevronRight,
  Sparkles,
  Euro,
  User,
  Building,
  Heart,
  Target,
} from 'lucide-react';

interface VisitPreparationSheetProps {
  clientId: string;
  onNavigateToClient?: () => void;
}

export function VisitPreparationSheet({ clientId, onNavigateToClient }: VisitPreparationSheetProps) {
  const [prepSheet, setPrepSheet] = useState<PrepSheet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');

  useEffect(() => {
    loadPrepSheet();
  }, [clientId]);

  const loadPrepSheet = async () => {
    setIsLoading(true);
    const data = await getVisitPreparationSheet(clientId);
    setPrepSheet(data);
    setIsLoading(false);
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    return phone.replace(/(\d{2})(?=\d)/g, '$1 ');
  };

  const getPriorityColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 50) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 70) return 'Priorité haute';
    if (score >= 50) return 'Priorité moyenne';
    return 'Priorité basse';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!prepSheet) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Impossible de charger la fiche de préparation</p>
        </CardContent>
      </Card>
    );
  }

  const { client, lastVisit, recentInteractions, activeQuotes, purchaseHistory, totalSpent, daysSinceLastVisit, upcomingBirthday, suggestedProducts, notes } = prepSheet;

  return (
    <div className="space-y-4">
      {/* Header - Client Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {client.civilite} {client.prenom} {client.nom}
              </h2>
              {client.companyName && (
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                  <Building className="w-4 h-4" />
                  {client.companyName}
                  {client.jobTitle && ` - ${client.jobTitle}`}
                </p>
              )}
            </div>
            <Badge className={`${getPriorityColor(prepSheet.priorityScore)}`}>
              <Target className="w-3 h-3 mr-1" />
              {getPriorityLabel(prepSheet.priorityScore)}
            </Badge>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{client.visitCount}</p>
              <p className="text-xs text-gray-500">Visites</p>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{totalSpent.toLocaleString('fr-FR')}€</p>
              <p className="text-xs text-gray-500">Total CA</p>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className={`text-2xl font-bold ${daysSinceLastVisit && daysSinceLastVisit > 60 ? 'text-red-600' : 'text-gray-700'}`}>
                {daysSinceLastVisit !== null ? `${daysSinceLastVisit}j` : '-'}
              </p>
              <p className="text-xs text-gray-500">Depuis visite</p>
            </div>
          </div>

          {/* Contact Buttons */}
          <div className="flex gap-2">
            {(client.portableM || client.portableMme || client.telDomicile) && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const phone = client.portableM || client.portableMme || client.telDomicile;
                  if (phone) window.location.href = `tel:${phone}`;
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Appeler
              </Button>
            )}
            {client.email && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.location.href = `mailto:${client.email}`}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const address = `${client.adresse}, ${client.codePostal} ${client.ville}`;
                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              GPS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Badges */}
      <div className="flex flex-wrap gap-2">
        {upcomingBirthday && (
          <Badge className="bg-pink-100 text-pink-700 border-pink-200 py-1.5 px-3">
            <Gift className="w-4 h-4 mr-1.5" />
            Anniversaire proche !
          </Badge>
        )}
        {daysSinceLastVisit && daysSinceLastVisit > 60 && (
          <Badge className="bg-red-100 text-red-700 border-red-200 py-1.5 px-3">
            <AlertTriangle className="w-4 h-4 mr-1.5" />
            Pas de visite depuis {daysSinceLastVisit} jours
          </Badge>
        )}
        {activeQuotes.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 py-1.5 px-3">
            <FileText className="w-4 h-4 mr-1.5" />
            {activeQuotes.length} devis en attente ({activeQuotes.reduce((sum, q) => sum + q.totalTTC, 0).toLocaleString('fr-FR')}€)
          </Badge>
        )}
      </div>

      {/* Last Visit Recap */}
      {lastVisit && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Dernière visite
            </CardTitle>
            <CardDescription>
              {new Date(lastVisit.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastVisit.report ? (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {lastVisit.report}
                </p>
              </div>
            ) : lastVisit.notes ? (
              <p className="text-sm text-gray-600">{lastVisit.notes}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun rapport enregistré</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Client Preferences */}
      {(client.preferredContactMethod || client.bestContactTime || client.interests?.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Préférences client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {client.preferredContactMethod && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Contact préféré:</span>
                <Badge variant="outline">
                  {client.preferredContactMethod === 'phone' && 'Téléphone'}
                  {client.preferredContactMethod === 'email' && 'Email'}
                  {client.preferredContactMethod === 'sms' && 'SMS'}
                  {client.preferredContactMethod === 'visit' && 'Visite'}
                </Badge>
              </div>
            )}
            {client.bestContactTime && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Meilleur moment:</span>
                <span className="font-medium">{client.bestContactTime}</span>
              </div>
            )}
            {client.interests && client.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {client.interests.map((interest, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pinned Notes */}
      {notes.filter(n => n.isPinned).length > 0 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Notes importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notes.filter(n => n.isPinned).map(note => (
              <div key={note.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                {note.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {note.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Purchase History */}
      {purchaseHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Historique d'achats
            </CardTitle>
            <CardDescription>
              {purchaseHistory.length} produit{purchaseHistory.length > 1 ? 's' : ''} acheté{purchaseHistory.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {purchaseHistory.slice(0, 5).map(cp => (
                <div key={cp.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <span className="font-medium">Produit #{cp.productId.slice(0, 8)}</span>
                    <span className="text-gray-500 ml-2">x{cp.quantity}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{cp.pricePaid.toLocaleString('fr-FR')}€</span>
                    <span className="text-gray-400 text-xs ml-2">
                      {new Date(cp.purchaseDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Products */}
      {suggestedProducts.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Produits suggérés
            </CardTitle>
            <CardDescription>
              Basé sur le profil client et l'historique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedProducts.map(product => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                    {product.category && (
                      <p className="text-xs text-gray-500">{product.category}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">
                      {(product.priceHT * (1 + product.tvaRate / 100)).toLocaleString('fr-FR')}€
                    </p>
                    <p className="text-xs text-gray-400">TTC</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Quotes */}
      {activeQuotes.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Devis en attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeQuotes.map(quote => (
                <div 
                  key={quote.id}
                  className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium">Devis du {new Date(quote.date).toLocaleDateString('fr-FR')}</p>
                    <Badge variant={quote.status === 'sent' ? 'default' : 'secondary'} className="mt-1">
                      {quote.status === 'sent' ? 'Envoyé' : 'Brouillon'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{quote.totalTTC.toLocaleString('fr-FR')}€</p>
                    {quote.validUntil && (
                      <p className="text-xs text-gray-500">
                        Expire le {new Date(quote.validUntil).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Interactions Summary */}
      {recentInteractions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Activité récente
              </CardTitle>
              {onNavigateToClient && (
                <Button variant="ghost" size="sm" onClick={onNavigateToClient}>
                  Voir tout
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentInteractions.slice(0, 3).map(interaction => (
                <div key={interaction.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="flex-1 truncate">{interaction.title}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(interaction.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
