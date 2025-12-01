import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon, Type, Trash2, ArrowLeft, Send, Video, UploadCloud, MapPin, Briefcase, User, Linkedin, Instagram, Twitter } from 'lucide-react';

const EditorPage = ({ goBack }) => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  
  // --- DATOS DE CABECERA ---
  const [coverImage, setCoverImage] = useState(null); 
  const [coverPreview, setCoverPreview] = useState(null); 
  
  const [intervieweeName, setIntervieweeName] = useState(''); // Nombre
  const [profession, setProfession] = useState('');       // Profesión
  const [location, setLocation] = useState('');           // Lugar

  // --- NUEVO: REDES SOCIALES ---
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    instagram: '',
    twitter: ''
  });

  // Plantilla de preguntas
  const [blocks, setBlocks] = useState([
    { id: 1, type: 'text', content: 'Hola, soy [Nombre] y decidí emprender este viaje porque...', isFixed: false },
    { id: 2, type: 'question', content: '¿Cuál fue el choque cultural más grande que enfrentaste?', isFixed: false },
    { id: 3, type: 'text', content: '', isFixed: false },
  ]);
  
  const coverInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeBlockId, setActiveBlockId] = useState(null);

  // Lógica Portada
  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  // NUEVO: Lógica Redes Sociales
  const handleSocialChange = (e) => {
    setSocialLinks({ ...socialLinks, [e.target.name]: e.target.value });
  };

  // Lógica Bloques
  const addBlock = (type) => {
    setBlocks([...blocks, { id: Date.now(), type, content: '' }]);
  };

  const removeBlock = (id) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const updateContent = (id, text) => {
    const newBlocks = blocks.map(block => block.id === id ? { ...block, content: text } : block);
    setBlocks(newBlocks);
  };

  const triggerBlockImageUpload = (id) => {
    setActiveBlockId(id);
    fileInputRef.current.click(); 
  };

  const handleBlockImageChange = (e) => {
    const file = e.target.files[0];
    if (file && activeBlockId) {
      const imageUrl = URL.createObjectURL(file);
      const newBlocks = blocks.map(block => block.id === activeBlockId ? { ...block, content: imageUrl } : block);
      setBlocks(newBlocks);
      setActiveBlockId(null);
    }
  };

  // --- ENVÍO DE DATOS ---
  const handleSubmit = async () => {
    if (!coverImage) return alert("Falta la foto de portada.");
    if (!intervieweeName) return alert("Falta el nombre de la persona.");

    setUploading(true);

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("Inicia sesión primero.");

        // Subir Portada
        const coverName = `cover-${Date.now()}-${Math.random()}.jpg`;
        const { error: coverError } = await supabase.storage.from('blog-images').upload(coverName, coverImage);
        if (coverError) throw coverError;
        const { data: { publicUrl: coverUrl } } = supabase.storage.from('blog-images').getPublicUrl(coverName);

        // Subir imágenes de bloques
        const processedBlocks = await Promise.all(blocks.map(async (block) => {
            if (block.type === 'image' && block.content.startsWith('blob:')) {
                const file = await fetch(block.content).then(r => r.blob());
                const fileName = `block-${Date.now()}-${Math.random()}.jpg`;
                await supabase.storage.from('blog-images').upload(fileName, file);
                const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(fileName);
                return { ...block, content: publicUrl };
            }
            return block;
        }));

        const fullDescription = `${profession} • ${location}`;

        // Guardar en DB (INCLUYENDO SOCIAL LINKS)
        const { error } = await supabase
            .from('blogs')
            .insert({
                title: intervieweeName,
                description: fullDescription,
                content: processedBlocks,
                author_id: user.id,
                status: 'pending',
                cover_image: coverUrl,
                social_links: socialLinks // <--- AQUÍ SE GUARDAN LAS REDES
            });

        if (error) throw error;

        alert("¡Historia enviada! Espera aprobación.");
        navigate('/');

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 font-sans">
      <input type="file" ref={coverInputRef} onChange={handleCoverSelect} className="hidden" accept="image/*" />
      <input type="file" ref={fileInputRef} onChange={handleBlockImageChange} className="hidden" accept="image/*" />

      <div className="w-full max-w-3xl bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200 pb-20">
        
        {/* HEADER NAV */}
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between sticky top-0 z-30 shadow-md">
            <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm"><ArrowLeft size={16} /> Cancelar</button>
            <h2 className="font-serif font-bold tracking-widest text-sm uppercase">Nuevo Blog</h2>
            <div className="w-16"></div> 
        </div>

        {/* --- 1. ZONA DE PORTADA --- */}
        <div onClick={() => coverInputRef.current.click()} className="w-full h-64 bg-slate-200 cursor-pointer relative group overflow-hidden border-b-4 border-orange-500">
            {coverPreview ? (
                <img src={coverPreview} className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-slate-100 hover:bg-slate-200 transition">
                    <UploadCloud size={32} className="text-orange-600 mb-2"/>
                    <span className="font-bold text-lg">SUBIR PORTADA</span>
                </div>
            )}
        </div>

        {/* --- 2. ZONA DE DATOS DEL PERFIL --- */}
        <div className="p-8 bg-slate-50 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1"><User size={14}/> Nombre de la Persona</label>
                    <input 
                        value={intervieweeName}
                        onChange={(e) => setIntervieweeName(e.target.value)}
                        className="w-full text-3xl font-serif font-bold bg-transparent border-b-2 border-slate-300 focus:border-orange-600 outline-none placeholder-slate-300 transition py-2"
                        placeholder="Ej: Victoria Ruiz"
                    />
                </div>
                
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1"><Briefcase size={14}/> Profesión / Cargo</label>
                    <input 
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded focus:border-blue-500 outline-none"
                        placeholder="Ej: Arquitecta Senior"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1"><MapPin size={14}/> Lugar / País</label>
                    <input 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded focus:border-green-500 outline-none"
                        placeholder="Ej: Londres, UK"
                    />
                </div>
            </div>

            {/* --- NUEVA SECCIÓN: REDES SOCIALES --- */}
            <div className="border-t border-slate-200 pt-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Redes Sociales (Opcional)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600"><Linkedin size={16}/></div>
                        <input name="linkedin" value={socialLinks.linkedin} onChange={handleSocialChange} className="pl-10 w-full p-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-blue-500" placeholder="Link de LinkedIn" />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-pink-600"><Instagram size={16}/></div>
                        <input name="instagram" value={socialLinks.instagram} onChange={handleSocialChange} className="pl-10 w-full p-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-pink-500" placeholder="@usuario o Link" />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-800"><Twitter size={16}/></div>
                        <input name="twitter" value={socialLinks.twitter} onChange={handleSocialChange} className="pl-10 w-full p-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-slate-800" placeholder="Link de X / Twitter" />
                    </div>
                </div>
            </div>
        </div>

        {/* --- 3. ÁREA DE BLOQUES --- */}
        <div className="p-8 space-y-6 bg-white min-h-[300px]">
          {blocks.map((block) => (
            <div key={block.id} className={`relative group border p-6 rounded-lg shadow-sm transition ${block.type === 'question' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
              
              {block.type === 'question' && (
                <div>
                   <span className="bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block">Pregunta</span>
                   <input defaultValue={block.content} onChange={(e) => updateContent(block.id, e.target.value)} className="w-full font-serif text-lg font-bold bg-transparent border-b border-orange-200 focus:border-orange-500 outline-none" placeholder="Título de la pregunta..." />
                </div>
              )}

              {block.type === 'text' && (
                <div>
                   <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block">Respuesta</span>
                   <textarea defaultValue={block.content} onChange={(e) => updateContent(block.id, e.target.value)} className="w-full p-3 bg-slate-50 rounded border border-slate-200 focus:border-blue-500 outline-none resize-none h-28" placeholder="Escribe la respuesta..." ></textarea>
                </div>
              )}

              {block.type === 'image' && (
                <div onClick={() => triggerBlockImageUpload(block.id)} className="h-40 border-2 border-dashed rounded bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer">
                    {block.content ? <img src={block.content} className="w-full h-full object-cover"/> : <div className="text-slate-400 flex flex-col items-center"><ImageIcon size={24}/><span className="text-xs font-bold">FOTO EXTRA</span></div>}
                </div>
              )}
               
              {/* Video */}
              {block.type === 'video' && (
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <label className="text-red-600 font-bold text-xs tracking-widest uppercase mb-2 flex items-center gap-2"><Video size={14}/> Video YouTube</label>
                  <input defaultValue={block.content} onChange={(e) => updateContent(block.id, e.target.value)} className="w-full p-2 bg-white border rounded font-mono text-sm outline-none" placeholder="Link de YouTube..." />
                </div>
              )}

              <button onClick={() => removeBlock(block.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        {/* BARRA HERRAMIENTAS */}
        <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-40 shadow-lg flex justify-between gap-4">
            <div className="flex gap-4">
              <button onClick={() => addBlock('question')} className="flex flex-col items-center text-slate-500 hover:text-orange-700"><Plus size={20}/><span className="text-[10px]">PREGUNTA</span></button>
              <button onClick={() => addBlock('text')} className="flex flex-col items-center text-slate-500 hover:text-blue-700"><Type size={20}/><span className="text-[10px]">TEXTO</span></button>
              <button onClick={() => addBlock('image')} className="flex flex-col items-center text-slate-500 hover:text-green-700"><ImageIcon size={20}/><span className="text-[10px]">FOTO</span></button>
              <button onClick={() => addBlock('video')} className="flex flex-col items-center text-slate-500 hover:text-red-700"><Video size={20}/><span className="text-[10px]">VIDEO</span></button>
            </div>
            <button onClick={handleSubmit} disabled={uploading} className="bg-slate-900 text-white font-bold px-8 py-2 rounded-lg hover:bg-orange-700 transition disabled:opacity-50">
              {uploading ? 'Enviando...' : 'Enviar Historia'}
            </button>
        </div>

      </div>
    </div>
  );
};

export default EditorPage;