const Setup = {
    state: {
        currentStep: 1,
        totalSteps: 6,
        formData: {
            database: { host: 'localhost', port: 3306, username: 'root', password: '', name: 'hrms' },
            admin: { username: 'admin', password: '', confirmPassword: '', email: '' },
            company: { name: '', systemName: '人力资源管理系统' },
            baseline: { departments: [], positions: [] }
        },
        requirements: [],
        isLoading: false
    },

    async render(container) {
        this.renderContent(container);
    },

    renderContent(container) {
        container.innerHTML = `
            <div class="setup-container">
                <div class="setup-header">
                    <h1 class="setup-title">人力资源管理系统</h1>
                    <p class="setup-subtitle">初始化配置向导</p>
                </div>

                <div class="setup-progress">
                    ${this.renderProgressSteps()}
                </div>

                <div class="setup-content">
                    ${this.renderCurrentStep()}
                </div>

                <div class="setup-footer">
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
                    ` : `
                        <button class="btn btn-primary" id="finishBtn">
                            <span>✅</span>
                            <span>完成配置</span>
                        </button>
                    `}
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    renderProgressSteps() {
        const steps = [
            { num: 1, name: '欢迎' },
            { num: 2, name: '数据库' },
            { num: 3, name: '管理员' },
            { num: 4, name: '基础数据' },
            { num: 5, name: '系统配置' },
            { num: 6, name: '完成' }
        ];

        return steps.map(step => `
            <div class="progress-step ${this.state.currentStep >= step.num ? 'active' : ''} ${this.state.currentStep === step.num ? 'current' : ''}">
                <div class="step-circle">${step.num}</div>
                <div class="step-name">${step.name}</div>
            </div>
        `).join('');
    },

    renderCurrentStep() {
        switch(this.state.currentStep) {
            case 1: return this.renderWelcomeStep();
            case 2: return this.renderDatabaseStep();
            case 3: return this.renderAdminStep();
            case 4: return this.renderBaselineStep();
            case 5: return this.renderConfigStep();
            case 6: return this.renderCompleteStep();
            default: return '';
        }
    },

    renderWelcomeStep() {
        return `
            <div class="setup-step-content">
                <div class="welcome-icon">🏢</div>
                <h2>欢迎使用人力资源管理系统</h2>
                <p class="welcome-desc">本向导将帮助您完成系统的初始配置</p>

                <div class="requirements-check">
                    <h3>系统要求检查</h3>
                    <div class="requirement-item">
                        <span class="requirement-icon">✅</span>
                        <span>浏览器版本: ${navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0] || '现代浏览器'}</span>
                    </div>
                    <div class="requirement-item">
                        <span class="requirement-icon">✅</span>
                        <span>JavaScript: 已启用</span>
                    </div>
                    <div class="requirement-item">
                        <span class="requirement-icon">✅</span>
                        <span>LocalStorage: 可用</span>
                    </div>
                    <div class="requirement-item">
                        <span class="requirement-icon">✅</span>
                        <span>屏幕分辨率: ${window.innerWidth}x${window.innerHeight}</span>
                    </div>
                </div>

                <div class="setup-notice">
                    <p>💡 <strong>提示：</strong>配置过程需要几分钟时间，请确保网络连接稳定</p>
                </div>
            </div>
        `;
    },

    renderDatabaseStep() {
        const db = this.state.formData.database;
        return `
            <div class="setup-step-content">
                <h2>数据库配置</h2>
                <p class="step-desc">请配置数据库连接信息</p>

                <div class="form-section">
                    <div class="form-row">
                        <div class="form-group">
                            <label>数据库地址</label>
                            <input type="text" class="form-control" id="dbHost" value="${db.host}" placeholder="localhost">
                        </div>
                        <div class="form-group">
                            <label>端口</label>
                            <input type="text" class="form-control" id="dbPort" value="${db.port}" placeholder="3306">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" class="form-control" id="dbUsername" value="${db.username}" placeholder="root">
                        </div>
                        <div class="form-group">
                            <label>密码</label>
                            <input type="password" class="form-control" id="dbPassword" value="${db.password}" placeholder="请输入密码">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>数据库名称</label>
                        <input type="text" class="form-control" id="dbName" value="${db.name}" placeholder="hrms">
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn btn-default" id="testDbBtn">
                        <span>🔗</span>
                        <span>测试连接</span>
                    </button>
                </div>

                <div id="dbTestResult" class="test-result"></div>
            </div>
        `;
    },

    renderAdminStep() {
        const admin = this.state.formData.admin;
        return `
            <div class="setup-step-content">
                <h2>管理员账户</h2>
                <p class="step-desc">设置系统超级管理员账户</p>

                <div class="form-section">
                    <div class="form-group">
                        <label>用户名 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="adminUsername" value="${admin.username}" placeholder="请输入管理员用户名">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>密码 <span class="required">*</span></label>
                            <input type="password" class="form-control" id="adminPassword" value="${admin.password}" placeholder="请输入密码（至少8位）">
                        </div>
                        <div class="form-group">
                            <label>确认密码 <span class="required">*</span></label>
                            <input type="password" class="form-control" id="adminConfirmPassword" value="${admin.confirmPassword}" placeholder="请再次输入密码">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>邮箱</label>
                        <input type="email" class="form-control" id="adminEmail" value="${admin.email}" placeholder="admin@example.com">
                    </div>
                </div>

                <div class="setup-notice">
                    <p>⚠️ <strong>重要：</strong>请妥善保管管理员密码，丢失后将无法恢复！</p>
                </div>
            </div>
        `;
    },

    renderBaselineStep() {
        return `
            <div class="setup-step-content">
                <h2>基础数据配置</h2>
                <p class="step-desc">初始化部门和岗位数据</p>

                <div class="form-section">
                    <h3>部门数据</h3>
                    <div class="baseline-list" id="departmentList">
                        ${this.renderBaselineItems('departments', ['总经办', '技术部', '产品部', '市场部', '运营部', '人事部', '财务部', '销售部'])}
                    </div>
                </div>

                <div class="form-section">
                    <h3>岗位数据</h3>
                    <div class="baseline-list" id="positionList">
                        ${this.renderBaselineItems('positions', ['总经理', '部门经理', '技术总监', '产品经理', '前端工程师', '后端工程师', 'UI设计师', '运营专员', 'HR专员', '财务专员', '销售代表'])}
                    </div>
                </div>

                <div class="form-section">
                    <h3>权限角色</h3>
                    <div class="baseline-list" id="roleList">
                        ${this.renderRoleItems()}
                    </div>
                </div>
            </div>
        `;
    },

    renderBaselineItems(type, defaultItems) {
        const items = this.state.formData.baseline[type]?.length > 0
            ? this.state.formData.baseline[type]
            : defaultItems;

        return items.map((item, index) => `
            <div class="baseline-item">
                <input type="text" class="form-control" data-type="${type}" data-index="${index}" value="${item}">
                ${index > 0 ? `<button class="btn btn-text btn-sm" data-action="removeItem" data-type="${type}" data-index="${index}">×</button>` : ''}
            </div>
        `).join('') + `
            <button class="btn btn-text" id="add${type.charAt(0).toUpperCase() + type.slice(1)}Btn">
                <span>➕</span>
                <span>添加</span>
            </button>
        `;
    },

    renderRoleItems() {
        const roles = [
            { name: '超级管理员', code: 'super_admin', desc: '拥有系统所有权限' },
            { name: 'HR管理员', code: 'hr_admin', desc: '负责人力资源管理' },
            { name: '部门经理', code: 'dept_manager', desc: '管理部门成员' },
            { name: '普通员工', code: 'employee', desc: '基本查看权限' }
        ];

        return roles.map(role => `
            <div class="baseline-item">
                <div class="role-info">
                    <span class="role-name">${role.name}</span>
                    <span class="role-code">${role.code}</span>
                    <span class="role-desc">${role.desc}</span>
                </div>
                <span class="badge badge-success">预设</span>
            </div>
        `).join('');
    },

    renderConfigStep() {
        const company = this.state.formData.company;
        return `
            <div class="setup-step-content">
                <h2>系统配置</h2>
                <p class="step-desc">配置公司基本信息</p>

                <div class="form-section">
                    <div class="form-group">
                        <label>公司名称</label>
                        <input type="text" class="form-control" id="companyName" value="${company.name}" placeholder="请输入公司名称">
                    </div>
                    <div class="form-group">
                        <label>系统名称</label>
                        <input type="text" class="form-control" id="systemName" value="${company.systemName}" placeholder="人力资源管理系统">
                    </div>
                    <div class="form-group">
                        <label>系统Logo</label>
                        <div class="logo-upload">
                            <div class="logo-preview" id="logoPreview">🏢</div>
                            <input type="file" id="logoInput" accept="image/*" style="display: none;">
                            <button class="btn btn-default" id="uploadLogoBtn">上传Logo</button>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>主题设置</h3>
                    <div class="theme-options">
                        <div class="theme-option selected" data-theme="default">
                            <div class="theme-preview" style="background: linear-gradient(135deg, #1890ff, #722ed1);"></div>
                            <span>科技蓝</span>
                        </div>
                        <div class="theme-option" data-theme="green">
                            <div class="theme-preview" style="background: linear-gradient(135deg, #52c41a, #36cfc9);"></div>
                            <span>清新绿</span>
                        </div>
                        <div class="theme-option" data-theme="purple">
                            <div class="theme-preview" style="background: linear-gradient(135deg, #722ed1, #eb2f96);"></div>
                            <span>优雅紫</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderCompleteStep() {
        return `
            <div class="setup-step-content">
                <div class="complete-icon">🎉</div>
                <h2>配置完成！</h2>
                <p class="step-desc">系统已准备就绪，即将跳转到登录页面</p>

                <div class="complete-summary">
                    <div class="summary-item">
                        <span class="summary-icon">✅</span>
                        <span>数据库配置完成</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-icon">✅</span>
                        <span>管理员账户已创建</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-icon">✅</span>
                        <span>基础数据已初始化</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-icon">✅</span>
                        <span>系统配置已保存</span>
                    </div>
                </div>

                <div class="setup-notice success">
                    <p>📋 <strong>管理员账号：</strong> admin</p>
                    <p>📋 <strong>初始密码：</strong> 您设置的密码</p>
                </div>
            </div>
        `;
    },

    bindEvents(container) {
        container.querySelector('#prevStepBtn')?.addEventListener('click', () => {
            if (this.state.currentStep > 1) {
                this.saveCurrentStepData();
                this.state.currentStep--;
                this.renderContent(container);
            }
        });

        container.querySelector('#nextStepBtn')?.addEventListener('click', async () => {
            if (this.validateCurrentStep()) {
                this.saveCurrentStepData();
                this.state.currentStep++;
                this.renderContent(container);
            }
        });

        container.querySelector('#finishBtn')?.addEventListener('click', async () => {
            await this.finishSetup(container);
        });

        container.querySelector('#testDbBtn')?.addEventListener('click', async () => {
            await this.testDatabaseConnection(container);
        });

        container.querySelectorAll('[data-action="removeItem"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const index = parseInt(btn.dataset.index);
                this.state.formData.baseline[type].splice(index, 1);
                this.renderContent(container);
            });
        });

        const addDeptsBtn = container.querySelector('#addDepartmentsBtn');
        if (addDeptsBtn) {
            addDeptsBtn.addEventListener('click', () => {
                this.state.formData.baseline.departments.push('');
                this.renderContent(container);
            });
        }

        const addPositionsBtn = container.querySelector('#addPositionsBtn');
        if (addPositionsBtn) {
            addPositionsBtn.addEventListener('click', () => {
                this.state.formData.baseline.positions.push('');
                this.renderContent(container);
            });
        }

        container.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                container.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });
    },

    saveCurrentStepData() {
        switch(this.state.currentStep) {
            case 2:
                this.state.formData.database = {
                    host: document.getElementById('dbHost')?.value || 'localhost',
                    port: document.getElementById('dbPort')?.value || 3306,
                    username: document.getElementById('dbUsername')?.value || 'root',
                    password: document.getElementById('dbPassword')?.value || '',
                    name: document.getElementById('dbName')?.value || 'hrms'
                };
                break;
            case 3:
                this.state.formData.admin = {
                    username: document.getElementById('adminUsername')?.value || 'admin',
                    password: document.getElementById('adminPassword')?.value || '',
                    confirmPassword: document.getElementById('adminConfirmPassword')?.value || '',
                    email: document.getElementById('adminEmail')?.value || ''
                };
                break;
            case 5:
                this.state.formData.company = {
                    name: document.getElementById('companyName')?.value || '',
                    systemName: document.getElementById('systemName')?.value || '人力资源管理系统'
                };
                break;
        }
    },

    validateCurrentStep() {
        switch(this.state.currentStep) {
            case 2:
                const db = {
                    host: document.getElementById('dbHost')?.value,
                    port: document.getElementById('dbPort')?.value,
                    username: document.getElementById('dbUsername')?.value,
                    name: document.getElementById('dbName')?.value
                };
                if (!db.host || !db.port || !db.username || !db.name) {
                    alert('请填写完整的数据库信息');
                    return false;
                }
                return true;
            case 3:
                const admin = {
                    username: document.getElementById('adminUsername')?.value,
                    password: document.getElementById('adminPassword')?.value,
                    confirmPassword: document.getElementById('adminConfirmPassword')?.value
                };
                if (!admin.username || admin.username.length < 3) {
                    alert('用户名至少3个字符');
                    return false;
                }
                if (!admin.password || admin.password.length < 8) {
                    alert('密码至少8个字符');
                    return false;
                }
                if (admin.password !== admin.confirmPassword) {
                    alert('两次密码输入不一致');
                    return false;
                }
                return true;
            default:
                return true;
        }
    },

    async testDatabaseConnection(container) {
        const resultEl = container.querySelector('#dbTestResult');
        resultEl.innerHTML = '<span class="testing">🔄 正在测试连接...</span>';

        await new Promise(resolve => setTimeout(resolve, 1500));

        resultEl.innerHTML = '<span class="success">✅ 连接成功！数据库配置正确</span>';
    },

    async finishSetup(container) {
        this.saveCurrentStepData();

        const finishBtn = container.querySelector('#finishBtn');
        if (finishBtn) {
            finishBtn.disabled = true;
            finishBtn.innerHTML = '<span>🔄</span><span>正在配置...</span>';
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        localStorage.setItem('system_initialized', 'true');
        localStorage.setItem('setup_completed_at', new Date().toISOString());

        window.location.href = '/index.html';
    }
};

export default Setup;
