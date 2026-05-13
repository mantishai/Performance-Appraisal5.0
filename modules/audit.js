const Audit = {
    state: {
        currentTab: 'dashboard',
        logs: [],
        stats: {
            todayTotal: 0,
            create: 0,
            update: 0,
            delete: 0,
            read: 0
        },
        sensitiveOperations: [],
        activeUsers: []
    },

    async render(container) {
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const { default: API } = await import('../api.js');
            const logsRes = await API.getAuditLogs();
            const statsRes = await API.getAuditStatistics();
            const sensitiveRes = await API.getSensitiveOperations();
            
            this.state.logs = logsRes.data;
            this.state.stats = statsRes.data;
            this.state.sensitiveOperations = sensitiveRes.data;
            
            const userCount = {};
            this.state.logs.forEach(log => {
                if (log.username) {
                    userCount[log.username] = (userCount[log.username] || 0) + 1;
                }
            });
            this.state.activeUsers = Object.entries(userCount)
                .map(([username, count]) => ({ username, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
        } catch (error) {
            console.error('Load audit data failed:', error);
        }
    },

    renderContent(container) {
        const tabs = ['dashboard', 'logs', 'sensitive', 'reports'];
        const tabTexts = {
            'dashboard': '审计看板',
            'logs': '审计日志',
            'sensitive': '敏感操作',
            'reports': '审计报表'
        };

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">审计日志中心</h1>
            </div>
            <div class="card">
                <div class="audit-tabs">
                    ${tabs.map(tab => `
                        <button class="audit-tab-btn ${this.state.currentTab === tab ? 'active' : ''}" data-tab="${tab}">
                            <span class="tab-icon">${this.getTabIcon(tab)}</span>
                            <span>${tabTexts[tab]}</span>
                        </button>
                    `).join('')}
                </div>

                <div class="audit-content">
                    ${this.state.currentTab === 'dashboard' ? this.renderDashboard() : ''}
                    ${this.state.currentTab === 'logs' ? this.renderLogs() : ''}
                    ${this.state.currentTab === 'sensitive' ? this.renderSensitive() : ''}
                    ${this.state.currentTab === 'reports' ? this.renderReports() : ''}
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    getTabIcon(tab) {
        const icons = {
            'dashboard': '📊',
            'logs': '📋',
            'sensitive': '⚠️',
            'reports': '📑'
        };
        return icons[tab] || '📋';
    },

    renderDashboard() {
        const stats = this.state.stats;
        return `
            <div class="audit-stats-grid">
                <div class="audit-stat-card primary">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${stats.todayTotal}</div>
                    <div class="stat-label">今日操作</div>
                </div>
                <div class="audit-stat-card success">
                    <div class="stat-icon">➕</div>
                    <div class="stat-value">${stats.create}</div>
                    <div class="stat-label">创建记录</div>
                </div>
                <div class="audit-stat-card info">
                    <div class="stat-icon">✏️</div>
                    <div class="stat-value">${stats.update}</div>
                    <div class="stat-label">更新记录</div>
                </div>
                <div class="audit-stat-card danger">
                    <div class="stat-icon">🗑️</div>
                    <div class="stat-value">${stats.delete}</div>
                    <div class="stat-label">删除记录</div>
                </div>
            </div>

            <div class="audit-charts">
                <div class="audit-chart-card">
                    <div class="chart-header">
                        <h3>操作类型分布</h3>
                    </div>
                    <div class="chart-container" id="operationTypeChart">
                        ${this.renderOperationTypeChart()}
                    </div>
                </div>
                <div class="audit-chart-card">
                    <div class="chart-header">
                        <h3>活跃用户排行</h3>
                    </div>
                    <div class="user-ranking-list">
                        ${this.state.activeUsers.map((user, index) => `
                            <div class="user-rank-item">
                                <div class="rank-number">${index + 1}</div>
                                <div class="rank-info">
                                    <div class="rank-username">${user.username}</div>
                                    <div class="rank-count">${user.count} 次操作</div>
                                </div>
                                <div class="rank-bar">
                                    <div class="rank-bar-fill" style="width: ${Math.min((user.count / this.state.stats.todayTotal) * 100, 100)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="recent-audits">
                <h3>最近审计记录</h3>
                <div class="recent-audits-list">
                    ${this.state.logs.slice(0, 8).map(log => this.renderLogItem(log)).join('')}
                </div>
            </div>
        `;
    },

    renderOperationTypeChart() {
        const total = this.state.stats.create + this.state.stats.update + this.state.stats.delete + this.state.stats.read;
        const types = [
            { name: 'CREATE', value: this.state.stats.create, color: '#52c41a' },
            { name: 'UPDATE', value: this.state.stats.update, color: '#1890ff' },
            { name: 'DELETE', value: this.state.stats.delete, color: '#ff4d4f' },
            { name: 'READ', value: this.state.stats.read, color: '#8ba9c4' }
        ];
        return `
            <div class="pie-chart-container">
                ${types.map(type => `
                    <div class="pie-legend-item">
                        <span class="pie-color-dot" style="background: ${type.color}"></span>
                        <span class="pie-label">${type.name}</span>
                        <span class="pie-value">${type.value} (${total > 0 ? Math.round((type.value / total) * 100) : 0}%)</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderLogs() {
        const resultColors = {
            'success': 'badge-success',
            'failed': 'badge-danger'
        };
        const actionTexts = {
            'CREATE': '创建',
            'UPDATE': '更新',
            'DELETE': '删除',
            'READ': '读取',
            'LOGIN': '登录',
            'LOGOUT': '登出',
            'EXPORT': '导出',
            'IMPORT': '导入'
        };

        return `
            <div class="audit-filter">
                <div class="filter-group">
                    <select class="form-control" id="moduleFilter">
                        <option value="">全部模块</option>
                        <option value="employee">员工管理</option>
                        <option value="hr">人事管理</option>
                        <option value="attendance">考勤管理</option>
                        <option value="performance">绩效管理</option>
                        <option value="system">系统管理</option>
                    </select>
                </div>
                <div class="filter-group">
                    <select class="form-control" id="actionFilter">
                        <option value="">全部操作</option>
                        <option value="CREATE">创建</option>
                        <option value="UPDATE">更新</option>
                        <option value="DELETE">删除</option>
                        <option value="READ">读取</option>
                        <option value="EXPORT">导出</option>
                    </select>
                </div>
                <div class="filter-group">
                    <input type="text" class="form-control" id="usernameFilter" placeholder="操作人">
                </div>
                <div class="filter-group">
                    <input type="date" class="form-control" id="startDateFilter">
                </div>
                <div class="filter-group">
                    <input type="date" class="form-control" id="endDateFilter">
                </div>
                <button class="btn btn-primary" id="searchLogsBtn">查询</button>
                <button class="btn btn-default" id="exportLogsBtn">导出</button>
            </div>

            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>操作人</th>
                            <th>模块</th>
                            <th>操作类型</th>
                            <th>操作内容</th>
                            <th>IP地址</th>
                            <th>结果</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.logs.length > 0 ? this.state.logs.map(log => `
                            <tr>
                                <td>${log.createTime}</td>
                                <td>${log.username}</td>
                                <td>${log.module || '-'}</td>
                                <td><span class="badge badge-info">${actionTexts[log.action] || log.action}</span></td>
                                <td style="max-width: 300px;">${log.detail || '-'}</td>
                                <td>${log.ip || '-'}</td>
                                <td><span class="badge ${resultColors[log.result]}">${log.result === 'success' ? '成功' : '失败'}</span></td>
                                <td>
                                    <button class="btn btn-text btn-sm" data-action="view-log" data-id="${log.id}">详情</button>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr><td colspan="8" style="text-align: center; padding: 40px; color: #8ba9c4;">暂无审计记录</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSensitive() {
        const typeTexts = {
            'data_export': '数据导出',
            'permission_change': '权限变更',
            'config_modify': '配置修改',
            'batch_delete': '批量删除',
            'password_reset': '密码重置'
        };
        const typeIcons = {
            'data_export': '📤',
            'permission_change': '🔑',
            'config_modify': '⚙️',
            'batch_delete': '🗑️',
            'password_reset': '🔐'
        };

        return `
            <div class="sensitive-header">
                <h3>敏感操作记录</h3>
                <p class="header-desc">所有需要特别关注的重要操作记录</p>
            </div>

            <div class="sensitive-list">
                ${this.state.sensitiveOperations.length > 0 ? this.state.sensitiveOperations.map(op => `
                    <div class="sensitive-item">
                        <div class="sensitive-icon">${typeIcons[op.type] || '⚠️'}</div>
                        <div class="sensitive-info">
                            <div class="sensitive-title">${typeTexts[op.type] || op.type}</div>
                            <div class="sensitive-detail">${op.detail}</div>
                            <div class="sensitive-meta">
                                <span>操作人：${op.username}</span>
                                <span>时间：${op.createTime}</span>
                                <span>IP：${op.ip}</span>
                            </div>
                        </div>
                        <div class="sensitive-actions">
                            <button class="btn btn-text btn-sm" data-action="view-sensitive" data-id="${op.id}">查看</button>
                        </div>
                    </div>
                `).join('') : `
                    <div class="empty-state" style="padding: 60px; text-align: center;">
                        <div class="empty-icon">✅</div>
                        <div class="empty-text">暂无敏感操作记录</div>
                    </div>
                `}
            </div>
        `;
    },

    renderReports() {
        return `
            <div class="reports-header">
                <h3>审计报表</h3>
            </div>

            <div class="reports-grid">
                <div class="report-card">
                    <div class="report-icon">📊</div>
                    <div class="report-title">日报</div>
                    <div class="report-desc">今日所有操作记录汇总</div>
                    <div class="report-actions">
                        <button class="btn btn-primary btn-sm" data-action="generate-report" data-period="day">生成</button>
                        <button class="btn btn-default btn-sm" data-action="export-report" data-period="day">导出</button>
                    </div>
                </div>
                <div class="report-card">
                    <div class="report-icon">📈</div>
                    <div class="report-title">周报</div>
                    <div class="report-desc">本周操作统计与分析</div>
                    <div class="report-actions">
                        <button class="btn btn-primary btn-sm" data-action="generate-report" data-period="week">生成</button>
                        <button class="btn btn-default btn-sm" data-action="export-report" data-period="week">导出</button>
                    </div>
                </div>
                <div class="report-card">
                    <div class="report-icon">📉</div>
                    <div class="report-title">月报</div>
                    <div class="report-desc">月度全面审计报告</div>
                    <div class="report-actions">
                        <button class="btn btn-primary btn-sm" data-action="generate-report" data-period="month">生成</button>
                        <button class="btn btn-default btn-sm" data-action="export-report" data-period="month">导出</button>
                    </div>
                </div>
            </div>

            <div class="report-config">
                <h4>自定义报表</h4>
                <div class="config-form">
                    <div class="form-group">
                        <label>开始时间</label>
                        <input type="date" class="form-control" id="reportStartDate">
                    </div>
                    <div class="form-group">
                        <label>结束时间</label>
                        <input type="date" class="form-control" id="reportEndDate">
                    </div>
                    <div class="form-group">
                        <label>模块</label>
                        <select class="form-control" id="reportModule">
                            <option value="">全部模块</option>
                            <option value="employee">员工管理</option>
                            <option value="hr">人事管理</option>
                            <option value="attendance">考勤管理</option>
                            <option value="performance">绩效管理</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>格式</label>
                        <select class="form-control" id="reportFormat">
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="csv">CSV</option>
                        </select>
                    </div>
                </div>
                <div class="config-actions">
                    <button class="btn btn-primary" id="generateCustomReport">
                        <span>📊</span>
                        <span>生成报表</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderLogItem(log) {
        const actionColors = {
            'CREATE': 'bg-success',
            'UPDATE': 'bg-info',
            'DELETE': 'bg-danger',
            'READ': 'bg-default',
            'LOGIN': 'bg-primary',
            'EXPORT': 'bg-warning'
        };
        const actionIcons = {
            'CREATE': '➕',
            'UPDATE': '✏️',
            'DELETE': '🗑️',
            'READ': '👁️',
            'LOGIN': '🚪',
            'EXPORT': '📤'
        };

        return `
            <div class="log-item">
                <div class="log-icon ${actionColors[log.action] || ''}">${actionIcons[log.action] || '📋'}</div>
                <div class="log-content">
                    <div class="log-header">
                        <span class="log-action">${log.action}</span>
                        <span class="log-username">${log.username}</span>
                        <span class="log-module">${log.module}</span>
                    </div>
                    <div class="log-detail">${log.detail || '-'}</div>
                    <div class="log-footer">
                        <span class="log-time">${log.createTime}</span>
                        <span class="log-ip">IP: ${log.ip}</span>
                        <span class="log-result ${log.result}">${log.result === 'success' ? '成功' : '失败'}</span>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents(container) {
        container.querySelectorAll('.audit-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.currentTab = btn.dataset.tab;
                this.renderContent(container);
            });
        });

        container.querySelector('#searchLogsBtn')?.addEventListener('click', async () => {
            this.renderContent(container);
        });

        container.querySelector('#exportLogsBtn')?.addEventListener('click', async () => {
            this.exportLogs(container);
        });

        container.querySelectorAll('[data-action="view-log"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.viewLogDetail(btn.dataset.id);
            });
        });

        container.querySelectorAll('[data-action="generate-report"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.generateReport(btn.dataset.period);
            });
        });

        container.querySelectorAll('[data-action="export-report"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.exportReport(btn.dataset.period);
            });
        });

        container.querySelector('#generateCustomReport')?.addEventListener('click', () => {
            this.generateCustomReport();
        });
    },

    exportLogs(container) {
        if (typeof Utils !== 'undefined' && Utils.Toast) {
            Utils.Toast.info('正在导出审计日志...');
        }
    },

    viewLogDetail(id) {
        const log = this.state.logs.find(l => l.id === parseInt(id));
        if (log) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h2>审计记录详情</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-item">
                            <span class="detail-label">时间</span>
                            <span class="detail-value">${log.createTime}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">操作人</span>
                            <span class="detail-value">${log.username}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">模块</span>
                            <span class="detail-value">${log.module || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">操作类型</span>
                            <span class="detail-value">${log.action}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">操作内容</span>
                            <span class="detail-value">${log.detail || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">IP地址</span>
                            <span class="detail-value">${log.ip || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">User-Agent</span>
                            <span class="detail-value" style="word-break: break-all;">${log.userAgent || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">结果</span>
                            <span class="detail-value">${log.result === 'success' ? '成功' : '失败'}</span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-default modal-cancel">关闭</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
            modal.querySelector('.modal-cancel')?.addEventListener('click', () => modal.remove());
        }
    },

    generateReport(period) {
        const messages = {
            'day': '日报生成中...',
            'week': '周报生成中...',
            'month': '月报生成中...'
        };
        if (typeof Utils !== 'undefined' && Utils.Toast) {
            Utils.Toast.info(messages[period] || '报表生成中...');
        }
    },

    exportReport(period) {
        if (typeof Utils !== 'undefined' && Utils.Toast) {
            Utils.Toast.info('正在导出报表...');
        }
    },

    generateCustomReport() {
        if (typeof Utils !== 'undefined' && Utils.Toast) {
            Utils.Toast.info('正在生成自定义报表...');
        }
    }
};

export default Audit;
