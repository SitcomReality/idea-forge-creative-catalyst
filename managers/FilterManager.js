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

        // Category filters
        if (categories.length > 2) { // Only show if more than 'all' and one other category
            html += `
                <div class="filter-group">
                    <span class="filter-label">Category:</span>
                    <div class="filter-options">
                        ${categories.map(cat => `
                            <button class="filter-btn ${this.activeFilters.category === cat ? 'active' : ''}" data-group="category" data-value="${cat}">
                                ${cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        `).join('')}
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