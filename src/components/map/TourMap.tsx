'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Client, Visit, LatLng } from '@/types';
import { ANGOULEME_COORDINATES } from '@/lib/geocoding';

interface TourMapProps {
  clients: Client[];
  visits: Visit[];
  currentVisitIndex: number;
  routeGeometry?: [number, number][];
  onClientClick?: (client: Client) => void;
  startPoint?: LatLng;
}

// Composant de la carte chargé dynamiquement
const MapContent = dynamic(
  () => import('./MapContent'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Chargement de la carte...</p>
        </div>
      </div>
    )
  }
);

export default function TourMap(props: TourMapProps) {
  return <MapContent {...props} />;
}
