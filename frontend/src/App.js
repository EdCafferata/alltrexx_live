import React from 'react';
import TrackerKaart from './components/TrackerKaart';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">⚓ Alltrexx</span>
        <nav>
          <a href="/">Kaart</a>
          <a href="/routes">Routes</a>
          <a href="/trackers">Trackers</a>
        </nav>
      </header>
      <main>
        <TrackerKaart />
      </main>
    </div>
  );
}
