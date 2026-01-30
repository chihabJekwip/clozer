'use client';

import { useEffect, useState } from 'react';
import { Client, Visit, LatLng } from '@/types';
import { ANGOULEME_COORDINATES } from '@/lib/geocoding';

// Import dynamique de Leaflet pour éviter les erreurs SSR
let L: typeof import('leaflet') | null = null;
let MapContainer: typeof import('react-leaflet').MapContainer | null = null;
let TileLayer: typeof import('react-leaflet').TileLayer | null = null;
let Marker: typeof import('react-leaflet').Marker | null = null;
let Popup: typeof import('react-leaflet').Popup | null = null;
let Polyline: typeof import('react-leaflet').Polyline | null = null;
let useMap: typeof import('react-leaflet').useMap | null = null;

interface TourMapProps {
  clients: Client[];
  visits: Visit[];
  currentVisitIndex: number;
  routeGeometry?: [number, number][];
  onClientClick?: (client: Client) => void;
  startPoint?: LatLng;
}

// Composant pour centrer la carte sur la position actuelle
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap?.();
  
  useEffect(() => {
    if (map && center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
}

export default function TourMap({
  clients,
  visits,
  currentVisitIndex,
  routeGeometry,
  onClientClick,
  startPoint = ANGOULEME_COORDINATES,
}: TourMapProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [icons, setIcons] = useState<{
    start: L.Icon | null;
    pending: L.Icon | null;
    current: L.Icon | null;
    completed: L.Icon | null;
    absent: L.Icon | null;
  }>({ start: null, pending: null, current: null, completed: null, absent: null });

  // Charger Leaflet côté client uniquement
  useEffect(() => {
    const loadLeaflet = async () => {
      const leaflet = await import('leaflet');
      const reactLeaflet = await import('react-leaflet');
      
      L = leaflet.default || leaflet;
      MapContainer = reactLeaflet.MapContainer;
      TileLayer = reactLeaflet.TileLayer;
      Marker = reactLeaflet.Marker;
      Popup = reactLeaflet.Popup;
      Polyline = reactLeaflet.Polyline;
      useMap = reactLeaflet.useMap;
      
      // Créer les icônes
      const createIcon = (color: string, size: number = 25) => {
        return L!.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
          "></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });
      };

      setIcons({
        start: createIcon('#3b82f6', 30), // Bleu - point de départ
        pending: createIcon('#6b7280', 22), // Gris - à visiter
        current: createIcon('#22c55e', 30), // Vert - en cours
        completed: createIcon('#10b981', 22), // Vert clair - terminé
        absent: createIcon('#f97316', 22), // Orange - absent
      });
      
      setIsLoaded(true);
    };

    loadLeaflet();
  }, []);

  // Créer un mapping client -> visite
  const clientVisitMap = new Map<string, Visit>();
  visits.forEach(v => {
    const client = clients.find(c => c.id === v.clientId);
    if (client) {
      clientVisitMap.set(client.id, v);
    }
  });

  // Trouver les clients avec coordonnées
  const geolocatedClients = clients.filter(c => c.latitude && c.longitude);

  // Calculer le centre de la carte
  const getMapCenter = (): [number, number] => {
    if (currentVisitIndex >= 0 && visits[currentVisitIndex]) {
      const currentVisit = visits[currentVisitIndex];
      const currentClient = clients.find(c => c.id === currentVisit.clientId);
      if (currentClient?.latitude && currentClient?.longitude) {
        return [currentClient.latitude, currentClient.longitude];
      }
    }
    return [startPoint.lat, startPoint.lng];
  };

  // Déterminer l'icône pour chaque client
  const getClientIcon = (client: Client) => {
    const visit = clientVisitMap.get(client.id);
    if (!visit) return icons.pending;
    
    const visitIndex = visits.findIndex(v => v.id === visit.id);
    
    if (visitIndex === currentVisitIndex) return icons.current;
    if (visit.status === 'completed') return icons.completed;
    if (visit.status === 'absent' || visit.status === 'skipped') return icons.absent;
    return icons.pending;
  };

  if (!isLoaded || !MapContainer || !TileLayer || !Marker || !Popup || !Polyline) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={getMapCenter()}
      zoom={11}
      className="w-full h-full"
      style={{ minHeight: '200px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Point de départ (bureau) */}
      {icons.start && (
        <Marker
          position={[startPoint.lat, startPoint.lng]}
          icon={icons.start}
        >
          <Popup>
            <div className="text-center">
              <strong>Point de départ</strong>
              <br />
              <span className="text-sm text-gray-600">{startPoint.address || 'Angoulême'}</span>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Marqueurs des clients */}
      {geolocatedClients.map((client, index) => {
        const icon = getClientIcon(client);
        const visit = clientVisitMap.get(client.id);
        const visitIndex = visit ? visits.findIndex(v => v.id === visit.id) : -1;
        
        return icon && client.latitude && client.longitude ? (
          <Marker
            key={client.id}
            position={[client.latitude, client.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => onClientClick?.(client),
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <div className="font-semibold">
                  {visitIndex >= 0 && <span className="text-primary mr-1">#{visitIndex + 1}</span>}
                  {client.civilite} {client.nom}
                </div>
                <div className="text-sm text-gray-600">{client.prenom}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {client.adresse}<br />
                  {client.codePostal} {client.ville}
                </div>
                {client.portableM && (
                  <a
                    href={`tel:${client.portableM}`}
                    className="text-xs text-blue-600 hover:underline block mt-1"
                  >
                    {client.portableM}
                  </a>
                )}
                {visit && (
                  <div className="mt-2 text-xs">
                    <span className={`
                      px-2 py-0.5 rounded-full
                      ${visit.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                      ${visit.status === 'pending' ? 'bg-gray-100 text-gray-800' : ''}
                      ${visit.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : ''}
                      ${visit.status === 'absent' ? 'bg-orange-100 text-orange-800' : ''}
                    `}>
                      {visit.status === 'completed' && 'Visité'}
                      {visit.status === 'pending' && 'À visiter'}
                      {visit.status === 'in_progress' && 'En cours'}
                      {visit.status === 'absent' && 'Absent'}
                    </span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ) : null;
      })}

      {/* Tracé de l'itinéraire */}
      {routeGeometry && routeGeometry.length > 0 && (
        <Polyline
          positions={routeGeometry}
          color="#3b82f6"
          weight={4}
          opacity={0.7}
        />
      )}

      <MapCenterUpdater center={getMapCenter()} />
    </MapContainer>
  );
}
