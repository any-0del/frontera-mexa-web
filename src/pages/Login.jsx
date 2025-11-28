import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Alternar entre Login y Registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Solo para registro

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // --- REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, avatar_url: '' } // Guardamos el nombre
          }
        });
        if (error) throw error;
        alert('¡Usuario creado! Ya puedes iniciar sesión.');
        setIsSignUp(false); // Lo mandamos a loguearse
      } else {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/'); // Si todo bien, nos vamos al Home
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-lg p-8">
        
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 mb-8 text-sm transition">
          <ArrowLeft size={16} /> Volver al inicio
        </button>

        <h2 className="text-3xl font-serif font-bold mb-2 text-slate-900">
          {isSignUp ? 'Únete a la comunidad' : 'Bienvenido de nuevo'}
        </h2>
        <p className="text-slate-500 mb-8">
          {isSignUp ? 'Crea una cuenta para compartir tu historia.' : 'Ingresa para gestionar tu contenido.'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Campo Nombre (Solo visible en Registro) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Nombre Completo</label>
              <input 
                type="text" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded focus:border-orange-500 outline-none"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded focus:border-orange-500 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded focus:border-orange-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3 rounded hover:bg-orange-700 transition disabled:opacity-50 mt-4"
          >
            {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Ingresar')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isSignUp ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="ml-2 text-orange-700 font-bold hover:underline"
          >
            {isSignUp ? 'Inicia Sesión' : 'Regístrate aquí'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;