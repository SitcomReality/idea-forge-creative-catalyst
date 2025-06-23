import { CardComponent } from './components/card.js';
import { modalManager } from './components/modal.js';
import { fabManager } from './components/fab.js';
import { inputManager } from './components/input.js';
import { dragDropManager } from './components/drag-drop.js';
import { chatManager } from './ai/chat.js';
import { generationManager } from './ai/generation.js';
import { storage } from './utils/storage.js';
import { generateId, downloadJson } from './utils/helpers.js';

class IdeaForgeApp {
  constructor() {
    this.projects = new Map();
    this.activeProjectId = null;
    this.cardComponents = new Map();
    this.isProcessing = false;
    
    this.initializeElements();
    this.initializeEventListeners();
    this.initializeDragDrop();
    
    // Show welcome message if first time
    this.loadSavedData();
    this.showWelcomeIfNeeded();
  }

  initializeElements() {
    this.cardsContainer = document.getElementById('cards-container');
    this.generateBtn = document.getElementById('generate-btn');
    this.exportBtn = document.getElementById('export-btn');
    this.projectBtn = document.getElementById('project-btn');
    this.currentProjectNameEl = document.getElementById('current-project-name');
    this.addCategoryBtn = document.getElementById('add-category');
    this.addCardBtn = document.getElementById('add-card');
    this.chatMessages = document.getElementById('chat-messages');
    this.chatInput = document.getElementById('chat-input');
    this.sendChatBtn = document.getElementById('send-chat');
    this.toggleAiBtn = document.getElementById('toggle-ai');
  }

  initializeEventListeners() {
    // Header buttons
    this.generateBtn.addEventListener('click', () => this.generateFromConcept());
    this.exportBtn.addEventListener('click', () => this.exportProject());
    this.projectBtn.addEventListener('click', () => this.showProjectManager());
    this.addCategoryBtn.addEventListener('click', () => this.showAddCategoryDialog());
    this.addCardBtn.addEventListener('click', () => this.createNewCard());

    // Input manager events
    inputManager.on('process', (concept) => this.processConceptInput(concept));
    inputManager.on('clear', () => this.onInputClear());

    // Chat events
    this.sendChatBtn.addEventListener('click', () => this.sendChatMessage());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendChatMessage();
      }
    });
    this.toggleAiBtn.addEventListener('click', () => fabManager.close());

    // Drag and drop events
    dragDropManager.on('sort', (data) => this.onCardReorder(data));
    dragDropManager.on('dragStart', () => this.onDragStart());
    dragDropManager.on('dragEnd', () => this.onDragEnd());

    // Auto-save
    window.addEventListener('beforeunload', () => this.saveData());
  }

  initializeDragDrop() {
    dragDropManager.initialize(this.cardsContainer);
    dragDropManager.enableAutoScroll();
  }

  loadSavedData() {
    const savedProjects = storage.loadProjects();
    const savedActiveId = storage.loadActiveProjectId();

    if (savedProjects && savedProjects.size > 0) {
      this.projects = savedProjects;
      this.activeProjectId = savedActiveId && this.projects.has(savedActiveId) 
        ? savedActiveId 
        : this.projects.keys().next().value;
    } else {
      // Create a default project for first-time users
      this.createNewProject('My First Project', false); // Don't save yet
    }

    this.loadProject(this.activeProjectId);
  }

  showWelcomeIfNeeded() {
    const hasShownWelcome = localStorage.getItem('ideaforge_welcome_shown');
    if (!hasShownWelcome) {
      setTimeout(() => {
        this.showWelcomeMessage();
        localStorage.setItem('ideaforge_welcome_shown', 'true');
      }, 1000);
    }
  }

  async showWelcomeMessage() {
    const welcomeContent = `
      <div class="welcome-content">
        <h2>Welcome to Idea Forge! ⚡</h2>
        <p>Transform your ideas into detailed, actionable design components:</p>
        <ul>
          <li>🎯 <strong>Start Simple:</strong> Enter any concept, no matter how vague</li>
          <li>🔧 <strong>Break It Down:</strong> AI generates editable component cards</li>
          <li>✨ <strong>Enhance:</strong> Refine each element individually</li>
          <li>🚀 <strong>Build:</strong> Create comprehensive design systems</li>
        </ul>
        <p>Try entering something like: <em>"A futuristic dashboard for space missions"</em></p>
        <div class="welcome-actions">
          <button class="btn btn-primary" id="start-demo">Try Demo Concept</button>
          <button class="btn btn-ghost" id="close-welcome">Got It</button>
        </div>
      </div>
    `;

    await modalManager.open('Welcome to Idea Forge', welcomeContent);

    // Handle demo button
    document.getElementById('start-demo')?.addEventListener('click', () => {
      modalManager.close();
      inputManager.setValue('A futuristic dashboard for space missions with holographic displays and gesture controls');
      setTimeout(() => this.processConceptInput(inputManager.getValue()), 500);
    });

    document.getElementById('close-welcome')?.addEventListener('click', () => {
      modalManager.close();
      inputManager.focus();
    });
  }

  async processConceptInput(concept) {
    if (this.isProcessing) return;

    this.setProcessingState(true);
    
    try {
      const generatedCards = await generationManager.generateCardsFromConcept(concept);
      
      // Clear existing cards if generating from a new root concept
      if (this.getActiveProject().cards.length > 0) {
        const confirm = await modalManager.showConfirmDialog(
          'Replace existing components?',
          'This will replace all current design components. Are you sure?',
          'Replace'
        );
        if (confirm) {
          this.clearAllCards();
        } else {
          this.setProcessingState(false);
          return;
        }
      }

      // Add cards to our collection
      generatedCards.forEach(cardData => {
        this.addCard(cardData);
      });

      this.saveActiveProject();
      this.showSuccessNotification(`Generated ${generatedCards.length} design components!`);
      
      // Suggest opening AI chat for further refinement
      setTimeout(() => {
        fabManager.pulse();
      }, 2000);

    } catch (error) {
      console.error('Error processing concept:', error);
      this.showErrorNotification('Failed to process concept. Please try again.');
    } finally {
      this.setProcessingState(false);
    }
  }

  async generateFromConcept() {
    const concept = inputManager.getValue();
    if (!concept) {
      inputManager.showError('Please enter a concept first.');
      return;
    }

    await this.processConceptInput(concept);
  }

  async createNewCard(cardData = null) {
    try {
      const result = await modalManager.showCardEditor(cardData);
      if (result) {
        const newCard = {
          id: generateId(),
          ...result,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        this.addCard(newCard);
        this.saveActiveProject();
      }
    } catch (error) {
      console.error('Error creating card:', error);
      this.showErrorNotification('Failed to create card.');
    }
  }

  addCard(cardData) {
    const card = CardComponent.fromData(cardData);
    
    // Set up card event listeners
    card.on('edit', (data) => this.editCard(data.id));
    card.on('enhance', (data) => this.enhanceCard(data.id));
    card.on('duplicate', (data) => this.duplicateCard(data.id));
    card.on('copy', (data) => this.copyCardToProject(data.id));
    card.on('delete', (data) => this.deleteCard(data.id));
    card.on('select', (data) => this.selectCard(data.id));

    // Add to collections
    this.getActiveProject().cards.push(cardData);
    this.cardComponents.set(cardData.id, card);

    // Render the card
    const cardElement = card.render();
    this.cardsContainer.appendChild(cardElement);

    return card;
  }

  async editCard(cardId) {
    const card = this.getActiveProject().cards.find(c => c.id === cardId);
    if (!card) return;

    try {
      const result = await modalManager.showCardEditor(card);
      if (result) {
        // Update card data
        Object.assign(card, result, { updatedAt: Date.now() });
        
        // Update component
        const component = this.cardComponents.get(cardId);
        if (component) {
          component.update(card);
        }
        
        this.saveActiveProject();
      }
    } catch (error) {
      console.error('Error editing card:', error);
      this.showErrorNotification('Failed to edit card.');
    }
  }

  async enhanceCard(cardId) {
    const card = this.getActiveProject().cards.find(c => c.id === cardId);
    if (!card) return;

    if (this.isProcessing) return;
    this.setProcessingState(true);

    try {
      const enhanced = await generationManager.enhanceCard(card);
      
      // Update card data
      Object.assign(card, enhanced);
      
      // Update component
      const component = this.cardComponents.get(cardId);
      if (component) {
        component.update(card);
      }
      
      this.saveActiveProject();
      this.showSuccessNotification('Card enhanced successfully!');

    } catch (error) {
      console.error('Error enhancing card:', error);
      this.showErrorNotification('Failed to enhance card.');
    } finally {
      this.setProcessingState(false);
    }
  }

  async duplicateCard(cardId) {
    const card = this.getActiveProject().cards.find(c => c.id === cardId);
    if (!card) return;

    if (this.isProcessing) return;
    this.setProcessingState(true);

    try {
      const similarCards = await generationManager.generateSimilarCards(card, 1);
      
      if (similarCards.length > 0) {
        this.addCard(similarCards[0]);
        this.saveActiveProject();
        this.showSuccessNotification('Similar card created!');
      }

    } catch (error) {
      console.error('Error duplicating card:', error);
      // Fallback to simple duplication
      const duplicated = {
        ...card,
        id: generateId(),
        title: `${card.title} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      this.addCard(duplicated);
      this.saveActiveProject();
    } finally {
      this.setProcessingState(false);
    }
  }

  async deleteCard(cardId) {
    const confirmed = await modalManager.showConfirmDialog(
      'Delete Card',
      'Are you sure you want to delete this card? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    if (confirmed) {
      // Remove from arrays
      const project = this.getActiveProject();
      project.cards = project.cards.filter(card => card.id !== cardId);
      
      // Remove component
      const component = this.cardComponents.get(cardId);
      if (component) {
        component.destroy();
        this.cardComponents.delete(cardId);
      }
      
      this.saveActiveProject();
      this.showSuccessNotification('Card deleted.');
    }
  }

  selectCard(cardId) {
    // Remove selection from other cards
    this.cardComponents.forEach(component => {
      component.element?.classList.remove('selected');
    });

    // Add selection to clicked card
    const component = this.cardComponents.get(cardId);
    if (component) {
      component.element?.classList.add('selected');
    }
  }

  clearAllCards() {
    this.getActiveProject().cards = [];
    this.cardsContainer.innerHTML = '';
    this.cardComponents.clear();
  }

  renderAllCards() {
    this.cardsContainer.innerHTML = '';
    this.cardComponents.clear();

    const project = this.getActiveProject();
    if (!project) return;

    project.cards.forEach(cardData => {
      const card = CardComponent.fromData(cardData);
      
      // Set up event listeners
      card.on('edit', (data) => this.editCard(data.id));
      card.on('enhance', (data) => this.enhanceCard(data.id));
      card.on('duplicate', (data) => this.duplicateCard(data.id));
      card.on('copy', (data) => this.copyCardToProject(data.id));
      card.on('delete', (data) => this.deleteCard(data.id));
      card.on('select', (data) => this.selectCard(data.id));

      this.cardComponents.set(cardData.id, card);
      
      const cardElement = card.render();
      this.cardsContainer.appendChild(cardElement);
    });
  }

  async sendChatMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isProcessing) return;

    this.chatInput.value = '';
    this.addChatMessage('user', message);
    
    this.setProcessingState(true);
    fabManager.setLoading(true);

    try {
      const project = this.getActiveProject();
      const response = await chatManager.sendMessage(message, project.chatHistory);
      this.addChatMessage('assistant', response.content);
      this.saveActiveProject();
      
    } catch (error) {
      console.error('Chat error:', error);
      this.addChatMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      this.setProcessingState(false);
      fabManager.setLoading(false);
    }
  }

  addChatMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    messageDiv.textContent = content;
    
    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  renderChatHistory() {
    this.chatMessages.innerHTML = '';
    const project = this.getActiveProject();
    if (!project) return;

    project.chatHistory.forEach(message => {
      if (message.role !== 'system') {
        this.addChatMessage(message.role, message.content);
      }
    });
  }

  // Drag and drop handlers
  onCardReorder(data) {
    if (data.moved) {
      // Reorder cards array to match new positions
      const project = this.getActiveProject();
      const cardId = data.cardId;
      const card = project.cards.find(c => c.id === cardId);
      
      if (card) {
        // Remove from old position
        project.cards = project.cards.filter(c => c.id !== cardId);
        // Insert at new position
        project.cards.splice(data.newIndex, 0, card);
        
        this.saveActiveProject();
      }
    }
  }

  onDragStart() {
    dragDropManager.showDropZones();
  }

  onDragEnd() {
    dragDropManager.hideDropZones();
  }

  // Data management
  saveData() {
    storage.saveProjects(this.projects);
    storage.saveActiveProjectId(this.activeProjectId);
  }

  getActiveProject() {
    return this.projects.get(this.activeProjectId);
  }

  saveActiveProject() {
    const project = this.getActiveProject();
    if (project) {
        project.updatedAt = Date.now();
        project.concept = inputManager.getValue();
        this.projects.set(this.activeProjectId, project);
        this.saveData();
    }
  }

  exportProject() {
    const project = this.getActiveProject();
    if (!project) return;

    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      project: project
    };

    const filename = `idea-forge-${project.name.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
    downloadJson(exportData, filename);
    
    this.showSuccessNotification('Design exported successfully!');
  }

  // UI state management
  setProcessingState(processing) {
    this.isProcessing = processing;
    
    // Update input manager
    inputManager.setLoading(processing);
    
    // Update generate button
    if (processing) {
      this.generateBtn.innerHTML = '⏳ Generating...';
      this.generateBtn.disabled = true;
    } else {
      this.generateBtn.innerHTML = '✨ Generate';
      this.generateBtn.disabled = false;
    }

    // Update FAB
    fabManager.setLoading(processing);
  }

  // Notifications
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  onInputClear() {
    // Could add logic here for when input is cleared
  }

  async showAddCategoryDialog() {
    const project = this.getActiveProject();
    const categories = [...new Set(project.cards.map(card => card.category))];
    // Implementation for adding new category would go here
    // For now, just create a new card
    await this.createNewCard();
  }

  // Project Management
  async showProjectManager() {
    const result = await modalManager.showProjectManager({
        projects: Array.from(this.projects.values()),
        activeProjectId: this.activeProjectId
    });

    if (!result) return;

    switch (result.action) {
        case 'switch':
            this.switchProject(result.id);
            break;
        case 'create':
            this.createNewProject(result.name);
            break;
        case 'rename':
            this.renameProject(result.id, result.name);
            break;
        case 'delete':
            this.deleteProject(result.id);
            break;
    }
  }

  loadProject(projectId) {
    this.activeProjectId = projectId;
    const project = this.getActiveProject();

    if (!project) {
      console.error(`Project with id ${projectId} not found.`);
      // Fallback to first project if active one is missing
      if (this.projects.size > 0) {
         this.loadProject(this.projects.keys().next().value);
      }
      return;
    }

    this.currentProjectNameEl.textContent = project.name;
    inputManager.setValue(project.concept);
    this.renderAllCards();
    this.renderChatHistory();

    storage.saveActiveProjectId(this.activeProjectId);
  }

  switchProject(projectId) {
    if (projectId === this.activeProjectId) return;
    this.saveActiveProject(); // Save current project before switching
    this.loadProject(projectId);
    this.showSuccessNotification(`Switched to project: ${this.getActiveProject().name}`);
  }

  createNewProject(name, setActive = true) {
    const newId = `proj_${Date.now()}`;
    const newProject = {
      id: newId,
      name: name,
      concept: '',
      cards: [],
      chatHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.projects.set(newId, newProject);
    if (setActive) {
      this.switchProject(newId);
      this.saveData();
      this.showSuccessNotification(`Project "${name}" created!`);
    } else {
       this.activeProjectId = newId;
    }
  }

  renameProject(projectId, newName) {
    const project = this.projects.get(projectId);
    if (project) {
      project.name = newName;
      project.updatedAt = Date.now();
      this.projects.set(projectId, project);
      if (projectId === this.activeProjectId) {
        this.currentProjectNameEl.textContent = newName;
      }
      this.saveData();
    }
  }

  deleteProject(projectId) {
    if (this.projects.size <= 1) {
      this.showErrorNotification("Cannot delete the only project.");
      return;
    }
    this.projects.delete(projectId);
    if (this.activeProjectId === projectId) {
      // Switch to another project
      this.activeProjectId = this.projects.keys().next().value;
      this.loadProject(this.activeProjectId);
    }
    this.saveData();
  }

  async copyCardToProject(cardId) {
    const cardToCopy = this.getActiveProject().cards.find(c => c.id === cardId);
    if (!cardToCopy) return;

    const targetProjectId = await modalManager.showCopyCardDialog(
        Array.from(this.projects.values()),
        this.activeProjectId
    );

    if (targetProjectId) {
      const targetProject = this.projects.get(targetProjectId);
      if (targetProject) {
        const newCard = {
          ...cardToCopy,
          id: generateId(), // give it a new ID
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        targetProject.cards.push(newCard);
        targetProject.updatedAt = Date.now();
        this.saveData();
        this.showSuccessNotification(`Card copied to "${targetProject.name}"`);
      }
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ideaForgeApp = new IdeaForgeApp();
});

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    color: var(--text-primary);
    padding: 1rem 1.5rem;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    transform: translateX(100%);
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 300px;
  }
  
  .notification.show {
    transform: translateX(0);
    opacity: 1;
  }
  
  .notification-success {
    border-left: 4px solid #10b981;
  }
  
  .notification-error {
    border-left: 4px solid #ef4444;
  }
  
  .notification-info {
    border-left: 4px solid var(--accent-primary);
  }
`;
document.head.appendChild(notificationStyles);