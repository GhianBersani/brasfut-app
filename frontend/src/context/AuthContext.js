// brasfut-app/frontend/src/context/AuthContext.js
// ESTE ARQUIVO CONTÉM O PROVEDOR DE AUTENTICAÇÃO E O CONTEXTO

import React, { createContext, useState, useEffect } from 'react';

// Exporta o Contexto para ser usado por componentes consumidores
export const AuthContext = createContext();

// O Provedor de Contexto que gerencia o estado de autenticação
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);

  // Carrega o estado de autenticação do localStorage ao iniciar a aplicação
  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('userId');
      const storedUsername = localStorage.getItem('username');

      if (storedUserId && storedUsername) {
        setIsLoggedIn(true);
        setUserId(parseInt(storedUserId)); // Converte ID para número
        setUsername(storedUsername);
        console.log('AuthContext: Usuário carregado do localStorage:', storedUsername, storedUserId);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      // Limpa localStorage se houver erro (dados corrompidos)
      localStorage.clear();
    }
  }, []); // Executa apenas uma vez na montagem

  // Função para logar o usuário
  const login = (id, user) => {
    setIsLoggedIn(true);
    setUserId(id);
    setUsername(user);
    // Salva no localStorage
    localStorage.setItem('userId', id.toString());
    localStorage.setItem('username', user);
    console.log('AuthContext: Usuário logado e salvo no localStorage:', user, id);
  };

  // Função para deslogar o usuário
  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setUsername(null);
    // Remove do localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    console.log('AuthContext: Usuário deslogado e removido do localStorage.');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
