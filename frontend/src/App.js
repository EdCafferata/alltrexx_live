import React from 'react';
import TrackerKaart from './components/TrackerKaart';
import AccountMenu from './components/AccountMenu';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <AccountMenu />
      <main>
        <TrackerKaart />
      </main>
    </div>
  );
}
