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
    this.cards = [];
    this.cardComponents = new Map();
    this.chatHistory = [];
    this.isProcessing = false;
    
    this.initializeElements();
    this.initializeEventListeners();
    this.loadSavedData();
    this.initializeDragDrop();
    
    // Show welcome message if first time
    this.showWelcomeIfNeeded();
  }

  initializeElements() {
    this.cardsContainer = document.getElementById('cards-container');
    this.generateBtn = document.getElementById('generate-btn');
    this.exportBtn = document.getElementById('export-btn');
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
    this.exportBtn.addEventListener('click', () => this.exportData());
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
    setInterval(() => this.autoSave(), 30000);
  }

  initializeDragDrop() {
    dragDropManager.initialize(this.cardsContainer);
    dragDropManager.enableAutoScroll();
  }

  loadSavedData() {
    // Load cards
    const savedCards = storage.loadCards();
    if (savedCards.length > 0) {
      this.cards = savedCards;
      this.renderAllCards();
    }

    // Load chat history
    this.chatHistory = storage.loadChatHistory();
    this.renderChatHistory();
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
      
      // Add cards to our collection
      generatedCards.forEach(cardData => {
        this.addCard(cardData);
      });

      this.saveData();
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
        this.saveData();
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
    card.on('delete', (data) => this.deleteCard(data.id));
    card.on('select', (data) => this.selectCard(data.id));

    // Add to collections
    this.cards.push(cardData);
    this.cardComponents.set(cardData.id, card);

    // Render the card
    const cardElement = card.render();
    this.cardsContainer.appendChild(cardElement);

    return card;
  }

  async editCard(cardId) {
    const card = this.cards.find(c => c.id === cardId);
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
        
        this.saveData();
      }
    } catch (error) {
      console.error('Error editing card:', error);
      this.showErrorNotification('Failed to edit card.');
    }
  }

  async enhanceCard(cardId) {
    const card = this.cards.find(c => c.id === cardId);
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
      
      this.saveData();
      this.showSuccessNotification('Card enhanced successfully!');

    } catch (error) {
      console.error('Error enhancing card:', error);
      this.showErrorNotification('Failed to enhance card.');
    } finally {
      this.setProcessingState(false);
    }
  }

  async duplicateCard(cardId) {
    const card = this.cards.find(c => c.id === cardId);
    if (!card) return;

    if (this.isProcessing) return;
    this.setProcessingState(true);

    try {
      const similarCards = await generationManager.generateSimilarCards(card, 1);
      
      if (similarCards.length > 0) {
        this.addCard(similarCards[0]);
        this.saveData();
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
      this.saveData();
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
      this.cards = this.cards.filter(card => card.id !== cardId);
      
      // Remove component
      const component = this.cardComponents.get(cardId);
      if (component) {
        component.destroy();
        this.cardComponents.delete(cardId);
      }
      
      this.saveData();
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

  renderAllCards() {
    this.cardsContainer.innerHTML = '';
    this.cardComponents.clear();

    this.cards.forEach(cardData => {
      const card = CardComponent.fromData(cardData);
      
      // Set up event listeners
      card.on('edit', (data) => this.editCard(data.id));
      card.on('enhance', (data) => this.enhanceCard(data.id));
      card.on('duplicate', (data) => this.duplicateCard(data.id));
      card.on('delete', (data) => this.deleteCard(data.id));
      card.on('select', (data) => this.selectCard(data.id));

      this.cardComponents.set(cardData.id, card);
      
      const cardElement = card.render();
      this.cardsContainer.appendChild(cardElement);
    });
  }

  // Chat functionality
  async sendChatMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isProcessing) return;

    this.chatInput.value = '';
    this.addChatMessage('user', message);
    
    this.setProcessingState(true);
    fabManager.setLoading(true);

    try {
      const response = await chatManager.sendMessage(message);
      this.addChatMessage('assistant', response.content);
      
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
    this.chatHistory.forEach(message => {
      if (message.role !== 'system') {
        this.addChatMessage(message.role, message.content);
      }
    });
  }

  // Drag and drop handlers
  onCardReorder(data) {
    if (data.moved) {
      // Reorder cards array to match new positions
      const cardId = data.cardId;
      const card = this.cards.find(c => c.id === cardId);
      
      if (card) {
        // Remove from old position
        this.cards = this.cards.filter(c => c.id !== cardId);
        // Insert at new position
        this.cards.splice(data.newIndex, 0, card);
        
        this.saveData();
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
    storage.saveCards(this.cards);
    storage.saveChatHistory(this.chatHistory);
  }

  autoSave() {
    if (this.cards.length > 0) {
      this.saveData();
    }
  }

  exportData() {
    const exportData = {
      version: '1.0.0',
      timestamp: Date.now(),
      concept: inputManager.getValue(),
      cards: this.cards,
      metadata: {
        cardCount: this.cards.length,
        categories: [...new Set(this.cards.map(c => c.category))],
        createdAt: Math.min(...this.cards.map(c => c.createdAt)),
        updatedAt: Math.max(...this.cards.map(c => c.updatedAt))
      }
    };

    const filename = `idea-forge-export-${new Date().toISOString().split('T')[0]}.json`;
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
    const categories = [...new Set(this.cards.map(card => card.category))];
    // Implementation for adding new category would go here
    // For now, just create a new card
    await this.createNewCard();
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

