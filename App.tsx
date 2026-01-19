
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { AuthState } from './types';
import { DataProvider } from './DataContext';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    username: null
  });

  const handleLogin = (username: string) => {
    setAuth({ isAuthenticated: true, username });
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, username: null });
  };

  if (!auth.isAuthenticated) {
    return (
      <DataProvider>
        <Login onLogin={handleLogin} />
      </DataProvider>
    );
  }

  return (
    <DataProvider>
      <Dashboard username={auth.username!} onLogout={handleLogout} />
    </DataProvider>
  );
};

export default App;
