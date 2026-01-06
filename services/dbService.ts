
// Wrapper for IndexedDB to handle large files like custom deck images
const DB_NAME = 'MisztikusTarotDB';
const DB_VERSION = 1;
const STORE_IMAGES = 'deck_images';

let dbPromise: Promise<IDBDatabase> | null = null;

export const dbService = {
    db: null as IDBDatabase | null,

    init: (): Promise<IDBDatabase> => {
        if (dbPromise) return dbPromise;

        dbPromise = new Promise((resolve, reject) => {
            // Check for SSR or missing IDB
            if (typeof window === 'undefined' || !window.indexedDB) {
                console.warn("IndexedDB is not supported in this environment.");
                dbPromise = null;
                return reject(new Error("IndexedDB not supported"));
            }

            try {
                const request = window.indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = (event: any) => {
                    const error = event.target?.error || request.error;
                    console.error("IndexedDB initialization error:", error);
                    dbPromise = null; // Reset for retry
                    reject(error || new Error("Failed to open IndexedDB"));
                };

                request.onsuccess = (event: any) => {
                    dbService.db = event.target.result;
                    resolve(event.target.result);
                };

                request.onupgradeneeded = (event: any) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains(STORE_IMAGES)) {
                        db.createObjectStore(STORE_IMAGES);
                    }
                };

                // Fallback for cases where open() hangs or fails silently
                setTimeout(() => {
                    if (!dbService.db && dbPromise) {
                        console.warn("IndexedDB initialization timed out.");
                    }
                }, 5000);

            } catch (err) {
                console.error("Critical IndexedDB error during open:", err);
                dbPromise = null;
                reject(err);
            }
        });

        return dbPromise;
    },

    ensureReady: async () => {
        try {
            if (dbService.db) return;
            await dbService.init();
        } catch (err) {
            console.error("ensureReady failed:", err);
            // Don't throw here to prevent app crash, let individual methods handle null db
        }
    },

    saveImage: async (key: string, base64: string): Promise<void> => {
        try {
            await dbService.ensureReady();
            return new Promise((resolve, reject) => {
                if (!dbService.db) {
                    console.warn("IDB not available, image not saved.");
                    return resolve(); // Resolve silently to avoid breaking flow
                }
                
                const transaction = dbService.db.transaction([STORE_IMAGES], 'readwrite');
                const store = transaction.objectStore(STORE_IMAGES);
                const request = store.put(base64, key);

                request.onsuccess = () => resolve();
                request.onerror = (event: any) => reject(event.target?.error || new Error("Save operation failed"));
            });
        } catch (err) {
            console.error(`Error saving image ${key} to IDB:`, err);
        }
    },

    getImage: async (key: string): Promise<string | null> => {
        try {
            await dbService.ensureReady();
            return new Promise((resolve) => {
                if (!dbService.db) return resolve(null);
                
                const transaction = dbService.db.transaction([STORE_IMAGES], 'readonly');
                const store = transaction.objectStore(STORE_IMAGES);
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result || null);
                request.onerror = (event: any) => {
                    console.warn("IDB Get Error:", event.target?.error);
                    resolve(null);
                };
            });
        } catch (err) {
            console.warn(`Could not retrieve image ${key} from IDB:`, err);
            return null;
        }
    },

    deleteImage: async (key: string): Promise<void> => {
        try {
            await dbService.ensureReady();
            return new Promise((resolve, reject) => {
                if (!dbService.db) return resolve();
                
                const transaction = dbService.db.transaction([STORE_IMAGES], 'readwrite');
                const store = transaction.objectStore(STORE_IMAGES);
                const request = store.delete(key);

                request.onsuccess = () => resolve();
                request.onerror = (event: any) => reject(event.target?.error || new Error("Delete operation failed"));
            });
        } catch (err) {
            console.error(`Error deleting image ${key} from IDB:`, err);
        }
    }
};