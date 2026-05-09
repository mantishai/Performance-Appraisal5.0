import { Toast, Skeleton } from '../utils.js';
import API from '../api.js';

let charts = {};
let refreshInterval = null;

const state = {
    dashboardData: null,
    leaves: [],
    interviews: [],
    evaluations: [],
    trainingCourses: [],
    trainingRegistrations: [],
    trainingRecords: [],
    alerts: [],
    riskPredictions: [],
    systemData: null,
    announcements: [],
    todos: [],
    schedule: [],
    currentUser: null
};

const dashboardModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderStats() + Skeleton.renderCard() + Skeleton.renderTable(3, 6);

        await this.loadData();
        this.renderContent(container);
        this.initCharts();
        this.startRefresh();
    },

    async loadData() {
        try {
            const [
                dashboardRes,
                leavesRes,
                interviewsRes,
                evalsRes,
                coursesRes,
                regsRes,
                recordsRes,
                alertsRes,
                riskRes,
                systemRes,
                announceRes,
                todosRes,
                scheduleRes,
                userRes
            ] = await Promise.all([
                API.getDashboard(),
                API.getLeaves(),
                API.getInterviews(),
                API.getPerformanceEvaluations(),
                API.getTrainingCourses(),
                API.getMyCourses(1),
                API.getTrainingRecords(1),
                API.getAlertList(),
                API.getRiskPredictions(),
                API.getSystemDashboard(),
                API.getSystemAnnouncements(),
                API.getSystemTodos(),
                API.getSystemSchedule(),
                API.getCurrentUser()
            ]);
            
            if (dashboardRes.code === 200) state.dashboardData = dashboardRes.data;
            if (leavesRes.code === 200) state.leaves = leavesRes.data || [];
            if (interviewsRes.code === 200) state.interviews = interviewsRes.data || [];
            if (evalsRes.code === 200) state.evaluations = evalsRes.data || [];
            if (coursesRes.code === 200) state.trainingCourses = coursesRes.data || [];
            if (regsRes.code === 200) state.trainingRegistrations = regsRes.data || [];
            if (recordsRes.code === 200) state.trainingRecords = recordsRes.data || [];
            if (alertsRes.code === 200) state.alerts = alertsRes.data || [];
            if (riskRes.code === 200) state.riskPredictions = riskRes.data.riskPredictions || [];
            if (systemRes.code === 200) state.systemData = systemRes.data;
            if (announceRes.code === 200) state.announcements = announceRes.data || [];
            if (todosRes.code === 200) state.todos = todosRes.data || [];
            if (scheduleRes.code === 200) state.schedule = scheduleRes.data || [];
            if (userRes.code === 200) state.currentUser = userRes.data;
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            state.leaves = [];
            state.interviews = [];
            state.evaluations = [];
            state.trainingCourses = [];
            state.trainingRegistrations = [];
            state.trainingRecords = [];
            state.alerts = [];
            state.riskPredictions = [];
            state.announcements = [];
            state.todos = [];
            state.schedule = [];
        }
    },

    renderContent(container) {
        const pendingLeaves = state.leaves.filter(l => l.status === 'pending');
        const pendingInterviews = state.interviews.filter(i => i.status === 'completed');
        const pendingSelfEvals = state.evaluations.filter(e => e.selfStatus !== 'completed');
        const pendingLeaderEvals = state.evaluations.filter(e => e.selfStatus === 'completed' && e.leaderStatus !== 'completed');

        const today = new Date();
        const upcomingTrainings = state.trainingCourses.filter(c => {
            if (c.status !== 'open') return false;
            const startDate = new Date(c.startDate);
            const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilStart >= 0 && daysUntilStart <= 7;
        });

        const pendingSignIns = state.trainingRegistrations.filter(r => {
            if (r.status !== 'registered') return false;
            const course = state.trainingCourses.find(c => c.id === r.courseId);
            if (!course) return false;
            const startDate = new Date(course.startDate);
            const signinTime = new Date(startDate);
            signinTime.setHours(signinTime.getHours() - 0.5);
            return signinTime > today && signinTime <= new Date(today.getTime() + 24 * 60 * 60 * 1000);
        });

        const pendingAlerts = state.alerts.filter(a => a.status === 'pending');
        const highRiskPredictions = state.riskPredictions.filter(r => r.riskScore >= 70);

        const stats = state.dashboardData || { totalEmployees: 128, newJoin: 5, leave: 2, pending: pendingLeaves.length };
        
        const completedTodos = state.todos.filter(t => t.completed).length;
        const totalTodos = state.todos.length;
        const todoProgress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

        const hour = new Date().getHours();
        let greeting = '您好';
        if (hour < 12) greeting = '早上好';
        else if (hour < 18) greeting = '下午好';
        else greeting = '晚上好';

        container.innerHTML = `
            <div class="page-header">
                <div class="welcome-section">
                    <div class="welcome-content">
                        <h1 class="welcome-title">${greeting}，${state.currentUser?.name || '用户'}</h1>
                        <p class="welcome-subtitle">欢迎使用人力资源管理系统，祝您工作愉快！</p>
                    </div>
                    <div class="welcome-actions">
                        <button class="btn btn-primary" id="refreshBtn">
                            <span>🔄</span>
                            <span>刷新数据</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card card-interactive" data-module="employee">
                    <div class="stat-icon blue">👥</div>
                    <div class="stat-info">
                        <div class="stat-label">员工总数</div>
                        <div class="stat-value">${stats.totalEmployees}</div>
                        <div class="stat-trend up">↑ 12% 较上月</div>
                    </div>
                </div>
                <div class="stat-card card-interactive">
                    <div class="stat-icon green">📥</div>
                    <div class="stat-info">
                        <div class="stat-label">本月入职</div>
                        <div class="stat-value">${stats.newJoin}</div>
                        <div class="stat-trend up">↑ 2人</div>
                    </div>
                </div>
                <div class="stat-card card-interactive">
                    <div class="stat-icon orange">📤</div>
                    <div class="stat-info">
                        <div class="stat-label">本月离职</div>
                        <div class="stat-value">${stats.leave}</div>
                        <div class="stat-trend down">↓ 1人</div>
                    </div>
                </div>
                <div class="stat-card card-interactive" data-module="alert">
                    <div class="stat-icon red">🚨</div>
                    <div class="stat-info">
                        <div class="stat-label">待处理预警</div>
                        <div class="stat-value">${pendingAlerts.length}</div>
                        <div class="stat-trend" style="color: #8ba9c4;">请及时处理</div>
                    </div>
                </div>
                <div class="stat-card" data-module="attendance">
                    <div class="stat-icon purple">📋</div>
                    <div class="stat-info">
                        <div class="stat-label">待处理请假</div>
                        <div class="stat-value">${pendingLeaves.length}</div>
                        <div class="stat-trend" style="color: #8ba9c4;">请及时处理</div>
                    </div>
                </div>
                <div class="stat-card" data-module="recruitment">
                    <div class="stat-icon red">📅</div>
                    <div class="stat-info">
                        <div class="stat-label">待面试</div>
                        <div class="stat-value">${pendingInterviews.length}</div>
                        <div class="stat-trend" style="color: #8ba9c4;">待评价: ${pendingInterviews.filter(i => i.status === 'pending').length}</div>
                    </div>
                </div>
                <div class="stat-card" data-module="performance">
                    <div class="stat-icon blue">📊</div>
                    <div class="stat-info">
                        <div class="stat-label">待绩效评分</div>
                        <div class="stat-value">${pendingSelfEvals.length + pendingLeaderEvals.length}</div>
                        <div class="stat-trend" style="color: #8ba9c4;">自评:${pendingSelfEvals.length} 上级评:${pendingLeaderEvals.length}</div>
                    </div>
                </div>
                <div class="stat-card" data-module="training">
                    <div class="stat-icon orange">🎓</div>
                    <div class="stat-info">
                        <div class="stat-label">待签到培训</div>
                        <div class="stat-value">${pendingSignIns.length}</div>
                        <div class="stat-trend" style="color: #8ba9c4;">即将开始: ${upcomingTrainings.length}</div>
                    </div>
                </div>
            </div>

            <div class="todo-section">
                <div class="todo-card">
                    <div class="card-header">
                        <span>待办任务</span>
                        <span class="badge-count">${pendingLeaves.length + pendingInterviews.length + pendingSelfEvals.length + pendingLeaderEvals.length + pendingSignIns.length + upcomingTrainings.length}</span>
                    </div>
                    <div class="todo-progress-section">
                        <div class="todo-progress-info">
                            <span>今日完成: ${completedTodos}/${totalTodos}</span>
                            <span>${todoProgress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${todoProgress}%"></div>
                        </div>
                    </div>
                    <div class="todo-list">
                        ${pendingLeaves.length > 0 || pendingInterviews.length > 0 || pendingSelfEvals.length > 0 || pendingLeaderEvals.length > 0 || pendingSignIns.length > 0 || upcomingTrainings.length > 0 ? `
                            ${pendingLeaves.map(l => `
                                <div class="todo-item">
                                    <span class="todo-priority medium"></span>
                                    <div class="todo-content">
                                        <div class="todo-text">${l.employeeName} - ${l.type}申请</div>
                                        <div class="todo-date">${l.startDate} 至 ${l.endDate}</div>
                                    </div>
                                    <button class="btn btn-primary btn-sm" data-action="goto-attendance">去审批</button>
                                </div>
                            `).join('')}
                            ${pendingInterviews.filter(i => i.status === 'pending').map(i => `
                                <div class="todo-item">
                                    <span class="todo-priority high"></span>
                                    <div class="todo-content">
                                        <div class="todo-text">${i.candidateName} - ${i.position}面试待评价</div>
                                        <div class="todo-date">${i.interviewTime}</div>
                                    </div>
                                    <button class="btn btn-primary btn-sm" data-action="goto-recruitment">去评价</button>
                                </div>
                            `).join('')}
                            ${pendingSelfEvals.map(e => `
                                <div class="todo-item">
                                    <span class="todo-priority medium"></span>
                                    <div class="todo-content">
                                        <div class="todo-text">${e.employeeName} - 等待自评</div>
                                        <div class="todo-date">${e.planName}</div>
                                    </div>
                                    <button class="btn btn-primary btn-sm" data-action="goto-performance">去自评</button>
                                </div>
                            `).join('')}
                            ${pendingLeaderEvals.map(e => `
                                <div class="todo-item">
                                    <span class="todo-priority high"></span>
                                    <div class="todo-content">
                                        <div class="todo-text">${e.employeeName} - 等待上级评价</div>
                                        <div class="todo-date">${e.planName}</div>
                                    </div>
                                    <button class="btn btn-primary btn-sm" data-action="goto-performance">去评价</button>
                                </div>
                            `).join('')}
                            ${pendingSignIns.map(r => {
                                const course = state.trainingCourses.find(c => c.id === r.courseId);
                                const startDate = course ? new Date(course.startDate) : null;
                                return `
                                    <div class="todo-item">
                                        <span class="todo-priority high"></span>
                                        <div class="todo-content">
                                            <div class="todo-text">${course?.name || '培训课程'} - 待签到</div>
                                            <div class="todo-date">${startDate ? startDate.toLocaleString() : ''}</div>
                                        </div>
                                        <button class="btn btn-primary btn-sm" data-action="goto-training">去签到</button>
                                    </div>
                                `;
                            }).join('')}
                            ${upcomingTrainings.map(c => `
                                <div class="todo-item">
                                    <span class="todo-priority low"></span>
                                    <div class="todo-content">
                                        <div class="todo-text">${c.name} - 即将开始</div>
                                        <div class="todo-date">${c.startDate} | ${c.enrolledCount}/${c.capacity}人已报名</div>
                                    </div>
                                    <button class="btn btn-default btn-sm" data-action="goto-training">查看详情</button>
                                </div>
                            `).join('')}
                        ` : '<div style="padding: 20px; text-align: center; color: #8ba9c4;">暂无待办任务</div>'}
                    </div>
                </div>

                <div class="todo-card">
                    <div class="card-header">
                        <span>快捷入口</span>
                    </div>
                    <div class="quick-links">
                        <div class="quick-link" data-module="employee">
                            <span class="quick-link-icon">👤</span>
                            <span class="quick-link-text">员工管理</span>
                        </div>
                        <div class="quick-link" data-module="daily">
                            <span class="quick-link-icon">📅</span>
                            <span class="quick-link-text">我的考勤</span>
                        </div>
                        <div class="quick-link" data-module="hr">
                            <span class="quick-link-icon">📝</span>
                            <span class="quick-link-text">人事管理</span>
                        </div>
                        <div class="quick-link" data-module="attendance">
                            <span class="quick-link-icon">⏰</span>
                            <span class="quick-link-text">考勤管理</span>
                        </div>
                        <div class="quick-link" data-module="recruitment">
                            <span class="quick-link-icon">🎯</span>
                            <span class="quick-link-text">招聘管理</span>
                        </div>
                        <div class="quick-link" data-module="performance">
                            <span class="quick-link-icon">📊</span>
                            <span class="quick-link-text">绩效考核</span>
                        </div>
                        <div class="quick-link" data-module="training">
                            <span class="quick-link-icon">🎓</span>
                            <span class="quick-link-text">培训管理</span>
                        </div>
                        <div class="quick-link" data-module="system">
                            <span class="quick-link-icon">⚙️</span>
                            <span class="quick-link-text">系统管理</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="todo-section" style="margin-top: 24px;">
                <div class="todo-card">
                    <div class="card-header">
                        <span>📢 系统公告</span>
                    </div>
                    <div class="announcement-list">
                        ${state.announcements.length > 0 ? state.announcements.map(a => `
                            <div class="announcement-item">
                                ${a.isTop ? '<span class="badge badge-primary" style="margin-right: 8px;">置顶</span>' : ''}
                                <div class="announcement-content">
                                    <div class="announcement-title">${a.title}</div>
                                    <div class="announcement-desc">${a.content}</div>
                                </div>
                                <div class="announcement-date">${a.publishTime}</div>
                            </div>
                        `).join('') : '<div style="padding: 20px; text-align: center; color: #8ba9c4;">暂无公告</div>'}
                    </div>
                </div>

                <div class="todo-card">
                    <div class="card-header">
                        <span>📅 我的日程</span>
                    </div>
                    <div class="schedule-list">
                        ${state.schedule.length > 0 ? state.schedule.map(s => `
                            <div class="schedule-item">
                                <div class="schedule-time">${s.time}</div>
                                <div class="schedule-content">
                                    <div class="schedule-title">${s.title}</div>
                                    <div class="schedule-location">${s.location || ''}</div>
                                </div>
                                <div class="schedule-type ${s.type}">
                                    ${s.type === 'meeting' ? '会议' : s.type === 'task' ? '任务' : '培训'}
                                </div>
                            </div>
                        `).join('') : '<div style="padding: 20px; text-align: center; color: #8ba9c4;">今日无日程安排</div>'}
                    </div>
                </div>
            </div>

            ${(pendingAlerts.length > 0 || highRiskPredictions.length > 0) ? `
            <div class="todo-section" style="margin-top: 24px;">
                <div class="todo-card" data-module="alert">
                    <div class="card-header">
                        <span>🚨 高风险预警</span>
                        <span class="badge-count">${pendingAlerts.length + highRiskPredictions.length}</span>
                    </div>
                    <div class="todo-list">
                        ${pendingAlerts.slice(0, 5).map(a => `
                            <div class="todo-item">
                                <span class="todo-priority high"></span>
                                <div class="todo-content">
                                    <div class="todo-text">${a.title}${a.content ? ` - ${a.content}` : ''}</div>
                                    <div class="todo-date">${a.createTime || a.date}</div>
                                </div>
                                <button class="btn btn-primary btn-sm" data-action="goto-alert">处理</button>
                            </div>
                        `).join('')}
                        ${highRiskPredictions.slice(0, 3).map(r => `
                            <div class="todo-item">
                                <span class="todo-priority high"></span>
                                <div class="todo-content">
                                    <div class="todo-text">⚠️ ${r.employeeName} - 离职风险${r.riskScore}分</div>
                                    <div class="todo-date">风险因素: ${(r.factors || []).join('、') || '待评估'}</div>
                                </div>
                                <button class="btn btn-default btn-sm" data-action="goto-alert">查看</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <span class="chart-title">本周考勤趋势</span>
                        <div class="chart-actions">
                            <button class="chart-action-btn active" data-type="bar" title="柱状图">📊</button>
                            <button class="chart-action-btn" data-type="line" title="折线图">📈</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="attendanceChart"></canvas>
                    </div>
                </div>
                <div class="chart-card">
                    <div class="chart-header">
                        <span class="chart-title">各部门人数分布</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="departmentChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('refreshBtn')?.addEventListener('click', async () => {
            Toast.info('正在刷新数据...');
            await this.loadData();
            const container = document.getElementById('content');
            if (container) {
                this.renderContent(container);
                this.initCharts();
            }
            Toast.success('数据刷新成功！');
        });

        document.querySelectorAll('.quick-link, .stat-card[data-module]').forEach(el => {
            el.addEventListener('click', () => {
                const module = el.dataset.module;
                if (module) {
                    import('../app.js').then(app => {
                        app.switchModule(module);
                    });
                }
            });
        });

        document.querySelectorAll('[data-action="goto-attendance"]').forEach(btn => {
            btn.addEventListener('click', () => {
                import('../app.js').then(app => {
                    app.switchModule('attendance');
                });
            });
        });

        document.querySelectorAll('[data-action="goto-recruitment"]').forEach(btn => {
            btn.addEventListener('click', () => {
                import('../app.js').then(app => {
                    app.switchModule('recruitment');
                });
            });
        });

        document.querySelectorAll('[data-action="goto-performance"]').forEach(btn => {
            btn.addEventListener('click', () => {
                import('../app.js').then(app => {
                    app.switchModule('performance');
                });
            });
        });

        document.querySelectorAll('[data-action="goto-training"]').forEach(btn => {
            btn.addEventListener('click', () => {
                import('../app.js').then(app => {
                    app.switchModule('training');
                });
            });
        });

        document.querySelectorAll('[data-action="goto-alert"]').forEach(btn => {
            btn.addEventListener('click', () => {
                import('../app.js').then(app => {
                    app.switchModule('alert');
                });
            });
        });

        document.querySelectorAll('.todo-card[data-module="alert"]').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    import('../app.js').then(app => {
                        app.switchModule('alert');
                    });
                }
            });
        });

        const chartActions = document.querySelectorAll('.chart-action-btn[data-type]');
        chartActions.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (type === 'bar' || type === 'line') {
                    document.querySelectorAll('.chart-action-btn[data-type]').forEach(b => {
                        if (b.dataset.type === 'bar' || b.dataset.type === 'line') {
                            b.classList.remove('active');
                        }
                    });
                    btn.classList.add('active');
                    this.switchChartType(type);
                }
            });
        });
    },

    switchChartType(type) {
        if (charts.attendance) {
            charts.attendance.config.type = type === 'line' ? 'line' : 'bar';
            charts.attendance.update();
        }
    },

    initCharts() {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        const attendanceCtx = document.getElementById('attendanceChart');
        const departmentCtx = document.getElementById('departmentChart');

        if (attendanceCtx) {
            if (charts.attendance) charts.attendance.destroy();
            charts.attendance = new Chart(attendanceCtx, {
                type: 'bar',
                data: {
                    labels: ['周一', '周二', '周三', '周四', '周五'],
                    datasets: [{
                        label: '出勤率',
                        data: [95, 92, 98, 96, 94],
                        backgroundColor: 'rgba(24, 144, 255, 0.8)',
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(24, 144, 255, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 80,
                            max: 100,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        if (departmentCtx) {
            if (charts.department) charts.department.destroy();
            charts.department = new Chart(departmentCtx, {
                type: 'doughnut',
                data: {
                    labels: ['技术部', '产品部', '市场部', '人事部'],
                    datasets: [{
                        data: [25, 12, 8, 5],
                        backgroundColor: [
                            '#1890ff',
                            '#52c41a',
                            '#faad14',
                            '#722ed1'
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
                        },
                        tooltip: {
                            backgroundColor: 'rgba(24, 144, 255, 0.9)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            cornerRadius: 8
                        }
                    }
                }
            });
        }
    },

    startRefresh() {
        refreshInterval = setInterval(async () => {
            await this.loadData();
        }, 30000);
    },

    destroy() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        Object.values(charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        charts = {};
    }
};

export default dashboardModule;
