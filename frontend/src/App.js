import React from 'react';
import TrackerKaart from './components/TrackerKaart';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <span className="logo-badge">⚓ Alltrexx</span>
      <main>
        <TrackerKaart />
      </main>
    </div>
  );
}
