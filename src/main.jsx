import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { MissionProvider } from './hooks/useMission.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MissionProvider>
      <App />
    </MissionProvider>
  </React.StrictMode>,
);
