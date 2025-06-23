import Sortable from 'sortablejs';
import { cardManager } from '../managers/CardManager.js';
import { CATEGORY_COLORS } from '../utils/constants.js';

class ContextDock {
    constructor() {
        this.dock = document.getElementById('context-dock');
        this.header = document.getElementById('dock-header');
        this.content = document.getElementById('dock-content');
        this.countEl = document.getElementById('dock-count');
        this.toggleBtn = document.getElementById('toggle-dock-btn');
        this.placeholder = document.getElementById('dock-placeholder');
        this.isOpen = false;
        this.sortable = null;
    }

    initialize() {
        this.header.addEventListener('click', () => this.toggle());
        this.content.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-from-dock');
            if (removeBtn) {
                const cardId = removeBtn.dataset.id;
                cardManager.toggleCardSelection(cardId);
            }
        });

        this.initSortable();
        this.initDragDropHandling();
    }

    initSortable() {
        if (this.sortable) this.sortable.destroy();
        this.sortable = new Sortable(this.content, {
            group: 'cards',
            animation: 150,
            ghostClass: 'card-ghost',
            onAdd: (evt) => {
                const cardId = evt.item.dataset.cardId;
                // Add to selection but prevent re-render from cardManager
                if (!cardManager.selectedCardIds.has(cardId)) {
                    cardManager.toggleCardSelection(cardId);
                }
                // The element added by sortable is the original one from the main grid,
                // we need to remove it and let our update method render the correct dock-card
                evt.item.remove();
            }
        });
    }

    initDragDropHandling() {
        this.dock.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dock.classList.add('drag-over');
        });
        this.dock.addEventListener('dragleave', () => {
            this.dock.classList.remove('drag-over');
        });
        this.dock.addEventListener('drop', () => {
            this.dock.classList.remove('drag-over');
        });
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.dock.classList.toggle('open', this.isOpen);
    }

    open() {
        if (!this.isOpen) {
            this.toggle();
        }
    }

    update(selectedCards) {
        this.countEl.textContent = selectedCards.length;
        this.content.innerHTML = '';

        if (selectedCards.length === 0) {
            this.content.appendChild(this.placeholder);
            return;
        }

        selectedCards.forEach(cardData => {
            const dockCard = this.createDockCard(cardData);
            this.content.appendChild(dockCard);
        });
    }

    createDockCard(cardData) {
        const cardEl = document.createElement('div');
        cardEl.className = 'dock-card';
        cardEl.dataset.id = cardData.id;
        cardEl.style.setProperty('--card-category-color', CATEGORY_COLORS[cardData.category] || CATEGORY_COLORS.default);

        cardEl.innerHTML = `
            <div class="dock-card-header">
                <h5 class="dock-card-title">${this.escapeHtml(cardData.title)}</h5>
            </div>
            <p class="dock-card-description">${this.escapeHtml(cardData.description)}</p>
            <button class="remove-from-dock" data-id="${cardData.id}" title="Remove from context">×</button>
        `;
        return cardEl;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

export const contextDock = new ContextDock();