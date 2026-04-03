import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

const LocationMarker = ({ lat, lng, onChange }: { lat: number, lng: number, onChange: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker position={[lat, lng]} />
  );
};

const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, radius, onChange }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat: newLat, lon: newLng } = data[0];
        onChange(parseFloat(newLat), parseFloat(newLng));
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Cari lokasi (contoh: Tasikmalaya, Jawa Barat)"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-stone-800 transition-all active:scale-95"
        >
          CARI
        </button>
      </div>

      <div className="h-[400px] rounded-3xl overflow-hidden border border-stone-200 shadow-inner relative z-0">
        <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <ChangeView center={[lat, lng]} />
          <LocationMarker lat={lat} lng={lng} onChange={onChange} />
          <Circle
            center={[lat, lng]}
            radius={radius}
            pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2 }}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPicker;
