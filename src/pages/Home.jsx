import React, { useEffect, useState } from 'react';
import { ArrowRight, User, MapPin, Briefcase, Star } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

const HomePage = ({ navigateToEditor, navigateToBlog }) => {
  const [featured, setFeatured] = useState([]);
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
        const feat = approvedBlogs.filter(b => b.is_featured).slice(0, 3);
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

  const getMeta = (desc) => {
    if (!desc) return { job: 'Profesión', loc: 'Ubicación' };
    const parts = desc.split('•');
    return { job: parts[0]?.trim(), loc: parts[1]?.trim() };
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center font-serif">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 font-sans selection:bg-orange-200">
      
      <nav className="flex justify-between items-center py-8 px-6 max-w-7xl mx-auto border-b border-slate-200">
        <h1 className="text-2xl font-serif font-bold tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          Frontera <span className="text-orange-700">Mexa</span>.
        </h1>
        <div className="flex items-center gap-4">
            {userName ? (
                <div className="flex items-center gap-4">
                    <span className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600"><User size={16}/> {userName}</span>
                    {isAdmin && <button onClick={() => navigate('/admin')} className="bg-slate-800 text-white px-4 py-1.5 rounded-full text-xs font-bold">Admin</button>}
                    <button onClick={navigateToEditor} className="bg-orange-700 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg hover:bg-orange-800 transition">Crear Blog</button>
                    <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500">Salir</button>
                </div>
            ) : (
                <button onClick={() => navigate('/login')} className="bg-slate-900 text-white px-6 py-2 rounded-full shadow-lg text-sm font-bold hover:bg-slate-800 transition">Iniciar Sesión</button>
            )}
        </div>
      </nav>

      <header className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8">
            <Star className="fill-orange-500 text-orange-500" size={20}/>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-500">Historias Destacadas</span>
        </div>
        {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[550px]">
                <div onClick={() => navigateToBlog(featured[0].id)} className="md:col-span-2 relative group cursor-pointer overflow-hidden rounded-xl shadow-lg h-[400px] md:h-full">
                    {/* AQUI ESTÁ LA MAGIA: objectPosition */}
                    <img src={featured[0].cover_image} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: featured[0].cover_position || 'center' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-0 p-8 text-white">
                        <span className="bg-orange-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded mb-3 inline-block">Principal</span>
                        <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight mb-2">{featured[0].title}</h2>
                        <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                            <span className="flex items-center gap-1"><Briefcase size={14}/> {getMeta(featured[0].description).job}</span>
                            <span className="hidden md:inline">|</span>
                            <span className="flex items-center gap-1"><MapPin size={14}/> {getMeta(featured[0].description).loc}</span>
                        </div>
                    </div>
                </div>
                <div className="md:col-span-1 flex flex-col gap-6 h-full">
                    {featured[1] && (
                        <div onClick={() => navigateToBlog(featured[1].id)} className="relative flex-1 group cursor-pointer overflow-hidden rounded-xl shadow-md h-[250px] md:h-auto">
                            <img src={featured[1].cover_image} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: featured[1].cover_position || 'center' }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-0 p-6 text-white"><h3 className="text-xl font-serif font-bold leading-tight mb-1">{featured[1].title}</h3><p className="text-xs text-orange-400 font-bold uppercase tracking-wider">{getMeta(featured[1].description).loc}</p></div>
                        </div>
                    )}
                    {featured[2] && (
                        <div onClick={() => navigateToBlog(featured[2].id)} className="relative flex-1 group cursor-pointer overflow-hidden rounded-xl shadow-md h-[250px] md:h-auto">
                            <img src={featured[2].cover_image} className="w-full h-full object-cover transition duration-700 group-hover:scale-105" style={{ objectPosition: featured[2].cover_position || 'center' }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute bottom-0 p-6 text-white"><h3 className="text-xl font-serif font-bold leading-tight mb-1">{featured[2].title}</h3><p className="text-xs text-orange-400 font-bold uppercase tracking-wider">{getMeta(featured[2].description).loc}</p></div>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 text-slate-400"><h3 className="text-2xl font-serif">Aún no hay historias destacadas.</h3></div>
        )}
      </header>

      <section className="max-w-4xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-serif mb-8 border-b border-slate-200 pb-4">Más Historias Recientes</h3>
        <div className="space-y-6">
          {recent.length > 0 ? recent.map((item) => (
            <div key={item.id} onClick={() => navigateToBlog(item.id)} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white border border-slate-100 hover:border-orange-200 hover:shadow-md transition cursor-pointer rounded-lg gap-6">
              <div className="flex items-center gap-6 w-full">
                <div className="w-20 h-20 bg-slate-200 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.cover_image} className="w-full h-full object-cover" style={{ objectPosition: item.cover_position || 'center' }} />
                </div>
                <div className="flex-1"><h4 className="text-lg font-bold group-hover:text-orange-700 transition">{item.title}</h4><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mt-1"><span>{getMeta(item.description).job}</span><span>•</span><span>{getMeta(item.description).loc}</span></div></div>
              </div>
              <ArrowRight className="hidden md:block text-slate-300 group-hover:text-orange-700 transition" />
            </div>
          )) : <p className="text-slate-400 italic">No hay más historias.</p>}
        </div>
      </section>
    </div>
  );
};
export default HomePage;