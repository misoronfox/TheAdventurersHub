import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { X, ShieldCheck, Sword } from 'lucide-react';
import {api} from '../api';

export default function CreateCampaignModal({ isOpen, onClose, onRefresh }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/campanas', 
        { nombre, descripcion },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh(); // Recargamos la lista de campañas
      onClose(); // Cerramos el modal
      setNombre('');
      setDescripcion('');
    } catch (err) {
      alert("Error al fundar la campaña: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-fantasy-wood w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-fantasy-wood p-4 flex justify-between items-center">
          <h3 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
            <Sword size={20} /> Fundar Nueva Campaña
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-fantasy-gold uppercase mb-1">Nombre de la Gesta</label>
            <input 
              required
              type="text" 
              className="w-full bg-black border border-fantasy-wood p-3 rounded text-fantasy-paper focus:border-fantasy-gold outline-none"
              placeholder="Ej: Crónicas de Barovia"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-fantasy-gold uppercase mb-1">Breve Crónica (Descripción)</label>
            <textarea 
              className="w-full bg-black border border-fantasy-wood p-3 rounded text-fantasy-paper focus:border-fantasy-gold outline-none h-24 resize-none"
              placeholder="Una breve descripción de la aventura..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-fantasy-gold hover:bg-yellow-500 text-black font-black py-4 rounded uppercase tracking-tighter flex items-center justify-center gap-2 transition-all"
          >
            {loading ? "ESCRIBIENDO EN EL REGISTRO..." : (
              <>
                <ShieldCheck size={20} /> CREAR MUNDO
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}