'use client';

import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import type { ReactNode } from 'react';

/**
 * TerritoryMap — react-leaflet + OpenStreetMap wrapper.
 *
 * Free, open-source, no API key. Loaded via next/dynamic + `ssr: false`
 * because leaflet touches `window` on import.
 */
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then((m) => m.Circle), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then((m) => m.Tooltip), { ssr: false });

export interface MapCircle {
  center: LatLngExpression;
  /** Radius in kilometres. */
  radiusKm: number;
  color?: string;
  fillColor?: string;
  label?: string;
}

export interface MapMarker {
  position: LatLngExpression;
  color?: string;
  label?: string;
}

interface TerritoryMapProps {
  center: LatLngExpression;
  zoom?: number;
  radiusKm?: number;
  circles?: MapCircle[];
  markers?: MapMarker[];
  className?: string;
  legend?: ReactNode;
}

export function TerritoryMap({
  center,
  zoom = 12,
  radiusKm,
  circles = [],
  markers = [],
  className,
  legend,
}: TerritoryMapProps) {
  const allCircles: MapCircle[] =
    typeof radiusKm === 'number' ? [{ center, radiusKm }, ...circles] : circles;

  return (
    <div
      className={
        className ??
        'relative h-80 w-full overflow-hidden rounded-xl border border-gray-200'
      }
    >
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {allCircles.map((c, i) => (
          <Circle
            key={`c-${i}`}
            center={c.center}
            radius={c.radiusKm * 1000}
            pathOptions={{
              color: c.color ?? '#2563eb',
              fillColor: c.fillColor ?? '#3b82f6',
              fillOpacity: 0.12,
              weight: 2,
            }}
          >
            {c.label && <Tooltip>{c.label}</Tooltip>}
          </Circle>
        ))}
        {markers.map((m, i) => (
          <CircleMarker
            key={`m-${i}`}
            center={m.position}
            radius={7}
            pathOptions={{
              color: m.color ?? '#1d4ed8',
              fillColor: m.color ?? '#1d4ed8',
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            {m.label && <Tooltip>{m.label}</Tooltip>}
          </CircleMarker>
        ))}
      </MapContainer>
      {legend && (
        // Leaflet controls sit at z-index 1000. We need to clear them, not
        // tie at 1000 (which gives unpredictable stacking by source order).
        <div className="pointer-events-auto absolute bottom-3 right-3 z-[1100] rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm">
          {legend}
        </div>
      )}
    </div>
  );
}
