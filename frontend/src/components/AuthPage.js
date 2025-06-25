// brasfut-app/frontend/src/components/AuthPage.js (CÓDIGO COMPLETO E FINAL)

import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../App';
import '../App.css';

function AuthPage() {
  const { login } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  // Estado para controlar qual formulário está visível: 'login' (false) ou 'register' (true)
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  // Estados para o formulário de Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  // Estados para o formulário de Registro
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginMessage('Logando...');
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setLoginMessage(`Bem-vindo, ${data.username}!`);
        login(data.user_id, data.username);
        navigate('/');
      } else {
        setLoginMessage('Erro: ' + data.message);
      }
    } catch (error) {
      setLoginMessage('Erro de conexão: ' + error.message);
      console.error('Erro ao fazer login:', error);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterMessage('Registrando...');
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerUsername, email: registerEmail, password: registerPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setRegisterMessage('Registro bem-sucedido! Faça seu login.');
        setRegisterUsername(''); setRegisterEmail(''); setRegisterPassword('');
        setShowRegisterForm(false); // Volta para o formulário de login após registro
        setLoginMessage('Registro bem-sucedido. Faça seu login!'); // Mensagem no formulário de login
      } else {
        setRegisterMessage('Erro: ' + data.message);
      }
    } catch (error) {
      setRegisterMessage('Erro de conexão: ' + error.message);
      console.error('Erro ao registrar:', error);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Botão de tema no canto superior esquerdo */}
      <button onClick={toggleTheme} className="theme-toggle-icon top-left">
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Conteúdo principal centralizado como um card */}
      <div className="auth-card-wrapper">
        <div className="auth-form-card">
          <div className="app-logo-small">LOGO</div> {/* Logo menor dentro do card */}
          <p className="app-tagline-small">Conecte-se com a paixão do futebol!</p>

          {!showRegisterForm ? (
            <>
              {/* Formulário de Login */}
              <h2>Login</h2> {/* Título para o formulário de login (oculto por CSS) */}
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div>
                  <input type="text" id="login-username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Nome de usuário" required />
                </div>
                <div>
                  <input type="password" id="login-password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Senha" required />
                </div>
                <button type="submit" className="auth-button primary">ENTRAR</button>
              </form>
              {loginMessage && <p className="message">{loginMessage}</p>}
              
              <div className="auth-separator"><span>OU</span></div> {/* Separador ajustado */}
              <button className="auth-button secondary-link" onClick={() => setShowRegisterForm(true)}>Criar nova conta</button>
            </>
          ) : (
            <>
              {/* Formulário de Registro */}
              <h2>Registrar</h2> {/* Título para o formulário de registro (oculto por CSS) */}
              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div>
                  <input type="text" id="register-username" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} placeholder="Nome de usuário" required />
                </div>
                <div>
                  <input type="email" id="register-email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="E-mail" required />
                </div>
                <div>
                  <input type="password" id="register-password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} placeholder="Senha" required />
                </div>
                <button type="submit" className="auth-button primary">REGISTRAR-SE</button>
              </form>
              {registerMessage && <p className="message">{registerMessage}</p>}

              <div className="auth-separator"><span>OU</span></div> {/* Separador ajustado */}
              <button className="auth-button secondary-link" onClick={() => setShowRegisterForm(false)}>Já tem uma conta?</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
