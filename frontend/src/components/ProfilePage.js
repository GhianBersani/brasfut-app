// brasfut-app/frontend/src/components/ProfilePage.js (Atualizado para atualização de likes precisa e sutil)

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CommentModal from './CommentModal';
import '../App.css';

function ProfilePage() {
  const { username: urlUsername } = useParams();
  const { userId: loggedInUserId, username: loggedInUsername, isLoggedIn } = useContext(AuthContext);

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const fetchUserProfileAndStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParam = isLoggedIn && loggedInUserId ? `?logged_in_user_id=${loggedInUserId}` : '';

      const profileResponse = await fetch(`http://localhost:5000/users/${urlUsername}${queryParam}`);
      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          throw new Error('Usuário não encontrado.');
        }
        throw new Error('Falha ao carregar perfil.');
      }
      const profileData = await profileResponse.json();
      setProfileUser(profileData.user);
      setUserPosts(profileData.posts);

      if (isLoggedIn && profileData.user.id !== loggedInUserId) {
        const followStatusResponse = await fetch(
          `http://localhost:5000/is_following/${loggedInUserId}/${profileData.user.id}`
        );
        if (!followStatusResponse.ok) {
          throw new Error('Falha ao verificar status de seguir.');
        }
        const followStatusData = await followStatusResponse.json();
        setIsFollowing(followStatusData.is_following);
      } else {
        setIsFollowing(false);
      }

    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar perfil ou status de seguir:', err);
    } finally {
      setLoading(false);
    }
  }, [urlUsername, isLoggedIn, loggedInUserId]);

  useEffect(() => {
    fetchUserProfileAndStatus();
  }, [fetchUserProfileAndStatus]);

  const handleFollowToggle = useCallback(async () => {
    if (!isLoggedIn) {
      setError('Você precisa estar logado para seguir ou deixar de seguir.');
      return;
    }

    if (!profileUser) return;

    const willFollow = !isFollowing;
    const actionUrl = willFollow
      ? `http://localhost:5000/follow/${profileUser.id}`
      : `http://localhost:5000/unfollow/${profileUser.id}`;

    try {
      const response = await fetch(actionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ follower_id: loggedInUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na ação de seguir/deixar de seguir.');
      }

      setIsFollowing(willFollow);
      setProfileUser(prevProfileUser => ({
        ...prevProfileUser,
        followers_count: willFollow ? prevProfileUser.followers_count + 1 : prevProfileUser.followers_count - 1
      }));
    } catch (err) {
      setError(err.message);
      console.error('Erro ao seguir/deixar de seguir:', err);
    }
  }, [isLoggedIn, isFollowing, loggedInUserId, profileUser]);


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
        body: JSON.stringify({ user_id: loggedInUserId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao curtir/descurtir.');
      }

      // NOVO: Buscar o post atualizado individualmente para uma atualização sutil
      const updatedPostResponse = await fetch(`http://localhost:5000/posts/${postId}?logged_in_user_id=${loggedInUserId}`);
      if (!updatedPostResponse.ok) {
          console.warn(`Aviso: Falha ao carregar postagem individual atualizada para o post ${postId}.`);
          return; // Não atualiza se não conseguir buscar o post atualizado
      }
      const updatedPost = await updatedPostResponse.json();

      setUserPosts(prevPosts => prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post // Substitui o post antigo pelo atualizado
      ));

    }
      catch (err) {
      console.error('Erro ao curtir/descurtir:', err);
      alert(err.message);
    }
  }, [isLoggedIn, loggedInUserId]);


  const handleCommentClick = useCallback((postId) => {
    setSelectedPostId(postId);
    setShowCommentModal(true);
  }, []);

  const handleCloseCommentModal = useCallback(() => {
    setShowCommentModal(false);
    setSelectedPostId(null);
    fetchUserProfileAndStatus();
  }, [fetchUserProfileAndStatus]);

  const handleCommentAdded = useCallback(() => {
    fetchUserProfileAndStatus();
  }, [fetchUserProfileAndStatus]);

  const handleEditPost = useCallback((postId) => {
    alert(`Editar post ${postId}. Funcionalidade em desenvolvimento!`);
  }, []);

  const handleDeletePost = useCallback(async (postId) => {
    if (!isLoggedIn || !loggedInUserId) {
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
        body: JSON.stringify({ user_id: loggedInUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao excluir post.');
      }
      alert('Post excluído com sucesso!');
      fetchUserProfileAndStatus();
    } catch (err) {
      console.error('Erro ao excluir post:', err);
      alert(err.message);
    }
  }, [isLoggedIn, loggedInUserId, fetchUserProfileAndStatus]);


  if (loading) {
    return <p className="loading-message">Carregando perfil...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  if (!profileUser) {
    return <p className="error-message">Perfil não disponível.</p>;
  }

  const isOwnProfile = isLoggedIn && profileUser.id === loggedInUserId;

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h2>@{profileUser.username}</h2>
        {isOwnProfile && <p className="profile-email">Email: {profileUser.email}</p>}
        <div className="profile-stats">
          <span><strong>{profileUser.followers_count}</strong> Seguidores</span>
          <span><strong>{profileUser.followed_count}</strong> Seguindo</span>
        </div>
        {!isOwnProfile && isLoggedIn && (
            <button onClick={handleFollowToggle} className="follow-button">
                {isFollowing ? 'Deixar de Seguir' : 'Seguir'}
            </button>
        )}
      </div>

      <h3>Postagens de @{profileUser.username}</h3>
      <div className="posts-list">
        {userPosts.length === 0 ? (
          <p>Nenhuma postagem ainda.</p>
        ) : (
          userPosts.map((post) => (
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
                  {isLoggedIn && loggedInUserId === post.user_id && (
                    <>
                      <button onClick={() => handleEditPost(post.id)} className="action-button edit-button">✏️</button>
                      <button onClick={() => handleDeletePost(post.id)} className="action-button delete-button">🗑️</button>
                    </>
                  )}
                  <button className="action-button share-button">↪️</button>
                </div>
            </div>
          ))
        )}
      </div>

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

export default ProfilePage;