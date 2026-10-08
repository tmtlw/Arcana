import { DataStore } from './types';
import { firestoreStore } from './firestoreStore';

/**
 * Az alkalmazás adatbázisa. Másik adatbázisra váltáshoz csak ezt a sort és egy új DataStore
 * implementációt kell cserélni (lásd types.ts).
 */
export const store: DataStore = firestoreStore;

export * from './types';
