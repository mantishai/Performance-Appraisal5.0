import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    employeeId: 1,
    currentMonth: new Date().toISOString().slice(0, 7),
    today: new Date().toISOString().split('T')[0],
    todayRecord: null,
    records: [],
    leaves: [],
    currentTab: 'attendance'
};

const dailyModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderCard() + Skeleton.renderTable(4, 6);
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [recordsRes, leavesRes] = await Promise.all([
                API.getAttendanceRecords({ employeeId: state.employeeId, month: state.currentMonth }),
                API.getLeaves(state.employeeId)
            ]);
            if (recordsRes.code === 200) state.records = recordsRes.data;
            if (leavesRes.code === 200) state.leaves = leavesRes.data;
            state.todayRecord = state.records.find(r => r.date === state.today);
        } catch (error) {
            console.error('Failed to load daily data:', error);
        }
    },

    renderContent(container) {
        const daysInMonth = new Date(
            parseInt(state.currentMonth.split('-')[0]),
            parseInt(state.currentMonth.split('-')[1]),
            0
        ).getDate();
        const firstDayWeek = new Date(
            parseInt(state.currentMonth.split('-')[0]),
            parseInt(state.currentMonth.split('-')[1]) - 1,
            1
        ).getDay();

        const statusColors = {
            '正常': 'status-tag active',
            '迟到': 'status-tag pending',
            '早退': 'status-tag pending',
            '缺卡': 'status-tag inactive'
        };

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">我的考勤</h1>
            </div>

            <div class="stats-grid">
                <div class="stat-card" style="text-align: center; flex-direction: column;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🕐</div>
                    <div class="stat-label">上班打卡</div>
                    <div class="stat-value">${state.todayRecord?.checkIn || '--:--'}</div>
                    <button class="btn btn-primary" style="margin-top: 12px;" id="checkInBtn" ${state.todayRecord?.checkIn ? 'disabled' : ''}>打卡上班</button>
                </div>
                <div class="stat-card" style="text-align: center; flex-direction: column;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🕕</div>
                    <div class="stat-label">下班打卡</div>
                    <div class="stat-value">${state.todayRecord?.checkOut || '--:--'}</div>
                    <button class="btn btn-default" style="margin-top: 12px;" id="checkOutBtn" ${!state.todayRecord?.checkIn || state.todayRecord?.checkOut ? 'disabled' : ''}>打卡下班</button>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'attendance' ? 'btn-primary' : 'btn-default'}" data-tab="attendance">📅 考勤日历</button>
                    <button class="btn ${state.currentTab === 'leave' ? 'btn-primary' : 'btn-default'}" data-tab="leave">📋 请假申请</button>
                </div>

                ${state.currentTab === 'attendance' ? `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <button class="btn btn-sm btn-default" id="prevMonth">← 上月</button>
                        <span style="font-size: 18px; font-weight: 600;">${state.currentMonth.replace('-', '年')}月</span>
                        <button class="btn btn-sm btn-default" id="nextMonth">下月 →</button>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px;">
                        <div style="text-align: center; font-weight: 600; color: #faad14;">周日</div>
                        <div style="text-align: center; font-weight: 600;">周一</div>
                        <div style="text-align: center; font-weight: 600;">周二</div>
                        <div style="text-align: center; font-weight: 600;">周三</div>
                        <div style="text-align: center; font-weight: 600;">周四</div>
                        <div style="text-align: center; font-weight: 600;">周五</div>
                        <div style="text-align: center; font-weight: 600; color: #1890ff;">周六</div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px;">
                        ${Array(firstDayWeek).fill('').map(() => '<div></div>').join('')}
                        ${Array(daysInMonth).fill('').map((_, i) => {
                            const day = i + 1;
                            const date = `${state.currentMonth}-${String(day).padStart(2, '0')}`;
                            const record = state.records.find(r => r.date === date);
                            const isToday = date === state.today;
                            return `
                                <div style="padding: 12px; border: 1px solid ${isToday ? '#1890ff' : 'rgba(24, 144, 255, 0.1)'} ; border-radius: 12px; background: ${isToday ? 'rgba(24, 144, 255, 0.1)' : 'transparent'}; cursor: pointer; text-align: center;" data-date="${date}">
                                    <div style="font-weight: 600; margin-bottom: 4px;">${day}</div>
                                    ${record ? `
                                        <div style="font-size: 10px;">${record.checkIn || '--'}</div>
                                        <div style="font-size: 10px;">${record.checkOut || '--'}</div>
                                        <span class="${statusColors[record.status]}" style="font-size: 10px; padding: 2px 4px;">${record.status}</span>
                                    ` : '<div style="font-size: 10px; color: #8ba9c4;">无记录</div>'}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div style="margin-bottom: 16px;">
                        <button class="btn btn-primary" id="addLeaveBtn">+ 申请请假</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>请假类型</th>
                                    <th>开始日期</th>
                                    <th>结束日期</th>
                                    <th>事由</th>
                                    <th>状态</th>
                                    <th>审批人</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.leaves.map(l => `
                                    <tr>
                                        <td>${l.type}</td>
                                        <td>${l.startDate}</td>
                                        <td>${l.endDate}</td>
                                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${l.reason || '-'}</td>
                                        <td>
                                            <span class="status-tag ${l.status === 'pending' ? 'pending' : l.status === 'approved' ? 'active' : 'inactive'}">
                                                ${l.status === 'pending' ? '待审批' : l.status === 'approved' ? '已通过' : '已拒绝'}
                                            </span>
                                        </td>
                                        <td>${l.approver || '-'}</td>
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

    bindEvents(container) {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', async () => {
                state.currentTab = btn.dataset.tab;
                await this.loadData();
                this.renderContent(container);
            });
        });

        const checkInBtn = document.getElementById('checkInBtn');
        if (checkInBtn) {
            checkInBtn.addEventListener('click', async () => {
                await this.handleCheckIn('in');
            });
        }

        const checkOutBtn = document.getElementById('checkOutBtn');
        if (checkOutBtn) {
            checkOutBtn.addEventListener('click', async () => {
                await this.handleCheckIn('out');
            });
        }

        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        document.getElementById('addLeaveBtn')?.addEventListener('click', () => this.openLeaveModal(container));

        document.querySelectorAll('[data-date]').forEach(el => {
            el.addEventListener('click', () => {
                const date = el.dataset.date;
                const record = state.records.find(r => r.date === date);
                if (record) {
                    Modal.open({
                        title: '考勤详情',
                        content: `
                            <div class="form-grid">
                                <div class="form-field">
                                    <label style="color: #8ba9c4; font-size: 12px;">日期</label>
                                    <div style="font-weight: 600;">${record.date}</div>
                                </div>
                                <div class="form-field">
                                    <label style="color: #8ba9c4; font-size: 12px;">上班时间</label>
                                    <div style="font-weight: 600;">${record.checkIn || '--:--'}</div>
                                </div>
                                <div class="form-field">
                                    <label style="color: #8ba9c4; font-size: 12px;">下班时间</label>
                                    <div style="font-weight: 600;">${record.checkOut || '--:--'}</div>
                                </div>
                                <div class="form-field">
                                    <label style="color: #8ba9c4; font-size: 12px;">状态</label>
                                    <span class="status-tag ${record.status === '正常' ? 'active' : 'pending'}">${record.status}</span>
                                </div>
                            </div>
                        `
                    });
                }
            });
        });
    },

    async handleCheckIn(type) {
        try {
            const res = await API.checkIn(state.employeeId, type);
            if (res.code === 200) {
                Toast.success(type === 'in' ? '上班打卡成功！' : '下班打卡成功！');
                
                await API.triggerAlertCheck();
                Toast.info('已检查完成');
                
                await this.loadData();
                this.renderContent(document.getElementById('content'));
            }
        } catch (error) {
            Toast.error('打卡失败，请稍后重试');
        }
    },

    changeMonth(delta) {
        const current = new Date(state.currentMonth);
        current.setMonth(current.getMonth() + delta);
        state.currentMonth = current.toISOString().slice(0, 7);
        this.loadData().then(() => this.renderContent(document.getElementById('content')));
    },

    openLeaveModal(container) {
        Modal.open({
            title: '申请请假',
            content: `
                <form id="leaveForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>请假类型 <span class="required">*</span></label>
                            <select id="leaveType">
                                <option value="">请选择</option>
                                <option value="年假">年假</option>
                                <option value="病假">病假</option>
                                <option value="事假">事假</option>
                                <option value="婚假">婚假</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>开始日期 <span class="required">*</span></label>
                            <input type="date" id="startDate" value="${state.today}">
                        </div>
                        <div class="form-field">
                            <label>结束日期 <span class="required">*</span></label>
                            <input type="date" id="endDate" value="${state.today}">
                        </div>
                        <div class="form-field full">
                            <label>请假事由</label>
                            <textarea id="leaveReason" rows="3" placeholder="请输入请假事由"></textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="submitLeaveBtn">提交申请</button>
            `
        });

        document.getElementById('submitLeaveBtn')?.addEventListener('click', async () => {
            const type = document.getElementById('leaveType').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const reason = document.getElementById('leaveReason').value;

            if (!type || !startDate || !endDate) {
                Toast.error('请填写完整信息');
                return;
            }

            if (new Date(endDate) < new Date(startDate)) {
                Toast.error('结束日期不能早于开始日期');
                return;
            }

            try {
                const res = await API.applyLeave({
                    employeeId: state.employeeId,
                    type,
                    startDate,
                    endDate,
                    reason
                });

                if (res.code === 200) {
                    Toast.success('请假申请已提交，请等待审批');
                    document.querySelector('.modal-overlay.show')?.remove();
                    await this.loadData();
                    this.renderContent(container);
                }
            } catch (error) {
                Toast.error('提交失败，请稍后重试');
            }
        });
    },

    destroy() {}
};

export default dailyModule;
