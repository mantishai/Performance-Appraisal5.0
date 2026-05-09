const NotificationCenter = {
    container: null,
    dropdown: null,
    badge: null,
    notifications: [],

    async init() {
        await this.loadNotifications();
        this.createNotificationButton();
        this.createDropdown();
        this.updateBadge();
    },

    async loadNotifications() {
        try {
            const { default: API } = await import('../api.js');
            const res = await API.getNotifications();
            if (res.code === 200 && res.data) {
                this.notifications = res.data;
            } else {
                this.notifications = this.getMockNotifications();
            }
        } catch (error) {
            console.warn('Failed to fetch notifications, using mock data:', error);
            this.notifications = this.getMockNotifications();
        }
    },

    getMockNotifications() {
        return [
            { id: 1, type: 'info', icon: '📋', title: '新员工入职', message: '张三已入职，请准备相关资料', time: '5分钟前', read: false },
            { id: 2, type: 'success', icon: '✅', title: '审批通过', message: '您的请假申请已通过', time: '1小时前', read: false },
            { id: 3, type: 'warning', icon: '⚠️', title: '合同到期提醒', message: '李四的合同将在30天后到期', time: '2小时前', read: false },
            { id: 4, type: 'error', icon: '❌', title: '考勤异常', message: '王五今日未打卡', time: '3小时前', read: true },
            { id: 5, type: 'info', icon: '📅', title: '绩效考核', message: '2024年Q1考核已开始', time: '1天前', read: true }
        ];
    },

    createNotificationButton() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;

        const btn = document.createElement('div');
        btn.className = 'header-btn notification-btn';
        btn.id = 'notificationBtn';
        btn.innerHTML = `<span>🔔</span><span class="badge" id="notificationBadge">${this.getUnreadCount()}</span>`;
        btn.style.position = 'relative';

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        headerActions.appendChild(btn);
        this.badge = btn.querySelector('.badge');
    },

    createDropdown() {
        const notificationBtn = document.getElementById('notificationBtn');
        if (!notificationBtn) return;

        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.id = 'notificationDropdown';
        dropdown.innerHTML = this.renderDropdown();

        document.body.appendChild(dropdown);
        this.dropdown = dropdown;

        this.bindDropdownEvents();
    },

    renderDropdown() {
        const unreadCount = this.getUnreadCount();
        return `
            <div class="notification-header">
                <span class="notification-title">通知中心</span>
                ${unreadCount > 0 ? '<span class="notification-mark-read" id="markAllRead">全部已读</span>' : ''}
            </div>
            <div class="notification-list">
                ${this.notifications.slice(0, 5).map(notif => `
                    <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}">
                        <div class="notification-icon ${notif.type}">${notif.icon}</div>
                        <div class="notification-content">
                            <div class="notification-text"><strong>${notif.title}</strong><br>${notif.message}</div>
                            <div class="notification-time">${notif.time}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="notification-footer">
                <a href="#">查看全部通知 →</a>
            </div>
        `;
    },

    bindDropdownEvents() {
        document.addEventListener('click', (e) => {
            const notificationBtn = document.getElementById('notificationBtn');
            const dropdown = document.getElementById('notificationDropdown');

            if (notificationBtn && !notificationBtn.contains(e.target) &&
                dropdown && !dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });

        const markAllRead = document.getElementById('markAllRead');
        if (markAllRead) {
            markAllRead.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        const items = this.dropdown.querySelectorAll('.notification-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                this.markAsRead(id);
            });
        });
    },

    toggleDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (!dropdown) return;

        if (dropdown.classList.contains('show')) {
            this.hideDropdown();
        } else {
            this.showDropdown();
        }
    },

    showDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        const notificationBtn = document.getElementById('notificationBtn');
        if (!dropdown || !notificationBtn) return;

        const rect = notificationBtn.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + 10}px`;
        dropdown.style.right = `${window.innerWidth - rect.right - 20}px`;
        dropdown.classList.add('show');
    },

    hideDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    },

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    },

    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const count = this.getUnreadCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    },

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.updateBadge();
            this.refreshDropdown();
        }
    },

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateBadge();
        this.refreshDropdown();
    },

    refreshDropdown() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.innerHTML = this.renderDropdown();
            this.bindDropdownEvents();
        }
    },

    addNotification(notification) {
        this.notifications.unshift({
            ...notification,
            id: Date.now(),
            time: '刚刚',
            read: false
        });
        this.updateBadge();
        this.refreshDropdown();
    }
};

export default NotificationCenter;