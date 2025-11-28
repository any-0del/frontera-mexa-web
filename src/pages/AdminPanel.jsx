import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, CheckCircle, XCircle, Star, Eye, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    checkUser();
    fetchBlogs();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        navigate('/login');
        return;
    }
    // Aquí usamos username o email según lo que tenga disponible auth
    setAdminName(user.user_metadata.full_name || user.email);
  };

  const fetchBlogs = async () => {
    // CORRECCIÓN AQUÍ: Cambiamos 'email' por 'username'
    const { data, error } = await supabase
      .from('blogs')
      .select('*, profiles(full_name, username)') 
      .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error cargando blogs:", error);
        alert("Error de conexión: " + error.message);
    } else {
        setBlogs(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    await supabase.from('blogs').update({ status: newStatus }).eq('id', id);
    fetchBlogs();
  };

  const toggleFeatured = async (id, currentStatus) => {
    if (!currentStatus) await supabase.from('blogs').update({ is_featured: false }).neq('id', 0);
    await supabase.from('blogs').update({ is_featured: !currentStatus }).eq('id', id);
    fetchBlogs();
  };

  const deleteBlog = async (id) => {
    if (!window.confirm("¿Eliminar permanentemente?")) return;
    await supabase.from('blogs').delete().eq('id', id);
    fetchBlogs();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <div className="p-10 text-center">Cargando panel...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER ADMIN */}
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900">Panel de Administración</h1>
            <p className="text-sm text-slate-500">Hola, {adminName}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate('/')} className="text-sm font-bold text-slate-700 hover:text-orange-700">Ir al Sitio Web</button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"><LogOut size={16}/> Salir</button>
          </div>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-white uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4">Autor</th>
                <th className="p-4">Título</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center">Destacado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {blogs.map(blog => (
                <tr key={blog.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{blog.profiles?.full_name || 'Usuario Eliminado'}</div>
                    {/* CORRECCIÓN AQUÍ TAMBIÉN: Mostramos username */}
                    <div className="text-xs text-slate-400">{blog.profiles?.username || 'Sin correo'}</div>
                  </td>
                  <td className="p-4 text-sm font-medium">{blog.title}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                      ${blog.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        blog.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleFeatured(blog.id, blog.is_featured)}>
                      <Star size={20} className={blog.is_featured ? "fill-orange-500 text-orange-500" : "text-slate-300"} />
                    </button>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => navigate(`/blog/${blog.id}`)} title="Ver" className="p-2 bg-slate-100 rounded hover:bg-slate-200"><Eye size={18} /></button>
                    <button onClick={() => updateStatus(blog.id, 'approved')} title="Aprobar" className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100"><CheckCircle size={18} /></button>
                    <button onClick={() => updateStatus(blog.id, 'rejected')} title="Rechazar" className="p-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"><XCircle size={18} /></button>
                    <button onClick={() => deleteBlog(blog.id)} title="Eliminar" className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {blogs.length === 0 && <div className="p-10 text-center text-slate-400">No hay blogs encontrados.</div>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;