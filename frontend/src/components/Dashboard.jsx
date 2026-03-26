import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import CampaignCard from './CampaignCard';
import CreateCampaignModal from './CreateCampaignModal';
import { PlusCircle, RefreshCw, Dice5, ExternalLink, DoorOpen } from 'lucide-react'; // Añadidos iconos
import {api} from '../api';
import JoinCampaignModal from './JoinCampaignModal';



export default function Dashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const token = useAuthStore((state) => state.token);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campanas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(res.data.mis_campanas);
    } catch (err) {
      console.error("Error al cargar campañas", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Función para abrir Foundry en una pestaña nueva
  const abrirFoundry = () => {
    window.open('http://201.188.5.134:30000', '_blank');
  };

  return (
    <div className="w-full max-w-6xl px-4 py-8">
      
      <CreateCampaignModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onRefresh={fetchCampaigns} 
      />
      <JoinCampaignModal 
        isOpen={isJoinModalOpen} 
        onClose={() => setIsJoinModalOpen(false)} 
        onRefresh={fetchCampaigns} 
      />

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-2 border-fantasy-wood pb-4 gap-4">
        <h2 className="text-3xl font-bold text-fantasy-gold tracking-tighter uppercase">
          Tus Aventuras
        </h2>
        <div className="flex gap-2">
          {/* Botón Nuevo: UNIRSE */}
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-fantasy-paper px-4 py-2 rounded font-bold border border-fantasy-wood transition-all"
          >
            <DoorOpen size={20} /> UNIRSE
          </button>
          </div>
        <div className="flex flex-wrap justify-center gap-3">
          {/* BOTÓN DE FOUNDRY VTT */}
          <button 
            onClick={abrirFoundry}
            className="flex items-center gap-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 px-4 py-2 rounded font-bold border border-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/20 group"
          >
            <Dice5 size={20} className="group-hover:rotate-12 transition-transform" />
            ABRIR FOUNDRY VTT
            <ExternalLink size={14} className="opacity-50" />
          </button>

          <button 
            onClick={fetchCampaigns}
            className="p-2 text-fantasy-paper hover:text-fantasy-gold transition-colors"
          >
            <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-fantasy-wood hover:bg-red-900 px-4 py-2 rounded font-bold transition-all"
          >
            <PlusCircle size={20} /> NUEVA PARTIDA
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-fantasy-paper italic">Consultando los registros del gremio...</p>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(c => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-700">
          <p className="text-gray-500 mb-4 font-bold uppercase tracking-widest text-xs">Aún no participas en ninguna campaña.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-fantasy-gold hover:underline font-bold uppercase text-sm"
          >
            ¡Funda tu primera gesta ahora!
          </button>
        </div>
      )}
    </div>
  );
}