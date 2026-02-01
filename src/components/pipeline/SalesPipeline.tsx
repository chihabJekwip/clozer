'use client';

import { useState, useEffect } from 'react';
import { Opportunity, OpportunityStage, Client } from '@/types';
import {
  getOpportunitiesAsync,
  addOpportunity,
  moveOpportunityStage,
  getPipelineValue,
} from '@/lib/storage-v2';
import { getClients, getClient } from '@/lib/storage';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Euro,
  Calendar,
  User,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit,
  Phone,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  GripVertical,
} from 'lucide-react';

const stages: { id: OpportunityStage; label: string; color: string; bgColor: string }[] = [
  { id: 'lead', label: 'Prospect', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'qualified', label: 'Qualifié', color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'proposal', label: 'Proposition', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'negotiation', label: 'Négociation', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  { id: 'won', label: 'Gagné', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'lost', label: 'Perdu', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
];

interface SalesPipelineProps {
  userId?: string;
}

export function SalesPipeline({ userId }: SalesPipelineProps) {
  const { currentUser } = useUser();
  const effectiveUserId = userId || currentUser?.id;

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newOpp, setNewOpp] = useState({
    clientId: '',
    title: '',
    description: '',
    estimatedValue: 0,
    probability: 50,
    expectedCloseDate: '',
  });
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [showLossReasonDialog, setShowLossReasonDialog] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const [movingOpp, setMovingOpp] = useState<Opportunity | null>(null);

  useEffect(() => {
    loadData();
  }, [effectiveUserId]);

  const loadData = async () => {
    setIsLoading(true);
    const [oppsData, clientsData] = await Promise.all([
      getOpportunitiesAsync({ assignedTo: effectiveUserId }),
      Promise.resolve(getClients()),
    ]);
    setOpportunities(oppsData);
    setClients(clientsData);
    setIsLoading(false);
  };

  const handleAddOpportunity = async () => {
    if (!newOpp.clientId || !newOpp.title || !effectiveUserId) return;

    const result = await addOpportunity({
      ...newOpp,
      stage: 'lead',
      products: [],
      nextAction: null,
      nextActionDate: null,
      actualCloseDate: null,
      lossReason: null,
      assignedTo: effectiveUserId,
      createdBy: effectiveUserId,
    });

    if (result) {
      setOpportunities([result, ...opportunities]);
      setShowAddDialog(false);
      setNewOpp({
        clientId: '',
        title: '',
        description: '',
        estimatedValue: 0,
        probability: 50,
        expectedCloseDate: '',
      });
    }
  };

  const handleMoveStage = async (opp: Opportunity, newStage: OpportunityStage) => {
    if (newStage === 'lost') {
      setMovingOpp(opp);
      setShowLossReasonDialog(true);
      return;
    }

    const result = await moveOpportunityStage(opp.id, newStage);
    if (result) {
      setOpportunities(opps => opps.map(o => o.id === opp.id ? result : o));
    }
  };

  const handleConfirmLoss = async () => {
    if (!movingOpp) return;

    const result = await moveOpportunityStage(movingOpp.id, 'lost', lossReason);
    if (result) {
      setOpportunities(opps => opps.map(o => o.id === movingOpp.id ? result : o));
    }
    setShowLossReasonDialog(false);
    setMovingOpp(null);
    setLossReason('');
  };

  const getOpportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities.filter(o => o.stage === stage);
  };

  const getTotalValueByStage = (stage: OpportunityStage) => {
    return getOpportunitiesByStage(stage).reduce((sum, o) => sum + o.estimatedValue, 0);
  };

  const getWeightedPipelineValue = () => {
    return opportunities
      .filter(o => !['won', 'lost'].includes(o.stage))
      .reduce((sum, o) => sum + (o.estimatedValue * o.probability / 100), 0);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map(stage => (
          <Card key={stage.id} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-500">Pipeline pondéré</p>
            <p className="text-2xl font-bold text-green-600">
              {getWeightedPipelineValue().toLocaleString('fr-FR')}€
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Opportunités actives</p>
            <p className="text-2xl font-bold">
              {opportunities.filter(o => !['won', 'lost'].includes(o.stage)).length}
            </p>
          </div>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle opportunité
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une opportunité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Client</label>
                <Select
                  value={newOpp.clientId}
                  onValueChange={v => setNewOpp({ ...newOpp, clientId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.prenom} {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={newOpp.title}
                  onChange={e => setNewOpp({ ...newOpp, title: e.target.value })}
                  placeholder="Ex: Installation complète"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newOpp.description}
                  onChange={e => setNewOpp({ ...newOpp, description: e.target.value })}
                  placeholder="Détails de l'opportunité..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valeur estimée (€)</label>
                  <Input
                    type="number"
                    value={newOpp.estimatedValue}
                    onChange={e => setNewOpp({ ...newOpp, estimatedValue: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Probabilité (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newOpp.probability}
                    onChange={e => setNewOpp({ ...newOpp, probability: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Date de clôture prévue</label>
                <Input
                  type="date"
                  value={newOpp.expectedCloseDate}
                  onChange={e => setNewOpp({ ...newOpp, expectedCloseDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddOpportunity} disabled={!newOpp.clientId || !newOpp.title}>
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div key={stage.id} className="min-w-[280px]">
            <Card className={`h-full ${stage.bgColor}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-semibold ${stage.color}`}>
                    {stage.label}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {getOpportunitiesByStage(stage.id).length}
                  </Badge>
                </div>
                {!['won', 'lost'].includes(stage.id) && (
                  <p className="text-xs text-gray-500">
                    {getTotalValueByStage(stage.id).toLocaleString('fr-FR')}€
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-2 min-h-[200px]">
                {getOpportunitiesByStage(stage.id).map(opp => {
                  const client = getClient(opp.clientId);
                  const stageIndex = stages.findIndex(s => s.id === opp.stage);
                  const canMoveRight = stageIndex < stages.length - 2; // Not won/lost
                  const canMoveLeft = stageIndex > 0 && !['won', 'lost'].includes(opp.stage);

                  return (
                    <Card 
                      key={opp.id} 
                      className="bg-white dark:bg-gray-900 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedOpp(opp)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{opp.title}</p>
                            {client && (
                              <p className="text-xs text-gray-500 truncate">
                                {client.prenom} {client.nom}
                              </p>
                            )}
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${
                              opp.probability >= 70 ? 'border-green-500 text-green-600' :
                              opp.probability >= 40 ? 'border-yellow-500 text-yellow-600' :
                              'border-red-500 text-red-600'
                            }`}
                          >
                            {opp.probability}%
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-green-600">
                            {opp.estimatedValue.toLocaleString('fr-FR')}€
                          </span>
                          {opp.expectedCloseDate && (
                            <span className="text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(opp.expectedCloseDate).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>

                        {/* Quick actions */}
                        {!['won', 'lost'].includes(opp.stage) && (
                          <div className="flex justify-between mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              disabled={!canMoveLeft}
                              onClick={(e) => {
                                e.stopPropagation();
                                const prevStage = stages[stageIndex - 1];
                                if (prevStage) handleMoveStage(opp, prevStage.id);
                              }}
                            >
                              ← Reculer
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canMoveRight) {
                                  const nextStage = stages[stageIndex + 1];
                                  if (nextStage) handleMoveStage(opp, nextStage.id);
                                }
                              }}
                            >
                              Avancer →
                            </Button>
                          </div>
                        )}

                        {/* Won/Lost indicator */}
                        {opp.stage === 'won' && (
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">Gagné le {new Date(opp.actualCloseDate || '').toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                        {opp.stage === 'lost' && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs">Perdu</span>
                            </div>
                            {opp.lossReason && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {opp.lossReason}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {getOpportunitiesByStage(stage.id).length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Aucune opportunité</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Loss Reason Dialog */}
      <Dialog open={showLossReasonDialog} onOpenChange={setShowLossReasonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raison de la perte</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={lossReason}
              onChange={e => setLossReason(e.target.value)}
              placeholder="Pourquoi cette opportunité a-t-elle été perdue ?"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowLossReasonDialog(false);
              setMovingOpp(null);
              setLossReason('');
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmLoss}>
              Confirmer la perte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
