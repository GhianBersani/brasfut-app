// brasfut-app/frontend/src/HomePage.js (Atualizado para atualização de likes precisa e sutil)

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
  const [likeLoadingMap, setLikeLoadingMap] = useState({});

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    let allPostsData = [];
    let followedPostsData = [];

    try {
      const queryParam = isLoggedIn && userId ? `?logged_in_user_id=${userId}` : '';

      try {
        const allPostsResponse = await fetch(`http://localhost:5000/posts${queryParam}`);
        if (!allPostsResponse.ok) {
          console.warn(`Aviso: Falha ao carregar postagens gerais (URL: ${allPostsResponse.url}, Status: ${allPostsResponse.status}).`);
          allPostsData = [];
        } else {
          allPostsData = await allPostsResponse.json();
        }
      } catch (generalErr) {
        console.error('Erro ao buscar posts gerais:', generalErr);
        allPostsData = [];
      }

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
      allPostsData.forEach(post => combinedPostsMap.set(post.id, post));
      followedPostsData.forEach(post => combinedPostsMap.set(post.id, post));

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
    setLikeLoadingMap(prev => ({ ...prev, [postId]: true }));
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
      const updatedPostResponse = await fetch(`http://localhost:5000/posts/${postId}?logged_in_user_id=${userId}`);
      if (!updatedPostResponse.ok) {
        console.warn(`Aviso: Falha ao carregar postagem individual atualizada para o post ${postId}.`);
        return;
      }
      const updatedPost = await updatedPostResponse.json();
      setPosts(prevPosts => prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      ));
    } catch (err) {
      console.error('Erro ao curtir/descurtir:', err);
      alert(err.message);
    } finally {
      setLikeLoadingMap(prev => ({ ...prev, [postId]: false }));
    }
  }, [isLoggedIn, userId]);

  const handleCommentClick = useCallback((postId) => {
    setSelectedPostId(postId);
    setShowCommentModal(true);
  }, []);

  const handleCloseCommentModal = useCallback(() => {
    setShowCommentModal(false);
    setSelectedPostId(null);
    fetchPosts(); // Mantido o re-fetch aqui para atualizar a contagem de comentários após fechar o modal
  }, [fetchPosts]);

  const handleCommentAdded = useCallback(() => {
    fetchPosts(); // Mantido o re-fetch aqui para atualizar a contagem de comentários
  }, [fetchPosts]);

  const handleEditPost = useCallback((postId) => {
    alert(`Editar post ${postId}. Funcionalidade em desenvolvimento!`);
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    if (!isLoggedIn || !userId) {
      alert('Você precisa estar logado para excluir posts!');
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este post? Esta ação é irreversível.')) {
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
      {!loading && !error && (
        <div className="posts-list">
          {posts.map(post => (
            <div className="post-card" key={post.id}>
              <div className="post-header">
                <Link to={`/users/${post.username}`} className="post-username-link">
                  @{post.username}
                </Link>
                <span className="post-timestamp">
                  {new Date(post.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="post-body">{post.body}</div>
              <div className="post-actions_bar">
                <button
                  onClick={() => handleLikeToggle(post.id, post.is_liked)}
                  className={`action-button like-button${post.is_liked ? ' liked' : ''}`}
                  aria-label={post.is_liked ? "Descurtir" : "Curtir"}
                  disabled={likeLoadingMap[post.id]}
                >
                  {likeLoadingMap[post.id] ? (
                    <span className="like-spinner" />
                  ) : (
                    <>
                      <span role="img" aria-label="Curtir">❤️</span>
                      <span>{post.likes_count}</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCommentClick(post.id)}
                  className="action-button comment-button"
                  aria-label="Comentar"
                >
                  <span className="material-icons">chat_bubble_outline</span>
                  <span className="action-count">{post.comments_count}</span>
                </button>
                <button
                  onClick={() => handleRepost(post.id, post.is_reposted)}
                  className="action-button repost-button"
                  aria-label={post.is_reposted ? "Cancelar Repostagem" : "Repostar"}
                  disabled={likeLoadingMap[post.id]}
                >
                  <span className="material-icons">repeat</span>
                  <span className="action-count">{post.reposts_count}</span>
                </button>
                <button
                  onClick={() => handleLikeToggle(post.id, post.is_liked)}
                  className={`action-button like-button${post.is_liked ? ' liked' : ''}`}
                  aria-label={post.is_liked ? "Descurtir" : "Curtir"}
                  disabled={likeLoadingMap[post.id]}
                >
                  <span className="material-icons">favorite_border</span>
                  <span className="action-count">{post.likes_count}</span>
                </button>
                <button className="action-button views-button" aria-label="Ver">
                  <span className="material-icons">bar_chart</span>
                  <span className="action-count">{post.views_count}</span>
                </button>
                <button className="action-button save-button" aria-label="Salvar">
                  <span className="material-icons">bookmark_border</span>
                </button>
                <button className="action-button share-button" aria-label="Compartilhar">
                  <span className="material-icons">ios_share</span>
                </button>
              </div>
            </div>
          ))}
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