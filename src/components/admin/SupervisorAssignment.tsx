'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Users,
  UserCog,
  Mail,
  Check,
  Save,
} from 'lucide-react';
import {
  getUsers,
  getSupervisorIds,
  setUserSupervisors,
} from '@/lib/storage';

interface SupervisorAssignmentProps {
  open: boolean;
  onClose: () => void;
  commercial: User;
  onSaved?: () => void;
}

export default function SupervisorAssignment({
  open,
  onClose,
  commercial,
  onSaved,
}: SupervisorAssignmentProps) {
  const [admins, setAdmins] = useState<User[]>([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      const allUsers = getUsers();
      const adminUsers = allUsers.filter((u) => u.role === 'admin' && u.id !== commercial.id);
      setAdmins(adminUsers);

      const currentSupervisors = getSupervisorIds(commercial.id);
      setSelectedSupervisors(new Set(currentSupervisors));
    }
  }, [open, commercial.id]);

  const toggleSupervisor = (supervisorId: string) => {
    setSelectedSupervisors((prev) => {
      const next = new Set(prev);
      if (next.has(supervisorId)) {
        next.delete(supervisorId);
      } else {
        next.add(supervisorId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setUserSupervisors(commercial.id, Array.from(selectedSupervisors));
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error saving supervisors:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Superviseurs de {commercial.name}
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les superviseurs qui recevront les rapports de tournée par email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Info box */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <Mail className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Notifications par email</p>
              <p className="text-blue-600">
                Les superviseurs sélectionnés recevront automatiquement les
                rapports de tournée une fois validés.
              </p>
            </div>
          </div>

          {/* Supervisors list */}
          {admins.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucun administrateur disponible</p>
              <p className="text-sm">
                Créez d'abord des comptes administrateurs
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Superviseurs disponibles</Label>
              
              {admins.map((admin) => {
                const isSelected = selectedSupervisors.has(admin.id);
                
                return (
                  <button
                    key={admin.id}
                    type="button"
                    onClick={() => toggleSupervisor(admin.id)}
                    className={`
                      w-full p-3 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'bg-primary/5 border-primary'
                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{admin.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {admin.email}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {selectedSupervisors.size > 0 && (
            <div className="p-2 bg-green-50 rounded text-sm text-green-700">
              <Check className="w-4 h-4 inline mr-1" />
              {selectedSupervisors.size} superviseur{selectedSupervisors.size > 1 ? 's' : ''} sélectionné{selectedSupervisors.size > 1 ? 's' : ''}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                'Enregistrement...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// List view for admin users page
export function SupervisorsList({ userId }: { userId: string }) {
  const [supervisorIds, setSupervisorIds] = useState<string[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);

  useEffect(() => {
    const ids = getSupervisorIds(userId);
    setSupervisorIds(ids);

    const users = getUsers();
    setSupervisors(users.filter((u) => ids.includes(u.id)));
  }, [userId]);

  if (supervisors.length === 0) {
    return (
      <span className="text-sm text-muted-foreground italic">
        Aucun superviseur
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {supervisors.map((s) => (
        <span
          key={s.id}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}
