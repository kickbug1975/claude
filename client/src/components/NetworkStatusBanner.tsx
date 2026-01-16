import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { db } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const NetworkStatusBanner = () => {
    const isOnline = useOnlineStatus();
    const [showBackOnline, setShowBackOnline] = useState(false);

    // Monitor sync queue
    const pendingCount = useLiveQuery(
        () => db.syncQueue.where('status').equals('PENDING').count()
    );

    useEffect(() => {
        if (isOnline) {
            setShowBackOnline(true);
            const timer = setTimeout(() => setShowBackOnline(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    if (!isOnline) {
        return (
            <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all">
                <WifiOff size={16} />
                <span>Mode Hors-Ligne - Modifications sauvegardées localement</span>
                {pendingCount !== undefined && pendingCount > 0 && (
                    <span className="bg-red-700 px-2 py-0.5 rounded-full text-xs">
                        {pendingCount} en attente
                    </span>
                )}
            </div>
        );
    }

    if (showBackOnline) {
        return (
            <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all">
                <Wifi size={16} />
                <span>Connexion rétablie</span>
            </div>
        );
    }

    // Show Syncing state if we have pending items but we are online
    if (isOnline && pendingCount !== undefined && pendingCount > 0) {
        return (
            <div className="bg-blue-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all">
                <RefreshCw size={16} className="animate-spin" />
                <span>Synchronisation en cours ({pendingCount} restants)...</span>
            </div>
        );
    }

    return null;
};
