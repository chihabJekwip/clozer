'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserAddress } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  User as UserIcon,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Star,
  ArrowLeft,
  Home,
  Save,
  Navigation,
  Palette,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import {
  getCurrentUser,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} from '@/lib/storage';
import { geocodeAddress } from '@/lib/geocoding';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ThemeSelector } from '@/contexts/ThemeContext';
import { GamificationWidget } from '@/components/gamification/GamificationDashboard';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load user and addresses
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadAddresses(currentUser.id);
    }
  }, []);

  const loadAddresses = (userId: string) => {
    const userAddresses = getUserAddresses(userId);
    setAddresses(userAddresses);
  };

  const resetForm = () => {
    setFormName('');
    setFormAddress('');
    setFormCity('');
    setFormPostalCode('');
    setFormIsDefault(false);
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setEditingAddress(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (address: UserAddress) => {
    setFormName(address.name);
    setFormAddress(address.address);
    setFormCity(address.city);
    setFormPostalCode(address.postalCode);
    setFormIsDefault(address.isDefault);
    setFormError(null);
    setEditingAddress(address);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingAddress(null);
    resetForm();
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    
    if (!formName.trim() || !formAddress.trim() || !formCity.trim() || !formPostalCode.trim()) {
      setFormError('Tous les champs sont obligatoires.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    // Geocode the address
    const fullAddress = `${formAddress}, ${formPostalCode} ${formCity}`;
    setIsGeocoding(true);
    
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const result = await geocodeAddress(fullAddress);
      if (result) {
        lat = result.lat;
        lng = result.lng;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    setIsGeocoding(false);

    try {
      if (editingAddress) {
        // Update existing
        await updateUserAddress(editingAddress.id, {
          name: formName.trim(),
          address: formAddress.trim(),
          city: formCity.trim(),
          postalCode: formPostalCode.trim(),
          latitude: lat,
          longitude: lng,
          isDefault: formIsDefault,
        });
      } else {
        // Add new
        await addUserAddress({
          userId: user.id,
          name: formName.trim(),
          address: formAddress.trim(),
          city: formCity.trim(),
          postalCode: formPostalCode.trim(),
          latitude: lat,
          longitude: lng,
          isDefault: formIsDefault || addresses.length === 0,
        });
      }

      loadAddresses(user.id);
      closeModal();
    } catch (error) {
      setFormError('Erreur lors de l\'enregistrement.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    if (!confirm('Supprimer cette adresse ?')) return;

    await deleteUserAddress(addressId);
    loadAddresses(user.id);
  };

  const handleSetDefault = async (address: UserAddress) => {
    if (!user || address.isDefault) return;

    await updateUserAddress(address.id, { isDefault: true });
    loadAddresses(user.id);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background border-b">
          <div className="container flex items-center gap-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">Mon profil</h1>
            </div>
          </div>
        </header>

        <main className="container py-6 space-y-6">
          {/* Gamification Widget */}
          {user && user.role === 'commercial' && (
            <div className="cursor-pointer" onClick={() => router.push('/gamification')}>
              <GamificationWidget />
            </div>
          )}

          {/* User info */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserIcon className="w-5 h-5" />
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Nom</Label>
                  <p className="font-medium">{user.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Rôle</Label>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Administrateur' : 'Commercial'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theme Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-5 h-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Choisissez le thème de l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector />
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-5 h-5" />
                    Mes adresses
                  </CardTitle>
                  <CardDescription>
                    Points de départ personnalisés pour vos tournées
                  </CardDescription>
                </div>
                <Button size="sm" onClick={openAddModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune adresse enregistrée</p>
                  <p className="text-sm">
                    Ajoutez votre domicile ou d'autres points de départ
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 rounded-lg border ${
                        address.isDefault
                          ? 'bg-primary/5 border-primary'
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{address.name}</span>
                            {address.isDefault && (
                              <Badge variant="default" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                Par défaut
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.address}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.postalCode} {address.city}
                          </p>
                          {address.latitude && address.longitude ? (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              Géolocalisée
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600 mt-1">
                              Non géolocalisée
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {!address.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefault(address)}
                              title="Définir par défaut"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(address)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Add/Edit modal */}
        <Dialog open={isAddModalOpen} onOpenChange={closeModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {editingAddress ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
              </DialogTitle>
              <DialogDescription>
                Cette adresse pourra être utilisée comme point de départ de vos tournées
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">
                  Nom <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Domicile, Bureau secondaire..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="address">
                  Adresse <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Numéro et rue"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="postalCode">
                    Code postal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder="16000"
                    value={formPostalCode}
                    onChange={(e) => setFormPostalCode(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="city">
                    Ville <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Angoulême"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Définir comme adresse par défaut</span>
              </label>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                  disabled={isSaving}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveAddress}
                  disabled={isSaving || isGeocoding}
                  className="flex-1"
                >
                  {isSaving || isGeocoding ? (
                    isGeocoding ? 'Géolocalisation...' : 'Enregistrement...'
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
      </div>
    </AuthGuard>
  );
}
