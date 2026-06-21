import { useState } from 'react';
import { Sword, LogOut, Settings, LayoutDashboard, Scroll, UserPlus } from 'lucide-react';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import Gallery from './components/Gallery';
import IALab from './components/IALab';
import CampaignDetails from './components/CampaignDetails'; // Asegúrate de tener este archivo
import { useAuthStore } from './store/authStore';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const { token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
    setSelectedCampaignId(null);
    setShowLogin(false);
    setShowRegister(false);
  };

  // Función para volver a la lista de campañas
  const handleBackToDashboard = () => {
    setSelectedCampaignId(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-fantasy-dark flex flex-col items-center">
      
      {/* NAVEGACIÓN (Solo si está logueado) */}
      {token && (
        <nav className="w-full bg-black/50 border-b border-fantasy-wood p-4 flex justify-between items-center px-8 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToDashboard}>
            <Sword className="text-fantasy-gold w-6 h-6" />
            <span className="font-bold text-fantasy-gold tracking-widest uppercase text-sm">Adventurer's Hub</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
                onClick={handleBackToDashboard}
                className={`flex items-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'dashboard' ? 'text-fantasy-gold' : 'text-fantasy-paper hover:text-fantasy-gold'}`}
            >
                <LayoutDashboard size={18} /> Mis Partidas
            </button>
            <button 
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'gallery' ? 'text-fantasy-gold' : 'text-fantasy-paper hover:text-fantasy-gold'}`}
            >
                <Scroll size={18} /> Galería
            </button>
            <button 
                onClick={() => setActiveTab('ialab')}
                className={`flex items-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'ialab' ? 'text-fantasy-gold' : 'text-fantasy-paper hover:text-fantasy-gold'}`}
            >
                <Settings size={18} /> IA Lab
            </button>
            <button 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-400 flex items-center gap-2 text-sm font-bold uppercase transition-colors"
            >
                <LogOut size={18} /> Salir
            </button>
          </div>
        </nav>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 w-full flex flex-col items-center p-4">
        {!token ? (
          // --- VISTAS NO LOGUEADO ---
          showRegister ? (
            <div className="mt-20 w-full flex justify-center">
                <RegisterForm onBackToLogin={() => { setShowRegister(false); setShowLogin(true); }} />
            </div>
          ) : showLogin ? (
            <div className="mt-20 w-full flex justify-center relative">
                <LoginForm />
                <button 
                    onClick={() => { setShowLogin(false); setShowRegister(true); }}
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-fantasy-paper/50 hover:text-fantasy-gold text-xs uppercase font-bold transition-colors"
                >
                    ¿No tienes cuenta? Regístrate
                </button>
            </div>
          ) : (
            <div className="mt-20 p-10 border-4 border-fantasy-wood rounded-xl bg-gray-900 shadow-2xl text-center max-w-lg">
              <Sword className="w-16 h-16 mx-auto text-fantasy-gold mb-4" />
              <h1 className="text-4xl font-bold text-fantasy-gold mb-2 uppercase tracking-tighter">The Adventurer's Hub</h1>
              <p className="text-gray-400 mb-8 italic">"Donde las leyendas se escriben y la IA forja el destino."</p>
              
              <div className="flex flex-col gap-4">
                <button 
                    onClick={() => setShowLogin(true)}
                    className="px-10 py-4 bg-fantasy-wood hover:bg-red-900 text-white rounded font-bold transition-all shadow-lg"
                >
                    ¡COMENZAR AVENTURA!
                </button>
                <button 
                    onClick={() => setShowRegister(true)}
                    className="text-fantasy-paper/60 hover:text-fantasy-gold flex items-center justify-center gap-2 text-sm font-bold uppercase py-2 transition-colors"
                >
                    <UserPlus size={16} /> Crear nuevo usuario
                </button>
              </div>
            </div>
          )
        ) : (
          // --- VISTAS LOGUEADO ---
          activeTab === 'dashboard' ? (
            selectedCampaignId ? (
              <CampaignDetails 
                campanaId={selectedCampaignId} 
                onBack={handleBackToDashboard} 
              />
            ) : (
              <Dashboard onSelectCampaign={(id) => setSelectedCampaignId(id)} />
            )
          ) : activeTab === 'ialab' ? (
            <IALab />
          ) : (
            <Gallery />
          )
        )}
      </main>

      <footer className="w-full text-center p-4 text-gray-600 text-xs uppercase tracking-widest border-t border-gray-900">
        Sistema de Gestión de Rol v0.1 | 2026
      </footer>
    </div>
  );
}

// ESTA LÍNEA ES LA QUE TE FALTABA O SE ROMPIÓ:
export default App;