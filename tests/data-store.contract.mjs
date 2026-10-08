// DataStore szerződés-teszt: bármely `DataStore` implementáció ugyanezt kell tudja.
// Használat: a STORE_MODULE env változó egy olyan (bundle-elt) ES modulra mutasson, ami exportálja
// a `store`-t (DataStore) és az `Ops`-t. Az adatbázisnak üresnek / eldobhatónak kell lennie!
const { store: s, Ops } = await import(process.env.STORE_MODULE);
let fail = 0; const t = (n, c) => { console.log(c ? 'PASS' : 'FAIL', n); if (!c) fail++; };
t('available', s.available === true);
await s.set(['users','u1'], { name: 'A', n: 1, tags: ['x'] });
t('get', (await s.get(['users','u1'])).name === 'A');
t('get missing null', (await s.get(['users','nope'])) === null);
await s.set(['users','u1'], { extra: 1 }, { merge: true });
const u = await s.get(['users','u1']); t('merge', u.name === 'A' && u.extra === 1);
await s.update(['users','u1'], { n: Ops.increment(2), tags: Ops.arrayUnion('y','z') });
let u2 = await s.get(['users','u1']); t('increment+arrayUnion', u2.n === 3 && u2.tags.length === 3);
await s.update(['users','u1'], { tags: Ops.arrayRemove('x') });
u2 = await s.get(['users','u1']); t('arrayRemove', !u2.tags.includes('x'));
let threw = false; try { await s.update(['users','ghost'], { a: 1 }); } catch { threw = true; } t('update missing throws', threw);
const id = await s.add(['quests'], { title: 'q', isPublic: true, at: Ops.serverTimestamp() });
t('add returns id', typeof id === 'string' && id.length > 5);
const gd = await s.getDoc(['quests', id]); t('getDoc id/path', gd.id === id && gd.path.join('/') === `quests/${id}`);
for (let i = 0; i < 5; i++) await s.set(['public_readings', 'r'+i], { userId: i % 2 ? 'a' : 'b', date: '2026-01-0'+(i+1) });
let l = await s.list(['public_readings'], { where: [['userId','==','a']], orderBy: [['date','desc']], limit: 5 });
t('list where+orderBy', l.length === 2 && l[0].data.date > l[1].data.date);
l = await s.list(['public_readings'], { limit: 3 }); t('limit', l.length === 3);
await s.set(['users','u1','readings','x1'], { v: 1 }); await s.set(['users','u2','readings','x2'], { v: 2 });
const g = await s.listGroup('readings'); t('listGroup', g.length === 2 && g[0].path.length === 4);
const seen = []; const un = s.watch(['users','u1'], d => seen.push(d));
await new Promise(r => setTimeout(r, 400)); await s.update(['users','u1'], { n: 99 }); await new Promise(r => setTimeout(r, 400)); un();
t('watch', seen.length >= 2 && seen.at(-1).n === 99);
const lists = []; const un2 = s.watchList(['public_readings'], { where: [['userId','==','a']] }, d => lists.push(d.length));
await new Promise(r => setTimeout(r, 400)); await s.set(['public_readings','r9'], { userId: 'a' }); await new Promise(r => setTimeout(r, 400)); un2();
t('watchList', lists[0] === 2 && lists.at(-1) === 3);
const b = s.batch(); b.set(['users','b1'], { a: 1 }).update(['users','u1'], { n: 1 }).remove(['users','u2','readings','x2']); await b.commit();
t('batch', (await s.get(['users','b1'])).a === 1 && (await s.get(['users','u1'])).n === 1 && (await s.get(['users','u2','readings','x2'])) === null);
await s.remove(['users','b1']); t('remove', (await s.get(['users','b1'])) === null);
console.log(fail ? fail+' FAILED' : 'ALL OK'); process.exit(fail ? 1 : 0);
