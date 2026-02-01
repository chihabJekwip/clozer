'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserRole } from '@/types';
import { getUsers, addUser, updateUser, deleteUser, getClientsByUser } from '@/lib/storage';
import { useUser } from '@/contexts/UserContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Shield, 
  Briefcase,
  Users,
  Save,
  X
} from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <AuthGuard requireAdmin>
      <AdminUsersContent />
    </AuthGuard>
  );
}

function AdminUsersContent() {
  const router = useRouter();
  const { refreshUsers } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'commercial' as UserRole,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'commercial' });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsCreating(false);
    setFormData({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return;

    if (isCreating) {
      addUser({
        ...formData,
        notificationPreferences: { email: true, push: true, sms: false },
        theme: 'system',
        language: 'fr',
      });
    } else if (editingUser) {
      updateUser(editingUser.id, formData);
    }

    loadUsers();
    refreshUsers();
    setIsCreating(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'commercial' });
  };

  const handleDelete = (user: User) => {
    if (user.id === 'admin-default') {
      alert('Impossible de supprimer l\'administrateur par défaut');
      return;
    }

    const clientCount = getClientsByUser(user.id).length;
    const message = clientCount > 0
      ? `Êtes-vous sûr de vouloir supprimer ${user.name} ? Les ${clientCount} clients assignés seront désassignés.`
      : `Êtes-vous sûr de vouloir supprimer ${user.name} ?`;

    if (confirm(message)) {
      deleteUser(user.id);
      loadUsers();
      refreshUsers();
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'commercial' });
  };

  const admins = users.filter(u => u.role === 'admin');
  const commerciaux = users.filter(u => u.role === 'commercial');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Gestion des Utilisateurs</h1>
            <p className="text-sm text-gray-500">Gérer les administrateurs et commerciaux</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Formulaire de création/édition */}
        {(isCreating || editingUser) && (
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Nouvel utilisateur' : `Modifier ${editingUser?.name}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jean.dupont@exemple.fr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Administrateur
                      </div>
                    </SelectItem>
                    <SelectItem value="commercial">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Commercial
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des administrateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Administrateurs ({admins.length})
            </CardTitle>
            <CardDescription>
              Accès complet à toutes les fonctionnalités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {admins.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {user.id !== 'admin-default' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Liste des commerciaux */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Commerciaux ({commerciaux.length})
            </CardTitle>
            <CardDescription>
              Accès à leur portefeuille clients assigné
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commerciaux.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucun commercial enregistré</p>
                <Button variant="link" onClick={handleCreate}>
                  Créer un commercial
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {commerciaux.map(user => {
                  const clientCount = getClientsByUser(user.id).length;
                  return (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          {user.email} • {clientCount} client{clientCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
