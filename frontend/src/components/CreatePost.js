// brasfut-app/frontend/src/components/CreatePost.js

import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Note o caminho relativo // Para obter o user_id do usuário logado
import '../App.css'; // Estilos globais

function CreatePost({ onPostCreated }) {
  const [body, setBody] = useState('');
  const [message, setMessage] = useState('');
  const { userId, isLoggedIn } = useContext(AuthContext); // Pega o userId e isLoggedIn do contexto

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isLoggedIn) {
      setMessage('Você precisa estar logado para criar um post.');
      return;
    }

    if (!body.trim()) { // .trim() remove espaços em branco antes de verificar
      setMessage('O conteúdo do post não pode estar vazio.');
      return;
    }

    if (body.length > 280) {
      setMessage(`O post tem ${body.length} caracteres. O limite é 280.`);
      return;
    }

    setMessage('Publicando post...');

    try {
      const response = await fetch('http://localhost:5000/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, body: body }), // Envia userId e body
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setBody(''); // Limpa o campo de texto
        if (onPostCreated) {
          onPostCreated(data.post); // Chama a função passada via props para atualizar o feed
        }
      } else {
        setMessage('Erro ao publicar post: ' + data.message);
      }
    } catch (error) {
      setMessage('Erro de conexão ao publicar post.');
      console.error('Erro ao publicar post:', error);
    }
  };

  return (
    <div className="create-post-container">
      {isLoggedIn ? (
        <form onSubmit={handleSubmit}>
          <h3>O que está acontecendo?</h3>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva sua postagem (máx. 280 caracteres)..."
            maxLength="280"
            rows="4"
            required
          />
          <div className="post-actions">
            <span>{body.length}/280</span>
            <button type="submit">Postar</button>
          </div>
          {message && <p className="message">{message}</p>}
        </form>
      ) : (
        <p>Faça login para compartilhar suas ideias no Brasfut-App!</p>
      )}
    </div>
  );
}

export default CreatePost;