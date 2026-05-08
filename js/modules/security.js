const Security = {
    state: {
        currentTab: 'dashboard',
        events: [],
        ipWhitelist: [],
        policy: {},
        stats: {
            loginFailed: 0,
            abnormalRequests: 0,
            blacklistActive: 0,
            eventTrend: []
        }
    },

    async render(container) {
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const { default: API } = await import('../api.js');
            const eventsRes = await API.getSecurityEvents();
            const whitelistRes = await API.getIpWhitelist();
            const policyRes = await API.getSecurityPolicy();
            
            this.state.events = eventsRes.data;
            this.state.ipWhitelist = whitelistRes.data;
            this.state.policy = policyRes.data;
            
            this.state.stats = {
                loginFailed: this.state.events.filter(e => e.type === 'login_failed').length,
                abnormalRequests: this.state.events.filter(e => e.type === 'abnormal_request').length,
                blacklistActive: this.state.ipWhitelist.filter(ip => ip.type === 'blacklist' && ip.status === 'active').length,
                eventTrend: [
                    { date: '05-01', count: 12 },
                    { date: '05-02', count: 8 },
                    { date: '05-03', count: 15 },
                    { date: '05-04', count: 6 },
                    { date: '05-05', count: 4 },
                    { date: '05-06', count: 10 },
                    { date: '05-07', count: 5 }
                ]
            };
        } catch (error) {
            console.error('Load security data failed:', error);
        }
    },

    renderContent(container) {
        const tabs = ['dashboard', 'whitelist', 'policy', 'events'];
        const tabTexts = {
            'dashboard': '安全看板',
            'whitelist': 'IP管理',
            'policy': '安全策略',
            'events': '安全事件'
        };

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">安全防护中心</h1>
            </div>
            <div class="card">
                <div class="security-tabs">
                    ${tabs.map(tab => `
                        <button class="security-tab-btn ${this.state.currentTab === tab ? 'active' : ''}" data-tab="${tab}">
                            <span class="tab-icon">${this.getTabIcon(tab)}</span>
                            <span>${tabTexts[tab]}</span>
                        </button>
                    `).join('')}
                </div>

                <div class="security-content">
                    ${this.state.currentTab === 'dashboard' ? this.renderDashboard() : ''}
                    ${this.state.currentTab === 'whitelist' ? this.renderWhitelist() : ''}
                    ${this.state.currentTab === 'policy' ? this.renderPolicy() : ''}
                    ${this.state.currentTab === 'events' ? this.renderEvents() : ''}
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    getTabIcon(tab) {
        const icons = {
            'dashboard': '📊',
            'whitelist': '🔐',
            'policy': '⚙️',
            'events': '⚠️'
        };
        return icons[tab] || '📋';
    },

    renderDashboard() {
        return `
            <div class="security-stats-grid">
                <div class="security-stat-card danger">
                    <div class="stat-icon">🚨</div>
                    <div class="stat-value">${this.state.stats.loginFailed}</div>
                    <div class="stat-label">登录失败</div>
                    <div class="stat-trend">今日</div>
                </div>
                <div class="security-stat-card warning">
                    <div class="stat-icon">🔴</div>
                    <div class="stat-value">${this.state.stats.abnormalRequests}</div>
                    <div class="stat-label">异常请求</div>
                    <div class="stat-trend">本周</div>
                </div>
                <div class="security-stat-card info">
                    <div class="stat-icon">🛡️</div>
                    <div class="stat-value">${this.state.stats.blacklistActive}</div>
                    <div class="stat-label">黑名单</div>
                    <div class="stat-trend">活跃</div>
                </div>
                <div class="security-stat-card success">
                    <div class="stat-icon">✅</div>
                    <div class="stat-value">${this.state.policy.enableCaptcha ? '已开启' : '已开启'}</div>
                    <div class="stat-label">验证码</div>
                    <div class="stat-trend">状态</div>
                </div>
            </div>

            <div class="security-charts">
                <div class="security-chart-card">
                    <div class="chart-header">
                        <h3>安全事件趋势</h3>
                    </div>
                    <div class="chart-container" id="securityTrendChart">
                        ${this.renderEventTrendChart()}
                    </div>
                </div>
                <div class="security-chart-card">
                    <div class="chart-header">
                        <h3>最近安全事件</h3>
                        <button class="btn btn-text" id="refreshEvents">刷新</button>
                    </div>
                    <div class="recent-events-list">
                        ${this.state.events.slice(0, 5).map(event => `
                            <div class="event-item ${event.severity}">
                                <span class="event-icon">${event.severity === 'critical' ? '🔴' : event.severity === 'high' ? '🟡' : '🟢'}</span>
                                <div class="event-info">
                                    <div class="event-title">${this.getEventText(event.type)}</div>
                                    <div class="event-detail">${event.detail}</div>
                                    <div class="event-time">${event.createTime}</div>
                                </div>
                                ${!event.isResolved ? `<span class="badge badge-danger">未处理</span>` : `<span class="badge badge-success">已处理</span>`}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    getEventText(type) {
        const eventTexts = {
            'login_failed': '登录失败',
            'abnormal_request': '异常请求',
            'permission_violation': '权限越权',
            'sensitive_access': '敏感数据访问',
            'batch_operation': '批量操作'
        };
        return eventTexts[type] || type;
    },

    renderEventTrendChart() {
        const maxCount = Math.max(...this.state.stats.eventTrend.map(d => d.count));
        return `
            <div class="simple-chart">
                ${this.state.stats.eventTrend.map(data => {
                    const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                    return `
                        <div class="chart-bar">
                            <div class="chart-bar-inner" style="height: ${Math.max(height, 10)}%">
                                ${data.count}
                            </div>
                            <div class="chart-bar-label">${data.date}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderWhitelist() {
        const typeColors = {
            'whitelist': 'badge-success',
            'blacklist': 'badge-danger'
        };
        const typeTexts = {
            'whitelist': '白名单',
            'blacklist': '黑名单'
        };
        const statusColors = {
            'active': 'badge-success',
            'inactive': 'badge-info'
        };
        const statusTexts = {
            'active': '启用',
            'inactive': '禁用'
        };

        return `
            <div class="whitelist-header">
                <div class="whitelist-actions">
                    <button class="btn btn-primary" id="addIpBtn">
                        <span>➕</span>
                        <span>添加IP</span>
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>IP地址</th>
                            <th>类型</th>
                            <th>备注</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.ipWhitelist.length > 0 ? this.state.ipWhitelist.map(ip => `
                            <tr>
                                <td>${ip.ipAddress}</td>
                                <td><span class="badge ${typeColors[ip.type]}">${typeTexts[ip.type]}</span></td>
                                <td>${ip.remark || '-'}</td>
                                <td><span class="badge ${statusColors[ip.status]}">${statusTexts[ip.status]}</span></td>
                                <td>${ip.createTime}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-text btn-sm" data-action="toggle-ip" data-id="${ip.id}">
                                            ${ip.status === 'active' ? '禁用' : '启用'}
                                        </button>
                                        <button class="btn btn-text btn-sm" data-action="edit-ip" data-id="${ip.id}">编辑</button>
                                        <button class="btn btn-text btn-sm" data-action="delete-ip" data-id="${ip.id}">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr><td colspan="6" style="text-align: center; padding: 40px; color: #8ba9c4;">暂无IP记录</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderPolicy() {
        const policy = this.state.policy;
        return `
            <div class="policy-sections">
                <div class="policy-section">
                    <div class="policy-header">
                    <h3>🔐 密码策略</h3>
                    </div>
                    <div class="policy-form">
                        <div class="form-group">
                            <label>最小长度</label>
                            <input type="number" class="form-control" id="passwordMinLength" 
                                value="${policy.passwordMinLength || 8}" min="6" max="32">
                        </div>
                        <div class="form-group">
                            <label>复杂度要求</label>
                            <select class="form-control" id="passwordComplexity">
                                <option value="low" ${policy.passwordComplexity === 'low' ? 'selected' : ''}>低 (只要长度要求)</option>
                                <option value="medium" ${policy.passwordComplexity === 'medium' ? 'selected' : ''}>中 (大小写+数字)</option>
                                <option value="high" ${policy.passwordComplexity === 'high' ? 'selected' : ''}>高 (大小写+数字+特殊字符)</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="policy-section">
                    <div class="policy-header">
                    <h3>🚪 登录策略</h3>
                    </div>
                    <div class="policy-form">
                        <div class="form-group">
                            <label>最大失败次数</label>
                            <input type="number" class="form-control" id="maxLoginAttempts" 
                                value="${policy.maxLoginAttempts || 5}" min="3" max="10">
                        </div>
                        <div class="form-group">
                            <label>锁定时间 (分钟)</label>
                            <input type="number" class="form-control" id="lockoutDuration" 
                                value="${policy.lockoutDuration || 30}" min="5" max="120">
                        </div>
                        <div class="form-group">
                            <label>验证码开关</label>
                            <div class="toggle-switch ${policy.enableCaptcha ? 'active' : ''}" id="enableCaptcha">
                                <div class="toggle-handle"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="policy-section">
                    <div class="policy-header">
                    <h3>🕐 会话策略</h3>
                    </div>
                    <div class="policy-form">
                        <div class="form-group">
                            <label>超时时间 (分钟)</label>
                            <input type="number" class="form-control" id="sessionTimeout" 
                                value="${policy.sessionTimeout || 30}" min="5" max="480">
                        </div>
                        <div class="form-group">
                            <label>单点登录限制</label>
                            <div class="toggle-switch ${policy.enableSso ? 'active' : ''}" id="enableSso">
                                <div class="toggle-handle"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="policy-section">
                    <div class="policy-header">
                    <h3>🔒 请求策略</h3>
                    </div>
                    <div class="policy-form">
                        <div class="form-group">
                            <label>API限流 (次/分钟)</label>
                            <input type="number" class="form-control" id="apiRateLimit" 
                                value="${policy.apiRateLimit || 100}" min="10" max="1000">
                        </div>
                        <div class="form-group">
                            <label>请求签名验证</label>
                            <div class="toggle-switch ${policy.enableRequestSign ? 'active' : ''}" id="enableRequestSign">
                                <div class="toggle-handle"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="policy-actions">
                <button class="btn btn-primary" id="savePolicyBtn">
                    <span>💾</span>
                    <span>保存策略</span>
                </button>
            </div>
        `;
    },

    renderEvents() {
        const severityColors = {
            'critical': 'badge-danger',
            'high': 'badge-warning',
            'medium': 'badge-info',
            'low': 'badge-success'
        };
        const severityTexts = {
            'critical': '严重',
            'high': '高',
            'medium': '中',
            'low': '低'
        };

        return `
            <div class="events-filter">
                <div class="filter-group">
                    <select class="form-control" id="eventTypeFilter">
                        <option value="">全部类型</option>
                        <option value="login_failed">登录失败</option>
                        <option value="abnormal_request">异常请求</option>
                        <option value="permission_violation">权限越权</option>
                        <option value="sensitive_access">敏感访问</option>
                        <option value="batch_operation">批量操作</option>
                    </select>
                </div>
                <div class="filter-group">
                    <select class="form-control" id="eventSeverityFilter">
                        <option value="">全部级别</option>
                        <option value="critical">严重</option>
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                    </select>
                </div>
                <div class="filter-group">
                    <select class="form-control" id="eventStatusFilter">
                        <option value="">全部状态</option>
                        <option value="pending">未处理</option>
                        <option value="resolved">已处理</option>
                    </select>
                </div>
                <button class="btn btn-default" id="filterEventsBtn">查询</button>
            </div>

            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>类型</th>
                            <th>级别</th>
                            <th>用户名</th>
                            <th>IP地址</th>
                            <th>详情</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.events.length > 0 ? this.state.events.map(event => `
                            <tr>
                                <td>${event.createTime}</td>
                                <td>${this.getEventText(event.type)}</td>
                                <td><span class="badge ${severityColors[event.severity]}">${severityTexts[event.severity]}</span></td>
                                <td>${event.username || '-'}</td>
                                <td>${event.ip || '-'}</td>
                                <td style="max-width: 300px;">${event.detail}</td>
                                <td>${!event.isResolved ? `<span class="badge badge-danger">未处理</span>` : `<span class="badge badge-success">已处理</span>`}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-text btn-sm" data-action="resolve-event" data-id="${event.id}">处理</button>
                                        <button class="btn btn-text btn-sm" data-action="view-event" data-id="${event.id}">详情</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr><td colspan="8" style="text-align: center; padding: 40px; color: #8ba9c4;">暂无安全事件</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    bindEvents(container) {
        container.querySelectorAll('.security-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.currentTab = btn.dataset.tab;
                this.renderContent(container);
            });
        });

        container.querySelector('#addIpBtn')?.addEventListener('click', () => {
            this.showAddIpModal(container);
        });

        container.querySelectorAll('[data-action="toggle-ip"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleIpStatus(btn.dataset.id, container);
            });
        });

        container.querySelectorAll('[data-action="delete-ip"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteIp(btn.dataset.id, container);
            });
        });

        container.querySelector('#savePolicyBtn')?.addEventListener('click', async () => {
            await this.savePolicy(container);
        });

        container.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const target = e.currentTarget;
                target.classList.toggle('active');
                const key = target.id.replace('enable', 'enable');
                this.state.policy[key] = target.classList.contains('active');
            });
        });

        container.querySelectorAll('[data-action="resolve-event"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.resolveEvent(btn.dataset.id, container);
            });
        });
    },

    showAddIpModal(container) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>添加IP</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>IP地址</label>
                        <input type="text" class="form-control" id="newIpAddress" placeholder="192.168.1.100">
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <select class="form-control" id="newIpType">
                            <option value="whitelist">白名单</option>
                            <option value="blacklist">黑名单</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>备注</label>
                        <input type="text" class="form-control" id="newIpRemark" placeholder="备注信息">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default modal-cancel">取消</button>
                    <button class="btn btn-primary modal-confirm" id="confirmAddIp">添加</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#confirmAddIp')?.addEventListener('click', async () => {
            await this.addIp(
                document.getElementById('newIpAddress')?.value,
                document.getElementById('newIpType')?.value,
                document.getElementById('newIpRemark')?.value,
                container
            );
            modal.remove();
        });
    },

    async addIp(ipAddress, type, remark, container) {
        this.state.ipWhitelist.unshift({
            id: Date.now(),
            ipAddress,
            type,
            remark,
            status: 'active',
            createTime: new Date().toLocaleString('zh-CN')
        });
        this.renderContent(container);
    },

    async toggleIpStatus(id, container) {
        const ip = this.state.ipWhitelist.find(item => item.id === parseInt(id));
        if (ip) {
            ip.status = ip.status === 'active' ? 'inactive' : 'active';
            this.renderContent(container);
        }
    },

    async deleteIp(id, container) {
        this.state.ipWhitelist = this.state.ipWhitelist.filter(item => item.id !== parseInt(id));
        this.renderContent(container);
    },

    async savePolicy(container) {
        const policyData = {
            passwordMinLength: parseInt(document.getElementById('passwordMinLength')?.value || 8),
            passwordComplexity: document.getElementById('passwordComplexity')?.value || 'medium',
            maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts')?.value || 5),
            lockoutDuration: parseInt(document.getElementById('lockoutDuration')?.value || 30),
            sessionTimeout: parseInt(document.getElementById('sessionTimeout')?.value || 30),
            enableCaptcha: document.getElementById('enableCaptcha')?.classList.contains('active'),
            enableSso: document.getElementById('enableSso')?.classList.contains('active'),
            apiRateLimit: parseInt(document.getElementById('apiRateLimit')?.value || 100),
            enableRequestSign: document.getElementById('enableRequestSign')?.classList.contains('active')
        };
        this.state.policy = policyData;
        localStorage.setItem('security_policy', JSON.stringify(policyData));
        if (typeof Utils !== 'undefined' && Utils.Toast) {
            Utils.Toast.success('安全策略保存成功！');
        }
    },

    async resolveEvent(id, container) {
        const event = this.state.events.find(e => e.id === parseInt(id));
        if (event) {
            event.isResolved = true;
            this.renderContent(container);
        }
    }
};

export default Security;
