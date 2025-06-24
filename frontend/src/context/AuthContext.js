// brasfut-app/frontend/src/context/AuthContext.js (Versão definitiva por enquanto)

import React, { createContext, useState } from 'react'; // Remove useEffect

// Cria o contexto de autenticação
export const AuthContext = createContext();

// Provedor do contexto que envolverá toda a aplicação
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  // A função de login apenas atualiza o estado
  const login = (id, user) => {
    setIsLoggedIn(true);
    setUserId(id);
    setUsername(user);
    console.log('AuthContext: Usuário logado:', user, id); // Para depuração
  };

  // A função de logout apenas limpa o estado
  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setUsername(null);
    console.log('AuthContext: Usuário deslogado.'); // Para depuração
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};