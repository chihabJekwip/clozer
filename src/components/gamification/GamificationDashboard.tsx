'use client';

import { useState, useEffect } from 'react';
import { 
  UserStats, 
  UserObjective, 
  Achievement, 
  UserAchievement,
  ObjectiveType 
} from '@/types';
import {
  getUserStatsAsync,
  getUserObjectivesAsync,
  getUserAchievementsAsync,
  getAchievements,
  getCurrentObjectives,
} from '@/lib/storage-v2';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  TrendingUp,
  Flame,
  Star,
  Zap,
  Award,
  Crown,
  Medal,
  ChevronRight,
  Lock,
  CheckCircle,
  Route,
  Euro,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';

interface GamificationDashboardProps {
  userId?: string;
  compact?: boolean;
}

const objectiveTypeLabels: Record<ObjectiveType, string> = {
  visits: 'Visites',
  revenue: 'Chiffre d\'affaires',
  quotes: 'Devis créés',
  conversions: 'Conversions',
  new_clients: 'Nouveaux clients',
};

const objectiveTypeIcons: Record<ObjectiveType, React.ReactNode> = {
  visits: <Route className="w-4 h-4" />,
  revenue: <Euro className="w-4 h-4" />,
  quotes: <FileText className="w-4 h-4" />,
  conversions: <TrendingUp className="w-4 h-4" />,
  new_clients: <Users className="w-4 h-4" />,
};

export function GamificationDashboard({ userId, compact = false }: GamificationDashboardProps) {
  const { currentUser } = useUser();
  const effectiveUserId = userId || currentUser?.id;
  
  const [stats, setStats] = useState<UserStats | null>(null);
  const [objectives, setObjectives] = useState<UserObjective[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (effectiveUserId) {
      loadData();
    }
  }, [effectiveUserId]);

  const loadData = async () => {
    if (!effectiveUserId) return;
    
    setIsLoading(true);
    const [statsData, objectivesData, achievementsData, allAchievementsData] = await Promise.all([
      getUserStatsAsync(effectiveUserId),
      getUserObjectivesAsync(effectiveUserId),
      getUserAchievementsAsync(effectiveUserId),
      Promise.resolve(getAchievements()),
    ]);

    setStats(statsData);
    setObjectives(objectivesData);
    setUserAchievements(achievementsData);
    setAllAchievements(allAchievementsData);
    setIsLoading(false);
  };

  const getLevelInfo = (level: number) => {
    const levels = [
      { name: 'Débutant', icon: '🌱', color: 'bg-green-100 text-green-700' },
      { name: 'Apprenti', icon: '📚', color: 'bg-blue-100 text-blue-700' },
      { name: 'Confirmé', icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
      { name: 'Expert', icon: '🔥', color: 'bg-orange-100 text-orange-700' },
      { name: 'Maître', icon: '💎', color: 'bg-purple-100 text-purple-700' },
      { name: 'Champion', icon: '🏆', color: 'bg-amber-100 text-amber-700' },
      { name: 'Légende', icon: '👑', color: 'bg-red-100 text-red-700' },
    ];
    return levels[Math.min(level - 1, levels.length - 1)];
  };

  const getNextLevelPoints = (currentPoints: number) => {
    const thresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
    for (const threshold of thresholds) {
      if (currentPoints < threshold) return threshold;
    }
    return thresholds[thresholds.length - 1];
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-20 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const levelInfo = getLevelInfo(stats.level);
  const nextLevelPoints = getNextLevelPoints(stats.totalPoints);
  const progressToNextLevel = Math.min(100, (stats.totalPoints / nextLevelPoints) * 100);

  // Get earned achievement IDs
  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          {/* Compact Level Display */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${levelInfo.color}`}>
              {levelInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{levelInfo.name}</span>
                <Badge variant="outline">Niv. {stats.level}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                    style={{ width: `${progressToNextLevel}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{stats.totalPoints} pts</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-lg font-bold">{stats.totalCompletedVisits}</p>
              <p className="text-[10px] text-gray-500">Visites</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-lg font-bold">{stats.currentStreak}</p>
              <p className="text-[10px] text-gray-500">Streak</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-lg font-bold">{userAchievements.length}</p>
              <p className="text-[10px] text-gray-500">Badges</p>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-lg font-bold">{Math.round(stats.totalDistanceKm)}</p>
              <p className="text-[10px] text-gray-500">km</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl">
              {levelInfo.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{levelInfo.name}</h2>
                <Badge className="bg-white/20 text-white border-0">
                  Niveau {stats.level}
                </Badge>
              </div>
              <p className="text-white/80 mt-1">{stats.totalPoints} points</p>
              <div className="mt-3">
                <div className="flex justify-between text-sm text-white/80 mb-1">
                  <span>Progression vers le niveau suivant</span>
                  <span>{Math.round(progressToNextLevel)}%</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all"
                    style={{ width: `${progressToNextLevel}%` }}
                  />
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {nextLevelPoints - stats.totalPoints} points pour le prochain niveau
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Route className="w-6 h-6 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{stats.totalCompletedVisits}</p>
              <p className="text-xs text-gray-500">Visites réalisées</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Flame className="w-6 h-6 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-gray-500">Jours consécutifs</p>
              {stats.longestStreak > stats.currentStreak && (
                <p className="text-[10px] text-gray-400">Record: {stats.longestStreak}</p>
              )}
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Euro className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{(stats.totalRevenue / 1000).toFixed(1)}k</p>
              <p className="text-xs text-gray-500">CA généré</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Route className="w-6 h-6 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-bold">{Math.round(stats.totalDistanceKm)}</p>
              <p className="text-xs text-gray-500">km parcourus</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Objectives */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objectifs en cours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {objectives.filter(o => o.isActive).map(objective => {
              const progress = Math.min(100, (objective.currentValue / objective.targetValue) * 100);
              const isCompleted = objective.currentValue >= objective.targetValue;
              
              return (
                <div key={objective.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {objectiveTypeIcons[objective.type]}
                      <span className="font-medium">{objectiveTypeLabels[objective.type]}</span>
                      <Badge variant="outline" className="text-xs">
                        {objective.periodType === 'weekly' && 'Hebdo'}
                        {objective.periodType === 'monthly' && 'Mensuel'}
                        {objective.periodType === 'daily' && 'Journalier'}
                      </Badge>
                    </div>
                    <span className={`font-bold ${isCompleted ? 'text-green-600' : ''}`}>
                      {objective.currentValue} / {objective.targetValue}
                      {objective.type === 'revenue' && '€'}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          isCompleted 
                            ? 'bg-green-500' 
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isCompleted && (
                      <CheckCircle className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Badges
              </CardTitle>
              <CardDescription>
                {userAchievements.length} / {allAchievements.length} débloqués
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {allAchievements.map(achievement => {
              const isEarned = earnedAchievementIds.has(achievement.id);
              const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
              
              return (
                <div
                  key={achievement.id}
                  className={`relative p-3 rounded-xl text-center transition-all ${
                    isEarned 
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300' 
                      : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                  }`}
                  title={`${achievement.name}: ${achievement.description}`}
                >
                  <div className="text-3xl mb-1">
                    {isEarned ? achievement.icon : <Lock className="w-6 h-6 mx-auto text-gray-400" />}
                  </div>
                  <p className={`text-xs font-medium truncate ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                    {achievement.name}
                  </p>
                  {isEarned && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-yellow-500 text-white text-[10px]">
                      +{achievement.points}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          {/* Recent achievements */}
          {userAchievements.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Derniers badges obtenus
              </h4>
              <div className="space-y-2">
                {userAchievements.slice(0, 3).map(ua => {
                  const achievement = allAchievements.find(a => a.id === ua.achievementId);
                  if (!achievement) return null;
                  
                  return (
                    <div key={ua.id} className="flex items-center gap-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-gray-500">{achievement.description}</p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(ua.earnedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Compact widget for home page
export function GamificationWidget() {
  return <GamificationDashboard compact />;
}
