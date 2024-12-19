export function openDB(dbName: string, version: number = 1) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('audioCache')) {
        db.createObjectStore('audioCache');
      }
    };
  });
}

export async function getFromCache(key: string): Promise<Blob | null> {
  try {
    const db = await openDB('ttsCache');
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('audioCache', 'readonly');
      const store = transaction.objectStore('audioCache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Error accessing cache:', error);
    return null;
  }
}

export async function saveToCache(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB('ttsCache');
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('audioCache', 'readwrite');
      const store = transaction.objectStore('audioCache');
      const request = store.put(blob, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
} 