# brasfut-app/backend/app.py

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS  # Importar Flask-CORS
# Importar ferramentas de segurança
from werkzeug.security import generate_password_hash, check_password_hash
import os
import datetime  # Para timestamps mais detalhados

# 1. Configuração do Aplicativo Flask
# ==================================
app = Flask(__name__)
# Habilitar CORS para todas as rotas e origens. Em produção, você pode restringir isso.
CORS(app)

# Configuração do banco de dados SQLite
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

    # Métodos para gerenciar senhas
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    body = db.Column(db.String(280), nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.datetime.now(
        datetime.timezone.utc))  # Usar datetime para fuso horário
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f'<Post {self.body}>'


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

# Rota de teste inicial


@app.route('/')
def index():
    return "Olá do Backend Flask do Brasfut-App!"

# Rota de Registro de Usuário


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()  # Pega os dados JSON enviados na requisição

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Validação básica dos dados
    if not username or not email or not password:
        return jsonify({"message": "Dados incompletos: username, email e password são obrigatórios."}), 400

    # Verificar se o username ou email já existem
    if User.query.filter_by(username=username).first():
        # Conflict
        return jsonify({"message": "Nome de usuário já existe."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email já existe."}), 409  # Conflict

    # Criar novo usuário
    new_user = User(username=username, email=email)
    new_user.set_password(password)  # Hash da senha antes de salvar

    try:
        db.session.add(new_user)
        db.session.commit()
        # Created
        return jsonify({"message": "Usuário registrado com sucesso!", "user_id": new_user.id}), 201
    except Exception as e:
        db.session.rollback()  # Em caso de erro, desfaz as alterações no banco
        # Internal Server Error
        return jsonify({"message": f"Erro ao registrar usuário: {str(e)}"}), 500

# Rota de Login de Usuário
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Username e password são obrigatórios."}), 400

    # Tenta encontrar o usuário pelo username
    user = User.query.filter_by(username=username).first()

    # Verifica se o usuário existe e se a senha está correta
    if user is None or not user.check_password(password):
        return jsonify({"message": "Username ou senha inválidos."}), 401 # Unauthorized

    # Se chegou aqui, o login foi bem-sucedido
    return jsonify({"message": "Login bem-sucedido!", "user_id": user.id, "username": user.username}), 200 # OK

# 4. Bloco de Execução Principal
# ===============================
if __name__ == '__main__':
    with app.app_context():
        # Cria todas as tabelas no banco de dados, se elas não existirem
        db.create_all()
    app.run(debug=True)
