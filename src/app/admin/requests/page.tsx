'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ReactivationRequestsList } from '@/components/admin';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { getCurrentUser } from '@/lib/storage';

export default function AdminRequestsPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="container flex items-center gap-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Demandes de réactivation
              </h1>
            </div>
          </div>
        </header>

        <main className="container py-6">
          {currentUser && (
            <ReactivationRequestsList
              currentUserId={currentUser.id}
              onRequestReviewed={() => {
                // Could refresh data or show toast
              }}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
