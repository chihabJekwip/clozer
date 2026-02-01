'use client';

import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SalesPipeline } from '@/components/pipeline/SalesPipeline';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target } from 'lucide-react';

export default function PipelinePage() {
  return (
    <AuthGuard>
      <PipelineContent />
    </AuthGuard>
  );
}

function PipelineContent() {
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
                <Target className="w-6 h-6" />
                Pipeline commercial
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gérez vos opportunités et suivez votre pipeline
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <SalesPipeline />
      </main>
    </div>
  );
}
