import {
    collection, collectionGroup, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, writeBatch,
    onSnapshot, query as fsQuery, where, orderBy, limit, increment, arrayUnion, arrayRemove, serverTimestamp,
    getFirestore, Firestore, QueryConstraint,
} from 'firebase/firestore';
import { app } from '../firebase';
import { DataStore, Doc, FieldOp, Path, Query, WriteBatch } from './types';

/** Az egyetlen hely, ahol a Firestore SDK használatban van. */

// Ha a Firebase nincs konfigurálva, `db` undefined marad és `available` hamis.
let db!: Firestore;
try {
    if (app) db = getFirestore(app);
} catch (e) {
    console.error('Firestore init error:', e);
}

const isFieldOp = (v: unknown): v is FieldOp => typeof v === 'object' && v !== null && '__op' in (v as object);

const toFs = (v: FieldOp) => {
    switch (v.__op) {
        case 'increment': return increment(v.value);
        case 'arrayUnion': return arrayUnion(...v.values);
        case 'arrayRemove': return arrayRemove(...v.values);
        case 'serverTimestamp': return serverTimestamp();
    }
};

/** A legfelső szintű mezőműveleteket Firestore sentinelekre cseréli. */
const encode = (data: object): any => {
    const out: any = {};
    for (const [k, v] of Object.entries(data)) out[k] = isFieldOp(v) ? toFs(v) : v;
    return out;
};

const docRef = (path: Path) => doc(db, path[0], ...path.slice(1));
const colRef = (path: Path) => collection(db, path[0], ...path.slice(1));

const constraints = (q?: Query): QueryConstraint[] => {
    const c: QueryConstraint[] = [];
    q?.where?.forEach(([f, op, v]) => c.push(where(f, op, v)));
    q?.orderBy?.forEach(([f, dir]) => c.push(orderBy(f, dir || 'asc')));
    if (q?.limit) c.push(limit(q.limit));
    return c;
};

const toDoc = <T>(d: { id: string; ref: { path: string }; data: () => any }): Doc<T> => ({
    id: d.id,
    path: d.ref.path.split('/'),
    data: d.data() as T,
});

export const firestoreStore: DataStore = {
    get available() { return !!db; },

    async get(path) {
        const s = await getDoc(docRef(path));
        return s.exists() ? (s.data() as any) : null;
    },
    async getDoc(path) {
        const s = await getDoc(docRef(path));
        return s.exists() ? toDoc(s as any) : null;
    },
    async set(path, data, options) {
        await setDoc(docRef(path), encode(data), options?.merge ? { merge: true } : {});
    },
    async update(path, patch) {
        await updateDoc(docRef(path), encode(patch));
    },
    async remove(path) {
        await deleteDoc(docRef(path));
    },
    async add(path, data) {
        return (await addDoc(colRef(path), encode(data))).id;
    },

    async list(path, q) {
        const snap = await getDocs(fsQuery(colRef(path), ...constraints(q)));
        return snap.docs.map(d => toDoc(d as any));
    },
    async listGroup(collectionId, q) {
        const snap = await getDocs(fsQuery(collectionGroup(db, collectionId), ...constraints(q)));
        return snap.docs.map(d => toDoc(d as any));
    },

    watch(path, onData, onError) {
        return onSnapshot(docRef(path), s => onData(s.exists() ? (s.data() as any) : null), onError);
    },
    watchList(path, q, onData, onError) {
        return onSnapshot(
            fsQuery(colRef(path), ...constraints(q)),
            snap => onData(snap.docs.map(d => toDoc(d as any))),
            onError,
        );
    },

    batch() {
        const b = writeBatch(db);
        const wrapper: WriteBatch = {
            set(path, data, options) { b.set(docRef(path), encode(data), options?.merge ? { merge: true } : {}); return wrapper; },
            update(path, patch) { b.update(docRef(path), encode(patch)); return wrapper; },
            remove(path) { b.delete(docRef(path)); return wrapper; },
            commit: () => b.commit(),
        };
        return wrapper;
    },
};
