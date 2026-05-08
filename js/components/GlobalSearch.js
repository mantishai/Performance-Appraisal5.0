const GlobalSearch = {
    container: null,
    dropdown: null,

    init() {
        this.createSearchBox();
        this.bindEvents();
        this.registerShortcuts();
    },

    createSearchBox() {
        const headerLeft = document.querySelector('.header-left');
        if (!headerLeft) return;

        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'global-search';
        searchWrapper.innerHTML = `
            <div class="search-input-wrapper">
                <span>🔍</span>
                <input type="text" placeholder="搜索员工、候选人..." id="globalSearchInput">
                <span class="search-shortcut">Ctrl+K</span>
            </div>
            <div class="search-dropdown" id="searchDropdown"></div>
        `;

        headerLeft.appendChild(searchWrapper);
        this.container = searchWrapper;
        this.dropdown = searchWrapper.querySelector('.search-dropdown');
    },

    bindEvents() {
        const input = document.getElementById('globalSearchInput');
        if (!input) return;

        input.addEventListener('focus', () => {
            if (input.value.trim()) {
                this.showDropdown();
            }
        });

        input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                this.search(query);
            } else {
                this.hideDropdown();
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => this.hideDropdown(), 200);
        });
    },

    registerShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const input = document.getElementById('globalSearchInput');
                if (input) {
                    input.focus();
                }
            }
        });
    },

    async search(query) {
        const mockResults = {
            employees: [
                { id: 1, name: '张三', department: '技术部', position: '前端工程师', icon: '👤' },
                { id: 2, name: '李四', department: '产品部', position: '产品经理', icon: '👤' },
                { id: 3, name: '王五', department: '技术部', position: '后端工程师', icon: '👤' }
            ],
            candidates: [
                { id: 4, name: '赵六', position: 'UI设计师', status: '面试中', icon: '👥' },
                { id: 5, name: '钱七', position: '产品经理', status: '已录用', icon: '👥' }
            ]
        };

        const results = mockResults;
        this.showResults(results);
    },

    showResults(results) {
        let html = '';

        if (results.employees && results.employees.length > 0) {
            html += `
                <div class="search-result-group">
                    <div class="search-result-title">员工</div>
                    ${results.employees.map(emp => `
                        <div class="search-result-item" data-type="employee" data-id="${emp.id}">
                            <div class="search-result-icon">${emp.icon}</div>
                            <div class="search-result-info">
                                <div class="search-result-name">${emp.name}</div>
                                <div class="search-result-meta">${emp.department} - ${emp.position}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (results.candidates && results.candidates.length > 0) {
            html += `
                <div class="search-result-group">
                    <div class="search-result-title">候选人</div>
                    ${results.candidates.map(cand => `
                        <div class="search-result-item" data-type="candidate" data-id="${cand.id}">
                            <div class="search-result-icon">${cand.icon}</div>
                            <div class="search-result-info">
                                <div class="search-result-name">${cand.name}</div>
                                <div class="search-result-meta">${cand.position} - ${cand.status}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (!html) {
            html = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">未找到相关结果</div>';
        }

        this.dropdown.innerHTML = html;
        this.showDropdown();

        this.dropdown.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                const id = item.dataset.id;
                this.handleResultClick(type, id);
            });
        });
    },

    handleResultClick(type, id) {
        console.log(`Navigate to ${type} detail: ${id}`);
        this.hideDropdown();
        const input = document.getElementById('globalSearchInput');
        if (input) input.value = '';
    },

    showDropdown() {
        this.dropdown.classList.add('show');
    },

    hideDropdown() {
        this.dropdown.classList.remove('show');
    }
};

export default GlobalSearch;