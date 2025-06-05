class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.isEnabled = true;
    this.initializeDefaultShortcuts();
    this.bindEvents();
  }

  initializeDefaultShortcuts() {
    // Navegación
    this.register('alt+h', () => window.location.href = '/', 'Ir al inicio');
    this.register('alt+d', () => window.location.href = '/dashboard.html', 'Ir al dashboard');
    
    // Editor
    this.register('ctrl+s', e => {
      e.preventDefault();
      window.notificationManager?.show({
        title: 'Guardado automático',
        message: 'Los cambios se guardan automáticamente',
        type: 'info'
      });
    }, 'Guardar (automático)');
    
    this.register('ctrl+/', e => {
      e.preventDefault();
      this.toggleShortcutsDialog();
    }, 'Mostrar atajos');

    this.register('ctrl+b', e => {
      e.preventDefault();
      document.body.classList.toggle('sidebar-collapsed');
    }, 'Toggle sidebar');

    this.register('alt+t', () => {
      window.themeManager?.toggleTheme();
    }, 'Cambiar tema');

    // Búsqueda
    this.register('ctrl+k', e => {
      e.preventDefault();
      this.toggleCommandPalette();
    }, 'Abrir paleta de comandos');

    this.register('ctrl+f', e => {
      e.preventDefault();
      this.toggleSearch();
    }, 'Buscar en el editor');

    // Zoom
    this.register('ctrl+=', e => {
      e.preventDefault();
      this.adjustZoom(0.1);
    }, 'Aumentar zoom');

    this.register('ctrl+-', e => {
      e.preventDefault();
      this.adjustZoom(-0.1);
    }, 'Reducir zoom');

    this.register('ctrl+0', e => {
      e.preventDefault();
      this.resetZoom();
    }, 'Restablecer zoom');
  }

  register(shortcut, callback, description = '') {
    const keys = this.parseShortcut(shortcut);
    this.shortcuts.set(shortcut, { keys, callback, description });
  }

  parseShortcut(shortcut) {
    return shortcut.toLowerCase().split('+').map(key => key.trim());
  }

  bindEvents() {
    document.addEventListener('keydown', e => {
      if (!this.isEnabled) return;

      const pressedKeys = [];
      if (e.ctrlKey) pressedKeys.push('ctrl');
      if (e.altKey) pressedKeys.push('alt');
      if (e.shiftKey) pressedKeys.push('shift');
      
      let key = e.key.toLowerCase();
      if (key === ' ') key = 'space';
      if (key.length === 1) pressedKeys.push(key);
      else if (!['control', 'alt', 'shift'].includes(key)) pressedKeys.push(key);

      for (const [_, shortcut] of this.shortcuts) {
        if (this.matchesShortcut(pressedKeys, shortcut.keys)) {
          shortcut.callback(e);
          break;
        }
      }
    });
  }

  matchesShortcut(pressed, shortcut) {
    if (pressed.length !== shortcut.length) return false;
    return shortcut.every(key => pressed.includes(key));
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  toggleShortcutsDialog() {
    let dialog = document.getElementById('shortcuts-dialog');
    
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = 'shortcuts-dialog';
      dialog.className = 'shortcuts-dialog';
      
      const content = document.createElement('div');
      content.className = 'shortcuts-content';
      
      const title = document.createElement('h2');
      title.textContent = 'Atajos de teclado';
      content.appendChild(title);

      const list = document.createElement('div');
      list.className = 'shortcuts-list';
      
      // Agrupar atajos por categoría
      const categories = new Map();
      
      for (const [shortcut, { description }] of this.shortcuts) {
        const category = description.includes('editor') ? 'Editor' :
                        description.includes('zoom') ? 'Zoom' :
                        description.includes('buscar') ? 'Búsqueda' : 'General';
        
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        
        categories.get(category).push({ shortcut, description });
      }

      // Crear secciones por categoría
      for (const [category, shortcuts] of categories) {
        const section = document.createElement('div');
        section.className = 'shortcuts-section';
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = category;
        section.appendChild(categoryTitle);
        
        const items = document.createElement('div');
        items.className = 'shortcuts-items';
        
        for (const { shortcut, description } of shortcuts) {
          const item = document.createElement('div');
          item.className = 'shortcut-item';
          
          const keys = document.createElement('div');
          keys.className = 'shortcut-keys';
          shortcut.split('+').forEach(key => {
            const kbd = document.createElement('kbd');
            kbd.textContent = key;
            keys.appendChild(kbd);
          });
          
          const desc = document.createElement('div');
          desc.className = 'shortcut-description';
          desc.textContent = description;
          
          item.appendChild(keys);
          item.appendChild(desc);
          items.appendChild(item);
        }
        
        section.appendChild(items);
        list.appendChild(section);
      }
      
      content.appendChild(list);
      dialog.appendChild(content);
      
      const style = document.createElement('style');
      style.textContent = `
        .shortcuts-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .shortcuts-dialog.show {
          opacity: 1;
        }
        
        .shortcuts-content {
          background: var(--color-panel);
          border-radius: 12px;
          padding: 24px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .shortcuts-content h2 {
          margin: 0 0 20px 0;
          font-size: 24px;
          font-weight: 600;
          color: var(--color-text);
        }
        
        .shortcuts-section {
          margin-bottom: 24px;
        }
        
        .shortcuts-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-secondary);
        }
        
        .shortcuts-items {
          display: grid;
          gap: 8px;
        }
        
        .shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
        }
        
        .shortcut-keys {
          display: flex;
          gap: 4px;
        }
        
        .shortcut-keys kbd {
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-text);
          font-family: monospace;
          font-size: 12px;
          min-width: 20px;
          text-align: center;
          text-transform: capitalize;
        }
        
        .shortcut-description {
          color: var(--color-text-secondary);
          font-size: 14px;
        }
      `;
      
      document.head.appendChild(style);
      document.body.appendChild(dialog);
    }
    
    dialog.classList.toggle('show');
    
    if (dialog.classList.contains('show')) {
      const closeOnClick = e => {
        if (e.target === dialog) {
          dialog.classList.remove('show');
          dialog.removeEventListener('click', closeOnClick);
        }
      };
      
      dialog.addEventListener('click', closeOnClick);
    }
  }

  toggleCommandPalette() {
    // Implementar paleta de comandos
    window.notificationManager?.show({
      title: 'Próximamente',
      message: 'La paleta de comandos estará disponible pronto',
      type: 'info'
    });
  }

  toggleSearch() {
    // Implementar búsqueda
    window.notificationManager?.show({
      title: 'Próximamente',
      message: 'La búsqueda en el editor estará disponible pronto',
      type: 'info'
    });
  }

  adjustZoom(delta) {
    const html = document.documentElement;
    const currentZoom = parseFloat(html.style.zoom) || 1;
    const newZoom = Math.max(0.5, Math.min(2, currentZoom + delta));
    html.style.zoom = newZoom;
  }

  resetZoom() {
    document.documentElement.style.zoom = 1;
  }
}

// Exportar instancia
window.shortcutManager = new ShortcutManager(); 