// brasfut-app/frontend/src/App.js (Atualizado com componente Navbar)

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Remover Link e useNavigate
import './App.css';

// Importar os componentes
import Register from './components/Register';
import Login from './components/Login';
import Navbar from './components/Navbar'; // Importar o novo componente Navbar
import HomePage from './HomePage'; // Manter HomePage, mas podemos movê-lo também se quisermos.

// Componente da Página Inicial
// OBS: HomePage agora precisa ser um arquivo separado ou ter seu próprio useContext(AuthContext)
// Para simplificar, vamos movê-la para um novo arquivo 'HomePage.js' dentro de 'src'

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar /> {/* Renderiza o componente Navbar aqui */}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

// Para evitar conflito, mova HomePage para um arquivo separado 'src/HomePage.js'
// ou defina-o dentro de App.js, mas sem usar useContext em App.js
// Já que HomePage usa useContext, o ideal é que ela seja um componente separado.

export default App;