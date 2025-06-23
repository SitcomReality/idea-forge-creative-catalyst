import { projectManager } from '../managers/ProjectManager.js';
import { cardManager } from '../managers/CardManager.js';
import { chatUIManager } from '../managers/ChatUIManager.js';
import { uiManager } from '../managers/UIManager.js';
import { inputManager } from '../components/input.js';
import { dragDropManager } from '../components/drag-drop.js';
import { generationManager } from '../ai/generation.js';
import { modalManager } from '../components/modal.js';
import { fabManager } from '../components/fab.js';

async function processConceptInput(concept) {
    if (uiManager.isProcessing) return;
    uiManager.setProcessingState(true);
    
    try {
      // Check if project needs a name
      const project = projectManager.getActiveProject();
      if(project && project.name === 'My First Project' && project.cards.length === 0) {
        const schema = { projectName: "string (5 words max)" };
        const result = await generationManager.chatManager.sendMessageWithJson(
          `Give a short, creative name for a project based on this concept: "${concept}"`,
          'You are a creative director. Generate a short, evocative project name. Respond with JSON.',
          schema
        );
        if (result.projectName) {
          projectManager.updateActiveProjectName(result.projectName);
        }
      }

      const generatedCards = await generationManager.generateCardsFromConcept(concept);
      if (projectManager.getActiveProject().cards.length > 0) {
        const confirm = await modalManager.showConfirmDialog(
          'Replace existing components?',
          'This will replace all current design components. Are you sure?',
          'Replace'
        );
        if (confirm) {
          cardManager.clearAllCards();
        } else {
          uiManager.setProcessingState(false);
          return;
        }
      }
      generatedCards.forEach(cardData => cardManager.addCard(cardData));
      projectManager.saveActiveProjectData();
      uiManager.showSuccessNotification(`Generated ${generatedCards.length} design components!`);
      setTimeout(() => fabManager.pulse(), 2000);

    } catch (error) {
      console.error('Error processing concept:', error);
      uiManager.showErrorNotification('Failed to process concept. Please try again.');
    } finally {
      uiManager.setProcessingState(false);
    }
}

function onCardReorder(data) {
    if (!data.moved) return;
    const project = projectManager.getActiveProject();
    const cardId = data.cardId;
    const card = project.cards.find(c => c.id === cardId);
    if (card) {
        project.cards = project.cards.filter(c => c.id !== cardId);
        project.cards.splice(data.newIndex, 0, card);
        projectManager.saveActiveProjectData();
    }
}

export function initializeEventHandlers() {
    // Header buttons
    document.getElementById('generate-btn').addEventListener('click', () => processConceptInput(inputManager.getValue()));
    document.getElementById('export-btn').addEventListener('click', () => projectManager.exportProject());
    document.getElementById('project-btn').addEventListener('click', () => projectManager.showProjectManager());
    document.getElementById('new-project-btn').addEventListener('click', () => projectManager.createNewProject('Untitled Project'));
    document.getElementById('add-card').addEventListener('click', () => cardManager.createNewCardFromDialog());
    
    // Category button (placeholder action)
    document.getElementById('add-category').addEventListener('click', () => cardManager.createNewCardFromDialog());

    // Input manager events
    inputManager.on('process', (concept) => processConceptInput(concept));

    // Chat events
    document.getElementById('send-chat').addEventListener('click', () => chatUIManager.sendChatMessage());
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatUIManager.sendChatMessage();
        }
    });
    document.getElementById('toggle-ai').addEventListener('click', () => fabManager.close());

    // Drag and drop events
    dragDropManager.on('sort', (data) => onCardReorder(data));
    dragDropManager.on('dragStart', () => dragDropManager.showDropZones());
    dragDropManager.on('dragEnd', () => dragDropManager.hideDropZones());
}