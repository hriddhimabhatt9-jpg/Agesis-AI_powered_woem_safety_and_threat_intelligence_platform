import React, { createContext, useContext, useState, useEffect } from 'react';

const DisguiseContext = createContext();

export function DisguiseProvider({ children }) {
  const [isDisguised, setIsDisguised] = useState(() => {
    return localStorage.getItem('aegesis_disguise') === 'true';
  });

  const toggleDisguise = () => {
    setIsDisguised(prev => {
      const next = !prev;
      localStorage.setItem('aegesis_disguise', next);
      return next;
    });
  };

  // Secret gesture listener (Triple Tap anywhere for emergency toggle)
  useEffect(() => {
    let lastTap = 0;
    let tapCount = 0;

    const handleTap = () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        tapCount++;
      } else {
        tapCount = 1;
      }
      lastTap = now;

      if (tapCount === 3) {
        // Toggle disguise with triple tap
        toggleDisguise();
        tapCount = 0;
      }
    };

    const handleKeyDown = (e) => {
      // Panic Shortcut: Ctrl + Q
      if (e.ctrlKey && e.key === 'q') {
        setIsDisguised(true);
        localStorage.setItem('aegesis_disguise', 'true');
        // Optional: window.location.href = 'https://www.google.com';
      }
    };

    window.addEventListener('click', handleTap);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleTap);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <DisguiseContext.Provider value={{ isDisguised, toggleDisguise }}>
      {children}
    </DisguiseContext.Provider>
  );
}

export const useDisguise = () => {
  const context = useContext(DisguiseContext);
  if (!context) throw new Error('useDisguise must be used within a DisguiseProvider');
  return context;
};
