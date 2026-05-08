import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const CSV_HEADERS = {
    records: ['员工姓名', '部门', '日期', '上班时间', '下班时间', '状态'],
    summary: ['员工姓名', '部门', '出勤天数', '迟到次数', '早退次数', '请假天数'],
    approval: ['员工姓名', '部门', '请假类型', '开始日期', '结束日期', '事由']
};

function escapeCsv(value) {
    if (value == null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

const state = {
    currentMonth: new Date().toISOString().slice(0, 7),
    currentTab: 'records',
    attendanceRecords: [],
    leaves: [],
    summary: []
};

const attendanceModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 8) + Skeleton.renderCard();
        await this.loadData();
        this.renderContent(container);
        this.bindDataImportEvents();
    },

    async loadData() {
        try {
            const [recordsRes, leavesRes, summaryRes] = await Promise.all([
                API.getAttendanceRecords({ month: state.currentMonth }),
                API.getLeaves(),
                API.getAttendanceSummary(state.currentMonth)
            ]);
            if (recordsRes.code === 200) state.attendanceRecords = recordsRes.data;
            if (leavesRes.code === 200) state.leaves = leavesRes.data;
            if (summaryRes.code === 200) state.summary = summaryRes.data;
        } catch (error) {
            console.error('Failed to load attendance data:', error);
        }
    },

    renderContent(container) {
        const pendingLeaves = state.leaves.filter(l => l.status === 'pending');
        const normalAttendance = state.attendanceRecords.filter(r => r.status === '正常').length;
        const lateAttendance = state.attendanceRecords.filter(r => r.status === '迟到').length;
        const earlyAttendance = state.attendanceRecords.filter(r => r.status === '早退').length;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">考勤管理</h1>
                <div style="display: flex; gap: 12px; align-items: center;">
                    <select class="filter-select" id="monthSelect">
                        ${this.generateMonthOptions()}
                    </select>
                    <button class="btn btn-default" id="exportBtn">📥 导出数据</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">✅</div>
                    <div class="stat-info">
                        <div class="stat-label">正常出勤</div>
                        <div class="stat-value">${normalAttendance}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">⏰</div>
                    <div class="stat-info">
                        <div class="stat-label">迟到</div>
                        <div class="stat-value">${lateAttendance}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">🏃</div>
                    <div class="stat-info">
                        <div class="stat-label">早退</div>
                        <div class="stat-value">${earlyAttendance}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">📋</div>
                    <div class="stat-info">
                        <div class="stat-label">待审批请假</div>
                        <div class="stat-value">${pendingLeaves.length}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'records' ? 'btn-primary' : 'btn-default'}" data-tab="records">📅 考勤记录</button>
                    <button class="btn ${state.currentTab === 'summary' ? 'btn-primary' : 'btn-default'}" data-tab="summary">📊 统计报表</button>
                    <button class="btn ${state.currentTab === 'approval' ? 'btn-primary' : 'btn-default'}" data-tab="approval">✅ 待审批</button>
                </div>

                ${state.currentTab === 'records' ? `
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>员工姓名</th>
                                    <th>部门</th>
                                    <th>日期</th>
                                    <th>上班时间</th>
                                    <th>下班时间</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.attendanceRecords.map(r => `
                                    <tr>
                                        <td><strong>${r.employeeName}</strong></td>
                                        <td>${r.department}</td>
                                        <td>${r.date}</td>
                                        <td>${r.checkIn || '--:--'}</td>
                                        <td>${r.checkOut || '--:--'}</td>
                                        <td>
                                            <span class="status-tag ${r.status === '正常' ? 'active' : 'pending'}">${r.status}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : state.currentTab === 'summary' ? `
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>员工姓名</th>
                                    <th>部门</th>
                                    <th>出勤天数</th>
                                    <th>迟到次数</th>
                                    <th>早退次数</th>
                                    <th>请假天数</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.summary.map(s => `
                                    <tr>
                                        <td><strong>${s.employeeName}</strong></td>
                                        <td>${s.department}</td>
                                        <td>${s.attendanceDays}</td>
                                        <td>${s.lateCount}</td>
                                        <td>${s.earlyLeaveCount}</td>
                                        <td>${s.leaveDays}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>员工姓名</th>
                                    <th>部门</th>
                                    <th>请假类型</th>
                                    <th>开始日期</th>
                                    <th>结束日期</th>
                                    <th>事由</th>
                                    <th>申请日期</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.leaves.filter(l => l.status === 'pending').map(l => `
                                    <tr>
                                        <td><strong>${l.employeeName}</strong></td>
                                        <td>${l.department}</td>
                                        <td>${l.type}</td>
                                        <td>${l.startDate}</td>
                                        <td>${l.endDate}</td>
                                        <td style="max-width: 200px;">${l.reason || '-'}</td>
                                        <td>${l.applyDate}</td>
                                        <td>
                                            <div class="action-btns">
                                                <button class="action-btn" data-id="${l.id}" data-action="approve">通过</button>
                                                <button class="action-btn" data-id="${l.id}" data-action="reject" style="color: #faad14;">拒绝</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;

        this.bindEvents(container);
    },

    generateMonthOptions() {
        const now = new Date();
        let options = '';
        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            options += `<option value="${value}" ${value === state.currentMonth ? 'selected' : ''}>${date.getFullYear()}年${date.getMonth() + 1}月</option>`;
        }
        return options;
    },

    bindEvents(container) {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', async () => {
                state.currentTab = btn.dataset.tab;
                await this.loadData();
                this.renderContent(container);
            });
        });

        document.getElementById('monthSelect')?.addEventListener('change', async (e) => {
            state.currentMonth = e.target.value;
            await this.loadData();
            this.renderContent(container);
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportData();
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                if (action === 'approve') {
                    await this.handleApprove(id, container);
                } else if (action === 'reject') {
                    await this.handleReject(id, container);
                }
            });
        });
    },

    async handleApprove(id, container) {
        try {
            const res = await API.approveLeave(id, '管理员');
            if (res.code === 200) {
                Toast.success('已批准请假申请');
                await this.loadData();
                this.renderContent(container);
            }
        } catch (error) {
            Toast.error('操作失败');
        }
    },

    async handleReject(id, container) {
        try {
            const res = await API.rejectLeave(id, '管理员');
            if (res.code === 200) {
                Toast.success('已拒绝请假申请');
                await this.loadData();
                this.renderContent(container);
            }
        } catch (error) {
            Toast.error('操作失败');
        }
    },

    exportData() {
        let csvContent = '';
        
        if (state.currentTab === 'records') {
            csvContent = [CSV_HEADERS.records.join(',')].concat(
                state.attendanceRecords.map(r => 
                    [escapeCsv(r.employeeName), escapeCsv(r.department), escapeCsv(r.date), 
                     escapeCsv(r.checkIn || ''), escapeCsv(r.checkOut || ''), escapeCsv(r.status)].join(',')
                )
            ).join('\n');
        } else if (state.currentTab === 'summary') {
            csvContent = [CSV_HEADERS.summary.join(',')].concat(
                state.summary.map(s => 
                    [escapeCsv(s.employeeName), escapeCsv(s.department), escapeCsv(s.attendanceDays), 
                     escapeCsv(s.lateCount), escapeCsv(s.earlyLeaveCount), escapeCsv(s.leaveDays)].join(',')
                )
            ).join('\n');
        } else {
            csvContent = [CSV_HEADERS.approval.join(',')].concat(
                state.leaves.filter(l => l.status === 'pending').map(l => 
                    [escapeCsv(l.employeeName), escapeCsv(l.department), escapeCsv(l.type), 
                     escapeCsv(l.startDate), escapeCsv(l.endDate), escapeCsv(l.reason || '')].join(',')
                )
            ).join('\n');
        }

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `考勤_${state.currentMonth}_${state.currentTab}.csv`;
        link.click();

        Toast.success('导出成功');
    },

    bindDataImportEvents() {
        this.dataImportCompleteHandler = async (e) => {
            const { dataType } = e.detail || {};
            if (dataType === 'attendance') {
                Toast.info('检测到考勤数据已导入，正在刷新列表...');
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

export default attendanceModule;
