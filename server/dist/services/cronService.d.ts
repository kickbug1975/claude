/**
 * Démarrer tous les jobs cron
 */
export declare const startCronJobs: () => void;
/**
 * Lister tous les jobs enregistrés
 */
export declare const listJobs: () => {
    name: string;
    schedule: string;
    enabled: boolean;
}[];
/**
 * Activer/Désactiver un job
 */
export declare const toggleJob: (name: string, enabled: boolean) => boolean;
/**
 * Exécuter un job manuellement
 */
export declare const runJobManually: (name: string) => Promise<boolean>;
/**
 * Réinitialiser l'état des jobs (pour les tests)
 */
export declare const resetJobsState: () => void;
declare const _default: {
    startCronJobs: () => void;
    listJobs: () => {
        name: string;
        schedule: string;
        enabled: boolean;
    }[];
    toggleJob: (name: string, enabled: boolean) => boolean;
    runJobManually: (name: string) => Promise<boolean>;
};
export default _default;
//# sourceMappingURL=cronService.d.ts.map