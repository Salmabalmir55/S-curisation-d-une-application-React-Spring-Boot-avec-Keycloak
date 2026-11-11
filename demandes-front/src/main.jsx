import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import keycloak from './keycloak.js';
import './style.css';

keycloak.init({ onLoad: 'login-required', pkceMethod: 'S256', checkLoginIframe: false })
  .then(() => ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode><App /></React.StrictMode>,
  ))
  .catch((error) => {
    console.error('Erreur de connexion à Keycloak', error);
    document.getElementById('root').innerHTML = '<main class="error"><h1>Connexion impossible</h1><p>Vérifiez que Keycloak est démarré sur le port 8082, puis rechargez cette page.</p></main>';
  });
