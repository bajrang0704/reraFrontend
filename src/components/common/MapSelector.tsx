"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet with Next.js/React
const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapSelectorProps {
    lat?: number;
    lng?: number;
    onSelect: (lat: number, lng: number) => void;
    center?: [number, number]; // For search recentering
}

// Handles map clicks to update marker
function LocationMarker({ onSelect, position }: { onSelect: (lat: number, lng: number) => void, position: L.LatLng | null }) {
    useMapEvents({
        click(e) {
            onSelect(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : <Marker position={position} />;
}

// Handles recentering the map when search coords change
function Recenter({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center]);
    return null;
}

export default function MapSelector({ lat, lng, onSelect, center }: MapSelectorProps) {
    const defaultCenter: [number, number] = [17.3850, 78.4867]; // Hyderabad
    const position = lat && lng ? new L.LatLng(lat, lng) : null;
    // If center is provided (from search), use it. Otherwise use current position or default.
    const mapCenter = center || (lat && lng ? [lat, lng] : defaultCenter);

    return (
        <MapContainer center={mapCenter} zoom={13} style={{ height: "400px", width: "100%", borderRadius: "8px" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker onSelect={onSelect} position={position} />
            <Recenter center={mapCenter} />
        </MapContainer>
    );
}
