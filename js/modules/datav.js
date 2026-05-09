import API from '../api.js';

const datavModule = {
    async render(container) {
        container.innerHTML = `
            <div class="datav-container" id="datavContainer">
                <div class="datav-header">
                    <h1>🚀 人力资源数据驾驶舱</h1>
                    <div class="datav-controls">
                        <button class="btn-primary" id="refreshBtn">
                            <span>🔄</span> 刷新数据
                        </button>
                        <button class="btn-secondary" id="fullscreenBtn">
                            <span>⛶</span> 全屏显示
                        </button>
                    </div>
                </div>

                <div class="datav-grid" id="datavGrid">
                    <div class="loading-overlay">
                        <div class="loading-spinner"></div>
                        <div class="loading-text">加载中...</div>
                    </div>
                </div>
            </div>
        `;

        this.container = container;
        this.bindEvents();
        await this.loadData();
    },

    async loadData() {
        try {
            const grid = document.getElementById('datavGrid');
            if (!grid) return;

            const [dashboardRes, employeesRes, attendanceRes, deptRes] = await Promise.all([
                API.getDashboard().catch(() => ({ code: 200, data: { totalEmployees: 0, newJoin: 0, leave: 0, pending: 0 } })),
                API.getEmployees().catch(() => ({ code: 200, data: [] })),
                API.getAttendanceSummary().catch(() => ({ code: 200, data: [] })),
                this.fetchDepartmentStats().catch(() => [])
            ]);

            const dashboard = dashboardRes.data || {};
            const employees = employeesRes.data || [];
            const attendance = attendanceRes.data || [];
            const deptStats = deptRes;

            const totalEmployees = dashboard.totalEmployees || employees.length || 0;
            const newJoin = dashboard.newJoin || 0;
            const leave = dashboard.leave || 0;
            const pending = dashboard.pending || 0;

            const avgAttendance = attendance.length > 0
                ? Math.round(attendance.reduce((sum, a) => sum + (a.attendanceDays || 0), 0) / attendance.length)
                : 0;

            const deptNames = {};
            const deptCounts = {};
            employees.forEach(emp => {
                const dept = emp.department_name || '未知';
                deptNames[dept] = true;
                deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            });

            const deptLabels = Object.keys(deptCounts);
            const deptData = Object.values(deptCounts);

            const ageGroups = { '20-30': 0, '31-40': 0, '41-50': 0, '50+': 0 };
            employees.forEach(emp => {
                if (emp.birth_date) {
                    const birth = new Date(emp.birth_date);
                    const age = Math.floor((new Date() - birth) / (365.25 * 24 * 60 * 60 * 1000));
                    if (age < 30) ageGroups['20-30']++;
                    else if (age < 40) ageGroups['31-40']++;
                    else if (age < 50) ageGroups['41-50']++;
                    else ageGroups['50+']++;
                }
            });

            grid.innerHTML = `
                <div class="kpi-card">
                    <div class="kpi-icon">👥</div>
                    <div class="kpi-value">${totalEmployees}</div>
                    <div class="kpi-label">总员工数</div>
                    <div class="kpi-trend up">+${newJoin} 本月入职</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon">📋</div>
                    <div class="kpi-value">${newJoin}</div>
                    <div class="kpi-label">本月入职</div>
                    <div class="kpi-trend up">新加入</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon">👋</div>
                    <div class="kpi-value">${leave}</div>
                    <div class="kpi-label">今日请假</div>
                    <div class="kpi-trend down">在职 ${totalEmployees - leave}</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon">⏰</div>
                    <div class="kpi-value">${avgAttendance}</div>
                    <div class="kpi-label">平均出勤天数</div>
                    <div class="kpi-trend up">本月</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon">📝</div>
                    <div class="kpi-value">${pending}</div>
                    <div class="kpi-label">待审批</div>
                    <div class="kpi-trend">需处理</div>
                </div>

                <div class="kpi-card">
                    <div class="kpi-icon">🏢</div>
                    <div class="kpi-value">${deptLabels.length}</div>
                    <div class="kpi-label">部门数量</div>
                    <div class="kpi-trend up">正常运转</div>
                </div>

                <div class="chart-card" style="grid-column: span 2;">
                    <h3>人员流动趋势</h3>
                    <canvas id="trendChart"></canvas>
                </div>

                <div class="chart-card" style="grid-column: span 2;">
                    <h3>部门人数分布</h3>
                    <canvas id="deptChart"></canvas>
                </div>

                <div class="chart-card" style="grid-column: span 2;">
                    <h3>年龄结构分析</h3>
                    <canvas id="ageChart"></canvas>
                </div>

                <div class="chart-card" style="grid-column: span 2;">
                    <h3>考勤状态分布</h3>
                    <canvas id="attendanceChart"></canvas>
                </div>
            `;

            this.initCharts(deptLabels, deptData, ageGroups, attendance);
            this.bindEvents();

        } catch (error) {
            console.error('[DataV] Load data error:', error);
            const grid = document.getElementById('datavGrid');
            if (grid) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📺</div>
                        <div class="empty-text">数据加载失败，请刷新重试</div>
                    </div>
                `;
            }
        }
    },

    async fetchDepartmentStats() {
        try {
            const res = await fetch('/api/departments');
            const data = await res.json();
            return data.data || [];
        } catch {
            return [];
        }
    },

    initCharts(deptLabels, deptData, ageGroups, attendance) {
        this.initTrendChart();
        this.initDeptChart(deptLabels, deptData);
        this.initAgeChart(ageGroups);
        this.initAttendanceChart(attendance);
    },

    initTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx || !window.Chart) return;

        if (this.trendChartInstance) {
            this.trendChartInstance.destroy();
        }

        this.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [
                    {
                        label: '入职人数',
                        data: [12, 15, 8, 18, 22, 15],
                        borderColor: '#52c41a',
                        backgroundColor: 'rgba(82, 196, 26, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '离职人数',
                        data: [5, 3, 6, 4, 8, 6],
                        borderColor: '#ff4d4f',
                        backgroundColor: 'rgba(255, 77, 79, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                }
            }
        });
    },

    initDeptChart(labels, data) {
        const ctx = document.getElementById('deptChart');
        if (!ctx || !window.Chart) return;

        if (this.deptChartInstance) {
            this.deptChartInstance.destroy();
        }

        const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#52c41a'];

        this.deptChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['技术部', '产品部', '市场部', '销售部'],
                datasets: [{
                    label: '人数',
                    data: data.length > 0 ? data : [10, 5, 8, 12],
                    backgroundColor: labels.map((_, i) => colors[i % colors.length])
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    },

    initAgeChart(ageGroups) {
        const ctx = document.getElementById('ageChart');
        if (!ctx || !window.Chart) return;

        if (this.ageChartInstance) {
            this.ageChartInstance.destroy();
        }

        const groups = ageGroups || { '20-30': 0, '31-40': 0, '41-50': 0, '50+': 0 };

        this.ageChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['20-30岁', '31-40岁', '41-50岁', '50岁以上'],
                datasets: [{
                    data: [groups['20-30'], groups['31-40'], groups['41-50'], groups['50+']],
                    backgroundColor: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    initAttendanceChart(attendance) {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx || !window.Chart) return;

        if (this.attendanceChartInstance) {
            this.attendanceChartInstance.destroy();
        }

        let lateCount = 0;
        let earlyCount = 0;
        let normalCount = 0;

        if (Array.isArray(attendance) && attendance.length > 0) {
            attendance.forEach(a => {
                if (a.lateCount > 0) lateCount += a.lateCount;
                if (a.earlyLeaveCount > 0) earlyCount += a.earlyLeaveCount;
                if (a.attendanceDays > 0) normalCount += a.attendanceDays;
            });
        } else {
            normalCount = 100;
        }

        this.attendanceChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['正常', '迟到', '早退'],
                datasets: [{
                    data: [normalCount, lateCount || 5, earlyCount || 3],
                    backgroundColor: ['#52c41a', '#ff4d4f', '#faad14']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },

    bindEvents() {
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                refreshBtn.classList.add('spinning');
                this.loadData().finally(() => {
                    setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
                });
            });
        }

        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
    },

    toggleFullscreen() {
        const container = document.getElementById('datavContainer');
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('[DataV] Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    },

    destroy() {
        if (this.trendChartInstance) this.trendChartInstance.destroy();
        if (this.deptChartInstance) this.deptChartInstance.destroy();
        if (this.ageChartInstance) this.ageChartInstance.destroy();
        if (this.attendanceChartInstance) this.attendanceChartInstance.destroy();
    }
};

export default datavModule;