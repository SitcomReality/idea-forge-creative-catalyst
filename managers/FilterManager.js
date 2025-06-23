class FilterManager {
    constructor() {
        this.filterControls = document.getElementById('filter-controls');
        this.cardsContainer = document.getElementById('cards-container');
        this.activeFilters = {
            category: 'all',
            tags: new Set(),
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
                }
            }
        });
    }

    buildFilterControls(cards) {
        if (!cards || cards.length === 0) {
            this.filterControls.innerHTML = '';
            return;
        }

        const categories = ['all', ...new Set(cards.map(c => c.category))];
        const tags = [...new Set(cards.flatMap(c => c.tags || []))].sort();

        let html = '';

        // Category filters
        if (categories.length > 1) {
            html += `
                <div class="filter-group">
                    <span class="filter-label">Categories:</span>
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

    applyFilters() {
        const { category, tags } = this.activeFilters;
        const cardElements = this.cardsContainer.querySelectorAll('.design-card');

        cardElements.forEach(cardEl => {
            const cardCategory = cardEl.dataset.category;
            const cardTags = new Set(cardEl.dataset.tags.split(',').filter(Boolean));

            const categoryMatch = category === 'all' || cardCategory === category;
            const tagsMatch = tags.size === 0 || [...tags].every(t => cardTags.has(t));
            
            if (categoryMatch && tagsMatch) {
                cardEl.style.display = '';
            } else {
                cardEl.style.display = 'none';
            }
        });
    }
}

export const filterManager = new FilterManager();