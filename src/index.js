import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

// delayed for loading animation
setTimeout(() => {
  root.render(<App />);
}, 1500);
