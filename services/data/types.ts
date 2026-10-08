/**
 * Adatbázis-absztrakció.
 *
 * Az alkalmazás kizárólag ezt az interfészt használja adattárolásra. A konkrét adatbázis
 * (jelenleg Firestore) egyetlen fájlban van megvalósítva: services/data/firestoreStore.ts.
 * Másik adatbázisra (pl. Cloudflare D1/KV) váltáskor csak egy új `DataStore` implementációt kell
 * írni és a services/data/index.ts-ben átállítani – a többi kód nem változik.
 *
 * Szemantika, amit minden implementációnak tartania kell:
 *  - A dokumentum helye egy útvonal (`['users', uid, 'readings', id]`), páratlan hosszú kollekció-útvonal
 *    nem létezik: kollekció = páratlan elemszám, dokumentum = páros elemszám.
 *  - `update` hiányzó dokumentumra hibát dob; `set` létrehoz/felülír (`merge` esetén egyesít).
 *  - A mezőműveletek (`Ops`) atomikusak a dokumentumon belül.
 *  - `list`/`listGroup` hiba esetén dobjon; a hívók kezelik.
 */

export type Path = readonly string[];

/** Egy lekérdezett dokumentum: azonosító, teljes útvonal és adat. */
export interface Doc<T = any> {
    id: string;
    path: string[];
    data: T;
}

export type WhereOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in';

export interface Query {
    where?: Array<[field: string, op: WhereOp, value: unknown]>;
    orderBy?: Array<[field: string, direction?: 'asc' | 'desc']>;
    limit?: number;
}

/** Atomikus mezőműveletek – csak a `set`/`update`/`add`/batch adat legfelső szintjén használhatók. */
export type FieldOp =
    | { readonly __op: 'increment'; readonly value: number }
    | { readonly __op: 'arrayUnion'; readonly values: unknown[] }
    | { readonly __op: 'arrayRemove'; readonly values: unknown[] }
    | { readonly __op: 'serverTimestamp' };

export const Ops = {
    increment: (value: number): FieldOp => ({ __op: 'increment', value }),
    arrayUnion: (...values: unknown[]): FieldOp => ({ __op: 'arrayUnion', values }),
    arrayRemove: (...values: unknown[]): FieldOp => ({ __op: 'arrayRemove', values }),
    serverTimestamp: (): FieldOp => ({ __op: 'serverTimestamp' }),
};

export type Unsubscribe = () => void;

export interface WriteBatch {
    set(path: Path, data: object, options?: { merge?: boolean }): WriteBatch;
    update(path: Path, patch: object): WriteBatch;
    remove(path: Path): WriteBatch;
    commit(): Promise<void>;
}

export interface DataStore {
    /** Hamis, ha az adatbázis nincs konfigurálva / nem érhető el (a hívók ilyenkor offline módban működnek). */
    readonly available: boolean;

    get<T = any>(path: Path): Promise<T | null>;
    /** Mint a get, de azonosítóval és útvonallal együtt. */
    getDoc<T = any>(path: Path): Promise<Doc<T> | null>;
    set(path: Path, data: object, options?: { merge?: boolean }): Promise<void>;
    update(path: Path, patch: object): Promise<void>;
    remove(path: Path): Promise<void>;
    /** Új dokumentum generált azonosítóval; visszaadja az azonosítót. */
    add(collection: Path, data: object): Promise<string>;

    list<T = any>(collection: Path, query?: Query): Promise<Doc<T>[]>;
    /** Minden azonos nevű alkollekció összes dokumentuma (pl. minden felhasználó `readings`-e). */
    listGroup<T = any>(collectionId: string, query?: Query): Promise<Doc<T>[]>;

    /** Dokumentum élő figyelése; `null` jön, ha nem létezik. */
    watch<T = any>(path: Path, onData: (data: T | null) => void, onError?: (e: unknown) => void): Unsubscribe;
    watchList<T = any>(collection: Path, query: Query | undefined, onData: (docs: Doc<T>[]) => void, onError?: (e: unknown) => void): Unsubscribe;

    batch(): WriteBatch;
}
