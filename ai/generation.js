import { chatManager } from './chat.js';
import { AI_PROMPTS, CARD_CATEGORIES, CARD_TYPES } from '../utils/constants.js';
import { generateId } from '../utils/helpers.js';
import { projectManager } from '../managers/ProjectManager.js';

class GenerationManager {
  constructor() {
    this.generationQueue = [];
    this.isGenerating = false;
  }

  async generateCardsFromConcept(concept) {
    const schema = {
      cards: [
        {
          title: "string",
          category: "string",
          description: "string", 
          content: "string",
          tags: ["string"],
          type: "string"
        }
      ]
    };

    const { labels } = projectManager.getCategoryConfig();
    const categoryList = Object.keys(labels).map(key => `'${key}'`).join(', ');
    const systemPrompt = AI_PROMPTS.GENERATE_CARDS.replace('{{VALID_CATEGORIES}}', categoryList);

    try {
      const result = await chatManager.sendMessageWithJson(
        `Generate design component cards for this concept: "${concept}"`,
        systemPrompt,
        schema
      );

      // Process and validate the generated cards
      const cards = result.cards.map(card => ({
        id: generateId(),
        title: card.title || 'Untitled Card',
        category: this.validateCategory(card.category),
        description: card.description || '',
        content: card.content || '',
        tags: Array.isArray(card.tags) ? card.tags : [],
        type: this.validateType(card.type),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));

      return cards;

    } catch (error) {
      console.error('Error generating cards:', error);
      throw new Error('Failed to generate design cards. Please try again.');
    }
  }

  async generateFromContext(contextCards, concept, count = 5) {
    const schema = {
      cards: [
        {
          title: "string",
          category: "string",
          description: "string", 
          content: "string",
          tags: ["string"],
          type: "string"
        }
      ]
    };

    const { labels } = projectManager.getCategoryConfig();
    const categoryList = Object.keys(labels).map(key => `'${key}'`).join(', ');

    const systemPrompt = `You are a creative design assistant. Based on the provided context of existing design components, generate ${count} *new* and *complementary* design cards.

- The user has selected these cards as a foundation: ${JSON.stringify(contextCards)}.
- The original project concept is: "${concept}".
- DO NOT regenerate or simply modify the provided components.
- Create new cards that expand on the existing ideas, fill in design gaps, or offer alternative approaches that are thematically consistent with the provided context.
- The new cards should feel like they belong to the same project as the context cards.
- For the 'category' field, you MUST use one of the following exact string values: ${categoryList}`;

    try {
        const result = await chatManager.sendMessageWithJson(
            `Generate ${count} new cards based on the provided context.`,
            systemPrompt,
            schema
        );

        const cards = result.cards.map(card => ({
            id: generateId(),
            title: card.title || 'Untitled Card',
            category: this.validateCategory(card.category),
            description: card.description || '',
            content: card.content || '',
            tags: Array.isArray(card.tags) ? card.tags : [],
            type: this.validateType(card.type),
            createdAt: Date.now(),
            updatedAt: Date.now()
        }));

        return cards;

    } catch (error) {
        console.error('Error generating from context:', error);
        throw new Error('Failed to generate new cards. Please try again.');
    }
  }

  async enhanceCard(card) {
    const schema = {
      title: "string",
      category: "string", 
      description: "string",
      content: "string",
      tags: ["string"],
      type: "string",
      enhancements: ["string"]
    };

    try {
      const result = await chatManager.sendMessageWithJson(
        `Enhance this design card: ${JSON.stringify(card)}`,
        AI_PROMPTS.ENHANCE_CARD,
        schema
      );

      return {
        ...card,
        title: result.title || card.title,
        category: this.validateCategory(result.category || card.category),
        description: result.description || card.description,
        content: result.content || card.content,
        tags: Array.isArray(result.tags) ? result.tags : card.tags,
        type: this.validateType(result.type || card.type),
        updatedAt: Date.now(),
        enhancements: result.enhancements || []
      };

    } catch (error) {
      console.error('Error enhancing card:', error);
      throw new Error('Failed to enhance card. Please try again.');
    }
  }

  async generateSimilarCards(card, count = 3) {
    const schema = {
      cards: [
        {
          title: "string",
          category: "string",
          description: "string",
          content: "string", 
          tags: ["string"],
          type: "string"
        }
      ]
    };

    try {
      const result = await chatManager.sendMessageWithJson(
        `Generate ${count} similar design cards based on this one: ${JSON.stringify(card)}`,
        `Generate variations and related design components based on the provided card. Create cards that complement or extend the original concept while maintaining design coherence.`,
        schema
      );

      const cards = result.cards.map(newCard => ({
        id: generateId(),
        title: newCard.title || 'Similar Card',
        category: this.validateCategory(newCard.category || card.category),
        description: newCard.description || '',
        content: newCard.content || '',
        tags: Array.isArray(newCard.tags) ? newCard.tags : [],
        type: this.validateType(newCard.type || card.type),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentId: card.id
      }));

      return cards;

    } catch (error) {
      console.error('Error generating similar cards:', error);
      throw new Error('Failed to generate similar cards. Please try again.');
    }
  }

  async critiqueConcept(cards, originalConcept = '') {
    try {
      const cardsData = cards.map(card => ({
        title: card.title,
        category: card.category,
        description: card.description,
        content: card.content
      }));

      const message = `Original concept: "${originalConcept}"\n\nCurrent design cards: ${JSON.stringify(cardsData, null, 2)}`;

      const critique = await chatManager.sendMessage(message, AI_PROMPTS.CRITIQUE_CONCEPT);
      
      return critique.content;

    } catch (error) {
      console.error('Error getting critique:', error);
      throw new Error('Failed to generate critique. Please try again.');
    }
  }

  validateCategory(category) {
    const { labels } = projectManager.getCategoryConfig();
    const validCategories = Object.keys(labels);
    return validCategories.includes(category) ? category : CARD_CATEGORIES.CONCEPT;
  }

  validateType(type) {
    const validTypes = Object.values(CARD_TYPES);
    return validTypes.includes(type) ? type : CARD_TYPES.CONCEPT;
  }

  // Queue system for batch operations
  queueGeneration(operation) {
    return new Promise((resolve, reject) => {
      this.generationQueue.push({ operation, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isGenerating || this.generationQueue.length === 0) {
      return;
    }

    this.isGenerating = true;

    while (this.generationQueue.length > 0) {
      const { operation, resolve, reject } = this.generationQueue.shift();
      
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Small delay between operations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.isGenerating = false;
  }
}

export const generationManager = new GenerationManager();