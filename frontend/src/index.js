// brasfut-app/frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeContext } from './App'; // Importar ThemeContext do App.js

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      {/* App já está envolvido pelo ThemeContext.Provider internamente */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);
