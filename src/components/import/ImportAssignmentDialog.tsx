'use client';

import { useState, useEffect } from 'react';
import { Client, User } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Check,
  Upload,
} from 'lucide-react';

interface ImportAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  clients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[];
  unmatchedCommercials: string[];
  clientsWithoutCommercial: number;
  users: User[];
  onConfirm: (clients: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

export default function ImportAssignmentDialog({
  open,
  onClose,
  clients,
  unmatchedCommercials,
  clientsWithoutCommercial,
  users,
  onConfirm,
}: ImportAssignmentDialogProps) {
  // State for manual assignments: commercialName -> userId
  const [commercialAssignments, setCommercialAssignments] = useState<Record<string, string>>({});
  // State for default assignment for clients without commercial
  const [defaultAssignment, setDefaultAssignment] = useState<string>('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCommercialAssignments({});
      setDefaultAssignment('');
    }
  }, [open]);

  const handleCommercialAssignment = (commercialName: string, userId: string) => {
    setCommercialAssignments(prev => ({
      ...prev,
      [commercialName]: userId,
    }));
  };

  const handleConfirm = () => {
    // Apply manual assignments to clients
    const updatedClients = clients.map(client => {
      // Check if this client's commercial was unmatched and now has an assignment
      const originalCommercialName = (client as any).commercialName;
      
      if (client.assignedTo) {
        // Already assigned
        return client;
      } else if (originalCommercialName && commercialAssignments[originalCommercialName]) {
        // Assign based on manual commercial mapping
        return { ...client, assignedTo: commercialAssignments[originalCommercialName] };
      } else if (defaultAssignment) {
        // Apply default assignment
        return { ...client, assignedTo: defaultAssignment };
      }
      
      return client;
    });

    onConfirm(updatedClients);
  };

  // Count how many clients will still be unassigned
  const unassignedCount = clients.filter(c => {
    if (c.assignedTo) return false;
    const commercialName = (c as any).commercialName;
    if (commercialName && commercialAssignments[commercialName]) return false;
    if (defaultAssignment) return false;
    return true;
  }).length;

  const allAssigned = unassignedCount === 0;

  // Filter to only show commercials (not admins) in the select options
  const availableUsers = users.filter(u => u.role === 'commercial' || u.role === 'admin');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-visible">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Assignation des clients importés
          </DialogTitle>
          <DialogDescription>
            {clients.length} clients à importer. Assignez-les à un commercial.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-visible space-y-4 py-4">
          {/* Summary */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span>Total clients :</span>
              <span className="font-medium">{clients.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Déjà assignés :</span>
              <span className="font-medium text-green-600">
                {clients.filter(c => c.assignedTo).length}
              </span>
            </div>
            {unmatchedCommercials.length > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Commerciaux non reconnus :</span>
                <span className="font-medium">{unmatchedCommercials.length}</span>
              </div>
            )}
            {clientsWithoutCommercial > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Sans commercial dans le fichier :</span>
                <span className="font-medium">{clientsWithoutCommercial}</span>
              </div>
            )}
          </div>

          {/* Unmatched commercials section */}
          {unmatchedCommercials.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                Commerciaux non reconnus
              </div>
              <p className="text-xs text-muted-foreground">
                Ces noms de commerciaux n'ont pas été trouvés dans la base. Assignez-les manuellement.
              </p>
              
              {unmatchedCommercials.map(commercialName => (
                <div key={commercialName} className="flex items-center gap-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{commercialName}</div>
                    <div className="text-xs text-muted-foreground">
                      {clients.filter(c => (c as any).commercialName === commercialName).length} client(s)
                    </div>
                  </div>
                  <Select
                    value={commercialAssignments[commercialName] || ''}
                    onValueChange={(value) => handleCommercialAssignment(commercialName, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Assigner à..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} {user.role === 'admin' ? '(Admin)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Default assignment for clients without commercial */}
          {clientsWithoutCommercial > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <UserCheck className="w-4 h-4" />
                Assignation par défaut
              </div>
              <p className="text-xs text-muted-foreground">
                {clientsWithoutCommercial} client(s) n'ont pas de commercial dans le fichier.
              </p>
              
              <Select
                value={defaultAssignment}
                onValueChange={setDefaultAssignment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un commercial par défaut..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} {user.role === 'admin' ? '(Admin)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Warning if some clients will remain unassigned */}
          {!allAssigned && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              {unassignedCount} client(s) resteront sans commercial assigné.
            </div>
          )}

          {/* Success message */}
          {allAssigned && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300">
              <Check className="w-4 h-4 inline mr-2" />
              Tous les clients seront assignés à un commercial.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            <Upload className="w-4 h-4 mr-2" />
            Importer {clients.length} clients
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
