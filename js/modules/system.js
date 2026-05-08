import { Toast, Modal } from '../utils.js';
import API from '../api.js';

let charts = {};

const state = {
    currentTab: 'users',
    users: [],
    roles: [],
    permissions: [],
    rolePermissions: {},
    logs: [],
    configs: [],
    selectedUser: null,
    selectedRole: null,
    editingUser: null,
    logFilter: {
        module: '',
        username: ''
    }
};

const systemModule = {
    async render(container) {
        await this.loadData();
        this.renderContent(container);
        if (state.currentTab === 'monitor') {
            this.initCharts();
        }
    },

    async loadData() {
        try {
            const [usersRes, rolesRes, permissionsRes, logsRes, configsRes] = await Promise.all([
                API.getSystemUsers(),
                API.getSystemRoles(),
                API.getSystemPermissions(),
                API.getSystemLogs(),
                API.getSystemConfig()
            ]);
            
            if (usersRes.code === 200) state.users = usersRes.data || [];
            if (rolesRes.code === 200) state.roles = rolesRes.data || [];
            if (permissionsRes.code === 200) state.permissions = permissionsRes.data || [];
            if (logsRes.code === 200) state.logs = logsRes.data || [];
            if (configsRes.code === 200) state.configs = configsRes.data || [];

            for (const role of state.roles) {
                const permRes = await API.getSystemRolePermissions(role.id);
                if (permRes.code === 200) {
                    state.rolePermissions[role.id] = permRes.data?.permissions || [];
                }
            }
        } catch (error) {
            console.error('Failed to load system data:', error);
        }
    },

    renderContent(container) {
        const roleColors = {
            'super_admin': 'badge-primary',
            'hr_admin': 'badge-success',
            'department_manager': 'badge-warning',
            'employee': 'badge-info'
        };
        
        const roleTexts = {
            'super_admin': '超级管理员',
            'hr_admin': 'HR管理员',
            'department_manager': '部门经理',
            'employee': '普通员工'
        };
        
        const statusColors = {
            'active': 'badge-success',
            'inactive': 'badge-danger'
        };
        
        const statusTexts = {
            'active': '启用',
            'inactive': '禁用'
        };
        
        const logStatusColors = {
            'success': 'badge-success',
            'error': 'badge-danger',
            'warning': 'badge-warning'
        };

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">系统管理</h1>
            </div>
            
            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'users' ? 'btn-primary' : 'btn-default'}" data-tab="users">👥 用户管理</button>
                    <button class="btn ${state.currentTab === 'roles' ? 'btn-primary' : 'btn-default'}" data-tab="roles">🔐 角色权限</button>
                    <button class="btn ${state.currentTab === 'settings' ? 'btn-primary' : 'btn-default'}" data-tab="settings">⚙️ 系统设置</button>
                    <button class="btn ${state.currentTab === 'logs' ? 'btn-primary' : 'btn-default'}" data-tab="logs">📋 操作日志</button>
                </div>

                ${state.currentTab === 'users' ? this.renderUsersTab(roleColors, roleTexts, statusColors, statusTexts) : ''}
                ${state.currentTab === 'roles' ? this.renderRolesTab(roleColors, roleTexts) : ''}
                ${state.currentTab === 'settings' ? this.renderSettingsTab() : ''}
                ${state.currentTab === 'logs' ? this.renderLogsTab(logStatusColors) : ''}
            </div>
        `;

        this.bindEvents(container);
    },

    renderUsersTab(roleColors, roleTexts, statusColors, statusTexts) {
        return `
            <div class="table-actions">
                <button class="btn btn-primary" id="addUserBtn">
                    <span>➕</span>
                    <span>新增用户</span>
                </button>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>用户名</th>
                            <th>姓名</th>
                            <th>角色</th>
                            <th>邮箱</th>
                            <th>手机号</th>
                            <th>状态</th>
                            <th>最后登录</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.users.length > 0 ? state.users.map(user => `
                            <tr>
                                <td>${user.username}</td>
                                <td>${user.name}</td>
                                <td><span class="badge ${roleColors[user.role] || 'badge-info'}">${roleTexts[user.role] || user.role}</span></td>
                                <td>${user.email || '-'}</td>
                                <td>${user.phone || '-'}</td>
                                <td><span class="badge ${statusColors[user.status]}">${statusTexts[user.status]}</span></td>
                                <td>${user.lastLoginTime || '-'}</td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn btn-text btn-sm" data-action="editUser" data-id="${user.id}">编辑</button>
                                        <button class="btn btn-text btn-sm" data-action="resetPassword" data-id="${user.id}">重置密码</button>
                                        <button class="btn btn-text btn-sm" data-action="toggleUserStatus" data-id="${user.id}">${user.status === 'active' ? '禁用' : '启用'}</button>
                                        <button class="btn btn-text btn-danger btn-sm" data-action="deleteUser" data-id="${user.id}">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr><td colspan="8" style="text-align: center; padding: 40px; color: #8ba9c4;">暂无用户数据</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderRolesTab(roleColors, roleTexts) {
        const permissionsByModule = {};
        state.permissions.forEach(perm => {
            if (!permissionsByModule[perm.module]) {
                permissionsByModule[perm.module] = [];
            }
            permissionsByModule[perm.module].push(perm);
        });
        
        const moduleNames = {
            'employee': '员工管理',
            'personnel': '人事管理',
            'attendance': '考勤管理',
            'recruitment': '招聘管理',
            'performance': '绩效考核',
            'training': '培训管理',
            'system': '系统管理'
        };

        return `
            <div style="display: grid; grid-template-columns: 250px 1fr; gap: 24px;">
                <div>
                    <h3 style="margin-bottom: 16px; color: #1a3a5c;">角色列表</h3>
                    <div style="border: 1px solid rgba(24, 144, 255, 0.1); border-radius: 8px;">
                        ${state.roles.map(role => `
                            <div class="role-item ${state.selectedRole === role.id ? 'selected' : ''}" data-role="${role.id}">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <div style="font-weight: 500; color: #1a3a5c;">${role.name}</div>
                                        <div style="font-size: 12px; color: #8ba9c4; margin-top: 4px;">${role.code}</div>
                                    </div>
                                    <span class="badge badge-info">${role.userCount} 人</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <h3 style="margin-bottom: 16px; color: #1a3a5c;">权限配置</h3>
                    ${state.selectedRole ? `
                        <div style="margin-bottom: 16px;">
                            <span style="color: #8ba9c4;">当前角色: </span>
                            <span class="badge ${roleColors[state.roles.find(r => r.id === state.selectedRole)?.code] || 'badge-info'}">
                                ${state.roles.find(r => r.id === state.selectedRole)?.name}
                            </span>
                        </div>
                        
                        <div style="max-height: 500px; overflow-y: auto;">
                            ${Object.keys(permissionsByModule).map(module => `
                                <div style="margin-bottom: 24px;">
                                    <div style="font-weight: 500; color: #1a3a5c; margin-bottom: 12px; display: flex; align-items: center;">
                                        <span style="margin-right: 8px;">📁</span>
                                        <span>${moduleNames[module] || module}</span>
                                        <label style="margin-left: auto; display: flex; align-items: center; cursor: pointer;">
                                            <input type="checkbox" class="module-select-all" data-module="${module}" style="margin-right: 8px;">
                                            <span style="font-size: 14px; color: #8ba9c4;">全选</span>
                                        </label>
                                    </div>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
                                        ${permissionsByModule[module].map(perm => `
                                            <label style="display: flex; align-items: center; cursor: pointer; padding: 8px 12px; background: rgba(24, 144, 255, 0.05); border-radius: 6px;">
                                                <input type="checkbox" class="permission-checkbox" data-permission="${perm.code}" 
                                                    ${state.rolePermissions[state.selectedRole]?.includes(perm.code) ? 'checked' : ''} style="margin-right: 8px;">
                                                <span style="font-size: 14px; color: #1a3a5c;">${perm.name}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="margin-top: 24px; text-align: right;">
                            <button class="btn btn-primary" id="saveRolePermissions">保存权限配置</button>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 60px 20px; color: #8ba9c4;">
                            <div style="font-size: 48px; margin-bottom: 16px;">👈</div>
                            <div>请从左侧选择一个角色进行权限配置</div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderSettingsTab() {
        const configGroups = {
            'basic': [],
            'theme': [],
            'email': [],
            'storage': [],
            'security': []
        };
        
        const configGroupNames = {
            'basic': '基本信息',
            'theme': '主题设置',
            'email': '邮件配置',
            'storage': '存储配置',
            'security': '安全配置'
        };
        
        state.configs.forEach(config => {
            if (config.key.includes('system_name') || config.key.includes('system_logo') || config.key.includes('system_version')) {
                configGroups.basic.push(config);
            } else if (config.key.includes('theme') || config.key.includes('layout')) {
                configGroups.theme.push(config);
            } else if (config.key.includes('smtp') || config.key.includes('email')) {
                configGroups.email.push(config);
            } else if (config.key.includes('storage') || config.key.includes('upload')) {
                configGroups.storage.push(config);
            } else {
                configGroups.security.push(config);
            }
        });

        return `
            <div style="max-width: 800px;">
                ${Object.keys(configGroups).map(groupKey => `
                    ${configGroups[groupKey].length > 0 ? `
                        <div style="margin-bottom: 32px;">
                            <h3 style="margin-bottom: 16px; color: #1a3a5c; padding-bottom: 12px; border-bottom: 1px solid rgba(24, 144, 255, 0.1);">
                                ${configGroupNames[groupKey]}
                            </h3>
                            ${configGroups[groupKey].map(config => `
                                <div style="margin-bottom: 16px;">
                                    <label style="display: block; font-size: 14px; color: #1a3a5c; margin-bottom: 8px;">${config.description}</label>
                                    <input type="text" class="form-control" data-config-key="${config.key}" value="${config.value || ''}" placeholder="请输入${config.description}">
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                `).join('')}
                
                <div style="text-align: right;">
                    <button class="btn btn-primary" id="saveSystemConfig">
                        <span>💾</span>
                        <span>保存配置</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderLogsTab(logStatusColors) {
        const filteredLogs = state.logs.filter(log => {
            if (state.logFilter.module && log.module !== state.logFilter.module) return false;
            if (state.logFilter.username && !log.username.includes(state.logFilter.username)) return false;
            return true;
        });
        
        const modules = [...new Set(state.logs.map(l => l.module))];

        return `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <div style="flex: 1;">
                        <label style="font-size: 14px; color: #8ba9c4; margin-bottom: 4px; display: block;">模块</label>
                        <select class="form-control" id="logModuleFilter" style="width: 100%;">
                            <option value="">全部</option>
                            ${modules.map(m => `<option value="${m}" ${state.logFilter.module === m ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="font-size: 14px; color: #8ba9c4; margin-bottom: 4px; display: block;">操作人</label>
                        <input type="text" class="form-control" id="logUserFilter" value="${state.logFilter.username}" placeholder="请输入操作人">
                    </div>
                    <div style="flex: 0 0 auto; display: flex; gap: 8px; margin-top: 24px;">
                        <button class="btn btn-default" id="filterLogsBtn">筛选</button>
                        <button class="btn btn-primary" id="exportLogsBtn">导出</button>
                        <button class="btn btn-danger" id="clearLogsBtn">清理</button>
                    </div>
                </div>
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
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredLogs.length > 0 ? filteredLogs.map(log => `
                            <tr>
                                <td>${log.createTime}</td>
                                <td>${log.username}</td>
                                <td><span class="badge badge-info">${log.module}</span></td>
                                <td>${log.action}</td>
                                <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">${log.content}</td>
                                <td>${log.ip}</td>
                                <td><span class="badge ${logStatusColors[log.status] || 'badge-success'}">${log.status}</span></td>
                            </tr>
                        `).join('') : `
                            <tr><td colspan="7" style="text-align: center; padding: 40px; color: #8ba9c4;">暂无日志数据</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    bindEvents(container) {
        container.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                this.renderContent(container);
                if (state.currentTab === 'monitor') {
                    setTimeout(() => this.initCharts(), 100);
                }
            });
        });

        document.getElementById('addUserBtn')?.addEventListener('click', () => {
            this.showUserModal();
        });

        document.querySelectorAll('[data-action="editUser"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const user = state.users.find(u => u.id === parseInt(btn.dataset.id));
                if (user) this.showUserModal(user);
            });
        });

        document.querySelectorAll('[data-action="resetPassword"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                Modal.confirm('确定要重置该用户的密码吗？', async () => {
                    const res = await API.resetSystemUserPassword(parseInt(btn.dataset.id));
                    if (res.code === 200) {
                        Toast.success('密码重置成功！');
                        await this.loadData();
                        this.renderContent(container);
                    }
                });
            });
        });

        document.querySelectorAll('[data-action="toggleUserStatus"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const user = state.users.find(u => u.id === parseInt(btn.dataset.id));
                if (user) {
                    const newStatus = user.status === 'active' ? 'inactive' : 'active';
                    const res = await API.updateSystemUserStatus(user.id, newStatus);
                    if (res.code === 200) {
                        Toast.success(newStatus === 'active' ? '用户已启用！' : '用户已禁用！');
                        await this.loadData();
                        this.renderContent(container);
                    }
                }
            });
        });

        document.querySelectorAll('[data-action="deleteUser"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                Modal.confirm('确定要删除该用户吗？', async () => {
                    const res = await API.deleteSystemUser(parseInt(btn.dataset.id));
                    if (res.code === 200) {
                        Toast.success('用户删除成功！');
                        await this.loadData();
                        this.renderContent(container);
                    }
                });
            });
        });

        document.querySelectorAll('.role-item').forEach(item => {
            item.addEventListener('click', () => {
                state.selectedRole = parseInt(item.dataset.role);
                this.renderContent(container);
            });
        });

        document.querySelectorAll('.module-select-all').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const module = e.target.dataset.module;
                const modulePerms = state.permissions.filter(p => p.module === module);
                const moduleCheckboxes = document.querySelectorAll(`.permission-checkbox[data-permission^="${module}"]`);
                
                moduleCheckboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });
        });

        document.getElementById('saveRolePermissions')?.addEventListener('click', async () => {
            if (!state.selectedRole) return;
            
            const selectedPerms = [];
            document.querySelectorAll('.permission-checkbox:checked').forEach(cb => {
                selectedPerms.push(cb.dataset.permission);
            });
            
            const res = await API.updateSystemRolePermissions(state.selectedRole, selectedPerms);
            if (res.code === 200) {
                Toast.success('权限配置保存成功！');
                await this.loadData();
                this.renderContent(container);
            }
        });

        document.getElementById('saveSystemConfig')?.addEventListener('click', async () => {
            const configs = [];
            document.querySelectorAll('[data-config-key]').forEach(input => {
                configs.push({
                    key: input.dataset.configKey,
                    value: input.value
                });
            });
            
            const res = await API.updateSystemConfig(configs);
            if (res.code === 200) {
                Toast.success('系统配置保存成功！');
                await this.loadData();
                this.renderContent(container);
            }
        });

        document.getElementById('filterLogsBtn')?.addEventListener('click', () => {
            state.logFilter.module = document.getElementById('logModuleFilter')?.value || '';
            state.logFilter.username = document.getElementById('logUserFilter')?.value || '';
            this.renderContent(container);
        });

        document.getElementById('exportLogsBtn')?.addEventListener('click', () => {
            Toast.info('日志导出功能需要引入 Excel 库！');
        });

        document.getElementById('clearLogsBtn')?.addEventListener('click', async () => {
            Modal.confirm('确定要清空所有操作日志吗？', async () => {
                const res = await API.clearSystemLogs();
                if (res.code === 200) {
                    Toast.success('日志清理成功！');
                    await this.loadData();
                    this.renderContent(container);
                }
            });
        });
    },

    showUserModal(user = null) {
        const isEdit = !!user;
        const roleOptions = [
            { code: 'super_admin', name: '超级管理员' },
            { code: 'hr_admin', name: 'HR管理员' },
            { code: 'department_manager', name: '部门经理' },
            { code: 'employee', name: '普通员工' }
        ];

        Modal.open({
            title: isEdit ? '编辑用户' : '新增用户',
            content: `
                <div style="padding: 8px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #1a3a5c; margin-bottom: 8px;">用户名 <span style="color: #e84747;">*</span></label>
                        <input type="text" class="form-control" id="modalUsername" value="${user?.username || ''}" placeholder="请输入用户名">
                    </div>
                    ${!isEdit ? `
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 14px; color: #1a3a5c; margin-bottom: 8px;">密码 <span style="color: #e84747;">*</span></label>
                            <input type="password" class="form-control" id="modalPassword" placeholder="请输入密码">
                        </div>
                    ` : ''}
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #1a3a5c; margin-bottom: 8px;">姓名</label>
                        <input type="text" class="form-control" id="modalName" value="${user?.name || ''}" placeholder="请输入姓名">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #1a3a5c; margin-bottom: 8px;">角色</label>
                        <select class="form-control" id="modalRole">
                            ${roleOptions.map(r => `<option value="${r.code}" ${user?.role === r.code ? 'selected' : ''}>${r.name}</option>`).join('')}
                        </select>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #1a3a5c; margin-bottom: 8px;">邮箱</label>
                        <input type="email" class="form-control" id="modalEmail" value="${user?.email || ''}" placeholder="请输入邮箱">
                    </div>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 14px; color: #1a3a5c; margin-bottom: 8px;">手机号</label>
                        <input type="tel" class="form-control" id="modalPhone" value="${user?.phone || ''}" placeholder="请输入手机号">
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-default" id="modalCancelBtn">取消</button>
                <button class="btn btn-primary" id="modalConfirmBtn">${isEdit ? '保存' : '新增'}</button>
            `,
            onConfirm: async (close) => {
                const username = document.getElementById('modalUsername')?.value;
                const password = document.getElementById('modalPassword')?.value;
                const name = document.getElementById('modalName')?.value;
                const role = document.getElementById('modalRole')?.value;
                const email = document.getElementById('modalEmail')?.value;
                const phone = document.getElementById('modalPhone')?.value;

                if (!username) {
                    Toast.error('请输入用户名！');
                    return;
                }
                if (!isEdit && !password) {
                    Toast.error('请输入密码！');
                    return;
                }

                try {
                    let res;
                    if (isEdit) {
                        res = await API.updateSystemUser(user.id, { username, name, role, email, phone });
                    } else {
                        res = await API.createSystemUser({ username, password, name, role, email, phone });
                    }
                    
                    if (res.code === 200) {
                        Toast.success(isEdit ? '用户更新成功！' : '用户创建成功！');
                        await this.loadData();
                        const container = document.getElementById('content');
                        if (container) this.renderContent(container);
                        close();
                    }
                } catch (error) {
                    Toast.error('操作失败，请重试！');
                }
            }
        });
    },

    initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        const trendCtx = document.getElementById('callTrendChart');
        const apiRankCtx = document.getElementById('apiRankChart');
        const appRankCtx = document.getElementById('appRankChart');

        if (trendCtx) {
            if (charts.trend) charts.trend.destroy();
            charts.trend = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
                    datasets: [{
                        label: '调用次数',
                        data: [1200, 1900, 3000, 2500, 2800, 1500, 1800],
                        borderColor: '#1890ff',
                        backgroundColor: 'rgba(24, 144, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        if (apiRankCtx) {
            if (charts.apiRank) charts.apiRank.destroy();
            charts.apiRank = new Chart(apiRankCtx, {
                type: 'bar',
                data: {
                    labels: ['员工列表', '考勤打卡', '请假审批', '职位发布', '绩效评估'],
                    datasets: [{
                        label: '调用次数',
                        data: [350, 280, 220, 180, 150],
                        backgroundColor: [
                            'rgba(24, 144, 255, 0.8)',
                            'rgba(82, 196, 26, 0.8)',
                            'rgba(250, 173, 20, 0.8)',
                            'rgba(114, 46, 209, 0.8)',
                            'rgba(232, 71, 71, 0.8)'
                        ],
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        if (appRankCtx) {
            if (charts.appRank) charts.appRank.destroy();
            charts.appRank = new Chart(appRankCtx, {
                type: 'doughnut',
                data: {
                    labels: ['OA系统', '财务系统', '其他应用'],
                    datasets: [{
                        data: [60, 30, 10],
                        backgroundColor: [
                            '#1890ff',
                            '#52c41a',
                            '#faad14'
                        ],
                        borderWidth: 0,
                        hoverOffset: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        }
    },

    destroy() {
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
    }
};

export default systemModule;
