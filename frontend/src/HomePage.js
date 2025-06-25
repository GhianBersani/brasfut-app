// brasfut-app/frontend/src/HomePage.js (Atualizado com tratamento de erros de fetch reforçado)

import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import CreatePost from './components/CreatePost';
import CommentModal from './components/CommentModal';
import './App.css';

function HomePage() {
  const { isLoggedIn, userId, username } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [followedPostsCount, setFollowedPostsCount] = useState(0);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    let allPostsData = []; // Inicializar para garantir que esteja sempre definido
    let followedPostsData = []; // Inicializar para garantir que esteja sempre definido

    try {
      const queryParam = isLoggedIn && userId ? `?logged_in_user_id=${userId}` : '';

      // Tenta buscar posts gerais
      try {
        const allPostsResponse = await fetch(`http://localhost:5000/posts${queryParam}`);
        if (!allPostsResponse.ok) {
          // Não lançar erro aqui, apenas logar e continuar com array vazio
          console.warn(`Aviso: Falha ao carregar postagens gerais (URL: ${allPostsResponse.url}, Status: ${allPostsResponse.status}).`);
          allPostsData = [];
        } else {
          allPostsData = await allPostsResponse.json();
        }
      } catch (generalErr) {
        console.error('Erro ao buscar posts gerais:', generalErr);
        allPostsData = [];
      }

      // Se logado, buscar posts de usuários seguidos
      if (isLoggedIn && userId) {
        try {
          const followedPostsResponse = await fetch(`http://localhost:5000/posts/followed/${userId}${queryParam}`);
          if (!followedPostsResponse.ok) {
            console.warn(`Aviso: Falha ao carregar posts seguidos (URL: ${followedPostsResponse.url}, Status: ${followedPostsResponse.status}).`);
            followedPostsData = [];
          } else {
            followedPostsData = await followedPostsResponse.json();
          }
        } catch (followedErr) {
          console.error('Erro ao buscar posts seguidos:', followedErr);
          followedPostsData = [];
        }
      }

      setFollowedPostsCount(followedPostsData.length);

      const combinedPostsMap = new Map();
      followedPostsData.forEach(post => combinedPostsMap.set(post.id, post));
      allPostsData.forEach(post => combinedPostsMap.set(post.id, post));

      let finalPosts = Array.from(combinedPostsMap.values());
      finalPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (searchTerm) {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        finalPosts = finalPosts.filter(post => 
          post.body.toLowerCase().includes(lowerCaseSearchTerm) ||
          post.username.toLowerCase().includes(lowerCaseSearchTerm)
        );
      }

      setPosts(finalPosts);
      
    } catch (err) {
      // Este catch pegará erros muito mais gerais (ex: de parsing JSON se a requisição ok retornar HTML)
      setError('Não foi possível carregar as postagens. Tente novamente mais tarde.');
      console.error('Erro geral ao processar posts:', err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, userId, searchTerm]);


  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostCreated = useCallback((newPost) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  }, []);

  const handleLikeToggle = useCallback(async (postId, isCurrentlyLiked) => {
    if (!isLoggedIn) {
      alert('Você precisa estar logado para curtir ou descurtir um post!');
      return;
    }
    const url = `http://localhost:5000/posts/${postId}/${isCurrentlyLiked ? 'unlike' : 'like'}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao curtir/descurtir.');
      }
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId ? { 
          ...post, 
          likes_count: isCurrentlyLiked ? post.likes_count - 1 : post.likes_count + 1,
          is_liked: !isCurrentlyLiked 
        } : post
      ));
    } catch (err) {
      console.error('Erro ao curtir/descurtir:', err);
      alert(err.message);
    }
  }, [isLoggedIn, userId]);

  const handleCommentClick = useCallback((postId) => {
    setSelectedPostId(postId);
    setShowCommentModal(true);
  }, []);

  const handleCloseCommentModal = useCallback(() => {
    setShowCommentModal(false);
    setSelectedPostId(null);
    fetchPosts();
  }, [fetchPosts]);

  const handleCommentAdded = useCallback(() => { /* Funcionalidade futura */ }, []);

  const handleEditPost = useCallback((postId) => {
    alert(`Editar post ${postId}. Funcionalidade em desenvolvimento!`);
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    if (!isLoggedIn || !userId) {
      alert('Você precisa estar logado para excluir posts!');
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este post?')) {
        return;
    }

    try {
      const response = await fetch(`http://localhost:5000/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao excluir post.');
      }
      alert('Post excluído com sucesso!');
      fetchPosts();
    } catch (err) {
      console.error('Erro ao excluir post:', err);
      alert(err.message);
    }
  }, [isLoggedIn, userId, fetchPosts]);


  return (
    <div>
      <h2>Página Inicial</h2>
      {isLoggedIn ? (
        <p>Olá, {username}! Explore e compartilhe suas ideias no Brasfut-App.</p>
      ) : (
        <p>Faça login ou registre-se para começar a explorar o Brasfut-App!</p>
      )}

      {isLoggedIn && <CreatePost onPostCreated={handlePostCreated} />}

      {/* Barra de Busca */}
      <div className="search-bar-container">
        <input
          type="text"
          placeholder="Buscar posts ou usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <h3>Seu Feed</h3>
      {isLoggedIn && followedPostsCount === 0 && posts.length > 0 && (
        <p className="feed-guidance-message">
          Sua Timeline ainda está vazia! Você está vendo sugestões. Comece a seguir outras pessoas para ver os posts delas aqui.
        </p>
      )}
       {isLoggedIn && followedPostsCount > 0 && (
        <p className="feed-guidance-message">
          Seu feed combina posts de quem você segue e sugestões de conteúdo popular.
        </p>
      )}
      {!isLoggedIn && posts.length === 0 && !loading && !error && (
        <p className="feed-guidance-message">
          Nenhuma postagem ainda. Seja o primeiro a postar ou explore outros perfis!
        </p>
      )}
      {!isLoggedIn && posts.length > 0 && (
        <p className="feed-guidance-message">
          Explore as últimas postagens de todos os usuários. Faça login para personalizar seu feed!
        </p>
      )}


      {loading && <p>Carregando postagens...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && posts.length > 0 && ( /* Adicionado posts.length > 0 para não mostrar lista vazia se não há posts */
        <div className="posts-list">
          {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <Link to={`/users/${post.username}`} className="post-username-link">
                    @{post.username}
                  </Link>
                  <span className="post-timestamp">
                    {new Date(post.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="post-body">{post.body}</p>
                <div className="post-actions-bar">
                  <button 
                    onClick={() => handleLikeToggle(post.id, post.is_liked)} 
                    className={`action-button like-button ${post.is_liked ? 'liked' : ''}`}
                  >
                    ❤️ {post.likes_count}
                  </button>
                  <button onClick={() => handleCommentClick(post.id)} className="action-button comment-button">
                    💬 {post.comments_count}
                  </button>
                  {isLoggedIn && userId === post.user_id && (
                    <>
                      <button onClick={() => handleEditPost(post.id)} className="action-button edit-button">✏️</button>
                      <button onClick={() => handleDeletePost(post.id)} className="action-button delete-button">🗑️</button>
                    </>
                  )}
                  <button className="action-button share-button">↪️</button>
                </div>
              </div>
            ))
          }
        </div>
      )}
      {/* Mensagem se não houver posts após carregar e não houver erro */}
      {!loading && !error && posts.length === 0 && (
          <p className="feed-guidance-message">
            {searchTerm ? `Nenhum resultado encontrado para "${searchTerm}".` : 'Nenhuma postagem ainda. Seja o primeiro a postar ou explore outros perfis!'}
          </p>
      )}

      {showCommentModal && selectedPostId && (
        <CommentModal 
          postId={selectedPostId} 
          onClose={handleCloseCommentModal} 
          onCommentAdded={handleCommentAdded} 
        />
      )}
    </div>
  );
}

export default HomePage;
