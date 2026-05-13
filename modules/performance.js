import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    currentTab: 'plans',
    plans: [],
    kpis: [],
    evaluations: [],
    appeals: [],
    statistics: null,
    selectedPlan: null,
    currentEmployeeId: 1
};

const performanceModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 8);
        await this.loadData();
        this.renderContent(container);
        this.bindDataImportEvents();
    },

    async loadData() {
        try {
            const [plansRes, kpisRes, evalsRes, appealsRes, statsRes] = await Promise.all([
                API.getPerformancePlans(),
                API.getPerformanceKPIs(),
                API.getPerformanceEvaluations(),
                API.getPerformanceAppeals(),
                API.getPerformanceStatistics()
            ]);
            if (plansRes.code === 200) state.plans = plansRes.data;
            if (kpisRes.code === 200) state.kpis = kpisRes.data;
            if (evalsRes.code === 200) state.evaluations = evalsRes.data;
            if (appealsRes.code === 200) state.appeals = appealsRes.data;
            if (statsRes.code === 200) state.statistics = statsRes.data;
        } catch (error) {
            console.error('Failed to load performance data:', error);
        }
    },

    // 获取员工绩效等级数据（用于九宫格）
    getEmployeeGrades() {
        return state.evaluations
            .filter(e => e.status === 'completed' && e.grade)
            .map(e => ({
                employeeId: e.employeeId,
                employeeName: e.employeeName,
                department: e.department,
                position: e.position,
                grade: e.grade,
                finalScore: e.finalScore
            }));
    },

    // 更新九宫格位置
    async updateNineGridPosition(employeeId) {
        const evaluation = state.evaluations.find(e => e.employeeId === employeeId);
        if (evaluation && evaluation.status === 'completed' && evaluation.grade) {
            try {
                // 这里可以调用API更新九宫格数据
                const res = await API.getNineGridData();
                if (res.code === 200) {
                    // 更新mock数据
                    const nineGridData = res.data;
                    const employeeGridItem = nineGridData.find(item => item.employeeId === employeeId);
                    if (employeeGridItem) {
                        employeeGridItem.performance = evaluation.grade;
                        await API.updateNineGrid(employeeGridItem);
                    }
                }
            } catch (error) {
                console.error('Failed to update nine grid:', error);
            }
        }
    },

    renderContent(container) {
        const ongoingPlans = state.plans.filter(p => p.status === 'ongoing').length;
        const completedEvals = state.evaluations.filter(e => e.status === 'completed').length;
        const pendingAppeals = state.appeals.filter(a => a.status === 'pending').length;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">绩效考核</h1>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">📋</div>
                    <div class="stat-info">
                        <div class="stat-label">进行中计划</div>
                        <div class="stat-value">${ongoingPlans}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">✅</div>
                    <div class="stat-info">
                        <div class="stat-label">已完成评估</div>
                        <div class="stat-value">${completedEvals}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">📊</div>
                    <div class="stat-info">
                        <div class="stat-label">KPI指标</div>
                        <div class="stat-value">${state.kpis.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📝</div>
                    <div class="stat-info">
                        <div class="stat-label">待处理申诉</div>
                        <div class="stat-value">${pendingAppeals}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'plans' ? 'btn-primary' : 'btn-default'}" data-tab="plans">📋 绩效计划</button>
                    <button class="btn ${state.currentTab === 'kpis' ? 'btn-primary' : 'btn-default'}" data-tab="kpis">📐 指标库</button>
                    <button class="btn ${state.currentTab === 'evaluations' ? 'btn-primary' : 'btn-default'}" data-tab="evaluations">📝 绩效评估</button>
                    <button class="btn ${state.currentTab === 'results' ? 'btn-primary' : 'btn-default'}" data-tab="results">📊 结果分析</button>
                    <button class="btn ${state.currentTab === 'appeals' ? 'btn-primary' : 'btn-default'}" data-tab="appeals">🆘 绩效申诉</button>
                </div>

                ${state.currentTab === 'plans' ? this.renderPlansTab() : ''}
                ${state.currentTab === 'kpis' ? this.renderKPIsTab() : ''}
                ${state.currentTab === 'evaluations' ? this.renderEvaluationsTab() : ''}
                ${state.currentTab === 'results' ? this.renderResultsTab() : ''}
                ${state.currentTab === 'appeals' ? this.renderAppealsTab() : ''}
            </div>
        `;

        this.bindEvents(container);
    },

    renderPlansTab() {
        const cycleMap = { monthly: '月度', quarterly: '季度', yearly: '年度' };
        const statusMap = { pending: '待开始', ongoing: '进行中', completed: '已完成' };
        const statusClass = { pending: 'pending', ongoing: 'active', completed: 'inactive' };

        return `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-primary" id="addPlanBtn">+ 创建计划</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>计划名称</th>
                            <th>考核周期</th>
                            <th>开始时间</th>
                            <th>结束时间</th>
                            <th>参与部门</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.plans.map(p => `
                            <tr>
                                <td><strong>${p.name}</strong></td>
                                <td>${cycleMap[p.cycle] || p.cycle}</td>
                                <td>${p.startDate}</td>
                                <td>${p.endDate}</td>
                                <td>${p.departments?.join(', ') || '-'}</td>
                                <td><span class="status-tag ${statusClass[p.status]}">${statusMap[p.status]}</span></td>
                                <td>
                                    <div class="action-btns">
                                        ${p.status === 'pending' ? `<button class="action-btn" data-id="${p.id}" data-action="start">启动</button>` : ''}
                                        <button class="action-btn" data-id="${p.id}" data-action="edit">编辑</button>
                                        <button class="action-btn" data-id="${p.id}" data-action="delete" style="color: #f5222d;">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderKPIsTab() {
        const typeMap = { quantitative: '量化', qualitative: '定性' };

        return `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-primary" id="addKPIBtn">+ 新增指标</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>指标名称</th>
                            <th>指标类型</th>
                            <th>标准分值</th>
                            <th>计算公式</th>
                            <th>数据来源</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.kpis.map(k => `
                            <tr>
                                <td><strong>${k.name}</strong></td>
                                <td><span class="status-tag ${k.type === 'quantitative' ? 'active' : 'info'}">${typeMap[k.type]}</span></td>
                                <td>${k.standardScore}分</td>
                                <td>${k.formula}</td>
                                <td>${k.dataSource}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" data-id="${k.id}" data-action="edit">编辑</button>
                                        <button class="action-btn" data-id="${k.id}" data-action="delete" style="color: #f5222d;">删除</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderEvaluationsTab() {
        const planOptions = state.plans.map(p => `<option value="${p.id}" ${state.selectedPlan === p.id ? 'selected' : ''}>${p.name}</option>`).join('');
        const selfStatusMap = { pending: '待自评', completed: '已自评' };
        const leaderStatusMap = { pending: '待上级评', completed: '已评价' };

        const planEvals = state.selectedPlan ? state.evaluations.filter(e => e.planId === state.selectedPlan) : state.evaluations;

        return `
            <div style="margin-bottom: 16px;">
                <select id="evalPlanSelect" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                    <option value="">全部计划</option>
                    ${planOptions}
                </select>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>员工</th>
                            <th>部门</th>
                            <th>岗位</th>
                            <th>自评状态</th>
                            <th>上级评状态</th>
                            <th>最终得分</th>
                            <th>等级</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${planEvals.map(e => `
                            <tr>
                                <td><strong>${e.employeeName}</strong></td>
                                <td>${e.department}</td>
                                <td>${e.position}</td>
                                <td><span class="status-tag ${e.selfStatus === 'completed' ? 'active' : 'pending'}">${selfStatusMap[e.selfStatus]}</span></td>
                                <td><span class="status-tag ${e.leaderStatus === 'completed' ? 'active' : 'pending'}">${leaderStatusMap[e.leaderStatus]}</span></td>
                                <td>${e.finalScore ? e.finalScore.toFixed(1) : '-'}</td>
                                <td>${e.grade ? `<span class="status-tag ${e.grade === 'S' || e.grade === 'A' ? 'active' : e.grade === 'D' ? 'inactive' : 'info'}">${e.grade}</span>` : '-'}</td>
                                <td>
                                    <div class="action-btns">
                                        ${e.selfStatus !== 'completed' ? `<button class="action-btn" data-id="${e.id}" data-action="selfEval">自评</button>` : ''}
                                        ${e.selfStatus === 'completed' && e.leaderStatus !== 'completed' ? `<button class="action-btn" data-id="${e.id}" data-action="leaderEval">上级评</button>` : ''}
                                        ${e.status === 'completed' ? `<button class="action-btn" data-id="${e.id}" data-action="view">详情</button>` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderResultsTab() {
        const stats = state.statistics || { gradeDistribution: { S: 0, A: 0, B: 0, C: 0, D: 0 }, deptAvg: [], completedCount: 0 };
        const gradeLabels = { S: 'S级(卓越)', A: 'A级(优秀)', B: 'B级(良好)', C: 'C级(合格)', D: 'D级(不合格)' };

        return `
            <div style="display: flex; gap: 24px; margin-bottom: 24px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 12px;">绩效等级分布</div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        ${Object.entries(stats.gradeDistribution).map(([grade, count]) => `
                            <div style="padding: 16px; background: rgba(24, 144, 255, 0.05); border-radius: 12px; text-align: center; min-width: 80px;">
                                <div style="font-size: 24px; font-weight: bold; color: ${grade === 'S' ? '#722ed1' : grade === 'A' ? '#52c41a' : grade === 'B' ? '#1890ff' : grade === 'C' ? '#faad14' : '#f5222d'};">${grade}</div>
                                <div style="font-size: 12px; color: #8ba9c4;">${count}人</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 12px;">各部门平均分</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${stats.deptAvg.map(d => `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 80px; font-size: 13px;">${d.department}</div>
                                <div style="flex: 1; height: 24px; background: rgba(24, 144, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${d.avgScore}%; height: 100%; background: linear-gradient(90deg, #1890ff, #52c41a); border-radius: 4px;"></div>
                                </div>
                                <div style="width: 40px; font-size: 13px; text-align: right;">${d.avgScore.toFixed(1)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 600;">评估结果列表</div>
                <button class="btn btn-default" id="exportResultsBtn">📥 导出报表</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>员工</th>
                            <th>部门</th>
                            <th>得分</th>
                            <th>等级</th>
                            <th>排名</th>
                            <th>奖金系数</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.evaluations.filter(e => e.status === 'completed').sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0)).map((e, i) => `
                            <tr>
                                <td><strong>${e.employeeName}</strong></td>
                                <td>${e.department}</td>
                                <td>${e.finalScore?.toFixed(1) || '-'}</td>
                                <td><span class="status-tag ${e.grade === 'S' || e.grade === 'A' ? 'active' : e.grade === 'D' ? 'inactive' : 'info'}">${e.grade}</span></td>
                                <td>第${i + 1}名</td>
                                <td>${e.bonus || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderAppealsTab() {
        const statusMap = { pending: '待处理', resolved: '已处理', rejected: '已拒绝' };
        const statusClass = { pending: 'pending', resolved: 'active', rejected: 'inactive' };

        return `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>员工</th>
                            <th>申诉理由</th>
                            <th>原评分</th>
                            <th>状态</th>
                            <th>处理意见</th>
                            <th>新评分</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.appeals.map(a => `
                            <tr>
                                <td><strong>${a.employeeName}</strong></td>
                                <td style="max-width: 200px;">${a.reason}</td>
                                <td>${a.originalScore}</td>
                                <td><span class="status-tag ${statusClass[a.status]}">${statusMap[a.status]}</span></td>
                                <td>${a.handleComment || '-'}</td>
                                <td>${a.newScore || '-'}</td>
                                <td>
                                    ${a.status === 'pending' ? `
                                        <div class="action-btns">
                                            <button class="action-btn" data-id="${a.id}" data-action="handle">处理</button>
                                        </div>
                                    ` : '<span style="color: #8ba9c4;">已处理</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    bindEvents(container) {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                this.renderContent(container);
            });
        });

        document.getElementById('addPlanBtn')?.addEventListener('click', () => this.openPlanModal());
        document.getElementById('addKPIBtn')?.addEventListener('click', () => this.openKPIModal());
        document.getElementById('evalPlanSelect')?.addEventListener('change', (e) => {
            state.selectedPlan = e.target.value ? parseInt(e.target.value) : null;
            this.renderContent(container);
        });
        document.getElementById('exportResultsBtn')?.addEventListener('click', () => this.exportResults());

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                this.handleAction(id, action, container);
            }
        });
    },

    handleAction(id, action, container) {
        switch (action) {
            case 'edit':
                if (state.currentTab === 'plans') {
                    const plan = state.plans.find(p => p.id === id);
                    if (plan) this.openPlanModal(plan);
                } else if (state.currentTab === 'kpis') {
                    const kpi = state.kpis.find(k => k.id === id);
                    if (kpi) this.openKPIModal(kpi);
                }
                break;
            case 'delete':
                if (state.currentTab === 'plans') {
                    this.deletePlan(id, container);
                } else if (state.currentTab === 'kpis') {
                    this.deleteKPI(id, container);
                }
                break;
            case 'start':
                this.startPlan(id, container);
                break;
            case 'selfEval':
                const eval1 = state.evaluations.find(e => e.id === id);
                if (eval1) this.openSelfEvalModal(eval1, container);
                break;
            case 'leaderEval':
                const eval2 = state.evaluations.find(e => e.id === id);
                if (eval2) this.openLeaderEvalModal(eval2, container);
                break;
            case 'view':
                const eval3 = state.evaluations.find(e => e.id === id);
                if (eval3) this.openEvalDetailModal(eval3);
                break;
            case 'handle':
                const appeal = state.appeals.find(a => a.id === id);
                if (appeal) this.openAppealHandleModal(appeal, container);
                break;
        }
    },

    openPlanModal(plan = null) {
        const isEdit = !!plan;

        Modal.open({
            title: isEdit ? '编辑计划' : '创建计划',
            content: `
                <form id="planForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>计划名称 <span class="required">*</span></label>
                            <input type="text" id="planName" value="${plan?.name || ''}" placeholder="如：2024年Q2绩效考核">
                        </div>
                        <div class="form-field">
                            <label>考核周期</label>
                            <select id="planCycle">
                                <option value="monthly" ${plan?.cycle === 'monthly' ? 'selected' : ''}>月度</option>
                                <option value="quarterly" ${plan?.cycle === 'quarterly' ? 'selected' : ''}>季度</option>
                                <option value="yearly" ${plan?.cycle === 'yearly' ? 'selected' : ''}>年度</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>状态</label>
                            <select id="planStatus">
                                <option value="pending" ${plan?.status === 'pending' ? 'selected' : ''}>待开始</option>
                                <option value="ongoing" ${plan?.status === 'ongoing' ? 'selected' : ''}>进行中</option>
                                <option value="completed" ${plan?.status === 'completed' ? 'selected' : ''}>已完成</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>开始时间</label>
                            <input type="date" id="planStartDate" value="${plan?.startDate || ''}">
                        </div>
                        <div class="form-field">
                            <label>结束时间</label>
                            <input type="date" id="planEndDate" value="${plan?.endDate || ''}">
                        </div>
                        <div class="form-field full">
                            <label>参与部门</label>
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                ${['技术部', '产品部', '市场部', '人事部'].map(dept => `
                                    <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                                        <input type="checkbox" value="${dept}" ${plan?.departments?.includes(dept) ? 'checked' : ''} class="dept-checkbox"> ${dept}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="savePlanBtn">保存</button>
            `
        });

        document.getElementById('savePlanBtn')?.addEventListener('click', async () => {
            const departments = Array.from(document.querySelectorAll('.dept-checkbox:checked')).map(cb => cb.value);
            const data = {
                name: document.getElementById('planName').value,
                cycle: document.getElementById('planCycle').value,
                status: document.getElementById('planStatus').value,
                startDate: document.getElementById('planStartDate').value,
                endDate: document.getElementById('planEndDate').value,
                departments
            };

            if (!data.name) {
                Toast.error('请输入计划名称');
                return;
            }

            if (isEdit) {
                await API.updatePerformancePlan(plan.id, data);
                Toast.success('计划已更新');
            } else {
                await API.createPerformancePlan(data);
                Toast.success('计划已创建');
            }

            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(container);
        });
    },

    async deletePlan(id, container) {
        await API.deletePerformancePlan(id);
        Toast.success('计划已删除');
        await this.loadData();
        this.renderContent(container);
    },

    async startPlan(id, container) {
        await API.updatePerformancePlan(id, { status: 'ongoing' });
        Toast.success('计划已启动');
        await this.loadData();
        this.renderContent(container);
    },

    openKPIModal(kpi = null) {
        const isEdit = !!kpi;

        Modal.open({
            title: isEdit ? '编辑指标' : '新增指标',
            content: `
                <form id="kpiForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>指标名称 <span class="required">*</span></label>
                            <input type="text" id="kpiName" value="${kpi?.name || ''}" placeholder="如：代码质量">
                        </div>
                        <div class="form-field">
                            <label>指标类型</label>
                            <select id="kpiType">
                                <option value="quantitative" ${kpi?.type === 'quantitative' ? 'selected' : ''}>量化指标</option>
                                <option value="qualitative" ${kpi?.type === 'qualitative' ? 'selected' : ''}>定性指标</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>标准分值</label>
                            <input type="number" id="kpiScore" value="${kpi?.standardScore || 10}" min="1">
                        </div>
                        <div class="form-field">
                            <label>数据来源</label>
                            <input type="text" id="kpiSource" value="${kpi?.dataSource || ''}" placeholder="如：测试报告">
                        </div>
                        <div class="form-field full">
                            <label>计算公式</label>
                            <input type="text" id="kpiFormula" value="${kpi?.formula || ''}" placeholder="如：Bug率<5%">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveKPIBtn">保存</button>
            `
        });

        document.getElementById('saveKPIBtn')?.addEventListener('click', async () => {
            const data = {
                name: document.getElementById('kpiName').value,
                type: document.getElementById('kpiType').value,
                standardScore: parseInt(document.getElementById('kpiScore').value) || 10,
                dataSource: document.getElementById('kpiSource').value,
                formula: document.getElementById('kpiFormula').value
            };

            if (!data.name) {
                Toast.error('请输入指标名称');
                return;
            }

            if (isEdit) {
                await API.updatePerformanceKPI(kpi.id, data);
                Toast.success('指标已更新');
            } else {
                await API.createPerformanceKPI(data);
                Toast.success('指标已创建');
            }

            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(container);
        });
    },

    async deleteKPI(id, container) {
        await API.deletePerformanceKPI(id);
        Toast.success('指标已删除');
        await this.loadData();
        this.renderContent(container);
    },

    openSelfEvalModal(evaluation, container) {
        Modal.open({
            title: '自评',
            content: `
                <form id="selfEvalForm">
                    <div style="margin-bottom: 16px;">
                        <strong>${evaluation.employeeName}</strong> - ${evaluation.position}
                    </div>
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>自评得分(0-100) <span class="required">*</span></label>
                            <input type="number" id="selfScore" value="${evaluation.selfScore || ''}" min="0" max="100" placeholder="请输入自评得分">
                        </div>
                        <div class="form-field full">
                            <label>自评说明</label>
                            <textarea id="selfComment" rows="4" placeholder="请描述工作完成情况和自我评价">${evaluation.selfComment || ''}</textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="submitSelfBtn">提交自评</button>
            `
        });

        document.getElementById('submitSelfBtn')?.addEventListener('click', async () => {
            const data = {
                selfScore: parseFloat(document.getElementById('selfScore').value),
                selfComment: document.getElementById('selfComment').value
            };

            if (isNaN(data.selfScore) || data.selfScore < 0 || data.selfScore > 100) {
                Toast.error('请输入有效的分数(0-100)');
                return;
            }

            await API.submitSelfEvaluation(evaluation.id, data);
            Toast.success('自评已提交');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(container);
        });
    },

    openLeaderEvalModal(evaluation, container) {
        Modal.open({
            title: '上级评价',
            content: `
                <form id="leaderEvalForm">
                    <div style="margin-bottom: 16px;">
                        <strong>${evaluation.employeeName}</strong> - ${evaluation.position}
                    </div>
                    ${evaluation.selfScore ? `
                        <div style="margin-bottom: 16px; padding: 12px; background: rgba(24, 144, 255, 0.05); border-radius: 8px;">
                            <div style="font-weight: 600; margin-bottom: 8px;">员工自评</div>
                            <div>自评得分：<strong>${evaluation.selfScore}</strong></div>
                            <div style="font-size: 13px; color: #8ba9c4;">${evaluation.selfComment || '无'}</div>
                        </div>
                    ` : ''}
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>上级评分(0-100) <span class="required">*</span></label>
                            <input type="number" id="leaderScore" value="${evaluation.leaderScore || ''}" min="0" max="100" placeholder="请输入上级评分">
                        </div>
                        <div class="form-field full">
                            <label>评价说明</label>
                            <textarea id="leaderComment" rows="4" placeholder="请输入对员工的工作评价">${evaluation.leaderComment || ''}</textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="submitLeaderBtn">提交评价</button>
            `
        });

        document.getElementById('submitLeaderBtn')?.addEventListener('click', async () => {
            const data = {
                leaderScore: parseFloat(document.getElementById('leaderScore').value),
                leaderComment: document.getElementById('leaderComment').value
            };

            if (isNaN(data.leaderScore) || data.leaderScore < 0 || data.leaderScore > 100) {
                Toast.error('请输入有效的分数(0-100)');
                return;
            }

            await API.submitLeaderEvaluation(evaluation.id, data);
            Toast.success('上级评价已提交');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            // 更新九宫格位置
            await this.updateNineGridPosition(evaluation.employeeId);
            this.renderContent(container);
        });
    },

    openEvalDetailModal(evaluation) {
        Modal.open({
            title: '评估详情',
            content: `
                <div class="form-grid">
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">员工</label>
                        <div style="font-weight: 600; margin-top: 4px;">${evaluation.employeeName}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">部门</label>
                        <div style="font-weight: 600; margin-top: 4px;">${evaluation.department}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">岗位</label>
                        <div style="font-weight: 600; margin-top: 4px;">${evaluation.position}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">考核计划</label>
                        <div style="font-weight: 600; margin-top: 4px;">${evaluation.planName}</div>
                    </div>
                </div>
                <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                    <div style="text-align: center; padding: 16px; background: rgba(24, 144, 255, 0.05); border-radius: 12px;">
                        <div style="font-size: 12px; color: #8ba9c4;">自评得分</div>
                        <div style="font-size: 28px; font-weight: bold; color: #1890ff;">${evaluation.selfScore || '-'}</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: rgba(82, 196, 26, 0.05); border-radius: 12px;">
                        <div style="font-size: 12px; color: #8ba9c4;">上级评分</div>
                        <div style="font-size: 28px; font-weight: bold; color: #52c41a;">${evaluation.leaderScore || '-'}</div>
                    </div>
                    <div style="text-align: center; padding: 16px; background: rgba(114, 46, 209, 0.05); border-radius: 12px;">
                        <div style="font-size: 12px; color: #8ba9c4;">最终得分</div>
                        <div style="font-size: 28px; font-weight: bold; color: #722ed1;">${evaluation.finalScore?.toFixed(1) || '-'}</div>
                    </div>
                </div>
                <div style="margin-top: 20px;">
                    <div style="margin-bottom: 12px;">
                        <div style="font-weight: 600;">最终等级：<span class="status-tag ${evaluation.grade === 'S' || evaluation.grade === 'A' ? 'active' : evaluation.grade === 'D' ? 'inactive' : 'info'}" style="font-size: 16px;">${evaluation.grade}</span></div>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <div style="font-weight: 600;">奖金系数：<span style="color: #1890ff;">${evaluation.bonus || '-'}</span></div>
                    </div>
                </div>
                ${evaluation.selfComment ? `
                    <div style="margin-top: 16px; padding: 12px; background: rgba(24, 144, 255, 0.03); border-radius: 8px;">
                        <div style="font-weight: 600; margin-bottom: 8px;">自评说明</div>
                        <div style="font-size: 13px;">${evaluation.selfComment}</div>
                    </div>
                ` : ''}
                ${evaluation.leaderComment ? `
                    <div style="margin-top: 16px; padding: 12px; background: rgba(82, 196, 26, 0.03); border-radius: 8px;">
                        <div style="font-weight: 600; margin-bottom: 8px;">上级评价</div>
                        <div style="font-size: 13px;">${evaluation.leaderComment}</div>
                    </div>
                ` : ''}
            `
        });
    },

    openAppealHandleModal(appeal, container) {
        Modal.open({
            title: '处理申诉',
            content: `
                <form id="appealForm">
                    <div style="margin-bottom: 16px;">
                        <strong>${appeal.employeeName}</strong> 的申诉
                    </div>
                    <div style="margin-bottom: 16px; padding: 12px; background: rgba(250, 173, 20, 0.1); border-radius: 8px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">申诉理由</div>
                        <div style="font-size: 13px;">${appeal.reason}</div>
                        <div style="margin-top: 8px;">原评分：<strong>${appeal.originalScore}</strong></div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>处理意见</label>
                            <textarea id="handleComment" rows="2" placeholder="请输入处理意见"></textarea>
                        </div>
                        <div class="form-field">
                            <label>是否调整评分</label>
                            <input type="number" id="newScore" min="0" max="100" placeholder="留空则不调整">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="submitAppealBtn">确认处理</button>
            `
        });

        document.getElementById('submitAppealBtn')?.addEventListener('click', async () => {
            const data = {
                handleComment: document.getElementById('handleComment').value,
                newScore: parseFloat(document.getElementById('newScore').value) || null
            };

            await API.handlePerformanceAppeal(appeal.id, data);
            Toast.success('申诉已处理');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(container);
        });
    },

    exportResults() {
        const completed = state.evaluations.filter(e => e.status === 'completed');
        const csvContent = ['姓名,部门,岗位,得分,等级,奖金系数'].concat(
            completed.map(e => [e.employeeName, e.department, e.position, e.finalScore?.toFixed(1) || '', e.grade, e.bonus || ''].join(','))
        ).join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `绩效考核结果_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        Toast.success('导出成功');
    },

    bindDataImportEvents() {
        this.dataImportCompleteHandler = async (e) => {
            const { dataType } = e.detail || {};
            if (dataType === 'performance') {
                Toast.info('检测到绩效数据已导入，正在刷新列表...');
                this.loadData().then(() => {
                    this.renderContent(document.getElementById('content'));
                });
            }
        };
        window.addEventListener('dataImportComplete', this.dataImportCompleteHandler);
    },

    destroy() {
        if (this.dataImportCompleteHandler) {
            window.removeEventListener('dataImportComplete', this.dataImportCompleteHandler);
        }
    }
};

export default performanceModule;
