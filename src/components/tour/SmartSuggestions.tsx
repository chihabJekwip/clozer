'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DailyPlan, 
  TourSuggestion, 
  generateSmartPlan, 
  getInsights,
  getUnvisitedClients 
} from '@/lib/smart-planner';
import { formatDistance, formatDuration } from '@/lib/utils';
import {
  Brain,
  Sparkles,
  MapPin,
  Clock,
  Users,
  Route,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface SmartSuggestionsProps {
  onCreateTour: (suggestion: TourSuggestion) => void;
  onRefresh?: () => void;
}

export default function SmartSuggestions({ onCreateTour, onRefresh }: SmartSuggestionsProps) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [insights, setInsights] = useState<ReturnType<typeof getInsights> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = () => {
    setIsLoading(true);
    // Simuler un petit délai pour l'effet de chargement
    setTimeout(() => {
      const newPlan = generateSmartPlan();
      const newInsights = getInsights();
      setPlan(newPlan);
      setInsights(newInsights);
      setIsLoading(false);
    }, 300);
  };

  const handleRefresh = () => {
    loadPlan();
    onRefresh?.();
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-3">
            <Brain className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-muted-foreground">Analyse en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan || !insights) {
    return null;
  }

  const priorityConfig = {
    high: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Recommandé', icon: Zap },
    medium: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Bon choix', icon: Target },
    low: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Optionnel', icon: MapPin },
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec insights */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Assistant Intelligent
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </CardTitle>
                <CardDescription>
                  Suggestions optimisées pour votre tournée
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleRefresh}>
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-primary">{insights.pendingClients}</div>
              <div className="text-xs text-muted-foreground">À visiter</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{insights.visitedClients}</div>
              <div className="text-xs text-muted-foreground">Visités</div>
            </div>
            {insights.notGeocodedClients > 0 && (
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">{insights.notGeocodedClients}</div>
                <div className="text-xs text-orange-600">Sans GPS</div>
              </div>
            )}
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="text-2xl font-bold">{insights.completionRate}%</div>
              <div className="text-xs text-muted-foreground">Complété</div>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-medium">{insights.visitedClients}/{insights.totalClients}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                style={{ width: `${insights.completionRate}%` }}
              />
            </div>
          </div>

          {/* Recommandation principale */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <p className="text-sm">{plan.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggestions de tournées */}
      {plan.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Route className="w-5 h-5" />
              Tournées suggérées
            </CardTitle>
            <CardDescription>
              Cliquez sur une suggestion pour voir les détails et créer la tournée
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {plan.suggestions.map((suggestion, index) => {
              const config = priorityConfig[suggestion.priority];
              const PriorityIcon = config.icon;
              const isExpanded = expandedSuggestion === suggestion.id;
              
              return (
                <div
                  key={suggestion.id}
                  className={`
                    border rounded-lg overflow-hidden transition-all
                    ${index === 0 ? 'border-primary shadow-md' : 'border-gray-200'}
                    ${isExpanded ? 'bg-gray-50' : 'bg-white'}
                  `}
                >
                  {/* En-tête de la suggestion */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {index === 0 && (
                            <Badge className="bg-primary text-white text-xs">
                              #1 Optimal
                            </Badge>
                          )}
                          <Badge className={`${config.color} text-xs`}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <h4 className="font-semibold">{suggestion.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {suggestion.reason}
                        </p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                    
                    {/* Stats de la suggestion */}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {suggestion.estimatedVisits} clients
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        ~{suggestion.estimatedDistance} km
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        ~{Math.floor(suggestion.estimatedDuration / 60)}h{(suggestion.estimatedDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Détails expandés */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="pt-3">
                        <h5 className="text-sm font-medium mb-2">Clients inclus :</h5>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {suggestion.clients.slice(0, 10).map(client => (
                            <div key={client.id} className="text-sm flex items-center gap-2 p-2 bg-white rounded">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium">{client.nom}</span>
                              <span className="text-muted-foreground">- {client.ville}</span>
                            </div>
                          ))}
                          {suggestion.clients.length > 10 && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                              + {suggestion.clients.length - 10} autres clients
                            </p>
                          )}
                        </div>
                        
                        <Button 
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateTour(suggestion);
                          }}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Créer cette tournée
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Répartition par zones */}
      {plan.clientsPerZone.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Répartition géographique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from(plan.clientsPerZone.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([zone, count]) => (
                  <div key={zone} className="flex items-center justify-between">
                    <span className="text-sm">{zone}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / plan.totalClientsToVisit) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
