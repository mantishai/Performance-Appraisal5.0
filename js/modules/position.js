import { Toast, Skeleton, Modal } from '../utils.js';
import API from '../api.js';

const state = {
    positions: [],
    departments: [],
    filteredList: [],
    currentPage: 1,
    pageSize: 10,
    loading: false
};

const positionModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 7);
        await this.loadData();
        this.renderContent(container);
        this.bindEvents();
    },

    async loadData() {
        state.loading = true;
        try {
            const [posRes, deptRes] = await Promise.all([
                API.getOrgPositions(),
                API.getDepartments()
            ]);

            if (posRes.code === 200) {
                state.positions = posRes.data || [];
            }
            if (deptRes.code === 200) {
                state.departments = deptRes.data || [];
            }
            state.filteredList = [...state.positions];
        } catch (error) {
            console.error('Failed to load positions:', error);
            Toast.error('岗位数据加载失败');
        } finally {
            state.loading = false;
        }
    },

    getDepartmentName(deptId) {
        const dept = state.departments.find(d => d.id === deptId);
        return dept ? dept.name : '未知部门';
    },

    renderContent(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">岗位管理</h1>
                <button class="btn btn-primary" id="addPositionBtn">+ 新增岗位</button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>岗位名称</th>
                                <th>所属部门</th>
                                <th>职级</th>
                                <th>编制人数</th>
                                <th>在职人数</th>
                                <th>空缺人数</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.filteredList.map(p => `
                                <tr>
                                    <td><strong>${escapeHtml(p.name)}</strong></td>
                                    <td>${escapeHtml(this.getDepartmentName(p.departmentId))}</td>
                                    <td>${escapeHtml(p.level || 'P5')}</td>
                                    <td>${p.headcount || 0}</td>
                                    <td>${p.current || 0}</td>
                                    <td>${(p.vacant || 0) > 0 ? `<span style="color: #f5222d; font-weight: 500;">${p.vacant}</span>` : p.vacant || 0}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn" data-id="${p.id}" data-action="viewManual">岗位说明书</button>
                                            <button class="action-btn" data-id="${p.id}" data-action="edit">编辑</button>
                                            <button class="action-btn" data-id="${p.id}" data-action="delete">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                            ${state.filteredList.length === 0 ? `
                                <tr>
                                    <td colspan="7" style="text-align: center; padding: 40px; color: #8ba9c4;">
                                        暂无岗位数据
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const self = this;
        
        const addBtn = document.getElementById('addPositionBtn');
        
        if (addBtn) {
            addBtn.onclick = function() {
                self.showPositionForm();
            };
        }

        document.getElementById('content')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                self.handleAction(id, action);
            }
        });
    },

    showPositionForm(position = null) {
        const isEdit = !!position;
        const title = isEdit ? '编辑岗位' : '新增岗位';

        const formHtml = `
            <form id="positionForm" class="form-grid" style="display: grid; gap: 16px; padding: 20px;">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">岗位名称 <span style="color: #f5222d;">*</span></label>
                    <input type="text" id="posName" value="${isEdit ? escapeHtml(position.name) : ''}" 
                           placeholder="请输入岗位名称" required
                           style="width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px;">
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">所属部门 <span style="color: #f5222d;">*</span></label>
                    <select id="posDept" required style="width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px;">
                        <option value="">请选择部门</option>
                        ${state.departments.map(d => `
                            <option value="${d.id}" ${isEdit && position.departmentId === d.id ? 'selected' : ''}>
                                ${escapeHtml(d.name)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">职级</label>
                    <input type="text" id="posLevel" value="${isEdit ? escapeHtml(position.level || 'P5') : 'P5'}" 
                           placeholder="如：P5、M1"
                           style="width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px;">
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">编制人数</label>
                    <input type="number" id="posHeadcount" value="${isEdit ? (position.headcount || 0) : 0}" 
                           min="0" placeholder="请输入编制人数"
                           style="width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px;">
                </div>
                <div class="form-group">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">岗位编码</label>
                    <input type="text" id="posCode" value="${isEdit ? escapeHtml(position.position_code || '') : ''}" 
                           placeholder="自动生成或手动输入"
                           style="width: 100%; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px;">
                </div>
            </form>
        `;

        const modalInstance = Modal.open({
            title: title,
            content: formHtml,
            footer: `
                <button type="button" class="btn btn-default" id="modalCancelBtn">取消</button>
                <button type="button" class="btn btn-primary" id="modalOkBtn">确定</button>
            `,
            width: 480
        });

        // 延迟绑定事件，确保DOM已经渲染
        setTimeout(() => {
            const cancelBtn = document.getElementById('modalCancelBtn');
            const okBtn = document.getElementById('modalOkBtn');
            
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    modalInstance.close();
                };
            }
            
            if (okBtn) {
                okBtn.onclick = async () => {
                    const name = document.getElementById('posName')?.value.trim();
                    const deptId = parseInt(document.getElementById('posDept')?.value);
                    const level = document.getElementById('posLevel')?.value.trim() || 'P5';
                    const headcount = parseInt(document.getElementById('posHeadcount')?.value) || 0;
                    const position_code = document.getElementById('posCode')?.value.trim() || '';

                    if (!name) {
                        Toast.error('请输入岗位名称');
                        return;
                    }
                    if (!deptId) {
                        Toast.error('请选择所属部门');
                        return;
                    }

                    try {
                        const data = { name, department_id: deptId, level, headcount, position_code };
                        let res;
                        if (isEdit) {
                            res = await API.updatePosition(position.id, data);
                        } else {
                            res = await API.createPosition(data);
                        }

                        if (res.code === 200) {
                            Toast.success(isEdit ? '岗位更新成功' : '岗位新增成功');
                            modalInstance.close();
                            await this.loadData();
                            this.renderContent(document.getElementById('content'));
                            this.bindEvents();
                        } else {
                            Toast.error(res.message || '操作失败');
                        }
                    } catch (error) {
                        console.error('Position save error:', error);
                        Toast.error('操作失败');
                    }
                };
            }
        }, 50);
    },

    async handleAction(id, action) {
        const position = state.positions.find(p => p.id === id);
        if (action === 'viewManual' && position) {
            // 默认以只读模式打开岗位说明书
            window.currentHrPositionId = `pos_${id}`;
            window.currentHrPositionReadOnly = true;
            
            // 先设置只读状态，确保按钮显示正确
            window.setPositionModalReadOnly(true);
            
            // 加载数据
            await window.loadHrPositionDesc();
            
            // 确保岗位名称正确显示
            if (position.name) {
                const titleEl = document.getElementById('hrPositionModalTitle');
                if (titleEl) {
                    titleEl.textContent = `📋 ${position.name}职责说明书`;
                }
                const nameInput = document.getElementById('hrPositionName');
                if (nameInput) {
                    nameInput.value = position.name;
                }
                const deptInput = document.getElementById('hrDepartment');
                if (deptInput && position.departmentId) {
                    const deptName = this.getDepartmentName(position.departmentId);
                    deptInput.value = deptName;
                }
                const levelInput = document.getElementById('hrLevel');
                if (levelInput && position.level) {
                    levelInput.value = position.level;
                }
                const codeInput = document.getElementById('hrPositionCode');
                if (codeInput && position.position_code) {
                    codeInput.value = position.position_code;
                }
            }
            
            // 最后显示弹窗
            document.getElementById('hrPositionModal').classList.add('show');
        } else if (action === 'edit' && position) {
            this.showPositionForm(position);
        } else if (action === 'delete' && position) {
            if (confirm(`确定要删除岗位【${position.name}】吗？`)) {
                try {
                    const res = await API.deletePosition(id);
                    if (res.code === 200) {
                        Toast.success('删除成功');
                        await this.loadData();
                        this.renderContent(document.getElementById('content'));
                        this.bindEvents();
                    } else {
                        Toast.error(res.message || '删除失败');
                    }
                } catch (error) {
                    console.error('Delete position error:', error);
                    Toast.error('删除失败');
                }
            }
        }
    },

    destroy() {}
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export default positionModule;