# brasfut-app/backend/app.py (CÓDIGO COMPLETO E ATUALIZADO)

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
import datetime

# 1. Configuração do Aplicativo Flask
# ==================================
app = Flask(__name__)
CORS(app)

BASEDIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + \
    os.path.join(BASEDIR, 'brasfut_microblog.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 2. Definição dos Modelos do Banco de Dados
# ==========================================


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    posts = db.relationship('Post', backref='author', lazy='dynamic')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')
    likes = db.relationship('Like', backref='liker', lazy='dynamic')

    followed = db.relationship(
        'Follow',
        foreign_keys='Follow.follower_id',
        backref=db.backref('follower', lazy='joined'),
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    followers = db.relationship(
        'Follow',
        foreign_keys='Follow.followed_id',
        backref=db.backref('followed', lazy='joined'),
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(280), nullable=False)
    timestamp = db.Column(db.DateTime, index=True,
                          default=datetime.datetime.now(datetime.timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    comments = db.relationship(
        'Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    likes = db.relationship('Like', backref='post',
                            lazy='dynamic', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Post {self.body}>'


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, index=True,
                          default=datetime.datetime.now(datetime.timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

    def __repr__(self):
        return f'<Comment {self.body[:20]}...>'


class Like(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), primary_key=True)
    timestamp = db.Column(
        db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    __table_args__ = (db.UniqueConstraint(
        'user_id', 'post_id', name='_user_post_uc'),)


class Follow(db.Model):
    follower_id = db.Column(
        db.Integer, db.ForeignKey('user.id'), primary_key=True)
    followed_id = db.Column(
        db.Integer, db.ForeignKey('user.id'), primary_key=True)
    timestamp = db.Column(
        db.DateTime, default=datetime.datetime.now(datetime.timezone.utc))

    __table_args__ = (
        db.UniqueConstraint('follower_id', 'followed_id',
                            name='_follower_followed_uc'),
    )

# 3. Rotas da API
# =============================================


@app.route('/')
def index():
    return "Olá do Backend Flask do Brasfut-App!"


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Dados incompletos: username, email e password são obrigatórios."}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Nome de usuário já existe."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email já existe."}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Usuário registrado com sucesso!", "user_id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao registrar usuário: {str(e)}"}), 500


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username e password são obrigatórios."}), 400

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        return jsonify({"message": "Username ou senha inválidos."}), 401

    return jsonify({"message": "Login bem-sucedido!", "user_id": user.id, "username": user.username}), 200


@app.route('/posts', methods=['POST'])
def create_post():
    data = request.get_json()
    user_id = data.get('user_id')
    body = data.get('body')

    if not user_id:
        return jsonify({"message": "ID do usuário é obrigatório para criar um post."}), 401
    if not body:
        return jsonify({"message": "O conteúdo do post (body) é obrigatório."}), 400
    if len(body) > 280:
        return jsonify({"message": "O post não pode ter mais de 280 caracteres."}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    new_post = Post(body=body, user_id=user_id)

    try:
        db.session.add(new_post)
        db.session.commit()
        return jsonify({
            "message": "Post criado com sucesso!",
            "post": {
                "id": new_post.id,
                "body": new_post.body,
                "timestamp": new_post.timestamp.isoformat(),
                "user_id": new_post.user_id,
                "username": user.username
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao criar post: {str(e)}"}), 500

# Rota para Listar Todos os Posts (GET /posts)
# NOVO: Recebe 'logged_in_user_id' como parâmetro de query


@app.route('/posts', methods=['GET'])
def get_posts():
    logged_in_user_id = request.args.get(
        'logged_in_user_id', type=int)  # Novo parâmetro

    posts = Post.query.order_by(Post.timestamp.desc()).all()
    posts_list = []
    for post in posts:
        author_username = post.author.username if post.author else 'Unknown'
        comments_count = post.comments.count()
        likes_count = post.likes.count()

        # NOVO: Verificar se o post foi curtido pelo usuário logado
        is_liked = False
        if logged_in_user_id:
            is_liked = db.session.query(Like).filter_by(
                user_id=logged_in_user_id, post_id=post.id
            ).first() is not None

        posts_list.append({
            "id": post.id,
            "body": post.body,
            "timestamp": post.timestamp.isoformat(),
            "user_id": post.user_id,
            "username": author_username,
            "comments_count": comments_count,
            "likes_count": likes_count,
            "is_liked": is_liked  # Novo campo
        })
    return jsonify(posts_list), 200


@app.route('/users/<string:username>', methods=['GET'])
def get_user_profile(username):
    logged_in_user_id = request.args.get(
        'logged_in_user_id', type=int)  # Novo parâmetro

    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404

    user_posts = Post.query.filter_by(
        user_id=user.id).order_by(Post.timestamp.desc()).all()
    posts_list = []
    for post in user_posts:
        comments_count = post.comments.count()
        likes_count = post.likes.count()

        # NOVO: Verificar se o post foi curtido pelo usuário logado no perfil
        is_liked = False
        if logged_in_user_id:
            is_liked = db.session.query(Like).filter_by(
                user_id=logged_in_user_id, post_id=post.id
            ).first() is not None

        posts_list.append({
            "id": post.id,
            "body": post.body,
            "timestamp": post.timestamp.isoformat(),
            "user_id": post.user_id,
            "username": user.username,
            "comments_count": comments_count,
            "likes_count": likes_count,
            "is_liked": is_liked  # Novo campo
        })

    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "followers_count": user.followers.count(),
        "followed_count": user.followed.count()
    }
    return jsonify({"user": user_data, "posts": posts_list}), 200


@app.route('/follow/<int:user_id_to_follow>', methods=['POST'])
def follow_user(user_id_to_follow):
    data = request.get_json()
    follower_id = data.get('follower_id')

    if not follower_id:
        return jsonify({"message": "ID do seguidor é obrigatório."}), 401
    follower = User.query.get(follower_id)
    followed = User.query.get(user_id_to_follow)

    if not follower or not followed:
        return jsonify({"message": "Usuário seguidor ou seguido não encontrado."}), 404
    if follower.id == followed.id:
        return jsonify({"message": "Você não pode seguir a si mesmo."}), 400
    if Follow.query.filter_by(follower_id=follower.id, followed_id=followed.id).first():
        return jsonify({"message": f"Você já está seguindo @{followed.username}."}), 409

    new_follow = Follow(follower_id=follower.id, followed_id=followed.id)
    try:
        db.session.add(new_follow)
        db.session.commit()
        return jsonify({"message": f"Agora você está seguindo @{followed.username}."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao seguir usuário: {str(e)}"}), 500


@app.route('/unfollow/<int:user_id_to_unfollow>', methods=['POST'])
def unfollow_user(user_id_to_unfollow):
    data = request.get_json()
    follower_id = data.get('follower_id')

    if not follower_id:
        return jsonify({"message": "ID do seguidor é obrigatório."}), 401
    follower = User.query.get(follower_id)
    followed = User.query.get(user_id_to_unfollow)

    if not follower or not followed:
        return jsonify({"message": "Usuário seguidor ou seguido não encontrado."}), 404
    if follower.id == followed.id:
        return jsonify({"message": "Você não pode deixar de seguir a si mesmo."}), 400

    existing_follow = Follow.query.filter_by(
        user_id=follower_id, post_id=post_id).first()
    if not existing_follow:
        return jsonify({"message": f"Você não curtiu este post."}), 409

    try:
        db.session.delete(existing_follow)
        db.session.commit()
        return jsonify({"message": "Post descurtido com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao descurtir post: {str(e)}"}), 500


@app.route('/is_following/<int:follower_id>/<int:followed_id>', methods=['GET'])
def is_following(follower_id, followed_id):
    if follower_id == followed_id:
        return jsonify({"is_following": False, "message": "Você não pode seguir a si mesmo."}), 200
    follow_relation = Follow.query.filter_by(
        follower_id=follower_id, followed_id=followed_id).first()
    return jsonify({"is_following": True}) if follow_relation else jsonify({"is_following": False})


@app.route('/posts/followed/<int:user_id>', methods=['GET'])
def get_followed_posts(user_id):
    logged_in_user_id = request.args.get(
        'logged_in_user_id', type=int)  # Novo parâmetro

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Usuário não encontrado."}), 404
    followed_ids = [followed.followed_id for followed in user.followed]
    if not followed_ids:
        return jsonify([]), 200

    posts = Post.query.filter(Post.user_id.in_(
        followed_ids)).order_by(Post.timestamp.desc()).all()
    posts_list = []
    for post in posts:
        author_username = post.author.username if post.author else 'Unknown'
        comments_count = post.comments.count()
        likes_count = post.likes.count()

        # NOVO: Verificar se o post foi curtido pelo usuário logado nos posts seguidos
        is_liked = False
        if logged_in_user_id:
            is_liked = db.session.query(Like).filter_by(
                user_id=logged_in_user_id, post_id=post.id
            ).first() is not None

        posts_list.append({
            "id": post.id,
            "body": post.body,
            "timestamp": post.timestamp.isoformat(),
            "user_id": post.user_id,
            "username": author_username,
            "comments_count": comments_count,
            "likes_count": likes_count,
            "is_liked": is_liked  # Novo campo
        })
    return jsonify(posts_list), 200


@app.route('/posts/<int:post_id>/comments', methods=['POST'])
def add_comment(post_id):
    data = request.get_json()
    user_id = data.get('user_id')
    body = data.get('body')

    if not user_id or not body:
        return jsonify({"message": "Usuário e conteúdo do comentário são obrigatórios."}), 400

    user = User.query.get(user_id)
    post = Post.query.get(post_id)

    if not user or not post:
        return jsonify({"message": "Usuário ou post não encontrado."}), 404
    if len(body) > 500:
        return jsonify({"message": "Comentário não pode ter mais de 500 caracteres."}), 400

    new_comment = Comment(body=body, user_id=user_id, post_id=post_id)
    try:
        db.session.add(new_comment)
        db.session.commit()
        return jsonify({
            "message": "Comentário adicionado com sucesso!",
            "comment": {
                "id": new_comment.id,
                "body": new_comment.body,
                "timestamp": new_comment.timestamp.isoformat(),
                "user_id": new_comment.user_id,
                "username": user.username
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao adicionar comentário: {str(e)}"}), 500


@app.route('/posts/<int:post_id>/comments', methods=['GET'])
def get_comments(post_id):
    post = Post.query.get(post_id)
    if not post:
        return jsonify({"message": "Post não encontrado."}), 404

    comments = Comment.query.filter_by(
        post_id=post_id).order_by(Comment.timestamp.asc()).all()
    comments_list = []
    for comment in comments:
        author_username = comment.author.username if comment.author else 'Unknown'
        comments_list.append({
            "id": comment.id,
            "body": comment.body,
            "timestamp": comment.timestamp.isoformat(),
            "user_id": comment.user_id,
            "username": author_username
        })
    return jsonify(comments_list), 200


@app.route('/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"message": "ID do usuário é obrigatório."}), 401
    user = User.query.get(user_id)
    post = Post.query.get(post_id)

    if not user or not post:
        return jsonify({"message": "Usuário ou post não encontrado."}), 404
    if Like.query.filter_by(user_id=user_id, post_id=post_id).first():
        return jsonify({"message": "Você já curtiu este post."}), 409

    new_like = Like(user_id=user_id, post_id=post_id)
    try:
        db.session.add(new_like)
        db.session.commit()
        return jsonify({"message": "Post curtido com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao curtir post: {str(e)}"}), 500


@app.route('/posts/<int:post_id>/unlike', methods=['POST'])
def unlike_post(post_id):
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({"message": "ID do usuário é obrigatório."}), 401
    user = User.query.get(user_id)
    post = Post.query.get(post_id)

    if not user or not post:
        return jsonify({"message": "Usuário ou post não encontrado."}), 404

    existing_like = Like.query.filter_by(
        user_id=user_id, post_id=post_id).first()
    if not existing_like:
        return jsonify({"message": "Você não curtiu este post."}), 409

    try:
        db.session.delete(existing_like)
        db.session.commit()
        return jsonify({"message": "Post descurtido com sucesso!"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erro ao descurtir post: {str(e)}"}), 500


# 4. Bloco de Execução Principal
# ===============================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Cria as novas tabelas (Comment, Like) se não existirem
    app.run(debug=True)
