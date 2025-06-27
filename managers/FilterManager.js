import { projectManager } from './ProjectManager.js';
import { cardManager } from './CardManager.js';

class FilterManager {
    constructor() {
        this.filterControls = document.getElementById('filter-controls');
        this.cardsContainer = document.getElementById('cards-container');
        this.activeFilters = {
            category: 'all',
            tags: new Set(),
            selection: 'all', // new filter state
        };
    }

    initialize() {
        this.filterControls.addEventListener('click', e => {
            if (e.target.matches('.filter-btn')) {
                const group = e.target.dataset.group;
                const value = e.target.dataset.value;

                if (group === 'category') {
                    this.updateCategoryFilter(value);
                } else if (group === 'tag') {
                    this.updateTagFilter(value);
                } else if (group === 'selection') {
                    this.updateSelectionFilter(value);
                }
            } else if (e.target.matches('[data-action="add-category"]')) {
                e.preventDefault();
                cardManager.createNewCategoryFromDialog();
            }
        });
    }

    buildFilterControls(cards, selectedCardIds = new Set()) {
        if (!cards) {
            this.filterControls.innerHTML = '';
            return;
        }

        const allCount = cards.length;
        const selectedCount = selectedCardIds.size;
        const unselectedCount = allCount - selectedCount;

        const categories = ['all', ...new Set(cards.map(c => c.category))];
        const tags = [...new Set(cards.flatMap(c => c.tags || []))].sort();

        let html = '';

        // Selection filter
        if (allCount > 0) {
            html += `
                <div class="filter-group">
                    <span class="filter-label">Show:</span>
                    <div class="filter-options">
                        <button class="filter-btn ${this.activeFilters.selection === 'all' ? 'active' : ''}" data-group="selection" data-value="all">
                            All (${allCount})
                        </button>
                        <button class="filter-btn ${this.activeFilters.selection === 'selected' ? 'active' : ''}" data-group="selection" data-value="selected">
                            Selected (${selectedCount})
                        </button>
                        <button class="filter-btn ${this.activeFilters.selection === 'unselected' ? 'active' : ''}" data-group="selection" data-value="unselected">
                            Unselected (${unselectedCount})
                        </button>
                    </div>
                </div>
            `;
        }
        
        const { labels } = projectManager.getCategoryConfig();
        const allCardCategories = ['all', ...new Set(cards.map(c => c.category))];

        // Create a union of all possible categories and categories currently in use.
        // This ensures filters exist for defined categories even if no cards use them yet.
        const categoriesToDisplay = [...new Set([...Object.keys(labels), ...allCardCategories])];

        // Category filters
        if (categoriesToDisplay.length > 1) { // Only show if more than 'all'
             let categoryButtons = categoriesToDisplay
                .filter(cat => cat !== 'all') // handle 'all' separately
                .sort() // sort alphabetically
                .map(catKey => {
                    const label = labels[catKey] || catKey; // Fallback to key if label not found
                    return `
                        <button class="filter-btn ${this.activeFilters.category === catKey ? 'active' : ''}" data-group="category" data-value="${catKey}">
                            ${label}
                        </button>
                    `;
                }).join('');

            // Add 'All' button at the beginning
            categoryButtons = `
                <button class="filter-btn ${this.activeFilters.category === 'all' ? 'active' : ''}" data-group="category" data-value="all">
                    All
                </button>
            ` + categoryButtons;

            // Add 'New Category' button at the end
            categoryButtons += `
                <button class="btn btn-ghost btn-small" data-action="add-category" title="New Category" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">+ New</button>
            `;

            html += `
                <div class="filter-group">
                    <span class="filter-label">Category:</span>
                    <div class="filter-options">
                        ${categoryButtons}
                    </div>
                </div>
            `;
        }

        // Tag filters
        if (tags.length > 0) {
            html += `
                <div class="filter-group">
                    <span class="filter-label">Tags:</span>
                    <div class="filter-options">
                        ${tags.map(tag => `
                            <button class="filter-btn ${this.activeFilters.tags.has(tag) ? 'active' : ''}" data-group="tag" data-value="${tag}">
                                ${tag}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        this.filterControls.innerHTML = html;
    }

    updateCategoryFilter(category) {
        this.activeFilters.category = category;
        // Update active class on buttons
        this.filterControls.querySelectorAll('[data-group="category"]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === category);
        });
        this.applyFilters();
    }

    updateTagFilter(tag) {
        if (this.activeFilters.tags.has(tag)) {
            this.activeFilters.tags.delete(tag);
        } else {
            this.activeFilters.tags.add(tag);
        }
        // Update active class on button
        const btn = this.filterControls.querySelector(`[data-group="tag"][data-value="${tag}"]`);
        if (btn) {
            btn.classList.toggle('active');
        }
        this.applyFilters();
    }

    updateSelectionFilter(selection) {
        this.activeFilters.selection = selection;
        // Update active class on buttons
        this.filterControls.querySelectorAll('[data-group="selection"]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === selection);
        });
        this.applyFilters();
    }

    applyFilters() {
        const { category, tags, selection } = this.activeFilters;
        const cardElements = this.cardsContainer.querySelectorAll('.design-card');

        cardElements.forEach(cardEl => {
            const cardCategory = cardEl.dataset.category;
            const cardTags = new Set(cardEl.dataset.tags.split(',').filter(Boolean));
            const isSelected = cardEl.classList.contains('selected');

            const categoryMatch = category === 'all' || cardCategory === category;
            const tagsMatch = tags.size === 0 || [...tags].every(t => cardTags.has(t));
            const selectionMatch = selection === 'all' ||
                                 (selection === 'selected' && isSelected) ||
                                 (selection === 'unselected' && !isSelected);

            if (categoryMatch && tagsMatch && selectionMatch) {
                cardEl.style.display = '';
            } else {
                cardEl.style.display = 'none';
            }
        });
    }
}

export const filterManager = new FilterManager();