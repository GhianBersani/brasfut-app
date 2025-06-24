// brasfut-app/frontend/src/HomePage.js

import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext'; // Importar AuthContext

function HomePage() {
  const { isLoggedIn, username } = useContext(AuthContext); // Acessar o estado de login

  return (
    <div>
      <h2>Página Inicial</h2>
      {isLoggedIn ? (
        <p>Olá, {username}! Explore as últimas postagens do Brasfut-App.</p>
      ) : (
        <p>Faça login ou registre-se para começar a explorar o Brasfut-App!</p>
      )}
    </div>
  );
}

export default HomePage;