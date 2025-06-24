// brasfut-app/frontend/src/components/Login.js (Atualizado)

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import { AuthContext } from '../context/AuthContext'; // Importar AuthContext

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useContext(AuthContext); // Usar o hook useContext para acessar 'login'
  const navigate = useNavigate(); // Hook para navegação programática

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('Logando...');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + ` Bem-vindo, ${data.username}!`);
        login(data.user_id, data.username); // Chama a função login do contexto
        navigate('/'); // Redireciona para a página inicial após login
      } else {
        setMessage('Erro: ' + data.message);
      }
    } catch (error) {
      setMessage('Erro de conexão: ' + error.message);
      console.error('Erro ao fazer login:', error);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Acessar Conta</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Usuário:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Login;