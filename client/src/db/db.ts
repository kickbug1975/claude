import Dexie, { Table } from 'dexie';
import { FeuilleTravail, Monteur, Chantier } from '../types';

export interface SyncItem {
    id?: number;
    action: 'CREATE_FEUILLE' | 'UPDATE_FEUILLE' | 'DELETE_FEUILLE';
    payload: any;
    status: 'PENDING' | 'ERROR';
    createdAt: number;
    error?: string;
}

export class MaintenanceDB extends Dexie {
    feuilles!: Table<FeuilleTravail, string>;
    monteurs!: Table<Monteur, string>;
    chantiers!: Table<Chantier, string>;
    syncQueue!: Table<SyncItem, number>;

    constructor() {
        super('MaintenanceDB');
        this.version(1).stores({
            feuilles: 'id, statut, monteurId, chantierId, syncStatus', // syncStatus: 'synced' | 'pending'
            monteurs: 'id, nom, role',
            chantiers: 'id, nom, actif',
            syncQueue: '++id, action, status, createdAt'
        });
    }
}

export const db = new MaintenanceDB();
