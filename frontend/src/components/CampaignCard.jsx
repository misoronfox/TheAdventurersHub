import { Users, Crown, Hash } from 'lucide-react';

export default function CampaignCard({ campaign, onClick}) {
  return (
    <div onClick={onClick} 
    className="bg-gray-800 border-2 border-fantasy-wood p-5 rounded-lg shadow-lg hover:border-fantasy-gold transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-fantasy-gold group-hover:text-yellow-400">
          {campaign.nombre}
        </h3>
        {campaign.mi_rol === 'DM' ? (
          <span className="flex items-center gap-1 text-xs bg-red-900 text-red-200 px-2 py-1 rounded-full border border-red-500">
            <Crown size={12} /> DM
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded-full border border-blue-500">
            <Users size={12} /> JUGADOR
          </span>
        )}
      </div>
      
      <p className="text-fantasy-paper/70 text-sm line-clamp-2 mb-4 italic">
        "{campaign.descripcion || 'Sin descripción...'}"
      </p>

      {campaign.codigo_invitacion !== "Oculto" && (
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
          <Hash size={14} /> 
          <span>Código: <span className="text-fantasy-paper font-mono">{campaign.codigo_invitacion}</span></span>
        </div>
      )}
    </div>
  );
}