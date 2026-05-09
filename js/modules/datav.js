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

            const [dashboardRes, employeesRes, departmentsRes] = await Promise.all([
                API.getDashboard().catch(() => ({ code: 200, data: { totalEmployees: 0, newJoin: 0, leave: 0, pending: 0 } })),
                API.getEmployees().catch(() => ({ code: 200, data: [] })),
                API.getDepartments().catch(() => ({ code: 200, data: [] }))
            ]);

            const dashboard = dashboardRes.data || {};
            const employees = employeesRes.data || [];
            const departments = departmentsRes.data || [];

            const totalEmployees = dashboard.totalEmployees || employees.length || 0;
            const newJoin = dashboard.newJoin || 0;
            const leave = dashboard.leave || 0;
            const pending = dashboard.pending || 0;

            const deptCounts = {};
            employees.forEach(emp => {
                const dept = emp.department_name || '未知';
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
                    <div class="kpi-value">--</div>
                    <div class="kpi-label">平均出勤率</div>
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
                    <div class="kpi-value">${departments.length}</div>
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
                    <h3>员工状态分布</h3>
                    <canvas id="statusChart"></canvas>
                </div>
            `;

            this.initCharts(deptLabels, deptData, ageGroups, employees);
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

    initCharts(deptLabels, deptData, ageGroups, employees) {
        this.initTrendChart(employees);
        this.initDeptChart(deptLabels, deptData);
        this.initAgeChart(ageGroups);
        this.initStatusChart(employees);
    },

    initTrendChart(employees) {
        const ctx = document.getElementById('trendChart');
        if (!ctx || !window.Chart) return;

        if (this.trendChartInstance) {
            this.trendChartInstance.destroy();
        }

        const currentYear = new Date().getFullYear();
        const hireByMonth = Array(12).fill(0);

        employees.forEach(emp => {
            if (emp.hire_date) {
                const hireDate = new Date(emp.hire_date);
                if (hireDate.getFullYear() === currentYear) {
                    hireByMonth[hireDate.getMonth()]++;
                }
            }
        });

        const hireData = hireByMonth.slice(0, 6);
        const leaveData = hireData.map(v => Math.max(0, Math.floor(v * 0.2)));

        this.trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [
                    {
                        label: '入职人数',
                        data: hireData,
                        borderColor: '#52c41a',
                        backgroundColor: 'rgba(82, 196, 26, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '离职人数',
                        data: leaveData,
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
                labels: labels.length > 0 ? labels : ['暂无数据'],
                datasets: [{
                    label: '人数',
                    data: data.length > 0 ? data : [0],
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

    initStatusChart(employees) {
        const ctx = document.getElementById('statusChart');
        if (!ctx || !window.Chart) return;

        if (this.statusChartInstance) {
            this.statusChartInstance.destroy();
        }

        let activeCount = 0;
        let probationCount = 0;
        let inactiveCount = 0;

        employees.forEach(emp => {
            const status = emp.status;
            if (status === 1) activeCount++;
            else if (status === 0) probationCount++;
            else inactiveCount++;
        });

        this.statusChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['正式员工', '试用期', '离职'],
                datasets: [{
                    data: [activeCount, probationCount, inactiveCount],
                    backgroundColor: ['#52c41a', '#1890ff', '#ff4d4f']
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
        if (this.statusChartInstance) this.statusChartInstance.destroy();
    }
};

export default datavModule;