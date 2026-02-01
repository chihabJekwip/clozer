'use client';

import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { GamificationDashboard } from '@/components/gamification/GamificationDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy } from 'lucide-react';

export default function GamificationPage() {
  return (
    <AuthGuard>
      <GamificationContent />
    </AuthGuard>
  );
}

function GamificationContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Performance & Badges
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Suivez vos objectifs et débloquez des badges
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        <GamificationDashboard />
      </main>
    </div>
  );
}
