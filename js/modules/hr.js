import { Toast, Modal, Pagination, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    contracts: [],
    transfers: [],
    employees: [],
    currentTab: 'contract',
    selectedEmployee: null,
    archiveData: null
};

const hrModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 6);
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [contractRes, transferRes, empRes] = await Promise.all([
                API.getContracts(),
                API.getTransfers(),
                API.getEmployees()
            ]);
            if (contractRes.code === 200) state.contracts = contractRes.data;
            if (transferRes.code === 200) state.transfers = transferRes.data;
            if (empRes.code === 200) state.employees = empRes.data;
        } catch (error) {
            console.error('Failed to load HR data:', error);
            Toast.error('数据加载失败');
        }
    },

    renderContent(container) {
        const pendingCount = state.transfers.filter(t => t.status === 'pending').length;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">人事管理</h1>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'contract' ? 'btn-primary' : 'btn-default'}" data-tab="contract">📋 合同管理</button>
                    <button class="btn ${state.currentTab === 'transfer' ? 'btn-primary' : 'btn-default'}" data-tab="transfer">
                        🔄 入转调离 ${pendingCount > 0 ? `<span class="badge-count" style="margin-left: 6px;">${pendingCount}</span>` : ''}
                    </button>
                    <button class="btn ${state.currentTab === 'archive' ? 'btn-primary' : 'btn-default'}" data-tab="archive">📁 档案完整性</button>
                </div>

                ${state.currentTab === 'contract' ? this.renderContractTab() : ''}
                ${state.currentTab === 'transfer' ? this.renderTransferTab() : ''}
                ${state.currentTab === 'archive' ? this.renderArchiveTab() : ''}
            </div>
        `;

        this.bindEvents();
    },

    renderContractTab() {
        const today = new Date();
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

        return `
            <div style="margin-bottom: 20px;">
                <button class="btn btn-primary" id="addContractBtn">+ 新增合同</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>员工姓名</th>
                            <th>合同编号</th>
                            <th>类型</th>
                            <th>生效日期</th>
                            <th>到期日期</th>
                            <th>薪资</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.contracts.map(c => {
                            const endDate = new Date(c.endDate);
                            const isExpiring = endDate <= thirtyDaysLater && endDate >= today && c.status === 1;
                            return `
                                <tr style="${isExpiring ? 'background: rgba(245, 34, 45, 0.05);' : ''}">
                                    <td><strong>${c.employeeName}</strong></td>
                                    <td>${c.contractNo}</td>
                                    <td>${c.type}</td>
                                    <td>${c.startDate}</td>
                                    <td style="${isExpiring ? 'color: #f5222d; font-weight: bold;' : ''}">
                                        ${c.endDate} ${isExpiring ? '<span style="font-size: 11px; color: #f5222d;">⚠️ 即将到期</span>' : ''}
                                    </td>
                                    <td>¥${c.salary?.toLocaleString() || '-'}</td>
                                    <td><span class="status-tag ${c.status === 1 ? 'active' : 'inactive'}">${c.status === 1 ? '有效' : '已终止'}</span></td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn" data-action="viewContract" data-id="${c.id}">查看</button>
                                            ${c.status === 1 ? `
                                                <button class="action-btn" data-action="renewContract" data-id="${c.id}">续签</button>
                                                <button class="action-btn" data-action="terminateContract" data-id="${c.id}" style="color: #f5222d;">终止</button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderTransferTab() {
        const statusMap = { pending: 'pending', approved: 'active', rejected: 'rejected' };
        const statusText = { pending: '待审批', approved: '已通过', rejected: '已拒绝' };
        const pending = state.transfers.filter(t => t.status === 'pending');

        return `
            <div class="stats-grid" style="margin-bottom: 20px;">
                <div class="stat-card">
                    <div class="stat-icon orange">⏳</div>
                    <div class="stat-info">
                        <div class="stat-label">待审批</div>
                        <div class="stat-value">${pending.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">✅</div>
                    <div class="stat-info">
                        <div class="stat-label">本月通过</div>
                        <div class="stat-value">${state.transfers.filter(t => t.status === 'approved').length}</div>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <button class="btn btn-primary" id="addTransferBtn">+ 发起申请</button>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>申请类型</th>
                            <th>申请人</th>
                            <th>变更内容</th>
                            <th>申请日期</th>
                            <th>状态</th>
                            <th>审批人</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.transfers.map(t => `
                            <tr>
                                <td><span class="status-tag ${statusMap[t.status]}">${t.type}</span></td>
                                <td><strong>${t.employeeName}</strong></td>
                                <td>
                                    <div style="font-size: 12px; color: #8ba9c4;">从: ${t.oldValue}</div>
                                    <div style="font-size: 12px;">至: ${t.newValue}</div>
                                </td>
                                <td>${t.applyDate}</td>
                                <td><span class="status-tag ${statusMap[t.status]}">${statusText[t.status]}</span></td>
                                <td>${t.approver || '-'}</td>
                                <td>
                                    ${t.status === 'pending' ? `
                                        <div class="action-btns">
                                            <button class="action-btn" data-action="approveTransfer" data-id="${t.id}">通过</button>
                                            <button class="action-btn" data-action="rejectTransfer" data-id="${t.id}" style="color: #f5222d;">拒绝</button>
                                        </div>
                                    ` : '<span style="color: #8ba9c4;">-</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderArchiveTab() {
        return `
            <div style="display: grid; grid-template-columns: 300px 1fr; gap: 24px;">
                <div>
                    <div style="font-weight: 600; color: #1a3a5c; margin-bottom: 12px;">选择员工</div>
                    <select id="archiveEmployeeSelect" style="width: 100%; padding: 10px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 12px; font-size: 14px;">
                        <option value="">请选择员工</option>
                        ${state.employees.map(e => `
                            <option value="${e.id}">${e.name} - ${e.department}</option>
                        `).join('')}
                    </select>
                </div>

                <div id="archiveContent">
                    <div style="text-align: center; padding: 60px; color: #8ba9c4;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                        <div>请选择员工查看档案完整性</div>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                this.renderContent(document.getElementById('content'));
            });
        });

        if (state.currentTab === 'contract') {
            document.getElementById('addContractBtn')?.addEventListener('click', () => this.openContractModal());
        }

        if (state.currentTab === 'transfer') {
            document.getElementById('addTransferBtn')?.addEventListener('click', () => this.openTransferModal());
        }

        if (state.currentTab === 'archive') {
            document.getElementById('archiveEmployeeSelect')?.addEventListener('change', async (e) => {
                const empId = parseInt(e.target.value);
                if (empId) {
                    await this.loadArchive(empId);
                }
            });
        }

        document.getElementById('content').addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;
            const id = parseInt(btn.dataset.id);
            const action = btn.dataset.action;

            if (action === 'viewContract') this.viewContract(id);
            else if (action === 'renewContract') this.openRenewModal(id);
            else if (action === 'terminateContract') this.openTerminateModal(id);
            else if (action === 'approveTransfer') this.handleApproveTransfer(id);
            else if (action === 'rejectTransfer') this.handleRejectTransfer(id);
        });
    },

    async loadArchive(empId) {
        try {
            const res = await API.getArchive(empId);
            if (res.code === 200) {
                state.selectedEmployee = state.employees.find(e => e.id === empId);
                state.archiveData = res.data;
                this.renderArchiveContent();
            }
        } catch (error) {
            Toast.error('档案加载失败');
        }
    },

    renderArchiveContent() {
        const container = document.getElementById('archiveContent');
        if (!container || !state.archiveData) return;

        const complete = state.archiveData.items.filter(i => i.status === 'complete').length;
        const total = state.archiveData.items.length;
        const percent = Math.round((complete / total) * 100);

        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-weight: 600; color: #1a3a5c;">${state.selectedEmployee?.name} - 档案清单</span>
                    <span style="color: ${percent === 100 ? '#52c41a' : '#fa8c16'}; font-weight: 600;">${complete}/${total} 项完成</span>
                </div>
                <div style="height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
                    <div style="height: 100%; width: ${percent}%; background: ${percent === 100 ? '#52c41a' : '#1890ff'}; border-radius: 4px; transition: width 0.3s;"></div>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>材料名称</th>
                            <th>状态</th>
                            <th>上传日期</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.archiveData.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td><span class="status-tag ${item.status === 'complete' ? 'active' : 'inactive'}">${item.status === 'complete' ? '已上传' : '缺失'}</span></td>
                                <td>${item.date || '-'}</td>
                                <td>
                                    ${item.status === 'missing' ? `
                                        <button class="btn btn-sm btn-primary" data-action="uploadArchive" data-key="${item.key}">上传</button>
                                    ` : '<span style="color: #8ba9c4;">-</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.querySelectorAll('[data-action="uploadArchive"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleArchiveUpload(btn.dataset.key));
        });
    },

    async handleArchiveUpload(key) {
        const item = state.archiveData.items.find(i => i.key === key);
        if (item) {
            item.status = 'complete';
            item.date = new Date().toISOString().split('T')[0];
            await API.updateArchive(state.archiveData);
            Toast.success(`${item.name}已上传`);
            this.renderArchiveContent();
        }
    },

    openContractModal() {
        Modal.open({
            title: '新增合同',
            content: `
                <div class="form-grid">
                    <div class="form-field full">
                        <label>员工 <span class="required">*</span></label>
                        <select id="contractEmployee">
                            <option value="">请选择员工</option>
                            ${state.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field">
                        <label>合同编号 <span class="required">*</span></label>
                        <input type="text" id="contractNo" placeholder="系统自动生成" value="C${Date.now().toString().slice(-6)}">
                    </div>
                    <div class="form-field">
                        <label>合同类型</label>
                        <select id="contractType">
                            <option value="全职">全职</option>
                            <option value="兼职">兼职</option>
                            <option value="实习">实习</option>
                        </select>
                    </div>
                    <div class="form-field">
                        <label>生效日期 <span class="required">*</span></label>
                        <input type="date" id="contractStart">
                    </div>
                    <div class="form-field">
                        <label>到期日期 <span class="required">*</span></label>
                        <input type="date" id="contractEnd">
                    </div>
                    <div class="form-field">
                        <label>薪资</label>
                        <input type="number" id="contractSalary" placeholder="请输入月薪">
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveContractBtn">保存</button>
            `
        });

        document.getElementById('saveContractBtn')?.addEventListener('click', async () => {
            const employeeId = parseInt(document.getElementById('contractEmployee').value);
            const employee = state.employees.find(e => e.id === employeeId);
            if (!employee) {
                Toast.error('请选择员工');
                return;
            }

            const data = {
                employeeId,
                employeeName: employee.name,
                contractNo: document.getElementById('contractNo').value,
                type: document.getElementById('contractType').value,
                startDate: document.getElementById('contractStart').value,
                endDate: document.getElementById('contractEnd').value,
                salary: parseInt(document.getElementById('contractSalary').value) || 0
            };

            await API.createContract(data);
            Toast.success('合同创建成功');
            
            await API.triggerAlertCheck();
            Toast.info('已检查完成');
            
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    viewContract(id) {
        const contract = state.contracts.find(c => c.id === id);
        if (!contract) return;

        Modal.open({
            title: '合同详情',
            content: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-field"><label style="color: #8ba9c4;">员工姓名</label><div style="font-weight: 600; margin-top: 4px;">${contract.employeeName}</div></div>
                    <div class="form-field"><label style="color: #8ba9c4;">合同编号</label><div style="font-weight: 600; margin-top: 4px;">${contract.contractNo}</div></div>
                    <div class="form-field"><label style="color: #8ba9c4;">合同类型</label><div style="font-weight: 600; margin-top: 4px;">${contract.type}</div></div>
                    <div class="form-field"><label style="color: #8ba9c4;">薪资</label><div style="font-weight: 600; margin-top: 4px;">¥${contract.salary?.toLocaleString() || '-'}</div></div>
                    <div class="form-field"><label style="color: #8ba9c4;">生效日期</label><div style="font-weight: 600; margin-top: 4px;">${contract.startDate}</div></div>
                    <div class="form-field"><label style="color: #8ba9c4;">到期日期</label><div style="font-weight: 600; margin-top: 4px;">${contract.endDate}</div></div>
                    <div class="form-field"><label style="color: #8ba9c4;">状态</label><div style="margin-top: 4px;"><span class="status-tag ${contract.status === 1 ? 'active' : 'inactive'}">${contract.status === 1 ? '有效' : '已终止'}</span></div></div>
                </div>
            `
        });
    },

    openRenewModal(id) {
        const contract = state.contracts.find(c => c.id === id);
        if (!contract) return;

        Modal.open({
            title: '合同续签',
            content: `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px;">📝</div>
                    <div style="margin-top: 12px; color: #1a3a5c; font-weight: 600;">为【${contract.employeeName}】续签合同</div>
                </div>
                <div class="form-grid">
                    <div class="form-field full">
                        <label>新合同到期日期 <span class="required">*</span></label>
                        <input type="date" id="renewEndDate">
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="confirmRenewBtn">确认续签</button>
            `
        });

        document.getElementById('confirmRenewBtn')?.addEventListener('click', async () => {
            const endDate = document.getElementById('renewEndDate').value;
            if (!endDate) {
                Toast.error('请选择到期日期');
                return;
            }
            await API.renewContract(id, { endDate });
            Toast.success('合同续签成功');
            
            await API.triggerAlertCheck();
            Toast.info('已检查完成');
            
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    openTerminateModal(id) {
        const contract = state.contracts.find(c => c.id === id);
        if (!contract) return;

        Modal.open({
            title: '终止合同',
            content: `
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 48px; color: #f5222d;">⚠️</div>
                    <div style="margin-top: 12px; color: #1a3a5c; font-weight: 600;">确定要终止【${contract.employeeName}】的合同吗？</div>
                </div>
                <div class="form-grid">
                    <div class="form-field full">
                        <label>终止日期 <span class="required">*</span></label>
                        <input type="date" id="terminateDate" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-danger" id="confirmTerminateBtn">确认终止</button>
            `
        });

        document.getElementById('confirmTerminateBtn')?.addEventListener('click', async () => {
            const terminateDate = document.getElementById('terminateDate').value;
            await API.terminateContract(id, { terminateDate });
            Toast.success('合同已终止');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    openTransferModal() {
        Modal.open({
            title: '发起申请',
            content: `
                <div class="form-grid">
                    <div class="form-field full">
                        <label>员工 <span class="required">*</span></label>
                        <select id="transferEmployee">
                            <option value="">请选择员工</option>
                            ${state.employees.map(e => `<option value="${e.id}">${e.name} - ${e.department}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-field full">
                        <label>申请类型 <span class="required">*</span></label>
                        <select id="transferType">
                            <option value="">请选择</option>
                            <option value="转正">转正</option>
                            <option value="调动">调动</option>
                            <option value="离职">离职</option>
                        </select>
                    </div>
                    <div class="form-field full">
                        <label>变更内容 <span class="required">*</span></label>
                        <textarea id="transferReason" rows="3" placeholder="请输入变更原因或详细说明"></textarea>
                    </div>
                </div>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="submitTransferBtn">提交申请</button>
            `
        });

        document.getElementById('submitTransferBtn')?.addEventListener('click', async () => {
            const employeeId = parseInt(document.getElementById('transferEmployee').value);
            const employee = state.employees.find(e => e.id === employeeId);
            const type = document.getElementById('transferType').value;
            const reason = document.getElementById('transferReason').value;

            if (!employee || !type) {
                Toast.error('请填写完整信息');
                return;
            }

            let oldValue = '', newValue = '';
            if (type === '转正') {
                oldValue = '试用期';
                newValue = '正式员工';
            } else if (type === '调动') {
                oldValue = `${employee.department}-${employee.position}`;
                newValue = '新部门-新岗位';
            } else if (type === '离职') {
                oldValue = `${employee.department}-${employee.position}`;
                newValue = '-';
            }

            await API.createTransfer({
                employeeId, employeeName: employee.name,
                type, oldValue, newValue, reason
            });
            Toast.success('申请已提交');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    async handleApproveTransfer(id) {
        const transfer = state.transfers.find(t => t.id === id);
        await API.approveTransfer(id, '管理员');
        Toast.success('审批已通过');

        if (transfer?.type === '转正') {
            const empRes = await API.getEmployees();
            if (empRes.code === 200) {
                const emp = empRes.data.find(e => e.id === transfer.employeeId);
                if (emp) {
                    await API.updateEmployee(emp.id, { ...emp, probationEnd: null });
                }
            }
        }

        await this.loadData();
        this.renderContent(document.getElementById('content'));

        window.dispatchEvent(new CustomEvent('transferApproved', {
            detail: { transfer: { ...transfer, status: 'approved' } }
        }));
    },

    async handleRejectTransfer(id) {
        const transfer = state.transfers.find(t => t.id === id);
        await API.rejectTransfer(id, '管理员');
        Toast.warning('已拒绝');
        await this.loadData();
        this.renderContent(document.getElementById('content'));

        window.dispatchEvent(new CustomEvent('transferRejected', {
            detail: { transfer: { ...transfer, status: 'rejected' } }
        }));
    },

    destroy() {}
};

export default hrModule;