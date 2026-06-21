import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import { 
  Sparkles, BrainCircuit, Wand2, 
  Trash2, Save, Check, Layout, Image as ImageIcon, Loader2
} from 'lucide-react';

export default function IALab() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingImg, setLoadingImg] = useState(false); // Estado para la imagen
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // Base64 de la imagen
  const [isSaved, setIsSaved] = useState(false);
  
  const [campanas, setCampanas] = useState([]);
  const [selectedCampana, setSelectedCampana] = useState('');
  
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    const fetchCampanas = async () => {
      try {
        const res = await api.get('/campanas', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCampanas(res.data.mis_campanas);
      } catch (err) { console.error(err); }
    };
    fetchCampanas();
  }, [token]);

  const generarNPC = async (e) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setResult(null);
    setImagePreview(null);
    setIsSaved(false);

    try {
      const res = await api.post('/ia/npc-rapido', { idea }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data.resultado);
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  // --- NUEVA FUNCIÓN: GENERAR IMAGEN ---
  const generarImagen = async () => {
    if (!result) return;
    setLoadingImg(true);
    try {
      // Creamos un prompt descriptivo basado en el NPC generado
      const visualPrompt = `Portrait of ${result.nombre}, a ${result.raza} ${result.clase}. ${result.personalidad}`;
      
      const res = await api.post('/ia/generar-imagen', { prompt: visualPrompt }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setImagePreview(res.data.image_b64);
    } catch (err) {
      alert("La forja de imágenes falló: " + (err.response?.data?.error || "Error de red"));
    } finally { setLoadingImg(false); }
  };

  const guardarTodo = async () => {
  try {
    // 1. Guardar el texto (Esto ya lo hacías)
    await api.post('/assets', {
      tipo: 'NPC',
      contenido: result,
      campana_id: selectedCampana || null
    }, { headers: { Authorization: `Bearer ${token}` } });

    // 2. Guardar la imagen (AQUÍ ESTÁ EL CAMBIO)
    if (imagePreview) {
      const campanaObj = campanas.find(c => c.id === selectedCampana);
      const campanaNombre = campanaObj ? campanaObj.nombre : "General";

      await api.post('/assets/guardar-imagen', {
        image_b64: imagePreview,
        nombre_npc: result.nombre,
        campana_nombre: campanaNombre,
        prompt_usado: result.personalidad,
        // --- ENVIAMOS EL ID PARA QUE APAREZCA EN LA AVENTURA ---
        campana_id: selectedCampana || null 
      }, { headers: { Authorization: `Bearer ${token}` } });
    }
    
    setIsSaved(true);
    alert("¡Sincronización completa! El NPC y su retrato ya están en tu campaña.");
  } catch (err) {
    alert("Error en la sincronización: " + (err.response?.data?.error || err.message));
  }
};

  return (
    <div className="w-full max-w-4xl px-4 py-8 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-fantasy-gold uppercase tracking-tighter mb-2 flex justify-center items-center gap-3">
          <BrainCircuit className="w-10 h-10" /> Laboratorio de IA
        </h2>
        <p className="text-gray-400 italic">"Crea la historia y forja el rostro de tus leyendas."</p>
      </div>

      <form onSubmit={generarNPC} className="mb-12">
        <div className="flex flex-col md:flex-row gap-4 bg-gray-900 p-6 border-2 border-fantasy-wood rounded-xl shadow-2xl">
          <input 
            type="text"
            placeholder="Ej: Un viejo pirata con un mapa tatuado en la espalda..."
            className="flex-1 bg-black border border-fantasy-wood p-4 rounded text-fantasy-paper italic outline-none focus:border-fantasy-gold"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !idea.trim()}
            className="bg-fantasy-wood hover:bg-red-900 text-white font-bold px-8 py-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {loading ? 'FORJANDO...' : 'GENERAR NPC'}
          </button>
        </div>
      </form>

      {result && (
        <div className="bg-[#f4ece1] text-gray-900 rounded-sm shadow-2xl border-l-[12px] border-fantasy-wood overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
          <div className="flex flex-col md:flex-row">
            
            {/* PARTE IZQUIERDA: IMAGEN */}
            <div className="w-full md:w-72 h-72 bg-black flex items-center justify-center relative border-b md:border-b-0 md:border-r border-fantasy-wood/20">
              {imagePreview ? (
                <img src={`data:image/png;base64,${imagePreview}`} className="w-full h-full object-cover" alt="Retrato IA" />
              ) : (
                <div className="text-center p-6">
                  {loadingImg ? (
                    <Loader2 className="w-12 h-12 text-fantasy-gold animate-spin mx-auto" />
                  ) : (
                    <>
                      <ImageIcon className="w-12 h-12 text-gray-800 mx-auto opacity-20 mb-2" />
                      <button 
                        onClick={generarImagen}
                        className="text-[10px] font-black bg-fantasy-gold text-black px-3 py-1 rounded-full hover:bg-yellow-500 transition-colors uppercase"
                      >
                        Invocar Retrato
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* PARTE DERECHA: TEXTO */}
            <div className="flex-1 p-8 relative">
              <div className="flex justify-between items-start border-b-2 border-fantasy-wood/30 pb-4 mb-4">
                <div>
                  <h3 className="text-3xl font-black font-serif uppercase text-fantasy-wood">{result.nombre}</h3>
                  <p className="text-sm font-bold text-red-900 uppercase tracking-widest">{result.raza} • {result.clase}</p>
                </div>
                <button onClick={() => {setResult(null); setImagePreview(null);}} className="text-red-800 hover:scale-110 transition-transform">
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="italic text-base leading-relaxed">"{result.personalidad}"</p>
                <div className="bg-black/5 p-3 rounded border border-fantasy-wood/10 text-sm">
                  <span className="font-black uppercase text-[10px] block text-fantasy-wood mb-1">Misión / Gancho</span>
                  {result.gancho}
                </div>
              </div>

              {/* ASIGNACIÓN Y GUARDADO */}
              <div className="border-t border-fantasy-wood/20 pt-6">
                <label className="block text-[10px] font-black text-fantasy-wood uppercase mb-2">Asignar a Campaña:</label>
                <div className="flex gap-3">
                  <select 
                    className="flex-1 bg-white/80 border-2 border-fantasy-wood/30 px-3 py-2 rounded font-bold text-xs outline-none"
                    value={selectedCampana}
                    onChange={(e) => setSelectedCampana(e.target.value)}
                    disabled={isSaved}
                  >
                    <option value="">Galería Personal</option>
                    {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>

                  <button 
                    onClick={guardarTodo}
                    disabled={isSaved}
                    className={`flex items-center gap-2 px-6 py-2 rounded font-black text-xs uppercase tracking-widest transition-all ${
                      isSaved ? 'bg-green-700 text-white' : 'bg-fantasy-wood text-white hover:bg-red-900 shadow-lg'
                    }`}
                  >
                    {isSaved ? <Check size={16} /> : <Save size={16} />}
                    {isSaved ? 'GUARDADO' : 'GUARDAR'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
} 