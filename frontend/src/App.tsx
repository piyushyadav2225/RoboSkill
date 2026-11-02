import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { TheLibraryPage } from './pages/TheLibraryPage';
import { DeveloperArenaPage } from './pages/DeveloperArenaPage';
import { TestingLabPage } from './pages/TestingLabPage';

const MainContent: React.FC = () => {
  const { activeTab, toastMessage } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#14110E] text-[#E8DFC9]">
      <Navbar />

      <main className="flex-1">
        {activeTab === 'library' && <TheLibraryPage />}
        {activeTab === 'arena' && <DeveloperArenaPage />}
        {activeTab === 'testing' && <TestingLabPage />}
      </main>

      <Footer />

      {/* Minimal Login Modal */}
      <LoginModal />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#1F1914] border border-[#C19A55] text-xs font-mono text-[#FFF0D0] shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
