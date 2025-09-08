"use client";
import { useEffect } from 'react';
import { useTokenExpiry } from '@/hooks/useTokenExpiry';
import TokenExpiryModal from './TokenExpiryModal';

interface EMRTokenHandlerProps {
  children: React.ReactNode;
}

export default function EMRTokenHandler({ children }: EMRTokenHandlerProps) {
  const {
    showModal,
    handleTokenExpiry,
    handleLogin,
    handleLogout,
    clearExpiry
  } = useTokenExpiry();

  useEffect(() => {
    // Listen for token expiry events
    const handleTokenExpiredEvent = (event: CustomEvent) => {
      console.log('🔒 Token expiry event received:', event.detail);
      handleTokenExpiry(event.detail?.message);
    };

    // Add event listener
    window.addEventListener('tokenExpired', handleTokenExpiredEvent as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpiredEvent as EventListener);
    };
  }, [handleTokenExpiry]);

  return (
    <>
      {children}
      <TokenExpiryModal
        isOpen={showModal}
        onClose={clearExpiry}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </>
  );
}
