import React, { useEffect, useState } from 'react';
import { ArrowRight, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ navigateToEditor, navigateToBlog }) => {
  const [featured, setFeatured] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
    fetchBlogs();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            setUserName(session.user.user_metadata.full_name || session.user.email);
            checkAdmin(session.user.id);
        } else {
            setUserName(null);
            setIsAdmin(false);
        }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        setUserName(user.user_metadata.full_name || user.email);
        checkAdmin(user.id);
    }
  };

  const checkAdmin = async (userId) => {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single();
    if (data) setIsAdmin(data.is_admin);
  };

  const fetchBlogs = async () => {
    setLoading(true);
    const { data: approvedBlogs, error } = await supabase
      .from('blogs')
      .select('*, profiles(full_name)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && approvedBlogs) {
        const feat = approvedBlogs.find(b => b.is_featured);
        const rec = approvedBlogs.filter(b => !b.is_featured);
        setFeatured(feat);
        setRecent(rec);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Imagen por defecto si es un blog viejo sin portada
  const fallbackImage = "https://images.unsplash.com/photo-1517487881594-2787fdb86ef5?auto=format&fit=crop&w=800";

  if (loading) return <div className="min-h-screen flex justify-center items-center font-serif">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-orange-200">
      
      <nav className="flex justify-between items-center py-8 px-6 max-w-6xl mx-auto border-b border-slate-200">
        <h1 className="text-2xl font-serif font-bold tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          Frontera <span className="text-orange-700">Mexa</span>.
        </h1>
        <div className="flex items-center gap-4">
            {userName ? (
                <div className="flex items-center gap-4">
                    <span className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600"><User size={16}/> {userName}</span>
                    {isAdmin && <button onClick={() => navigate('/admin')} className="bg-slate-800 text-white px-4 py-1.5 rounded-full text-xs font-bold">Admin</button>}
                    <button onClick={navigateToEditor} className="bg-orange-700 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">Crear Blog</button>
                    <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500">Salir</button>
                </div>
            ) : (
                <button onClick={() => navigate('/login')} className="bg-slate-900 text-white px-6 py-2 rounded-full shadow-lg text-sm font-bold">Iniciar Sesión</button>
            )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {featured ? (
            <>
                <div>
                    <span className="text-orange-700 font-bold tracking-widest text-xs uppercase mb-4 block">Entrevista Destacada</span>
                    
                    {/* AQUÍ MOSTRAMOS EL TÍTULO (NOMBRE) */}
                    <h2 className="text-4xl md:text-6xl font-serif leading-tight mb-2">{featured.title}</h2>
                    
                    {/* AQUÍ MOSTRAMOS LA DESCRIPCIÓN (PROFESIÓN - LUGAR) */}
                    <p className="text-xl text-slate-500 mb-6 font-medium border-l-4 border-orange-700 pl-4 uppercase tracking-wider text-sm">
                        {featured.description || 'Profesión no especificada'}
                    </p>

                    <p className="text-slate-600 mb-8 italic">
                        "{featured.content.find(b => b.type === 'text')?.content.substring(0, 100)}..."
                    </p>
                    <button onClick={() => navigateToBlog(featured.id)} className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 font-bold hover:text-orange-700 transition">Leer completa <ArrowRight size={18} /></button>
                </div>
                <div onClick={() => navigateToBlog(featured.id)} className="relative h-[400px] w-full bg-slate-200 overflow-hidden rounded-sm shadow-2xl cursor-pointer hover:opacity-90 transition">
                    <img src={featured.cover_image || "https://via.placeholder.com/800"} className="w-full h-full object-cover" />
                </div>
            </>
        ) : (
             // ... (código de vacío igual) ...
             <div className="md:col-span-2 text-center py-20 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-400">
                <h3 className="text-2xl font-serif">No hay historias destacadas.</h3>
             </div>
        )}
      </header>

      {/* LISTA RECIENTES */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h3 className="text-2xl font-serif mb-12 border-b border-slate-200 pb-4">Recientes</h3>
        <div className="space-y-6">
          {recent.length > 0 ? recent.map((item) => (
            <div key={item.id} onClick={() => navigateToBlog(item.id)} className="group flex items-center justify-between p-4 bg-white border border-slate-100 hover:border-orange-200 hover:shadow-md transition cursor-pointer rounded-lg">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-200 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.cover_image || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h4 className="text-lg font-bold group-hover:text-orange-700 transition">{item.title}</h4>
                    {/* AQUÍ TAMBIÉN MOSTRAMOS LA DESCRIPCIÓN */}
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">{item.description}</p>
                </div>
              </div>
              <ArrowRight className="text-slate-300 group-hover:text-orange-700 transition" />
            </div>
          )) : <p className="text-slate-400 italic">No hay historias recientes.</p>}
        </div>
      </section>
    </div>
  );
};

export default HomePage;    