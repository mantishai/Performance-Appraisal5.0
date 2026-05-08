import { Toast, Modal, Pagination, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    departments: [],
    positions: [],
    keyPositions: [],
    expandedIds: [],
    selectedDept: null,
    loading: false
};

const orgModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderCard();
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        state.loading = true;
        try {
            const [deptRes, posRes, keyPosRes] = await Promise.all([
                API.getOrgDepartments(),
                API.getOrgPositions(),
                API.getKeyPositions()
            ]);

            if (deptRes.code === 200) {
                state.departments = deptRes.data;
            }
            if (posRes.code === 200) {
                state.positions = posRes.data;
            }
            if (keyPosRes.code === 200) {
                state.keyPositions = keyPosRes.data;
            }

            if (state.expandedIds.length === 0 && state.departments.length > 0) {
                state.expandedIds = state.departments.filter(d => !d.parentId).map(d => d.id);
            }
        } catch (error) {
            console.error('Failed to load org data:', error);
            Toast.error('组织架构数据加载失败');
        }
        state.loading = false;
    },

    renderContent(container) {
        const selectedDept = state.selectedDept ? state.departments.find(d => d.id === state.selectedDept) : null;
        const deptPositions = selectedDept ? state.positions.filter(p => p.departmentId === selectedDept.id) : [];

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">组织架构</h1>
                <button class="btn btn-primary" id="addDeptBtn">+ 新增部门</button>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px;">
                <div class="card" style="padding: 20px;">
                    <div class="card-header">部门结构</div>
                    <div style="max-height: 600px; overflow-y: auto; padding: 8px;">
                        ${this.renderDeptTree(state.departments.filter(d => !d.parentId))}
                    </div>
                </div>

                <div class="card" style="padding: 20px;">
                    ${selectedDept ? `
                        <div class="card-header">
                            <span>${selectedDept.name} - 岗位列表</span>
                            <button class="btn btn-sm btn-default" id="addPositionBtn">+ 新增岗位</button>
                        </div>
                        <div style="margin-bottom: 16px; display: flex; gap: 12px;">
                            <div style="flex: 1; padding: 12px; background: rgba(24,144,255,0.05); border-radius: 8px;">
                                <div style="color: #8ba9c4; font-size: 12px;">部门经理</div>
                                <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${selectedDept.manager || '-'}</div>
                            </div>
                            <div style="flex: 1; padding: 12px; background: rgba(24,144,255,0.05); border-radius: 8px;">
                                <div style="color: #8ba9c4; font-size: 12px;">员工数量</div>
                                <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${selectedDept.employeeCount || 0}人</div>
                            </div>
                            <div style="flex: 1; padding: 12px; background: rgba(24,144,255,0.05); border-radius: 8px;">
                                <div style="color: #8ba9c4; font-size: 12px;">岗位数量</div>
                                <div style="font-weight: 600; color: #1a3a5c; margin-top: 4px;">${deptPositions.length}个</div>
                            </div>
                        </div>

                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>岗位名称</th>
                                        <th>职级</th>
                                        <th>编制</th>
                                        <th>在职</th>
                                        <th>空缺</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${deptPositions.length > 0 ? deptPositions.map(pos => {
                                        const isKeyPosition = state.keyPositions.some(kp => kp.positionId === pos.id);
                                        return `
                                        <tr style="${isKeyPosition ? 'background: rgba(24,144,255,0.05);' : ''}">
                                            <td>
                                                <strong>${pos.name}</strong>
                                                ${isKeyPosition ? '<span class="status-tag active" style="margin-left:8px; font-size:11px;">关键岗位</span>' : ''}
                                            </td>
                                            <td>${pos.level || '-'}</td>
                                            <td>${pos.headcount || 0}</td>
                                            <td>${pos.current || 0}</td>
                                            <td>${pos.vacant > 0 ? `<span style="color: #f5222d;">${pos.vacant}</span>` : '0'}</td>
                                            <td>
                                                <div class="action-btns">
                                                    <button class="action-btn" data-action="editPos" data-id="${pos.id}">编辑</button>
                                                    <button class="action-btn" data-action="deletePos" data-id="${pos.id}" style="color: #f5222d;">删除</button>
                                                </div>
                                            </td>
                                        </tr>
                                        `;
                                    }).join('') : `
                                        <tr>
                                            <td colspan="6" style="text-align: center; padding: 40px; color: #8ba9c4;">暂无岗位，请点击上方按钮添加</td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>

                        <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-default btn-sm" id="editDeptBtn">编辑部门</button>
                            <button class="btn btn-danger btn-sm" id="deleteDeptBtn">删除部门</button>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 60px 20px;">
                            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">🏢</div>
                            <div style="color: #8ba9c4;">请点击左侧部门查看详情</div>
                        </div>
                    `}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    renderDeptTree(departments, level = 0) {
        if (!departments || departments.length === 0) {
            return '<div style="padding: 20px; text-align: center; color: #8ba9c4;">暂无部门数据</div>';
        }

        return departments.map(dept => {
            const children = state.departments.filter(d => d.parentId === dept.id);
            const isExpanded = state.expandedIds.includes(dept.id);
            const isSelected = state.selectedDept?.id === dept.id;
            const hasChildren = children.length > 0;

            return `
                <div style="margin-bottom: 4px;">
                    <div class="dept-item ${isSelected ? 'selected' : ''}"
                         style="display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: ${isSelected ? 'rgba(24,144,255,0.1)' : 'transparent'};"
                         data-id="${dept.id}">
                        ${hasChildren ? `
                            <span class="toggle-btn" data-id="${dept.id}" style="width: 20px; text-align: center; cursor: pointer; color: #8ba9c4; font-size: 12px;">
                                ${isExpanded ? '▼' : '▶'}
                            </span>
                        ` : `
                            <span style="width: 20px;"></span>
                        `}
                        <span style="font-size: 18px;">🏢</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; color: #1a3a5c; font-size: 14px;">${dept.name}</div>
                            <div style="font-size: 11px; color: #8ba9c4; margin-top: 2px;">经理: ${dept.manager || '-'} | ${dept.employeeCount || 0}人</div>
                        </div>
                    </div>
                    ${hasChildren && isExpanded ? `
                        <div style="margin-left: 28px; border-left: 1px dashed rgba(24,144,255,0.2); padding-left: 8px;">
                            ${this.renderDeptTree(children, level + 1)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    bindEvents() {
        document.getElementById('addDeptBtn')?.addEventListener('click', () => this.openDeptModal());

        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                if (state.expandedIds.includes(id)) {
                    state.expandedIds = state.expandedIds.filter(i => i !== id);
                } else {
                    state.expandedIds.push(id);
                }
                this.renderContent(document.getElementById('content'));
            });
        });

        document.querySelectorAll('.dept-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                state.selectedDept = state.departments.find(d => d.id === id);
                this.renderContent(document.getElementById('content'));
            });
        });

        if (state.selectedDept) {
            document.getElementById('addPositionBtn')?.addEventListener('click', () => this.openPositionModal());

            document.getElementById('editDeptBtn')?.addEventListener('click', () => {
                this.openDeptModal(state.selectedDept);
            });

            document.getElementById('deleteDeptBtn')?.addEventListener('click', () => {
                this.handleDeleteDept(state.selectedDept);
            });

            document.getElementById('content').addEventListener('click', (e) => {
                const btn = e.target.closest('.action-btn');
                if (btn) {
                    const id = parseInt(btn.dataset.id);
                    const action = btn.dataset.action;
                    if (action === 'editPos') {
                        const pos = state.positions.find(p => p.id === id);
                        this.openPositionModal(pos);
                    } else if (action === 'deletePos') {
                        this.handleDeletePosition(id);
                    }
                }
            });
        }
    },

    openDeptModal(dept = null) {
        const isEdit = !!dept;
        const title = isEdit ? '编辑部门' : '新增部门';
        const parentDepts = state.departments.filter(d => !dept || d.id !== dept.id);

        Modal.open({
            title,
            content: `
                <form id="deptForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>部门名称 <span class="required">*</span></label>
                            <input type="text" id="deptName" value="${dept?.name || ''}" placeholder="请输入部门名称">
                        </div>
                        <div class="form-field full">
                            <label>上级部门</label>
                            <select id="deptParent">
                                <option value="">无（顶级部门）</option>
                                ${parentDepts.map(d => `
                                    <option value="${d.id}" ${dept?.parentId === d.id ? 'selected' : ''}>${d.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-field full">
                            <label>部门经理</label>
                            <input type="text" id="deptManager" value="${dept?.manager || ''}" placeholder="请输入部门经理姓名">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default" id="deptCancelBtn">取消</button>
                <button class="btn btn-primary" id="deptSaveBtn">保存</button>
            `
        });

        document.getElementById('deptCancelBtn')?.addEventListener('click', () => {
            document.querySelector('.modal-overlay.show')?.remove();
        });

        document.getElementById('deptSaveBtn')?.addEventListener('click', async () => {
            const name = document.getElementById('deptName').value.trim();
            if (!name) {
                Toast.error('请输入部门名称');
                return;
            }

            const data = {
                name,
                parentId: document.getElementById('deptParent').value ? parseInt(document.getElementById('deptParent').value) : null,
                manager: document.getElementById('deptManager').value.trim()
            };

            try {
                if (isEdit) {
                    await API.updateDepartment(dept.id, data);
                    Toast.success('部门更新成功');
                } else {
                    await API.createDepartment(data);
                    Toast.success('部门创建成功');
                }
                document.querySelector('.modal-overlay.show')?.remove();
                await this.loadData();
                this.renderContent(document.getElementById('content'));
                this.notifyEmployeeModule();
            } catch (error) {
                Toast.error(error.message || '操作失败');
            }
        });
    },

    async handleDeleteDept(dept) {
        Modal.confirm(
            `确定要删除部门【${dept.name}】吗？`,
            async () => {
                try {
                    const res = await API.deleteDepartment(dept.id);
                    if (res.code === 400) {
                        Toast.error(res.message);
                        return;
                    }
                    Toast.success('部门删除成功');
                    state.selectedDept = null;
                    await this.loadData();
                    this.renderContent(document.getElementById('content'));
                    this.notifyEmployeeModule();
                } catch (error) {
                    Toast.error('删除失败');
                }
            }
        );
    },

    openPositionModal(position = null) {
        const isEdit = !!position;
        const title = isEdit ? '编辑岗位' : '新增岗位';

        Modal.open({
            title,
            content: `
                <form id="positionForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>岗位名称 <span class="required">*</span></label>
                            <input type="text" id="posName" value="${position?.name || ''}" placeholder="请输入岗位名称">
                        </div>
                        <div class="form-field">
                            <label>所属部门 <span class="required">*</span></label>
                            <select id="posDept" ${isEdit ? 'readonly' : ''} style="${isEdit ? 'background: #f5f5f5;' : ''}">
                                <option value="">请选择部门</option>
                                ${state.departments.map(d => `
                                    <option value="${d.id}" ${(isEdit ? position.departmentId : state.selectedDept?.id) === d.id ? 'selected' : ''}>${d.name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>职级</label>
                            <select id="posLevel">
                                <option value="P3" ${position?.level === 'P3' ? 'selected' : ''}>P3</option>
                                <option value="P4" ${position?.level === 'P4' ? 'selected' : ''}>P4</option>
                                <option value="P5" ${(!position || position.level === 'P5') ? 'selected' : ''}>P5</option>
                                <option value="P6" ${position?.level === 'P6' ? 'selected' : ''}>P6</option>
                                <option value="P7" ${position?.level === 'P7' ? 'selected' : ''}>P7</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>编制人数</label>
                            <input type="number" id="posHeadcount" value="${position?.headcount || 0}" min="0">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default" id="posCancelBtn">取消</button>
                <button class="btn btn-primary" id="posSaveBtn">保存</button>
            `
        });

        document.getElementById('posCancelBtn')?.addEventListener('click', () => {
            document.querySelector('.modal-overlay.show')?.remove();
        });

        document.getElementById('posSaveBtn')?.addEventListener('click', async () => {
            const name = document.getElementById('posName').value.trim();
            if (!name) {
                Toast.error('请输入岗位名称');
                return;
            }

            const data = {
                name,
                departmentId: parseInt(document.getElementById('posDept').value),
                level: document.getElementById('posLevel').value,
                headcount: parseInt(document.getElementById('posHeadcount').value) || 0
            };

            try {
                if (isEdit) {
                    await API.updatePosition(position.id, data);
                    Toast.success('岗位更新成功');
                } else {
                    await API.createPosition(data);
                    Toast.success('岗位创建成功');
                }
                document.querySelector('.modal-overlay.show')?.remove();
                await this.loadData();
                this.renderContent(document.getElementById('content'));
                this.notifyEmployeeModule();
            } catch (error) {
                Toast.error(error.message || '操作失败');
            }
        });
    },

    async handleDeletePosition(positionId) {
        const position = state.positions.find(p => p.id === positionId);
        const isKeyPosition = state.keyPositions.some(kp => kp.positionId === positionId);

        if (isKeyPosition) {
            Modal.confirm(
                `此岗位【${position.name}】已标记为关键岗位，确定要删除吗？`,
                async () => {
                    try {
                        const res = await API.deletePosition(positionId);
                        if (res.code === 400) {
                            Toast.error(res.message);
                            return;
                        }
                        Toast.success('岗位删除成功');
                        await this.loadData();
                        this.renderContent(document.getElementById('content'));
                        this.notifyEmployeeModule();
                    } catch (error) {
                        Toast.error('删除失败');
                    }
                },
                '关键岗位警告'
            );
        } else {
            Modal.confirm(
                `确定要删除岗位【${position.name}】吗？`,
                async () => {
                    try {
                        const res = await API.deletePosition(positionId);
                        if (res.code === 400) {
                            Toast.error(res.message);
                            return;
                        }
                        Toast.success('岗位删除成功');
                        await this.loadData();
                        this.renderContent(document.getElementById('content'));
                        this.notifyEmployeeModule();
                    } catch (error) {
                        Toast.error('删除失败');
                    }
                }
            );
        }
    },

    notifyEmployeeModule() {
        window.dispatchEvent(new CustomEvent('orgDataChanged'));
    },

    destroy() {}
};

export default orgModule;