import { projectManager } from './ProjectManager.js';
import { chatManager } from '../ai/chat.js';
import { uiManager } from './UIManager.js';
import { fabManager } from '../components/fab.js';

class ChatUIManager {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
    }

    async sendChatMessage() {
        const message = this.chatInput.value.trim();
        if (!message || uiManager.isProcessing) return;

        this.chatInput.value = '';
        this.addMessageToUI('user', message);
        
        uiManager.setProcessingState(true);
        fabManager.setLoading(true);

        try {
            const project = projectManager.getActiveProject();
            const response = await chatManager.sendMessage(message, project.chatHistory);
            this.addMessageToUI('assistant', response.content);
            projectManager.saveActiveProjectData();
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessageToUI('assistant', 'Sorry, I encountered an error. Please try again.');
        } finally {
            uiManager.setProcessingState(false);
            fabManager.setLoading(false);
        }
    }

    addMessageToUI(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        messageDiv.textContent = content;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    renderChatHistory() {
        this.chatMessages.innerHTML = '';
        const project = projectManager.getActiveProject();
        if (!project) return;
        project.chatHistory.forEach(message => {
            if (message.role !== 'system') {
                this.addMessageToUI(message.role, message.content);
            }
        });
    }
}

export const chatUIManager = new ChatUIManager();

