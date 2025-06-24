// brasfut-app/frontend/src/index.js (Atualizado)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Importar AuthProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>
      <App />
    </AuthProvider>
);