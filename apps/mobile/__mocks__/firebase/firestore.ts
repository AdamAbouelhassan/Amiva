/**
 * Manual Jest mock for `firebase/firestore`, used by repository tests via
 * `jest.mock('firebase/firestore')`. An in-memory stand-in covering just
 * the modular-SDK surface the repositories actually call — good enough to
 * exercise repository *logic* (query filtering, standalone-experience
 * assignment, recategorization orchestration) without a live emulator.
 */

type Doc = Record<string, unknown>;

class Store {
  collections = new Map<string, Map<string, Doc>>();
  autoId = 0;

  col(name: string): Map<string, Doc> {
    if (!this.collections.has(name)) this.collections.set(name, new Map());
    return this.collections.get(name)!;
  }
}

export const __store = new Store();
export function __reset(): void {
  __store.collections.clear();
  __store.autoId = 0;
}
export function __seed(collectionName: string, id: string, data: Doc): void {
  __store.col(collectionName).set(id, data);
}
export function __getRaw(collectionName: string, id: string): Doc | undefined {
  return __store.col(collectionName).get(id);
}

interface DocRef {
  __type: 'doc';
  name: string;
  id: string;
}
interface CollectionRef {
  __type: 'collection';
  name: string;
}
interface WhereClause {
  __type: 'where';
  field: string;
  op: string;
  value: unknown;
}
interface OrderByClause {
  __type: 'orderBy';
  field: string;
  dir: 'asc' | 'desc';
}
interface LimitClause {
  __type: 'limit';
  n: number;
}
type QueryClause = WhereClause | OrderByClause | LimitClause;
interface QueryRef {
  __type: 'query';
  name: string;
  clauses: QueryClause[];
}

export function collection(_db: unknown, name: string): CollectionRef {
  return { __type: 'collection', name };
}

export function doc(dbOrCollectionRef: CollectionRef | unknown, ...rest: string[]): DocRef {
  if (rest.length === 0) {
    const collectionRef = dbOrCollectionRef as CollectionRef;
    __store.autoId += 1;
    return { __type: 'doc', name: collectionRef.name, id: `auto-${__store.autoId}` };
  }
  const id = rest[rest.length - 1]!;
  const name = rest.slice(0, -1).join('/');
  return { __type: 'doc', name, id };
}

export async function getDoc(ref: DocRef) {
  const data = __store.col(ref.name).get(ref.id);
  return { id: ref.id, exists: () => data !== undefined, data: () => data };
}

export async function setDoc(ref: DocRef, data: Doc): Promise<void> {
  __store.col(ref.name).set(ref.id, data);
}

function applyFieldValue(existing: unknown, incoming: unknown): unknown {
  if (incoming && typeof incoming === 'object' && '__op' in (incoming as Record<string, unknown>)) {
    const op = (incoming as { __op: string; value: unknown }).__op;
    const value = (incoming as { __op: string; value: unknown }).value;
    const arr = Array.isArray(existing) ? existing : [];
    if (op === 'arrayUnion') return arr.includes(value) ? arr : [...arr, value];
    if (op === 'arrayRemove') return arr.filter((x) => x !== value);
  }
  return incoming;
}

export async function updateDoc(ref: DocRef, patch: Doc): Promise<void> {
  const existing = __store.col(ref.name).get(ref.id) ?? {};
  const merged: Doc = { ...existing };
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = applyFieldValue(existing[key], value);
  }
  __store.col(ref.name).set(ref.id, merged);
}

export async function deleteDoc(ref: DocRef): Promise<void> {
  __store.col(ref.name).delete(ref.id);
}

export function query(collectionRef: CollectionRef, ...clauses: QueryClause[]): QueryRef {
  return { __type: 'query', name: collectionRef.name, clauses };
}
export function where(field: string, op: string, value: unknown): WhereClause {
  return { __type: 'where', field, op, value };
}
export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): OrderByClause {
  return { __type: 'orderBy', field, dir };
}
export function limit(n: number): LimitClause {
  return { __type: 'limit', n };
}

export async function getDocs(ref: QueryRef | CollectionRef) {
  let entries = [...__store.col(ref.name).entries()];
  const clauses = 'clauses' in ref ? ref.clauses : [];

  for (const clause of clauses) {
    if (clause.__type === 'where') {
      entries = entries.filter(([, data]) => {
        const actual = data[clause.field];
        if (clause.op === '==') {
          if (clause.value === null) return actual === null || actual === undefined;
          return actual === clause.value;
        }
        if (clause.op === 'array-contains') {
          return Array.isArray(actual) && actual.includes(clause.value);
        }
        return true;
      });
    }
  }

  const orderClause = clauses.find((c): c is OrderByClause => c.__type === 'orderBy');
  if (orderClause) {
    entries.sort(([, a], [, b]) => {
      const av = toComparable(a[orderClause.field]);
      const bv = toComparable(b[orderClause.field]);
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return orderClause.dir === 'desc' ? -cmp : cmp;
    });
  }

  const limitClause = clauses.find((c): c is LimitClause => c.__type === 'limit');
  if (limitClause) entries = entries.slice(0, limitClause.n);

  return { docs: entries.map(([id, data]) => ({ id, exists: () => true, data: () => data })) };
}

function toComparable(value: unknown): number {
  if (value instanceof Timestamp) return value.toDate().getTime();
  if (typeof value === 'number') return value;
  return 0;
}

export function writeBatch(_db: unknown) {
  const ops: Array<() => void> = [];
  const batch = {
    set(ref: DocRef, data: Doc) {
      ops.push(() => __store.col(ref.name).set(ref.id, data));
      return batch;
    },
    update(ref: DocRef, patch: Doc) {
      ops.push(() => {
        const existing = __store.col(ref.name).get(ref.id) ?? {};
        __store.col(ref.name).set(ref.id, { ...existing, ...patch });
      });
      return batch;
    },
    delete(ref: DocRef) {
      ops.push(() => __store.col(ref.name).delete(ref.id));
      return batch;
    },
    async commit() {
      ops.forEach((op) => op());
    },
  };
  return batch;
}

export function arrayUnion(value: unknown) {
  return { __op: 'arrayUnion', value };
}
export function arrayRemove(value: unknown) {
  return { __op: 'arrayRemove', value };
}

export class Timestamp {
  constructor(private readonly date: Date) {}
  static fromDate(date: Date): Timestamp {
    return new Timestamp(date);
  }
  toDate(): Date {
    return this.date;
  }
}

export type DocumentData = Doc;
