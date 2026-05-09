import { Toast, Modal, Pagination, Skeleton, Validators, validateForm, escapeHtml } from '../utils.js';
import API from '../api.js';

const state = {
    employees: [],
    departments: [],
    positions: [],
    filteredList: [],
    currentPage: 1,
    pageSize: 10,
    searchKeyword: '',
    filterDept: '',
    filterStatus: '',
    selectedIds: [],
    loading: false,
    trainingRecords: [],
    trainingCourses: []
};

const employeeModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(5, 8);
        await this.loadData();
        this.renderContent(container);
        this.bindGlobalEvents();
        this.bindHRModuleEvents();
        this.bindDataImportEvents();
    },

    async loadData() {
        state.loading = true;
        try {
            const [empRes, deptRes, posRes] = await Promise.all([
                API.getEmployees(),
                API.getDepartments(),
                API.getPositions()
            ]);

            if (empRes.code === 200) {
                state.employees = empRes.data.map(e => ({
                    ...e,
                    email: e.email || `${e.employeeNo}@company.com`,
                    potentialTag: e.potentialTag || '中坚'
                }));
            }
            if (deptRes.code === 200) {
                state.departments = deptRes.data;
            }
            if (posRes.code === 200) {
                state.positions = posRes.data;
            }

            this.applyFilters();
        } catch (error) {
            console.error('Failed to load data:', error);
            Toast.error('数据加载失败');
        }
        state.loading = false;
    },

    applyFilters() {
        let result = [...state.employees];

        if (state.searchKeyword) {
            const kw = state.searchKeyword.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(kw) ||
                e.employeeNo.toLowerCase().includes(kw) ||
                (e.phone && e.phone.includes(kw))
            );
        }

        if (state.filterDept) {
            result = result.filter(e => e.department === state.filterDept);
        }

        if (state.filterStatus !== '') {
            result = result.filter(e => e.status === parseInt(state.filterStatus));
        }

        state.filteredList = result;
        state.currentPage = 1;
    },

    renderContent(container) {
        const totalPages = Math.ceil(state.filteredList.length / state.pageSize);
        const startIndex = (state.currentPage - 1) * state.pageSize;
        const endIndex = Math.min(startIndex + state.pageSize, state.filteredList.length);
        const currentList = state.filteredList.slice(startIndex, endIndex);

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">员工管理</h1>
                <button class="btn btn-primary" id="addEmployeeBtn">+ 新增员工</button>
            </div>

            <div class="card">
                <div class="toolbar">
                    <div class="search-box">
                        <span>🔍</span>
                        <input type="text" placeholder="搜索姓名、工号、手机号..." id="searchInput">
                    </div>
                    <select class="filter-select" id="deptFilter">
                        <option value="">全部部门</option>
                        ${state.departments.map(d => `
                            <option value="${d.name}" ${state.filterDept === d.name ? 'selected' : ''}>${d.name}</option>
                        `).join('')}
                    </select>
                    <select class="filter-select" id="statusFilter">
                        <option value="">全部状态</option>
                        <option value="1" ${state.filterStatus === '1' ? 'selected' : ''}>在职</option>
                        <option value="2" ${state.filterStatus === '2' ? 'selected' : ''}>试用期</option>
                        <option value="0" ${state.filterStatus === '0' ? 'selected' : ''}>离职</option>
                    </select>
                </div>

                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th class="checkbox-col"><input type="checkbox" id="selectAll"></th>
                                <th>工号</th>
                                <th>姓名</th>
                                <th>部门</th>
                                <th>岗位</th>
                                <th>潜力标签</th>
                                <th>手机号</th>
                                <th>入职日期</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="employeeTableBody">
                            ${currentList.length > 0 ? currentList.map(emp => `
                                <tr data-id="${emp.id}">
                                    <td class="checkbox-col">
                                        <input type="checkbox" data-id="${emp.id}" ${state.selectedIds.includes(emp.id) ? 'checked' : ''}>
                                    </td>
                                    <td>${escapeHtml(emp.employee_no || emp.employeeNo)}</td>
                                    <td><strong>${escapeHtml(emp.name)}</strong></td>
                                    <td>${escapeHtml(emp.department_name || emp.department)}</td>
                                    <td>${escapeHtml(emp.position_name || emp.position)}</td>
                                    <td>
                                        <span class="status-tag ${emp.potential_tag === '高潜' || emp.potentialTag === '高潜' ? 'active' : emp.potential_tag === '待提升' || emp.potentialTag === '待提升' ? 'inactive' : 'info'}">
                                            ${escapeHtml(emp.potential_tag || emp.potentialTag || '中坚')}
                                        </span>
                                    </td>
                                    <td>${escapeHtml(emp.phone || '-')}</td>
                                    <td>${escapeHtml(emp.hire_date || emp.entryDate || '-')}</td>
                                    <td>
                                        <span class="status-tag ${emp.status === 1 ? 'active' : emp.status === 2 ? 'warning' : 'inactive'}">
                                            ${emp.status === 1 ? '在职' : emp.status === 2 ? '试用期' : '离职'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn" data-action="view" data-id="${emp.id}">详情</button>
                                            <button class="action-btn" data-action="edit" data-id="${emp.id}">编辑</button>
                                            <button class="action-btn" data-action="leave" data-id="${emp.id}" style="${emp.status === 0 ? 'display:none' : ''}">离职</button>
                                            <button class="action-btn" data-action="delete" data-id="${emp.id}" style="color: #f5222d;">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="10" style="text-align: center; padding: 60px;">
                                        <div class="empty-icon">👤</div>
                                        <div class="empty-text">暂无员工数据</div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>

                <div class="pagination" id="pagination"></div>
            </div>

            <div class="batch-actions-bar" id="batchActionsBar" style="display: none;">
                <div class="batch-info">已选中 <span class="selected-count">${state.selectedIds.length}</span> 项</div>
                <div class="batch-buttons">
                    <button class="batch-cancel-btn" id="cancelBatchBtn">取消</button>
                    <button class="batch-export-btn" id="batchExportBtn">📎 批量导出</button>
                    <button class="batch-delete-btn" id="batchDeleteBtn">🗑️ 批量删除</button>
                </div>
            </div>

            <div class="modal-overlay" id="detailDrawer">
                <div class="modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <span class="modal-title">员工详情</span>
                        <div class="modal-controls">
                            <button class="modal-control-btn modal-close">×</button>
                        </div>
                    </div>
                    <div class="modal-body" id="detailContent" style="max-height: 70vh; overflow-y: auto;"></div>
                </div>
            </div>
        `;

        this.bindEvents();
        this.renderPagination();
        this.updateBatchActionsBar();
    },

    bindEvents() {
        document.getElementById('addEmployeeBtn')?.addEventListener('click', () => this.openFormModal());

        const searchInput = document.getElementById('searchInput');
        let searchTimeout;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.searchKeyword = e.target.value;
                this.applyFilters();
                this.renderContent(document.getElementById('content'));
            }, 300);
        });

        document.getElementById('deptFilter')?.addEventListener('change', (e) => {
            state.filterDept = e.target.value;
            this.applyFilters();
            this.renderContent(document.getElementById('content'));
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            state.filterStatus = e.target.value;
            this.applyFilters();
            this.renderContent(document.getElementById('content'));
        });

        document.getElementById('selectAll')?.addEventListener('change', (e) => {
            const checked = e.target.checked;
            state.selectedIds = checked ? state.filteredList.map(e => e.id) : [];
            document.querySelectorAll('#employeeTableBody input[type="checkbox"]').forEach(cb => {
                cb.checked = checked;
            });
            this.updateBatchActionsBar();
        });

        document.getElementById('employeeTableBody')?.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.dataset.id) {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    if (!state.selectedIds.includes(id)) state.selectedIds.push(id);
                } else {
                    state.selectedIds = state.selectedIds.filter(i => i !== id);
                }
                this.updateBatchActionsBar();
            }
        });

        document.getElementById('employeeTableBody')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                this.handleRowAction(id, action);
            }
        });

        document.getElementById('cancelBatchBtn')?.addEventListener('click', () => {
            state.selectedIds = [];
            this.renderContent(document.getElementById('content'));
        });

        document.getElementById('batchDeleteBtn')?.addEventListener('click', () => this.handleBatchDelete());

        document.getElementById('batchExportBtn')?.addEventListener('click', () => this.handleBatchExport());

        document.getElementById('detailDrawer')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeDetailDrawer();
            }
        });

        document.querySelector('#detailDrawer .modal-close')?.addEventListener('click', () => {
            this.closeDetailDrawer();
        });
    },

    orgDataChangeHandler: null,
    hrModuleApprovalHandler: null,

    bindGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDetailDrawer();
            }
        });

        this.orgDataChangeHandler = () => {
            this.reloadOrgData();
        };
        window.addEventListener('orgDataChanged', this.orgDataChangeHandler);
    },

    bindHRModuleEvents() {
        this.hrModuleApprovalHandler = async (e) => {
            const { transfer } = e.detail || {};
            if (transfer) {
                await this.handleTransferApproval(transfer);
            }
        };
        window.addEventListener('transferApproved', this.hrModuleApprovalHandler);

        window.addEventListener('transferRejected', (e) => {
            const { transfer } = e.detail || {};
            if (transfer && transfer.type === '转正') {
                Toast.warning(`员工【${transfer.employeeName}】的转正申请被拒绝`);
            }
        });
    },

    bindDataImportEvents() {
        this.dataImportCompleteHandler = async (e) => {
            const { dataType } = e.detail || {};
            if (dataType === 'employee') {
                Toast.info('检测到员工数据已导入，正在刷新列表...');
                this.loadData().then(() => {
                    this.renderContent(document.getElementById('content'));
                });
            }
        };
        window.addEventListener('dataImportComplete', this.dataImportCompleteHandler);
    },

    async handleTransferApproval(transfer) {
        if (transfer.type === '转正') {
            const emp = state.employees.find(e => e.id === transfer.employeeId);
            if (emp) {
                await API.updateEmployee(emp.id, { ...emp, probationEnd: null });
                Toast.success(`员工【${emp.name}】已转为正式员工`);
            }
        } else if (transfer.type === '离职') {
            const emp = state.employees.find(e => e.id === transfer.employeeId);
            if (emp) {
                await API.updateEmployee(emp.id, { ...emp, status: 0 });
                Toast.info(`员工【${emp.name}】已办理离职`);
            }
        }

        await this.loadData();
        this.renderContent(document.getElementById('content'));
    },

    async reloadOrgData() {
        try {
            const [deptRes, posRes] = await Promise.all([
                API.getDepartments(),
                API.getPositions()
            ]);

            if (deptRes.code === 200) {
                state.departments = deptRes.data;
            }
            if (posRes.code === 200) {
                state.positions = posRes.data;
            }

            const currentDeptFilter = state.filterDept;
            const currentDeptSelect = document.getElementById('deptFilter');
            const modalDeptSelect = document.getElementById('empDept');

            if (currentDeptSelect) {
                currentDeptSelect.innerHTML = `
                    <option value="">全部部门</option>
                    ${state.departments.map(d => `
                        <option value="${d.name}" ${currentDeptFilter === d.name ? 'selected' : ''}>${d.name}</option>
                    `).join('')}
                `;
            }

            if (modalDeptSelect) {
                const currentValue = modalDeptSelect.value;
                modalDeptSelect.innerHTML = `
                    <option value="">请选择部门</option>
                    ${state.departments.map(d => `
                        <option value="${d.name}">${d.name}</option>
                    `).join('')}
                `;
                if (currentValue) {
                    modalDeptSelect.value = currentValue;
                }
            }

            Toast.info('组织架构已更新');
        } catch (error) {
            console.error('Failed to reload org data:', error);
        }
    },

    handleRowAction(id, action) {
        const employee = state.employees.find(e => e.id === id);
        if (!employee) return;

        switch (action) {
            case 'view':
                this.openDetailDrawer(employee);
                break;
            case 'edit':
                this.openFormModal(employee);
                break;
            case 'leave':
                this.openLeaveModal(employee);
                break;
            case 'delete':
                this.handleDelete(employee);
                break;
        }
    },

    openFormModal(employee = null) {
        const isEdit = !!employee;
        const title = isEdit ? '编辑员工' : '新增员工';

        const modal = Modal.open({
            title,
            content: `
                <form id="employeeForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>姓名 <span class="required">*</span></label>
                            <input type="text" id="empName" value="${employee?.name || ''}" placeholder="请输入姓名">
                            <div class="validate-message" id="empNameMsg"></div>
                        </div>
                        <div class="form-field">
                            <label>工号 <span class="required">*</span></label>
                            <input type="text" id="empNo" value="${employee?.employeeNo || ''}" ${isEdit ? 'readonly' : ''} placeholder="${isEdit ? '' : '系统自动生成'}">
                            <div class="validate-message" id="empNoMsg"></div>
                        </div>
                        <div class="form-field">
                            <label>部门 <span class="required">*</span></label>
                            <select id="empDept">
                                <option value="">请选择部门</option>
                                ${state.departments.map(d => `
                                    <option value="${d.name}" ${employee?.department === d.name ? 'selected' : ''}>${d.name}</option>
                                `).join('')}
                            </select>
                            <div class="validate-message" id="empDeptMsg"></div>
                        </div>
                        <div class="form-field">
                            <label>岗位 <span class="required">*</span></label>
                            <select id="empPosition">
                                <option value="">请选择岗位</option>
                            </select>
                            <div class="validate-message" id="empPositionMsg"></div>
                        </div>
                        <div class="form-field">
                            <label>手机号 <span class="required">*</span></label>
                            <input type="text" id="empPhone" value="${employee?.phone || ''}" placeholder="请输入手机号">
                            <div class="validate-message" id="empPhoneMsg"></div>
                        </div>
                        <div class="form-field">
                            <label>邮箱</label>
                            <input type="email" id="empEmail" value="${employee?.email || ''}" placeholder="请输入邮箱">
                            <div class="validate-message" id="empEmailMsg"></div>
                        </div>
                        <div class="form-field">
                            <label>入职日期 <span class="required">*</span></label>
                            <input type="date" id="empEntryDate" value="${employee?.entryDate || ''}">
                            <div class="validate-message" id="empEntryDateMsg"></div>
                        </div>
                        <div class="form-field">
                            <label>潜力标签</label>
                            <select id="empPotentialTag">
                                <option value="高潜" ${employee?.potentialTag === '高潜' ? 'selected' : ''}>高潜</option>
                                <option value="中坚" ${employee?.potentialTag === '中坚' || !employee ? 'selected' : ''}>中坚</option>
                                <option value="待提升" ${employee?.potentialTag === '待提升' ? 'selected' : ''}>待提升</option>
                            </select>
                        </div>
                        ${isEdit ? `
                        <div class="form-field">
                            <label>状态</label>
                            <select id="empStatus">
                                <option value="1" ${employee?.status === 1 ? 'selected' : ''}>在职</option>
                                <option value="2" ${employee?.status === 2 ? 'selected' : ''}>试用期</option>
                                <option value="0" ${employee?.status === 0 ? 'selected' : ''}>离职</option>
                            </select>
                        </div>
                        ` : ''}
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default" id="formCancelBtn">取消</button>
                <button class="btn btn-primary" id="formSaveBtn">保存</button>
            `
        });

        const deptSelect = document.getElementById('empDept');
        const positionSelect = document.getElementById('empPosition');

        const updatePositions = (selectedDept) => {
            positionSelect.innerHTML = '<option value="">请选择岗位</option>';
            const deptId = state.departments.find(d => d.name === selectedDept)?.id;
            const filteredPositions = state.positions.filter(p => p.departmentId === deptId);

            filteredPositions.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                option.textContent = p.name;
                if (employee?.position === p.name) {
                    option.selected = true;
                }
                positionSelect.appendChild(option);
            });

            if (employee?.department === selectedDept && employee?.position) {
                positionSelect.value = employee.position;
            }
        };

        if (employee?.department) {
            updatePositions(employee.department);
        }

        deptSelect?.addEventListener('change', () => {
            updatePositions(deptSelect.value);
        });

        document.getElementById('formCancelBtn')?.addEventListener('click', () => modal.close());

        document.getElementById('formSaveBtn')?.addEventListener('click', () => {
            if (this.validateForm()) {
                this.handleSaveForm(employee?.id);
                modal.close();
            }
        });

        setTimeout(() => document.getElementById('empName')?.focus(), 100);
    },

    validateForm() {
        const formData = {
            name: document.getElementById('empName')?.value?.trim() || '',
            employeeNo: document.getElementById('empNo')?.value?.trim() || '',
            department: document.getElementById('empDept')?.value || '',
            position: document.getElementById('empPosition')?.value || '',
            phone: document.getElementById('empPhone')?.value?.trim() || '',
            email: document.getElementById('empEmail')?.value?.trim() || '',
            entryDate: document.getElementById('empEntryDate')?.value || ''
        };

        const errors = {};

        if (!formData.name) {
            errors.name = '姓名不能为空';
        } else if (formData.name.length < 2) {
            errors.name = '姓名长度不能少于2个字';
        } else if (formData.name.length > 20) {
            errors.name = '姓名长度不能超过20个字';
        }

        if (!formData.employeeNo) {
            errors.employeeNo = '工号不能为空';
        }

        if (!formData.department) {
            errors.department = '请选择部门';
        }

        if (!formData.position) {
            errors.position = '请选择岗位';
        }

        if (!formData.phone) {
            errors.phone = '手机号不能为空';
        } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
            errors.phone = '手机号格式不正确';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '邮箱格式不正确';
        }

        if (!formData.entryDate) {
            errors.entryDate = '入职日期不能为空';
        }

        document.querySelectorAll('.validate-message').forEach(el => {
            el.textContent = '';
            el.className = 'validate-message';
        });
        document.querySelectorAll('.form-field input, .form-field select').forEach(el => {
            el.classList.remove('error');
        });

        Object.keys(errors).forEach(field => {
            const inputId = field === 'employeeNo' ? 'empNo' : 'emp' + field.charAt(0).toUpperCase() + field.slice(1);
            const input = document.getElementById(inputId);
            const msgEl = document.getElementById(inputId + 'Msg');

            if (input) input.classList.add('error');
            if (msgEl) {
                msgEl.className = 'validate-message error';
                msgEl.textContent = errors[field];
            }
        });

        if (Object.keys(errors).length > 0) {
            Toast.error('请检查表单填写');
            return false;
        }

        return true;
    },

    async handleSaveForm(editId = null) {
        const departmentName = document.getElementById('empDept').value;
        const positionName = document.getElementById('empPosition').value;
        
        const department = state.departments.find(d => d.name === departmentName);
        const position = state.positions.find(p => p.name === positionName);
        
        const formData = {
            name: document.getElementById('empName').value.trim(),
            employee_no: document.getElementById('empNo').value.trim() || `E${Date.now().toString().slice(-6)}`,
            department_id: department?.id || null,
            position_id: position?.id || null,
            phone: document.getElementById('empPhone').value.trim(),
            email: document.getElementById('empEmail').value.trim() || `${document.getElementById('empNo').value.trim()}@company.com`,
            hire_date: document.getElementById('empEntryDate').value,
            potential_tag: document.getElementById('empPotentialTag').value || '中坚',
            status: editId ? parseInt(document.getElementById('empStatus').value) : 1
        };

        try {
            if (editId) {
                await API.updateEmployee(editId, formData);
                Toast.success('员工信息更新成功');
            } else {
                await API.request('/employees', { method: 'POST', body: JSON.stringify(formData) });
                Toast.success('员工添加成功');
            }

            await API.triggerAlertCheck();
            Toast.info('已检查完成');

            await this.loadData();
            this.renderContent(document.getElementById('content'));
        } catch (error) {
            console.error('Save failed:', error);
            Toast.error('保存失败');
        }
    },

    async openDetailDrawer(employee) {
        const drawer = document.getElementById('detailDrawer');
        const content = document.getElementById('detailContent');

        let attendanceRecords = [];
        let stats = { normal: 0, late: 0, earlyLeave: 0, missing: 0, leaveDays: 0 };
        try {
            const res = await API.getAttendanceRecords({ employeeId: employee.id });
            if (res.code === 200) {
                attendanceRecords = res.data;
                attendanceRecords.forEach(r => {
                    if (r.status === '正常') stats.normal++;
                    else if (r.status === '迟到') stats.late++;
                    else if (r.status === '早退') stats.earlyLeave++;
                    else if (r.status === '缺卡') stats.missing++;
                });
            }
        } catch (error) {
            console.error('Failed to load attendance records', error);
        }

        let trainingRecords = [];
        let totalTrainingHours = 0;
        try {
            const trainingRes = await API.getTrainingRecords(employee.id);
            if (trainingRes.code === 200) {
                trainingRecords = trainingRes.data;
                totalTrainingHours = trainingRecords.reduce((sum, r) => sum + (r.actualHours || 0), 0);
            }
            const coursesRes = await API.getTrainingCourses();
            if (coursesRes.code === 200) {
                state.trainingCourses = coursesRes.data;
            }
        } catch (error) {
            console.error('Failed to load training records', error);
        }

        content.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">姓名</label>
                    <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${escapeHtml(employee.name)}</div>
                </div>
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">工号</label>
                    <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${escapeHtml(employee.employeeNo)}</div>
                </div>
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">部门</label>
                    <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${escapeHtml(employee.department)}</div>
                </div>
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">岗位</label>
                    <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${escapeHtml(employee.position)}</div>
                </div>
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">手机号</label>
                    <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${escapeHtml(employee.phone || '-')}</div>
                </div>
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">邮箱</label>
                    <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${escapeHtml(employee.email || '-')}</div>
                </div>
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">入职日期</label>
                    <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${escapeHtml(employee.entryDate || '-')}</div>
                </div>
                <div class="form-field">
                    <label style="color: #8ba9c4; font-size: 12px;">状态</label>
                    <div style="margin-top: 4px;">
                        <span class="status-tag ${employee.status === 1 ? 'active' : employee.status === 2 ? 'warning' : 'inactive'}">${employee.status === 1 ? '在职' : employee.status === 2 ? '试用期' : '离职'}</span>
                    </div>
                </div>
            </div>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(24, 144, 255, 0.1);">
                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 16px;">📊 考勤汇总</div>
                <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr);">
                    <div class="stat-card">
                        <div class="stat-icon blue">✅</div>
                        <div class="stat-info">
                            <div class="stat-label">正常出勤</div>
                            <div class="stat-value">${stats.normal}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange">⏰</div>
                        <div class="stat-info">
                            <div class="stat-label">迟到</div>
                            <div class="stat-value">${stats.late}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon purple">🏃</div>
                        <div class="stat-info">
                            <div class="stat-label">早退</div>
                            <div class="stat-value">${stats.earlyLeave}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon red">❌</div>
                        <div class="stat-info">
                            <div class="stat-label">缺卡</div>
                            <div class="stat-value">${stats.missing}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green">📋</div>
                        <div class="stat-info">
                            <div class="stat-label">请假天数</div>
                            <div class="stat-value">${stats.leaveDays}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(24, 144, 255, 0.1);">
                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 16px;">📚 培训记录</div>
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px;">
                    <div class="stat-card">
                        <div class="stat-icon blue">🎓</div>
                        <div class="stat-info">
                            <div class="stat-label">培训次数</div>
                            <div class="stat-value">${trainingRecords.length}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon green">⏱️</div>
                        <div class="stat-info">
                            <div class="stat-label">累计学时</div>
                            <div class="stat-value">${totalTrainingHours}</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon orange">⭐</div>
                        <div class="stat-info">
                            <div class="stat-label">平均满意度</div>
                            <div class="stat-value">${trainingRecords.length > 0 ? (trainingRecords.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / trainingRecords.length).toFixed(1) : '0.0'}</div>
                        </div>
                    </div>
                </div>
                ${trainingRecords.length > 0 ? `
                    <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>课程名称</th>
                                    <th>培训日期</th>
                                    <th>实际学时</th>
                                    <th>考核结果</th>
                                    <th>证书编号</th>
                                    <th>满意度</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${trainingRecords.map(r => {
                                    const course = state.trainingCourses.find(c => c.id === r.courseId);
                                    return `
                                        <tr>
                                            <td>${course?.name || '未知课程'}</td>
                                            <td>${r.trainingDate || '-'}</td>
                                            <td>${r.actualHours || 0}</td>
                                            <td><span class="status-tag ${r.assessmentResult === '优秀' ? 'active' : r.assessmentResult === '不及格' ? 'inactive' : 'warning'}">${r.assessmentResult || '-'}</span></td>
                                            <td>${r.certificateNo || '-'}</td>
                                            <td>${r.satisfaction ? r.satisfaction.toFixed(1) + ' ⭐' : '-'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div style="text-align: center; padding: 30px; color: #8ba9c4;">
                        <div style="font-size: 32px; margin-bottom: 8px;">📚</div>
                        <div>暂无培训记录</div>
                    </div>
                `}
            </div>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(24, 144, 255, 0.1);">
                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 16px;">📋 合同信息</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">合同类型</label>
                        <div style="color: #1a3a5c; margin-top: 4px;">${employee.contractType || '全职合同'}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">合同到期日</label>
                        <div style="color: #1a3a5c; margin-top: 4px;">${employee.contractEnd || '未设置'}</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(24, 144, 255, 0.1);">
                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 16px;">📊 人才盘点</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">潜力标签</label>
                        <div style="margin-top: 4px;">
                            <span class="status-tag ${employee.potentialTag === '高潜' ? 'active' : employee.potentialTag === '待提升' ? 'inactive' : 'info'}">${employee.potentialTag || '中坚'}</span>
                        </div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">入职年限</label>
                        <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${this.calculateYearsAtCompany(employee.entryDate)} 年</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(24, 144, 255, 0.1);">
                <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 16px;">📁 档案信息</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">身份证号</label>
                        <div style="color: #1a3a5c; margin-top: 4px;">${employee.idCard || '*******************'}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">学历</label>
                        <div style="color: #1a3a5c; margin-top: 4px;">${employee.education || '本科'}</div>
                    </div>
                </div>
            </div>
        `;

        drawer.classList.add('show');
    },

    closeDetailDrawer() {
        document.getElementById('detailDrawer')?.classList.remove('show');
    },

    calculateYearsAtCompany(entryDate) {
        if (!entryDate) return 0;
        const today = new Date();
        const entry = new Date(entryDate);
        let years = today.getFullYear() - entry.getFullYear();
        const monthDiff = today.getMonth() - entry.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < entry.getDate())) {
            years--;
        }
        return Math.max(0, years);
    },

    async removeFromTalentPool(employeeId) {
        try {
            await API.request(`/talent/talent-pool/${employeeId}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Failed to remove from talent pool:', error);
        }
    },

    openLeaveModal(employee) {
        const modal = Modal.open({
            title: '办理离职',
            content: `
                <form id="leaveForm">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; margin-bottom: 12px;">🚪</div>
                        <div style="font-size: 16px; color: #1a3a5c; font-weight: 600;">为员工【${employee.name}】办理离职</div>
                    </div>
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>离职日期 <span class="required">*</span></label>
                            <input type="date" id="leaveDate" value="${new Date().toISOString().split('T')[0]}">
                            <div class="validate-message" id="leaveDateMsg"></div>
                        </div>
                        <div class="form-field full">
                            <label>离职类型 <span class="required">*</span></label>
                            <select id="leaveType">
                                <option value="">请选择</option>
                                <option value="主动离职">主动离职</option>
                                <option value="被动离职">被动离职</option>
                                <option value="退休">退休</option>
                                <option value="其他">其他</option>
                            </select>
                            <div class="validate-message" id="leaveTypeMsg"></div>
                        </div>
                        <div class="form-field full">
                            <label>离职原因</label>
                            <textarea id="leaveReason" rows="3" placeholder="请输入离职原因（可选）" style="width: 100%; padding: 10px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 12px; font-size: 14px; resize: vertical;"></textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default" id="leaveCancelBtn">取消</button>
                <button class="btn btn-danger" id="leaveConfirmBtn">确认离职</button>
            `
        });

        document.getElementById('leaveCancelBtn')?.addEventListener('click', () => modal.close());

        document.getElementById('leaveConfirmBtn')?.addEventListener('click', async () => {
            const leaveDate = document.getElementById('leaveDate').value;
            const leaveType = document.getElementById('leaveType').value;

            let valid = true;

            if (!leaveDate) {
                document.getElementById('leaveDateMsg').textContent = '请选择离职日期';
                document.getElementById('leaveDateMsg').className = 'validate-message error';
                document.getElementById('leaveDate').classList.add('error');
                valid = false;
            }

            if (!leaveType) {
                document.getElementById('leaveTypeMsg').textContent = '请选择离职类型';
                document.getElementById('leaveTypeMsg').className = 'validate-message error';
                document.getElementById('leaveType').classList.add('error');
                valid = false;
            }

            if (valid) {
                try {
                    const transferRes = await API.createTransfer({
                        employeeId: employee.id,
                        employeeName: employee.name,
                        type: '离职',
                        oldValue: `${employee.department}-${employee.position}`,
                        newValue: '-',
                        reason: `${leaveType}：${document.getElementById('leaveReason').value || '个人原因'}`,
                        applyDate: leaveDate
                    });

                    if (transferRes.code === 200) {
                        Toast.success('离职申请已提交，请等待审批');

                        const index = state.employees.findIndex(e => e.id === employee.id);
                        if (index > -1) {
                            state.employees[index] = {
                                ...state.employees[index],
                                status: 0,
                                leaveDate,
                                leaveType,
                                leaveReason: document.getElementById('leaveReason').value
                            };
                        }

                        await this.removeFromTalentPool(employee.id);

                        window.dispatchEvent(new CustomEvent('employeeStatusChanged', {
                            detail: { employee, action: 'leave', transfer: transferRes.data }
                        }));
                    } else {
                        Toast.error(transferRes.message || '离职申请提交失败');
                    }
                } catch (error) {
                    console.error('Leave application failed:', error);
                    Toast.error('离职申请提交失败');
                }

                modal.close();
                this.applyFilters();
                this.renderContent(document.getElementById('content'));
            }
        });
    },

    async handleDelete(employee) {
        Modal.confirm(
            `确定要删除员工【${employee.name}】吗？此操作不可恢复。`,
            async () => {
                try {
                    await API.deleteEmployee(employee.id);
                    state.selectedIds = state.selectedIds.filter(id => id !== employee.id);
                    Toast.success('员工删除成功');
                    await this.loadData();
                    this.renderContent(document.getElementById('content'));
                } catch (error) {
                    console.error('Delete failed:', error);
                    Toast.error('删除失败');
                }
            }
        );
    },

    async handleBatchDelete() {
        if (state.selectedIds.length === 0) {
            Toast.warning('请先选择要删除的员工');
            return;
        }

        Modal.confirm(
            `确定要删除选中的 ${state.selectedIds.length} 名员工吗？此操作不可恢复。`,
            async () => {
                const total = state.selectedIds.length;
                let successCount = 0;
                let failCount = 0;
                const batchSize = 5;

                for (let i = 0; i < total; i += batchSize) {
                    const batch = state.selectedIds.slice(i, i + batchSize);
                    const currentStart = i + 1;
                    const currentEnd = Math.min(i + batchSize, total);
                    
                    Toast.info(`正在删除 ${currentStart}/${total}...`);

                    const results = await Promise.allSettled(
                        batch.map(id => API.deleteEmployee(id))
                    );

                    results.forEach(result => {
                        if (result.status === 'fulfilled') {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    });
                }

                state.selectedIds = [];
                await this.loadData();
                this.renderContent(document.getElementById('content'));

                if (failCount === 0) {
                    Toast.success(`成功删除 ${successCount} 名员工`);
                } else {
                    Toast.info(`删除完成：成功 ${successCount} 人，失败 ${failCount} 人`);
                }
            }
        );
    },

    handleBatchExport() {
        if (state.selectedIds.length === 0) {
            Toast.warning('请先选择要导出的员工');
            return;
        }

        const selectedEmployees = state.employees.filter(e => state.selectedIds.includes(e.id));
        const csvContent = [
            ['工号', '姓名', '部门', '岗位', '手机号', '入职日期', '状态'].join(','),
            ...selectedEmployees.map(e => [
                e.employeeNo, e.name, e.department, e.position, e.phone || '', e.entryDate || '', e.status === 1 ? '在职' : '离职'
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `员工列表_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        Toast.success(`已导出 ${selectedEmployees.length} 名员工信息`);
    },

    updateBatchActionsBar() {
        const bar = document.getElementById('batchActionsBar');
        const countSpan = bar?.querySelector('.selected-count');
        if (bar) {
            bar.style.display = state.selectedIds.length > 0 ? 'flex' : 'none';
        }
        if (countSpan) {
            countSpan.textContent = state.selectedIds.length;
        }
    },

    renderPagination() {
        Pagination.render('pagination', {
            current: state.currentPage,
            total: state.filteredList.length,
            pageSize: state.pageSize,
            onPageChange: (page) => {
                state.currentPage = page;
                this.renderContent(document.getElementById('content'));
            }
        });
    },

    destroy() {
        this.closeDetailDrawer();
        if (this.orgDataChangeHandler) {
            window.removeEventListener('orgDataChanged', this.orgDataChangeHandler);
        }
        if (this.hrModuleApprovalHandler) {
            window.removeEventListener('transferApproved', this.hrModuleApprovalHandler);
        }
        if (this.dataImportCompleteHandler) {
            window.removeEventListener('dataImportComplete', this.dataImportCompleteHandler);
        }
    }
};

export default employeeModule;