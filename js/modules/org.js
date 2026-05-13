var API;

function loadAPI(callback) {
    import('../api.js').then(function(m) {
        API = m.default || m;
        if (callback) callback();
    }).catch(function(e) {
        console.error('Failed to load API:', e);
        if (callback) callback();
    });
}

var state = { departments: [], positions: [], employees: [], statistics: {} };

var orgModule = {
    render: function(container) {
        var self = this;
        window.orgModule = self;
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><div class="loading-text">加载数据...</div></div>';
        
        loadAPI(function() {
            self.loadInitialData(function() {
                var selectedType = window.orgSelectedType || 'dashboard';
                var selectedId = window.orgSelectedId || null;
                
                if (selectedType === 'dept' && selectedId) {
                    container.innerHTML = self.renderDeptDetail(selectedId);
                    self.bindDeptDetailEvents(selectedId);
                } else if (selectedType === 'position' && selectedId) {
                    window.currentHrPositionId = 'pos_' + selectedId;
                    window.openReadOnlyPositionModal('pos_' + selectedId);
                    container.innerHTML = self.renderDashboard();
                } else if (selectedType === 'employee' && selectedId) {
                    var emp = state.employees.find(function(e) { return e.id === selectedId; });
                    if (emp) {
                        import('./employee-detail.js').then(function(m) {
                            m.default.open(emp);
                        });
                    }
                    container.innerHTML = self.renderDashboard();
                } else {
                    container.innerHTML = self.renderDashboard();
                }
                
                window.orgSelectedType = null;
                window.orgSelectedId = null;
            });
        });
    },

    loadInitialData: function(callback) {
        var completed = 0;
        var total = 4;

        function checkComplete() {
            completed++;
            if (completed >= total && callback) callback();
        }

        API.getOrgDepartments().then(function(r) {
            if (r.code === 200) state.departments = r.data;
            checkComplete();
        }).catch(checkComplete);

        API.getOrgStatistics().then(function(r) {
            if (r.code === 200) state.statistics = r.data;
            checkComplete();
        }).catch(checkComplete);

        API.getOrgPositions().then(function(r) {
            if (r.code === 200) state.positions = r.data.list || r.data || [];
            checkComplete();
        }).catch(checkComplete);

        API.getOrgEmployees().then(function(r) {
            if (r.code === 200) state.employees = r.data;
            checkComplete();
        }).catch(checkComplete);
    },

    renderDashboard: function() {
        var depts = state.departments;
        var stats = state.statistics;
        var totalHeadcount = 0;
        var totalOnboard = state.employees.length;
        
        for (var i = 0; i < state.positions.length; i++) {
            totalHeadcount += (state.positions[i].headcount || 0);
        }

        var statsHtml = '<div class="dashboard-stats-grid">';
        statsHtml += '<div class="stat-card"><div class="stat-icon">🏢</div><div class="stat-info"><div class="stat-value">' + (stats.totalDepartments || depts.length) + '</div><div class="stat-label">部门总数</div></div></div>';
        statsHtml += '<div class="stat-card"><div class="stat-icon">👤</div><div class="stat-info"><div class="stat-value">' + (stats.totalEmployees || totalOnboard) + '</div><div class="stat-label">员工总数</div></div></div>';
        statsHtml += '<div class="stat-card"><div class="stat-icon">📋</div><div class="stat-info"><div class="stat-value">' + (stats.totalPositions || state.positions.length) + '</div><div class="stat-label">岗位总数</div></div></div>';
        statsHtml += '<div class="stat-card"><div class="stat-icon">📊</div><div class="stat-info"><div class="stat-value">' + totalOnboard + '/' + totalHeadcount + '</div><div class="stat-label">编制情况</div></div></div>';
        statsHtml += '</div>';

        var treeHtml = '<div class="dashboard-sidebar"><div class="org-tree-wrapper"><div class="tree-header"><h3>组织架构</h3><button class="add-dept-btn" onclick="orgModule.showAddDeptModal()">+ 新增部门</button></div><div class="tree-content">';
        treeHtml += this.renderOrgTree(depts, 0);
        treeHtml += '</div></div></div>';

        var positionsHtml = '<div class="section-card"><div class="section-header"><h2>岗位情况</h2><span class="section-count">' + state.positions.length + ' 个岗位</span></div><div class="positions-grid">';
        for (var k = 0; k < state.positions.length; k++) {
            var pos = state.positions[k];
            var d = depts.find(function(d) { return d.id === pos.departmentId; });
            var emps = state.employees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; });
            var empCount = emps.length;
            var headcount = pos.headcount || 0;
            var percent = headcount > 0 ? Math.round((empCount / headcount) * 100) : 0;
            positionsHtml += '<div class="position-card" onclick="window.orgSelectedType=\'position\';window.orgSelectedId=' + pos.id + ';switchModule(\'org\')"><div class="card-header"><span class="position-name">' + pos.name + '</span><span class="position-badge' + (empCount < headcount ? ' vacant' : '') + '">' + (empCount < headcount ? '有空缺' : '已满编') + '</span></div><div class="card-body"><div class="info-row"><span class="info-label">所属部门</span><span class="info-value">' + (d ? d.name : '-') + '</span></div><div class="info-row"><span class="info-label">岗位编码</span><span class="info-value">' + (pos.code || '-') + '</span></div></div><div class="card-footer"><div class="progress-bar"><div class="progress-fill" style="width:' + percent + '%"></div></div><span class="progress-text">' + empCount + '/' + headcount + '</span></div></div>';
        }
        positionsHtml += '</div></div>';

        var employeesHtml = '<div class="section-card"><div class="section-header"><h2>人员情况</h2><span class="section-count">' + state.employees.length + ' 名员工</span></div><div class="employees-grid">';
        for (var m = 0; m < state.employees.length; m++) {
            var emp = state.employees[m];
            var d = depts.find(function(d) { return d.id === emp.departmentId; });
            var p = state.positions.find(function(p) { return p.id === emp.positionId || p.id === emp.position_id; });
            var avatarColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            employeesHtml += '<div class="employee-card" onclick="window.orgSelectedType=\'employee\';window.orgSelectedId=' + emp.id + ';switchModule(\'org\')"><div class="emp-avatar" style="background:' + avatarColor + '">' + (emp.name ? emp.name.charAt(0) : '?') + '</div><div class="emp-info"><div class="emp-name">' + emp.name + '</div><div class="emp-position">' + (p ? p.name : '-') + '</div><div class="emp-department">' + (d ? d.name : '-') + '</div></div><span class="emp-status ' + (emp.status === 1 ? 'active' : 'inactive') + '">' + (emp.status === 1 ? '在职' : '离职') + '</span></div>';
        }
        employeesHtml += '</div></div>';

        return '<div class="org-dashboard"><div class="dashboard-header"><div class="header-left"><h1>组织架构看板</h1><p class="header-desc">查看公司部门、岗位和人员的整体架构</p></div></div>' + statsHtml + '<div class="dashboard-main">' + treeHtml + '<div class="dashboard-content">' + positionsHtml + employeesHtml + '</div></div></div>';
    },

    renderOrgTree: function(departments, level) {
        var html = '';
        for (var i = 0; i < departments.length; i++) {
            var dept = departments[i];
            var deptPositions = state.positions.filter(function(p) { return p.departmentId === dept.id; });
            
            html += '<div class="dept-node"><div class="dept-header"><span class="dept-icon">🏢</span><span class="dept-name" onclick="window.orgSelectedType=\'dept\';window.orgSelectedId=' + dept.id + ';switchModule(\'org\')">' + dept.name + '</span><span class="dept-badge">' + deptPositions.length + '</span><div class="dept-actions"><button class="dept-action-btn edit-btn" onclick="event.stopPropagation();orgModule.showDeptEditModal(' + dept.id + ')" title="编辑"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></button><button class="dept-action-btn delete-btn" onclick="event.stopPropagation();orgModule.confirmDeleteDept(' + dept.id + ')" title="删除"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button><button class="dept-action-btn add-btn" onclick="event.stopPropagation();orgModule.showAddDeptModal(' + dept.id + ')" title="新增子部门"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button></div></div>';
            
            if (deptPositions.length > 0) {
                html += '<div class="dept-positions">';
                for (var j = 0; j < deptPositions.length; j++) {
                    var pos = deptPositions[j];
                    var posEmps = state.employees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; });
                    html += '<div class="position-mini" onclick="event.stopPropagation();window.orgSelectedType=\'position\';window.orgSelectedId=' + pos.id + ';switchModule(\'org\')"><span class="pos-icon">📋</span><span class="pos-name">' + pos.name + '</span><span class="pos-count">' + posEmps.length + '/' + (pos.headcount || 0) + '</span></div>';
                }
                html += '</div>';
            }
            
            if (dept.children && dept.children.length > 0) {
                html += this.renderOrgTree(dept.children, level + 1);
            }
            html += '</div>';
        }
        return html;
    },

    renderDeptDetail: function(deptId) {
        var dept = state.departments.find(function(d) { return d.id === deptId; });
        if (!dept) return '<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-text">找不到该部门</div></div>';

        var deptPositions = state.positions.filter(function(p) { return p.departmentId === deptId; });
        var deptEmployees = state.employees.filter(function(e) { return e.departmentId === deptId; });

        var posList = '';
        for (var i = 0; i < deptPositions.length; i++) {
            var pos = deptPositions[i];
            var emps = state.employees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; });
            posList += '<div class="position-mini" onclick="window.orgSelectedType=\'position\';window.orgSelectedId=' + pos.id + ';switchModule(\'org\')"><span class="pos-icon">📋</span><span class="pos-name">' + pos.name + '</span><span class="pos-count">' + emps.length + '/' + (pos.headcount || 0) + '</span></div>';
        }

        var empList = '';
        for (var j = 0; j < deptEmployees.length; j++) {
            var emp = deptEmployees[j];
            var p = state.positions.find(function(p) { return p.id === emp.positionId || p.id === emp.position_id; });
            var avatarColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
            empList += '<div class="employee-card" onclick="window.orgSelectedType=\'employee\';window.orgSelectedId=' + emp.id + ';switchModule(\'org\')"><div class="emp-avatar" style="background:' + avatarColor + '">' + (emp.name ? emp.name.charAt(0) : '?') + '</div><div class="emp-info"><div class="emp-name">' + emp.name + '</div><div class="emp-position">' + (p ? p.name : '-') + '</div></div><span class="emp-status ' + (emp.status === 1 ? 'active' : 'inactive') + '">' + (emp.status === 1 ? '在职' : '离职') + '</span></div>';
        }

        return `
            <div class="detail-container">
                <div class="detail-header">
                    <button class="btn btn-secondary" onclick="switchModule('org')">← 返回看板</button>
                    <button class="btn btn-primary" id="editDeptBtn">✏️ 编辑部门</button>
                </div>
                <div class="detail-content">
                    <div class="detail-section">
                        <h2>${dept.name}</h2>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">部门编码</span>
                                <span class="detail-value" id="deptCode">${dept.code || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">状态</span>
                                <span class="detail-value">${dept.status === 1 ? '启用' : '禁用'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">所属上级</span>
                                <span class="detail-value">${this.getParentDeptName(dept.parentId) || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">创建时间</span>
                                <span class="detail-value">${dept.createdAt || '-'}</span>
                            </div>
                            <div class="detail-item full">
                                <span class="detail-label">描述</span>
                                <span class="detail-value" id="deptDescription">${dept.description || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="detail-section">
                        <h3>岗位列表 (${deptPositions.length})</h3>
                        ${posList || '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无岗位</div></div>'}
                    </div>
                    <div class="detail-section">
                        <h3>员工列表 (${deptEmployees.length})</h3>
                        ${empList || '<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-text">暂无员工</div></div>'}
                    </div>
                </div>
            </div>
        `;
    },

    getParentDeptName: function(parentId) {
        if (!parentId) return null;
        var parent = state.departments.find(function(d) { return d.id === parentId; });
        return parent ? parent.name : null;
    },

    bindDeptDetailEvents: function(deptId) {
        var self = this;
        var editBtn = document.getElementById('editDeptBtn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                self.showDeptEditModal(deptId);
            });
        }
    },

    showDeptEditModal: function(deptId) {
        var dept = state.departments.find(function(d) { return d.id === deptId; });
        if (!dept) return;

        var parentOptions = '<option value="">无上级部门</option>';
        for (var i = 0; i < state.departments.length; i++) {
            var d = state.departments[i];
            if (d.id !== deptId) {
                parentOptions += '<option value="' + d.id + '" ' + (dept.parentId === d.id ? 'selected' : '') + '>' + d.name + '</option>';
            }
        }

        var modalHtml = `
            <div class="modal-overlay" id="deptEditModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>✏️ 编辑部门</h2>
                        <button class="modal-close" onclick="closeDeptEditModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>部门名称 *</label>
                                <input type="text" id="editDeptName" value="${dept.name || ''}" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label>部门编码</label>
                                <input type="text" id="editDeptCode" value="${dept.code || ''}" class="form-input">
                            </div>
                            <div class="form-group">
                                <label>所属上级</label>
                                <select id="editDeptParent" class="form-input">${parentOptions}</select>
                            </div>
                            <div class="form-group">
                                <label>状态</label>
                                <select id="editDeptStatus" class="form-input">
                                    <option value="1" ${dept.status === 1 ? 'selected' : ''}>启用</option>
                                    <option value="0" ${dept.status === 0 ? 'selected' : ''}>禁用</option>
                                </select>
                            </div>
                            <div class="form-group full">
                                <label>描述</label>
                                <textarea id="editDeptDesc" class="form-input" rows="3">${dept.description || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-modal btn-modal-secondary" onclick="closeDeptEditModal()">取消</button>
                        <button class="btn-modal btn-modal-primary" onclick="saveDeptEdit(${deptId})">保存</button>
                    </div>
                </div>
            </div>
        `;

        var styleHtml = `
            <style>
                #deptEditModal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .modal-container {
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 480px;
                    overflow: hidden;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    background: linear-gradient(135deg, #1a4a6f, #0b2b3b);
                    color: white;
                }
                .modal-header h2 { margin: 0; }
                .modal-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    cursor: pointer;
                    font-size: 1.25rem;
                }
                .modal-body { padding: 24px; }
                .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
                .form-grid .full { grid-column: span 2; }
                .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #1a3a5c; }
                .form-input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 2px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    background: #fafcff;
                }
                .form-input:focus { outline: none; border-color: #1a4a6f; }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    padding: 16px 24px;
                    border-top: 1px solid #e2e8f0;
                    background: #fafcff;
                }
                .btn-modal {
                    padding: 10px 24px;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .btn-modal-primary {
                    background: linear-gradient(135deg, #1a4a6f, #0b2b3b);
                    color: white;
                }
                .btn-modal-secondary {
                    background: #e2e8f0;
                    color: #1a4a6f;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', styleHtml + modalHtml);

        window.closeDeptEditModal = function() {
            var modal = document.getElementById('deptEditModal');
            if (modal) modal.remove();
        };

        window.saveDeptEdit = async function(id) {
            var name = document.getElementById('editDeptName').value.trim();
            var code = document.getElementById('editDeptCode').value.trim();
            var parentIdVal = document.getElementById('editDeptParent').value;
            var parentId = parentIdVal ? parseInt(parentIdVal) : null;
            var status = parseInt(document.getElementById('editDeptStatus').value);
            var description = document.getElementById('editDeptDesc').value.trim();

            if (!name) {
                alert('请输入部门名称');
                return;
            }

            try {
                var res = await API.updateDepartment(id, { name, code, parent_id: parentId, status, description });
                if (res.code === 200) {
                    alert('部门更新成功');
                    window.closeDeptEditModal();
                    switchModule('org');
                } else {
                    alert(res.message || '更新失败');
                }
            } catch (e) {
                console.error('Update dept error:', e);
                alert('更新失败');
            }
        };
    },

    showAddDeptModal: function(parentId) {
        var parentOptions = '<option value="">无上级部门</option>';
        for (var i = 0; i < state.departments.length; i++) {
            var d = state.departments[i];
            parentOptions += '<option value="' + d.id + '" ' + (parentId === d.id ? 'selected' : '') + '>' + d.name + '</option>';
        }

        var modalHtml = `
            <div class="modal-overlay" id="deptAddModal">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>➕ 新增部门</h2>
                        <button class="modal-close" onclick="closeDeptAddModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-grid">
                            <div class="form-group">
                                <label>部门名称 *</label>
                                <input type="text" id="addDeptName" class="form-input" required placeholder="请输入部门名称">
                            </div>
                            <div class="form-group">
                                <label>部门编码</label>
                                <input type="text" id="addDeptCode" class="form-input" placeholder="自动生成">
                            </div>
                            <div class="form-group">
                                <label>所属上级</label>
                                <select id="addDeptParent" class="form-input">${parentOptions}</select>
                            </div>
                            <div class="form-group">
                                <label>状态</label>
                                <select id="addDeptStatus" class="form-input">
                                    <option value="1" selected>启用</option>
                                    <option value="0">禁用</option>
                                </select>
                            </div>
                            <div class="form-group full">
                                <label>描述</label>
                                <textarea id="addDeptDesc" class="form-input" rows="3" placeholder="请输入部门描述"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn-modal btn-modal-secondary" onclick="closeDeptAddModal()">取消</button>
                        <button class="btn-modal btn-modal-primary" onclick="saveDeptAdd('${parentId || ''}')">保存</button>
                    </div>
                </div>
            </div>
        `;

        var styleHtml = `
            <style>
                #deptAddModal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }
                .modal-container {
                    background: white;
                    border-radius: 16px;
                    width: 90%;
                    max-width: 480px;
                    overflow: hidden;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    background: linear-gradient(135deg, #1a4a6f, #0b2b3b);
                    color: white;
                }
                .modal-header h2 { margin: 0; }
                .modal-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.2);
                    color: white;
                    cursor: pointer;
                    font-size: 1.25rem;
                }
                .modal-body { padding: 24px; }
                .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
                .form-grid .full { grid-column: span 2; }
                .form-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #1a3a5c; }
                .form-input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 2px solid #e2e8f0;
                    border-radius: 10px;
                    font-size: 0.9rem;
                    background: #fafcff;
                }
                .form-input:focus { outline: none; border-color: #1a4a6f; }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    padding: 16px 24px;
                    border-top: 1px solid #e2e8f0;
                    background: #fafcff;
                }
                .btn-modal {
                    padding: 10px 24px;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .btn-modal-primary {
                    background: linear-gradient(135deg, #1a4a6f, #0b2b3b);
                    color: white;
                }
                .btn-modal-secondary {
                    background: #e2e8f0;
                    color: #1a4a6f;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', styleHtml + modalHtml);

        window.closeDeptAddModal = function() {
            var modal = document.getElementById('deptAddModal');
            if (modal) modal.remove();
        };

        window.saveDeptAdd = async function(parentIdVal) {
            var name = document.getElementById('addDeptName').value.trim();
            var code = document.getElementById('addDeptCode').value.trim();
            var status = parseInt(document.getElementById('addDeptStatus').value);
            var description = document.getElementById('addDeptDesc').value.trim();
            var parentId = parentIdVal ? parseInt(parentIdVal) : null;

            if (!name) {
                alert('请输入部门名称');
                return;
            }

            try {
                var res = await API.createDepartment({ name, code, parent_id: parentId, status, description });
                if (res.code === 200) {
                    alert('部门创建成功');
                    window.closeDeptAddModal();
                    switchModule('org');
                } else {
                    alert(res.message || '创建失败');
                }
            } catch (e) {
                console.error('Create dept error:', e);
                alert('创建失败');
            }
        };
    },

    confirmDeleteDept: function(deptId) {
        var dept = state.departments.find(function(d) { return d.id === deptId; });
        if (!dept) return;

        var deptPositions = state.positions.filter(function(p) { return p.departmentId === deptId; });
        var deptEmployees = state.employees.filter(function(e) { return e.departmentId === deptId; });

        var warning = '';
        if (deptPositions.length > 0) {
            warning += '该部门下有 ' + deptPositions.length + ' 个岗位，';
        }
        if (deptEmployees.length > 0) {
            warning += '有 ' + deptEmployees.length + ' 名员工，';
        }
        
        if (warning) {
            warning = '⚠️ ' + warning.slice(0, -1) + '确定要删除吗？';
        } else {
            warning = '确定要删除部门【' + dept.name + '】吗？';
        }

        if (confirm(warning)) {
            this.deleteDept(deptId);
        }
    },

    deleteDept: async function(deptId) {
        try {
            var res = await API.deleteDepartment(deptId);
            if (res.code === 200) {
                alert('部门删除成功');
                switchModule('org');
            } else {
                alert(res.message || '删除失败');
            }
        } catch (e) {
            console.error('Delete dept error:', e);
            alert('删除失败');
        }
    },

    destroy: function() {}
};

export default orgModule;
