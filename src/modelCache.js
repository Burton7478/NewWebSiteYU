export default class ModelCache {
    constructor(dbName = "modelDB", storeName = "models") {
        this.db = null;
        this.dbName = dbName;
        this.storeName = storeName;
    }

    // 初始化数据库
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "url" });
                }
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve();
            };
            request.onerror = reject;
        });
    }

    // 缓存模型
    async cacheModel(url, blob) {
        const tx = this.db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        store.put({ url, blob });
        return new Promise((resolve) => {
            tx.oncomplete = resolve;
        });
    }

    // 读取模型
    async getModel(url) {
        const tx = this.db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const request = store.get(url);
        return new Promise((resolve, reject) => {
            request.onsuccess = (e) => resolve(e.target.result?.blob);
            request.onerror = reject;
        });
    }
}
