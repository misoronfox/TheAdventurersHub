import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import { Users, Crown, ChevronLeft, Map, UserCircle, Hash } from 'lucide-react';

export default function CampaignDetails({ campanaId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/campanas/${campanaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data.campana);
      } catch (err) {
        alert("Error al cargar la gesta.");
        onBack();
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [campanaId]);

  if (loading) return <div className="p-20 text-center animate-pulse text-fantasy-gold">Consultando los oráculos...</div>;

  return (
    <div className="w-full max-w-6xl px-4 py-8 animate-in fade-in duration-500">
      {/* Botón Volver */}
      <button onClick={onBack} className="flex items-center gap-2 text-fantasy-paper/50 hover:text-fantasy-gold mb-6 transition-colors">
        <ChevronLeft size={20} /> Volver al Tablero
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Info y Jugadores */}
        <div className="space-y-6">
          <div className="bg-gray-900 border-2 border-fantasy-wood p-6 rounded-xl shadow-2xl">
            <h2 className="text-3xl font-black text-fantasy-gold uppercase tracking-tighter mb-2">{data.nombre}</h2>
            <p className="text-gray-400 italic mb-4">"{data.descripcion || 'Sin descripción escrita...'}"</p>
            
            {data.soy_el_dm && (
              <div className="mt-4 p-3 bg-black/40 border border-fantasy-gold/30 rounded flex justify-between items-center">
                <span className="text-xs font-bold text-fantasy-gold uppercase">Código de Invitación:</span>
                <span className="font-mono text-xl text-white tracking-widest">{data.codigo_invitacion}</span>
              </div>
            )}
          </div>

          <div className="bg-gray-900 border-2 border-fantasy-wood p-6 rounded-xl shadow-2xl">
            <h3 className="text-xl font-bold text-fantasy-gold uppercase flex items-center gap-2 mb-4">
              <Users size={20} /> La Compañía
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-red-900/20 border border-red-900/50 rounded">
                <Crown size={18} className="text-fantasy-gold" />
                <span className="text-fantasy-paper font-bold">{data.dm_username} (DM)</span>
              </div>
              {data.jugadores.map(j => (
                <div key={j.id} className="flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded">
                  <UserCircle size={18} className="text-gray-500" />
                  <span className="text-fantasy-paper">{j.username}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Assets de la Campaña */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border-2 border-fantasy-wood p-6 rounded-xl shadow-2xl min-h-[400px]">
            <h3 className="text-xl font-bold text-fantasy-gold uppercase flex items-center gap-2 mb-6">
              <Map size={20} /> Recursos de la Partida
            </h3>
            
            {data.assets.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl">
                <p className="text-gray-600 italic">No hay mapas ni retratos asignados a esta campaña todavía.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {data.assets.map(a => (
                  <div key={a.id} className="group relative aspect-square bg-black rounded-lg overflow-hidden border border-fantasy-wood/50 hover:border-fantasy-gold transition-all">
                    {a.url ? (
                      <img src={a.url} alt={a.nombre} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-20"><UserCircle size={40} /></div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-[10px] text-white font-bold uppercase truncate">
                      {a.nombre}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}