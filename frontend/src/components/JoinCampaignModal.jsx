import { useState } from 'react';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import { X, DoorOpen, Sparkles } from 'lucide-react';

export default function JoinCampaignModal({ isOpen, onClose, onRefresh }) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/campanas/unirse', 
        { codigo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
      onClose();
      setCodigo('');
      alert("¡Has entrado en la taberna! Bienvenido a la aventura.");
    } catch (err) {
      alert(err.response?.data?.error || "El código no es válido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-fantasy-wood w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-blue-900 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold uppercase tracking-widest flex items-center gap-2">
            <DoorOpen size={20} /> Unirse a Gesta
          </h3>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm italic mb-4">Introduce el código secreto entregado por tu Dungeon Master.</p>
            <input 
              required
              type="text" 
              maxLength={6}
              className="w-full bg-black border-2 border-fantasy-wood p-4 rounded text-center text-3xl font-mono text-fantasy-gold tracking-[0.5em] focus:border-fantasy-gold outline-none uppercase"
              placeholder="ABC123"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading || codigo.length < 4}
            className="w-full bg-fantasy-wood hover:bg-blue-800 text-white font-black py-4 rounded uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? "BUSCANDO GRUPO..." : "ENTRAR A LA PARTIDA"}
          </button>
        </form>
      </div>
    </div>
  );
}