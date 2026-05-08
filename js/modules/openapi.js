import { Toast, Skeleton, Modal, Pagination, copyToClipboard, generateAppKey, generateAppSecret } from '../utils.js';
import API from '../api.js';

const state = {
    currentTab: 'apps',
    apps: [],
    apis: [],
    logs: [],
    stats: null,
    doc: {},
    selectedApp: null,
    selectedAPI: null,
    selectedPermissions: [],
    logFilters: {
        appId: '',
        status: '',
        page: 1,
        pageSize: 10
    },
    testParams: {},
    testResult: null
};

const openapiModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(5, 8) + Skeleton.renderStats();
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [appsRes, apisRes, logsRes, statsRes, docRes] = await Promise.all([
                API.getOpenapiApps(),
                API.getOpenapiAPIs(),
                API.getOpenapiLogs(),
                API.getOpenapiStatistics(),
                API.getOpenapiDoc()
            ]);
            if (appsRes.code === 200) state.apps = appsRes.data;
            if (apisRes.code === 200) state.apis = apisRes.data;
            if (logsRes.code === 200) state.logs = logsRes.data;
            if (statsRes.code === 200) state.stats = statsRes.data;
            if (docRes.code === 200) state.doc = docRes.data;
        } catch (error) {
            console.error('Failed to load openapi data:', error);
        }
    },

    renderContent(container) {
        const methodColors = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'error' };
        const statusColors = { active: 'active', inactive: 'inactive' };
        const statusTexts = { active: '已启用', inactive: '已禁用' };

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">API开放平台</h1>
            </div>

            ${state.stats ? `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">📊</div>
                    <div class="stat-info">
                        <div class="stat-label">今日调用</div>
                        <div class="stat-value">${state.stats.todayCalls?.toLocaleString() || 0}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">📅</div>
                    <div class="stat-info">
                        <div class="stat-label">昨日调用</div>
                        <div class="stat-value">${state.stats.yesterdayCalls?.toLocaleString() || 0}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">✅</div>
                    <div class="stat-info">
                        <div class="stat-label">成功率</div>
                        <div class="stat-value">${state.stats.successRate || 0}%</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">⏱️</div>
                    <div class="stat-info">
                        <div class="stat-label">平均响应</div>
                        <div class="stat-value">${state.stats.avgResponseTime || 0}ms</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'apps' ? 'btn-primary' : 'btn-default'}" data-tab="apps">🔑 应用管理</button>
                    <button class="btn ${state.currentTab === 'permissions' ? 'btn-primary' : 'btn-default'}" data-tab="permissions">⚡ 接口授权</button>
                    <button class="btn ${state.currentTab === 'monitor' ? 'btn-primary' : 'btn-default'}" data-tab="monitor">📈 调用监控</button>
                    <button class="btn ${state.currentTab === 'docs' ? 'btn-primary' : 'btn-default'}" data-tab="docs">📄 API文档</button>
                </div>

                ${state.currentTab === 'apps' ? this.renderAppsTab(statusColors, statusTexts) : ''}
                ${state.currentTab === 'permissions' ? this.renderPermissionsTab() : ''}
                ${state.currentTab === 'monitor' ? this.renderMonitorTab(methodColors) : ''}
                ${state.currentTab === 'docs' ? this.renderDocsTab(methodColors) : ''}
            </div>
        `;

        this.bindEvents(container);
    },

    renderAppsTab(statusColors, statusTexts) {
        return `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-primary" id="addAppBtn">+ 创建应用</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>应用名称</th>
                            <th>App Key</th>
                            <th>QPS限制</th>
                            <th>日调用限制</th>
                            <th>状态</th>
                            <th>创建时间</th>
                            <th>最后调用</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.apps.map(app => `
                            <tr>
                                <td><strong>${app.appName}</strong></td>
                                <td><code style="background: rgba(24,144,255,0.1); padding: 4px 8px; border-radius: 4px; color: #1890ff; font-size: 12px;">${app.appKey}</code></td>
                                <td>${app.qpsLimit}</td>
                                <td>${app.dailyLimit?.toLocaleString()}</td>
                                <td><span class="status-tag ${statusColors[app.status]}">${statusTexts[app.status]}</span></td>
                                <td>${app.createTime}</td>
                                <td>${app.lastCallTime || '-'}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" data-id="${app.id}" data-action="secret">密钥</button>
                                        <button class="action-btn" data-id="${app.id}" data-action="edit">编辑</button>
                                        <button class="action-btn" data-id="${app.id}" data-action="toggle">${app.status === 'active' ? '禁用' : '启用'}</button>
                                        <button class="action-btn" data-id="${app.id}" data-action="delete" style="color: #f5222d;">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderPermissionsTab() {
        const moduleGroups = {};
        state.apis.forEach(api => {
            if (!moduleGroups[api.module]) moduleGroups[api.module] = [];
            moduleGroups[api.module].push(api);
        });

        const moduleNames = {
            employee: '员工管理',
            attendance: '考勤管理',
            contract: '合同管理',
            recruitment: '招聘管理',
            performance: '绩效管理'
        };

        const selectedApp = state.selectedApp ? state.apps.find(a => a.id === state.selectedApp) : null;

        return `
            <div style="display: flex; gap: 20px;">
                <div style="flex: 1;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 8px; color: #1a3a5c; font-weight: 500;">选择应用</label>
                        <select id="appSelect" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px;">
                            <option value="">请选择应用</option>
                            ${state.apps.map(app => `
                                <option value="${app.id}" ${state.selectedApp === app.id ? 'selected' : ''}>${app.appName}</option>
                            `).join('')}
                        </select>
                    </div>

                    ${selectedApp ? `
                        <div style="background: #f8fcff; border: 1px solid rgba(24,144,255,0.1); border-radius: 16px; padding: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <strong style="color: #1a3a5c;">🔌 可授权接口</strong>
                                <button class="btn btn-sm" id="selectAllAPIs">全选</button>
                            </div>
                            
                            <div style="max-height: 500px; overflow-y: auto;">
                                ${Object.entries(moduleGroups).map(([module, apis]) => `
                                    <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(24,144,255,0.1);">
                                        <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px;">📦 ${moduleNames[module] || module}</div>
                                        <div style="display: flex; flex-direction: column; gap: 8px;">
                                            ${apis.map(api => `
                                                <label style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: white; border-radius: 8px; cursor: pointer;">
                                                    <input type="checkbox" class="api-checkbox" value="${api.id}" ${state.selectedPermissions.includes(api.id) ? 'checked' : ''}>
                                                    <span style="flex: 1;">${api.name}</span>
                                                    <code style="background: rgba(24,144,255,0.1); padding: 2px 6px; border-radius: 4px; color: #1890ff; font-size: 11px;">${api.method}</code>
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div style="margin-top: 20px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                                    <div>
                                        <label style="display: block; margin-bottom: 4px; color: #8ba9c4; font-size: 12px;">QPS限制</label>
                                        <input type="number" id="qpsLimit" value="${selectedApp.qpsLimit}" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px;">
                                    </div>
                                    <div>
                                        <label style="display: block; margin-bottom: 4px; color: #8ba9c4; font-size: 12px;">日调用限制</label>
                                        <input type="number" id="dailyLimit" value="${selectedApp.dailyLimit}" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px;">
                                    </div>
                                </div>
                            </div>
                            
                            <button class="btn btn-primary" id="savePermissionsBtn" style="width: 100%; margin-top: 16px;">
                                💾 保存授权配置
                            </button>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 60px; background: #f8fcff; border-radius: 16px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">🔌</div>
                            <div style="color: #1a3a5c; font-weight: bold; margin-bottom: 8px;">请先选择应用</div>
                            <div style="color: #8ba9c4;">选择应用后可配置API权限</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderMonitorTab(methodColors) {
        const filteredLogs = state.logs.filter(log => {
            if (state.logFilters.appId && log.appId !== parseInt(state.logFilters.appId)) return false;
            if (state.logFilters.status) {
                if (state.logFilters.status === 'success' && log.statusCode >= 400) return false;
                if (state.logFilters.status === 'error' && log.statusCode < 400) return false;
            }
            return true;
        });

        const startIndex = (state.logFilters.page - 1) * state.logFilters.pageSize;
        const endIndex = startIndex + state.logFilters.pageSize;
        const pageLogs = filteredLogs.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredLogs.length / state.logFilters.pageSize);

        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                <div style="background: #f8fcff; border: 1px solid rgba(24,144,255,0.1); border-radius: 16px; padding: 20px;">
                    <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 16px;">📊 调用趋势（近7天）</div>
                    <div style="height: 200px; display: flex; align-items: flex-end; gap: 8px;">
                        ${(state.stats?.trendData || []).map((day, i) => `
                            <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                                <div style="width: 100%; background: linear-gradient(180deg, #1890ff, #52c41a); border-radius: 4px 4px 0 0; height: ${Math.max(20, (day.count / Math.max(...(state.stats?.trendData || []).map(d => d.count))) * 160)}px;"></div>
                                <div style="margin-top: 8px; font-size: 11px; color: #8ba9c4;">${day.date?.slice(5)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="background: #f8fcff; border: 1px solid rgba(24,144,255,0.1); border-radius: 16px; padding: 20px;">
                    <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 16px;">🔥 应用调用排行</div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${(state.stats?.appRanking || []).slice(0, 5).map((app, i) => `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 24px; height: 24px; background: ${i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : '#cd7f32'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">${i + 1}</div>
                                <div style="flex: 1;">
                                    <div style="font-size: 13px; color: #1a3a5c;">${app.appName}</div>
                                    <div style="width: 100%; height: 6px; background: rgba(24,144,255,0.1); border-radius: 3px; margin-top: 4px;">
                                        <div style="width: ${Math.min(100, (app.count / Math.max(...(state.stats?.appRanking || []).map(a => a.count))) * 100)}%; height: 100%; background: linear-gradient(90deg, #1890ff, #52c41a); border-radius: 3px;"></div>
                                    </div>
                                </div>
                                <div style="width: 60px; text-align: right; font-size: 13px; color: #1890ff;">${app.count?.toLocaleString()}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
                <select id="logAppFilter" style="padding: 8px 12px; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px;">
                    <option value="">全部应用</option>
                    ${state.apps.map(app => `<option value="${app.id}" ${state.logFilters.appId === app.id ? 'selected' : ''}>${app.appName}</option>`).join('')}
                </select>
                <select id="logStatusFilter" style="padding: 8px 12px; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px;">
                    <option value="">全部状态</option>
                    <option value="success" ${state.logFilters.status === 'success' ? 'selected' : ''}>成功</option>
                    <option value="error" ${state.logFilters.status === 'error' ? 'selected' : ''}>失败</option>
                </select>
                <button class="btn btn-default" id="refreshLogsBtn">🔄 刷新</button>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>时间</th>
                            <th>应用</th>
                            <th>API路径</th>
                            <th>方法</th>
                            <th>状态码</th>
                            <th>响应时间</th>
                            <th>客户端IP</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageLogs.map(log => {
                            const app = state.apps.find(a => a.id === log.appId);
                            return `
                                <tr>
                                    <td>${log.requestTime}</td>
                                    <td><strong>${app?.appName || log.appName || '-'}</strong></td>
                                    <td><code style="background: rgba(24,144,255,0.1); padding: 4px 8px; border-radius: 4px; color: #1890ff; font-size: 12px;">${log.apiPath}</code></td>
                                    <td><span class="status-tag ${methodColors[log.method]}" style="padding: 4px 12px;">${log.method}</span></td>
                                    <td><span class="status-tag ${log.statusCode < 400 ? 'active' : 'inactive'}">${log.statusCode}</span></td>
                                    <td>${log.responseTime}ms</td>
                                    <td>${log.clientIp}</td>
                                    <td><button class="action-btn" data-log='${JSON.stringify(log)}' data-action="logDetail">详情</button></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div id="pagination"></div>
        `;
    },

    renderDocsTab(methodColors) {
        const moduleNames = {
            employee: '员工管理',
            attendance: '考勤管理',
            contract: '合同管理',
            recruitment: '招聘管理',
            performance: '绩效管理'
        };

        const docData = state.doc;
        const modules = Object.keys(docData);

        const selectedAPI = state.selectedAPI;

        return `
            <div style="display: flex; gap: 20px;">
                <div style="width: 280px; flex-shrink: 0;">
                    <div style="background: #f8fcff; border: 1px solid rgba(24,144,255,0.1); border-radius: 16px; padding: 16px;">
                        <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px;">📚 API目录</div>
                        
                        ${modules.map(module => `
                            <div style="margin-bottom: 12px;">
                                <div style="font-size: 13px; font-weight: 500; color: #1a3a5c; margin-bottom: 8px;">📦 ${moduleNames[module] || module}</div>
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    ${(docData[module] || []).map(api => `
                                        <div style="padding: 8px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: ${selectedAPI?.id === api.id ? 'rgba(24,144,255,0.1)' : 'white'}; border: 1px solid ${selectedAPI?.id === api.id ? 'rgba(24,144,255,0.3)' : 'transparent'}" class="api-item" data-api='${JSON.stringify(api)}'>
                                            <span class="status-tag ${methodColors[api.method]}" style="padding: 2px 8px; font-size: 11px;">${api.method}</span>
                                            <span style="font-size: 12px; color: #1a3a5c;">${api.name}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="flex: 1;">
                    ${selectedAPI ? `
                        <div style="background: white; border: 1px solid rgba(24,144,255,0.1); border-radius: 16px; padding: 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                        <span class="status-tag ${methodColors[selectedAPI.method]}" style="padding: 6px 16px; font-size: 14px;">${selectedAPI.method}</span>
                                        <h2 style="margin: 0; color: #1a3a5c;">${selectedAPI.name}</h2>
                                    </div>
                                    <code style="background: rgba(24,144,255,0.1); padding: 8px 12px; border-radius: 8px; color: #1890ff; font-size: 13px;">${selectedAPI.path}</code>
                                </div>
                                <button class="btn btn-primary" id="tryTestBtn">🧪 在线测试</button>
                            </div>

                            <div style="margin-bottom: 24px;">
                                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px;">📝 接口描述</div>
                                <p style="color: #8ba9c4; margin: 0;">${selectedAPI.description}</p>
                            </div>

                            ${selectedAPI.params && selectedAPI.params.length > 0 ? `
                                <div style="margin-bottom: 24px;">
                                    <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px;">📋 请求参数</div>
                                    <div class="table-container">
                                        <table class="data-table">
                                            <thead>
                                                <tr>
                                                    <th>参数名</th>
                                                    <th>类型</th>
                                                    <th>必填</th>
                                                    <th>描述</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${selectedAPI.params.map(param => `
                                                    <tr>
                                                        <td><code style="color: #1890ff;">${param.name}</code></td>
                                                        <td>${param.type}</td>
                                                        <td><span class="status-tag ${param.required ? 'active' : 'inactive'}">${param.required ? '是' : '否'}</span></td>
                                                        <td>${param.description}</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ` : ''}

                            <div style="margin-bottom: 24px;">
                                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px;">📄 返回示例</div>
                                <pre style="background: #1a1a2e; color: #a5e844; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.6;">${JSON.stringify(selectedAPI.responseExample, null, 2)}</pre>
                            </div>

                            <div style="margin-bottom: 24px;">
                                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px;">💻 代码示例</div>
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <div>
                                        <div style="font-size: 12px; color: #8ba9c4; margin-bottom: 8px;">JavaScript (Fetch)</div>
                                        <pre style="background: #1a1a2e; color: #74b0ff; padding: 12px; border-radius: 8px; font-size: 11px;">
const response = await fetch('${selectedAPI.path}', {
    method: '${selectedAPI.method}',
    headers: {
        'Content-Type': 'application/json',
        'X-App-Key': 'your_app_key',
        'X-Timestamp': Date.now(),
        'X-Nonce': Math.random().toString(36),
        'X-Signature': 'generated_signature'
    }
});
const data = await response.json();
console.log(data);
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 80px; background: #f8fcff; border-radius: 16px;">
                            <div style="font-size: 64px; margin-bottom: 16px;">📄</div>
                            <div style="color: #1a3a5c; font-weight: bold; margin-bottom: 8px;">请选择API</div>
                            <div style="color: #8ba9c4;">从左侧目录中选择一个API查看文档</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    bindEvents(container) {
        container.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                this.renderContent(container);
            });
        });

        container.addEventListener('click', async (e) => {
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                const log = actionBtn.dataset.log;

                switch (action) {
                    case 'secret':
                        await this.showAppSecret(parseInt(id));
                        break;
                    case 'edit':
                        this.openAppForm(parseInt(id));
                        break;
                    case 'toggle':
                        await this.toggleAppStatus(parseInt(id));
                        break;
                    case 'delete':
                        await this.deleteApp(parseInt(id));
                        break;
                    case 'logDetail':
                        this.showLogDetail(JSON.parse(log));
                        break;
                }
            }
        });

        container.querySelector('#addAppBtn')?.addEventListener('click', () => {
            this.openAppForm();
        });

        container.querySelector('#appSelect')?.addEventListener('change', async (e) => {
            state.selectedApp = e.target.value ? parseInt(e.target.value) : null;
            if (state.selectedApp) {
                try {
                    const res = await API.getOpenapiAppPermissions(state.selectedApp);
                    if (res.code === 200) {
                        state.selectedPermissions = res.data.map(p => p.apiId);
                    }
                } catch (e) {
                    console.error('Failed to load permissions:', e);
                }
            } else {
                state.selectedPermissions = [];
            }
            this.renderContent(container);
        });

        container.querySelector('#selectAllAPIs')?.addEventListener('click', () => {
            const checkboxes = container.querySelectorAll('.api-checkbox');
            const allChecked = [...checkboxes].every(cb => cb.checked);
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
            });
            state.selectedPermissions = [...checkboxes].filter(cb => !allChecked).map(cb => parseInt(cb.value));
        });

        container.querySelectorAll('.api-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                state.selectedPermissions = [...container.querySelectorAll('.api-checkbox:checked')].map(cb => parseInt(cb.value));
            });
        });

        container.querySelector('#savePermissionsBtn')?.addEventListener('click', async () => {
            if (!state.selectedApp) {
                Toast.warning('请先选择应用');
                return;
            }
            try {
                const qpsLimit = parseInt(document.getElementById('qpsLimit')?.value) || 100;
                const dailyLimit = parseInt(document.getElementById('dailyLimit')?.value) || 10000;
                
                const app = state.apps.find(a => a.id === state.selectedApp);
                if (app) {
                    await API.updateOpenapiApp(state.selectedApp, { ...app, qpsLimit, dailyLimit });
                }

                const permissions = state.selectedPermissions.map(apiId => ({
                    appId: state.selectedApp,
                    apiId,
                    permission: 'readwrite'
                }));
                await API.updateOpenapiAppPermissions(state.selectedApp, permissions);

                Toast.success('授权配置保存成功');
                await this.loadData();
                this.renderContent(container);
            } catch (e) {
                Toast.error('保存失败');
            }
        });

        container.querySelector('#logAppFilter')?.addEventListener('change', (e) => {
            state.logFilters.appId = e.target.value;
            state.logFilters.page = 1;
            this.renderContent(container);
        });

        container.querySelector('#logStatusFilter')?.addEventListener('change', (e) => {
            state.logFilters.status = e.target.value;
            state.logFilters.page = 1;
            this.renderContent(container);
        });

        container.querySelector('#refreshLogsBtn')?.addEventListener('click', async () => {
            await this.loadData();
            Toast.success('日志已刷新');
            this.renderContent(container);
        });

        container.querySelectorAll('.api-item').forEach(item => {
            item.addEventListener('click', () => {
                state.selectedAPI = JSON.parse(item.dataset.api);
                state.testParams = {};
                state.testResult = null;
                this.renderContent(container);
            });
        });

        container.querySelector('#tryTestBtn')?.addEventListener('click', () => {
            this.openTestModal();
        });

        this.renderPagination(container);
    },

    renderPagination(container) {
        const paginationContainer = container.querySelector('#pagination');
        if (paginationContainer) {
            const filteredLogs = state.logs.filter(log => {
                if (state.logFilters.appId && log.appId !== parseInt(state.logFilters.appId)) return false;
                if (state.logFilters.status) {
                    if (state.logFilters.status === 'success' && log.statusCode >= 400) return false;
                    if (state.logFilters.status === 'error' && log.statusCode < 400) return false;
                }
                return true;
            });

            Pagination.render('pagination', {
                current: state.logFilters.page,
                total: filteredLogs.length,
                pageSize: state.logFilters.pageSize,
                onPageChange: (page) => {
                    state.logFilters.page = page;
                    this.renderContent(container);
                }
            });
        }
    },

    async showAppSecret(id) {
        try {
            const res = await API.getOpenapiAppSecret(id);
            if (res.code === 200) {
                const { appKey, appSecret } = res.data;
                const modal = Modal.open({
                    title: '🔑 应用密钥',
                    content: `
                        <div style="background: #f8fcff; border: 1px solid rgba(24,144,255,0.1); border-radius: 16px; padding: 20px;">
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; margin-bottom: 8px; color: #8ba9c4; font-size: 12px;">App Key</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" value="${appKey}" readonly style="flex: 1; padding: 10px 12px; background: white; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px; font-family: monospace;">
                                    <button class="btn btn-default" id="copyAppKey">复制</button>
                                </div>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; color: #8ba9c4; font-size: 12px;">App Secret</label>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" value="${appSecret}" readonly style="flex: 1; padding: 10px 12px; background: white; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px; font-family: monospace;">
                                    <button class="btn btn-default" id="copyAppSecret">复制</button>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top: 16px; background: #fff7e6; border: 1px solid rgba(250,173,20,0.2); border-radius: 12px; padding: 12px;">
                            <div style="display: flex; gap: 8px; align-items: start;">
                                <span>⚠️</span>
                                <div>
                                    <div style="font-weight: 500; color: #faad14; margin-bottom: 4px;">重要提示</div>
                                    <div style="font-size: 12px; color: #8ba9c4;">请妥善保管您的App Secret，不要将其提交到代码仓库或分享给他人。如果发现泄露，请立即重置。</div>
                                </div>
                            </div>
                        </div>
                    `,
                    footer: `
                        <button class="btn btn-danger" id="resetSecretBtn">🔄 重置密钥</button>
                        <button class="btn btn-default modal-cancel">关闭</button>
                    `
                });

                document.getElementById('copyAppKey')?.addEventListener('click', () => {
                    copyToClipboard(appKey);
                    Toast.success('App Key已复制');
                });

                document.getElementById('copyAppSecret')?.addEventListener('click', () => {
                    copyToClipboard(appSecret);
                    Toast.success('App Secret已复制');
                });

                document.getElementById('resetSecretBtn')?.addEventListener('click', async () => {
                    Modal.confirm('确定要重置密钥吗？重置后原密钥将立即失效。', async () => {
                        const resetRes = await API.resetOpenapiAppSecret(id);
                        if (resetRes.code === 200) {
                            Toast.success('密钥已重置');
                            modal.close();
                            await this.loadData();
                            await this.showAppSecret(id);
                        }
                    });
                });
            }
        } catch (e) {
            Toast.error('获取密钥失败');
        }
    },

    openAppForm(id = null) {
        const app = id ? state.apps.find(a => a.id === id) : null;
        const isEdit = !!app;

        const modal = Modal.open({
            title: isEdit ? '编辑应用' : '创建应用',
            content: `
                <form id="appForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>应用名称 <span class="required">*</span></label>
                            <input type="text" id="appName" value="${app?.appName || ''}" placeholder="请输入应用名称">
                        </div>
                        <div class="form-field">
                            <label>QPS限制</label>
                            <input type="number" id="appQps" value="${app?.qpsLimit || 100}" placeholder="100">
                        </div>
                        <div class="form-field">
                            <label>日调用限制</label>
                            <input type="number" id="appDailyLimit" value="${app?.dailyLimit || 10000}" placeholder="10000">
                        </div>
                        <div class="form-field full">
                            <label>回调地址</label>
                            <input type="text" id="appCallback" value="${app?.callbackUrl || ''}" placeholder="https://example.com/callback">
                        </div>
                        <div class="form-field full">
                            <label>IP白名单（多个用逗号分隔）</label>
                            <input type="text" id="appIps" value="${app?.ipWhitelist?.join(', ') || ''}" placeholder="192.168.1.0/24, 10.0.0.0/8">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveAppBtn">保存</button>
            `
        });

        document.getElementById('saveAppBtn')?.addEventListener('click', async () => {
            const name = document.getElementById('appName')?.value?.trim();
            if (!name) {
                Toast.warning('请输入应用名称');
                return;
            }

            const data = {
                appName: name,
                qpsLimit: parseInt(document.getElementById('appQps')?.value) || 100,
                dailyLimit: parseInt(document.getElementById('appDailyLimit')?.value) || 10000,
                callbackUrl: document.getElementById('appCallback')?.value || '',
                ipWhitelist: document.getElementById('appIps')?.value?.split(',').map(s => s.trim()).filter(s => s) || []
            };

            try {
                if (isEdit) {
                    await API.updateOpenapiApp(id, { ...app, ...data });
                    Toast.success('应用已更新');
                } else {
                    await API.createOpenapiApp(data);
                    Toast.success('应用创建成功');
                }
                modal.close();
                await this.loadData();
                const container = document.getElementById('content');
                this.renderContent(container);
            } catch (e) {
                Toast.error('保存失败');
            }
        });
    },

    async toggleAppStatus(id) {
        const app = state.apps.find(a => a.id === id);
        if (!app) return;

        try {
            const newStatus = app.status === 'active' ? 'inactive' : 'active';
            await API.updateOpenapiAppStatus(id, newStatus);
            Toast.success(`应用已${newStatus === 'active' ? '启用' : '禁用'}`);
            await this.loadData();
            const container = document.getElementById('content');
            this.renderContent(container);
        } catch (e) {
            Toast.error('操作失败');
        }
    },

    async deleteApp(id) {
        Modal.confirm('确定要删除该应用吗？此操作不可恢复！', async () => {
            try {
                await API.deleteOpenapiApp(id);
                Toast.success('应用已删除');
                await this.loadData();
                const container = document.getElementById('content');
                this.renderContent(container);
            } catch (e) {
                Toast.error('删除失败');
            }
        });
    },

    showLogDetail(log) {
        const app = state.apps.find(a => a.id === log.appId);
        Modal.open({
            title: '📋 调用日志详情',
            content: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">应用</label>
                        <div style="font-weight: 500; color: #1a3a5c;">${app?.appName || log.appName || '-'}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">请求时间</label>
                        <div style="font-weight: 500; color: #1a3a5c;">${log.requestTime}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">请求方法</label>
                        <div><span class="status-tag ${log.method === 'GET' ? 'success' : log.method === 'POST' ? 'primary' : 'warning'}">${log.method}</span></div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">状态码</label>
                        <div><span class="status-tag ${log.statusCode < 400 ? 'active' : 'inactive'}">${log.statusCode}</span></div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">响应时间</label>
                        <div style="font-weight: 500; color: #1a3a5c;">${log.responseTime}ms</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">客户端IP</label>
                        <div style="font-weight: 500; color: #1a3a5c;">${log.clientIp}</div>
                    </div>
                </div>
                <div class="form-field full" style="margin-top: 16px;">
                    <label style="color: #8ba9c4; font-size: 12px;">API路径</label>
                    <div><code style="background: rgba(24,144,255,0.1); padding: 8px 12px; border-radius: 8px; color: #1890ff; font-size: 13px;">${log.apiPath}</code></div>
                </div>
            `
        });
    },

    openTestModal() {
        const api = state.selectedAPI;
        if (!api) return;

        const methodColors = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'error' };

        const modal = Modal.open({
            title: '🧪 API在线测试',
            content: `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid rgba(24,144,255,0.1);">
                    <span class="status-tag ${methodColors[api.method]}" style="padding: 6px 16px;">${api.method}</span>
                    <code style="flex: 1; background: rgba(24,144,255,0.1); padding: 8px 12px; border-radius: 8px; color: #1890ff; font-size: 13px;">${api.path}</code>
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="font-weight: 500; color: #1a3a5c; margin-bottom: 12px;">📝 请求参数</div>
                    ${api.params && api.params.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${api.params.map(param => `
                                <div>
                                    <label style="display: block; margin-bottom: 4px; font-size: 13px; color: #1a3a5c;">
                                        ${param.name}
                                        ${param.required ? '<span class="required">*</span>' : ''}
                                        <span style="color: #8ba9c4; font-size: 11px;">(${param.type})</span>
                                    </label>
                                    <input type="text" class="test-param-input" data-param="${param.name}" placeholder="${param.description}" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px;">
                                </div>
                            `).join('')}
                        </div>
                    ` : '<div style="color: #8ba9c4;">此接口无需参数</div>'}
                </div>

                <div style="margin-bottom: 16px;">
                    <div style="font-weight: 500; color: #1a3a5c; margin-bottom: 12px;">🔑 认证信息</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="display: block; margin-bottom: 4px; font-size: 12px; color: #8ba9c4;">App Key</label>
                            <select id="testAppSelect" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24,144,255,0.2); border-radius: 8px;">
                                <option value="">选择应用...</option>
                                ${state.apps.map(app => `<option value="${app.appKey}">${app.appName}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                ${state.testResult ? `
                    <div style="margin-top: 20px;">
                        <div style="font-weight: 500; color: #1a3a5c; margin-bottom: 12px;">📄 响应结果</div>
                        <pre style="background: #1a1a2e; color: #a5e844; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; line-height: 1.6;">${JSON.stringify(state.testResult, null, 2)}</pre>
                    </div>
                ` : ''}
            `,
            footer: `
                <button class="btn btn-default modal-cancel">关闭</button>
                <button class="btn btn-primary" id="sendTestBtn">🚀 发送请求</button>
            `
        });

        document.getElementById('sendTestBtn')?.addEventListener('click', async () => {
            try {
                const params = {};
                document.querySelectorAll('.test-param-input').forEach(input => {
                    if (input.value) {
                        params[input.dataset.param] = input.value;
                    }
                });

                const res = await API.testOpenapiAPI({
                    path: api.path,
                    method: api.method,
                    params
                });

                if (res.code === 200) {
                    state.testResult = res.data;
                    Toast.success('请求发送成功');
                    modal.close();
                    await this.loadData();
                    this.openTestModal();
                }
            } catch (e) {
                Toast.error('请求发送失败');
            }
        });
    },

    destroy() {}
};

export default openapiModule;
