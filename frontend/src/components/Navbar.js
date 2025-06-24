// brasfut-app/frontend/src/components/Navbar.js (Versão com tratamento de re-renderização mais segura)

import React, { useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../App.css';

function Navbar() {
  const { isLoggedIn, username, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    // Primeiro, chame a função de logout para limpar o estado
    logout();
    console.log('Navbar: Chamando logout...');

    // Em seguida, redirecione. Usar setTimeout(0) é uma forma comum de garantir
    // que o React finalize qualquer operação de renderização atual antes de
    // iniciar a próxima (a navegação que desmontará o componente).
    // Isso é especialmente útil em React 18 com renderização concorrente.
    setTimeout(() => {
      navigate('/login');
      console.log('Navbar: Navegou para /login após logout.');
    }, 0); // Empurra a navegação para o próximo tick do event loop
  }, [logout, navigate]);

  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Início</Link>
        </li>
        {isLoggedIn ? (
          // Usamos um elemento div invisível para agrupar e dar uma "key" persistente
          // ao conteúdo quando o usuário está logado.
          // Isso ajuda o React a rastrear este bloco de elementos.
          <div key="auth-items-loggedin" style={{ display: 'flex', alignItems: 'center' }}>
            <li>
              <span className="nav-user">Bem-vindo, {username}!</span>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-button">Logout</button>
            </li>
          </div>
        ) : (
          // O mesmo para os itens quando o usuário não está logado.
          <div key="auth-items-loggedout" style={{ display: 'flex', alignItems: 'center' }}>
            <li>
              <Link to="/register">Registrar</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </div>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;