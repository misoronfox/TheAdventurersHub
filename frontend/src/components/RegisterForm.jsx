import { useState } from 'react';
import axios from 'axios';
import { User, Lock, ShieldAlert, UserPlus } from 'lucide-react';
import {api} from '../api';

export default function RegisterForm({ onBackToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden, joven aventurero.");
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/registro', {
        username,
        password
      });
      alert("¡Cuenta creada con éxito! Ahora puedes identificarte.");
      onBackToLogin(); // Volvemos al login automáticamente
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar al nuevo héroe' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-8 border-2 border-fantasy-wood rounded-lg shadow-2xl w-full max-w-md animate-in slide-in-from-right-10 duration-300">
      <h2 className="text-2xl font-bold text-fantasy-gold mb-6 text-center uppercase tracking-widest">
        Nuevo Aventurero
      </h2>
      
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 mb-4 rounded text-xs flex items-center gap-2">
          <ShieldAlert size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-3 text-fantasy-wood w-5 h-5" />
          <input 
            required
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
            required
            type="password" 
            placeholder="Contraseña"
            className="w-full bg-black border border-fantasy-wood p-2 pl-10 rounded text-fantasy-paper focus:outline-none focus:border-fantasy-gold"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-3 text-fantasy-wood w-5 h-5" />
          <input 
            required
            type="password" 
            placeholder="Confirmar contraseña"
            className="w-full bg-black border border-fantasy-wood p-2 pl-10 rounded text-fantasy-paper focus:outline-none focus:border-fantasy-gold"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-fantasy-wood hover:bg-red-900 text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2"
        >
          {loading ? "ESCRIBIENDO EN EL REGISTRO..." : (
            <><UserPlus size={18} /> UNIRSE AL GREMIO</>
          )}
        </button>

        <button 
          type="button"
          onClick={onBackToLogin}
          className="w-full text-xs text-fantasy-paper/50 hover:text-fantasy-gold uppercase font-bold tracking-widest"
        >
          ¿Ya tienes cuenta? Identifícate
        </button>
      </form>
    </div>
  );
}