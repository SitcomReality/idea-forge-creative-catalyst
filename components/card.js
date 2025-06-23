import { generateId, formatDate } from '../utils/helpers.js';
import { CARD_CATEGORIES } from '../utils/constants.js';

class CardComponent {
  constructor(cardData) {
    this.data = {
      id: cardData.id || generateId(),
      title: cardData.title || 'New Card',
      category: cardData.category || CARD_CATEGORIES.CONCEPT,
      description: cardData.description || '',
      content: cardData.content || '',
      tags: cardData.tags || [],
      type: cardData.type || 'concept',
      createdAt: cardData.createdAt || Date.now(),
      updatedAt: cardData.updatedAt || Date.now(),
      ...cardData
    };
    
    this.element = null;
    this.eventCallbacks = {};
  }

  render() {
    const card = document.createElement('div');
    card.className = 'design-card';
    card.draggable = true;
    card.dataset.cardId = this.data.id;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-category">${this.formatCategory(this.data.category)}</span>
        <div class="card-actions">
          <button class="btn-icon card-edit" title="Edit card">✏️</button>
          <button class="btn-icon card-enhance" title="Enhance with AI">✨</button>
          <button class="btn-icon card-duplicate" title="Create similar">📋</button>
          <button class="btn-icon card-copy" title="Copy to project">✈️</button>
          <button class="btn-icon card-delete" title="Delete card">🗑️</button>
        </div>
      </div>
      
      <h3 class="card-title">${this.escapeHtml(this.data.title)}</h3>
      
      ${this.data.description ? `<p class="card-description">${this.escapeHtml(this.data.description)}</p>` : ''}
      
      ${this.data.content ? `<div class="card-content">${this.escapeHtml(this.data.content)}</div>` : ''}
      
      <div class="card-footer">
        <div class="card-tags">
          ${this.data.tags.map(tag => `<span class="card-tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
        <div class="card-meta">
          <small>${formatDate(new Date(this.data.updatedAt))}</small>
        </div>
      </div>
    `;

    // Add event listeners
    this.attachEventListeners(card);
    
    this.element = card;
    return card;
  }

  attachEventListeners(card) {
    // Edit button
    const editBtn = card.querySelector('.card-edit');
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerEvent('edit', this.data);
    });

    // Enhance button
    const enhanceBtn = card.querySelector('.card-enhance');
    enhanceBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerEvent('enhance', this.data);
    });

    // Duplicate button
    const duplicateBtn = card.querySelector('.card-duplicate');
    duplicateBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerEvent('duplicate', this.data);
    });

    // Copy button
    const copyBtn = card.querySelector('.card-copy');
    copyBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerEvent('copy', this.data);
    });

    // Delete button
    const deleteBtn = card.querySelector('.card-delete');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerEvent('delete', this.data);
    });

    // Card click
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      this.triggerEvent('select', this.data);
    });

    // Drag events
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', this.data.id);
      this.triggerEvent('dragstart', this.data);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      this.triggerEvent('dragend', this.data);
    });
  }

  update(newData) {
    this.data = { ...this.data, ...newData, updatedAt: Date.now() };
    
    if (this.element) {
      // Update DOM elements
      const title = this.element.querySelector('.card-title');
      if (title) title.innerHTML = this.escapeHtml(this.data.title);

      const description = this.element.querySelector('.card-description');
      if (description) {
        if (this.data.description) {
          description.innerHTML = this.escapeHtml(this.data.description);
          description.style.display = 'block';
        } else {
          description.style.display = 'none';
        }
      }

      const content = this.element.querySelector('.card-content');
      if (content) {
        if (this.data.content) {
          content.innerHTML = this.escapeHtml(this.data.content);
          content.style.display = 'block';
        } else {
          content.style.display = 'none';
        }
      }

      const category = this.element.querySelector('.card-category');
      if (category) category.textContent = this.formatCategory(this.data.category);

      const tags = this.element.querySelector('.card-tags');
      if (tags) {
        tags.innerHTML = this.data.tags
          .map(tag => `<span class="card-tag">${this.escapeHtml(tag)}</span>`)
          .join('');
      }

      const meta = this.element.querySelector('.card-meta small');
      if (meta) meta.textContent = formatDate(new Date(this.data.updatedAt));
    }

    this.triggerEvent('update', this.data);
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.eventCallbacks = {};
  }

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

  formatCategory(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getData() {
    return { ...this.data };
  }

  // Static method to create card from data
  static fromData(data) {
    return new CardComponent(data);
  }
}

export { CardComponent };