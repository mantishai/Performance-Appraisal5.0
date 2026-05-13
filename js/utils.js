import API from './api.js';

const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },

    show({ type = 'info', title = '', message = '', duration = 3000 }) {
        this.init();

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                ${message ? `<div class="toast-message">${message}</div>` : ''}
            </div>
            <button class="toast-close">×</button>
        `;

        this.container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast);
        });

        setTimeout(() => {
            this.remove(toast);
        }, duration);
    },

    remove(toast) {
        toast.style.animation = 'fadeIn 0.3s reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },

    success(message, title = '成功') {
        this.show({ type: 'success', title, message });
    },

    error(message, title = '错误') {
        this.show({ type: 'error', title, message });
    },

    warning(message, title = '警告') {
        this.show({ type: 'warning', title, message });
    },

    info(message, title = '提示') {
        this.show({ type: 'info', title, message });
    }
};

const ProgressBar = {
    element: null,

    init() {
        if (!this.element) {
            this.element = document.createElement('div');
            this.element.className = 'progress-bar-global';
            this.element.innerHTML = '<div class="progress-bar-inner"></div>';
            document.body.appendChild(this.element);
        }
    },

    show() {
        this.init();
        this.element.classList.add('show');
    },

    hide() {
        if (this.element) {
            this.element.classList.remove('show');
        }
    },

    setProgress(percent) {
        this.init();
        const inner = this.element.querySelector('.progress-bar-inner');
        if (inner) {
            inner.style.width = `${percent}%`;
        }
    }
};

const Shortcuts = {
    handlers: {},

    register(key, handler, description = '') {
        const combo = key.toLowerCase().replace(/\s+/g, '');
        this.handlers[combo] = { handler, description };
    },

    init() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            let combo = '';
            if (e.ctrlKey || e.metaKey) combo += 'ctrl+';
            if (e.altKey) combo += 'alt+';
            if (e.shiftKey) combo += 'shift+';
            combo += e.key.toLowerCase();

            if (this.handlers[combo]) {
                e.preventDefault();
                this.handlers[combo].handler(e);
            }
        });
    }
};

const Skeleton = {
    renderTable(rows = 5, cols = 5) {
        let html = '<div class="skeleton-table">';
        for (let i = 0; i < rows; i++) {
            html += '<div class="skeleton-table-row">';
            for (let j = 0; j < cols; j++) {
                html += `<div class="skeleton" style="width: ${60 + Math.random() * 80}px; height: 14px;"></div>`;
            }
            html += '</div>';
        }
        html += '</div>';
        return html;
    },

    renderCard() {
        return `
            <div class="card">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-text" style="width: 80%;"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
                <div class="skeleton skeleton-text" style="width: 70%;"></div>
            </div>
        `;
    },

    renderStats() {
        let html = '<div class="stats-grid">';
        for (let i = 0; i < 4; i++) {
            html += `
                <div class="stat-card">
                    <div class="skeleton skeleton-avatar"></div>
                    <div style="flex: 1;">
                        <div class="skeleton skeleton-text" style="width: 50%;"></div>
                        <div class="skeleton skeleton-text" style="width: 80%;"></div>
                    </div>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }
};

const Validators = {
    required: (value, fieldName = '字段') => {
        if (!value || value.toString().trim() === '') {
            return `${fieldName}不能为空`;
        }
        return null;
    },

    email: (value) => {
        if (!value) return null;
        const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!reg.test(value)) {
            return '邮箱格式不正确';
        }
        return null;
    },

    phone: (value) => {
        if (!value) return null;
        const reg = /^1[3-9]\d{9}$/;
        if (!reg.test(value)) {
            return '手机号格式不正确';
        }
        return null;
    },

    minLength: (value, min, fieldName = '字段') => {
        if (!value) return null;
        if (value.length < min) {
            return `${fieldName}长度不能少于${min}个字符`;
        }
        return null;
    },

    maxLength: (value, max, fieldName = '字段') => {
        if (!value) return null;
        if (value.length > max) {
            return `${fieldName}长度不能超过${max}个字符`;
        }
        return null;
    },

    pattern: (value, reg, message) => {
        if (!value) return null;
        if (!reg.test(value)) {
            return message || '格式不正确';
        }
        return null;
    },

    range: (value, min, max, fieldName = '字段') => {
        if (!value) return null;
        const num = parseFloat(value);
        if (isNaN(num) || num < min || num > max) {
            return `${fieldName}必须在${min}到${max}之间`;
        }
        return null;
    },

    custom: (value, validatorFn) => {
        return validatorFn(value);
    }
};

function validateForm(formData, rules) {
    const errors = {};

    for (const field in rules) {
        const fieldRules = rules[field];
        const value = formData[field];

        for (const rule of fieldRules) {
            let error = null;

            if (typeof rule === 'function') {
                error = rule(value, field);
            } else if (typeof rule === 'object') {
                const { validator, message, fieldName } = rule;
                error = Validators[validator] ? Validators[validator](value, fieldName || field) : null;
                if (error && message) error = message;
            }

            if (error) {
                errors[field] = error;
                break;
            }
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

function showValidationMessage(fieldElement, error) {
    removeValidationMessage(fieldElement);

    const message = document.createElement('div');
    message.className = `validate-message ${error ? 'error' : 'success'}`;
    message.textContent = error || '✓';
    fieldElement.parentNode.appendChild(message);

    fieldElement.classList.remove('error', 'success');
    fieldElement.classList.add(error ? 'error' : 'success');
}

function removeValidationMessage(fieldElement) {
    const existing = fieldElement.parentNode.querySelector('.validate-message');
    if (existing) {
        existing.remove();
    }
    fieldElement.classList.remove('error', 'success');
}

const Pagination = {
    render(containerId, options = {}) {
        const {
            current = 1,
            total = 0,
            pageSize = 10,
            onPageChange
        } = options;

        const totalPages = Math.ceil(total / pageSize);
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = '';

        html += `<span class="page-info">共 ${total} 条</span>`;

        html += `<button class="page-btn" ${current === 1 ? 'disabled' : ''} data-page="${current - 1}">‹</button>`;

        const maxVisible = 5;
        let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
            html += `<button class="page-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="page-info" style="padding: 0 8px;">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="page-info" style="padding: 0 8px;">...</span>`;
            }
            html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        html += `<button class="page-btn" ${current === totalPages ? 'disabled' : ''} data-page="${current + 1}">›</button>`;

        container.innerHTML = html;

        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages && page !== current) {
                    onPageChange && onPageChange(page);
                }
            });
        });
    }
};

const Modal = {
    activeModal: null,

    open(options = {}) {
        const {
            title = '',
            content = '',
            footer = '',
            width = '600px',
            onClose,
            draggable = true,
            closable = true
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal" style="max-width: ${width};">
                <div class="modal-header">
                    <span class="modal-title">${title}</span>
                    ${closable ? `
                    <div class="modal-controls">
                        <button class="modal-control-btn modal-minimize">−</button>
                        <button class="modal-control-btn modal-fullscreen">☐</button>
                        <button class="modal-control-btn modal-close">×</button>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-body">${content}</div>
                ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
            </div>
        `;

        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('show');
        });

        const modal = overlay.querySelector('.modal');

        if (draggable) {
            this.makeDraggable(modal, overlay.querySelector('.modal-header'));
        }

        const close = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                if (this.activeModal === overlay) {
                    this.activeModal = null;
                }
            }, 300);
            onClose && onClose();
        };

        overlay.querySelector('.modal-close:not(#closeDetailDrawerBtn)')?.addEventListener('click', close);
        overlay.querySelector('.modal-fullscreen')?.addEventListener('click', () => {
            modal.classList.toggle('fullscreen');
        });
        overlay.querySelector('.modal-minimize')?.addEventListener('click', () => {
            modal.classList.toggle('minimized');
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
            }
        });

        this.activeModal = overlay;

        return { close, overlay, modal };
    },

    makeDraggable(modal, header) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('modal-control-btn')) return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = modal.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            modal.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            modal.style.left = `${initialX + dx}px`;
            modal.style.top = `${initialY + dy}px`;
            modal.style.transform = 'none';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            modal.style.transition = '';
        });
    },

    confirm(message, onConfirm, onCancel) {
        const instance = this.open({
            title: '确认',
            content: `<p style="text-align: center; padding: 20px 0;">${message}</p>`,
            footer: `
                <button class="btn btn-default" id="modalCancelBtn">取消</button>
                <button class="btn btn-primary" id="modalConfirmBtn">确定</button>
            `,
            onClose: onCancel
        });

        setTimeout(() => {
            const cancelBtn = document.getElementById('modalCancelBtn');
            const confirmBtn = document.getElementById('modalConfirmBtn');
            
            cancelBtn?.addEventListener('click', () => {
                instance.close();
                onCancel && onCancel();
            });
            
            confirmBtn?.addEventListener('click', () => {
                instance.close();
                onConfirm && onConfirm();
            });
        }, 0);

        return instance;
    },

    info(message) {
        return this.open({
            title: '提示',
            content: `<p style="text-align: center; padding: 20px 0;">${message}</p>`,
            footer: `
                <button class="btn btn-primary" id="modalInfoBtn">确定</button>
            `
        });
    },

    warning(message) {
        return this.open({
            title: '警告',
            content: `<p style="text-align: center; padding: 20px 0;">${message}</p>`,
            footer: `
                <button class="btn btn-primary" id="modalWarningBtn">确定</button>
            `
        });
    }
};

function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

function throttle(fn, delay = 300) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn.apply(this, args);
        }
    };
}

function formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

function formatNumber(num) {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            Toast.success('已复制到剪贴板');
        }).catch(() => {
            Toast.error('复制失败');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        Toast.success('已复制到剪贴板');
    }
}

function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return user.permissions?.includes(permission) || false;
}

function hasAnyPermission(permissions) {
    return permissions.some(p => hasPermission(p));
}

function hasAllPermissions(permissions) {
    return permissions.every(p => hasPermission(p));
}

function hasRole(role) {
    const user = getCurrentUser();
    return user?.role === role;
}

function hasAnyRole(roles) {
    const user = getCurrentUser();
    return roles.includes(user?.role);
}

async function logout() {
    try {
        await API.logout();
    } catch (e) {
        console.error('Logout error:', e);
    }
    clearCurrentUser();
    localStorage.removeItem('token');
    window.location.reload();
}

function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        logout();
        return false;
    }
    return true;
}

function exportToExcel(data, filename = 'export.csv') {
    if (!data || !Array.isArray(data) || data.length === 0) {
        Toast.error('导出数据为空');
        return;
    }

    const csvContent = data.map(row => {
        return row.map(cell => {
            const str = String(cell ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',');
    }).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    Toast.success('导出成功');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function generateAppKey() {
    return `AK_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

function generateAppSecret() {
    return `SK_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 18)}`;
}

function signRequest(appKey, appSecret, timestamp, nonce) {
    const sortedStr = [appKey, timestamp, nonce, appSecret].sort().join('');
    return btoa(sortedStr).substring(0, 32);
}

function verifySignature(appKey, timestamp, nonce, signature, apps = []) {
    const app = apps.find(a => a.appKey === appKey);
    if (!app) return false;
    const expectedSignature = signRequest(appKey, app.appSecret, timestamp, nonce);
    return signature === expectedSignature;
}

// ===== 性能优化工具 =====

// 缓存工具
const Cache = {
    storage: new Map(),
    ttlMap: new Map(),

    set(key, value, ttl = 300000) { // 默认5分钟
        this.storage.set(key, value);
        this.ttlMap.set(key, Date.now() + ttl);
    },

    get(key) {
        if (this.ttlMap.has(key) && Date.now() > this.ttlMap.get(key)) {
            this.delete(key);
            return null;
        }
        return this.storage.get(key);
    },

    delete(key) {
        this.storage.delete(key);
        this.ttlMap.delete(key);
    },

    clear() {
        this.storage.clear();
        this.ttlMap.clear();
    }
};

// 图片懒加载
class LazyImage {
    constructor(selector = 'img[data-src]') {
        this.selector = selector;
        this.images = [];
        this.observer = null;
    }

    init() {
        this.images = document.querySelectorAll(this.selector);
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            });
            this.images.forEach(img => this.observer.observe(img));
        } else {
            this.images.forEach(img => this.loadImage(img));
        }
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
        }
    }
}

// 虚拟列表实现
class VirtualList {
    constructor(options) {
        this.container = options.container;
        this.items = options.items || [];
        this.itemHeight = options.itemHeight || 50;
        this.buffer = options.buffer || 5;
        
        this.scrollTop = 0;
        this.visibleCount = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        
        this.init();
    }

    init() {
        this.visibleCount = Math.ceil(this.container.clientHeight / this.itemHeight) + this.buffer * 2;
        
        this.container.addEventListener('scroll', () => {
            this.onScroll();
        });
        
        this.render();
    }

    onScroll() {
        this.scrollTop = this.container.scrollTop;
        this.startIndex = Math.floor(this.scrollTop / this.itemHeight) - this.buffer;
        this.startIndex = Math.max(0, this.startIndex);
        this.endIndex = Math.min(this.items.length, this.startIndex + this.visibleCount);
        
        this.render();
    }

    render() {
        const visibleItems = this.items.slice(this.startIndex, this.endIndex);
        const offsetY = this.startIndex * this.itemHeight;
        
        this.container.innerHTML = `
            <div style="height: ${this.items.length * this.itemHeight}px; position: relative;">
                <div style="transform: translateY(${offsetY}px);">
                    ${visibleItems.map((item, index) => `
                        <div style="height: ${this.itemHeight}px; padding: 0 16px; display: flex; align-items: center; border-bottom: 1px solid var(--border-color);">
                            ${typeof item === 'string' ? item : item.content}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Web Worker 封装
class WorkerPool {
    constructor(script, poolSize = navigator.hardwareConcurrency || 4) {
        this.script = script;
        this.poolSize = poolSize;
        this.workers = [];
        this.taskQueue = [];
        this.init();
    }

    init() {
        for (let i = 0; i < this.poolSize; i++) {
            this.workers.push({
                worker: new Worker(this.script),
                busy: false
            });
        }
    }

    postMessage(data) {
        return new Promise((resolve, reject) => {
            const workerData = this.workers.find(w => !w.busy);
            if (workerData) {
                workerData.busy = true;
                workerData.worker.onmessage = (e) => {
                    workerData.busy = false;
                    resolve(e.data);
                    this.processQueue();
                };
                workerData.worker.onerror = (err) => {
                    workerData.busy = false;
                    reject(err);
                    this.processQueue();
                };
                workerData.worker.postMessage(data);
            } else {
                this.taskQueue.push({ data, resolve, reject });
            }
        });
    }

    processQueue() {
        if (this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            this.postMessage(task.data).then(task.resolve).catch(task.reject);
        }
    }

    terminate() {
        this.workers.forEach(w => w.worker.terminate());
    }
}

// 性能监控
const PerformanceMonitor = {
    marks: {},
    measures: {},

    start(name) {
        this.marks[name] = performance.now();
    },

    end(name) {
        if (this.marks[name]) {
            const duration = performance.now() - this.marks[name];
            this.measures[name] = duration;
            delete this.marks[name];
            console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    },

    getReport() {
        return { ...this.measures };
    },

    clear() {
        this.marks = {};
        this.measures = {};
    }
};

// 内存优化：对象池
class ObjectPool {
    constructor(factory, initialSize = 10) {
        this.factory = factory;
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    acquire() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        return this.factory();
    }

    release(obj) {
        if (obj.reset) {
            obj.reset();
        }
        this.pool.push(obj);
    }
}

// ===== PWA 工具 =====
const PWA = {
    async registerServiceWorker(swPath = '/sw.js') {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register(swPath);
                console.log('[PWA] Service Worker 注册成功:', registration.scope);
                return registration;
            } catch (error) {
                console.error('[PWA] Service Worker 注册失败:', error);
                return null;
            }
        }
        return null;
    },

    requestNotificationPermission() {
        if ('Notification' in window) {
            return Notification.requestPermission();
        }
        return Promise.resolve('denied');
    },

    sendNotification(title, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            return new Notification(title, {
                icon: '/icons/icon-192x192.png',
                ...options
            });
        }
        return null;
    },

    async checkForUpdate(registration) {
        if (registration) {
            await registration.update();
        }
    }
};

// 事件总线 - 用于模块间通信
const EventBus = {
    events: {},

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },

    off(event, callback) {
        if (!this.events[event]) return;
        if (callback) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        } else {
            delete this.events[event];
        }
    },

    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`[EventBus] Error in event handler for "${event}":`, e);
            }
        });
    },

    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };
        this.on(event, onceCallback);
    }
};

export {
    Toast,
    ProgressBar,
    Shortcuts,
    Skeleton,
    Validators,
    validateForm,
    showValidationMessage,
    removeValidationMessage,
    Pagination,
    Modal,
    debounce,
    throttle,
    formatDate,
    formatNumber,
    copyToClipboard,
    downloadFile,
    exportToExcel,
    generateAppKey,
    generateAppSecret,
    signRequest,
    verifySignature,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    logout,
    checkAuth,
    Cache,
    LazyImage,
    VirtualList,
    WorkerPool,
    PerformanceMonitor,
    ObjectPool,
    PWA,
    escapeHtml,
    EventBus
};