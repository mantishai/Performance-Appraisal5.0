import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    keyPositions: [],
    successors: [],
    nineGridData: [],
    talentPool: [],
    coverageReport: null,
    currentTab: 'positions',
    selectedPosition: null,
    selectedEmployee: null,
    departments: [],
    positions: [],
    employees: [],
    loading: false
};

const gridColors = {
    'A1': { bg: '#52c41a', text: '#fff', desc: '高潜高绩-核心人才' },
    'A2': { bg: '#73d13d', text: '#fff', desc: '中潜高绩-优秀人才' },
    'A3': { bg: '#95de64', text: '#333', desc: '低潜高绩-稳定骨干' },
    'B1': { bg: '#ffc53d', text: '#333', desc: '高潜中绩-潜力股' },
    'B2': { bg: '#ffd666', text: '#333', desc: '中潜中绩-待观察' },
    'B3': { bg: '#ffe58f', text: '#333', desc: '低潜中绩-稳定层' },
    'C1': { bg: '#ff7a45', text: '#fff', desc: '高潜低绩-救火队员' },
    'C2': { bg: '#ff4d4f', text: '#fff', desc: '中潜低绩-需改进' },
    'C3': { bg: '#cf1322', text: '#fff', desc: '低潜低绩-优化层' }
};

const talentModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 8);
        state.loading = true;
        await this.loadData();
        state.loading = false;
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [keyPositionsRes, nineGridRes, poolRes, reportRes, deptsRes, posRes, empsRes] = await Promise.all([
                API.getKeyPositions(),
                API.getNineGridData(),
                API.getTalentPool(),
                API.getCoverageReport(),
                API.getDepartments(),
                API.getPositions(),
                API.getEmployees()
            ]);
            
            if (keyPositionsRes.code === 200) state.keyPositions = keyPositionsRes.data;
            if (nineGridRes.code === 200) state.nineGridData = nineGridRes.data;
            if (poolRes.code === 200) state.talentPool = poolRes.data;
            if (reportRes.code === 200) state.coverageReport = reportRes.data;
            if (deptsRes.code === 200) state.departments = deptsRes.data;
            if (posRes.code === 200) state.positions = posRes.data;
            if (empsRes.code === 200) state.employees = empsRes.data;
        } catch (error) {
            console.error('Failed to load talent data:', error);
        }
    },

    renderContent(container) {
        const riskColors = { 'high': 'inactive', 'medium': 'pending', 'low': 'active' };
        const levelColors = { 'S': 'inactive', 'A': 'pending', 'B': 'active' };

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">人才盘点</h1>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" id="exportReport">📥 导出报告</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">⭐</div>
                    <div class="stat-info">
                        <div class="stat-label">关键岗位</div>
                        <div class="stat-value">${state.keyPositions.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">🎯</div>
                    <div class="stat-info">
                        <div class="stat-label">继任者</div>
                        <div class="stat-value">${state.successors.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">📊</div>
                    <div class="stat-info">
                        <div class="stat-label">人才池</div>
                        <div class="stat-value">${state.talentPool.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📈</div>
                    <div class="stat-info">
                        <div class="stat-label">覆盖率</div>
                        <div class="stat-value">${state.coverageReport?.coverageRate || 0}%</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px; margin-bottom: 20px;">
                    <button class="btn ${state.currentTab === 'positions' ? 'btn-primary' : 'btn-default'}" data-tab="positions">📍 关键岗位</button>
                    <button class="btn ${state.currentTab === 'successors' ? 'btn-primary' : 'btn-default'}" data-tab="successors">👥 继任者管理</button>
                    <button class="btn ${state.currentTab === 'ninegrid' ? 'btn-primary' : 'btn-default'}" data-tab="ninegrid">📊 九宫格地图</button>
                    <button class="btn ${state.currentTab === 'report' ? 'btn-primary' : 'btn-default'}" data-tab="report">📈 梯队报告</button>
                    <button class="btn ${state.currentTab === 'talentdetail' ? 'btn-primary' : 'btn-default'}" data-tab="talentdetail">👤 人才详情</button>
                </div>

                ${state.currentTab === 'positions' ? this.renderPositionsTab(levelColors, riskColors) : ''}
                ${state.currentTab === 'successors' ? this.renderSuccessorsTab() : ''}
                ${state.currentTab === 'ninegrid' ? this.renderNineGridTab() : ''}
                ${state.currentTab === 'report' ? this.renderReportTab() : ''}
                ${state.currentTab === 'talentdetail' ? this.renderTalentDetailTab() : ''}
            </div>

            <div class="modal-overlay" id="keyPositionModal"></div>
            <div class="modal-overlay" id="successorModal"></div>
            <div class="modal-overlay" id="talentDetailModal"></div>
        `;

        this.bindEvents(container);
    },

    renderPositionsTab(levelColors, riskColors) {
        const riskLabels = { 'high': '高风险', 'medium': '中风险', 'low': '低风险' };
        const levelLabels = { 'S': '不可替代', 'A': '重要', 'B': '一般' };

        return `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-primary" id="addKeyPosition">+ 标记关键岗位</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>岗位名称</th>
                            <th>所属部门</th>
                            <th>关键级别</th>
                            <th>继任者人数</th>
                            <th>风险等级</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.keyPositions.length > 0 ? state.keyPositions.map(pos => `
                            <tr>
                                <td><strong>${pos.positionName}</strong></td>
                                <td>${pos.department}</td>
                                <td>
                                    <select class="filter-select" data-id="${pos.id}" data-action="changeLevel" style="width: 120px;">
                                        <option value="S" ${pos.criticalLevel === 'S' ? 'selected' : ''}>${levelLabels.S} (S)</option>
                                        <option value="A" ${pos.criticalLevel === 'A' ? 'selected' : ''}>${levelLabels.A} (A)</option>
                                        <option value="B" ${pos.criticalLevel === 'B' ? 'selected' : ''}>${levelLabels.B} (B)</option>
                                    </select>
                                </td>
                                <td>${pos.successorCount}</td>
                                <td><span class="status-tag ${riskColors[pos.riskLevel]}">${riskLabels[pos.riskLevel]}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" data-id="${pos.id}" data-action="viewSuccessors">查看继任者</button>
                                        <button class="action-btn" data-id="${pos.id}" data-action="unmark" style="color: #f5222d;">取消标记</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 60px;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">📍</div>
                                    <div style="color: #8ba9c4;">暂无关键岗位</div>
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSuccessorsTab() {
        const readinessColors = {
            '1年内': 'active',
            '2-3年': 'pending',
            '3年以上': 'inactive'
        };

        return `
            <div style="margin-bottom: 16px;">
                <select class="filter-select" id="positionSelect" style="margin-right: 12px; width: 200px;">
                    <option value="">请选择关键岗位</option>
                    ${state.keyPositions.map(pos => `
                        <option value="${pos.id}" ${state.selectedPosition === pos.id ? 'selected' : ''}>${pos.positionName}</option>
                    `).join('')}
                </select>
                <button class="btn btn-primary" id="addSuccessor" ${!state.selectedPosition ? 'disabled' : ''}>+ 添加继任者</button>
            </div>

            ${state.selectedPosition ? `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>候选人姓名</th>
                                <th>当前岗位</th>
                                <th>准备度</th>
                                <th>评估分数</th>
                                <th>优势描述</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.successors.filter(s => s.keyPositionId === state.selectedPosition).length > 0 
                                ? state.successors.filter(s => s.keyPositionId === state.selectedPosition).map(s => `
                                    <tr>
                                        <td><strong>${s.candidateName}</strong></td>
                                        <td>${s.currentPosition}</td>
                                        <td><span class="status-tag ${readinessColors[s.readiness]}">${s.readiness}</span></td>
                                        <td>${s.score}分</td>
                                        <td style="max-width: 200px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${s.strengths}</td>
                                        <td>
                                            <div class="action-btns">
                                                <button class="action-btn" data-id="${s.id}" data-action="editSuccessor">编辑</button>
                                                <button class="action-btn" data-id="${s.id}" data-action="removeSuccessor" style="color: #f5222d;">移除</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')
                                : `
                                    <tr>
                                        <td colspan="6" style="text-align: center; padding: 40px;">
                                            <div style="color: #8ba9c4;">该岗位暂无继任者</div>
                                        </td>
                                    </tr>
                                `}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div style="text-align: center; padding: 60px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <div style="color: #8ba9c4;">请先选择关键岗位查看继任者</div>
                </div>
            `}
        `;
    },

    renderNineGridTab() {
        const gridCells = [];
        for (let y = 3; y >= 1; y--) {
            for (let x = 1; x <= 3; x++) {
                const positionCode = (y === 3 ? 'A' : y === 2 ? 'B' : 'C') + (x === 3 ? '1' : x === 2 ? '2' : '3');
                const employeesInCell = state.nineGridData.filter(e => e.gridX === x && e.gridY === y);
                gridCells.push({ x, y, positionCode, employees: employeesInCell });
            }
        }

        return `
            <div style="margin-bottom: 16px; text-align: center;">
                <div style="display: inline-block; padding: 8px 16px; background: rgba(24, 144, 255, 0.1); border-radius: 8px;">
                    <span style="font-size: 14px; color: #1890ff;">
                        <strong>纵轴:</strong> 绩效 &nbsp;&nbsp;
                        <strong>横轴:</strong> 潜力 (高→中→低)
                    </span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                ${gridCells.map(cell => `
                    <div class="card" style="padding: 16px; cursor: pointer; min-height: 180px; border: 2px solid transparent;" 
                         data-gridx="${cell.x}" data-gridy="${cell.y}"
                         style="background: ${gridColors[cell.positionCode].bg};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="font-weight: bold; color: ${gridColors[cell.positionCode].text};">${cell.positionCode}</div>
                            <div style="font-size: 12px; color: ${gridColors[cell.positionCode].text}; opacity: 0.8;">${gridColors[cell.positionCode].desc}</div>
                        </div>
                        <div style="font-size: 24px; font-weight: bold; color: ${gridColors[cell.positionCode].text}; margin-bottom: 8px;">${cell.employees.length}人</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${cell.employees.slice(0, 4).map(e => `
                                <div style="background: rgba(255,255,255,0.3); padding: 4px 10px; border-radius: 12px; font-size: 12px; color: ${gridColors[cell.positionCode].text};" 
                                     data-employeeid="${e.employeeId}">
                                    ${e.employeeName}
                                </div>
                            `).join('')}
                            ${cell.employees.length > 4 ? `
                                <div style="background: rgba(255,255,255,0.3); padding: 4px 10px; border-radius: 12px; font-size: 12px; color: ${gridColors[cell.positionCode].text};">+${cell.employees.length - 4}</div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            ${state.selectedEmployee ? this.renderEmployeeDetail(state.selectedEmployee) : ''}
        `;
    },

    renderReportTab() {
        if (!state.coverageReport) {
            return `
                <div style="text-align: center; padding: 60px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
                    <div style="color: #8ba9c4;">暂无报告数据</div>
                </div>
            `;
        }

        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="card" style="padding: 24px;">
                    <h3 style="margin: 0 0 20px; color: #1a3a5c;">📊 关键岗位覆盖率</h3>
                    <div style="text-align: center;">
                        <div style="width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(#52c41a ${state.coverageReport.coverageRate * 3.6}deg, #d9d9d9 0deg); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                <div style="font-size: 28px; font-weight: bold; color: #1890ff;">${state.coverageReport.coverageRate}%</div>
                                <div style="font-size: 12px; color: #8ba9c4;">覆盖率</div>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: center; gap: 24px;">
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #1a3a5c;">${state.coverageReport.coveredCount}</div>
                                <div style="font-size: 12px; color: #8ba9c4;">已覆盖</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; color: #1a3a5c;">${state.coverageReport.totalKeyPositions}</div>
                                <div style="font-size: 12px; color: #8ba9c4;">总计</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card" style="padding: 24px;">
                    <h3 style="margin: 0 0 20px; color: #1a3a5c;">⚠️ 风险分布</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div style="background: #fff1f0; padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #f5222d;">${state.coverageReport.highRiskCount}</div>
                            <div style="font-size: 12px; color: #8ba9c4;">高风险</div>
                        </div>
                        <div style="background: #fff7e6; padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #faad14;">${state.coverageReport.mediumRiskCount}</div>
                            <div style="font-size: 12px; color: #8ba9c4;">中风险</div>
                        </div>
                        <div style="background: #f6ffed; padding: 16px; border-radius: 8px; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #52c41a;">${state.coverageReport.lowRiskCount}</div>
                            <div style="font-size: 12px; color: #8ba9c4;">低风险</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="padding: 24px;">
                <h3 style="margin: 0 0 20px; color: #1a3a5c;">📋 岗位风险详情</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>岗位</th>
                                <th>部门</th>
                                <th>关键级别</th>
                                <th>继任者</th>
                                <th>风险</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.keyPositions.map(pos => `
                                <tr>
                                    <td><strong>${pos.positionName}</strong></td>
                                    <td>${pos.department}</td>
                                    <td>${pos.criticalLevel}</td>
                                    <td>${pos.successorCount}人</td>
                                    <td>
                                        <span class="status-tag ${pos.riskLevel === 'high' ? 'inactive' : pos.riskLevel === 'medium' ? 'pending' : 'active'}">
                                            ${pos.riskLevel === 'high' ? '高风险' : pos.riskLevel === 'medium' ? '中风险' : '低风险'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderTalentDetailTab() {
        return `
            <div style="margin-bottom: 16px;">
                <select class="filter-select" id="employeeSelect" style="width: 240px;">
                    <option value="">请选择员工</option>
                    ${state.employees.map(emp => `
                        <option value="${emp.id}">${emp.name} - ${emp.department} - ${emp.position}</option>
                    `).join('')}
                </select>
            </div>

            ${state.selectedEmployee ? this.renderTalentDetail(state.selectedEmployee) : `
                <div style="text-align: center; padding: 80px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">👤</div>
                    <div style="color: #8ba9c4;">请选择员工查看人才详情</div>
                </div>
            `}
        `;
    },

    renderTalentDetail(employeeId) {
        const empData = state.nineGridData.find(e => e.employeeId === employeeId);
        const emp = state.employees.find(e => e.id === employeeId);
        const inPool = state.talentPool.some(t => t.employeeId === employeeId);
        const isSuccessor = state.successors.some(s => s.candidateId === employeeId);

        if (!empData || !emp) {
            return `
                <div style="text-align: center; padding: 40px; color: #8ba9c4;">暂无该员工数据</div>
            `;
        }

        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="card" style="padding: 20px;">
                    <h3 style="margin: 0 0 16px; color: #1a3a5c;">基本信息</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div class="form-field">
                            <label style="color: #8ba9c4; font-size: 12px;">姓名</label>
                            <div style="font-weight: bold; color: #1a3a5c;">${emp.name}</div>
                        </div>
                        <div class="form-field">
                            <label style="color: #8ba9c4; font-size: 12px;">部门</label>
                            <div style="color: #1a3a5c;">${emp.department}</div>
                        </div>
                        <div class="form-field">
                            <label style="color: #8ba9c4; font-size: 12px;">岗位</label>
                            <div style="color: #1a3a5c;">${emp.position}</div>
                        </div>
                        <div class="form-field">
                            <label style="color: #8ba9c4; font-size: 12px;">入职日期</label>
                            <div style="color: #1a3a5c;">${emp.entryDate}</div>
                        </div>
                    </div>
                </div>

                <div class="card" style="padding: 20px;">
                    <h3 style="margin: 0 0 16px; color: #1a3a5c;">人才标签</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                        <span class="status-tag active">绩效: ${empData.performance}</span>
                        <span class="status-tag pending">潜力: ${empData.potential}</span>
                        <span class="status-tag ${inPool ? 'active' : 'inactive'}">人才池: ${inPool ? '已加入' : '未加入'}</span>
                        ${isSuccessor ? '<span class="status-tag active">继任者</span>' : ''}
                    </div>
                    <div style="text-align: center; padding: 12px; background: ${gridColors[empData.gridPosition].bg}; border-radius: 8px;">
                        <span style="font-weight: bold; color: ${gridColors[empData.gridPosition].text};">九宫格位置: ${empData.gridPosition}</span>
                    </div>
                </div>
            </div>

            <div class="card" style="padding: 20px;">
                <h3 style="margin: 0 0 16px; color: #1a3a5c;">发展建议</h3>
                <div style="background: rgba(24, 144, 255, 0.05); padding: 16px; border-radius: 8px; color: #1a3a5c;">
                    ${empData.developmentSuggestion || '暂无发展建议'}
                </div>
            </div>
        `;
    },

    renderEmployeeDetail(employeeId) {
        const empData = state.nineGridData.find(e => e.employeeId === employeeId);
        if (!empData) return '';

        return `
            <div style="margin-top: 24px; padding: 20px; background: rgba(24, 144, 255, 0.05); border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; color: #1a3a5c;">👤 ${empData.employeeName}</h3>
                    <button class="btn btn-default btn-sm" id="closeDetail">关闭</button>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                        <div style="color: #8ba9c4; font-size: 12px;">部门</div>
                        <div style="color: #1a3a5c;">${empData.department}</div>
                    </div>
                    <div>
                        <div style="color: #8ba9c4; font-size: 12px;">岗位</div>
                        <div style="color: #1a3a5c;">${empData.position}</div>
                    </div>
                    <div>
                        <div style="color: #8ba9c4; font-size: 12px;">绩效</div>
                        <div style="color: #1a3a5c; font-weight: bold;">${empData.performance}</div>
                    </div>
                    <div>
                        <div style="color: #8ba9c4; font-size: 12px;">潜力</div>
                        <div style="color: #1a3a5c; font-weight: bold;">${empData.potential}</div>
                    </div>
                </div>
                <div style="margin-top: 12px;">
                    <div style="color: #8ba9c4; font-size: 12px;">发展建议</div>
                    <div style="color: #1a3a5c;">${empData.developmentSuggestion || '暂无'}</div>
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

        const positionSelect = document.getElementById('positionSelect');
        positionSelect?.addEventListener('change', (e) => {
            state.selectedPosition = e.target.value ? parseInt(e.target.value) : null;
            if (state.selectedPosition) {
                API.getSuccessors(state.selectedPosition).then(res => {
                    if (res.code === 200) {
                        state.successors = res.data;
                        this.renderContent(container);
                    }
                });
            } else {
                this.renderContent(container);
            }
        });

        const employeeSelect = document.getElementById('employeeSelect');
        employeeSelect?.addEventListener('change', (e) => {
            state.selectedEmployee = e.target.value ? parseInt(e.target.value) : null;
            this.renderContent(container);
        });

        document.getElementById('addKeyPosition')?.addEventListener('click', () => {
            this.openKeyPositionModal(container);
        });

        document.getElementById('addSuccessor')?.addEventListener('click', () => {
            if (state.selectedPosition) {
                this.openSuccessorModal(container);
            }
        });

        document.getElementById('exportReport')?.addEventListener('click', () => {
            Toast.info('报告导出中...');
        });

        container.addEventListener('change', (e) => {
            if (e.target.dataset.action === 'changeLevel') {
                const id = parseInt(e.target.dataset.id);
                const level = e.target.value;
                API.updateKeyPositionLevel(id, level).then(res => {
                    if (res.code === 200) {
                        Toast.success('关键级别已更新');
                        this.loadData().then(() => this.renderContent(container));
                    }
                });
            }
        });

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const id = parseInt(btn.dataset.id);
            const action = btn.dataset.action;

            switch (action) {
                case 'viewSuccessors':
                    state.selectedPosition = id;
                    state.currentTab = 'successors';
                    API.getSuccessors(id).then(res => {
                        if (res.code === 200) {
                            state.successors = res.data;
                            this.renderContent(container);
                        }
                    });
                    break;
                case 'unmark':
                    Modal.confirm('确定取消该关键岗位标记吗？', async () => {
                        const res = await API.deleteKeyPosition(id);
                        if (res.code === 200) {
                            Toast.success('已取消标记');
                            await this.loadData();
                            this.renderContent(container);
                        }
                    });
                    break;
                case 'editSuccessor':
                    const successor = state.successors.find(s => s.id === id);
                    if (successor) {
                        this.openSuccessorModal(container, successor);
                    }
                    break;
                case 'removeSuccessor':
                    Modal.confirm('确定移除该继任者吗？', async () => {
                        const res = await API.removeSuccessor(id);
                        if (res.code === 200) {
                            Toast.success('继任者已移除');
                            await this.loadData();
                            this.renderContent(container);
                        }
                    });
                    break;
            }
        });

        container.addEventListener('click', (e) => {
            const cell = e.target.closest('[data-gridx]');
            if (cell) {
                const x = parseInt(cell.dataset.gridx);
                const y = parseInt(cell.dataset.gridy);
            }

            const employeeBadge = e.target.closest('[data-employeeid]');
            if (employeeBadge) {
                state.selectedEmployee = parseInt(employeeBadge.dataset.employeeid);
                this.renderContent(container);
            }
        });

        document.getElementById('closeDetail')?.addEventListener('click', () => {
            state.selectedEmployee = null;
            this.renderContent(container);
        });
    },

    openKeyPositionModal(container) {
        const modal = document.getElementById('keyPositionModal');
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <span class="modal-title">标记关键岗位</span>
                    <div class="modal-controls">
                        <button class="modal-control-btn modal-close">×</button>
                    </div>
                </div>
                <div class="modal-body">
                    <form id="keyPositionForm">
                        <div class="form-field">
                            <label>选择岗位 <span class="required">*</span></label>
                            <select id="posSelect">
                                <option value="">请选择</option>
                                ${state.positions.map(pos => `
                                    <option value="${pos.id}" 
                                        ${state.keyPositions.some(kp => kp.positionId === pos.id) ? 'disabled' : ''}>
                                        ${pos.name} (${pos.departmentName})
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>关键级别 <span class="required">*</span></label>
                            <select id="levelSelect">
                                <option value="S">S - 不可替代</option>
                                <option value="A">A - 重要</option>
                                <option value="B">B - 一般</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelBtn">取消</button>
                    <button class="btn btn-primary" id="confirmBtn">确认标记</button>
                </div>
            </div>
        `;
        modal.classList.add('show');

        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.classList.remove('show'));
        modal.querySelector('#cancelBtn')?.addEventListener('click', () => modal.classList.remove('show'));

        modal.querySelector('#confirmBtn')?.addEventListener('click', async () => {
            const positionId = parseInt(document.getElementById('posSelect').value);
            const criticalLevel = document.getElementById('levelSelect').value;

            if (!positionId) {
                Toast.warning('请选择岗位');
                return;
            }

            const position = state.positions.find(p => p.id === positionId);
            const res = await API.createKeyPosition({
                positionId,
                criticalLevel,
                positionName: position.name,
                department: position.departmentName
            });

            if (res.code === 200) {
                Toast.success('关键岗位标记成功');
                modal.classList.remove('show');
                await this.loadData();
                this.renderContent(container);
            }
        });
    },

    openSuccessorModal(container, successor = null) {
        const modal = document.getElementById('successorModal');
        const keyPosition = state.keyPositions.find(kp => kp.id === state.selectedPosition);
        const positionEmployees = state.employees.filter(e => !successor || e.id !== successor.candidateId);

        modal.innerHTML = `
            <div class="modal" style="max-width: 550px;">
                <div class="modal-header">
                    <span class="modal-title">${successor ? '编辑继任者' : '添加继任者'}</span>
                    <div class="modal-controls">
                        <button class="modal-control-btn modal-close">×</button>
                    </div>
                </div>
                <div class="modal-body">
                    <form id="successorForm">
                        <div style="background: rgba(24, 144, 255, 0.05); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                            <span style="color: #8ba9c4; font-size: 12px;">目标岗位:</span>
                            <strong style="color: #1a3a5c; margin-left: 8px;">${keyPosition?.positionName}</strong>
                        </div>
                        <div class="form-field">
                            <label>选择员工 <span class="required">*</span></label>
                            <select id="candidateSelect">
                                <option value="">请选择</option>
                                ${positionEmployees.map(emp => `
                                    <option value="${emp.id}" ${successor?.candidateId === emp.id ? 'selected' : ''}>
                                        ${emp.name} - ${emp.department} - ${emp.position}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>准备度 <span class="required">*</span></label>
                            <select id="readinessSelect">
                                <option value="1年内" ${successor?.readiness === '1年内' ? 'selected' : ''}>1年内</option>
                                <option value="2-3年" ${successor?.readiness === '2-3年' ? 'selected' : ''}>2-3年</option>
                                <option value="3年以上" ${successor?.readiness === '3年以上' ? 'selected' : ''}>3年以上</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>评估分数</label>
                            <input type="number" id="scoreInput" value="${successor?.score || 0}" min="0" max="100" placeholder="0-100">
                        </div>
                        <div class="form-field">
                            <label>优势描述</label>
                            <textarea id="strengthsInput" rows="3" placeholder="描述该员工的优势">${successor?.strengths || ''}</textarea>
                        </div>
                        <div class="form-field">
                            <label>发展需求</label>
                            <textarea id="developmentInput" rows="3" placeholder="描述该员工的发展需求">${successor?.developmentNeeds || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-default" id="cancelBtn">取消</button>
                    <button class="btn btn-primary" id="confirmBtn">${successor ? '更新' : '添加'}</button>
                </div>
            </div>
        `;
        modal.classList.add('show');

        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.classList.remove('show'));
        modal.querySelector('#cancelBtn')?.addEventListener('click', () => modal.classList.remove('show'));

        modal.querySelector('#confirmBtn')?.addEventListener('click', async () => {
            const candidateId = parseInt(document.getElementById('candidateSelect').value);
            const readiness = document.getElementById('readinessSelect').value;
            const score = parseInt(document.getElementById('scoreInput').value);
            const strengths = document.getElementById('strengthsInput').value;
            const developmentNeeds = document.getElementById('developmentInput').value;

            if (!candidateId) {
                Toast.warning('请选择员工');
                return;
            }

            const candidate = state.employees.find(e => e.id === candidateId);

            if (successor) {
                const res = await API.updateSuccessor(successor.id, {
                    readiness,
                    score,
                    strengths,
                    developmentNeeds
                });

                if (res.code === 200) {
                    Toast.success('继任者更新成功');
                    modal.classList.remove('show');
                    await this.loadData();
                    this.renderContent(container);
                }
            } else {
                const res = await API.addSuccessor({
                    keyPositionId: state.selectedPosition,
                    candidateId,
                    candidateName: candidate.name,
                    currentPosition: candidate.position,
                    readiness,
                    score,
                    strengths,
                    developmentNeeds
                });

                if (res.code === 200) {
                    Toast.success('继任者添加成功');
                    modal.classList.remove('show');
                    await this.loadData();
                    this.renderContent(container);
                }
            }
        });
    },

    destroy() {}
};

export default talentModule;
