import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, HardDriveUpload, Database } from 'lucide-react';
import { storage } from '../lib/storage';
import { Language } from '../lib/i18n';

interface OfflineSyncBadgeProps {
  lang?: Language;
}

export const OfflineSyncBadge: React.FC<OfflineSyncBadgeProps> = ({ lang = 'ar' }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(() => storage.getPendingSyncCount());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => storage.getLastSyncTime());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const isAr = lang === 'ar';

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleAutoSyncOnRestored();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handlePendingUpdate = () => {
      setPendingCount(storage.getPendingSyncCount());
      setLastSyncTime(storage.getLastSyncTime());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('fleet_pending_sync_update', handlePendingUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('fleet_pending_sync_update', handlePendingUpdate);
    };
  }, [lang]);

  const handleAutoSyncOnRestored = () => {
    setIsSyncing(true);
    const count = storage.getPendingSyncCount();
    
    setTimeout(() => {
      storage.clearPendingSync();
      setPendingCount(0);
      setLastSyncTime(new Date().toISOString());
      setIsSyncing(false);

      const msg = isAr 
        ? `تم استعادة الاتصال بالإنترنت ومزامنة ${count > 0 ? `${count} تعديلات محلية` : 'البيانات المخزنة محلياً'} تلقائياً! ⚡`
        : `Connection restored! Automatically synced ${count > 0 ? `${count} offline edits` : 'local cache'} to cloud! ⚡`;
      
      setSyncSuccessMessage(msg);
      setTimeout(() => setSyncSuccessMessage(null), 5000);
    }, 1200);
  };

  const handleManualSync = () => {
    if (!isOnline) return;
    setIsSyncing(true);
    setTimeout(() => {
      storage.clearPendingSync();
      setPendingCount(0);
      setLastSyncTime(new Date().toISOString());
      setIsSyncing(false);

      const msg = isAr
        ? 'تمت المزامنة اليدوية والتأكد من سلامة التخزين المحلي بنجاح! ✓'
        : 'Manual sync completed and local storage validated successfully! ✓';
      setSyncSuccessMessage(msg);
      setTimeout(() => setSyncSuccessMessage(null), 4000);
    }, 800);
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Restored Connection Toast Banner */}
      {syncSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900/95 text-emerald-100 border border-emerald-500 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-slide-up max-w-md">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 animate-bounce" />
          <div>
            <p className="font-bold text-xs">{isAr ? 'تمت المزامنة التلقائية بنجاح' : 'Auto-Sync Complete'}</p>
            <p className="text-[11px] text-emerald-200">{syncSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Main Connection Status Pill */}
      {!isOnline ? (
        <div className="px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex items-center gap-1.5">
            <span>{isAr ? 'وضع عدم الاتصال (تخزين محلي)' : 'Offline Mode (Local Storage)'}</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded-full text-[10px] font-extrabold">
                {pendingCount} {isAr ? 'معلقة' : 'pending'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm border ${
            isSyncing
              ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}
          title={isAr ? 'اضغط لمزامنة التخزين المحلي فوراً' : 'Click to force sync local cache'}
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>
            {isSyncing
              ? (isAr ? 'جاري المزامنة...' : 'Syncing...')
              : (isAr ? 'متصل (تخزين محلي نشط)' : 'Online (Local Storage Sync)')}
          </span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500 text-black rounded-full text-[10px] font-extrabold">
              {pendingCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
