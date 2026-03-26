import { useState } from 'react';
import { Sword, LogOut, Settings, LayoutDashboard, Scroll, UserPlus } from 'lucide-react'; // Añadido UserPlus
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm'; // Añadido RegisterForm
import Dashboard from './components/Dashboard';
import Gallery from './components/Gallery';
import IALab from './components/IALab';
import { useAuthStore } from './store/authStore';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false); // Añadido estado para registro
  const [activeTab, setActiveTab] = useState('dashboard');
  const { token, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    setActiveTab('dashboard');
    setShowLogin(false);
    setShowRegister(false); // Resetear registro al salir
  };

  return (
    <div className="min-h-screen bg-fantasy-dark flex flex-col items-center">
      
      {token && (
        <nav className="w-full bg-black/50 border-b border-fantasy-wood p-4 flex justify-between items-center px-8 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <Sword className="text-fantasy-gold w-6 h-6" />
            <span className="font-bold text-fantasy-gold tracking-widest uppercase text-sm">Adventurer's Hub</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 text-sm font-bold uppercase transition-colors ${activeTab === 'dashboard' ? 'text-fantasy-gold' : 'text-fantasy-paper hover:text-fantasy-gold'}`}
            >
                <LayoutDashboard size={18} /> Mis Partidas
            </button>
            <button 
                onClick={() => setActiveTab('gallery')}
                className={`flex items-center gap-2 text-sm font-bold uppercase ${activeTab === 'gallery' ? 'text-fantasy-gold' : 'text-fantasy-paper'}`}
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

      <main className="flex-1 w-full flex flex-col items-center p-4">
        {!token ? (
          // Lógica para mostrar Registro, Login o Landing
          showRegister ? (
            <div className="mt-20 w-full flex justify-center">
                <RegisterForm onBackToLogin={() => { setShowRegister(false); setShowLogin(true); }} />
            </div>
          ) : showLogin ? (
            <div className="mt-20 w-full flex justify-center">
                <LoginForm />
                <button 
                    onClick={() => { setShowLogin(false); setShowRegister(true); }}
                    className="fixed bottom-10 text-fantasy-paper/50 hover:text-fantasy-gold text-xs uppercase font-bold"
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
                    className="px-10 py-4 bg-fantasy-wood hover:bg-red-900 text-white rounded font-bold transition-all shadow-lg hover:shadow-red-900/20"
                >
                    ¡COMENZAR AVENTURA!
                </button>
                
                {/* Nuevo botón de crear usuario */}
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
          activeTab === 'dashboard' ? <Dashboard /> : 
          activeTab === 'ialab' ? <IALab /> : 
          <Gallery />
        )}
      </main>

      <footer className="w-full text-center p-4 text-gray-600 text-xs uppercase tracking-widest border-t border-gray-900">
        Sistema de Gestión de Rol v0.1 | 2026
      </footer>
    </div>
  );
}

export default App;