'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Client, 
  Tour, 
  Visit, 
  Quote, 
  User 
} from '@/types';
import { 
  getClients, 
  getTours, 
  getVisits, 
  getQuotes, 
  getUsers,
  getUser
} from '@/lib/storage';
import { useUser } from '@/contexts/UserContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  ArrowLeft,
  Users,
  MapPin,
  Route,
  FileText,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Euro,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

type DateFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export default function AdminDashboardPage() {
  return (
    <AuthGuard requireAdmin>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setClients(getClients());
    setTours(getTours());
    setVisits(getVisits());
    setQuotes(getQuotes());
    setUsers(getUsers());
    setIsLoading(false);
  };

  // Calculate date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (dateFilter) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case 'custom':
        start = customStartDate ? new Date(customStartDate) : new Date(0);
        end = customEndDate ? new Date(customEndDate + 'T23:59:59') : end;
        break;
      case 'all':
      default:
        start = new Date(0);
        break;
    }

    return { start, end };
  }, [dateFilter, customStartDate, customEndDate]);

  // Filter data by date range
  const filteredTours = useMemo(() => {
    return tours.filter(t => {
      const tourDate = new Date(t.createdAt);
      return tourDate >= dateRange.start && tourDate <= dateRange.end;
    });
  }, [tours, dateRange]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const visitDate = new Date(v.createdAt);
      return visitDate >= dateRange.start && visitDate <= dateRange.end;
    });
  }, [visits, dateRange]);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const quoteDate = new Date(q.createdAt);
      return quoteDate >= dateRange.start && quoteDate <= dateRange.end;
    });
  }, [quotes, dateRange]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    // Clients
    const totalClients = clients.length;
    const geocodedClients = clients.filter(c => c.latitude && c.longitude).length;
    const geocodingRate = totalClients > 0 ? Math.round((geocodedClients / totalClients) * 100) : 0;
    const assignedClients = clients.filter(c => c.assignedTo).length;

    // Tours
    const totalTours = filteredTours.length;
    const completedTours = filteredTours.filter(t => t.status === 'completed').length;
    const inProgressTours = filteredTours.filter(t => t.status === 'in_progress').length;
    const planningTours = filteredTours.filter(t => t.status === 'planning').length;

    // Visits
    const totalVisits = filteredVisits.length;
    const completedVisits = filteredVisits.filter(v => v.status === 'completed').length;
    const absentVisits = filteredVisits.filter(v => v.status === 'absent').length;
    const pendingVisits = filteredVisits.filter(v => v.status === 'pending').length;
    const visitSuccessRate = totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

    // Quotes
    const totalQuotes = filteredQuotes.length;
    const acceptedQuotes = filteredQuotes.filter(q => q.status === 'accepted').length;
    const rejectedQuotes = filteredQuotes.filter(q => q.status === 'rejected').length;
    const pendingQuotesCount = filteredQuotes.filter(q => q.status === 'draft' || q.status === 'sent').length;
    const totalRevenue = filteredQuotes
      .filter(q => q.status === 'accepted')
      .reduce((sum, q) => sum + q.totalTTC, 0);
    const quoteConversionRate = totalQuotes > 0 ? Math.round((acceptedQuotes / totalQuotes) * 100) : 0;

    // Users
    const commerciaux = users.filter(u => u.role === 'commercial');

    return {
      // Clients
      totalClients,
      geocodedClients,
      geocodingRate,
      assignedClients,
      unassignedClients: totalClients - assignedClients,

      // Tours
      totalTours,
      completedTours,
      inProgressTours,
      planningTours,

      // Visits
      totalVisits,
      completedVisits,
      absentVisits,
      pendingVisits,
      visitSuccessRate,

      // Quotes
      totalQuotes,
      acceptedQuotes,
      rejectedQuotes,
      pendingQuotes: pendingQuotesCount,
      totalRevenue,
      quoteConversionRate,

      // Users
      totalCommerciaux: commerciaux.length,
    };
  }, [clients, filteredTours, filteredVisits, filteredQuotes, users]);

  // Stats per commercial
  const commercialStats = useMemo(() => {
    const commerciaux = users.filter(u => u.role === 'commercial');
    
    return commerciaux.map(commercial => {
      const clientCount = clients.filter(c => c.assignedTo === commercial.id).length;
      const commercialTours = filteredTours.filter(t => t.userId === commercial.id);
      const tourIds = commercialTours.map(t => t.id);
      const commercialVisits = filteredVisits.filter(v => tourIds.includes(v.tourId));
      const completedVisits = commercialVisits.filter(v => v.status === 'completed').length;
      const commercialQuotes = filteredQuotes.filter(q => {
        const visit = visits.find(v => v.id === q.visitId);
        return visit && tourIds.includes(visit.tourId);
      });
      const acceptedQuotes = commercialQuotes.filter(q => q.status === 'accepted');
      const revenue = acceptedQuotes.reduce((sum, q) => sum + q.totalTTC, 0);

      return {
        id: commercial.id,
        name: commercial.name,
        clientCount,
        tourCount: commercialTours.length,
        visitCount: commercialVisits.length,
        completedVisits,
        quoteCount: commercialQuotes.length,
        acceptedQuotes: acceptedQuotes.length,
        revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [users, clients, filteredTours, filteredVisits, filteredQuotes, visits]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Dashboard Admin
                </h1>
                <p className="text-sm text-gray-500">Vue d'ensemble des performances</p>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={dateFilter} onValueChange={(v: DateFilter) => setDateFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                  <SelectItem value="all">Tout</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-[140px]"
                  />
                  <span className="text-gray-500">→</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-[140px]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* KPI Cards - Row 1: Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Clients</p>
                  <p className="text-3xl font-bold">{kpis.totalClients}</p>
                  <p className="text-xs text-gray-400">{kpis.geocodingRate}% géolocalisés</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tournées</p>
                  <p className="text-3xl font-bold">{kpis.totalTours}</p>
                  <p className="text-xs text-green-600">{kpis.completedTours} terminées</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Route className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Visites</p>
                  <p className="text-3xl font-bold">{kpis.totalVisits}</p>
                  <p className="text-xs text-green-600">{kpis.visitSuccessRate}% réalisées</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Chiffre d'affaires</p>
                  <p className="text-3xl font-bold">{kpis.totalRevenue.toLocaleString('fr-FR')}€</p>
                  <p className="text-xs text-gray-400">{kpis.acceptedQuotes} devis acceptés</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Euro className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards - Row 2: Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Clients Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5" />
                Détail Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Géolocalisés</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${kpis.geocodingRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{kpis.geocodedClients}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Assignés</span>
                <span className="text-sm font-medium">{kpis.assignedClients}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Non assignés</span>
                <span className="text-sm font-medium text-orange-600">{kpis.unassignedClients}</span>
              </div>
            </CardContent>
          </Card>

          {/* Visits Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Détail Visites
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Réalisées
                </span>
                <span className="text-sm font-medium text-green-600">{kpis.completedVisits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Absents
                </span>
                <span className="text-sm font-medium text-red-600">{kpis.absentVisits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  En attente
                </span>
                <span className="text-sm font-medium">{kpis.pendingVisits}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quotes Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Détail Devis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Acceptés
                </span>
                <span className="text-sm font-medium text-green-600">{kpis.acceptedQuotes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  Refusés
                </span>
                <span className="text-sm font-medium text-red-600">{kpis.rejectedQuotes}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  En cours
                </span>
                <span className="text-sm font-medium">{kpis.pendingQuotes}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Taux de conversion</span>
                  <span className="text-sm font-bold text-primary">{kpis.quoteConversionRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance by Commercial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Performance par Commercial
            </CardTitle>
            <CardDescription>
              Classement des commerciaux sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commercialStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun commercial enregistré</p>
                <Button 
                  variant="link" 
                  onClick={() => router.push('/admin/users')}
                >
                  Créer des commerciaux
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-500">#</th>
                      <th className="pb-3 font-medium text-gray-500">Commercial</th>
                      <th className="pb-3 font-medium text-gray-500 text-center">Clients</th>
                      <th className="pb-3 font-medium text-gray-500 text-center">Tournées</th>
                      <th className="pb-3 font-medium text-gray-500 text-center">Visites</th>
                      <th className="pb-3 font-medium text-gray-500 text-center">Devis</th>
                      <th className="pb-3 font-medium text-gray-500 text-right">CA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commercialStats.map((stat, index) => (
                      <tr key={stat.id} className="border-b last:border-0">
                        <td className="py-3">
                          {index === 0 && stat.revenue > 0 ? (
                            <span className="text-yellow-500">🥇</span>
                          ) : index === 1 && stat.revenue > 0 ? (
                            <span className="text-gray-400">🥈</span>
                          ) : index === 2 && stat.revenue > 0 ? (
                            <span className="text-amber-600">🥉</span>
                          ) : (
                            <span className="text-gray-400">{index + 1}</span>
                          )}
                        </td>
                        <td className="py-3 font-medium">{stat.name}</td>
                        <td className="py-3 text-center">{stat.clientCount}</td>
                        <td className="py-3 text-center">{stat.tourCount}</td>
                        <td className="py-3 text-center">
                          <span className="text-green-600">{stat.completedVisits}</span>
                          <span className="text-gray-400">/{stat.visitCount}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-green-600">{stat.acceptedQuotes}</span>
                          <span className="text-gray-400">/{stat.quoteCount}</span>
                        </td>
                        <td className="py-3 text-right font-bold">
                          {stat.revenue.toLocaleString('fr-FR')}€
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats / Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tournées Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5" />
                État des Tournées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">En planification</span>
                  <span className="font-bold text-blue-600">{kpis.planningTours}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm">En cours</span>
                  <span className="font-bold text-yellow-600">{kpis.inProgressTours}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Terminées</span>
                  <span className="font-bold text-green-600">{kpis.completedTours}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {kpis.unassignedClients > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-50 rounded text-orange-700">
                    <span className="text-sm">{kpis.unassignedClients} clients non assignés</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/admin/assignments')}
                    >
                      Assigner
                    </Button>
                  </div>
                )}
                {kpis.totalClients - kpis.geocodedClients > 0 && (
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded text-red-700">
                    <span className="text-sm">{kpis.totalClients - kpis.geocodedClients} clients sans GPS</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/clients')}
                    >
                      Corriger
                    </Button>
                  </div>
                )}
                {kpis.totalCommerciaux === 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded text-blue-700">
                    <span className="text-sm">Aucun commercial créé</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push('/admin/users')}
                    >
                      Créer
                    </Button>
                  </div>
                )}
                {kpis.unassignedClients === 0 && 
                 kpis.totalClients === kpis.geocodedClients && 
                 kpis.totalCommerciaux > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Tout est en ordre !</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
