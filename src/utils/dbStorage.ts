/**
 * High-capacity client-side persistence using browser IndexedDB.
 * Bypasses the 5MB quota limit of localStorage so 13,000+ lead spreadsheets
 * and authorized users never get truncated or deleted.
 */

import { Lead } from '../types/lead';
import { AppUser } from '../types/user';

const DB_NAME = '1ClickLeadsMasterDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('keyval')) {
          db.createObjectStore('keyval');
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return dbPromise;
}

export async function idbSet<T = unknown>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB Set Warning] Key: ${key}`, err);
  }
}

export async function idbGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keyval', 'readonly');
      const store = tx.objectStore('keyval');
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB Get Warning] Key: ${key}`, err);
    return null;
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('keyval', 'readwrite');
      const store = tx.objectStore('keyval');
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB Delete Warning] Key: ${key}`, err);
  }
}

export async function clearMasterQueueFromIDB(): Promise<void> {
  await idbDelete('master_queue');
}

export async function saveMasterQueueToIDB(
  leads: Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[]
): Promise<void> {
  await idbSet('master_queue', leads);
}

export async function getMasterQueueFromIDB(): Promise<
  Omit<Lead, 'id' | 'timestamp' | 'receivedAgo' | 'isNewArrival'>[] | null
> {
  return await idbGet('master_queue');
}

export async function saveUsersToIDB(users: AppUser[]): Promise<void> {
  await idbSet('authorized_users', users);
}

export async function getUsersFromIDB(): Promise<AppUser[] | null> {
  return await idbGet('authorized_users');
}
