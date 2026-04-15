import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Bootstrap da SPA ARCANE / Nexus Design System v3.
// O HeroBackground com globo WebGL (Three.js + GSAP) é carregado de forma
// lazy dentro do App.js via injeção de <script> CDN — não precisa de nada
// no index.html público nem no package.json.
//
// Se quiser ativar o modo estrito do React pra ajudar a detectar side-effects
// em desenvolvimento, descomente o wrapper <React.StrictMode> abaixo.
// Atenção: StrictMode monta componentes 2x em dev, então o cleanup do
// HeroBackground é o que garante que não vaze contexto WebGL entre os mounts.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
