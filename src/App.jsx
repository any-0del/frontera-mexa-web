import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

// Importamos TODAS las páginas
import HomePage from './pages/Home';
import EditorPage from './pages/Editor';
import BlogPost from './pages/BlogPost';
import LoginPage from './pages/Login';
import AdminPanel from './pages/AdminPanel'; // <--- Aquí importamos el Admin

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta 1: Home (Portada) */}
        <Route path="/" element={<HomeWrapper />} />
        
        {/* Ruta 2: Editor (Crear Blog) */}
        <Route path="/crear" element={<EditorWrapper />} />
        
        {/* Ruta 3: Lectura (Ver un blog específico) */}
        <Route path="/blog/:id" element={<BlogPost />} />
        
        {/* Ruta 4: Login (Iniciar sesión) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Ruta 5: Admin Panel (Tu centro de mando) */}
        <Route path="/admin" element={<AdminPanel />} />

      </Routes>
    </BrowserRouter>
  );
}

// --- WRAPPERS (Ayudantes de navegación) ---

const HomeWrapper = () => {
  const navigate = useNavigate();
  return <HomePage 
    navigateToEditor={() => navigate('/crear')} 
    navigateToBlog={(id) => navigate(`/blog/${id}`)} 
  />;
};

const EditorWrapper = () => {
  const navigate = useNavigate();
  return <EditorPage goBack={() => navigate('/')} />;
};

export default App;