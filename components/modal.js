class ModalManager {
  constructor() {
    this.overlay = document.getElementById('modal-overlay');
    this.modal = document.getElementById('modal');
    this.title = document.getElementById('modal-title');
    this.content = document.getElementById('modal-content');
    this.closeBtn = document.getElementById('close-modal');
    
    this.isOpen = false;
    this.currentResolve = null;
    
    this.initEventListeners();
  }

  initEventListeners() {
    // Close button
    this.closeBtn.addEventListener('click', () => {
      this.close();
    });

    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(title, content, options = {}) {
    return new Promise((resolve) => {
      this.currentResolve = resolve;
      
      this.title.textContent = title;
      
      if (typeof content === 'string') {
        this.content.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.content.innerHTML = '';
        this.content.appendChild(content);
      }

      this.overlay.classList.add('open');
      this.isOpen = true;

      // Focus management
      if (options.autoFocus !== false) {
        const firstInput = this.content.querySelector('input, textarea, select, button');
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 100);
        }
      }
    });
  }

  close(result = null) {
    this.overlay.classList.remove('open');
    this.isOpen = false;
    
    if (this.currentResolve) {
      this.currentResolve(result);
      this.currentResolve = null;
    }
    
    // Clear content after transition
    setTimeout(() => {
      if (!this.isOpen) {
        this.content.innerHTML = '';
      }
    }, 300);
  }

  // Specific modal types
  async showCardEditor(cardData = null) {
    const isEdit = !!cardData;
    const data = cardData || {
      title: '',
      category: 'concept',
      description: '',
      content: '',
      tags: []
    };

    const form = document.createElement('form');
    form.className = 'card-editor-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="card-title">Title</label>
        <input type="text" id="card-title" name="title" value="${this.escapeHtml(data.title)}" required>
      </div>
      
      <div class="form-group">
        <label for="card-category">Category</label>
        <select id="card-category" name="category">
          <option value="concept" ${data.category === 'concept' ? 'selected' : ''}>Concept</option>
          <option value="visual" ${data.category === 'visual' ? 'selected' : ''}>Visual</option>
          <option value="interaction" ${data.category === 'interaction' ? 'selected' : ''}>Interaction</option>
          <option value="content" ${data.category === 'content' ? 'selected' : ''}>Content</option>
          <option value="technical" ${data.category === 'technical' ? 'selected' : ''}>Technical</option>
          <option value="aesthetic" ${data.category === 'aesthetic' ? 'selected' : ''}>Aesthetic</option>
          <option value="functional" ${data.category === 'functional' ? 'selected' : ''}>Functional</option>
          <option value="user-experience" ${data.category === 'user-experience' ? 'selected' : ''}>User Experience</option>
          <option value="branding" ${data.category === 'branding' ? 'selected' : ''}>Branding</option>
          <option value="performance" ${data.category === 'performance' ? 'selected' : ''}>Performance</option>
          <option value="accessibility" ${data.category === 'accessibility' ? 'selected' : ''}>Accessibility</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="card-description">Description</label>
        <textarea id="card-description" name="description" rows="3">${this.escapeHtml(data.description)}</textarea>
      </div>
      
      <div class="form-group">
        <label for="card-content">Content</label>
        <textarea id="card-content" name="content" rows="6">${this.escapeHtml(data.content)}</textarea>
      </div>
      
      <div class="form-group">
        <label for="card-tags">Tags (comma-separated)</label>
        <input type="text" id="card-tags" name="tags" value="${data.tags.join(', ')}">
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancel-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Card</button>
      </div>
    `;

    const result = await this.open(
      isEdit ? 'Edit Card' : 'Create New Card',
      form
    );

    return new Promise((resolve) => {
      const cancelBtn = form.querySelector('#cancel-btn');
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const result = {
          title: formData.get('title'),
          category: formData.get('category'),
          description: formData.get('description'),
          content: formData.get('content'),
          tags: formData.get('tags')
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        };
        
        this.close();
        resolve(result);
      });

      cancelBtn.addEventListener('click', () => {
        this.close();
        resolve(null);
      });
    });
  }

  async showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
      <p class="confirm-message">${this.escapeHtml(message)}</p>
      <div class="confirm-actions">
        <button type="button" class="btn btn-ghost" id="confirm-cancel">${cancelText}</button>
        <button type="button" class="btn btn-primary" id="confirm-ok">${confirmText}</button>
      </div>
    `;

    await this.open(title, dialog);

    return new Promise((resolve) => {
      const cancelBtn = dialog.querySelector('#confirm-cancel');
      const confirmBtn = dialog.querySelector('#confirm-ok');

      cancelBtn.addEventListener('click', () => {
        this.close();
        resolve(false);
      });

      confirmBtn.addEventListener('click', () => {
        this.close();
        resolve(true);
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export const modalManager = new ModalManager();

