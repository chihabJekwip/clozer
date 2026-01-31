'use client';

import { useState, useEffect } from 'react';
import { UserAddress, AppSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Building2,
  Home,
  MapPin,
  Plus,
  Check,
  Navigation,
} from 'lucide-react';
import { getUserAddresses, getSettings } from '@/lib/storage';
import { geocodeAddress } from '@/lib/geocoding';

interface StartPointSelectorProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSelect: (startPoint: { lat: number; lng: number; address: string }) => void;
  currentStartPoint?: { lat: number; lng: number; address: string };
}

type OptionType = 'headquarters' | 'user_address' | 'custom';

export default function StartPointSelector({
  open,
  onClose,
  userId,
  onSelect,
  currentStartPoint,
}: StartPointSelectorProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionType>('headquarters');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [isGeocodingCustom, setIsGeocodingCustom] = useState(false);
  const [customGeocodedPoint, setCustomGeocodedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      setSettings(getSettings());
      setUserAddresses(getUserAddresses(userId));
      
      // Reset state
      setSelectedOption('headquarters');
      setSelectedAddressId(null);
      setCustomAddress('');
      setCustomGeocodedPoint(null);
      setGeocodingError(null);
    }
  }, [open, userId]);

  const handleGeocodeCustom = async () => {
    if (!customAddress.trim()) return;
    
    setIsGeocodingCustom(true);
    setGeocodingError(null);
    
    try {
      const result = await geocodeAddress(customAddress);
      if (result) {
        setCustomGeocodedPoint({ lat: result.lat, lng: result.lng });
      } else {
        setGeocodingError('Adresse non trouvée. Vérifiez l\'orthographe.');
      }
    } catch (error) {
      setGeocodingError('Erreur lors de la recherche de l\'adresse.');
    } finally {
      setIsGeocodingCustom(false);
    }
  };

  const handleConfirm = () => {
    let startPoint: { lat: number; lng: number; address: string } | null = null;
    
    if (selectedOption === 'headquarters' && settings?.headquarters) {
      if (settings.headquarters.lat && settings.headquarters.lng) {
        startPoint = {
          lat: settings.headquarters.lat,
          lng: settings.headquarters.lng,
          address: `${settings.headquarters.address}, ${settings.headquarters.postalCode} ${settings.headquarters.city}`,
        };
      }
    } else if (selectedOption === 'user_address' && selectedAddressId) {
      const addr = userAddresses.find(a => a.id === selectedAddressId);
      if (addr && addr.latitude && addr.longitude) {
        startPoint = {
          lat: addr.latitude,
          lng: addr.longitude,
          address: `${addr.address}, ${addr.postalCode} ${addr.city}`,
        };
      }
    } else if (selectedOption === 'custom' && customGeocodedPoint) {
      startPoint = {
        lat: customGeocodedPoint.lat,
        lng: customGeocodedPoint.lng,
        address: customAddress,
      };
    }
    
    if (startPoint) {
      onSelect(startPoint);
      onClose();
    }
  };

  const canConfirm = () => {
    if (selectedOption === 'headquarters') {
      return settings?.headquarters?.lat && settings?.headquarters?.lng;
    }
    if (selectedOption === 'user_address') {
      const addr = userAddresses.find(a => a.id === selectedAddressId);
      return addr && addr.latitude && addr.longitude;
    }
    if (selectedOption === 'custom') {
      return customGeocodedPoint !== null;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Point de départ
          </DialogTitle>
          <DialogDescription>
            Choisissez le point de départ pour cette tournée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Option 1: Headquarters */}
          <button
            onClick={() => setSelectedOption('headquarters')}
            className={`
              w-full p-4 rounded-lg border-2 text-left transition-all
              ${selectedOption === 'headquarters'
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }
            `}
          >
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  Siège social
                  {selectedOption === 'headquarters' && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                {settings?.headquarters ? (
                  <div className="text-sm text-muted-foreground mt-1">
                    {settings.headquarters.address}<br />
                    {settings.headquarters.postalCode} {settings.headquarters.city}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mt-1">
                    Non configuré
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Option 2: User addresses */}
          {userAddresses.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Home className="w-4 h-4" />
                Mes adresses
              </div>
              
              {userAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => {
                    setSelectedOption('user_address');
                    setSelectedAddressId(addr.id);
                  }}
                  className={`
                    w-full p-3 rounded-lg border-2 text-left transition-all
                    ${selectedOption === 'user_address' && selectedAddressId === addr.id
                      ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {addr.name}
                        {addr.isDefault && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            Par défaut
                          </span>
                        )}
                        {selectedOption === 'user_address' && selectedAddressId === addr.id && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {addr.address}, {addr.postalCode} {addr.city}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Option 3: Custom address */}
          <div className="space-y-2">
            <button
              onClick={() => setSelectedOption('custom')}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                ${selectedOption === 'custom'
                  ? 'bg-green-50 border-green-500 ring-2 ring-green-500'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <Plus className="w-5 h-5 mt-0.5 shrink-0 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    Adresse personnalisée
                    {selectedOption === 'custom' && customGeocodedPoint && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Saisir une adresse spécifique pour ce départ
                  </div>
                </div>
              </div>
            </button>

            {selectedOption === 'custom' && (
              <div className="ml-8 space-y-2">
                <Label>Adresse de départ</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 15 rue du Commerce, 16000 Angoulême"
                    value={customAddress}
                    onChange={(e) => {
                      setCustomAddress(e.target.value);
                      setCustomGeocodedPoint(null);
                      setGeocodingError(null);
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGeocodeCustom}
                    disabled={!customAddress.trim() || isGeocodingCustom}
                    variant="secondary"
                  >
                    {isGeocodingCustom ? 'Recherche...' : 'Vérifier'}
                  </Button>
                </div>
                
                {geocodingError && (
                  <p className="text-sm text-red-600">{geocodingError}</p>
                )}
                
                {customGeocodedPoint && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Adresse trouvée et validée
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm()}
              className="flex-1"
            >
              Confirmer le départ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
