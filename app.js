import { projectManager } from './managers/ProjectManager.js';
import { uiManager } from './managers/UIManager.js';
import { cardManager } from './managers/CardManager.js';
import { initializeEventHandlers } from './event-handlers/mainEventHandlers.js';
import { dragDropManager } from './components/drag-drop.js';
import { filterManager } from './managers/FilterManager.js';
import { contextDock } from './components/context-dock.js';

class IdeaForgeApp {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Initialize managers first
    uiManager.initialize();
    await projectManager.initialize(); // Project manager loads data and the initial project
    cardManager.initialize(); // Card manager needs projects to be loaded
    filterManager.initialize();
    contextDock.initialize();

    // Initialize UI components that depend on data
    this.initializeDragDrop();
    
    // Attach all event listeners
    initializeEventHandlers();

    // Show welcome message if it's the user's first time
    uiManager.showWelcomeIfNeeded();

    // Auto-save on window close
    window.addEventListener('beforeunload', () => projectManager.saveData());
  }

  initializeDragDrop() {
    const cardsContainer = document.getElementById('cards-container');
    dragDropManager.initialize(cardsContainer);
    dragDropManager.enableAutoScroll();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ideaForgeApp = new IdeaForgeApp();
});