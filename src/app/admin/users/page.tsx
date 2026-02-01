'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, UserRole } from '@/types';
import { getUsers, updateUser, getClientsByUser, getUsersAsync } from '@/lib/storage';
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
  X,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'commercial' as UserRole,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await getUsersAsync();
    setUsers(allUsers);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingUser(null);
    setError(null);
    setFormData({ name: '', email: '', password: '', role: 'commercial' });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsCreating(false);
    setError(null);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setError('Le nom et l\'email sont requis');
      return;
    }

    // For creation, password is required
    if (isCreating && !formData.password) {
      setError('Le mot de passe est requis pour créer un utilisateur');
      return;
    }

    if (isCreating && formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isCreating) {
        // Call API to create user with Supabase Auth
        const response = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Erreur lors de la création');
          setIsSubmitting(false);
          return;
        }
      } else if (editingUser) {
        // For editing, we only update name, email, role (not password for now)
        updateUser(editingUser.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        });
      }

      await loadUsers();
      refreshUsers();
      setIsCreating(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'commercial' });
    } catch (err) {
      console.error('Save error:', err);
      setError('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    // Check for default admin ID
    if (user.id === '00000000-0000-0000-0000-000000000001') {
      alert('Impossible de supprimer l\'administrateur par défaut');
      return;
    }

    const clientCount = getClientsByUser(user.id).length;
    const message = clientCount > 0
      ? `Êtes-vous sûr de vouloir supprimer ${user.name} ? Les ${clientCount} clients assignés seront désassignés.`
      : `Êtes-vous sûr de vouloir supprimer ${user.name} ?`;

    if (confirm(message)) {
      try {
        const response = await fetch(`/api/auth/create-user?userId=${user.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const result = await response.json();
          alert(result.error || 'Erreur lors de la suppression');
          return;
        }

        await loadUsers();
        refreshUsers();
      } catch (err) {
        console.error('Delete error:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingUser(null);
    setError(null);
    setFormData({ name: '', email: '', password: '', role: 'commercial' });
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
          <Button onClick={handleCreate} disabled={isCreating || !!editingUser}>
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
              {isCreating && (
                <CardDescription>
                  Un compte sera créé avec l'email et le mot de passe définis
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jean Dupont"
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password field - only for creation */}
              {isCreating && (
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 caractères"
                      className="pl-10 pr-10"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    L'utilisateur pourra se connecter avec cet email et ce mot de passe
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger disabled={isSubmitting}>
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
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
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
                    {user.id !== '00000000-0000-0000-0000-000000000001' && (
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
