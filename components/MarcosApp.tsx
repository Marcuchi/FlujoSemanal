
import React from 'react';
import { Database, ref, onValue, set } from 'firebase/database';
import { Map as MapIcon, MapPin, Plus, Trash2, ArrowLeft, Navigation, User, Search, Crosshair } from 'lucide-react';
import { MarcosLogisticsData, LogisticsZone } from '../types';
import { generateId } from '../utils';
import * as L from 'leaflet';

interface MarcosAppProps {
  db: Database | null;
  weekKey: string; // Added weekKey from props usage in App.tsx
}

// Cordoba Center
const DEFAULT_CENTER: [number, number] = [-31.4201, -64.1888];
const DEFAULT_ZOOM = 9;

export const MarcosApp: React.FC<MarcosAppProps> = ({ db }) => {
  const [view, setView] = React.useState<'HOME' | 'MAP'>('HOME');
  const [zones, setZones] = React.useState<MarcosLogisticsData>([]);
  
  // Inputs
  const [localityInput, setLocalityInput] = React.useState('');
  const [courierInput, setCourierInput] = React.useState('');
  const [radiusInput, setRadiusInput] = React.useState(2000); // meters
  const [isSearching, setIsSearching] = React.useState(false);
  const [manualMode, setManualMode] = React.useState(false);

  // Map Refs
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const layersRef = React.useRef<L.LayerGroup | null>(null);

  // Load Data
  React.useEffect(() => {
    if (db) {
      const dataRef = ref(db, `logistics`); 
      const unsubscribe = onValue(dataRef, (snapshot) => {
        const val = snapshot.val();
        setZones(val || []);
      });
      return () => unsubscribe();
    } else {
      const saved = localStorage.getItem(`marcos_logistics`);
      if (saved) {
        try { setZones(JSON.parse(saved)); } catch (e) { setZones([]); }
      }
    }
  }, [db]);

  const saveZones = (newZones: MarcosLogisticsData) => {
    if (db) {
      set(ref(db, `logistics`), newZones);
    } else {
      setZones(newZones);
      localStorage.setItem(`marcos_logistics`, JSON.stringify(newZones));
    }
  };

  // --- MAP INITIALIZATION ---
  React.useEffect(() => {
    if (view === 'MAP' && mapContainerRef.current && !mapInstanceRef.current) {
        // Initialize Map
        const map = L.map(mapContainerRef.current, {
            zoomControl: false // We will add it manually or rely on scroll
        }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        
        // Add Zoom Control to top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Add OpenStreetMap Tile Layer (Dark/Neutral theme if possible, but standard is fine)
        // Using CartoDB Dark Matter for that "Tech/Cyber" look matching the app
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layersRef.current = layerGroup;
        mapInstanceRef.current = map;

        // Click Handler for Manual Mode
        map.on('click', (e) => {
            handleMapClickInternal(e.latlng.lat, e.latlng.lng);
        });

        // Force invalidation to ensure map fills container correctly after render
        setTimeout(() => {
            map.invalidateSize();
        }, 200);
    }

    return () => {
        if (view === 'HOME' && mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            layersRef.current = null;
        }
    };
  }, [view]);

  // Handle Resize
  React.useEffect(() => {
      const handleResize = () => {
          if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize();
          }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ref for accessing current state inside Leaflet callbacks
  const stateRef = React.useRef({ manualMode, localityInput, courierInput, radiusInput, zones });
  React.useEffect(() => {
      stateRef.current = { manualMode, localityInput, courierInput, radiusInput, zones };
  }, [manualMode, localityInput, courierInput, radiusInput, zones]);

  const handleMapClickInternal = (lat: number, lng: number) => {
      const { manualMode, localityInput, courierInput, radiusInput, zones } = stateRef.current;
      
      if (manualMode) {
          if (!courierInput.trim()) {
              alert("Por favor ingrese un nombre de repartidor antes de ubicar el punto.");
              return;
          }
          
          const label = localityInput.trim() || "Ubicación Manual";
          
          const newZone: LogisticsZone = {
              id: generateId(),
              locality: label,
              courier: courierInput,
              lat: lat,
              lng: lng,
              radius: radiusInput
          };

          const newZones = [...zones, newZone];
          if (db) set(ref(db, `logistics`), newZones);
          else {
              setZones(newZones);
              localStorage.setItem(`marcos_logistics`, JSON.stringify(newZones));
          }
      }
  };

  // --- RENDER ZONES ON MAP ---
  React.useEffect(() => {
      if (!mapInstanceRef.current || !layersRef.current) return;
      
      const layerGroup = layersRef.current;
      layerGroup.clearLayers();

      zones.forEach(zone => {
          // VALIDATION: Ensure lat/lng exist and are numbers to prevent crash with old data
          if (typeof zone.lat !== 'number' || typeof zone.lng !== 'number') return;

          // Circle
          const circle = L.circle([zone.lat, zone.lng], {
              color: '#d946ef', // fuchsia-500
              fillColor: '#d946ef',
              fillOpacity: 0.2,
              radius: zone.radius || 2000
          }).addTo(layerGroup);

          // Marker (Invisible but clickable/hoverable center or a custom icon)
          // Using a simple circle marker for the center
          const marker = L.circleMarker([zone.lat, zone.lng], {
              radius: 5,
              fillColor: '#fff',
              color: '#d946ef',
              weight: 2,
              opacity: 1,
              fillOpacity: 1
          }).addTo(layerGroup);

          // Tooltip (Hover)
          const tooltipContent = `
            <div class="text-center">
                <div class="font-bold uppercase text-xs text-slate-700">${zone.locality}</div>
                <div class="text-fuchsia-600 font-bold text-sm">${zone.courier}</div>
            </div>
          `;
          
          marker.bindTooltip(tooltipContent, {
              permanent: false,
              direction: 'top',
              className: 'custom-leaflet-tooltip' // You can style this in global CSS if needed
          });
          
          // Also bind to circle for easier hovering
          circle.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top'
          });
      });

  }, [zones, view]);


  // --- HANDLERS ---

  const handleSearchAndAdd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!localityInput.trim() || !courierInput.trim()) return;

      setIsSearching(true);
      try {
          // Geocode using Nominatim (OpenStreetMap)
          const query = `${localityInput}, Cordoba, Argentina`;
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await response.json();

          if (data && data.length > 0) {
              const result = data[0];
              const lat = parseFloat(result.lat);
              const lon = parseFloat(result.lon);

              if (isNaN(lat) || isNaN(lon)) {
                  alert("Coordenadas inválidas recibidas.");
                  setIsSearching(false);
                  return;
              }

              const newZone: LogisticsZone = {
                  id: generateId(),
                  locality: localityInput,
                  courier: courierInput,
                  lat: lat,
                  lng: lon,
                  radius: radiusInput
              };

              saveZones([...zones, newZone]);
              setLocalityInput('');
              setCourierInput('');
              
              // Fly to location
              mapInstanceRef.current?.flyTo([lat, lon], 12);

          } else {
              alert("No se encontró la localidad. Intente el modo manual haciendo clic en el mapa.");
          }
      } catch (error) {
          console.error("Geocoding error:", error);
          alert("Error al buscar ubicación.");
      }
      setIsSearching(false);
  };

  const handleDeleteZone = (id: string) => {
      saveZones(zones.filter(z => z.id !== id));
  };

  // --- VIEW: HOME ---
  if (view === 'HOME') {
      return (
          <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-slate-950 to-slate-950"></div>
              
              <div className="z-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="p-6 bg-slate-900/50 rounded-full border border-fuchsia-500/30 shadow-[0_0_50px_-12px_rgba(217,70,239,0.3)] mx-auto w-32 h-32 flex items-center justify-center">
                      <MapIcon size={64} className="text-fuchsia-400" />
                  </div>
                  
                  <div>
                      <h1 className="text-4xl font-bold text-white mb-2">Marcos Logística</h1>
                      <p className="text-slate-400">Mapa Satelital de Zonas y Repartidores</p>
                  </div>

                  <button 
                      onClick={() => setView('MAP')}
                      className="group relative inline-flex items-center gap-3 px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-fuchsia-500/25 hover:-translate-y-1"
                  >
                      <Navigation size={24} className="group-hover:rotate-45 transition-transform" />
                      Abrir Mapa Interactivo
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
        
        {/* Header */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between z-20 shadow-md">
            <button 
                onClick={() => setView('HOME')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="font-semibold hidden sm:inline">Volver</span>
            </button>
            <h2 className="text-xl font-bold text-fuchsia-400 flex items-center gap-2">
                <MapPin size={24} /> Logística Córdoba
            </h2>
            <div className="text-sm text-slate-500 font-mono">
                {zones.length} Zonas Activas
            </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            
            {/* Left: Map */}
            <div className="flex-1 bg-slate-900 relative min-h-0 min-w-0">
                {/* Manual Mode Indicator */}
                {manualMode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-fuchsia-600 text-white px-6 py-2 rounded-full shadow-xl animate-bounce flex items-center gap-2 pointer-events-none">
                        <Crosshair size={20} />
                        <span className="font-bold">Haga clic en el mapa para ubicar zona</span>
                    </div>
                )}
                
                {/* Leaflet Container - ABSOLUTE POSITION FIX */}
                <div id="map" ref={mapContainerRef} className="absolute inset-0 z-0 outline-none"></div>
            </div>

            {/* Right: Controls */}
            <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-10">
                
                <div className="p-6 border-b border-slate-800 bg-slate-900">
                    <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                        <Plus size={16} className="text-fuchsia-500" /> Nueva Zona
                    </h3>
                    
                    <form onSubmit={handleSearchAndAdd} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Localidad / Ubicación</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="text"
                                    value={localityInput}
                                    onChange={(e) => setLocalityInput(e.target.value)}
                                    placeholder="Ej: Villa Carlos Paz"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:border-fuchsia-500 focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Repartidor</label>
                            <input 
                                type="text"
                                value={courierInput}
                                onChange={(e) => setCourierInput(e.target.value)}
                                placeholder="Nombre del chofer"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-fuchsia-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Radio Cobertura (mts)</label>
                            <input 
                                type="number"
                                value={radiusInput}
                                onChange={(e) => setRadiusInput(Number(e.target.value))}
                                step="100"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-fuchsia-500 focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <button 
                                type="submit"
                                disabled={isSearching || !localityInput || !courierInput}
                                className="bg-fuchsia-700 hover:bg-fuchsia-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {isSearching ? 'Buscando...' : 'Buscar y Agregar'}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => setManualMode(!manualMode)}
                                className={`font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border ${manualMode ? 'bg-fuchsia-900/50 border-fuchsia-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                            >
                                <Crosshair size={16} />
                                {manualMode ? 'Cancelar' : 'Ubicar Manual'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Listado de Zonas</h3>
                    {zones.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 text-sm italic">
                            No hay zonas configuradas.
                        </div>
                    ) : (
                        zones.map((zone) => (
                            <div 
                                key={zone.id} 
                                className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 hover:border-fuchsia-500/30 transition-all group"
                                onMouseEnter={() => {
                                    if (mapInstanceRef.current && typeof zone.lat === 'number' && typeof zone.lng === 'number') {
                                        mapInstanceRef.current.flyTo([zone.lat, zone.lng], 12, { animate: true, duration: 0.5 });
                                    }
                                }}
                            >
                                <div>
                                    <div className="font-bold text-slate-200 text-sm">{zone.locality}</div>
                                    <div className="text-xs text-fuchsia-400 flex items-center gap-1 mt-0.5">
                                        <User size={10} /> {zone.courier}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => {
                                            if(mapInstanceRef.current && typeof zone.lat === 'number' && typeof zone.lng === 'number') {
                                                mapInstanceRef.current.flyTo([zone.lat, zone.lng], 13);
                                            }
                                        }}
                                        className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
                                        disabled={typeof zone.lat !== 'number' || typeof zone.lng !== 'number'}
                                    >
                                        <Navigation size={14} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteZone(zone.id)}
                                        className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-950/30 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>

        </div>
    </div>
  );
};
