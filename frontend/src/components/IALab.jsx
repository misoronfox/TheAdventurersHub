import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Sparkles, BrainCircuit, Wand2, UserPlus, Trash2, Save, RefreshCw, ImageIcon } from 'lucide-react';

import {api} from '../api';

export default function IALab() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const token = useAuthStore((state) => state.token);
  const [isSaved, setIsSaved] = useState(false);

  const [imgPreview, setImgPreview] = useState(null); // Para mostrar la imagen b64
  const [guardando, setGuardando] = useState(false);

  const [generandoImagen, setGenerandoImagen] = useState(false);


const handleGenerarImagen = async () => {
    setLoading(true);
    setImgPreview(null);
    try {
      const promptParaImagen = `Retrato de fantasía de ${result.nombre}, ${result.raza} ${result.clase}. Estilo cinematográfico, detallado.`;
      const res = await api.post('/ia/generar-imagen', 
        { prompt: promptParaImagen },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImgPreview(res.data.image_b64);
    } catch (err) {
      alert("Error en la IA de imagen: " + err.message);
    } finally {
      setLoading(false);
    }
};

const handleGuardarImagen = async () => {
    setGuardando(true);
    try {
        await api.post('/assets/guardar-imagen', {
            image_b64: imgPreview,
            nombre_npc: result.nombre,
            campana_nombre: "General" // Luego lo haremos dinámico según la campaña abierta
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        alert("¡Retrato guardado con éxito en tu servidor!");
        setImgPreview(null); // Limpiamos la vista después de guardar
    } catch (err) {
        alert("Error al guardar en el disco: " + err.message);
    } finally {
        setGuardando(false);
    }
};

  const guardarEnGaleria = async () => {
      try {
          await api.post('/assets', {
              tipo: 'NPC',
              contenido: JSON.stringify(result) // Guardamos el objeto como texto
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setIsSaved(true);
          alert("¡NPC guardado en los registros del gremio!");
      } catch (err) {
          alert("Error al guardar: " + (err.response?.data?.error || err.message));
      }
  };

  const generarNPC = async (e) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.post('/ia/npc-rapido', 
        { idea },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Parseamos el string JSON que devuelve el backend
      const npcData = JSON.parse(res.data.resultado);
      setResult(npcData);
    } catch (err) {
      alert("La IA falló su tirada de salvación: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl px-4 py-8 animate-in fade-in duration-500">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-bold text-fantasy-gold uppercase tracking-tighter mb-2 flex justify-center items-center gap-3">
          <BrainCircuit className="w-10 h-10" /> Laboratorio de IA
        </h2>
        <p className="text-gray-400 italic">"Susurra una idea y deja que el Hub forje el destino."</p>
      </div>

      {/* Formulario de Entrada */}
      <form onSubmit={generarNPC} className="mb-12 relative">
        <div className="flex flex-col md:flex-row gap-4 bg-gray-900 p-6 border-2 border-fantasy-wood rounded-xl shadow-2xl">
          <input 
            type="text"
            placeholder="Ej: Un tabernero con un secreto oscuro o un bardo sin voz..."
            className="flex-1 bg-black border border-fantasy-wood p-4 rounded text-fantasy-paper focus:outline-none focus:border-fantasy-gold italic"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !idea.trim()}
            className="bg-fantasy-wood hover:bg-red-900 text-white font-bold px-8 py-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Sparkles className="animate-spin" />
            ) : (
              <Wand2 className="group-hover:rotate-12 transition-transform" />
            )}
            {loading ? 'FORJANDO...' : 'GENERAR'}
          </button>
        </div>
      </form>

      {/* Resultado: La Tarjeta de NPC */}
      {result && (
        <div className="bg-orange-50 text-gray-900 p-8 rounded-sm shadow-2xl border-l-[12px] border-fantasy-wood relative overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
          {/* Decoración de pergamino */}
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Sparkles size={100} />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start border-b-2 border-fantasy-wood/30 pb-4 mb-6">
              <div>
                <h3 className="text-3xl font-black font-serif uppercase text-fantasy-wood">{result.nombre}</h3>
                <p className="text-lg font-bold text-red-900 uppercase tracking-widest">{result.raza} • {result.clase}</p>
              </div>
              <div className="flex gap-2">
                  <button 
                    onClick={guardarEnGaleria}
                    disabled={isSaved}
                    className={`p-2 rounded-full transition-colors ${isSaved ? 'text-green-600' : 'hover:bg-fantasy-wood/10 text-fantasy-wood'}`}
                    title="Guardar en galería"
                  >
                    <Save size={24} /> {/* Asegúrate de importar Save de lucide-react */}
                  </button>
                <button className="p-2 hover:bg-fantasy-wood/10 rounded-full text-fantasy-wood" title="Añadir a campaña">
                  <UserPlus size={24} />
                </button>
                <button onClick={() => setResult(null)} className="p-2 hover:bg-red-200 rounded-full text-red-800">
                  <Trash2 size={24} />
                </button>
              </div>
            </div>

            <div className="space-y-6 italic leading-relaxed text-lg">
              <div>
                <h4 className="not-italic font-black uppercase text-xs text-gray-500 mb-1">Personalidad</h4>
                <p>"{result.personalidad}"</p>
              </div>
              <div>
                <h4 className="not-italic font-black uppercase text-xs text-gray-500 mb-1">Gancho de Aventura</h4>
                <p className="border-l-4 border-fantasy-gold pl-4 font-medium">{result.gancho}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 pt-6 border-t-2 border-fantasy-wood/20 flex flex-col items-center">
    
    {/* Botón Principal para generar la imagen */}
    {!imgPreview && (
        <button 
            onClick={handleGenerarImagen}
            disabled={generandoImagen}
            className="flex items-center gap-3 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 disabled:opacity-50"
        >
            {generandoImagen ? (
                <RefreshCw size={20} className="animate-spin" />
            ) : (
                <ImageIcon size={20} />
            )}
            {generandoImagen ? "Invocando al Artista..." : "Forjar Retrato Visual"}
        </button>
    )}

    {/* Vista previa de la imagen generada y botones de decisión */}
    {imgPreview && (
            <div className="w-full animate-in zoom-in duration-500 flex flex-col items-center">
                <p className="text-xs font-black text-fantasy-wood mb-4 uppercase tracking-widest">Resultado de la Visión:</p>
                <img 
                  src={`data:image/png;base64,${imgPreview}`} 
                  alt="Retrato IA" 
                  className="w-72 h-72 object-cover rounded-lg border-4 border-fantasy-gold shadow-[0_0_20px_rgba(255,215,0,0.3)] mb-6 transition-all hover:scale-105"
                />
                                
                <div className="flex gap-4">
                    <button 
                        onClick={handleGuardarImagen}
                        disabled={guardando}
                        className="flex items-center gap-2 bg-green-800 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold transition-colors"
                    >
                        <Save size={18} />
                        {guardando ? "Guardando..." : "ME GUSTA, GUARDAR"}
                    </button>
                    
                    <button 
                        onClick={() => setImgPreview(null)}
                        className="flex items-center gap-2 bg-gray-400 hover:bg-gray-500 text-gray-900 px-6 py-2 rounded-md font-bold transition-colors"
                    >
                        <Trash2 size={18} />
                        DESCARTAR
                    </button>
                </div>
            </div>
        )}
    </div>

      {!result && !loading && (
        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-xl">
          <Sparkles className="mx-auto w-12 h-12 text-gray-700 mb-4" />
          <p className="text-gray-600 uppercase text-sm tracking-widest font-bold">Esperando tu inspiración...</p>
        </div>
      )}
    </div>
  );
}