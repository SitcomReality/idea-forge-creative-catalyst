import { storage } from '../utils/storage.js';
import { APP_CONFIG } from '../utils/constants.js';

class ChatManager {
  constructor() {
    this.isProcessing = false;
  }

  async sendMessage(message, history = [], systemPrompt = null) {
    if (this.isProcessing) {
      throw new Error('Already processing a message');
    }

    this.isProcessing = true;

    try {
      // Add user message to history
      const userMessage = {
        role: "user",
        content: message,
        timestamp: Date.now()
      };
      
      history.push(userMessage);

      // Prepare messages for AI
      const messages = [];
      
      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt
        });
      }

      // Add conversation history (last 10 messages to avoid token limits)
      const recentHistory = history
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      messages.push(...recentHistory);

      // Call AI
      const completion = await websim.chat.completions.create({
        messages: messages
      });

      // Add AI response to history
      const aiMessage = {
        role: "assistant",
        content: completion.content,
        timestamp: Date.now()
      };

      history.push(aiMessage);

      // Keep history manageable
      if (history.length > APP_CONFIG.maxChatHistory) {
        history.splice(0, history.length - APP_CONFIG.maxChatHistory);
      }

      return aiMessage;

    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async sendMessageWithJson(message, systemPrompt, schema) {
    if (this.isProcessing) {
      throw new Error('Already processing a message');
    }

    this.isProcessing = true;

    try {
      const messages = [
        {
          role: "system",
          content: `${systemPrompt}\n\nRespond directly with JSON following this schema, and no other text:\n${JSON.stringify(schema, null, 2)}`
        },
        {
          role: "user",
          content: message
        }
      ];

      const completion = await websim.chat.completions.create({
        messages: messages,
        json: true
      });

      const result = JSON.parse(completion.content);
      return result;

    } catch (error) {
      console.error('JSON chat error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }
}

export const chatManager = new ChatManager();