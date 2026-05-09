import API from '../api.js';

const exportModule = {
    async render(container) {
        container.innerHTML = `
            <div class="export-container">
                <div class="page-header">
                    <h2>📤 数据导出中心</h2>
                    <p>导出各类报表和数据，支持多种格式</p>
                </div>

                <div class="content-grid">
                    <div class="card">
                        <div class="card-header">
                            <h3>📋 导出模板</h3>
                        </div>
                        <div class="card-body">
                            <div class="export-templates" id="exportTemplates">
                                <div class="template-item" data-template="employee">
                                    <div class="template-icon">👤</div>
                                    <div class="template-info">
                                        <h4>员工花名册</h4>
                                        <p>导出所有员工的详细信息</p>
                                    </div>
                                    <div class="template-actions">
                                        <select class="format-select">
                                            <option value="csv">CSV</option>
                                            <option value="xlsx">Excel</option>
                                            <option value="json">JSON</option>
                                        </select>
                                        <button class="btn-primary btn-sm export-btn">导出</button>
                                    </div>
                                </div>

                                <div class="template-item" data-template="attendance">
                                    <div class="template-icon">📅</div>
                                    <div class="template-info">
                                        <h4>考勤月报</h4>
                                        <p>导出月度考勤统计数据</p>
                                    </div>
                                    <div class="template-actions">
                                        <input type="month" id="attendanceMonth" class="form-control" style="width: 140px; margin-right: 8px;" value="${new Date().toISOString().slice(0, 7)}">
                                        <select class="format-select">
                                            <option value="csv">CSV</option>
                                            <option value="xlsx">Excel</option>
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
                                            <option value="csv">CSV</option>
                                            <option value="xlsx">Excel</option>
                                            <option value="json">JSON</option>
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
                                            <option value="csv">CSV</option>
                                            <option value="xlsx">Excel</option>
                                            <option value="json">JSON</option>
                                        </select>
                                        <button class="btn-primary btn-sm export-btn">导出</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                                    <option value="csv">CSV (.csv)</option>
                                    <option value="xlsx">Excel (.xlsx)</option>
                                    <option value="json">JSON (.json)</option>
                                </select>
                            </div>

                            <button class="btn-primary btn-block" id="customExportBtn">
                                <span>📤</span> 开始导出
                            </button>
                        </div>
                    </div>

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
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container = container;
        this.history = this.loadHistory();
        this.renderHistory();
        this.bindEvents();
    },

    bindEvents() {
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateItem = e.target.closest('.template-item');
                const template = templateItem.dataset.template;
                const formatSelect = templateItem.querySelector('.format-select');
                const format = formatSelect ? formatSelect.value : 'csv';
                this.exportTemplate(template, format, templateItem);
            });
        });

        document.getElementById('customExportBtn')?.addEventListener('click', () => {
            this.exportCustom();
        });

        document.getElementById('customModule')?.addEventListener('change', (e) => {
            this.updateFields(e.target.value);
        });
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

    async exportTemplate(template, format, templateItem) {
        const templateNames = {
            employee: '员工花名册',
            attendance: '考勤月报',
            performance: '绩效报表',
            recruitment: '招聘报表'
        };

        const btn = templateItem?.querySelector('.export-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '导出中...';
        }

        try {
            let data, filename;

            switch (template) {
                case 'employee':
                    data = await this.exportEmployeeData();
                    filename = `员工花名册_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
                    break;
                case 'attendance':
                    const monthInput = document.getElementById('attendanceMonth');
                    const month = monthInput ? monthInput.value : new Date().toISOString().slice(0, 7);
                    data = await this.exportAttendanceData(month);
                    filename = `考勤月报_${month.replace('-', '')}`;
                    break;
                case 'performance':
                    data = await this.exportPerformanceData();
                    filename = `绩效报表_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
                    break;
                case 'recruitment':
                    data = await this.exportRecruitmentData();
                    filename = `招聘报表_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
                    break;
                default:
                    throw new Error('不支持的导出类型');
            }

            this.downloadFile(data, filename, format);
            this.addToHistory(`${filename}.${format}`, template, format);
            this.showNotification('导出成功', 'success');

        } catch (error) {
            console.error('[Export] Export error:', error);
            this.showNotification('导出失败: ' + error.message, 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '导出';
            }
        }
    },

    async exportEmployeeData() {
        const res = await API.getEmployees();
        const employees = res.data || [];

        const headers = ['工号', '姓名', '性别', '部门', '岗位', '入职日期', '手机号', '邮箱', '状态'];
        const rows = employees.map(emp => [
            emp.employee_no || '',
            emp.name || '',
            emp.gender === 'male' ? '男' : emp.gender === 'female' ? '女' : '',
            emp.department_name || '',
            emp.position_name || '',
            emp.hire_date || '',
            emp.phone || '',
            emp.email || '',
            emp.status === 1 ? '在职' : '离职'
        ]);

        return { headers, rows };
    },

    async exportAttendanceData(month) {
        const res = await API.getAttendanceSummary(month);
        const attendance = res.data || [];

        const headers = ['工号', '姓名', '部门', '出勤天数', '迟到次数', '早退次数', '请假天数'];
        const rows = attendance.map(att => [
            att.employeeId || '',
            att.employeeName || '',
            att.department || '',
            att.attendanceDays || 0,
            att.lateCount || 0,
            att.earlyLeaveCount || 0,
            att.leaveDays || 0
        ]);

        return { headers, rows };
    },

    async exportPerformanceData() {
        const res = await API.getPerformanceEvaluations();
        const evaluations = res.data || [];

        const headers = ['员工姓名', '考核计划', '部门', '岗位', '自评分数', '自评状态', '上级评分', '上级状态', '最终分数', '等级'];
        const rows = evaluations.map(ev => [
            ev.employeeName || '',
            ev.planName || '',
            ev.department || '',
            ev.position || '',
            ev.selfScore || '',
            ev.selfStatus || '',
            ev.leaderScore || '',
            ev.leaderStatus || '',
            ev.finalScore || '',
            ev.grade || ''
        ]);

        return { headers, rows };
    },

    async exportRecruitmentData() {
        const res = await API.getRecruitmentStats();
        const stats = res.data || [];

        const headers = ['职位', '部门', '招聘需求', '已面试', '待面试', '录用人数'];
        const rows = stats.map(s => [
            s.position || '',
            s.department || '',
            s.required || 0,
            s.interviewed || 0,
            s.pending || 0,
            s.offered || 0
        ]);

        return { headers, rows };
    },

    async exportCustom() {
        const module = document.getElementById('customModule')?.value;
        const format = document.getElementById('customFormat')?.value;
        const startDate = document.getElementById('exportStartDate')?.value;
        const endDate = document.getElementById('exportEndDate')?.value;

        const moduleNames = {
            employee: '员工管理',
            attendance: '考勤管理',
            performance: '绩效考核',
            recruitment: '招聘管理',
            training: '培训管理'
        };

        this.showNotification('自定义导出功能开发中...', 'info');
    },

    downloadFile(data, filename, format) {
        if (format === 'json') {
            const jsonStr = JSON.stringify(data.rows || [], null, 2);
            this.downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `${filename}.json`);
        } else if (format === 'csv') {
            const csvContent = this.generateCSV(data.headers, data.rows);
            this.downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
        } else if (format === 'xlsx') {
            const csvContent = this.generateCSV(data.headers, data.rows);
            this.downloadBlob(new Blob(['\uFEFF' + csvContent], { type: 'application/vnd.ms-excel' }), `${filename}.xls`);
        }
    },

    generateCSV(headers, rows) {
        const headerLine = headers.join(',');
        const dataLines = rows.map(row =>
            row.map(cell => {
                const str = String(cell || '');
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',')
        );
        return [headerLine, ...dataLines].join('\n');
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    addToHistory(fileName, module, format) {
        const historyItem = {
            fileName,
            module,
            format,
            time: new Date().toLocaleString('zh-CN'),
            status: 'success'
        };

        this.history.unshift(historyItem);
        if (this.history.length > 10) {
            this.history = this.history.slice(0, 10);
        }
        this.saveHistory();
        this.renderHistory();
    },

    loadHistory() {
        try {
            const saved = localStorage.getItem('exportHistory');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    },

    saveHistory() {
        try {
            localStorage.setItem('exportHistory', JSON.stringify(this.history));
        } catch (e) {
            console.warn('[Export] Failed to save history:', e);
        }
    },

    renderHistory() {
        const tbody = document.getElementById('exportHistoryBody');
        if (!tbody) return;

        if (this.history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #8ba9c4;">暂无导出记录</td></tr>';
            return;
        }

        const formatNames = { csv: 'CSV', xlsx: 'Excel', json: 'JSON', pdf: 'PDF' };
        const moduleNames = {
            employee: '员工管理',
            attendance: '考勤管理',
            performance: '绩效考核',
            recruitment: '招聘管理',
            training: '培训管理'
        };

        tbody.innerHTML = this.history.map(item => `
            <tr>
                <td>${item.fileName}</td>
                <td>${moduleNames[item.module] || item.module}</td>
                <td>${formatNames[item.format] || item.format}</td>
                <td>${item.time}</td>
                <td><span class="status-badge status-success">完成</span></td>
                <td><button class="btn-link btn-sm" disabled>下载</button></td>
            </tr>
        `).join('');
    },

    showNotification(message, type = 'info') {
        const existing = document.querySelector('.export-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type} export-notification`;
        notification.textContent = message;
        notification.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999;';
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }
};

export default exportModule;