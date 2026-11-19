import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Analyze from './pages/Analyze';
import About from './pages/About';
import { checkBackendHealth } from './services/api';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    // Check backend health on mount and every 30 seconds
    const fetchHealth = async () => {
      const status = await checkBackendHealth();
      setBackendStatus(status);
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF3EA] text-[#493323]">
      {/* Top Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        backendStatus={backendStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activePage === 'home' && (
          <Home onStartAnalyzing={() => setActivePage('analyze')} />
        )}
        {activePage === 'analyze' && <Analyze />}
        {activePage === 'about' && <About backendStatus={backendStatus} />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
