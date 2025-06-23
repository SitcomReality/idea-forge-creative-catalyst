import { CardComponent } from '../components/card.js';
import { modalManager } from '../components/modal.js';
import { generationManager } from '../ai/generation.js';
import { projectManager } from './ProjectManager.js';
import { uiManager } from './UIManager.js';
import { generateId } from '../utils/helpers.js';

class CardManager {
  constructor() {
    this.cardComponents = new Map();
    this.cardsContainer = document.getElementById('cards-container');
  }

  initialize() {
    // This manager is initialized after the projectManager,
    // so the initial render is handled by projectManager.loadProject -> this.renderAllCards
  }

  addCard(cardData, fromUserAction = false) {
    const card = new CardComponent(cardData);
    this.setupCardEventListeners(card);

    projectManager.getActiveProject().cards.push(cardData);
    this.cardComponents.set(cardData.id, card);

    const cardElement = card.render();
    this.cardsContainer.appendChild(cardElement);

    if (fromUserAction) {
        projectManager.saveActiveProjectData();
    }
    return card;
  }

  async createNewCardFromDialog(cardData = null) {
    try {
      const result = await modalManager.showCardEditor(cardData);
      if (result) {
        const newCardData = {
          id: cardData?.id || generateId(),
          ...result,
          createdAt: cardData?.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        
        if (cardData && cardData.id) { // This was an edit
            this.updateCard(cardData.id, newCardData, true);
        } else { // This is a new card
            this.addCard(newCardData, true);
        }
      }
    } catch (error) {
      console.error('Error in card dialog:', error);
      uiManager.showErrorNotification('Failed to save card.');
    }
  }

  updateCard(cardId, newData, fromUserAction = false) {
      const project = projectManager.getActiveProject();
      const cardIndex = project.cards.findIndex(c => c.id === cardId);
      if (cardIndex === -1) return;

      Object.assign(project.cards[cardIndex], newData);
      
      const component = this.cardComponents.get(cardId);
      if (component) {
        component.update(project.cards[cardIndex]);
      }
      
      if(fromUserAction) {
        projectManager.saveActiveProjectData();
      }
  }

  async enhanceCard(cardId) {
    const cardData = projectManager.getActiveProject().cards.find(c => c.id === cardId);
    if (!cardData) return;

    if (uiManager.isProcessing) return;
    uiManager.setProcessingState(true);

    try {
      const enhancedData = await generationManager.enhanceCard(cardData);
      this.updateCard(cardId, enhancedData);
      projectManager.saveActiveProjectData();
      uiManager.showSuccessNotification('Card enhanced successfully!');
    } catch (error) {
      console.error('Error enhancing card:', error);
      uiManager.showErrorNotification('Failed to enhance card.');
    } finally {
      uiManager.setProcessingState(false);
    }
  }

  async duplicateCard(cardId) {
    const cardData = projectManager.getActiveProject().cards.find(c => c.id === cardId);
    if (!cardData) return;

    if (uiManager.isProcessing) return;
    uiManager.setProcessingState(true);

    try {
      const similarCards = await generationManager.generateSimilarCards(cardData, 1);
      if (similarCards.length > 0) {
        this.addCard(similarCards[0]);
        projectManager.saveActiveProjectData();
        uiManager.showSuccessNotification('Similar card created!');
      }
    } catch (error) {
      console.error('Error generating similar card:', error);
      const duplicated = { ...cardData, id: generateId(), title: `${cardData.title} (Copy)`, createdAt: Date.now(), updatedAt: Date.now() };
      this.addCard(duplicated);
      projectManager.saveActiveProjectData();
      uiManager.showSuccessNotification('Card duplicated.');
    } finally {
      uiManager.setProcessingState(false);
    }
  }

  async deleteCard(cardId) {
    const confirmed = await modalManager.showConfirmDialog('Delete Card', 'Are you sure you want to delete this card?', 'Delete');
    if (!confirmed) return;

    const project = projectManager.getActiveProject();
    project.cards = project.cards.filter(c => c.id !== cardId);
    
    const component = this.cardComponents.get(cardId);
    if (component) {
      component.destroy();
      this.cardComponents.delete(cardId);
    }
    
    projectManager.saveActiveProjectData();
    uiManager.showSuccessNotification('Card deleted.');
  }

  async copyCardToProject(cardId) {
    const cardToCopy = projectManager.getActiveProject().cards.find(c => c.id === cardId);
    if (!cardToCopy) return;

    const targetProjectId = await modalManager.showCopyCardDialog(Array.from(projectManager.projects.values()), projectManager.activeProjectId);
    if (!targetProjectId) return;

    const targetProject = projectManager.projects.get(targetProjectId);
    if (targetProject) {
        const newCard = { ...cardToCopy, id: generateId(), createdAt: Date.now(), updatedAt: Date.now() };
        targetProject.cards.push(newCard);
        targetProject.updatedAt = Date.now();
        projectManager.saveData(); // Save all projects data
        uiManager.showSuccessNotification(`Card copied to "${targetProject.name}"`);
    }
  }

  selectCard(cardId) {
    this.cardComponents.forEach(component => component.element?.classList.remove('selected'));
    const component = this.cardComponents.get(cardId);
    if (component) component.element?.classList.add('selected');
  }

  clearAllCards() {
    projectManager.getActiveProject().cards = [];
    this.cardsContainer.innerHTML = '';
    this.cardComponents.clear();
  }

  renderAllCards() {
    this.cardsContainer.innerHTML = '';
    this.cardComponents.clear();
    const project = projectManager.getActiveProject();
    if (!project) return;
    project.cards.forEach(cardData => {
        const card = new CardComponent(cardData);
        this.setupCardEventListeners(card);
        this.cardComponents.set(cardData.id, card);
        this.cardsContainer.appendChild(card.render());
    });
  }

  setupCardEventListeners(card) {
    card.on('edit', (data) => this.createNewCardFromDialog(data));
    card.on('enhance', (data) => this.enhanceCard(data.id));
    card.on('duplicate', (data) => this.duplicateCard(data.id));
    card.on('copy', (data) => this.copyCardToProject(data.id));
    card.on('delete', (data) => this.deleteCard(data.id));
    card.on('select', (data) => this.selectCard(data.id));
  }
}

export const cardManager = new CardManager();