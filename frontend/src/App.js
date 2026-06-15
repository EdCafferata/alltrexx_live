import React from 'react';
import TrackerKaart from './components/TrackerKaart';
import AccountMenu from './components/AccountMenu';
import BronnenTicker from './components/BronnenTicker';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <AccountMenu />
      <main>
        <TrackerKaart />
      </main>
      <BronnenTicker />
    </div>
  );
}
