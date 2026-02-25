
import React, { useState } from 'react';
import Header from './Header';
import Introduction from './Introduction';
import DataInput from './DataInput';
import { UnifiedRiskDashboard } from './UnifiedRiskDashboard';
import Analytics from './Analytics';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ username, onLogout }) => {
  const [activeTab, setActiveTab] = useState('intro');
  const [hasScanned, setHasScanned] = useState(false);

  const handleScanComplete = () => {
    setHasScanned(true);
    setActiveTab('results');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 selection:bg-indigo-500/30">
      <Header username={username} onLogout={onLogout} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <nav className="flex space-x-1 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl mb-10 w-fit border border-slate-800 shadow-xl overflow-x-auto">
          {[
            { id: 'intro', label: 'Overview', locked: false },
            { id: 'data', label: 'Data Ingestion', locked: false },
            { id: 'results', label: 'Risk Assessment', locked: !hasScanned },
            { id: 'analytics', label: 'Analytics', locked: !hasScanned }
          ].map((tab) => (
            <button
              key={tab.id}
              disabled={tab.locked}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                  : tab.locked 
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {tab.label}
              {tab.locked && (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </nav>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'intro' && <Introduction />}
          {activeTab === 'data' && <DataInput onScanComplete={handleScanComplete} />}
          {activeTab === 'results' && hasScanned && <UnifiedRiskDashboard />}
          {activeTab === 'analytics' && hasScanned && <Analytics />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

