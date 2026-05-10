/**
 * MapPicker — lazy Leaflet map for GPS pin picking (FR-F01)
 * Lazy-loads Leaflet to avoid bundle bloat (NFR-C01).
 */

import React, { useEffect, useRef, useState } from 'react';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';
import { fontSize } from '../../tokens/typography';

export interface MapPickerProps {
  lat?: number;
  lng?: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}

// Vietnam center fallback
const VN_CENTER_LAT = 10.762622;
const VN_CENTER_LNG = 106.660172;

export const MapPicker: React.FC<MapPickerProps> = ({
  lat,
  lng,
  onChange,
  height = 240,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const currentLat = lat ?? VN_CENTER_LAT;
  const currentLng = lng ?? VN_CENTER_LNG;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    // Dynamically import leaflet to avoid initial bundle bloat (NFR-C01)
    // leaflet is an optional peer dep; use Function constructor to bypass TS module resolution
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const dynamicImport = new Function('m', 'return import(m)');
    dynamicImport('leaflet').then((L: any) => {
      if (cancelled || !containerRef.current) return;

      // Leaflet default icon fix (webpack/vite breaks default icons)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Prevent double-init if effect re-runs
      if (mapRef.current) return;

      const map = L.map(containerRef.current).setView([currentLat, currentLng], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        onChange(e.latlng.lat, e.latlng.lng);
      });

      setLoaded(true);
    }).catch(() => {
      if (!cancelled) setLoadError(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker when lat/lng props change externally
  useEffect(() => {
    if (markerRef.current && lat != null && lng != null) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current?.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div>
      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          height,
          width: '100%',
          borderRadius: 8,
          border: `1px solid ${colors.background.secondary}`,
          overflow: 'hidden',
          backgroundColor: colors.background.secondary,
          position: 'relative',
        }}
      >
        {!loaded && !loadError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', backgroundColor: colors.background.secondary,
          }}>
            <span style={{ fontSize: fontSize.caption, color: colors.text.secondary }}>
              Đang tải bản đồ…
            </span>
          </div>
        )}
        {loadError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', backgroundColor: colors.background.secondary,
          }}>
            <span style={{ fontSize: fontSize.caption, color: colors.functional.alertRed }}>
              Không thể tải bản đồ. Nhập toạ độ thủ công.
            </span>
          </div>
        )}
      </div>
      {/* Coordinate read-only display */}
      <div style={{
        marginTop: spacing.xs,
        fontSize: fontSize.small,
        color: colors.text.secondary,
        padding: `${spacing.xs} ${spacing.sm}`,
        backgroundColor: colors.background.secondary,
        borderRadius: 4,
      }}>
        Vĩ độ: {currentLat.toFixed(6)} — Kinh độ: {currentLng.toFixed(6)}
      </div>
    </div>
  );
};

export default MapPicker;
