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

  async showCopyCardDialog(projects, currentProjectId) {
    const otherProjects = projects.filter(p => p.id !== currentProjectId);

    if (otherProjects.length === 0) {
      this.open('Copy Card', '<p>No other projects available to copy to.</p>');
      return Promise.resolve(null);
    }
    
    const form = document.createElement('form');
    form.className = 'copy-card-form';
    form.innerHTML = `
      <div class="form-group">
        <label for="project-select">Select a project to copy this card to:</label>
        <select id="project-select" name="projectId" required>
          ${otherProjects.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" id="cancel-copy-btn">Cancel</button>
        <button type="submit" class="btn btn-primary">Copy Card</button>
      </div>
    `;

    await this.open('Copy Card to Project', form);

    return new Promise((resolve) => {
        const cancelBtn = form.querySelector('#cancel-copy-btn');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const projectId = formData.get('projectId');
            this.close();
            resolve(projectId);
        });

        cancelBtn.addEventListener('click', () => {
            this.close();
            resolve(null);
        });
    });
  }

  async showProjectManager({ projects, activeProjectId }) {
    console.log('[ProjectManagerModal] showProjectManager called with:', { projects, activeProjectId });

    return new Promise((resolve) => {
        const container = document.createElement('div');
        container.className = 'project-manager';
        container.innerHTML = `
            <div class="project-list-container">
                <h4>Your Projects</h4>
                <ul class="project-list">
                    ${projects.map(p => `
                        <li class="project-item ${p.id === activeProjectId ? 'active' : ''}" data-id="${p.id}">
                            <span class="project-name">${this.escapeHtml(p.name)}</span>
                            <div class="project-actions">
                                <button type="button" class="btn-icon rename-project" title="Rename">✏️</button>
                                <button type="button" class="btn-icon delete-project" title="Delete">🗑️</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="new-project-container">
                <h4>Create New Project</h4>
                <form class="new-project-form" autocomplete="off">
                    <input type="text" placeholder="New project name..." class="new-project-input" required />
                    <button type="submit" class="btn btn-primary new-project-submit">Create</button>
                </form>
            </div>
        `;

        const handleResult = (result) => {
            console.log('[ProjectManagerModal] handleResult called with:', result);
            this.close(); // Only close the modal. The outer promise will resolve.
            resolve(result); // Resolve the outer promise with the action.
        };

        // This makes sure we resolve with null if the modal is closed by other means (e.g., ESC key, close button)
        // The `open` method returns a promise that resolves when the modal is closed.
        // We link our `showProjectManager` promise's resolution to the open/close cycle.
        this.open('Project Manager', container, { autoFocus: false }).then(result => {
             console.log('[ProjectManagerModal] Modal closed via external means (ESC, overlay click, etc). Resolving with:', result);
             resolve(result || null); // Ensure we resolve, even if result is undefined.
        });

        console.log('[ProjectManagerModal] Modal opened. Attaching event listeners...');

        // Switch project: click on project-item or project-name
        container.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't trigger if an action button was clicked
                if (e.target.closest('.project-actions')) return;
                
                e.preventDefault();
                const projectId = e.currentTarget.dataset.id;
                console.log('[ProjectManagerModal] CLICK: Switch project to', projectId);
                handleResult({ action: 'switch', id: projectId });
            });
        });

        // Rename project: click on pencil icon
        container.querySelectorAll('.rename-project').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // prevent project switch
                const item = e.currentTarget.closest('.project-item');
                const projectId = item.dataset.id;
                const currentName = item.querySelector('.project-name').textContent;
                console.log('[ProjectManagerModal] CLICK: Rename project', { projectId, currentName });

                const newName = prompt(`Rename project "${currentName}":`, currentName);
                
                if (newName && newName.trim() && newName.trim() !== currentName) {
                    handleResult({ action: 'rename', id: projectId, name: newName.trim() });
                } else {
                    console.log('[ProjectManagerModal] Rename cancelled.');
                }
            });
        });

        // Delete project
        container.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // prevent project switch
                const item = e.currentTarget.closest('.project-item');
                const projectId = item.dataset.id;
                const project = projects.find(p => p.id === projectId);

                console.log('[ProjectManagerModal] CLICK: Delete project', { projectId });

                if (projects.length <= 1) {
                    this.showErrorNotification("You cannot delete the only project.");
                    return;
                }
                
                // Using the app's built-in confirm dialog for consistency
                this.showConfirmDialog(
                    'Delete Project',
                    `Delete "${project.name}"?\nThis will delete all data associated with this project. This action cannot be undone.`,
                    'Delete Project'
                ).then(confirmed => {
                    if (confirmed) {
                        handleResult({ action: 'delete', id: projectId });
                    } else {
                        console.log('[ProjectManagerModal] Delete cancelled.');
                    }
                });
            });
        });

        // Create new project (prefer submit event on form)
        const form = container.querySelector('.new-project-form');
        const input = form.querySelector('.new-project-input');
        form.addEventListener('submit', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            const name = input.value.trim();
            console.log('[ProjectManagerModal] SUBMIT: Create new project with name:', name);
            if (name) {
                handleResult({ action: 'create', name });
            }
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

    // This promise will be resolved by the button clicks.
    const confirmationPromise = new Promise((resolve) => {
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

    // Open the modal. The `open` method itself returns a promise
    // that resolves when the modal is closed by any means (ESC, overlay click, etc.).
    // We can use this to handle cancellation if the user doesn't click a button.
    this.open(title, dialog).then(() => {
        // If the modal is closed without a button press, the confirmation promise
        // might not have resolved yet. We can treat this as a cancellation.
        // However, our button handlers already call close(), which resolves the `open` promise.
        // And they also resolve the `confirmationPromise`. This setup is fine.
    });

    // Return the promise that is controlled by the buttons.
    return confirmationPromise;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showErrorNotification(message) {
    this.open('Error', `<p>${this.escapeHtml(message)}</p>`);
  }
}

export const modalManager = new ModalManager();