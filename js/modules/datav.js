/**
 * 数据大屏模块
 * Module 18: 数据大屏
 */

const DataVModule = {
    name: 'datav',
    title: '数据大屏',
    
    async init() {
        console.log('[DataV] 初始化数据大屏模块');
        this.render();
        this.initCharts();
        this.startAutoRefresh();
    },
    
    render() {
        const content = document.getElementById('content');
        content.innerHTML = `
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
                
                <div class="datav-grid">
                    <!-- KPI卡片 -->
                    <div class="kpi-card">
                        <div class="kpi-icon">👥</div>
                        <div class="kpi-value">1,250</div>
                        <div class="kpi-label">总员工数</div>
                        <div class="kpi-trend up">+3.5% 本月</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">📋</div>
                        <div class="kpi-value">45</div>
                        <div class="kpi-label">本月入职</div>
                        <div class="kpi-trend up">+8.2% 较上月</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">👋</div>
                        <div class="kpi-value">12</div>
                        <div class="kpi-label">本月离职</div>
                        <div class="kpi-trend down">-2.1% 较上月</div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon">⏰</div>
                        <div class="kpi-value">98.5%</div>
                        <div class="kpi-label">平均出勤率</div>
                        <div class="kpi-trend up">+0.8%</div>
                    </div>
                    
                    <!-- 图表区域 -->
                    <div class="chart-card">
                        <h3>人员流动趋势</h3>
                        <canvas id="trendChart"></canvas>
                    </div>
                    
                    <div class="chart-card">
                        <h3>部门人数分布</h3>
                        <canvas id="deptChart"></canvas>
                    </div>
                    
                    <div class="chart-card">
                        <h3>年龄结构分析</h3>
                        <canvas id="ageChart"></canvas>
                    </div>
                    
                    <div class="chart-card">
                        <h3>职位层级分布</h3>
                        <canvas id="levelChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents() {
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.refreshData();
        });
        
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });
    },
    
    initCharts() {
        this.initTrendChart();
        this.initDeptChart();
        this.initAgeChart();
        this.initLevelChart();
    },
    
    initTrendChart() {
        const ctx = document.getElementById('trendChart')?.getContext('2d');
        if (!ctx || !window.Chart) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [
                    {
                        label: '入职人数',
                        data: [35, 42, 38, 45, 48, 45],
                        borderColor: '#52c41a',
                        backgroundColor: 'rgba(82, 196, 26, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '离职人数',
                        data: [15, 12, 18, 14, 12, 13],
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
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    },
    
    initDeptChart() {
        const ctx = document.getElementById('deptChart')?.getContext('2d');
        if (!ctx || !window.Chart) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['技术部', '产品部', '市场部', '销售部', '人事部', '财务部'],
                datasets: [{
                    label: '人数',
                    data: [320, 85, 120, 450, 60, 45],
                    backgroundColor: [
                        '#1890ff',
                        '#52c41a',
                        '#faad14',
                        '#ff4d4f',
                        '#722ed1',
                        '#13c2c2'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    },
    
    initAgeChart() {
        const ctx = document.getElementById('ageChart')?.getContext('2d');
        if (!ctx || !window.Chart) return;
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['20-30岁', '31-40岁', '41-50岁', '50岁以上'],
                datasets: [{
                    data: [620, 450, 150, 30],
                    backgroundColor: [
                        '#1890ff',
                        '#52c41a',
                        '#faad14',
                        '#ff4d4f'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },
    
    initLevelChart() {
        const ctx = document.getElementById('levelChart')?.getContext('2d');
        if (!ctx || !window.Chart) return;
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['实习生', '专员', '主管', '经理', '总监', 'VP'],
                datasets: [{
                    label: '人数',
                    data: [80, 520, 320, 200, 100, 30],
                    backgroundColor: 'rgba(24, 144, 255, 0.2)',
                    borderColor: '#1890ff',
                    pointBackgroundColor: '#1890ff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    },
    
    refreshData() {
        console.log('[DataV] 刷新数据');
        this.initCharts();
        this.showNotification('数据刷新成功', 'success');
    },
    
    toggleFullscreen() {
        const container = document.getElementById('datavContainer');
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('[DataV] 全屏请求失败:', err);
            });
        } else {
            document.exitFullscreen();
        }
    },
    
    startAutoRefresh() {
        setInterval(() => {
            console.log('[DataV] 自动刷新数据');
        }, 300000); // 5分钟
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

if (typeof window !== 'undefined') {
    window.DataVModule = DataVModule;
}

console.log('[Module] 数据大屏模块已加载');
