import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HomeScreen } from './components/HomeScreen';
import { CollaborativeScreen } from './components/CollaborativeScreen';
import { OptimizationScreen } from './components/OptimizationScreen';
import { StoreScreen } from './components/StoreScreen';
import { GamificationScreen } from './components/GamificationScreen';
import { SettingsScreen } from './components/SettingsScreen';

export type Screen = 'home' | 'collaborative' | 'optimization' | 'store' | 'gamification' | 'settings';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [history, setHistory] = useState<Screen[]>(['home']);

  const navigateTo = (screen: Screen) => {
    setHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Remove current screen
      const previousScreen = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setCurrentScreen(previousScreen);
    }
  };

  const renderScreen = () => {
    const canGoBack = history.length > 1;
    
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={navigateTo} />;
      case 'collaborative':
        return <CollaborativeScreen onNavigate={navigateTo} onBack={goBack} canGoBack={canGoBack} />;
      case 'optimization':
        return <OptimizationScreen onNavigate={navigateTo} onBack={goBack} canGoBack={canGoBack} />;
      case 'store':
        return <StoreScreen onNavigate={navigateTo} onBack={goBack} canGoBack={canGoBack} />;
      case 'gamification':
        return <GamificationScreen onNavigate={navigateTo} onBack={goBack} canGoBack={canGoBack} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} onBack={goBack} canGoBack={canGoBack} />;
      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden" style={{ height: '844px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}