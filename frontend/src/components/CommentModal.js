// brasfut-app/frontend/src/components/CommentModal.js

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../App.css'; // Estilos globais

function CommentModal({ postId, onClose, onCommentAdded }) {
  const { isLoggedIn, userId, username } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newCommentBody, setNewCommentBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addCommentError, setAddCommentError] = useState(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}/comments`);
      if (!response.ok) {
        throw new Error('Falha ao carregar comentários.');
      }
      const data = await response.json();
      setComments(data);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar comentários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]); // Re-busca comentários se o postId mudar

  const handleAddComment = async (event) => {
    event.preventDefault();
    setAddCommentError(null);

    if (!isLoggedIn) {
      setAddCommentError('Você precisa estar logado para comentar.');
      return;
    }
    if (!newCommentBody.trim()) {
      setAddCommentError('O comentário não pode estar vazio.');
      return;
    }
    if (newCommentBody.length > 500) {
      setAddCommentError('Comentário muito longo (máx. 500 caracteres).');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, body: newCommentBody }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao adicionar comentário.');
      }
      const data = await response.json();
      setNewCommentBody(''); // Limpa o input
      fetchComments(); // Re-busca os comentários para incluir o novo
      if (onCommentAdded) {
        onCommentAdded(data.comment); // Notifica o componente pai (HomePage/ProfilePage)
      }
    } catch (err) {
      setAddCommentError(err.message);
      console.error('Erro ao adicionar comentário:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Impede que o clique no modal feche-o */}
        <button className="modal-close-button" onClick={onClose}>X</button>
        <h3>Comentários</h3>

        {loading && <p>Carregando comentários...</p>}
        {error && <p className="error-message">{error}</p>}
        
        {!loading && !error && (
          <div className="comments-list">
            {comments.length === 0 ? (
              <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <span className="comment-username">@{comment.username}</span>
                  <span className="comment-body">{comment.body}</span>
                  <span className="comment-timestamp">{new Date(comment.timestamp).toLocaleString('pt-BR')}</span>
                </div>
              ))
            )}
          </div>
        )}

        {isLoggedIn && (
          <form onSubmit={handleAddComment} className="add-comment-form">
            <textarea
              value={newCommentBody}
              onChange={(e) => setNewCommentBody(e.target.value)}
              placeholder="Adicione um comentário..."
              maxLength="500"
              rows="2"
              required
            />
            <button type="submit" className="comment-submit-button">Comentar</button>
            {addCommentError && <p className="error-message">{addCommentError}</p>}
          </form>
        )}
        {!isLoggedIn && <p className="message">Faça login para comentar.</p>}
      </div>
    </div>
  );
}

export default CommentModal;
