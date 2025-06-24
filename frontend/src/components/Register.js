// brasfut-app/frontend/src/components/Register.js (Atualizado)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Hook para navegação programática

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('Registrando...');

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + ' Redirecionando para Login...');
        // Após o registro bem-sucedido, redireciona para a página de login
        navigate('/login');
      } else {
        setMessage('Erro: ' + data.message);
      }
    } catch (error) {
      setMessage('Erro de conexão: ' + error.message);
      console.error('Erro ao registrar:', error);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Registrar Nova Conta</h2>
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
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <button type="submit">Registrar</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Register;