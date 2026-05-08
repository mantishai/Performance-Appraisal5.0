import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    currentTab: 'overview',
    alerts: [],
    rules: [],
    riskPredictions: [],
    statistics: null,
    filterType: '',
    filterLevel: '',
    filterStatus: '',
    selectedAlerts: [],
    riskDistribution: null,
    departmentRisks: null
};

const alertModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderStats() + Skeleton.renderCard() + Skeleton.renderTable(4, 8);
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [statsRes, alertsRes, rulesRes, riskRes] = await Promise.all([
                API.getAlertStatistics(),
                API.getAlertList(),
                API.getAlertRules(),
                API.getRiskPredictions()
            ]);
            if (statsRes.code === 200) state.statistics = statsRes.data;
            if (alertsRes.code === 200) state.alerts = alertsRes.data || [];
            if (rulesRes.code === 200) state.rules = rulesRes.data || [];
            if (riskRes.code === 200) {
                state.riskPredictions = riskRes.data.riskPredictions || [];
                state.riskDistribution = riskRes.data.riskDistribution;
                state.departmentRisks = riskRes.data.departmentRisks;
            }
        } catch (error) {
            console.error('Failed to load alert data:', error);
        }
    },

    renderContent(container) {
        // 确保所有数据都是安全的
        const safeAlerts = Array.isArray(state.alerts) ? state.alerts : [];
        const safeRules = Array.isArray(state.rules) ? state.rules : [];
        const safeRiskPredictions = Array.isArray(state.riskPredictions) ? state.riskPredictions : [];

        const typeMap = {
            contract: '合同到期',
            birthday: '生日祝福',
            probation: '试用期',
            attendance: '考勤异常',
            recruitment: '招聘超时',
            performance: '绩效下滑',
            training: '培训缺失',
            turnover: '离职风险'
        };
        const levelColors = { high: 'inactive', medium: 'warning', low: 'info' };
        const levelText = { high: '高', medium: '中', low: '低' };
        const statusColors = { pending: 'pending', handled: 'active', ignored: 'inactive' };
        const statusText = { pending: '待处理', handled: '已处理', ignored: '已忽略' };

        const filteredAlerts = this.getFilteredAlerts();
        const pendingAlerts = safeAlerts.filter(a => a.status === 'pending');
        const highRiskAlerts = safeAlerts.filter(a => a.level === 'high' && a.status === 'pending');
        const handledAlerts = safeAlerts.filter(a => a.status === 'handled');

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">智能预警</h1>
                <div style="display: flex; gap: 12px;">
                    <button class="btn btn-primary" id="triggerCheckBtn">🔄 手动检查</button>
                    <button class="btn btn-default" id="exportReportBtn">📥 导出报告</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon red">🔔</div>
                    <div class="stat-info">
                        <div class="stat-label">今日预警</div>
                        <div class="stat-value">${state.statistics?.total || safeAlerts.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">⏰</div>
                    <div class="stat-info">
                        <div class="stat-label">待处理</div>
                        <div class="stat-value">${state.statistics?.pending || pendingAlerts.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">✅</div>
                    <div class="stat-info">
                        <div class="stat-label">已处理</div>
                        <div class="stat-value">${state.statistics?.handled || handledAlerts.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red">🚨</div>
                    <div class="stat-info">
                        <div class="stat-label">高风险</div>
                        <div class="stat-value">${state.statistics?.highRisk || highRiskAlerts.length}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'overview' ? 'btn-primary' : 'btn-default'}" data-tab="overview">📊 预警概览</button>
                    <button class="btn ${state.currentTab === 'list' ? 'btn-primary' : 'btn-default'}" data-tab="list">📋 预警列表</button>
                    <button class="btn ${state.currentTab === 'rules' ? 'btn-primary' : 'btn-default'}" data-tab="rules">⚙️ 规则配置</button>
                    <button class="btn ${state.currentTab === 'prediction' ? 'btn-primary' : 'btn-default'}" data-tab="prediction">🔮 风险预测</button>
                </div>

                ${state.currentTab === 'overview' ? this.renderOverviewTab(safeAlerts) : ''}
                ${state.currentTab === 'list' ? this.renderListTab(typeMap, levelColors, levelText, statusColors, statusText, filteredAlerts) : ''}
                ${state.currentTab === 'rules' ? this.renderRulesTab(levelText, safeRules) : ''}
                ${state.currentTab === 'prediction' ? this.renderPredictionTab(safeRiskPredictions) : ''}
            </div>
        `;

        this.bindEvents(container);
    },

    renderOverviewTab(safeAlerts) {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <h3 style="margin-bottom: 16px; color: #1a3a5c;">近7天预警趋势</h3>
                    <div style="height: 200px; display: flex; align-items: end; justify-content: space-around; padding: 20px 0;">
                        ${(state.statistics?.trendData || [
                            { date: '05-02', count: 3 },
                            { date: '05-03', count: 5 },
                            { date: '05-04', count: 4 },
                            { date: '05-05', count: 6 },
                            { date: '05-06', count: 3 },
                            { date: '05-07', count: 4 },
                            { date: '05-08', count: 2 }
                        ]).map(t => `
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                <div style="width: 30px; background: linear-gradient(180deg, #1890ff, #52c41a); border-radius: 4px 4px 0 0; height: ${t.count * 25}px;"></div>
                                <div style="font-size: 12px; color: #8ba9c4;">${t.date}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <h3 style="margin-bottom: 16px; color: #1a3a5c;">预警类型分布</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${this.getAlertTypeDistribution(safeAlerts).map(t => `
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #1a3a5c;">${t.type}</span>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 120px; height: 8px; background: rgba(24, 144, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${t.percentage}%; height: 100%; background: linear-gradient(90deg, #1890ff, #52c41a);"></div>
                                    </div>
                                    <span style="color: #8ba9c4; font-size: 14px; width: 30px;">${t.count}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 16px; color: #1a3a5c;">最新预警</h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${safeAlerts.slice(0, 5).map(a => `
                        <div style="display: flex; align-items: center; padding: 12px; background: rgba(24, 144, 255, 0.03); border-radius: 8px; gap: 12px;">
                            <span style="font-size: 20px;">${a.level === 'high' ? '🔴' : a.level === 'medium' ? '🟡' : '🟢'}</span>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #1a3a5c;">${a.title}</div>
                                <div style="font-size: 13px; color: #8ba9c4; margin-top: 4px;">${a.content}</div>
                            </div>
                            <span class="status-tag ${a.status === 'pending' ? 'pending' : 'active'}" style="font-size: 12px;">${a.status === 'pending' ? '待处理' : '已处理'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    renderListTab(typeMap, levelColors, levelText, statusColors, statusText, filteredAlerts) {
        return `
            <div style="display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;">
                <select id="filterType" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                    <option value="">全部类型</option>
                    <option value="contract" ${state.filterType === 'contract' ? 'selected' : ''}>合同到期</option>
                    <option value="birthday" ${state.filterType === 'birthday' ? 'selected' : ''}>生日祝福</option>
                    <option value="probation" ${state.filterType === 'probation' ? 'selected' : ''}>试用期</option>
                    <option value="attendance" ${state.filterType === 'attendance' ? 'selected' : ''}>考勤异常</option>
                    <option value="recruitment" ${state.filterType === 'recruitment' ? 'selected' : ''}>招聘超时</option>
                </select>
                <select id="filterLevel" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                    <option value="">全部等级</option>
                    <option value="high" ${state.filterLevel === 'high' ? 'selected' : ''}>高</option>
                    <option value="medium" ${state.filterLevel === 'medium' ? 'selected' : ''}>中</option>
                    <option value="low" ${state.filterLevel === 'low' ? 'selected' : ''}>低</option>
                </select>
                <select id="filterStatus" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                    <option value="">全部状态</option>
                    <option value="pending" ${state.filterStatus === 'pending' ? 'selected' : ''}>待处理</option>
                    <option value="handled" ${state.filterStatus === 'handled' ? 'selected' : ''}>已处理</option>
                    <option value="ignored" ${state.filterStatus === 'ignored' ? 'selected' : ''}>已忽略</option>
                </select>
                <div style="flex: 1;"></div>
                ${state.selectedAlerts.length > 0 ? `
                    <button class="btn btn-primary" id="batchHandleBtn">✅ 批量处理 (${state.selectedAlerts.length})</button>
                    <button class="btn btn-default" id="clearSelectionBtn">取消选择</button>
                ` : ''}
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 40px;">
                                <input type="checkbox" id="selectAllAlerts">
                            </th>
                            <th>预警类型</th>
                            <th>标题</th>
                            <th>内容</th>
                            <th>风险等级</th>
                            <th>发生时间</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredAlerts.length > 0 ? filteredAlerts.map(a => `
                            <tr>
                                <td>
                                    <input type="checkbox" data-id="${a.id}" class="alert-checkbox" ${state.selectedAlerts.includes(a.id) ? 'checked' : ''}>
                                </td>
                                <td>${typeMap[a.type] || a.type}</td>
                                <td><strong>${a.title}</strong></td>
                                <td style="max-width: 300px;">${a.content}</td>
                                <td><span class="status-tag ${levelColors[a.level]}">${levelText[a.level]}</span></td>
                                <td>${a.createTime || a.date}</td>
                                <td><span class="status-tag ${statusColors[a.status]}">${statusText[a.status]}</span></td>
                                <td>
                                    <div class="action-btns">
                                        ${a.status === 'pending' ? `
                                            <button class="action-btn" data-id="${a.id}" data-action="handle">处理</button>
                                            <button class="action-btn" data-id="${a.id}" data-action="ignore">忽略</button>
                                        ` : `
                                            <span style="color: #8ba9c4; font-size: 13px;">已${a.status === 'handled' ? '处理' : '忽略'}</span>
                                        `}
                                    </div>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="8" style="text-align: center; padding: 60px; color: #8ba9c4;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                                    <div style="font-size: 16px;">暂无预警信息</div>
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderRulesTab(levelText, safeRules) {
        const typeMap = {
            contract: '合同到期提醒',
            birthday: '员工生日提醒',
            probation: '试用期到期提醒',
            attendance: '考勤异常提醒',
            turnover: '离职风险预测',
            recruitment: '职位超时提醒',
            performance: '绩效下滑提醒',
            training: '培训缺失提醒'
        };

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>规则名称</th>
                            <th>触发条件</th>
                            <th>提前天数</th>
                            <th>风险等级</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${safeRules.map(r => `
                            <tr>
                                <td><strong>${r.ruleName || typeMap[r.ruleType] || r.name}</strong></td>
                                <td>${this.getTriggerCondition(r)}</td>
                                <td>${r.triggerDays || r.days || 0}天</td>
                                <td><span class="status-tag ${r.riskLevel === 'high' ? 'inactive' : r.riskLevel === 'medium' ? 'warning' : 'info'}">${levelText[r.riskLevel] || levelText[r.level] || '中'}</span></td>
                                <td><span class="status-tag ${r.isEnabled || r.enabled ? 'active' : 'inactive'}">${r.isEnabled || r.enabled ? '已启用' : '已禁用'}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" data-id="${r.id}" data-action="toggle">${r.isEnabled || r.enabled ? '禁用' : '启用'}</button>
                                        <button class="action-btn" data-id="${r.id}" data-action="edit">编辑</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderPredictionTab(safeRiskPredictions) {
        const highRisk = safeRiskPredictions.filter(r => r.riskLevel === 'high' || r.riskScore >= 70);
        const mediumRisk = safeRiskPredictions.filter(r => r.riskLevel === 'medium' || (r.riskScore >= 40 && r.riskScore < 70));
        const lowRisk = safeRiskPredictions.filter(r => r.riskLevel === 'low' || r.riskScore < 40);

        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <h3 style="margin-bottom: 16px; color: #1a3a5c;">风险因素分布</h3>
                    <div style="display: flex; justify-content: center; align-items: center; height: 200px;">
                        <div style="position: relative; width: 150px; height: 150px;">
                            <div style="position: absolute; width: 150px; height: 150px; border-radius: 50%; background: conic-gradient(#1890ff 0% 40%, #faad14 40% 75%, #f5222d 75% 100%);"></div>
                            <div style="position: absolute; top: 25px; left: 25px; width: 100px; height: 100px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <span style="font-weight: bold; color: #1a3a5c;">${safeRiskPredictions.length}人</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 16px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; background: #1890ff; border-radius: 2px;"></div>
                            <span style="font-size: 13px; color: #8ba9c4;">低风险: ${lowRisk.length}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; background: #faad14; border-radius: 2px;"></div>
                            <span style="font-size: 13px; color: #8ba9c4;">中风险: ${mediumRisk.length}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 12px; height: 12px; background: #f5222d; border-radius: 2px;"></div>
                            <span style="font-size: 13px; color: #8ba9c4;">高风险: ${highRisk.length}</span>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <h3 style="margin-bottom: 16px; color: #1a3a5c;">部门风险对比</h3>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        ${(state.departmentRisks || [
                            { department: '技术部', riskScore: 55 },
                            { department: '产品部', riskScore: 30 },
                            { department: '市场部', riskScore: 65 },
                            { department: '人事部', riskScore: 25 }
                        ]).map(d => `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 80px; font-size: 14px; color: #1a3a5c;">${d.department}</div>
                                <div style="flex: 1; height: 24px; background: rgba(24, 144, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${d.riskScore}%; height: 100%; background: linear-gradient(90deg, ${d.riskScore >= 60 ? '#f5222d' : d.riskScore >= 40 ? '#faad14' : '#52c41a'}, ${d.riskScore >= 60 ? '#faad14' : d.riskScore >= 40 ? '#52c41a' : '#1890ff'});"></div>
                                </div>
                                <div style="width: 40px; text-align: right; font-size: 14px; color: #8ba9c4;">${d.riskScore}分</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px;">
                <h3 style="margin-bottom: 16px; color: #1a3a5c;">离职风险排行榜</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>排名</th>
                                <th>员工</th>
                                <th>风险分数</th>
                                <th>风险等级</th>
                                <th>主要因素</th>
                                <th>预测日期</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${safeRiskPredictions.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).map((r, i) => `
                                <tr>
                                    <td><span style="font-weight: bold; color: ${i === 0 ? '#f5222d' : i === 1 ? '#faad14' : i === 2 ? '#1890ff' : '#8ba9c4'};">${i + 1}</span></td>
                                    <td><strong>${r.employeeName}</strong></td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 80px; height: 8px; background: rgba(24, 144, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                                <div style="width: ${r.riskScore}%; height: 100%; background: ${r.riskScore >= 70 ? '#f5222d' : r.riskScore >= 40 ? '#faad14' : '#52c41a'}"></div>
                                            </div>
                                            <span style="font-weight: bold; color: #1a3a5c;">${r.riskScore}</span>
                                        </div>
                                    </td>
                                    <td><span class="status-tag ${r.riskScore >= 70 ? 'inactive' : r.riskScore >= 40 ? 'warning' : 'active'}">${r.riskScore >= 70 ? '高' : r.riskScore >= 40 ? '中' : '低'}</span></td>
                                    <td>
                                        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                            ${(r.factors || ['稳定']).map(f => `<span class="status-tag info" style="font-size: 11px;">${f}</span>`).join('')}
                                        </div>
                                    </td>
                                    <td>${r.predictionDate}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getFilteredAlerts() {
        const safeAlerts = Array.isArray(state.alerts) ? state.alerts : [];
        return safeAlerts.filter(a => {
            if (state.filterType && a.type !== state.filterType) return false;
            if (state.filterLevel && a.level !== state.filterLevel) return false;
            if (state.filterStatus && a.status !== state.filterStatus) return false;
            return true;
        });
    },

    getAlertTypeDistribution(safeAlerts) {
        const typeMap = {
            contract: '合同到期',
            birthday: '生日祝福',
            probation: '试用期',
            attendance: '考勤异常',
            recruitment: '招聘超时'
        };
        const counts = {};
        safeAlerts.forEach(a => {
            counts[a.type] = (counts[a.type] || 0) + 1;
        });
        const total = safeAlerts.length || 1;
        return Object.entries(counts).map(([type, count]) => ({
            type: typeMap[type] || type,
            count,
            percentage: Math.round((count / total) * 100)
        }));
    },

    getTriggerCondition(rule) {
        const conditions = {
            contract: '合同到期前',
            birthday: '员工生日',
            probation: '试用期到期前',
            attendance: '连续迟到或多次缺卡',
            turnover: '综合评估',
            recruitment: '职位发布超',
            performance: '绩效连续下滑',
            training: '年度培训不足'
        };
        return conditions[rule.ruleType] || '自动触发';
    },

    bindEvents(container) {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                this.renderContent(container);
            });
        });

        document.getElementById('triggerCheckBtn')?.addEventListener('click', async () => {
            const res = await API.triggerAlertCheck();
            if (res.code === 200) {
                Toast.success('预警检查完成');
                await this.loadData();
                this.renderContent(container);
            }
        });

        document.getElementById('exportReportBtn')?.addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('filterType')?.addEventListener('change', (e) => {
            state.filterType = e.target.value;
            this.renderContent(container);
        });

        document.getElementById('filterLevel')?.addEventListener('change', (e) => {
            state.filterLevel = e.target.value;
            this.renderContent(container);
        });

        document.getElementById('filterStatus')?.addEventListener('change', (e) => {
            state.filterStatus = e.target.value;
            this.renderContent(container);
        });

        document.getElementById('selectAllAlerts')?.addEventListener('change', (e) => {
            if (e.target.checked) {
                state.selectedAlerts = this.getFilteredAlerts().filter(a => a.status === 'pending').map(a => a.id);
            } else {
                state.selectedAlerts = [];
            }
            this.renderContent(container);
        });

        document.querySelectorAll('.alert-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    if (!state.selectedAlerts.includes(id)) state.selectedAlerts.push(id);
                } else {
                    state.selectedAlerts = state.selectedAlerts.filter(i => i !== id);
                }
                this.renderContent(container);
            });
        });

        document.getElementById('batchHandleBtn')?.addEventListener('click', () => {
            this.batchHandle(container);
        });

        document.getElementById('clearSelectionBtn')?.addEventListener('click', () => {
            state.selectedAlerts = [];
            this.renderContent(container);
        });

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                if (action === 'handle') {
                    this.handleAlert(id, container);
                } else if (action === 'ignore') {
                    this.ignoreAlert(id, container);
                } else if (action === 'toggle') {
                    this.toggleRule(id, container);
                } else if (action === 'edit') {
                    this.editRule(id, container);
                }
            }
        });
    },

    async handleAlert(id, container) {
        Modal.open({
            title: '处理预警',
            content: `
                <form id="handleAlertForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>处理意见</label>
                            <textarea id="handleComment" rows="4" placeholder="请输入处理意见..."></textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="confirmHandleBtn">确认处理</button>
            `
        });

        document.getElementById('confirmHandleBtn')?.addEventListener('click', async () => {
            const handleComment = document.getElementById('handleComment')?.value || '';
            const res = await API.handleAlert(id, handleComment);
            if (res.code === 200) {
                Toast.success('预警已处理');
                document.querySelector('.modal-overlay.show')?.remove();
                await this.loadData();
                this.renderContent(container);
            }
        });
    },

    async ignoreAlert(id, container) {
        Modal.confirm('确定要忽略此预警吗？', async () => {
            const res = await API.ignoreAlert(id);
            if (res.code === 200) {
                Toast.success('已忽略');
                await this.loadData();
                this.renderContent(container);
            }
        });
    },

    async batchHandle(container) {
        Modal.open({
            title: '批量处理预警',
            content: `
                <form id="batchHandleForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>处理意见</label>
                            <textarea id="batchHandleComment" rows="4" placeholder="请输入处理意见..."></textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="confirmBatchBtn">确认批量处理</button>
            `
        });

        document.getElementById('confirmBatchBtn')?.addEventListener('click', async () => {
            const handleComment = document.getElementById('batchHandleComment')?.value || '';
            const res = await API.batchHandleAlerts(state.selectedAlerts, handleComment);
            if (res.code === 200) {
                Toast.success('批量处理成功');
                document.querySelector('.modal-overlay.show')?.remove();
                state.selectedAlerts = [];
                await this.loadData();
                this.renderContent(container);
            }
        });
    },

    async toggleRule(id, container) {
        const res = await API.toggleAlertRule(id);
        if (res.code === 200) {
            const rule = state.rules.find(r => r.id === id);
            if (rule) {
                if (rule.isEnabled !== undefined) {
                    rule.isEnabled = !rule.isEnabled;
                } else {
                    rule.enabled = !rule.enabled;
                }
            }
            Toast.success('规则状态已更新');
            this.renderContent(container);
        }
    },

    editRule(id, container) {
        const rule = state.rules.find(r => r.id === id);
        if (!rule) return;

        Modal.open({
            title: '编辑规则',
            content: `
                <form id="editRuleForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>提前天数</label>
                            <input type="number" id="editTriggerDays" value="${rule.triggerDays || rule.days || 0}" min="0">
                        </div>
                        <div class="form-field">
                            <label>风险等级</label>
                            <select id="editRiskLevel">
                                <option value="low" ${rule.riskLevel === 'low' || rule.level === 'low' ? 'selected' : ''}>低</option>
                                <option value="medium" ${rule.riskLevel === 'medium' || rule.level === 'medium' ? 'selected' : ''}>中</option>
                                <option value="high" ${rule.riskLevel === 'high' || rule.level === 'high' ? 'selected' : ''}>高</option>
                            </select>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveRuleBtn">保存</button>
            `
        });

        document.getElementById('saveRuleBtn')?.addEventListener('click', async () => {
            const triggerDays = parseInt(document.getElementById('editTriggerDays')?.value || '0');
            const riskLevel = document.getElementById('editRiskLevel')?.value || 'medium';
            const res = await API.updateAlertRule(id, { triggerDays, riskLevel });
            if (res.code === 200) {
                Toast.success('规则已更新');
                document.querySelector('.modal-overlay.show')?.remove();
                await this.loadData();
                this.renderContent(container);
            }
        });
    },

    exportReport() {
        const report = {
            title: '智能预警报告',
            exportTime: new Date().toLocaleString(),
            statistics: state.statistics,
            alerts: state.alerts,
            riskPredictions: state.riskPredictions
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `预警报告_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        Toast.success('报告导出成功');
    },

    destroy() {}
};

export default alertModule;
