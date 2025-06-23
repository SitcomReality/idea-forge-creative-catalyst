import { modalManager } from '../components/modal.js';
import { fabManager } from '../components/fab.js';
import { inputManager } from '../components/input.js';

class UIManager {
    constructor() {
        this.isProcessing = false;
        this.generateBtn = document.getElementById('generate-btn');
        this.notificationContainer = null;
    }

    initialize() {
        this.createNotificationContainer();
    }

    createNotificationContainer() {
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
            transform: translateX(cal(100% + 20px));
            opacity: 0;
            transition: all 0.3s ease;
            max-width: 300px;
          }
          .notification.show {
            transform: translateX(0);
            opacity: 1;
          }
          .notification-success { border-left: 4px solid #10b981; }
          .notification-error { border-left: 4px solid #ef4444; }
          .notification-info { border-left: 4px solid var(--accent-primary); }
        `;
        document.head.appendChild(notificationStyles);
    }
    
    setProcessingState(processing) {
        this.isProcessing = processing;
        inputManager.setLoading(processing);
        this.generateBtn.disabled = processing;
        this.generateBtn.innerHTML = processing ? '⏳ Generating...' : '✨ Generate';
        fabManager.setLoading(processing);
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
          <div class="welcome-content" style="display: flex; flex-direction: column; gap: 1rem;">
            <h2>Welcome to Idea Forge! ⚡</h2>
            <p>Transform your ideas into detailed, actionable design components.</p>
            <p>Try entering something like: <em>"A futuristic dashboard for space missions"</em></p>
            <div class="welcome-actions" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
              <button class="btn btn-primary" id="start-demo">Try Demo Concept</button>
              <button class="btn btn-ghost" id="close-welcome">Got It</button>
            </div>
          </div>
        `;
        await modalManager.open('Welcome to Idea Forge', welcomeContent);
        document.getElementById('start-demo')?.addEventListener('click', () => {
          modalManager.close();
          inputManager.setValue('A futuristic dashboard for space missions with holographic displays and gesture controls');
          setTimeout(() => document.getElementById('process-concept').click(), 200);
        });
        document.getElementById('close-welcome')?.addEventListener('click', () => {
          modalManager.close();
          inputManager.focus();
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    showSuccessNotification(message) { this.showNotification(message, 'success'); }
    showErrorNotification(message) { this.showNotification(message, 'error'); }
}

export const uiManager = new UIManager();

