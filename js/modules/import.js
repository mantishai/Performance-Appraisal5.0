import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    currentTab: 'import',
    importType: 'employee',
    uploadFile: null,
    previewData: null,
    fieldMapping: {},
    importOption: 'skip',
    importRecords: [],
    reportFields: {},
    reportTemplate: null,
    reportTemplates: [],
    chartType: 'table',
    selectedFields: [],
    filters: [],
    sortField: null,
    sortOrder: 'asc',
    reportPreviewData: [],
    archiveTables: [],
    archiveRecords: [],
    selectedTable: null,
    archiveStartDate: '',
    archiveEndDate: ''
};

const importModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderStats() + Skeleton.renderCard() + Skeleton.renderTable(4, 7);
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [recordsRes, fieldsRes, templatesRes, tablesRes, archiveRecordsRes] = await Promise.all([
                API.getImportRecords(),
                API.getReportFields(),
                API.getReportTemplates(),
                API.getArchiveTables(),
                API.getArchiveRecords()
            ]);
            if (recordsRes.code === 200) state.importRecords = recordsRes.data || [];
            if (fieldsRes.code === 200) state.reportFields = fieldsRes.data || {};
            if (templatesRes.code === 200) state.reportTemplates = templatesRes.data || [];
            if (tablesRes.code === 200) state.archiveTables = tablesRes.data || [];
            if (archiveRecordsRes.code === 200) state.archiveRecords = archiveRecordsRes.data || [];
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    },

    renderContent(container) {
        const typeTexts = { employee: '员工信息', attendance: '考勤数据', performance: '绩效数据' };
        const statusColors = { completed: 'active', processing: 'pending', failed: 'rejected' };
        const statusTexts = { completed: '已完成', processing: '处理中', failed: '失败' };
        const archiveStatusColors = { archived: 'active', restored: 'info' };
        const archiveStatusTexts = { archived: '已归档', restored: '已恢复' };

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">数据管理</h1>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'import' ? 'btn-primary' : 'btn-default'}" data-tab="import">📥 批量导入</button>
                    <button class="btn ${state.currentTab === 'report' ? 'btn-primary' : 'btn-default'}" data-tab="report">📊 自定义报表</button>
                    <button class="btn ${state.currentTab === 'archive' ? 'btn-primary' : 'btn-default'}" data-tab="archive">🗄️ 数据归档</button>
                </div>

                ${state.currentTab === 'import' ? this.renderImportTab(typeTexts, statusColors, statusTexts) : ''}
                ${state.currentTab === 'report' ? this.renderReportTab() : ''}
                ${state.currentTab === 'archive' ? this.renderArchiveTab(archiveStatusColors, archiveStatusTexts) : ''}
            </div>
        `;

        this.bindEvents(container);
    },

    renderImportTab(typeTexts, statusColors, statusTexts) {
        return `
            <div style="display: grid; grid-template-columns: 1fr; gap: 24px; margin-bottom: 24px;">
                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">📤 下载模板</div>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        ${Object.entries(typeTexts).map(([type, text]) => `
                            <button class="btn btn-default" data-action="download-template" data-type="${type}">
                                ${type === 'employee' ? '👤' : type === 'attendance' ? '📅' : '📊'} ${text}导入模板
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">📤 选择导入类型</div>
                    <div style="display: flex; gap: 12px;">
                        ${Object.entries(typeTexts).map(([type, text]) => `
                            <button class="btn ${state.importType === type ? 'btn-primary' : 'btn-default'}" data-action="select-type" data-type="${type}">
                                ${text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div style="border: 2px dashed rgba(24, 144, 255, 0.3); border-radius: 16px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s; position: relative;">
                <div style="font-size: 48px; margin-bottom: 16px;">📥</div>
                <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 8px;">点击或拖拽上传文件</div>
                <div style="color: #8ba9c4; font-size: 13px;">支持 Excel 格式 (.xlsx, .xls)</div>
                <div style="margin-top: 20px;">
                    <input type="file" id="importFile" accept=".xlsx,.xls" style="display: none;">
                    <button class="btn btn-primary" id="selectFileBtn">选择文件上传</button>
                </div>
                ${state.uploadFile ? `
                    <div style="margin-top: 16px; padding: 12px; background: rgba(36, 207, 245, 0.1); border-radius: 8px;">
                        <span style="font-size: 14px; color: #1a3a5c;">✅ 已选择: ${state.uploadFile.name}</span>
                    </div>
                ` : ''}
            </div>

            ${state.previewData ? `
                <div style="margin-top: 24px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">👁️ 数据预览</div>
                    <div style="display: flex; gap: 24px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 200px;">
                            <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px;">
                                <span style="color: #36cfc9;">📊</span> 总行数: ${state.previewData.totalCount}
                            </div>
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                            <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px;">
                                <span style="color: #52c41a;">✅</span> 有效行数: ${state.previewData.validCount}
                            </div>
                        </div>
                        <div style="flex: 1; min-width: 200px;">
                            <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px;">
                                <span style="color: #ff4d4f;">❌</span> 错误行数: ${state.previewData.errorCount}
                            </div>
                        </div>
                    </div>
                    <div class="table-container" style="max-height: 300px; overflow: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    ${Object.keys(state.previewData.previewData[0] || {}).map(key => `
                                        <th>${key}</th>
                                    `).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${state.previewData.previewData.slice(0, 10).map(row => `
                                    <tr>
                                        ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            ${state.previewData ? `
                <div style="margin-top: 24px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">⚙️ 导入选项</div>
                    <div style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
                        <label style="display: flex; gap: 8px; align-items: center;">
                            <input type="radio" name="importOption" value="skip" ${state.importOption === 'skip' ? 'checked' : ''}>
                            <span style="color: #1a3a5c;">跳过重复数据</span>
                        </label>
                        <label style="display: flex; gap: 8px; align-items: center;">
                            <input type="radio" name="importOption" value="overwrite" ${state.importOption === 'overwrite' ? 'checked' : ''}>
                            <span style="color: #1a3a5c;">覆盖重复数据</span>
                        </label>
                        <div style="margin-left: auto;">
                            <button class="btn btn-primary" id="executeImportBtn">
                                🚀 执行导入
                            </button>
                        </div>
                    </div>
                </div>
            ` : ''}

            <div style="margin-top: 32px;">
                <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">📜 导入记录</div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>文件名</th>
                                <th>类型</th>
                                <th>总数</th>
                                <th>成功</th>
                                <th>失败</th>
                                <th>导入人</th>
                                <th>时间</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.importRecords.map(record => `
                                <tr>
                                    <td><strong>${record.fileName}</strong></td>
                                    <td>${typeTexts[record.type] || record.type}</td>
                                    <td>${record.totalCount}</td>
                                    <td>${record.successCount}</td>
                                    <td>${record.failCount}</td>
                                    <td>${record.importBy}</td>
                                    <td>${record.importTime}</td>
                                    <td><span class="status-tag ${statusColors[record.status]}">${statusTexts[record.status]}</span></td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn" data-id="${record.id}" data-action="view-log">
                                                查看日志
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderReportTab() {
        const dataSourceTexts = { employee: '员工数据', attendance: '考勤数据', performance: '绩效数据' };
        const chartTypeTexts = { table: '表格', bar: '柱状图', pie: '饼图', line: '折线图' };

        return `
            <div style="display: grid; grid-template-columns: 250px 1fr 280px; gap: 24px;">
                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">📋 选择字段</div>
                    ${Object.entries(state.reportFields).map(([source, fields]) => `
                        <div style="margin-bottom: 16px;">
                            <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px; font-size: 14px;">
                                ${dataSourceTexts[source] || source}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${fields.map(field => `
                                    <label style="display: flex; gap: 8px; align-items: center; cursor: pointer; padding: 8px; border-radius: 4px; transition: background 0.3s;">
                                        <input type="checkbox" class="field-checkbox" data-field="${field.name}" data-source="${source}" ${state.selectedFields.includes(field.name) ? 'checked' : ''}>
                                        <span style="color: #1a3a5c; font-size: 13px;">${field.displayName}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div>
                    <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                        <select id="reportDataSource" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                            <option value="employee">员工数据</option>
                            <option value="attendance">考勤数据</option>
                            <option value="performance">绩效数据</option>
                        </select>
                        <select id="chartType" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                            ${Object.entries(chartTypeTexts).map(([value, text]) => `
                                <option value="${value}" ${state.chartType === value ? 'selected' : ''}>${text}</option>
                            `).join('')}
                        </select>
                        <div style="margin-left: auto; display: flex; gap: 12px;">
                            <button class="btn btn-default" id="saveTemplateBtn">💾 保存模板</button>
                            <button class="btn btn-primary" id="previewReportBtn">👁️ 预览报表</button>
                            <button class="btn btn-primary" id="exportReportBtn">📤 导出报表</button>
                        </div>
                    </div>

                    <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                        ${state.reportPreviewData.length > 0 ? `
                            <div class="table-container">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            ${Object.keys(state.reportPreviewData[0] || {}).map(key => `<th>${key}</th>`).join('')}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${state.reportPreviewData.map(row => `
                                            <tr>
                                                ${Object.values(row).map(value => `<td>${value}</td>`).join('')}
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div style="text-align: center; padding: 40px; color: #8ba9c4;">
                                请选择字段并点击预览
                            </div>
                        `}
                    </div>
                </div>

                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">⚙️ 报表配置</div>

                    <div style="margin-bottom: 24px;">
                        <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px; font-size: 14px;">筛选条件</div>
                        <div id="filtersList" style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                                <select id="filterField" style="flex: 1; padding: 6px 10px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                                    <option value="">选择字段</option>
                                </select>
                                <select id="filterOperator" style="padding: 6px 10px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                                    <option value="eq">等于</option>
                                    <option value="contain">包含</option>
                                    <option value="range">范围</option>
                                </select>
                                <input type="text" id="filterValue" placeholder="输入值" style="flex: 1; padding: 6px 10px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                                <button class="btn btn-default" id="addFilterBtn" style="padding: 6px 12px; font-size: 12px;">+ 添加</button>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px; font-size: 14px;">排序设置</div>
                        <div style="display: flex; gap: 12px;">
                            <select id="sortField" style="flex: 1; padding: 6px 10px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                                <option value="">无排序</option>
                            </select>
                            <select id="sortOrder" style="padding: 6px 10px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                                <option value="asc">升序</option>
                                <option value="desc">降序</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px; font-size: 14px;">📋 报表模板</div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${state.reportTemplates.length > 0 ? state.reportTemplates.map(template => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: white; border-radius: 8px;">
                                    <button class="btn btn-default" data-template-id="${template.id}" style="width: 100%; text-align: left;">
                                        📄 ${template.name}
                                    </button>
                                    <button class="action-btn" data-id="${template.id}" data-action="delete-template" style="margin-left: 8px;">删除</button>
                                </div>
                            `).join('') : `
                                <div style="text-align: center; color: #8ba9c4; padding: 16px;">暂无模板</div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderArchiveTab(archiveStatusColors, archiveStatusTexts) {
        return `
            <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                <div style="background: rgba(24, 144, 255, 0.03); padding: 20px; border-radius: 12px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">📦 归档设置</div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px; display: block;">选择数据表</label>
                            <select id="archiveTable" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                                <option value="">请选择</option>
                                ${state.archiveTables.map(table => `
                                    <option value="${table.tableName}" ${state.selectedTable === table.tableName ? 'selected' : ''}>
                                        ${table.displayName}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px; display: block;">开始日期</label>
                            <input type="date" id="archiveStartDate" value="${state.archiveStartDate}" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                        </div>
                        <div>
                            <label style="font-weight: 600; color: #1a3a5c; margin-bottom: 8px; display: block;">结束日期</label>
                            <input type="date" id="archiveEndDate" value="${state.archiveEndDate}" style="width: 100%; padding: 10px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-primary" id="previewArchiveBtn">👁️ 预览归档</button>
                        <button class="btn btn-primary" id="executeArchiveBtn">🗄️ 执行归档</button>
                    </div>
                </div>

                <div style="margin-top: 32px;">
                    <div style="font-weight: bold; color: #1a3a5c; margin-bottom: 16px;">📜 归档记录</div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>表名</th>
                                    <th>归档日期</th>
                                    <th>数据开始</th>
                                    <th>数据结束</th>
                                    <th>记录数</th>
                                    <th>状态</th>
                                    <th>操作人</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${state.archiveRecords.map(record => `
                                    <tr>
                                        <td><strong>${record.displayName || record.tableName}</strong></td>
                                        <td>${record.archiveDate}</td>
                                        <td>${record.dataStartDate}</td>
                                        <td>${record.dataEndDate}</td>
                                        <td>${record.recordCount}</td>
                                        <td><span class="status-tag ${archiveStatusColors[record.status]}">${archiveStatusTexts[record.status]}</span></td>
                                        <td>${record.operator}</td>
                                        <td>
                                            <div class="action-btns">
                                                <button class="action-btn" data-id="${record.id}" data-action="restore">恢复</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents(container) {
        container.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                this.renderContent(container);
            });
        });

        container.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="download-template"]')) {
                const type = e.target.closest('[data-action="download-template"]').dataset.type;
                this.downloadTemplate(type);
            }

            if (e.target.closest('[data-action="select-type"]')) {
                const type = e.target.closest('[data-action="select-type"]').dataset.type;
                state.importType = type;
                this.renderContent(container);
            }

            if (e.target.closest('[data-action="view-log"]')) {
                Toast.info('查看导入日志');
            }

            if (e.target.closest('[data-action="delete-template"]')) {
                const id = parseInt(e.target.closest('[data-action="delete-template"]').dataset.id);
                this.deleteTemplate(id, container);
            }

            if (e.target.closest('[data-action="restore"]')) {
                const id = parseInt(e.target.closest('[data-action="restore"]').dataset.id);
                this.restoreArchive(id, container);
            }
        });

        container.querySelectorAll('[data-template-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.templateId);
                this.loadTemplate(id, container);
            });
        });

        const selectFileBtn = container.querySelector('#selectFileBtn');
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', () => {
                container.querySelector('#importFile').click();
            });
        }

        const importFileInput = container.querySelector('#importFile');
        if (importFileInput) {
            importFileInput.addEventListener('change', (e) => {
                if (e.target.files[0]) {
                    state.uploadFile = e.target.files[0];
                    this.previewImport(container);
                }
            });
        }

        container.querySelectorAll('input[name="importOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                state.importOption = e.target.value;
            });
        });

        const executeImportBtn = container.querySelector('#executeImportBtn');
        if (executeImportBtn) {
            executeImportBtn.addEventListener('click', () => {
                this.executeImport(container);
            });
        }

        const saveTemplateBtn = container.querySelector('#saveTemplateBtn');
        if (saveTemplateBtn) {
            saveTemplateBtn.addEventListener('click', () => {
                this.saveTemplate(container);
            });
        }

        const previewReportBtn = container.querySelector('#previewReportBtn');
        if (previewReportBtn) {
            previewReportBtn.addEventListener('click', () => {
                this.previewReport(container);
            });
        }

        const exportReportBtn = container.querySelector('#exportReportBtn');
        if (exportReportBtn) {
            exportReportBtn.addEventListener('click', () => {
                this.exportReport();
            });
        }

        const addFilterBtn = container.querySelector('#addFilterBtn');
        if (addFilterBtn) {
            addFilterBtn.addEventListener('click', () => {
                this.addFilter(container);
            });
        }

        const previewArchiveBtn = container.querySelector('#previewArchiveBtn');
        if (previewArchiveBtn) {
            previewArchiveBtn.addEventListener('click', () => {
                this.previewArchive(container);
            });
        }

        const executeArchiveBtn = container.querySelector('#executeArchiveBtn');
        if (executeArchiveBtn) {
            executeArchiveBtn.addEventListener('click', () => {
                this.executeArchive(container);
            });
        }

        const archiveTable = container.querySelector('#archiveTable');
        if (archiveTable) {
            archiveTable.addEventListener('change', (e) => {
                state.selectedTable = e.target.value;
            });
        }

        const archiveStartDate = container.querySelector('#archiveStartDate');
        if (archiveStartDate) {
            archiveStartDate.addEventListener('change', (e) => {
                state.archiveStartDate = e.target.value;
            });
        }

        const archiveEndDate = container.querySelector('#archiveEndDate');
        if (archiveEndDate) {
            archiveEndDate.addEventListener('change', (e) => {
                state.archiveEndDate = e.target.value;
            });
        }

        container.querySelectorAll('.field-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const field = e.target.dataset.field;
                if (e.target.checked) {
                    if (!state.selectedFields.includes(field)) {
                        state.selectedFields.push(field);
                    }
                } else {
                    state.selectedFields = state.selectedFields.filter(f => f !== field);
                }
            });
        });

        const chartTypeSelect = container.querySelector('#chartType');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', (e) => {
                state.chartType = e.target.value;
            });
        }
    },

    async downloadTemplate(type) {
        const res = await API.getImportTemplate(type);
        if (res.code === 200) {
            Toast.success('模板下载开始');
            const link = document.createElement('a');
            link.href = res.data.url;
            link.download = `${type}_template.xlsx`;
            link.click();
        }
    },

    async previewImport(container) {
        try {
            const res = await API.previewImportData({
                type: state.importType,
                fileName: state.uploadFile?.name
            });
            if (res.code === 200) {
                state.previewData = res.data;
                state.fieldMapping = res.data.fieldMapping;
                this.renderContent(container);
                Toast.success('数据预览成功');
            }
        } catch (error) {
            Toast.error('数据预览失败');
        }
    },

    async executeImport(container) {
        try {
            const res = await API.executeImport({
                type: state.importType,
                fileName: state.uploadFile?.name,
                option: state.importOption
            });
            if (res.code === 200) {
                Toast.success('导入开始执行');

                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('dataImportComplete', {
                        detail: { 
                            dataType: state.importType,
                            fileName: state.uploadFile?.name,
                            timestamp: Date.now()
                        }
                    }));
                }, 1000);

                await this.loadData();
                state.uploadFile = null;
                state.previewData = null;
                this.renderContent(container);
            }
        } catch (error) {
            Toast.error('导入执行失败');
        }
    },

    async saveTemplate(container) {
        Modal.open({
            title: '保存报表模板',
            content: `
                <div class="form-grid">
                    <div class="form-field full">
                        <label>模板名称</label>
                        <input type="text" id="templateName" placeholder="输入模板名称">
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="confirmSaveTemplateBtn">保存</button>
            `
        });

        document.getElementById('confirmSaveTemplateBtn').addEventListener('click', async () => {
            const name = document.getElementById('templateName').value;
            if (!name) {
                Toast.error('请输入模板名称');
                return;
            }

            try {
                const res = await API.saveReportTemplate({
                    name,
                    dataSource: 'employee',
                    fields: state.selectedFields,
                    filters: state.filters,
                    sortBy: state.sortField,
                    sortOrder: state.sortOrder,
                    chartType: state.chartType
                });

                if (res.code === 200) {
                    Toast.success('模板保存成功');
                    document.querySelector('.modal-overlay.show').remove();
                    await this.loadData();
                    this.renderContent(container);
                }
            } catch (error) {
                Toast.error('模板保存失败');
            }
        });
    },

    async loadTemplate(id, container) {
        const template = state.reportTemplates.find(t => t.id === id);
        if (template) {
            state.reportTemplate = template;
            state.selectedFields = template.fields || [];
            state.filters = template.filters || [];
            state.sortField = template.sortBy;
            state.sortOrder = template.sortOrder || 'asc';
            state.chartType = template.chartType || 'table';
            this.renderContent(container);
        }
    },

    async deleteTemplate(id, container) {
        Modal.confirm('确定要删除此模板吗？', async () => {
            try {
                const res = await API.deleteReportTemplate(id);
                if (res.code === 200) {
                    Toast.success('模板删除成功');
                    await this.loadData();
                    this.renderContent(container);
                }
            } catch (error) {
                Toast.error('模板删除失败');
            }
        });
    },

    async previewReport(container) {
        try {
            const res = await API.previewReport({
                dataSource: 'employee',
                fields: state.selectedFields,
                filters: state.filters,
                sortBy: state.sortField,
                sortOrder: state.sortOrder
            });
            if (res.code === 200) {
                state.reportPreviewData = res.data || [];
                this.renderContent(container);
                Toast.success('报表预览成功');
            }
        } catch (error) {
            Toast.error('报表预览失败');
        }
    },

    async exportReport() {
        try {
            const res = await API.exportReport({
                dataSource: 'employee',
                fields: state.selectedFields,
                filters: state.filters
            });
            if (res.code === 200) {
                Toast.success('报表导出成功');
                const link = document.createElement('a');
                link.href = res.data.url;
                link.download = 'report.xlsx';
                link.click();
            }
        } catch (error) {
            Toast.error('报表导出失败');
        }
    },

    addFilter(container) {
        const field = document.getElementById('filterField').value;
        const operator = document.getElementById('filterOperator').value;
        const value = document.getElementById('filterValue').value;
        if (field && value) {
            state.filters.push({ field, operator, value });
            document.getElementById('filterField').value = '';
            document.getElementById('filterValue').value = '';
            Toast.success('筛选条件已添加');
            this.renderContent(container);
        } else {
            Toast.error('请填写完整筛选条件');
        }
    },

    async previewArchive(container) {
        if (!state.selectedTable || !state.archiveStartDate || !state.archiveEndDate) {
            Toast.error('请填写完整的归档信息');
            return;
        }
        try {
            const res = await API.previewArchive({
                tableName: state.selectedTable,
                startDate: state.archiveStartDate,
                endDate: state.archiveEndDate
            });
            if (res.code === 200) {
                Modal.info(`将归档 ${res.data.recordCount} 条记录`);
            }
        } catch (error) {
            Toast.error('归档预览失败');
        }
    },

    async executeArchive(container) {
        if (!state.selectedTable || !state.archiveStartDate || !state.archiveEndDate) {
            Toast.error('请填写完整的归档信息');
            return;
        }
        try {
            const res = await API.executeArchive({
                tableName: state.selectedTable,
                startDate: state.archiveStartDate,
                endDate: state.archiveEndDate
            });
            if (res.code === 200) {
                Toast.success('归档执行成功');
                await this.loadData();
                this.renderContent(container);
            }
        } catch (error) {
            Toast.error('归档执行失败');
        }
    },

    async restoreArchive(id, container) {
        Modal.confirm('确定要恢复此归档数据吗？', async () => {
            try {
                const res = await API.restoreArchive(id);
                if (res.code === 200) {
                    Toast.success('恢复成功');
                    await this.loadData();
                    this.renderContent(container);
                }
            } catch (error) {
                Toast.error('恢复失败');
            }
        });
    },

    destroy() {}
};

export default importModule;
