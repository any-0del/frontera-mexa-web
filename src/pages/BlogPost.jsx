import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Heart, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para Likes
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState(null);

  const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: blogData, error } = await supabase
        .from('blogs')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error cargando blog:", error);
      } else {
        setBlog(blogData);
        fetchLikes(user?.id);
      }
      setLoading(false);
    };

    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchLikes = async (userId) => {
    const { count } = await supabase.from('blog_likes').select('*', { count: 'exact', head: true }).eq('blog_id', id);
    setLikeCount(count || 0);

    if (userId) {
      const { data } = await supabase.from('blog_likes').select('*').eq('blog_id', id).eq('user_id', userId).single();
      setIsLiked(!!data);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: `Lee la historia de ${blog.title} en Frontera Mexa`,
          url: window.location.href,
        });
      } catch (error) { console.log('Cancelado'); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("¡Enlace copiado!");
    }
  };

  const handleLike = async () => {
    if (!user) {
        if(window.confirm("Inicia sesión para dar Like. ¿Ir al login?")) navigate('/login');
        return;
    }
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikeCount(prev => newStatus ? prev + 1 : prev - 1);

    if (newStatus) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#c2410c', '#fb923c', '#ffffff'] });
        await supabase.from('blog_likes').insert({ user_id: user.id, blog_id: id });
    } else {
        await supabase.from('blog_likes').delete().eq('user_id', user.id).eq('blog_id', id);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif">Cargando...</div>;
  if (!blog) return <div className="min-h-screen flex items-center justify-center font-serif">Historia no encontrada.</div>;

  const coverImage = blog.cover_image || "https://images.unsplash.com/photo-1517487881594-2787fdb86ef5?auto=format&fit=crop&w=1200";

  // Desestructuramos la descripción para mostrarla bonita
  // (Si guardaste "Arquitecta • Londres", aquí lo separamos visualmente)
  const descriptionParts = blog.description ? blog.description.split('•') : ['Profesión no definida', 'Ubicación no definida'];
  const profession = descriptionParts[0]?.trim();
  const location = descriptionParts[1]?.trim();

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans pb-20">
      
      {/* NAV CRISTAL (SEMI-TRANSPARENTE) CON EL NOMBRE DE LA PERSONA */}
      <nav className="fixed top-0 w-full bg-[#FDFBF7]/80 backdrop-blur-md z-50 border-b border-slate-200/50 px-6 py-4 flex justify-between items-center transition-all duration-300">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition">
            <ArrowLeft size={20} /> <span className="hidden md:inline">Volver</span>
        </button>
        
        {/* Aquí va el Nombre de la Persona como Título del Nav */}
        <span className="font-serif font-bold tracking-widest text-sm uppercase truncate max-w-[200px] md:max-w-none text-slate-900">
            {blog.title}
        </span>

        <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 group transition">
                <div className={`p-2 rounded-full transition duration-300 ${isLiked ? 'bg-red-50' : 'hover:bg-slate-100'}`}>
                    <Heart size={20} className={`transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 group-hover:text-red-400'}`} />
                </div>
                <span className={`text-xs font-bold ${isLiked ? 'text-red-600' : 'text-slate-400'}`}>{likeCount}</span>
            </button>
            <button onClick={handleShare} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition">
                <Share2 size={20} />
            </button>
        </div>
      </nav>

      {/* HERO SECTION (PORTADA ESTRUCTURADA) */}
      <header className="relative w-full h-[70vh] overflow-hidden mt-0">
        <img src={coverImage} alt={blog.title} className="w-full h-full object-cover" />
        {/* Degradado para que el texto blanco se lea perfecto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white max-w-5xl mx-auto pb-16">
          
          {/* Tag de Estado */}
          <span className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm bg-orange-700 text-white">
            {blog.status === 'pending' ? 'Pendiente de Aprobación' : 'Historia Oficial'}
          </span>
          
          {/* NOMBRE GIGANTE (Solo el nombre) */}
          <h1 className="text-5xl md:text-8xl font-serif font-bold leading-none mb-6 tracking-tight">
            {blog.title}
          </h1>
          
          {/* ESTRUCTURA SEPARADA: Profesión | Lugar */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-slate-200 border-l-4 border-orange-500 pl-4 md:pl-6">
             <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-orange-500"/>
                <span className="text-lg md:text-xl font-light uppercase tracking-widest">{profession}</span>
             </div>
             
             {/* Separador visible solo en escritorio */}
             <span className="hidden md:block text-slate-500 text-2xl font-thin">|</span>
             
             <div className="flex items-center gap-2">
                <MapPin size={18} className="text-orange-500"/>
                <span className="text-lg md:text-xl font-light uppercase tracking-widest">{location}</span>
             </div>
          </div>

        </div>
      </header>

      {/* CONTENIDO DEL BLOG */}
      <article className="max-w-3xl mx-auto px-6 py-20 space-y-16">
        
        {/* Intro Metadata */}
        <div className="flex justify-center pb-8 border-b border-slate-200">
             <p className="text-sm text-slate-400 uppercase tracking-widest">
                 Publicado el {new Date(blog.created_at).toLocaleDateString()}
             </p>
        </div>

        {blog.content.map((block, index) => (
            <div key={index}>
                {block.type === 'text' && (
                    <p className="text-xl text-slate-800 leading-loose font-light whitespace-pre-wrap">
                        {block.content}
                    </p>
                )}
                
                {block.type === 'question' && (
                    <div className="mt-16 mb-8">
                        <h3 className="font-serif text-3xl font-bold text-slate-900 mb-2">
                            {block.content}
                        </h3>
                        <div className="w-16 h-1 bg-orange-500"></div>
                    </div>
                )}
                
                {block.type === 'image' && (
                    <figure className="my-12 group">
                        <div className="overflow-hidden rounded-lg shadow-2xl">
                            <img src={block.content} className="w-full hover:scale-105 transition duration-1000 ease-out" />
                        </div>
                    </figure>
                )}
                
                {block.type === 'video' && (
                    <div className="my-12 w-full aspect-video rounded-lg overflow-hidden shadow-xl bg-black">
                        <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${getYouTubeID(block.content)}`} frameBorder="0" allowFullScreen></iframe>
                    </div>
                )}
            </div>
        ))}
      </article>

      {/* FOOTER LLAMADA A LA ACCIÓN */}
      <div className="bg-slate-900 text-white py-20 text-center px-4 mt-12">
          <h4 className="font-serif text-3xl md:text-4xl mb-6">¿Tienes una historia que contar?</h4>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto text-lg">
             Únete a nuestra comunidad y comparte tu experiencia viviendo en el extranjero. Tu historia puede inspirar a miles.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <button onClick={() => navigate('/crear')} className="bg-orange-700 text-white px-10 py-4 rounded-full hover:bg-orange-600 transition font-bold shadow-lg transform hover:-translate-y-1 text-lg">
                Crear mi Blog
            </button>
            <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="border border-slate-600 text-slate-300 px-10 py-4 rounded-full hover:bg-white hover:text-slate-900 transition font-bold">
                Volver arriba
            </button>
          </div>
          <p className="mt-16 text-xs text-slate-600 uppercase tracking-widest">Frontera Mexa © 2025</p>
      </div>

    </div>
  );
};

export default BlogPost;