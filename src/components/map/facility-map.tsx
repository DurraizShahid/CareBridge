"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapFacility {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address: { city: string; state: string };
}

interface FacilityMapProps {
  facilities: MapFacility[];
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function FacilityMap({ facilities, className }: FacilityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const markers: L.Marker[] = [];
    const valid = facilities.filter((f) => f.latitude != null && f.longitude != null);

    if (valid.length === 0) return;

    valid.forEach((f) => {
      const marker = L.marker([f.latitude!, f.longitude!], { icon: markerIcon })
        .addTo(map)
        .bindPopup(
          `<strong>${f.name}</strong><br/>${f.address.city}, ${f.address.state}`,
        );
      markers.push(marker);
    });

    if (valid.length === 1) {
      map.setView([valid[0].latitude!, valid[0].longitude!], 13);
    } else {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [facilities]);

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ minHeight: "400px", width: "100%" }}
    />
  );
}
