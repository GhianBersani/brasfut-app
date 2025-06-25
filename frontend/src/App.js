// brasfut-app/frontend/src/App.js

import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importar componentes de rota
import AuthPage from './components/AuthPage'; // Importar AuthPage (é o único ponto de entrada para autenticação)
import Navbar from './components/Navbar';
import HomePage from './HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import ProfilePage from './components/ProfilePage';

// Importar contexto de autenticação
import { AuthContext } from './context/AuthContext';

// Criar o contexto do tema (exportado para ser usado em AuthPage e Navbar.js)
export const ThemeContext = React.createContext();

function App() {
  const { isLoggedIn } = useContext(AuthContext);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme || 'dark'; // Padrão 'dark'
  });

  useEffect(() => {
    localStorage.setItem('appTheme', theme);
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Router>
        <div className="App">
          {/* Se não estiver logado, sempre mostra a AuthPage na rota raiz */}
          {!isLoggedIn ? (
            <Routes>
              <Route path="/" element={<AuthPage />} />
              {/* Redireciona qualquer outra rota para a AuthPage se não logado */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            // Se estiver logado, mostra a estrutura principal do app
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
                <Route path="/users/:username" element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} />
                {/* Se o usuário estiver logado e tentar acessar a raiz ou rotas de autenticação, redireciona para a HomePage */}
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} /> {/* Rota curinga para outras rotas */}
              </Routes>
            </>
          )}
        </div>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
