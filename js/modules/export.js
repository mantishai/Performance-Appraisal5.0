/**
 * 导出中心模块
 * Module 19: 导出中心
 */

const ExportModule = {
    name: 'export',
    title: '导出中心',
    
    async init() {
        console.log('[Export] 初始化导出中心模块');
        this.render();
        this.loadTemplates();
        this.loadHistory();
    },
    
    render() {
        const content = document.getElementById('content');
        content.innerHTML = `
            <div class="export-container">
                <div class="page-header">
                    <h2>📤 数据导出中心</h2>
                    <p>导出各类报表和数据，支持多种格式</p>
                </div>
                
                <div class="content-grid">
                    <!-- 导出模板区域 -->
                    <div class="card">
                        <div class="card-header">
                            <h3>📋 导出模板</h3>
                        </div>
                        <div class="card-body">
                            <div class="export-templates" id="exportTemplates">
                                <div class="template-item" data-template="employee">
                                    <div class="template-icon">👤</div>
                                    <div class="template-info">
                                        <h4>员工信息表</h4>
                                        <p>导出所有员工的详细信息</p>
                                    </div>
                                    <div class="template-actions">
                                        <select class="format-select">
                                            <option value="xlsx">Excel</option>
                                            <option value="csv">CSV</option>
                                            <option value="pdf">PDF</option>
                                        </select>
                                        <button class="btn-primary btn-sm export-btn">导出</button>
                                    </div>
                                </div>
                                
                                <div class="template-item" data-template="attendance">
                                    <div class="template-icon">📅</div>
                                    <div class="template-info">
                                        <h4>考勤报表</h4>
                                        <p>导出月度/季度考勤数据</p>
                                    </div>
                                    <div class="template-actions">
                                        <select class="format-select">
                                            <option value="xlsx">Excel</option>
                                            <option value="csv">CSV</option>
                                            <option value="pdf">PDF</option>
                                        </select>
                                        <button class="btn-primary btn-sm export-btn">导出</button>
                                    </div>
                                </div>
                                
                                <div class="template-item" data-template="performance">
                                    <div class="template-icon">📈</div>
                                    <div class="template-info">
                                        <h4>绩效报表</h4>
                                        <p>导出绩效考核结果</p>
                                    </div>
                                    <div class="template-actions">
                                        <select class="format-select">
                                            <option value="xlsx">Excel</option>
                                            <option value="csv">CSV</option>
                                            <option value="pdf">PDF</option>
                                        </select>
                                        <button class="btn-primary btn-sm export-btn">导出</button>
                                    </div>
                                </div>
                                
                                <div class="template-item" data-template="recruitment">
                                    <div class="template-icon">📝</div>
                                    <div class="template-info">
                                        <h4>招聘报表</h4>
                                        <p>导出招聘统计数据</p>
                                    </div>
                                    <div class="template-actions">
                                        <select class="format-select">
                                            <option value="xlsx">Excel</option>
                                            <option value="csv">CSV</option>
                                            <option value="pdf">PDF</option>
                                        </select>
                                        <button class="btn-primary btn-sm export-btn">导出</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 自定义导出 -->
                    <div class="card">
                        <div class="card-header">
                            <h3>🔧 自定义导出</h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>选择模块</label>
                                <select id="customModule">
                                    <option value="employee">员工管理</option>
                                    <option value="attendance">考勤管理</option>
                                    <option value="performance">绩效考核</option>
                                    <option value="recruitment">招聘管理</option>
                                    <option value="training">培训管理</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>选择字段</label>
                                <div class="field-checkboxes" id="fieldCheckboxes">
                                    <label><input type="checkbox" checked> 基本信息</label>
                                    <label><input type="checkbox" checked> 联系方式</label>
                                    <label><input type="checkbox" checked> 工作信息</label>
                                    <label><input type="checkbox"> 薪酬信息</label>
                                    <label><input type="checkbox"> 合同信息</label>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>开始日期</label>
                                    <input type="date" id="exportStartDate">
                                </div>
                                <div class="form-group">
                                    <label>结束日期</label>
                                    <input type="date" id="exportEndDate">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>导出格式</label>
                                <select id="customFormat">
                                    <option value="xlsx">Excel (.xlsx)</option>
                                    <option value="csv">CSV (.csv)</option>
                                    <option value="pdf">PDF (.pdf)</option>
                                    <option value="json">JSON (.json)</option>
                                </select>
                            </div>
                            
                            <button class="btn-primary btn-block" id="customExportBtn">
                                <span>📤</span> 开始导出
                            </button>
                        </div>
                    </div>
                    
                    <!-- 导出历史 -->
                    <div class="card card-full">
                        <div class="card-header">
                            <h3>📜 导出历史</h3>
                        </div>
                        <div class="card-body">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>文件名</th>
                                        <th>模块</th>
                                        <th>格式</th>
                                        <th>导出时间</th>
                                        <th>状态</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody id="exportHistoryBody">
                                    <tr>
                                        <td>员工信息表_20250501.xlsx</td>
                                        <td>员工管理</td>
                                        <td>Excel</td>
                                        <td>2025-05-01 10:30:00</td>
                                        <td><span class="status-badge status-success">完成</span></td>
                                        <td>
                                            <button class="btn-link btn-sm">下载</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>考勤报表_202504.xlsx</td>
                                        <td>考勤管理</td>
                                        <td>Excel</td>
                                        <td>2025-05-01 09:15:00</td>
                                        <td><span class="status-badge status-success">完成</span></td>
                                        <td>
                                            <button class="btn-link btn-sm">下载</button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>招聘统计_2025Q1.pdf</td>
                                        <td>招聘管理</td>
                                        <td>PDF</td>
                                        <td>2025-04-01 14:20:00</td>
                                        <td><span class="status-badge status-success">完成</span></td>
                                        <td>
                                            <button class="btn-link btn-sm">下载</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.bindEvents();
    },
    
    bindEvents() {
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = e.target.closest('.template-item').dataset.template;
                const format = e.target.closest('.template-item').querySelector('.format-select').value;
                this.exportTemplate(template, format);
            });
        });
        
        document.getElementById('customExportBtn')?.addEventListener('click', () => {
            this.exportCustom();
        });
        
        document.getElementById('customModule')?.addEventListener('change', (e) => {
            this.updateFields(e.target.value);
        });
    },
    
    loadTemplates() {
        console.log('[Export] 加载导出模板');
    },
    
    loadHistory() {
        console.log('[Export] 加载导出历史');
    },
    
    updateFields(module) {
        const fields = {
            employee: ['基本信息', '联系方式', '工作信息', '薪酬信息', '合同信息'],
            attendance: ['考勤记录', '请假记录', '加班记录', '统计汇总'],
            performance: ['考核周期', '自评分数', '上级评分', '最终结果', '评语'],
            recruitment: ['职位信息', '候选人信息', '面试记录', 'Offer记录', '入职记录'],
            training: ['课程信息', '学员信息', '培训记录', '考核结果']
        };
        
        const container = document.getElementById('fieldCheckboxes');
        if (container) {
            container.innerHTML = (fields[module] || fields.employee).map(field => 
                `<label><input type="checkbox" checked> ${field}</label>`
            ).join('');
        }
    },
    
    exportTemplate(template, format) {
        const templateNames = {
            employee: '员工信息表',
            attendance: '考勤报表',
            performance: '绩效报表',
            recruitment: '招聘报表'
        };
        
        const fileName = `${templateNames[template]}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${format}`;
        
        this.showNotification(`开始导出: ${fileName}`, 'info');
        
        setTimeout(() => {
            this.showNotification(`导出成功: ${fileName}`, 'success');
            this.addToHistory(fileName, template, format);
        }, 1500);
    },
    
    exportCustom() {
        const module = document.getElementById('customModule').value;
        const format = document.getElementById('customFormat').value;
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        
        const moduleNames = {
            employee: '员工管理',
            attendance: '考勤管理',
            performance: '绩效考核',
            recruitment: '招聘管理',
            training: '培训管理'
        };
        
        const fileName = `自定义导出_${moduleNames[module]}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${format}`;
        
        this.showNotification(`开始导出: ${fileName}`, 'info');
        
        setTimeout(() => {
            this.showNotification(`导出成功: ${fileName}`, 'success');
            this.addToHistory(fileName, module, format);
        }, 2000);
    },
    
    addToHistory(fileName, module, format) {
        const tbody = document.getElementById('exportHistoryBody');
        if (!tbody) return;
        
        const moduleNames = {
            employee: '员工管理',
            attendance: '考勤管理',
            performance: '绩效考核',
            recruitment: '招聘管理',
            training: '培训管理'
        };
        
        const formatNames = {
            xlsx: 'Excel',
            csv: 'CSV',
            pdf: 'PDF',
            json: 'JSON'
        };
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${fileName}</td>
            <td>${moduleNames[module] || module}</td>
            <td>${formatNames[format] || format}</td>
            <td>${new Date().toLocaleString('zh-CN')}</td>
            <td><span class="status-badge status-success">完成</span></td>
            <td>
                <button class="btn-link btn-sm">下载</button>
            </td>
        `;
        
        tbody.insertBefore(newRow, tbody.firstChild);
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
    window.ExportModule = ExportModule;
}

console.log('[Module] 导出中心模块已加载');
