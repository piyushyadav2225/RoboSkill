import React, { createContext, useContext, useState } from 'react';

export type ActiveInterface = 'library' | 'arena' | 'testing';

interface AppContextType {
  activeTab: ActiveInterface;
  setActiveTab: (tab: ActiveInterface) => void;
  selectedSkillId: string;
  setSelectedSkillId: (id: string) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (logged: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  userEmail: string;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveInterface>('library');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('roboskill.obstacle-avoidance');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [userEmail] = useState<string>('artisan@roboskill.internal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedSkillId,
        setSelectedSkillId,
        isLoggedIn,
        setIsLoggedIn,
        isLoginModalOpen,
        setIsLoginModalOpen,
        userEmail,
        toastMessage,
        showToast,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};


