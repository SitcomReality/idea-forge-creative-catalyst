import { debounce } from '../utils/helpers.js';

class InputManager {
  constructor() {
    this.conceptInput = document.getElementById('concept-input');
    this.clearBtn = document.getElementById('clear-input');
    this.processBtn = document.getElementById('process-concept');
    
    this.eventCallbacks = {};
    this.autoSaveEnabled = true;
    
    this.initEventListeners();
    this.loadSavedInput();
  }

  initEventListeners() {
    // Auto-save input as user types
    this.conceptInput.addEventListener('input', debounce(() => {
      if (this.autoSaveEnabled) {
        this.saveInput();
      }
      this.updateButtonStates();
      this.triggerEvent('input', this.conceptInput.value);
    }, 500));

    // Clear button
    this.clearBtn.addEventListener('click', () => {
      this.clear();
    });

    // Process button
    this.processBtn.addEventListener('click', () => {
      this.processConcept();
    });

    // Enter key handling
    this.conceptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.processConcept();
      }
    });

    // Focus and blur events
    this.conceptInput.addEventListener('focus', () => {
      this.triggerEvent('focus');
    });

    this.conceptInput.addEventListener('blur', () => {
      this.triggerEvent('blur');
    });
  }

  clear() {
    this.conceptInput.value = '';
    this.updateButtonStates();
    this.saveInput();
    this.triggerEvent('clear');
    this.conceptInput.focus();
  }

  processConcept() {
    const concept = this.conceptInput.value.trim();
    
    if (!concept) {
      this.showError('Please enter a concept or idea first.');
      return;
    }

    this.triggerEvent('process', concept);
  }

  updateButtonStates() {
    const hasText = this.conceptInput.value.trim().length > 0;
    
    this.clearBtn.disabled = !hasText;
    this.processBtn.disabled = !hasText;
    
    if (hasText) {
      this.clearBtn.classList.remove('btn-disabled');
      this.processBtn.classList.remove('btn-disabled');
    } else {
      this.clearBtn.classList.add('btn-disabled');
      this.processBtn.classList.add('btn-disabled');
    }
  }

  setValue(value) {
    this.conceptInput.value = value;
    this.updateButtonStates();
    this.saveInput();
  }

  getValue() {
    return this.conceptInput.value.trim();
  }

  setPlaceholder(placeholder) {
    this.conceptInput.placeholder = placeholder;
  }

  focus() {
    this.conceptInput.focus();
  }

  setLoading(loading) {
    this.processBtn.disabled = loading;
    
    if (loading) {
      this.processBtn.innerHTML = '⏳ Processing...';
      this.conceptInput.disabled = true;
    } else {
      this.processBtn.innerHTML = 'Process Concept';
      this.conceptInput.disabled = false;
    }
  }

  showError(message) {
    // Create or update error message
    let errorElement = this.conceptInput.parentNode.querySelector('.input-error');
    
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'input-error';
      this.conceptInput.parentNode.appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Add error styling
    this.conceptInput.classList.add('input-error-state');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.clearError();
    }, 5000);
  }

  clearError() {
    const errorElement = this.conceptInput.parentNode.querySelector('.input-error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
    
    this.conceptInput.classList.remove('input-error-state');
  }

  saveInput() {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('ideaforge_current_input', this.conceptInput.value);
    }
  }

  loadSavedInput() {
    if (typeof Storage !== 'undefined') {
      const saved = localStorage.getItem('ideaforge_current_input');
      if (saved) {
        this.conceptInput.value = saved;
        this.updateButtonStates();
      }
    }
  }

  // Auto-complete suggestions
  showSuggestions(suggestions) {
    this.clearSuggestions();
    
    if (!suggestions || suggestions.length === 0) return;

    const suggestionsList = document.createElement('ul');
    suggestionsList.className = 'input-suggestions';
    
    suggestions.forEach(suggestion => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.textContent = suggestion;
      
      li.addEventListener('click', () => {
        this.setValue(suggestion);
        this.clearSuggestions();
        this.processConcept();
      });
      
      suggestionsList.appendChild(li);
    });

    this.conceptInput.parentNode.appendChild(suggestionsList);
  }

  clearSuggestions() {
    const suggestions = this.conceptInput.parentNode.querySelector('.input-suggestions');
    if (suggestions) {
      suggestions.remove();
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
}

export const inputManager = new InputManager();

