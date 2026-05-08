const ThemeSwitcher = {
    currentTheme: 'light',

    themes: ['light', 'dark'],

    init() {
        this.loadTheme();
        this.createSwitcher();
        this.listenSystemTheme();
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        }
        this.applyTheme();
    },

    createSwitcher() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
            <button class="theme-btn ${this.currentTheme === 'light' ? 'active' : ''}" data-theme="light" title="浅色模式">☀️</button>
            <button class="theme-btn ${this.currentTheme === 'dark' ? 'active' : ''}" data-theme="dark" title="深色模式">🌙</button>
            <button class="theme-btn ${this.currentTheme === 'auto' ? 'active' : ''}" data-theme="auto" title="跟随系统">⚙️</button>
        `;

        switcher.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-btn');
            if (btn) {
                this.setTheme(btn.dataset.theme);
            }
        });

        headerActions.appendChild(switcher);
    },

    setTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.currentTheme = prefersDark ? 'dark' : 'light';
        } else {
            this.currentTheme = theme;
        }

        localStorage.setItem('theme', theme === 'auto' ? this.currentTheme : theme);

        this.applyTheme();
        this.updateButtons();
    },

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    },

    updateButtons() {
        const buttons = document.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            const theme = btn.dataset.theme;
            if (theme === 'auto') {
                btn.classList.toggle('active', localStorage.getItem('theme') === 'auto');
            } else {
                btn.classList.toggle('active', this.currentTheme === theme);
            }
        });
    },

    listenSystemTheme() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (localStorage.getItem('theme') === 'auto') {
                this.currentTheme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    },

    toggleTheme() {
        const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(nextTheme);
    }
};

export default ThemeSwitcher;