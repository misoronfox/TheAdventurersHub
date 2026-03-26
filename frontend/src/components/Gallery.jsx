import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  Scroll, Trash2, RefreshCw, Image as ImageIcon, 
  Filter, UserCircle, Map as MapIcon, Search 
} from 'lucide-react';
import { api } from '../api';

export default function Gallery() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos'); // 'todos', 'NPC', 'Retrato'
  const token = useAuthStore((state) => state.token);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssets(res.data.assets);
    } catch (err) {
      console.error("Error al cargar la galería:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar este registro permanentemente de tus crónicas?")) return;
    try {
      // Asumiendo que crearás este endpoint en el futuro
      // await api.delete(`/assets/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAssets(assets.filter(a => a.id !== id));
      alert("Registro borrado.");
    } catch (err) { alert("No se pudo borrar el registro."); }
  };

  // Filtrado lógico
  const filteredAssets = assets.filter(a => filter === 'todos' || a.tipo === filter);

  return (
    <div className="w-full max-w-6xl px-4 py-8 animate-in fade-in slide-in-from-top-4 duration-700">
      
      {/* CABECERA Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b-2 border-fantasy-wood pb-6">
        <div>
          <h2 className="text-4xl font-black text-fantasy-gold uppercase tracking-tighter flex items-center gap-3">
            <Scroll className="w-10 h-10" /> Tus Crónicas
          </h2>
          <p className="text-gray-500 italic mt-1">Registros recuperados de tus viajes y visiones.</p>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-fantasy-wood/30">
          <button 
            onClick={() => setFilter('todos')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'todos' ? 'bg-fantasy-wood text-white shadow-lg' : 'text-gray-500 hover:text-fantasy-paper'}`}
          >
            TODOS
          </button>
          <button 
            onClick={() => setFilter('NPC')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'NPC' ? 'bg-fantasy-wood text-white shadow-lg' : 'text-gray-500 hover:text-fantasy-paper'}`}
          >
            NPCs
          </button>
          <button 
            onClick={() => setFilter('Retrato')}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${filter === 'Retrato' ? 'bg-fantasy-wood text-white shadow-lg' : 'text-gray-500 hover:text-fantasy-paper'}`}
          >
            RETRATOS
          </button>
          <div className="w-[1px] h-6 bg-gray-800 mx-2" />
          <button onClick={fetchAssets} className="p-2 text-fantasy-gold hover:rotate-180 transition-transform duration-500">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-32">
          <RefreshCw className="animate-spin mx-auto text-fantasy-gold w-16 h-16 mb-4 opacity-50" />
          <p className="text-fantasy-paper font-serif text-xl italic tracking-widest">Consultando la biblioteca del gremio...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-32 bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-800">
          <Search className="mx-auto w-16 h-16 text-gray-800 mb-4" />
          <p className="text-gray-600 uppercase tracking-[0.2em] font-black">No se han hallado registros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredAssets.map((asset) => {
            const isNPC = asset.tipo === 'NPC';
            const data = asset.detalles;

            return (
              <div 
                key={asset.id} 
                className="group relative flex flex-col h-[450px] bg-gray-900 border-2 border-fantasy-wood rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-fantasy-wood/20 hover:border-fantasy-gold transition-all duration-500"
              >
                {/* ZONA DE IMAGEN / PREVISUALIZACIÓN */}
                <div className="h-56 w-full bg-black relative overflow-hidden flex items-center justify-center border-b border-fantasy-wood/50">
                  {asset.url ? (
                    <img 
                      src={asset.url} 
                      alt={asset.nombre} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center opacity-10 group-hover:opacity-30 transition-opacity">
                      {isNPC ? <UserCircle size={100} /> : <ImageIcon size={100} />}
                    </div>
                  )}
                  
                  {/* Etiqueta Flotante */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-fantasy-wood/90 backdrop-blur-sm text-[10px] text-white px-3 py-1 rounded-full border border-white/20 font-black tracking-widest uppercase">
                      {asset.tipo}
                    </span>
                  </div>
                </div>

                {/* CUERPO DE LA TARJETA (EFECTO PAPEL) */}
                <div className="flex-1 p-6 bg-[#f4ece1] text-gray-900 relative">
                  {/* Textura de papel sutil */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" />
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif font-black text-2xl leading-none text-fantasy-wood mb-1">
                        {isNPC && data ? data.nombre : (asset.nombre || "Desconocido")}
                      </h3>
                      
                      {isNPC && data ? (
                        <>
                          <p className="text-[10px] font-black text-red-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                             {data.raza} <span className="text-gray-400">•</span> {data.clase}
                          </p>
                          <div className="h-[1px] w-12 bg-fantasy-wood/30 mb-3" />
                          <p className="text-sm italic text-gray-700 leading-relaxed line-clamp-4 font-medium">
                            "{data.personalidad}"
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter mt-2">
                           Archivo de Imagen del Servidor
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-black/10">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">ID: #{asset.id}</span>
                      <button 
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 text-red-900/40 hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}