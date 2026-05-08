const Migration = {
    state: {
        currentStep: 1,
        totalSteps: 4,
        sourceType: 'excel',
        selectedData: [],
        fieldMapping: {},
        previewData: [],
        conflicts: [],
        migrationLogs: [],
        isExecuting: false,
        progress: 0
    },

    async render(container) {
        this.renderContent(container);
    },

    renderContent(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">数据迁移</h1>
                <p class="page-subtitle">从旧系统迁移数据到新系统</p>
            </div>

            <div class="migration-container">
                <div class="migration-steps">
                    <div class="migration-step ${this.state.currentStep >= 1 ? 'active' : ''} ${this.state.currentStep === 1 ? 'current' : ''}">
                        <div class="step-num">1</div>
                        <div class="step-info">
                            <div class="step-title">数据源配置</div>
                            <div class="step-desc">选择数据源并配置</div>
                        </div>
                    </div>
                    <div class="migration-step ${this.state.currentStep >= 2 ? 'active' : ''} ${this.state.currentStep === 2 ? 'current' : ''}">
                        <div class="step-num">2</div>
                        <div class="step-info">
                            <div class="step-title">字段映射</div>
                            <div class="step-desc">配置字段对应关系</div>
                        </div>
                    </div>
                    <div class="migration-step ${this.state.currentStep >= 3 ? 'active' : ''} ${this.state.currentStep === 3 ? 'current' : ''}">
                        <div class="step-num">3</div>
                        <div class="step-info">
                            <div class="step-title">数据预览</div>
                            <div class="step-desc">预览并处理冲突</div>
                        </div>
                    </div>
                    <div class="migration-step ${this.state.currentStep >= 4 ? 'active' : ''} ${this.state.currentStep === 4 ? 'current' : ''}">
                        <div class="step-num">4</div>
                        <div class="step-info">
                            <div class="step-title">执行迁移</div>
                            <div class="step-desc">执行并查看结果</div>
                        </div>
                    </div>
                </div>

                <div class="migration-content">
                    ${this.renderCurrentStep()}
                </div>

                <div class="migration-footer">
                    ${this.state.currentStep > 1 ? `
                        <button class="btn btn-default" id="prevStepBtn">
                            <span>←</span>
                            <span>上一步</span>
                        </button>
                    ` : '<div></div>'}
                    ${this.state.currentStep < this.state.totalSteps ? `
                        <button class="btn btn-primary" id="nextStepBtn">
                            <span>下一步</span>
                            <span>→</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    renderCurrentStep() {
        switch(this.state.currentStep) {
            case 1: return this.renderSourceStep();
            case 2: return this.renderMappingStep();
            case 3: return this.renderPreviewStep();
            case 4: return this.renderExecuteStep();
            default: return '';
        }
    },

    renderSourceStep() {
        return `
            <div class="migration-card">
                <h3>选择数据源类型</h3>
                <div class="source-types">
                    <div class="source-type-card ${this.state.sourceType === 'excel' ? 'selected' : ''}" data-type="excel">
                        <div class="source-icon">📊</div>
                        <div class="source-name">Excel 导入</div>
                        <div class="source-desc">支持 .xlsx, .xls 格式</div>
                    </div>
                    <div class="source-type-card ${this.state.sourceType === 'csv' ? 'selected' : ''}" data-type="csv">
                        <div class="source-icon">📄</div>
                        <div class="source-name">CSV 导入</div>
                        <div class="source-desc">支持 .csv 格式</div>
                    </div>
                    <div class="source-type-card ${this.state.sourceType === 'database' ? 'selected' : ''}" data-type="database">
                        <div class="source-icon">🗄️</div>
                        <div class="source-name">旧数据库</div>
                        <div class="source-desc">直连旧系统数据库</div>
                    </div>
                </div>

                <div class="source-config">
                    <h3>上传数据文件</h3>
                    <div class="upload-area" id="uploadArea">
                        <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display: none;">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">拖拽文件到此处，或 <button class="btn btn-text" id="browseBtn">浏览</button></div>
                        <div class="upload-hint">支持 Excel 和 CSV 格式</div>
                    </div>

                    <h3 style="margin-top: 24px;">选择迁移内容</h3>
                    <div class="data-types">
                        <label class="data-type-item">
                            <input type="checkbox" data-type="employee" checked>
                            <span>👥 员工数据</span>
                        </label>
                        <label class="data-type-item">
                            <input type="checkbox" data-type="department" checked>
                            <span>🏢 部门数据</span>
                        </label>
                        <label class="data-type-item">
                            <input type="checkbox" data-type="position">
                            <span>💼 岗位数据</span>
                        </label>
                        <label class="data-type-item">
                            <input type="checkbox" data-type="contract">
                            <span>📝 合同数据</span>
                        </label>
                        <label class="data-type-item">
                            <input type="checkbox" data-type="attendance">
                            <span>⏰ 考勤数据</span>
                        </label>
                        <label class="data-type-item">
                            <input type="checkbox" data-type="performance">
                            <span>⭐ 绩效数据</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    renderMappingStep() {
        const sourceFields = ['工号', '姓名', '性别', '年龄', '部门', '岗位', '入职日期', '手机号', '邮箱', '身份证号', '籍贯', '学历'];
        const targetFields = ['employeeNo', 'name', 'gender', 'age', 'department', 'position', 'entryDate', 'phone', 'email', 'idCard', 'birthplace', 'education'];

        return `
            <div class="migration-card">
                <h3>字段映射配置</h3>
                <p class="mapping-desc">将源文件中的字段对应到系统的目标字段</p>

                <div class="mapping-grid">
                    <div class="mapping-header">
                        <div class="mapping-col">源字段</div>
                        <div class="mapping-arrow"></div>
                        <div class="mapping-col">目标字段</div>
                    </div>
                    ${sourceFields.map((source, index) => `
                        <div class="mapping-row">
                            <div class="mapping-source">
                                <input type="text" class="form-control" value="${source}" data-source="${index}">
                            </div>
                            <div class="mapping-arrow-icon">→</div>
                            <div class="mapping-target">
                                <select class="form-control" data-target="${index}">
                                    <option value="">-- 不映射 --</option>
                                    ${targetFields.map((target, i) => `
                                        <option value="${target}" ${index === i ? 'selected' : ''}>${target}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="mapping-actions">
                    <button class="btn btn-default" id="autoMapBtn">
                        <span>🔄</span>
                        <span>自动映射</span>
                    </button>
                    <button class="btn btn-default" id="clearMapBtn">
                        <span>🗑️</span>
                        <span>清除映射</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderPreviewStep() {
        const previewData = [
            { sourceId: 1, name: '张三', department: '技术部', position: '前端工程师', status: 'valid' },
            { sourceId: 2, name: '李四', department: '产品部', position: '产品经理', status: 'valid' },
            { sourceId: 3, name: '王五', department: '技术部', position: '后端工程师', status: 'conflict', conflict: '工号EMP003已存在' },
            { sourceId: 4, name: '赵六', department: '市场部', position: '市场专员', status: 'valid' },
            { sourceId: 5, name: '孙七', department: '', position: '', status: 'invalid', error: '部门不能为空' }
        ];

        const stats = {
            total: previewData.length,
            valid: previewData.filter(d => d.status === 'valid').length,
            conflict: previewData.filter(d => d.status === 'conflict').length,
            invalid: previewData.filter(d => d.status === 'invalid').length
        };

        return `
            <div class="migration-card">
                <h3>数据预览</h3>

                <div class="preview-stats">
                    <div class="stat-item">
                        <div class="stat-value">${stats.total}</div>
                        <div class="stat-label">总记录</div>
                    </div>
                    <div class="stat-item success">
                        <div class="stat-value">${stats.valid}</div>
                        <div class="stat-label">有效</div>
                    </div>
                    <div class="stat-item warning">
                        <div class="stat-value">${stats.conflict}</div>
                        <div class="stat-label">冲突</div>
                    </div>
                    <div class="stat-item danger">
                        <div class="stat-value">${stats.invalid}</div>
                        <div class="stat-label">无效</div>
                    </div>
                </div>

                <div class="conflict-strategy">
                    <h4>冲突处理策略</h4>
                    <div class="strategy-options">
                        <label class="strategy-option selected">
                            <input type="radio" name="strategy" value="skip" checked>
                            <span>跳过</span>
                            <span class="strategy-desc">保留旧数据</span>
                        </label>
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="overwrite">
                            <span>覆盖</span>
                            <span class="strategy-desc">使用新数据</span>
                        </label>
                        <label class="strategy-option">
                            <input type="radio" name="strategy" value="merge">
                            <span>合并</span>
                            <span class="strategy-desc">合并两边数据</span>
                        </label>
                    </div>
                </div>

                <div class="preview-table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>状态</th>
                                <th>工号</th>
                                <th>姓名</th>
                                <th>部门</th>
                                <th>岗位</th>
                                <th>说明</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${previewData.map(row => `
                                <tr class="${row.status === 'invalid' ? 'row-error' : row.status === 'conflict' ? 'row-warning' : ''}">
                                    <td>
                                        ${row.status === 'valid' ? '<span class="badge badge-success">✓</span>' : ''}
                                        ${row.status === 'conflict' ? '<span class="badge badge-warning">!</span>' : ''}
                                        ${row.status === 'invalid' ? '<span class="badge badge-danger">✗</span>' : ''}
                                    </td>
                                    <td>${row.sourceId}</td>
                                    <td>${row.name}</td>
                                    <td>${row.department || '-'}</td>
                                    <td>${row.position || '-'}</td>
                                    <td>${row.conflict || row.error || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    renderExecuteStep() {
        return `
            <div class="migration-card">
                <h3>执行迁移</h3>

                ${!this.state.isExecuting ? `
                    <div class="execute-ready">
                        <div class="ready-icon">🚀</div>
                        <div class="ready-text">准备就绪，点击开始执行迁移</div>
                        <div class="ready-summary">
                            <div class="summary-row">
                                <span>数据源：</span>
                                <span>Excel 文件</span>
                            </div>
                            <div class="summary-row">
                                <span>迁移内容：</span>
                                <span>员工、部门、岗位</span>
                            </div>
                            <div class="summary-row">
                                <span>预计记录：</span>
                                <span>1250 条</span>
                            </div>
                        </div>
                        <button class="btn btn-primary btn-lg" id="startMigrationBtn">
                            <span>▶️</span>
                            <span>开始迁移</span>
                        </button>
                    </div>
                ` : `
                    <div class="execute-progress">
                        <div class="progress-header">
                            <span>迁移进度</span>
                            <span id="progressPercent">${this.state.progress}%</span>
                        </div>
                        <div class="progress-bar-large">
                            <div class="progress-fill" style="width: ${this.state.progress}%;"></div>
                        </div>
                        <div class="progress-info">
                            <span id="progressText">正在迁移员工数据...</span>
                            <span id="progressCount">0 / 1250</span>
                        </div>
                    </div>

                    <div class="migration-logs">
                        <h4>迁移日志</h4>
                        <div class="log-container" id="logContainer">
                            ${this.state.migrationLogs.map(log => `
                                <div class="log-item ${log.level}">
                                    <span class="log-time">${log.timestamp}</span>
                                    <span class="log-level">${log.level.toUpperCase()}</span>
                                    <span class="log-message">${log.message}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `}

                ${this.state.progress >= 100 ? `
                    <div class="migration-result success">
                        <div class="result-icon">🎉</div>
                        <div class="result-title">迁移完成！</div>
                        <div class="result-stats">
                            <div class="stat-row">
                                <span>成功：</span>
                                <span class="success">1242 条</span>
                            </div>
                            <div class="stat-row">
                                <span>失败：</span>
                                <span class="danger">8 条</span>
                            </div>
                            <div class="stat-row">
                                <span>耗时：</span>
                                <span>2分35秒</span>
                            </div>
                        </div>
                        <button class="btn btn-primary" id="viewReportBtn">
                            <span>📊</span>
                            <span>查看完整报告</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    bindEvents(container) {
        container.querySelectorAll('.source-type-card').forEach(card => {
            card.addEventListener('click', () => {
                this.state.sourceType = card.dataset.type;
                this.renderContent(container);
            });
        });

        container.querySelector('#browseBtn')?.addEventListener('click', () => {
            container.querySelector('#fileInput')?.click();
        });

        container.querySelector('#fileInput')?.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                const uploadArea = container.querySelector('#uploadArea');
                if (uploadArea) {
                    uploadArea.innerHTML = `
                        <div class="upload-icon">✅</div>
                        <div class="upload-text">已选择: ${file.name}</div>
                        <div class="upload-hint">${(file.size / 1024).toFixed(1)} KB</div>
                    `;
                }
            }
        });

        container.querySelector('#prevStepBtn')?.addEventListener('click', () => {
            if (this.state.currentStep > 1) {
                this.state.currentStep--;
                this.renderContent(container);
            }
        });

        container.querySelector('#nextStepBtn')?.addEventListener('click', () => {
            if (this.state.currentStep < this.state.totalSteps) {
                this.state.currentStep++;
                this.renderContent(container);
            }
        });

        container.querySelector('#startMigrationBtn')?.addEventListener('click', async () => {
            await this.executeMigration(container);
        });

        container.querySelectorAll('.strategy-option').forEach(opt => {
            opt.addEventListener('click', () => {
                container.querySelectorAll('.strategy-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    },

    async executeMigration(container) {
        this.state.isExecuting = true;
        this.state.progress = 0;
        this.state.migrationLogs = [];

        this.renderContent(container);

        const steps = [
            { name: '员工数据', count: 850, duration: 3000 },
            { name: '部门数据', count: 15, duration: 1000 },
            { name: '岗位数据', count: 50, duration: 800 },
            { name: '合同数据', count: 335, duration: 2000 }
        ];

        for (const step of steps) {
            for (let i = 0; i <= step.count; i += 50) {
                await new Promise(resolve => setTimeout(resolve, 30));
                this.state.progress = Math.min(99, Math.round((i / step.count) * 100));
                this.state.migrationLogs.push({
                    level: 'info',
                    message: `正在迁移 ${step.name}... (${i}/${step.count})`,
                    timestamp: new Date().toLocaleTimeString()
                });
                this.updateProgress(container);
            }
            this.state.migrationLogs.push({
                level: 'success',
                message: `${step.name} 迁移完成 (${step.count} 条)`,
                timestamp: new Date().toLocaleTimeString()
            });
        }

        this.state.progress = 100;
        this.state.migrationLogs.push({
            level: 'success',
            message: '数据迁移全部完成！',
            timestamp: new Date().toLocaleTimeString()
        });
        this.updateProgress(container);
    },

    updateProgress(container) {
        const percentEl = container.querySelector('#progressPercent');
        const countEl = container.querySelector('#progressCount');
        const logContainer = container.querySelector('#logContainer');

        if (percentEl) percentEl.textContent = `${this.state.progress}%`;
        if (countEl) countEl.textContent = `${Math.round(this.state.progress * 12.5)} / 1250`;
        if (logContainer) {
            logContainer.innerHTML = this.state.migrationLogs.map(log => `
                <div class="log-item ${log.level}">
                    <span class="log-time">${log.timestamp}</span>
                    <span class="log-level">${log.level.toUpperCase()}</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `).join('');
            logContainer.scrollTop = logContainer.scrollHeight;
        }

        const progressFill = container.querySelector('.progress-fill');
        if (progressFill) progressFill.style.width = `${this.state.progress}%`;
    }
};

export default Migration;
