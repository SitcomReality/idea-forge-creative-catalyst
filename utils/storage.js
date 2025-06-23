import { STORAGE_KEYS } from './constants.js';

class StorageManager {
  constructor() {
    this.isLocalStorageAvailable = this.checkLocalStorage();
  }

  checkLocalStorage() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  set(key, value) {
    if (!this.isLocalStorageAvailable) {
      console.warn('localStorage not available');
      return false;
    }

    try {
      localStorage.setItem(key, JSON.stringify({
        data: value,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  get(key, defaultValue = null) {
    if (!this.isLocalStorageAvailable) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);
      return parsed.data;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  remove(key) {
    if (!this.isLocalStorageAvailable) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  clear() {
    if (!this.isLocalStorageAvailable) {
      return false;
    }

    try {
      // Only clear our app's keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Specific methods for our app data
  saveCards(cards) {
    return this.set(STORAGE_KEYS.CARDS, cards);
  }

  loadCards() {
    return this.get(STORAGE_KEYS.CARDS, []);
  }

  saveChatHistory(history) {
    return this.set(STORAGE_KEYS.CHAT_HISTORY, history);
  }

  loadChatHistory() {
    return this.get(STORAGE_KEYS.CHAT_HISTORY, []);
  }

  saveProjects(projects) {
    // Convert Map to Object for JSON serialization
    const projectsObject = Object.fromEntries(projects);
    return this.set(STORAGE_KEYS.PROJECTS, projectsObject);
  }

  loadProjects() {
    const projectsObject = this.get(STORAGE_KEYS.PROJECTS, null);
    if (!projectsObject) return null;
    // Convert Object back to Map
    return new Map(Object.entries(projectsObject));
  }

  saveActiveProjectId(id) {
    return this.set(STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  }

  loadActiveProjectId() {
    return this.get(STORAGE_KEYS.ACTIVE_PROJECT_ID);
  }

  saveAppState(state) {
    return this.set(STORAGE_KEYS.APP_STATE, state);
  }

  loadAppState() {
    return this.get(STORAGE_KEYS.APP_STATE, {});
  }

  saveUserPreferences(prefs) {
    return this.set(STORAGE_KEYS.USER_PREFERENCES, prefs);
  }

  loadUserPreferences() {
    return this.get(STORAGE_KEYS.USER_PREFERENCES, {});
  }
}

export const storage = new StorageManager();