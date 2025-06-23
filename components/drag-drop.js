import Sortable from 'sortablejs';

class DragDropManager {
  constructor() {
    this.sortableInstance = null;
    this.eventCallbacks = {};
    this.isDragging = false;
  }

  initialize(container) {
    if (this.sortableInstance) {
      this.destroy();
    }

    this.sortableInstance = new Sortable(container, {
      animation: 300,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      ghostClass: 'card-ghost',
      chosenClass: 'card-chosen',
      dragClass: 'card-drag',
      
      onStart: (evt) => {
        this.isDragging = true;
        evt.item.classList.add('dragging');
        this.triggerEvent('dragStart', {
          element: evt.item,
          oldIndex: evt.oldIndex
        });
      },

      onEnd: (evt) => {
        this.isDragging = false;
        evt.item.classList.remove('dragging');
        
        this.triggerEvent('dragEnd', {
          element: evt.item,
          oldIndex: evt.oldIndex,
          newIndex: evt.newIndex,
          moved: evt.oldIndex !== evt.newIndex
        });
      },

      onSort: (evt) => {
        this.triggerEvent('sort', {
          element: evt.item,
          oldIndex: evt.oldIndex,
          newIndex: evt.newIndex,
          cardId: evt.item.dataset.cardId
        });
      },

      // Custom drag handle
      handle: '.design-card',
      
      // Prevent dragging when clicking on interactive elements
      filter: '.btn-icon, .card-actions button, input, textarea, select',
      
      onFilter: (evt) => {
        // Prevent default drag behavior on filtered elements
        evt.preventDefault();
      }
    });

    // Add CSS classes for drag states
    this.addDragStyles();
  }

  addDragStyles() {
    if (document.querySelector('.drag-drop-styles')) return;

    const styles = document.createElement('style');
    styles.className = 'drag-drop-styles';
    styles.textContent = `
      .card-ghost {
        opacity: 0.3;
        background: var(--accent-primary);
        border: 2px dashed var(--accent-primary);
        transform: rotate(0deg);
      }
      
      .card-ghost * {
        visibility: hidden;
      }
      
      .card-chosen {
        cursor: grabbing !important;
        transform: scale(1.02);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
      }
      
      .card-drag {
        transform: rotate(5deg) scale(0.95);
        opacity: 0.8;
      }
      
      .cards-container.drag-active {
        background: rgba(99, 102, 241, 0.05);
        border-radius: var(--radius-lg);
      }
      
      .sortable-fallback {
        opacity: 0.8;
        transform: rotate(5deg);
      }
    `;
    
    document.head.appendChild(styles);
  }

  destroy() {
    if (this.sortableInstance) {
      this.sortableInstance.destroy();
      this.sortableInstance = null;
    }
  }

  // Enable/disable drag and drop
  setEnabled(enabled) {
    if (this.sortableInstance) {
      this.sortableInstance.option('disabled', !enabled);
    }
  }

  // Get current order of cards
  getOrder() {
    if (!this.sortableInstance) return [];
    
    return this.sortableInstance.toArray();
  }

  // Set order of cards
  setOrder(order) {
    if (!this.sortableInstance) return;
    
    this.sortableInstance.sort(order);
  }

  // Add visual feedback for drag operations
  showDropZones() {
    const container = this.sortableInstance?.el;
    if (container) {
      container.classList.add('drag-active');
    }
  }

  hideDropZones() {
    const container = this.sortableInstance?.el;
    if (container) {
      container.classList.remove('drag-active');
    }
  }

  // Event system
  on(event, callback) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }

  off(event, callback) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event] = this.eventCallbacks[event].filter(cb => cb !== callback);
    }
  }

  triggerEvent(event, data) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => callback(data));
    }
  }

  // Utility methods
  isDraggingActive() {
    return this.isDragging;
  }

  // Auto-scroll during drag
  enableAutoScroll() {
    if (this.sortableInstance) {
      this.sortableInstance.option('scroll', true);
      this.sortableInstance.option('scrollSensitivity', 100);
      this.sortableInstance.option('scrollSpeed', 10);
    }
  }

  disableAutoScroll() {
    if (this.sortableInstance) {
      this.sortableInstance.option('scroll', false);
    }
  }
}

export const dragDropManager = new DragDropManager();

