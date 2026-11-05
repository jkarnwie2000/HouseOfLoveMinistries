import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { newId } from '../utils/sanitize.js';

/**
 * Zero-configuration file database for local development and small single-server
 * deployments. Data is kept in memory and flushed to disk atomically after each write.
 * Implements the same interface as firestoreStore.js.
 */
export function createJsonStore(filePath) {
  let data = null;
  let writeChain = Promise.resolve();

  const now = () => new Date().toISOString();
  const clone = (v) => (v == null ? v : structuredClone(v));
  const col = (name) => {
    if (!data[name]) data[name] = {};
    return data[name];
  };

  async function writeFile(snapshot) {
    const tmp = `${filePath}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, snapshot, 'utf8');
    try {
      await fsp.rename(tmp, filePath);
    } catch {
      // Synced folders (OneDrive/Dropbox) can briefly lock the target on Windows.
      await fsp.writeFile(filePath, snapshot, 'utf8');
      await fsp.rm(tmp, { force: true });
    }
  }

  function persist() {
    const snapshot = JSON.stringify(data, null, 2);
    writeChain = writeChain.then(() => writeFile(snapshot)).catch((err) => {
      console.error('[db] failed to persist JSON store:', err);
    });
    return writeChain;
  }

  return {
    driver: 'json',

    async init() {
      if (data) return;
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}') : {};
    },

    async list(name) {
      return Object.values(col(name)).map(clone);
    },

    async get(name, id) {
      return clone(col(name)[id] ?? null);
    },

    async findBy(name, field, value) {
      return Object.values(col(name)).filter((d) => d[field] === value).map(clone);
    },

    async create(name, doc) {
      const id = doc.id || newId();
      if (col(name)[id]) throw new Error(`Document ${name}/${id} already exists`);
      const record = { ...clone(doc), id, createdAt: doc.createdAt || now(), updatedAt: now() };
      col(name)[id] = record;
      await persist();
      return clone(record);
    },

    /** Atomically creates a document only if the id is unused. Returns true when created. */
    async createIfAbsent(name, id, doc) {
      if (col(name)[id]) return false;
      col(name)[id] = { ...clone(doc), id, createdAt: now(), updatedAt: now() };
      await persist();
      return true;
    },

    async update(name, id, patch) {
      const existing = col(name)[id];
      if (!existing) return null;
      const record = { ...existing, ...clone(patch), id, updatedAt: now() };
      col(name)[id] = record;
      await persist();
      return clone(record);
    },

    async increment(name, id, field, delta) {
      const existing = col(name)[id];
      if (!existing) return null;
      existing[field] = (Number(existing[field]) || 0) + delta;
      existing.updatedAt = now();
      await persist();
      return clone(existing);
    },

    async remove(name, id) {
      if (!col(name)[id]) return false;
      delete col(name)[id];
      await persist();
      return true;
    },

    async close() {
      await writeChain;
    },
  };
}
