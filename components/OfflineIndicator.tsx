import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-stone-900 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl border border-stone-800 animate-in fade-in slide-in-from-bottom-2">
      <WifiOff size={16} className="text-amber-400" />
      <span>Modo sin conexión — Mostrando contenido en caché</span>
    </div>
  );
};
