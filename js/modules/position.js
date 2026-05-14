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

function getPositionManualData(positionId) {
    try {
        const localData = localStorage.getItem('hrPositions');
        if (localData) {
            const positions = JSON.parse(localData);
            const key = `pos_${positionId}`;
            return positions[key] || null;
        }
    } catch (e) {
        console.error('Failed to get position manual data:', e);
    }
    return null;
}

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

    async loadDepartments() {
        try {
            const deptRes = await API.getDepartments();
            if (deptRes.code === 200) {
                state.departments = deptRes.data || [];
            }
        } catch (error) {
            console.error('Failed to load departments:', error);
        }
    },

    getDepartmentName(deptId) {
        const dept = state.departments.find(d => d.id === deptId);
        return dept ? dept.name : '未知部门';
    },

    getMergedPositionData(p) {
        const manualData = getPositionManualData(p.id);
        if (manualData && manualData.info) {
            return {
                ...p,
                name: manualData.info.positionName || p.name,
                departmentId: this.getDepartmentIdByName(manualData.info.department) || p.departmentId,
                level: manualData.info.level || p.level,
                headcount: manualData.info.headcount !== undefined ? manualData.info.headcount : p.headcount,
                position_code: manualData.info.positionCode || p.position_code
            };
        }
        return p;
    },

    getDepartmentIdByName(deptName) {
        if (!deptName) return null;
        const dept = state.departments.find(d => d.name === deptName);
        return dept ? dept.id : null;
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
                            ${state.filteredList.map(p => {
                                const merged = this.getMergedPositionData(p);
                                return `
                                <tr>
                                    <td><strong>${escapeHtml(merged.name)}</strong></td>
                                    <td>${escapeHtml(this.getDepartmentName(merged.departmentId))}</td>
                                    <td>${escapeHtml(merged.level || 'P5')}</td>
                                    <td>${merged.headcount || 0}</td>
                                    <td>${merged.current || 0}</td>
                                    <td>${(merged.vacant || 0) > 0 ? `<span style="color: #f5222d; font-weight: 500;">${merged.vacant}</span>` : merged.vacant || 0}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn" data-id="${merged.id}" data-action="viewManual">岗位说明书</button>
                                            <button class="action-btn" data-id="${merged.id}" data-action="delete">删除</button>
                                        </div>
                                    </td>
                                </tr>
                            `}).join('')}
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
                const table = btn.closest('table');
                if (!table || !table.classList.contains('data-table')) return;
                
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
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="posDeptName" 
                               value="${isEdit ? state.departments.find(d => d.id === position.departmentId)?.name || '' : ''}"
                               placeholder="手动输入部门名称或从下拉选择"
                               style="flex: 1; padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px;">
                        <select id="posDept" style="padding: 10px 12px; border: 1px solid #d9d9d9; border-radius: 6px; min-width: 120px;">
                            <option value="">选择部门</option>
                            ${state.departments.map(d => `
                                <option value="${d.id}" ${isEdit && position.departmentId === d.id ? 'selected' : ''}>
                                    ${escapeHtml(d.name)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <button type="button" id="addNewDeptBtn" style="margin-top: 8px; padding: 6px 12px; font-size: 12px; color: #1890ff; border: 1px dashed #1890ff; border-radius: 4px; background: transparent; cursor: pointer;">
                        + 新增部门
                    </button>
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
                    const deptName = document.getElementById('posDeptName')?.value.trim();
                    const level = document.getElementById('posLevel')?.value.trim() || 'P5';
                    const headcount = parseInt(document.getElementById('posHeadcount')?.value) || 0;
                    const position_code = document.getElementById('posCode')?.value.trim() || '';

                    if (!name) {
                        Toast.error('请输入岗位名称');
                        return;
                    }

                    let selectedDeptId = deptId;

                    if (!deptId && !deptName) {
                        Toast.error('请选择所属部门或输入部门名称');
                        return;
                    }

                    try {
                        if (!deptId && deptName) {
                            const existingDept = state.departments.find(d => d.name === deptName);
                            if (existingDept) {
                                selectedDeptId = existingDept.id;
                            } else {
                                const createRes = await API.createDepartment({ name: deptName });
                                if (createRes.code === 200) {
                                    selectedDeptId = createRes.data.id;
                                    Toast.success('部门创建成功');
                                    await self.loadDepartments();
                                } else {
                                    Toast.error(createRes.message || '部门创建失败');
                                    return;
                                }
                            }
                        }

                        const data = { name, department_id: selectedDeptId, level, headcount, position_code };
                        let res;
                        if (isEdit) {
                            res = await API.updatePosition(position.id, data);
                        } else {
                            res = await API.createPosition(data);
                        }

                        if (res.code === 200) {
                            Toast.success(isEdit ? '岗位更新成功' : '岗位新增成功');
                            
                            // 如果是新增岗位，同时创建岗位说明书
                            if (!isEdit) {
                                try {
                                    const newPositionId = res.data.id;
                                    const deptName = this.getDepartmentName(selectedDeptId);
                                    
                                    const positionDescData = {
                                        position_id: newPositionId,
                                        position_name: name,
                                        job_title: name,
                                        level: level,
                                        department: deptName,
                                        dept_type: '',
                                        dept_nature: '',
                                        supervisor: '',
                                        cross_supervisor: '',
                                        direct_subordinates: 0,
                                        indirect_subordinates: 0,
                                        promotion_direction: '',
                                        rotation_position: '',
                                        effective_date: new Date().toISOString().split('T')[0],
                                        approver: '',
                                        position_code: position_code,
                                        headcount: headcount,
                                        summary: '',
                                        purpose: '',
                                        work_time: '周一至周五，9:00-18:00',
                                        work_place: '公司总部',
                                        work_env: '办公室环境',
                                        risk_level: '低',
                                        occupational_hazard: '',
                                        documents: '',
                                        duties: [{
                                            module: '',
                                            category: '',
                                            workType: '核心',
                                            detail: ''
                                        }],
                                        qualification: {
                                            education: '',
                                            training: '',
                                            experience: '',
                                            skills: '',
                                            otherRequirements: ''
                                        },
                                        metrics: [{
                                            dimension: '',
                                            metric: '',
                                            standard: '',
                                            source: ''
                                        }]
                                    };
                                    
                                    // 创建岗位说明书
                                    await API.createPositionDescription(positionDescData);
                                } catch (err) {
                                    console.error('Create position description error:', err);
                                    // 不影响岗位创建成功的结果
                                }
                            }
                            
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

            const addNewDeptBtn = document.getElementById('addNewDeptBtn');
            if (addNewDeptBtn) {
                addNewDeptBtn.onclick = () => {
                    const newDeptName = prompt('请输入新部门名称：');
                    if (newDeptName && newDeptName.trim()) {
                        API.createDepartment({ name: newDeptName.trim() }).then(res => {
                            if (res.code === 200) {
                                Toast.success('部门创建成功');
                                self.loadDepartments().then(() => {
                                    const deptSelect = document.getElementById('posDept');
                                    if (deptSelect) {
                                        const option = document.createElement('option');
                                        option.value = res.data.id;
                                        option.textContent = newDeptName.trim();
                                        option.selected = true;
                                        deptSelect.appendChild(option);
                                        document.getElementById('posDeptName').value = newDeptName.trim();
                                    }
                                });
                            } else {
                                Toast.error(res.message || '部门创建失败');
                            }
                        }).catch(() => {
                            Toast.error('部门创建失败');
                        });
                    }
                };
            }

            const posDeptSelect = document.getElementById('posDept');
            if (posDeptSelect) {
                posDeptSelect.onchange = () => {
                    const selectedId = parseInt(posDeptSelect.value);
                    const selectedDept = state.departments.find(d => d.id === selectedId);
                    if (selectedDept) {
                        document.getElementById('posDeptName').value = selectedDept.name;
                    } else {
                        document.getElementById('posDeptName').value = '';
                    }
                };
            }
        }, 50);
    },

    async handleAction(id, action) {
        const position = state.positions.find(p => p.id === id);
        if (action === 'viewManual' && position) {
            // 查找该岗位的岗位说明书ID
            let positionDescId = null;
            try {
                const res = await API.getPositionDescriptionList();
                if (res.code === 200 && res.data) {
                    const existingDesc = res.data.find(d => d.position_id === id);
                    if (existingDesc) {
                        positionDescId = existingDesc.id;
                    }
                }
            } catch (err) {
                console.error('Find position description error:', err);
            }
            
            // 如果有岗位说明书，使用ID打开；如果没有，创建临时模板
            if (positionDescId) {
                window.openReadOnlyPositionModal(positionDescId);
            } else {
                // 创建临时默认模板
                const deptName = this.getDepartmentName(position.departmentId);
                const defaultData = {
                    id: 0,
                    position_code: position.position_code || '',
                    position_name: position.name,
                    job_title: position.name,
                    level: position.level || 'P5',
                    department: deptName,
                    dept_type: '',
                    dept_nature: '',
                    supervisor: '',
                    cross_supervisor: '',
                    direct_subordinates: 0,
                    indirect_subordinates: 0,
                    promotion_direction: '',
                    rotation_position: '',
                    effective_date: new Date().toISOString().split('T')[0],
                    approver: '',
                    headcount: position.headcount || 0,
                    summary: '',
                    purpose: '',
                    work_time: '周一至周五，9:00-18:00',
                    work_place: '公司总部',
                    work_env: '办公室环境',
                    risk_level: '低',
                    occupational_hazard: '',
                    documents: '',
                    duties: [{ module: '', category: '', workType: '核心', detail: '' }],
                    qualification: { education: '', training: '', experience: '', skills: '', otherRequirements: '' },
                    metrics: [{ dimension: '', metric: '', standard: '', source: '' }]
                };
                
                // 使用position_id作为临时标识
                window.currentHrPositionId = position.id;
                window.openReadOnlyPositionModal(position.id);
                
                // 延迟应用默认数据
                setTimeout(() => {
                    window.applyPositionDataFromAPI(defaultData);
                }, 100);
            }
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

window.refreshPositionList = function() {
    positionModule.loadData().then(() => {
        const container = document.getElementById('content');
        if (container) {
            positionModule.renderContent(container);
            positionModule.bindEvents();
        }
    });
};