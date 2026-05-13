var orgModule = (function() {
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
            container.innerHTML = '<div class="loading"><div class="loading-text">加载数据...</div></div>';
            
            loadAPI(function() {
                self.loadInitialData(function() {
                    var selectedType = window.orgSelectedType || 'dashboard';
                    var selectedId = window.orgSelectedId || null;
                    
                    if (selectedType === 'dept' && selectedId) {
                        container.innerHTML = self.renderDeptDetail(selectedId);
                    } else if (selectedType === 'position' && selectedId) {
                        container.innerHTML = self.renderPositionDetail(selectedId);
                    } else if (selectedType === 'employee' && selectedId) {
                        container.innerHTML = self.renderEmployeeDetail(selectedId);
                    } else {
                        container.innerHTML = self.renderDashboard();
                    }
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

            var statsHtml = '<div class="stats-grid">';
            statsHtml += '<div class="stat-item"><div class="stat-num">' + (stats.totalDepartments || depts.length) + '</div><div class="stat-label">部门总数</div></div>';
            statsHtml += '<div class="stat-item"><div class="stat-num">' + (stats.totalEmployees || totalOnboard) + '</div><div class="stat-label">员工总数</div></div>';
            statsHtml += '<div class="stat-item"><div class="stat-num">' + (stats.totalPositions || state.positions.length) + '</div><div class="stat-label">岗位总数</div></div>';
            statsHtml += '<div class="stat-item"><div class="stat-num">' + totalOnboard + '/' + totalHeadcount + '</div><div class="stat-label">编制情况</div></div>';
            statsHtml += '</div>';

            var positionsHtml = '<div class="section"><h3>岗位情况</h3><div class="positions-list">';
            for (var k = 0; k < state.positions.length; k++) {
                var pos = state.positions[k];
                var d = depts.find(function(d) { return d.id === pos.departmentId; });
                var emps = state.employees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; });
                positionsHtml += '<div class="pos-item"><span>' + pos.name + '</span><span>' + (d ? d.name : '-') + '</span><span>' + emps.length + '/' + (pos.headcount || 0) + '</span></div>';
            }
            positionsHtml += '</div></div>';

            var employeesHtml = '<div class="section"><h3>人员情况</h3><div class="employees-list">';
            for (var m = 0; m < state.employees.length; m++) {
                var emp = state.employees[m];
                var d = depts.find(function(d) { return d.id === emp.departmentId; });
                var p = state.positions.find(function(p) { return p.id === emp.positionId || p.id === emp.position_id; });
                employeesHtml += '<div class="emp-item"><span>' + emp.name + '</span><span>' + (d ? d.name : '-') + '</span><span>' + (p ? p.name : '-') + '</span></div>';
            }
            employeesHtml += '</div></div>';

            return '<div class="org-dashboard"><h1>组织架构看板</h1>' + statsHtml + '<div class="content">' + positionsHtml + employeesHtml + '</div></div>';
        },

        renderDeptDetail: function(deptId) {
            var dept = state.departments.find(function(d) { return d.id === deptId; });
            if (!dept) return '<div class="detail"><h2>找不到该部门</h2></div>';

            var deptPositions = state.positions.filter(function(p) { return p.departmentId === deptId; });
            var deptEmployees = state.employees.filter(function(e) { return e.departmentId === deptId; });

            var posList = '';
            for (var i = 0; i < deptPositions.length; i++) {
                var pos = deptPositions[i];
                var emps = state.employees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; });
                posList += '<div><span>' + pos.name + '</span><span>' + emps.length + '/' + (pos.headcount || 0) + '</span></div>';
            }

            var empList = '';
            for (var j = 0; j < deptEmployees.length; j++) {
                var emp = deptEmployees[j];
                var p = state.positions.find(function(p) { return p.id === emp.positionId || p.id === emp.position_id; });
                empList += '<div><span>' + emp.name + '</span><span>' + (p ? p.name : '-') + '</span></div>';
            }

            return '<div class="detail"><button onclick="window.orgSelectedType=null;window.orgSelectedId=null;switchModule(\'org\')">返回看板</button><h2>' + dept.name + '</h2><div><label>部门编码:</label><span>' + (dept.code || '-') + '</span></div><div><label>状态:</label><span>' + (dept.status === 1 ? '启用' : '禁用') + '</span></div><div><label>描述:</label><span>' + (dept.description || '-') + '</span></div><div><h3>岗位列表</h3>' + (posList || '<div>暂无岗位</div>') + '</div><div><h3>员工列表</h3>' + (empList || '<div>暂无员工</div>') + '</div></div>';
        },

        renderPositionDetail: function(posId) {
            var pos = state.positions.find(function(p) { return p.id === posId; });
            if (!pos) return '<div class="detail"><h2>找不到该岗位</h2></div>';

            var dept = state.departments.find(function(d) { return d.id === pos.departmentId; });
            var posEmps = state.employees.filter(function(e) { return e.positionId === posId || e.position_id === posId; });

            var empList = '';
            for (var i = 0; i < posEmps.length; i++) {
                var emp = posEmps[i];
                empList += '<div>' + emp.name + '</div>';
            }

            return '<div class="detail"><button onclick="window.orgSelectedType=null;window.orgSelectedId=null;switchModule(\'org\')">返回看板</button><h2>' + pos.name + '</h2><div><label>所属部门:</label><span>' + (dept ? dept.name : '-') + '</span></div><div><label>岗位编码:</label><span>' + (pos.code || '-') + '</span></div><div><label>编制人数:</label><span>' + (pos.headcount || 0) + '</span></div><div><label>在职人数:</label><span>' + posEmps.length + '</span></div><div><label>职责:</label><span>' + (pos.duties || '-') + '</span></div><div><label>要求:</label><span>' + (pos.requirements || '-') + '</span></div><div><h3>在岗人员</h3>' + (empList || '<div>暂无人员</div>') + '</div></div>';
        },

        renderEmployeeDetail: function(empId) {
            var emp = state.employees.find(function(e) { return e.id === empId; });
            if (!emp) return '<div class="detail"><h2>找不到该员工</h2></div>';

            var dept = state.departments.find(function(d) { return d.id === emp.departmentId; });
            var pos = state.positions.find(function(p) { return p.id === emp.positionId || p.id === emp.position_id; });

            return '<div class="detail"><button onclick="window.orgSelectedType=null;window.orgSelectedId=null;switchModule(\'org\')">返回看板</button><h2>' + emp.name + '</h2><div><label>工号:</label><span>' + (emp.employeeNo || '-') + '</span></div><div><label>性别:</label><span>' + (emp.gender === 1 ? '男' : emp.gender === 0 ? '女' : '-') + '</span></div><div><label>部门:</label><span>' + (dept ? dept.name : '-') + '</span></div><div><label>岗位:</label><span>' + (pos ? pos.name : '-') + '</span></div><div><label>手机:</label><span>' + (emp.phone || '-') + '</span></div><div><label>邮箱:</label><span>' + (emp.email || '-') + '</span></div><div><label>入职日期:</label><span>' + (emp.entryDate || '-') + '</span></div><div><label>状态:</label><span>' + (emp.status === 1 ? '在职' : '离职') + '</span></div></div>';
        },

        destroy: function() {}
    };

    return orgModule;
})();

export default orgModule;