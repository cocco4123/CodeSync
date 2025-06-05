class NotificationManager {
  constructor() {
    this.container = this.createContainer();
    this.queue = [];
    this.isProcessing = false;
    this.requestPermission();
  }

  createContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.setupServiceWorker();
      }
    }
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('ServiceWorker registrado:', registration);
      } catch (error) {
        console.error('Error al registrar ServiceWorker:', error);
      }
    }
  }

  show(options) {
    const defaults = {
      title: '',
      message: '',
      type: 'info', // info, success, error, warning
      duration: 5000,
      actions: [],
      showSystemNotification: false
    };

    const config = { ...defaults, ...options };
    this.queue.push(config);
    this.processQueue();

    if (config.showSystemNotification && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(config.title, {
        body: config.message,
        icon: '/favicon.svg'
      });
    }
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const notification = this.queue.shift();
    
    const element = document.createElement('div');
    element.className = `notification notification-${notification.type}`;
    element.innerHTML = `
      <div class="notification-icon">
        ${this.getIcon(notification.type)}
      </div>
      <div class="notification-content">
        ${notification.title ? `<h4>${notification.title}</h4>` : ''}
        <p>${notification.message}</p>
      </div>
      ${notification.actions.length > 0 ? `
        <div class="notification-actions">
          ${notification.actions.map(action => `
            <button class="notification-action" data-action="${action.id}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
      <button class="notification-close" aria-label="Cerrar">
        <svg viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    `;

    // Agregar eventos
    element.querySelector('.notification-close').addEventListener('click', () => {
      this.close(element);
    });

    notification.actions?.forEach(action => {
      element.querySelector(`[data-action="${action.id}"]`)?.addEventListener('click', () => {
        action.callback();
        this.close(element);
      });
    });

    // Mostrar notificación
    this.container.appendChild(element);
    await new Promise(resolve => setTimeout(resolve, 100));
    element.classList.add('show');

    // Auto cerrar
    if (notification.duration > 0) {
      setTimeout(() => this.close(element), notification.duration);
    }

    this.isProcessing = false;
    this.processQueue();
  }

  close(element) {
    element.classList.remove('show');
    setTimeout(() => {
      element.remove();
    }, 300);
  }

  getIcon(type) {
    const icons = {
      info: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
      success: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
      error: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
      warning: '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    };
    return icons[type] || icons.info;
  }
}

// Estilos
const style = document.createElement('style');
style.textContent = `
  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }

  .notification {
    background: var(--color-panel);
    color: var(--color-text);
    border-radius: 12px;
    padding: 16px;
    min-width: 300px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    gap: 12px;
    align-items: flex-start;
    transform: translateX(120%);
    transition: all 0.3s ease;
    pointer-events: all;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .notification.show {
    transform: translateX(0);
  }

  .notification-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }

  .notification-icon svg {
    width: 100%;
    height: 100%;
  }

  .notification-info .notification-icon {
    color: var(--color-accent);
  }

  .notification-success .notification-icon {
    color: var(--color-success);
  }

  .notification-error .notification-icon {
    color: var(--color-error);
  }

  .notification-warning .notification-icon {
    color: var(--color-warning);
  }

  .notification-content {
    flex-grow: 1;
  }

  .notification-content h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .notification-content p {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .notification-close {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    color: var(--color-text-secondary);
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .notification-close:hover {
    opacity: 1;
  }

  .notification-close svg {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  .notification-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .notification-action {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .notification-action:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

document.head.appendChild(style);

// Exportar instancia
window.notificationManager = new NotificationManager(); 