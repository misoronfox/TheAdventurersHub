import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Lock, User } from 'lucide-react';
import {api} from '../api';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setToken = useAuthStore((state) => state.setToken);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/login', {
        username,
        password
      });
      setToken(res.data.token); // Guardamos el token en nuestro cofre
      alert("¡Bienvenido a la taberna, " + username + "!");
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con el servidor', err);
    }
  };

  return (
    <div className="bg-gray-900 p-8 border-2 border-fantasy-wood rounded-lg shadow-2xl w-full max-w-md">
      <h2 className="text-2xl font-bold text-fantasy-gold mb-6 text-center uppercase tracking-widest">
        Identifícate, Viajero
      </h2>
      
      {error && <p className="bg-red-900/50 border border-red-500 text-red-200 p-2 mb-4 rounded text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3 text-fantasy-wood w-5 h-5" />
          <input 
            type="text" 
            placeholder="Nombre de usuario"
            className="w-full bg-black border border-fantasy-wood p-2 pl-10 rounded text-fantasy-paper focus:outline-none focus:border-fantasy-gold"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 text-fantasy-wood w-5 h-5" />
          <input 
            type="password" 
            placeholder="Contraseña"
            className="w-full bg-black border border-fantasy-wood p-2 pl-10 rounded text-fantasy-paper focus:outline-none focus:border-fantasy-gold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="w-full bg-fantasy-wood hover:bg-red-900 text-white font-bold py-3 rounded transition-all transform hover:scale-105">
          ENTRAR A LA TABERNA
        </button>
      </form>
    </div>
  );
}