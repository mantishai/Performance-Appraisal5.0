import { Toast, Skeleton, Modal } from '../utils.js';
import API from '../api.js';

let state = {
    departments: [],
    positions: [],
    keyPositions: [],
    employees: [],
    allEmployees: [],
    expandedIds: [],
    selectedDept: null,
    selectedTab: 'summary',
    selectedPosition: null,
    selectedEmployee: null,
    statistics: {},
    loading: false,
    currentPage: 1,
    totalEmployees: 0,
    selectedIds: [],
    showBatchActions: false,
    eventsBound: false,
    navMode: 'dept',
    navSelectedType: null,
    navSelectedId: null,
    searchQuery: ''
};

function getParentName(deptId) {
    const dept = state.departments.find(d => d.id === deptId);
    return dept ? dept.name : '-';
}

function initState() {
    state.departments = [];
    state.positions = [];
    state.keyPositions = [];
    state.employees = [];
    state.allEmployees = [];
    state.expandedIds = [];
    state.selectedDept = null;
    state.selectedTab = 'summary';
    state.selectedPosition = null;
    state.selectedEmployee = null;
    state.statistics = {};
    state.loading = false;
    state.currentPage = 1;
    state.totalEmployees = 0;
    state.selectedIds = [];
    state.showBatchActions = false;
    state.eventsBound = false;
    state.navMode = 'dept';
    state.navSelectedType = null;
    state.navSelectedId = null;
    state.searchQuery = '';
}

function buildDepartmentTree(departments) {
    function buildTree(items, parentId) {
        return items.filter(item => item.parentId === parentId).map(item => {
            const children = buildTree(items, item.id);
            return {
                ...item,
                children
            };
        });
    }
    return buildTree(departments, 0);
}

function getPositionStatus(pos) {
    const posEmployees = state.allEmployees.filter(e => 
        e.positionId === pos.id || e.position_id === pos.id
    );
    if (posEmployees.length >= (pos.headcount || 0)) {
        return { text: '已满编', class: 'status-full' };
    } else if (posEmployees.length === 0) {
        return { text: '空缺', class: 'status-vacant' };
    } else {
        return { text: '招聘中', class: 'status-recruiting' };
    }
}

function getEmployeeStatus(emp) {
    return emp.status === 1 ? { text: '在职', class: 'status-active' } : { text: '离职', class: 'status-inactive' };
}

function getDeptStatus(dept) {
    return dept.status === 1 ? { text: '启用', class: 'status-enabled' } : { text: '禁用', class: 'status-disabled' };
}

function getFillRate(pos) {
    const posEmployees = state.allEmployees.filter(e => 
        e.positionId === pos.id || e.position_id === pos.id
    );
    const headcount = pos.headcount || 0;
    return headcount > 0 ? Math.round((posEmployees.length / headcount) * 100) : 0;
}

function getFillRateColor(rate) {
    if (rate >= 80) return '#10b981';
    if (rate >= 50) return '#f59e0b';
    return '#ef4444';
}

function getLevelName(level) {
    const levels = { 1: '初级', 2: '中级', 3: '高级', 4: '主管', 5: '高级主管' };
    return levels[level] || '-';
}

const orgModule = {
    async render(container) {
        initState();
        container.innerHTML = '<div class="loading"><div class="loading-text">加载中...</div></div>';
        
        try {
            await this.loadInitialData();
            this.renderContent(container);
            this.bindEvents();
        } catch (error) {
            console.error('Failed to render org module:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <div class="empty-text">加载失败，请刷新重试</div>
                </div>
            `;
        }
    },

    async loadInitialData() {
        const promises = [];
        
        promises.push(
            API.getOrgDepartments().then(res => {
                if (res.code === 200 && res.data) {
                    state.departments = res.data;
                    state.departments = buildDepartmentTree(res.data);
                    if (state.departments.length > 0 && !state.selectedDept) {
                        state.selectedDept = state.departments[0];
                    }
                }
            })
        );
        
        promises.push(
            API.getOrgStatistics().then(res => {
                if (res.code === 200 && res.data) {
                    state.statistics = res.data;
                }
            })
        );
        
        promises.push(
            API.getOrgPositions().then(res => {
                if (res.code === 200 && res.data) {
                    state.positions = res.data.list || res.data || [];
                    state.keyPositions = state.positions.filter(p => p.isKeyPosition === 1);
                }
            })
        );
        
        promises.push(
            API.getOrgEmployees().then(res => {
                if (res.code === 200 && res.data) {
                    state.allEmployees = res.data;
                }
            })
        );
        
        await Promise.all(promises);
    },

    renderContent(container) {
        if (window.orgSelectedType && window.orgSelectedId) {
            if (window.orgSelectedType === 'position') {
                this.renderPositionDetail(window.orgSelectedId, container);
                return;
            } else if (window.orgSelectedType === 'employee') {
                this.renderEmployeeDetail(window.orgSelectedId, container);
                return;
            } else if (window.orgSelectedType === 'department') {
                const dept = state.departments.find(d => d.id === window.orgSelectedId);
                if (dept) {
                    state.selectedDept = dept;
                }
            }
        }

        if (state.navSelectedType === 'position' && state.navSelectedId) {
            this.renderPositionDetail(state.navSelectedId, container);
            return;
        } else if (state.navSelectedType === 'employee' && state.navSelectedId) {
            this.renderEmployeeDetail(state.navSelectedId, container);
            return;
        }

        container.innerHTML = '<div class="org-container">' + this.renderDashboard() + '</div>';
    },

    renderDashboard() {
        const stats = state.statistics;
        let totalHeadcount = 0;
        let totalOnboard = 0;
        
        state.positions.forEach(p => {
            totalHeadcount += (p.headcount || 0);
            totalOnboard += state.allEmployees.filter(e => 
                e.positionId === p.id || e.position_id === p.id
            ).length;
        });

        const fillRate = totalHeadcount > 0 ? Math.round((totalOnboard / totalHeadcount) * 100) : 0;

        const statsCards = `
            <div class="stats-cards-grid">
                ${this.renderStatCard('department', '部门总数', stats.departmentCount || state.departments.length, 'blue')}
                ${this.renderStatCard('employee', '员工总数', stats.employeeCount || state.allEmployees.length, 'green')}
                ${this.renderStatCard('position', '岗位总数', stats.positionCount || state.positions.length, 'purple')}
                ${this.renderStatCard('key-position', '关键岗位', state.keyPositions.length, 'orange')}
                ${this.renderStatCard('fill-rate', '编制达成率', fillRate + '%', 'cyan', true, fillRate)}
                ${this.renderStatCard('vacant', '空缺岗位', totalHeadcount - totalOnboard, 'red')}
            </div>
        `;

        const deptTreeHtml = this.renderDeptTreeCards(state.departments);
        const positionsList = this.renderPositionsList();

        return `
            <div class="org-dashboard">
                <div class="dashboard-header">
                    <h1>组织架构</h1>
                    <div class="dashboard-actions">
                        <button class="btn btn-danger" id="deleteDeptBtn">- 删除部门</button>
                        <button class="btn btn-primary" id="addDeptBtn">+ 新建部门</button>
                        <button class="btn btn-secondary" id="addPositionBtn">+ 新建岗位</button>
                    </div>
                </div>
                ${statsCards}
                <div class="dashboard-main">
                    <div class="main-sidebar">
                        <div class="tree-container">${deptTreeHtml}</div>
                    </div>
                    <div class="main-content">${positionsList}</div>
                </div>
            </div>
        `;
    },

    renderStatCard(icon, label, value, color, showProgress, progressValue) {
        const iconMap = {
            'department': '🏢',
            'employee': '👤',
            'position': '💼',
            'key-position': '⭐',
            'fill-rate': '📊',
            'vacant': '🔍'
        };
        
        const colorClass = 'stat-card-' + color;
        const progressHtml = showProgress ? `
            <div class="stat-progress">
                <div class="stat-progress-bar" style="width: ${progressValue}%"></div>
            </div>
        ` : '';
        
        return `
            <div class="stat-card ${colorClass}">
                <div class="stat-icon">${iconMap[icon]}</div>
                <div class="stat-info">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                    ${progressHtml}
                </div>
            </div>
        `;
    },

    renderDeptTreeCards(departments, level = 0) {
        let html = '';
        
        for (let i = 0; i < departments.length; i++) {
            const dept = departments[i];
            const deptPositions = state.positions.filter(p => p.departmentId === dept.id);
            const deptEmployees = state.allEmployees.filter(e => e.departmentId === dept.id);
            const headcount = deptPositions.reduce((sum, p) => sum + (p.headcount || 0), 0);
            const fillRate = headcount > 0 ? Math.round((deptEmployees.length / headcount) * 100) : 0;
            const status = getDeptStatus(dept);
            const paddingLeft = level * 16;

            html += `
                <div class="dept-card" data-dept-id="${dept.id}" style="padding-left: ${paddingLeft}px;">
                    <div class="dept-card-header">
                        <div class="dept-card-left">
                            <span class="dept-icon">🏢</span>
                            <div class="dept-info">
                                <div class="dept-name">${dept.name}</div>
                                <div class="dept-meta">
                                    <span class="dept-count">员工 ${deptEmployees.length}人</span>
                                    <span class="dept-divider">|</span>
                                    <span class="dept-count">岗位 ${deptPositions.length}个</span>
                                </div>
                            </div>
                        </div>
                        <div class="dept-card-right">
                            <span class="status-tag ${status.class}">${status.text}</span>
                            <div class="dept-fill-rate">
                                <div class="fill-rate-bar">
                                    <div class="fill-rate-fill" style="width: ${fillRate}%"></div>
                                </div>
                                <span class="fill-rate-text">${fillRate}%</span>
                            </div>
                            <div class="dept-actions">
                                <button class="action-btn edit-btn" data-id="${dept.id}" title="编辑">
                                    <svg viewBox="0 0 24 24"><path d="M12 20h9l-4-4H3v-4l4-4h9l4 4v9l-4 4zm-1-7.5l1.5-1.5 3 3-1.5 1.5-3-3z"></path></svg>
                                </button>
                                <button class="action-btn delete-btn" data-id="${dept.id}" title="删除">
                                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    ${deptPositions.length > 0 ? `
                        <div class="dept-positions">
                            ${deptPositions.map(pos => this.renderPositionMiniCard(pos)).join('')}
                        </div>
                    ` : ''}
                    ${dept.children && dept.children.length > 0 ? this.renderDeptTreeCards(dept.children, level + 1) : ''}
                </div>
            `;
        }

        return html;
    },

    renderPositionMiniCard(pos) {
        const posEmployees = state.allEmployees.filter(e => 
            e.positionId === pos.id || e.position_id === pos.id
        );
        const status = getPositionStatus(pos);
        const fillRate = getFillRate(pos);
        
        return `
            <div class="position-mini-card" data-pos-id="${pos.id}">
                <div class="pos-mini-header">
                    <span class="pos-icon">💼</span>
                    <span class="pos-name">${pos.name}</span>
                    <span class="status-tag ${status.class}">${status.text}</span>
                </div>
                <div class="pos-mini-body">
                    <div class="pos-fill-rate">
                        <div class="mini-fill-bar">
                            <div class="mini-fill-fill" style="width: ${fillRate}%"></div>
                        </div>
                        <span>${posEmployees.length}/${pos.headcount || 0}</span>
                    </div>
                    <div class="pos-employees">
                        ${posEmployees.slice(0, 3).map(e => `<span class="emp-chip">${e.name.charAt(0)}</span>`).join('')}
                        ${posEmployees.length > 3 ? `<span class="emp-more">+${posEmployees.length - 3}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    renderPositionsList() {
        const positions = state.positions;
        if (positions.length === 0) {
            return `
                <div class="empty-state">
                    <span class="empty-icon">📋</span>
                    <div class="empty-text">暂无岗位数据</div>
                </div>
            `;
        }

        return `
            <div class="positions-section">
                <div class="section-header">
                    <h2>岗位列表</h2>
                    <div class="filter-tabs">
                        <button class="filter-tab active" data-filter="all">全部</button>
                        <button class="filter-tab" data-filter="vacant">空缺</button>
                        <button class="filter-tab" data-filter="recruiting">招聘中</button>
                        <button class="filter-tab" data-filter="full">已满编</button>
                    </div>
                </div>
                <div class="positions-grid">
                    ${positions.map(pos => this.renderPositionCard(pos)).join('')}
                </div>
            </div>
        `;
    },

    renderPositionCard(pos) {
        const dept = state.departments.find(d => d.id === pos.departmentId);
        const posEmployees = state.allEmployees.filter(e => 
            e.positionId === pos.id || e.position_id === pos.id
        );
        const status = getPositionStatus(pos);
        const fillRate = getFillRate(pos);
        const isKeyPosition = pos.isKeyPosition === 1;

        return `
            <div class="position-card" data-pos-id="${pos.id}">
                <div class="pos-card-header">
                    <div class="pos-card-left">
                        <span class="pos-icon-lg">💼</span>
                        <div class="pos-card-info">
                            <div class="pos-card-name">${pos.name}${isKeyPosition ? '<span class="key-badge">⭐</span>' : ''}</div>
                            <div class="pos-card-dept">${dept ? dept.name : '-'}</div>
                        </div>
                    </div>
                    <span class="status-tag ${status.class}">${status.text}</span>
                </div>
                <div class="pos-card-body">
                    <div class="pos-stats-row">
                        <div class="pos-stat-item">
                            <div class="pos-stat-value">${posEmployees.length}</div>
                            <div class="pos-stat-label">在职人数</div>
                        </div>
                        <div class="pos-stat-item">
                            <div class="pos-stat-value">${pos.headcount || 0}</div>
                            <div class="pos-stat-label">编制人数</div>
                        </div>
                        <div class="pos-stat-item">
                            <div class="pos-stat-value fill-rate-value" style="color: ${getFillRateColor(fillRate)}">${fillRate}%</div>
                            <div class="pos-stat-label">达成率</div>
                        </div>
                    </div>
                    <div class="pos-progress">
                        <div class="pos-progress-bar">
                            <div class="pos-progress-fill" style="width: ${fillRate}%; background: ${getFillRateColor(fillRate)}"></div>
                        </div>
                    </div>
                </div>
                <div class="pos-card-footer">
                    <div class="pos-emp-list">
                        ${posEmployees.slice(0, 4).map(e => {
                            const empStatus = getEmployeeStatus(e);
                            return `
                                <div class="emp-mini-card ${empStatus.class}" data-emp-id="${e.id}">
                                    <span class="emp-mini-avatar">${e.name.charAt(0)}</span>
                                    <span class="emp-mini-name">${e.name}</span>
                                </div>
                            `;
                        }).join('')}
                        ${posEmployees.length > 4 ? `<div class="emp-more-card">+${posEmployees.length - 4}</div>` : ''}
                    </div>
                    <div class="pos-card-actions">
                        <button class="action-btn edit-btn" data-id="${pos.id}" title="编辑">
                            <svg viewBox="0 0 24 24"><path d="M12 20h9l-4-4H3v-4l4-4h9l4 4v9l-4 4zm-1-7.5l1.5-1.5 3 3-1.5 1.5-3-3z"></path></svg>
                        </button>
                        <button class="action-btn delete-btn" data-id="${pos.id}" title="删除">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderDeptDashboard(dept) {
        const deptPositions = state.positions.filter(p => p.departmentId === dept.id);
        const deptEmployees = state.allEmployees.filter(e => e.departmentId === dept.id);
        const parentName = dept.parentId ? getParentName(dept.parentId) : '-';
        const status = getDeptStatus(dept);

        let totalHeadcount = 0;
        let totalOnboard = 0;
        deptPositions.forEach(p => {
            totalHeadcount += (p.headcount || 0);
            totalOnboard += state.allEmployees.filter(e => 
                e.positionId === p.id || e.position_id === p.id
            ).length;
        });
        const fillRate = totalHeadcount > 0 ? Math.round((totalOnboard / totalHeadcount) * 100) : 0;
        const vacantCount = Math.max(0, totalHeadcount - totalOnboard);

        return `
            <div class="dept-detail-page">
                <div class="detail-header">
                    <button class="btn btn-link back-btn" id="backToDashboard">← 返回看板</button>
                    <div class="detail-title-section">
                        <span class="detail-icon">🏢</span>
                        <div class="detail-title-info">
                            <h1>${dept.name}</h1>
                            <div class="detail-meta">
                                <span class="meta-item">上级部门: ${parentName}</span>
                                <span class="meta-divider">|</span>
                                <span class="meta-item">部门编码: ${dept.code || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-actions">
                        <span class="status-tag ${status.class}">${status.text}</span>
                        <button class="btn btn-primary" id="editDeptBtn">编辑部门</button>
                        <button class="btn btn-danger" id="deleteDeptBtn">删除部门</button>
                    </div>
                </div>
                <div class="detail-stats">
                    ${this.renderDetailStat('岗位数量', deptPositions.length, '#667eea')}
                    ${this.renderDetailStat('在职人数', totalOnboard, '#10b981')}
                    ${this.renderDetailStat('编制人数', totalHeadcount, '#3b82f6')}
                    ${this.renderDetailStat('空缺人数', vacantCount, '#f59e0b')}
                </div>
                <div class="detail-content">
                    <div class="detail-section">
                        <div class="section-header">
                            <h2>编制达成率</h2>
                        </div>
                        <div class="fill-rate-chart">
                            <div class="fill-rate-ring">
                                <svg viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"></circle>
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="${getFillRateColor(fillRate)}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${fillRate * 2.51} 251" transform="rotate(-90 50 50)"></circle>
                                </svg>
                                <div class="fill-rate-center">
                                    <div class="fill-rate-number">${fillRate}%</div>
                                    <div class="fill-rate-label">编制达成</div>
                                </div>
                            </div>
                            <div class="fill-rate-bars">
                                <div class="bar-item">
                                    <div class="bar-label">已入职</div>
                                    <div class="bar"><div class="bar-fill" style="width: ${fillRate}%; background: #10b981"></div></div>
                                    <div class="bar-value">${totalOnboard}人</div>
                                </div>
                                <div class="bar-item">
                                    <div class="bar-label">空缺</div>
                                    <div class="bar"><div class="bar-fill" style="width: ${100 - fillRate}%; background: #f59e0b"></div></div>
                                    <div class="bar-value">${vacantCount}人</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="section-header">
                            <h2>部门岗位</h2>
                            <button class="btn btn-secondary btn-sm" id="addPositionBtn">+ 新建岗位</button>
                        </div>
                        <div class="positions-list-detail">
                            ${deptPositions.length > 0 ? 
                                deptPositions.map(pos => this.renderPositionDetailCard(pos)).join('') : 
                                '<div class="empty-state-small">暂无岗位</div>'}
                        </div>
                    </div>
                    <div class="detail-section">
                        <div class="section-header">
                            <h2>部门员工</h2>
                        </div>
                        <div class="employees-grid">
                            ${deptEmployees.length > 0 ? 
                                deptEmployees.map(emp => this.renderEmployeeCard(emp)).join('') : 
                                '<div class="empty-state-small">暂无员工</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderDetailStat(label, value, color) {
        return `
            <div class="detail-stat">
                <div class="stat-dot" style="background: ${color}"></div>
                <div class="stat-content">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
    },

    renderPositionDetailCard(pos) {
        const posEmployees = state.allEmployees.filter(e => 
            e.positionId === pos.id || e.position_id === pos.id
        );
        const status = getPositionStatus(pos);
        const fillRate = getFillRate(pos);

        return `
            <div class="position-detail-card" data-pos-id="${pos.id}">
                <div class="pos-detail-header">
                    <span class="pos-icon">💼</span>
                    <div class="pos-detail-info">
                        <div class="pos-detail-name">${pos.name}${pos.isKeyPosition === 1 ? '<span class="key-badge">⭐</span>' : ''}</div>
                        <div class="pos-detail-code">编码: ${pos.code || '-'}</div>
                    </div>
                    <span class="status-tag ${status.class}">${status.text}</span>
                </div>
                <div class="pos-detail-body">
                    <div class="pos-detail-stats">
                        <span>${posEmployees.length}人在职</span>
                        <span>|</span>
                        <span>编制${pos.headcount || 0}人</span>
                    </div>
                    <div class="pos-detail-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${fillRate}%"></div>
                        </div>
                        <span>${fillRate}%</span>
                    </div>
                </div>
                <div class="pos-detail-footer">
                    <div class="pos-detail-actions">
                        <button class="action-btn edit-btn" data-id="${pos.id}">编辑</button>
                        <button class="action-btn delete-btn" data-id="${pos.id}">删除</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderEmployeeCard(emp) {
        const pos = state.positions.find(p => p.id === emp.positionId || p.id === emp.position_id);
        const status = getEmployeeStatus(emp);

        return `
            <div class="employee-card" data-emp-id="${emp.id}">
                <div class="emp-avatar">${emp.name.charAt(0)}</div>
                <div class="emp-info">
                    <div class="emp-name">${emp.name}</div>
                    <div class="emp-position">${pos ? pos.name : '-'}</div>
                    <div class="emp-meta">
                        <span class="emp-no">${emp.employeeNo || '-'}</span>
                        <span class="status-tag small ${status.class}">${status.text}</span>
                    </div>
                </div>
                <div class="emp-actions">
                    <button class="action-btn view-btn" data-id="${emp.id}" title="查看详情">
                        <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>
                    </button>
                </div>
            </div>
        `;
    },

    renderPositionDetail(positionId, container) {
        const position = state.positions.find(p => p.id === positionId);
        if (!position) {
            container.innerHTML = `
                <div class="org-container">
                    <div class="empty-state">
                        <span class="empty-icon">🔍</span>
                        <div class="empty-text">找不到该岗位</div>
                    </div>
                </div>
            `;
            return;
        }

        const dept = state.departments.find(d => d.id === position.departmentId);
        const posEmployees = state.allEmployees.filter(e => 
            e.positionId === position.id || e.position_id === position.id
        );
        const status = getPositionStatus(position);
        const fillRate = getFillRate(position);

        container.innerHTML = `
            <div class="org-container">
                <div class="position-detail-page">
                    <div class="detail-header">
                        <button class="btn btn-link back-btn" id="backToDept">← 返回</button>
                        <div class="detail-title-section">
                            <span class="detail-icon">💼</span>
                            <div class="detail-title-info">
                                <h1>${position.name}</h1>
                                <div class="detail-meta">
                                    <span class="meta-item">所属部门: ${dept ? dept.name : '-'}</span>
                                    <span class="meta-divider">|</span>
                                    <span class="status-tag ${status.class}">${status.text}</span>
                                </div>
                            </div>
                        </div>
                        <div class="detail-actions">
                            <button class="btn btn-primary" id="editPositionBtn">编辑岗位</button>
                            <button class="btn btn-danger" id="deletePositionBtn">删除岗位</button>
                        </div>
                    </div>
                    <div class="position-detail-content">
                        <div class="detail-info-grid">
                            <div class="info-item"><label>岗位编码</label><span>${position.code || '-'}</span></div>
                            <div class="info-item"><label>岗位级别</label><span>${getLevelName(position.level)}</span></div>
                            <div class="info-item"><label>编制人数</label><span>${position.headcount || 0}</span></div>
                            <div class="info-item"><label>在职人数</label><span>${posEmployees.length}</span></div>
                            <div class="info-item"><label>编制达成率</label><span style="color: ${getFillRateColor(fillRate)}">${fillRate}%</span></div>
                            <div class="info-item"><label>是否关键岗位</label><span>${position.isKeyPosition === 1 ? '是' : '否'}</span></div>
                        </div>
                        <div class="detail-section">
                            <div class="section-header"><h2>职责描述</h2></div>
                            <div class="detail-description">${position.duties || '暂无职责描述'}</div>
                        </div>
                        <div class="detail-section">
                            <div class="section-header"><h2>岗位要求</h2></div>
                            <div class="detail-description">${position.requirements || '暂无岗位要求'}</div>
                        </div>
                        <div class="detail-section">
                            <div class="section-header"><h2>在岗人员</h2></div>
                            <div class="employees-list-detail">
                                ${posEmployees.length > 0 ? 
                                    posEmployees.map(emp => this.renderEmployeeDetailCard(emp)).join('') : 
                                    '<div class="empty-state-small">暂无在岗人员</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderEmployeeDetailCard(emp) {
        const status = getEmployeeStatus(emp);

        return `
            <div class="employee-detail-card" data-emp-id="${emp.id}">
                <div class="emp-detail-avatar">${emp.name.charAt(0)}</div>
                <div class="emp-detail-info">
                    <div class="emp-detail-name">${emp.name}</div>
                    <div class="emp-detail-no">${emp.employeeNo || '-'}</div>
                </div>
                <span class="status-tag ${status.class}">${status.text}</span>
                <button class="action-btn view-btn" data-id="${emp.id}">查看详情</button>
            </div>
        `;
    },

    async renderEmployeeDetail(employeeId, container) {
        let employee = state.allEmployees.find(e => e.id === employeeId);
        
        if (!employee) {
            container.innerHTML = `
                <div class="org-container">
                    <div class="empty-state">
                        <span class="empty-icon">🔍</span>
                        <div class="empty-text">找不到该员工</div>
                    </div>
                </div>
            `;
            return;
        }

        try {
            const res = await API.getEmployeeDetail(employeeId);
            if (res.code === 200 && res.data) {
                employee = { ...employee, ...res.data };
            }
        } catch (error) {
            console.error('Failed to load employee detail:', error);
        }

        this._renderEmployeeDetail(employee, container);
    },

    _renderEmployeeDetail(detailedEmployee, container) {
        const dept = state.departments.find(d => d.id === detailedEmployee.departmentId);
        const position = state.positions.find(p => 
            p.id === detailedEmployee.positionId || p.id === detailedEmployee.position_id
        );
        const status = getEmployeeStatus(detailedEmployee);

        container.innerHTML = `
            <div class="org-container">
                <div class="employee-detail-page">
                    <div class="detail-header">
                        <button class="btn btn-link back-btn" id="backToDept">← 返回</button>
                        <div class="detail-title-section">
                            <span class="detail-icon emp-icon">${detailedEmployee.name.charAt(0)}</span>
                            <div class="detail-title-info">
                                <h1>${detailedEmployee.name}</h1>
                                <div class="detail-meta">
                                    <span class="meta-item">${position ? position.name : '-'}</span>
                                    <span class="meta-divider">|</span>
                                    <span class="meta-item">${dept ? dept.name : '-'}</span>
                                    <span class="meta-divider">|</span>
                                    <span class="status-tag ${status.class}">${status.text}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="employee-detail-content">
                        <div class="detail-info-grid-full">
                            <div class="info-item"><label>工号</label><span>${detailedEmployee.employeeNo || '-'}</span></div>
                            <div class="info-item"><label>性别</label><span>${detailedEmployee.gender === 1 ? '男' : detailedEmployee.gender === 2 ? '女' : '-'}</span></div>
                            <div class="info-item"><label>年龄</label><span>${detailedEmployee.age || '-'}</span></div>
                            <div class="info-item"><label>民族</label><span>${detailedEmployee.nation || '-'}</span></div>
                            <div class="info-item"><label>手机</label><span>${detailedEmployee.phone || '-'}</span></div>
                            <div class="info-item"><label>邮箱</label><span>${detailedEmployee.email || '-'}</span></div>
                            <div class="info-item"><label>入职日期</label><span>${detailedEmployee.entryDate || '-'}</span></div>
                            <div class="info-item"><label>学历</label><span>${detailedEmployee.education || '-'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        if (state.eventsBound) {
            return;
        }
        state.eventsBound = true;

        const contentEl = document.getElementById('content');
        if (!contentEl) return;

        contentEl.addEventListener('click', (e) => {
            const backBtn = document.getElementById('backToDashboard') || document.getElementById('backToDept');
            if (backBtn && e.target === backBtn) {
                state.navSelectedType = null;
                state.navSelectedId = null;
                window.orgSelectedType = null;
                window.orgSelectedId = null;
                const container = document.getElementById('content');
                if (container) {
                    this.renderContent(container);
                }
                return;
            }

            const addDeptBtn = document.getElementById('addDeptBtn');
            if (addDeptBtn && e.target === addDeptBtn) {
                this.openDeptModal();
                return;
            }

            const editDeptBtn = document.getElementById('editDeptBtn');
            if (editDeptBtn && e.target === editDeptBtn) {
                this.openDeptModal(state.selectedDept);
                return;
            }

            const deleteDeptBtn = document.getElementById('deleteDeptBtn');
            if (deleteDeptBtn && e.target === deleteDeptBtn) {
                this.openDeleteDeptModal();
                return;
            }

            const deptCard = e.target.closest('.dept-card');
            if (deptCard) {
                const deptId = parseInt(deptCard.dataset.deptId);
                const dept = state.departments.find(d => d.id === deptId);
                if (dept) {
                    state.selectedDept = dept;
                    state.navSelectedType = null;
                    state.navSelectedId = null;
                    const container = document.getElementById('content');
                    if (container) {
                        this.renderContent(container);
                    }
                }
                return;
            }

            const posCard = e.target.closest('.position-card, .position-mini-card, .position-detail-card');
            if (posCard) {
                const posId = parseInt(posCard.dataset.posId);
                state.navSelectedType = 'position';
                state.navSelectedId = posId;
                const container = document.getElementById('content');
                if (container) {
                    this.renderPositionDetail(posId, container);
                }
                return;
            }

            const empCard = e.target.closest('.employee-card, .employee-detail-card');
            if (empCard) {
                const empId = parseInt(empCard.dataset.empId);
                state.navSelectedType = 'employee';
                state.navSelectedId = empId;
                const container = document.getElementById('content');
                if (container) {
                    this.renderEmployeeDetail(empId, container);
                }
                return;
            }

            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                if (editBtn.closest('.dept-card')) {
                    const dept = state.departments.find(d => d.id === id);
                    if (dept) this.openDeptModal(dept);
                } else if (editBtn.closest('.position-card, .position-mini-card, .position-detail-card')) {
                    const pos = state.positions.find(p => p.id === id);
                    if (pos) this.openPositionModal(pos);
                }
                return;
            }

            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                if (deleteBtn.closest('.dept-card')) {
                    const id = parseInt(deleteBtn.dataset.id);
                    const dept = state.departments.find(d => d.id === id);
                    if (dept) this.handleDeleteDept(dept);
                } else if (deleteBtn.closest('.position-card, .position-mini-card')) {
                    const id = parseInt(deleteBtn.dataset.id);
                    const pos = state.positions.find(p => p.id === id);
                    if (pos) this.handleDeletePosition(pos);
                }
                return;
            }
        });

        const searchInput = document.getElementById('orgSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
            });
        }

        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    },

    renderParentOptions(selectedId) {
        let html = '<option value="0">无（顶级部门）</option>';
        
        function buildOptions(departments, level) {
            departments.forEach(dept => {
                const prefix = '├─ '.repeat(level);
                html += `<option value="${dept.id}"${dept.id === selectedId ? ' selected' : ''}>${prefix}${dept.name}</option>`;
                if (dept.children && dept.children.length > 0) {
                    buildOptions(dept.children, level + 1);
                }
            });
        }

        buildOptions(state.departments, 0);
        return html;
    },

    renderLeaderOptions(selectedId) {
        let html = '<option value="">请选择负责人</option>';
        state.allEmployees.forEach(emp => {
            if (emp.status === 1) {
                html += `<option value="${emp.id}"${emp.id === selectedId ? ' selected' : ''}>${emp.name}</option>`;
            }
        });
        return html;
    },

    renderDeptOptions(selectedId) {
        let html = '';
        
        function buildOptions(departments, level) {
            departments.forEach(dept => {
                const prefix = '├─ '.repeat(level);
                html += `<option value="${dept.id}"${dept.id === selectedId ? ' selected' : ''}>${prefix}${dept.name}</option>`;
                if (dept.children && dept.children.length > 0) {
                    buildOptions(dept.children, level + 1);
                }
            });
        }

        buildOptions(state.departments, 0);
        return html || '<option value="">暂无部门</option>';
    },

    openDeptModal(dept) {
        const isEdit = !!dept;
        const title = isEdit ? '编辑部门' : '新建部门';
        
        const parentOptions = this.renderParentOptions(dept ? dept.parentId : 0);
        const leaderOptions = this.renderLeaderOptions(dept ? dept.managerId : '');

        const content = `
            <div class="dept-form">
                <div class="form-group">
                    <label>部门名称 <span class="required">*</span></label>
                    <input type="text" id="deptName" value="${dept ? dept.name : ''}" placeholder="请输入部门名称" />
                </div>
                <div class="form-group">
                    <label>部门编码 <span class="required">*</span></label>
                    <input type="text" id="deptCode" value="${dept ? dept.code : ''}" placeholder="请输入部门编码" />
                </div>
                <div class="form-group">
                    <label>上级部门</label>
                    <select id="deptParent">${parentOptions}</select>
                </div>
                <div class="form-group">
                    <label>部门负责人</label>
                    <select id="deptLeader">${leaderOptions}</select>
                </div>
                <div class="form-group">
                    <label>联系电话</label>
                    <input type="text" id="deptPhone" value="${dept ? dept.phone : ''}" placeholder="请输入联系电话" />
                </div>
                <div class="form-group full">
                    <label>部门描述</label>
                    <textarea id="deptDesc" placeholder="请输入部门描述">${dept ? dept.description : ''}</textarea>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" id="modalCancel">取消</button>
            <button class="btn btn-primary" id="modalConfirm">${title}</button>
        `;

        const instance = Modal.open({ title, content, footer });

        setTimeout(() => {
            const cancelBtn = document.getElementById('modalCancel');
            const confirmBtn = document.getElementById('modalConfirm');

            cancelBtn?.addEventListener('click', () => {
                instance.close();
            });

            confirmBtn?.addEventListener('click', async () => {
                const name = document.getElementById('deptName')?.value;
                const code = document.getElementById('deptCode')?.value;
                const parentId = document.getElementById('deptParent')?.value;
                const managerId = document.getElementById('deptLeader')?.value;
                const phone = document.getElementById('deptPhone')?.value;
                const desc = document.getElementById('deptDesc')?.value;

                if (!name?.trim()) {
                    Toast.error('请输入部门名称');
                    return;
                }
                if (!code?.trim()) {
                    Toast.error('请输入部门编码');
                    return;
                }

                const data = {
                    name: name.trim(),
                    code: code.trim(),
                    parent_id: parentId ? parseInt(parentId) : 0,
                    leader_id: managerId ? parseInt(managerId) : null,
                    phone: phone?.trim() || '',
                    email: '',
                    description: desc?.trim() || '',
                    sort_order: 0
                };

                try {
                    let res;
                    if (isEdit && dept) {
                        res = await API.updateDepartment(dept.id, data);
                    } else {
                        res = await API.createDepartment(data);
                    }

                    if (res.code === 200) {
                        Toast.success(isEdit ? '部门更新成功' : '部门创建成功');
                        instance.close();
                        await this.loadInitialData();
                        const container = document.getElementById('content');
                        if (container) {
                            this.renderContent(container);
                        }
                    } else {
                        Toast.error(res.message || '操作失败');
                    }
                } catch (error) {
                    console.error('Failed to save department:', error);
                    Toast.error('操作失败');
                }
            });
        }, 100);
    },

    openPositionModal(pos) {
        const isEdit = !!pos;
        const title = isEdit ? '编辑岗位' : '新建岗位';

        const deptOptions = this.renderDeptOptions(pos ? pos.departmentId : '');

        const content = `
            <div class="position-form">
                <div class="form-group">
                    <label>岗位名称 <span class="required">*</span></label>
                    <input type="text" id="posName" value="${pos ? pos.name : ''}" placeholder="请输入岗位名称" />
                </div>
                <div class="form-group">
                    <label>岗位编码 <span class="required">*</span></label>
                    <input type="text" id="posCode" value="${pos ? pos.code : ''}" placeholder="请输入岗位编码" />
                </div>
                <div class="form-group">
                    <label>所属部门 <span class="required">*</span></label>
                    <select id="posDept">${deptOptions}</select>
                </div>
                <div class="form-group">
                    <label>岗位级别</label>
                    <select id="posLevel">
                        <option value="1"${pos && pos.level === 1 ? ' selected' : ''}>初级</option>
                        <option value="2"${pos && pos.level === 2 ? ' selected' : ''}>中级</option>
                        <option value="3"${pos && pos.level === 3 ? ' selected' : ''}>高级</option>
                        <option value="4"${pos && pos.level === 4 ? ' selected' : ''}>主管</option>
                        <option value="5"${pos && pos.level === 5 ? ' selected' : ''}>高级主管</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>编制人数 <span class="required">*</span></label>
                    <input type="number" id="posHeadcount" value="${pos ? pos.headcount : 1}" min="1" placeholder="请输入编制人数" />
                </div>
                <div class="form-group">
                    <label>是否关键岗位</label>
                    <select id="posKey">
                        <option value="0"${pos && pos.isKeyPosition === 0 ? ' selected' : ''}>否</option>
                        <option value="1"${pos && pos.isKeyPosition === 1 ? ' selected' : ''}>是</option>
                    </select>
                </div>
                <div class="form-group full">
                    <label>职责描述</label>
                    <textarea id="posDuties" placeholder="请输入职责描述">${pos ? pos.duties : ''}</textarea>
                </div>
                <div class="form-group full">
                    <label>岗位要求</label>
                    <textarea id="posRequirements" placeholder="请输入岗位要求">${pos ? pos.requirements : ''}</textarea>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" id="modalCancel">取消</button>
            <button class="btn btn-primary" id="modalConfirm">${title}</button>
        `;

        const instance = Modal.open({ title, content, footer });

        setTimeout(() => {
            const cancelBtn = document.getElementById('modalCancel');
            const confirmBtn = document.getElementById('modalConfirm');

            cancelBtn?.addEventListener('click', () => {
                instance.close();
            });

            confirmBtn?.addEventListener('click', async () => {
                const name = document.getElementById('posName')?.value;
                const code = document.getElementById('posCode')?.value;
                const deptId = document.getElementById('posDept')?.value;
                const level = document.getElementById('posLevel')?.value;
                const headcount = document.getElementById('posHeadcount')?.value;
                const isKey = document.getElementById('posKey')?.value;
                const duties = document.getElementById('posDuties')?.value;
                const requirements = document.getElementById('posRequirements')?.value;

                if (!name?.trim()) {
                    Toast.error('请输入岗位名称');
                    return;
                }
                if (!code?.trim()) {
                    Toast.error('请输入岗位编码');
                    return;
                }
                if (!deptId) {
                    Toast.error('请选择所属部门');
                    return;
                }

                const data = {
                    name: name.trim(),
                    code: code.trim(),
                    departmentId: parseInt(deptId),
                    level: parseInt(level),
                    headcount: parseInt(headcount),
                    isKeyPosition: parseInt(isKey),
                    duties: duties?.trim() || '',
                    requirements: requirements?.trim() || ''
                };

                try {
                    let res;
                    if (isEdit && pos) {
                        res = await API.updatePosition(pos.id, data);
                    } else {
                        res = await API.createPosition(data);
                    }

                    if (res.code === 200) {
                        Toast.success(isEdit ? '岗位更新成功' : '岗位创建成功');
                        instance.close();
                        await this.loadInitialData();
                        const container = document.getElementById('content');
                        if (container) {
                            this.renderContent(container);
                        }
                    } else {
                        Toast.error(res.message || '操作失败');
                    }
                } catch (error) {
                    console.error('Failed to save position:', error);
                    Toast.error('操作失败');
                }
            });
        }, 100);
    },

    openDeleteDeptModal() {
        if (state.departments.length === 0) {
            Toast.warning('暂无部门可删除');
            return;
        }

        const deptOptions = this.renderDeptOptions('');

        const content = `
            <div class="dept-form">
                <div class="form-group">
                    <label>选择要删除的部门 <span class="required">*</span></label>
                    <select id="deleteDeptSelect">${deptOptions}</select>
                </div>
                <div class="form-group">
                    <label>确认删除</label>
                    <input type="checkbox" id="confirmDelete" />
                    <span style="font-size: 0.75rem; color: #dc2626; margin-left: 0.5rem;">我确认要删除此部门，此操作不可撤销</span>
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" id="modalCancel">取消</button>
            <button class="btn btn-danger" id="modalConfirm">确认删除</button>
        `;

        const instance = Modal.open({ title: '删除部门', content, footer });

        setTimeout(() => {
            const cancelBtn = document.getElementById('modalCancel');
            const confirmBtn = document.getElementById('modalConfirm');

            cancelBtn?.addEventListener('click', () => {
                instance.close();
            });

            confirmBtn?.addEventListener('click', async () => {
                const deptId = document.getElementById('deleteDeptSelect')?.value;
                const confirmChecked = document.getElementById('confirmDelete')?.checked;

                if (!deptId) {
                    Toast.error('请选择要删除的部门');
                    return;
                }

                if (!confirmChecked) {
                    Toast.error('请确认删除操作');
                    return;
                }

                const dept = state.departments.find(d => d.id === parseInt(deptId));
                if (!dept) {
                    Toast.error('部门不存在');
                    return;
                }

                try {
                    const res = await API.deleteDepartment(dept.id);
                    if (res.code === 200) {
                        Toast.success('部门删除成功');
                        instance.close();
                        await this.loadInitialData();
                        state.selectedDept = state.departments.length > 0 ? state.departments[0] : null;
                        const container = document.getElementById('content');
                        if (container) {
                            this.renderContent(container);
                        }
                    } else {
                        Toast.error(res.message || '删除失败');
                    }
                } catch (error) {
                    console.error('Failed to delete department:', error);
                    Toast.error('删除失败');
                }
            });
        }, 100);
    },

    handleDeleteDept(dept) {
        if (!dept) return;
        
        if (confirm(`确定要删除部门 "${dept.name}" 吗？此操作不可撤销。`)) {
            API.deleteDepartment(dept.id).then(async res => {
                if (res.code === 200) {
                    Toast.success('部门删除成功');
                    await this.loadInitialData();
                    state.selectedDept = state.departments.length > 0 ? state.departments[0] : null;
                    const container = document.getElementById('content');
                    if (container) {
                        this.renderContent(container);
                    }
                } else {
                    Toast.error(res.message || '删除失败');
                }
            }).catch(error => {
                console.error('Failed to delete department:', error);
                Toast.error('删除失败');
            });
        }
    },

    handleDeletePosition(pos) {
        if (!pos) return;
        
        if (confirm(`确定要删除岗位 "${pos.name}" 吗？此操作不可撤销。`)) {
            API.deletePosition(pos.id).then(async res => {
                if (res.code === 200) {
                    Toast.success('岗位删除成功');
                    await this.loadInitialData();
                    const container = document.getElementById('content');
                    if (container) {
                        this.renderContent(container);
                    }
                } else {
                    Toast.error(res.message || '删除失败');
                }
            }).catch(error => {
                console.error('Failed to delete position:', error);
                Toast.error('删除失败');
            });
        }
    }
};

export default orgModule;
