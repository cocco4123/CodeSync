// Temas disponibles
const themes = {
  dark: {
    background: '#1E1E2E',
    panel: '#2A2A3B',
    accent: '#3B82F6',
    accentSecondary: '#10B981',
    text: '#E5E7EB',
    textSecondary: '#9CA3AF',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B'
  },
  light: {
    background: '#F9FAFB',
    panel: '#FFFFFF',
    accent: '#2563EB',
    accentSecondary: '#059669',
    text: '#1F2937',
    textSecondary: '#4B5563',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706'
  }
};

// Configuración de tema
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'dark';
    this.applyTheme();
    this.listenToSystemTheme();
  }

  // Aplicar tema
  applyTheme() {
    const root = document.documentElement;
    const colors = themes[this.theme];

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
    });

    // Actualizar meta theme-color
    document.querySelector('meta[name="theme-color"]').content = colors.background;
    
    // Guardar preferencia
    localStorage.setItem('theme', this.theme);
    
    // Actualizar estado de botones
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.theme === this.theme);
    });
  }

  // Cambiar tema
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme();
  }

  // Escuchar cambios del sistema
  listenToSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (localStorage.getItem('theme')) return; // Respetar preferencia manual
      this.theme = e.matches ? 'dark' : 'light';
      this.applyTheme();
    };

    mediaQuery.addListener(handleChange);
    if (!localStorage.getItem('theme')) {
      handleChange(mediaQuery);
    }
  }
}

// Exportar instancia
window.themeManager = new ThemeManager(); 