import { newId } from '../utils/sanitize.js';

/**
 * Google Cloud Firestore (Firebase) implementation of the store interface.
 * Enable with DB_DRIVER=firestore and the FIREBASE_* variables (or
 * GOOGLE_APPLICATION_CREDENTIALS pointing at a service-account JSON file).
 */
export async function createFirestoreStore(config) {
  const { initializeApp, cert, applicationDefault, getApps } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');

  if (!getApps().length) {
    const hasInlineCreds = config.projectId && config.clientEmail && config.privateKey;
    initializeApp({
      credential: hasInlineCreds
        ? cert({ projectId: config.projectId, clientEmail: config.clientEmail, privateKey: config.privateKey })
        : applicationDefault(),
      projectId: config.projectId || undefined,
    });
  }
  const fs = getFirestore();
  fs.settings({ ignoreUndefinedProperties: true });

  const now = () => new Date().toISOString();
  const snap = (s) => (s.exists ? { id: s.id, ...s.data() } : null);

  return {
    driver: 'firestore',
    async init() {},

    async list(name) {
      const res = await fs.collection(name).get();
      return res.docs.map(snap);
    },

    async get(name, id) {
      return snap(await fs.collection(name).doc(id).get());
    },

    async findBy(name, field, value) {
      const res = await fs.collection(name).where(field, '==', value).get();
      return res.docs.map(snap);
    },

    async create(name, doc) {
      const id = doc.id || newId();
      const record = { ...doc, id, createdAt: doc.createdAt || now(), updatedAt: now() };
      await fs.collection(name).doc(id).create(record);
      return record;
    },

    async createIfAbsent(name, id, doc) {
      try {
        await fs.collection(name).doc(id).create({ ...doc, id, createdAt: now(), updatedAt: now() });
        return true;
      } catch (err) {
        if (err.code === 6 /* ALREADY_EXISTS */) return false;
        throw err;
      }
    },

    async update(name, id, patch) {
      const ref = fs.collection(name).doc(id);
      return fs.runTransaction(async (tx) => {
        const current = await tx.get(ref);
        if (!current.exists) return null;
        const next = { ...patch, id, updatedAt: now() };
        tx.set(ref, next, { merge: true });
        return { ...current.data(), ...next };
      });
    },

    async increment(name, id, field, delta) {
      const ref = fs.collection(name).doc(id);
      const current = await ref.get();
      if (!current.exists) return null;
      await ref.update({ [field]: FieldValue.increment(delta), updatedAt: now() });
      return snap(await ref.get());
    },

    async remove(name, id) {
      const ref = fs.collection(name).doc(id);
      const current = await ref.get();
      if (!current.exists) return false;
      await ref.delete();
      return true;
    },

    async close() {},
  };
}
