class FABManager {
  constructor() {
    this.fab = document.getElementById('fab');
    this.aiPanel = document.getElementById('ai-panel');
    this.isOpen = false;
    
    this.initEventListeners();
  }

  initEventListeners() {
    this.fab.addEventListener('click', () => {
      this.toggle();
    });
  }

  toggle() {
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.open();
    } else {
      this.close();
    }
  }

  open() {
    this.aiPanel.classList.add('open');
    this.fab.classList.add('panel-open');
    this.isOpen = true;
    
    // Focus on chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      setTimeout(() => chatInput.focus(), 300);
    }
  }

  close() {
    this.aiPanel.classList.remove('open');
    this.fab.classList.remove('panel-open');
    this.isOpen = false;
  }

  pulse() {
    this.fab.style.animation = 'none';
    this.fab.offsetHeight; // Trigger reflow
    this.fab.style.animation = 'pulse 0.6s ease-in-out';
    
    setTimeout(() => {
      this.fab.style.animation = '';
    }, 600);
  }

  setBadge(count) {
    let badge = this.fab.querySelector('.fab-badge');
    
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'fab-badge';
        this.fab.appendChild(badge);
      }
      badge.textContent = count > 99 ? '99+' : count.toString();
      badge.style.display = 'block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  setIcon(icon) {
    const iconElement = this.fab.querySelector('.fab-icon');
    if (iconElement) {
      iconElement.textContent = icon;
    }
  }

  setLoading(loading) {
    if (loading) {
      this.fab.classList.add('loading');
      this.setIcon('⏳');
    } else {
      this.fab.classList.remove('loading');
      this.setIcon('🤖');
    }
  }
}

export const fabManager = new FABManager();

