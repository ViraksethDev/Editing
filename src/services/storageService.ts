import { Project } from '../types/editor';

const DB_NAME = 'instaedit_studio_db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const MEDIA_STORE = 'media_blobs';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export const StorageService = {
  async saveProject(project: Project): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readwrite');
        const store = tx.objectStore(PROJECTS_STORE);
        // Clone project to avoid any circular references or non-cloneable objects
        const serialized = JSON.parse(JSON.stringify(project));
        const req = store.put(serialized);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to save project to IndexedDB, fallback to localStorage', err);
      try {
        localStorage.setItem(`instaedit_project_${project.id}`, JSON.stringify(project));
      } catch (localErr) {
        console.error('Local storage backup also failed', localErr);
      }
    }
  },

  async getProject(id: string): Promise<Project | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readonly');
        const store = tx.objectStore(PROJECTS_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      const fallback = localStorage.getItem(`instaedit_project_${id}`);
      return fallback ? JSON.parse(fallback) : null;
    }
  },

  async listProjects(): Promise<Project[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readonly');
        const store = tx.objectStore(PROJECTS_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list: Project[] = req.result || [];
          list.sort((a, b) => b.updatedAt - a.updatedAt);
          resolve(list);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to load projects from IndexedDB', err);
      return [];
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(PROJECTS_STORE, 'readwrite');
        const store = tx.objectStore(PROJECTS_STORE);
        const req = store.delete(id);
        req.onsuccess = () => {
          localStorage.removeItem(`instaedit_project_${id}`);
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      localStorage.removeItem(`instaedit_project_${id}`);
    }
  },

  async saveMediaBlob(id: string, blob: Blob): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE, 'readwrite');
        const store = tx.objectStore(MEDIA_STORE);
        const req = store.put({ id, blob });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Could not cache media blob', err);
    }
  },

  async getMediaBlob(id: string): Promise<Blob | null> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(MEDIA_STORE, 'readonly');
        const store = tx.objectStore(MEDIA_STORE);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      return null;
    }
  }
};
