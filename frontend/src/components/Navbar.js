// brasfut-app/frontend/src/components/Navbar.js

import React, { useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
// Removida importação de ThemeContext, pois o botão de tema estará na AuthPage
import '../App.css';

function Navbar() {
  const { isLoggedIn, username, logout } = useContext(AuthContext);
  // Removida desestruturação de theme e toggleTheme
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    setTimeout(() => {
      navigate('/'); // Redireciona para a AuthPage (rota '/') após logout
    }, 0);
  }, [logout, navigate]);

  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Início</Link>
        </li>
        {isLoggedIn && (
          <li key="auth-logged-in-items">
            <span className="nav-user">Bem-vindo, {username}!</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
            {/* Botão de alternar tema REMOVIDO DESTAQUI */}
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
