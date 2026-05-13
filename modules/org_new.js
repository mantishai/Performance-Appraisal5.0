var orgModule = (function() {
    var Toast, Skeleton, Modal;
    var API;

    function loadModules(callback) {
        Promise.all([
            import('../utils.js'),
            import('../api.js')
        ]).then(function(modules) {
            var utils = modules[0];
            var apiModule = modules[1];
            Toast = utils.Toast;
            Skeleton = utils.Skeleton;
            Modal = utils.Modal;
            API = apiModule.default || apiModule;
            if (callback) callback();
        }).catch(function(error) {
            console.error('Failed to load org module dependencies:', error);
            if (callback) callback();
        });
    }

    var state = {
        departments: [],
        positions: [],
        keyPositions: [],
        employees: [],
        allEmployees: [],
        expandedIds: [],
        selectedDept: null,
        selectedTab: 'summary',
        selectedPosition: null,
        selectedEmployee: null,
        statistics: {},
        loading: false,
        currentPage: 1,
        totalEmployees: 0,
        selectedIds: [],
        showBatchActions: false,
        eventsBound: false,
        navMode: 'dept',
        navSelectedType: null,
        navSelectedId: null
    };

    function getParentName(deptId) {
        var dept = state.departments.find(function(d) { return d.id === deptId; });
        return dept ? dept.name : '鏃?;
    }

    function initState() {
        state.departments = [];
        state.positions = [];
        state.keyPositions = [];
        state.employees = [];
        state.allEmployees = [];
        state.expandedIds = [];
        state.selectedDept = null;
        state.selectedTab = 'summary';
        state.selectedPosition = null;
        state.selectedEmployee = null;
        state.statistics = {};
        state.loading = false;
        state.currentPage = 1;
        state.totalEmployees = 0;
        state.selectedIds = [];
        state.showBatchActions = false;
        state.eventsBound = false;
        state.navMode = 'dept';
        state.navSelectedType = null;
        state.navSelectedId = null;
    }

    function refreshContent(callback) {
        var content = document.getElementById('content');
        if (content) {
            orgModule.renderContent(content, callback);
        } else if (callback) {
            callback();
        }
    }

    var orgModule = {
        render: function(container) {
            initState();
            container.innerHTML = Skeleton.renderCard();
            var self = this;
            this.loadInitialData(function() {
                self.renderContent(container);
                self.bindEvents();
            });
        },

        loadInitialData: function(callback) {
            var completed = 0;
            var total = 4;
            var self = this;

            function checkComplete() {
                completed++;
                if (completed >= total && callback) {
                    callback();
                }
            }

            try {
                this.loadDepartments(checkComplete);
                this.loadStatistics(checkComplete);
                this.loadPositions(checkComplete);
                this.loadAllEmployees(checkComplete);
            } catch (error) {
                console.error('Failed to load org data:', error);
                if (callback) callback();
            }
        },

        loadDepartments: function(callback) {
            API.getOrgDepartments().then(function(res) {
                if (res.code === 200 && res.data) {
                    state.departments = res.data;
                    if (state.departments.length > 0 && !state.selectedDept) {
                        state.selectedDept = state.departments[0];
                    }
                }
                if (callback) callback();
            }).catch(function(error) {
                console.error('Load departments error:', error);
                if (callback) callback();
            });
        },

        loadStatistics: function(callback) {
            API.getOrgStatistics().then(function(res) {
                if (res.code === 200 && res.data) {
                    state.statistics = res.data;
                }
                if (callback) callback();
            }).catch(function(error) {
                console.error('Load statistics error:', error);
                if (callback) callback();
            });
        },

        loadPositions: function(callback) {
            API.getOrgPositions().then(function(res) {
                if (res.code === 200 && res.data) {
                    state.positions = res.data.list || res.data || [];
                    state.keyPositions = state.positions.filter(function(p) { return p.isKeyPosition === 1; });
                }
                if (callback) callback();
            }).catch(function(error) {
                console.error('Load positions error:', error);
                if (callback) callback();
            });
        },

        loadAllEmployees: function(callback) {
            API.getOrgEmployees().then(function(res) {
                if (res.code === 200 && res.data) {
                    state.allEmployees = res.data;
                }
                if (callback) callback();
            }).catch(function(error) {
                console.error('Load all employees error:', error);
                if (callback) callback();
            });
        },

        loadDepartmentEmployees: function(deptId, page, callback) {
            API.getDepartmentEmployees(deptId, page).then(function(res) {
                if (res.code === 200 && res.data) {
                    state.employees = res.data.list || [];
                    state.currentPage = res.data.page || 1;
                    state.totalEmployees = res.data.total || 0;
                }
                if (callback) callback();
            }).catch(function(error) {
                console.error('Load department employees error:', error);
                if (callback) callback();
            });
        },

        renderContent: function(container, callback) {
            var self = this;
            this.renderMainContent(function(mainContent) {
                var mainHtml = '<div class="org-layout"><div class="org-main">' + mainContent + '</div></div>';
                container.innerHTML = mainHtml;
                if (callback) callback();
            });
        },

        renderMainContent: function(callback) {
            var self = this;
            if (window.orgSelectedType && window.orgSelectedId) {
                if (window.orgSelectedType === 'position') {
                    self.renderPositionDetail(window.orgSelectedId, callback);
                    return;
                } else if (window.orgSelectedType === 'employee') {
                    self.renderEmployeeDetail(window.orgSelectedId, callback);
                    return;
                } else if (window.orgSelectedType === 'dept') {
                    var dept = state.departments.find(function(d) { return d.id === window.orgSelectedId; });
                    if (!dept && window.orgData && window.orgData.departments) {
                        dept = window.orgData.departments.find(function(d) { return d.id === window.orgSelectedId; });
                    }
                    if (dept) {
                        if (callback) callback(self.renderDeptDashboard(dept));
                        return;
                    }
                }
            }
        
            if (state.navSelectedType === 'position' && state.navSelectedId) {
                self.renderPositionDetail(state.navSelectedId, callback);
                return;
            } else if (state.navSelectedType === 'employee' && state.navSelectedId) {
                self.renderEmployeeDetail(state.navSelectedId, callback);
                return;
            } else if (state.selectedDept) {
                if (callback) callback(self.renderDeptDashboard(state.selectedDept));
                return;
            } else {
                if (callback) callback(self.renderDashboard());
                return;
            }
        },

        renderOrgTree: function() {
            var self = this;
            var isOrgExpanded = state.expandedIds.indexOf('org_root') !== -1;
            var orgExpandBtn = '<span class="expand-btn" data-id="org_root">' + (isOrgExpanded ? '鈻? : '鈻?) + '</span>';

            var deptTreeHtml = '';
            if (isOrgExpanded) {
                deptTreeHtml = this.renderDeptTree(state.departments, 0);
            }

            return '<div class="tree-item org-root-item"><div class="tree-node" style="padding-left: 0px;"><div class="node-header org-header" data-id="org_root"><span class="node-name org-title">缁勭粐鏋舵瀯</span>' + orgExpandBtn + '</div></div><div class="tree-children departments">' + deptTreeHtml + '</div></div>';
        },

        renderDeptTree: function(departments, level) {
            var self = this;
            return departments.map(function(dept) {
                var isSelected = state.selectedDept && state.selectedDept.id === dept.id && !state.navSelectedType;
                var isExpanded = state.expandedIds.indexOf(dept.id) !== -1;
                var hasChildren = dept.children && dept.children.length > 0;
                var deptPositions = state.positions.filter(function(p) { return p.departmentId === dept.id; });
                var hasPositions = deptPositions.length > 0;
                var canExpand = hasChildren || hasPositions;
                var expandBtn = canExpand ? '<span class="expand-btn" data-id="' + dept.id + '">' + (isExpanded ? '鈻? : '鈻?) + '</span>' : '<span class="expand-placeholder"></span>';
                var paddingLeft = level * 16;

                var positionsHtml = '';
                if (hasPositions && isExpanded) {
                    positionsHtml = '<div class="tree-children positions">';
                    for (var j = 0; j < deptPositions.length; j++) {
                        var pos = deptPositions[j];
                        var posEmployees = [];
                        for (var k = 0; k < state.allEmployees.length; k++) {
                            var emp = state.allEmployees[k];
                            if (emp.positionId === pos.id || emp.position_id === pos.id) {
                                posEmployees.push(emp);
                            }
                        }
                        var hasEmployees = posEmployees.length > 0;

                        var employeesHtml = '';
                        if (hasEmployees) {
                            for (var m = 0; m < posEmployees.length; m++) {
                                var empItem = posEmployees[m];
                                var isEmpSelected = state.navSelectedType === 'employee' && state.navSelectedId === empItem.id;
                                employeesHtml += '<div class="tree-item employee-item' + (isEmpSelected ? ' selected' : '') + '"><div class="node-header" style="padding-left: 32px;"><span class="node-name emp-name">鈥?' + empItem.name + '</span></div></div>';
                            }
                        }

                        var isPosSelected = state.navSelectedType === 'position' && state.navSelectedId === pos.id;
                        positionsHtml += '<div class="tree-item position-item' + (isPosSelected ? ' selected' : '') + '"><div class="node-header" style="padding-left: 16px;"><span class="node-name pos-name">' + pos.name + '</span></div>' + employeesHtml + '</div>';
                    }
                    positionsHtml += '</div>';
                }

                var childrenHtml = '';
                if (hasChildren && isExpanded) {
                    childrenHtml = '<div class="tree-children departments">' + self.renderDeptTree(dept.children, level + 1) + '</div>';
                }

                return '<div class="tree-item"><div class="tree-node' + (isSelected ? ' selected' : '') + '" data-id="' + dept.id + '" style="padding-left: ' + paddingLeft + 'px;"><div class="node-header" data-id="' + dept.id + '"><span class="node-name dept-name">' + dept.name + '</span>' + expandBtn + '</div></div>' + childrenHtml + positionsHtml + '</div>';
            }).join('');
        },

        renderDashboard: function() {
            var stats = state.statistics;
            
            var buildDeptTree = function(depts, level) {
                if (level === undefined) {
                    level = 0;
                }
                var html = '';
                for (var i = 0; i < depts.length; i++) {
                    var dept = depts[i];
                    var paddingLeft = level * 20;
                    var deptPositions = state.positions.filter(function(p) { return p.departmentId === dept.id; });
                    var deptEmployees = state.allEmployees.filter(function(e) { return e.departmentId === dept.id; });
                    var headcount = deptPositions.reduce(function(sum, p) { return sum + (p.headcount || 0); }, 0);
                    
                    html += '<div class="org-tree-item"><div class="org-tree-node" style="padding-left: ' + paddingLeft + 'px;" data-dept-id="' + dept.id + '"><div class="node-main"><span class="node-icon">馃彚</span><span class="node-name">' + dept.name + '</span><span class="node-badge">' + deptEmployees.length + '/' + headcount + '</span></div><div class="node-actions"><button class="action-btn edit-dept-btn" data-id="' + dept.id + '" title="缂栬緫">鉁忥笍</button><button class="action-btn delete-dept-btn" data-id="' + dept.id + '" title="鍒犻櫎">馃棏锔?/button></div></div>';
                    
                    if (dept.children && dept.children.length > 0) {
                        html += buildDeptTree(dept.children, level + 1);
                    }
                    
                    if (deptPositions.length > 0) {
                        html += '<div class="position-list" style="padding-left: ' + (paddingLeft + 16) + 'px;">';
                        for (var j = 0; j < deptPositions.length; j++) {
                            var pos = deptPositions[j];
                            var posEmps = state.allEmployees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; });
                            var empTags = posEmps.map(function(e) { return '<span class="emp-tag">' + e.name + '</span>'; }).join('');
                            html += '<div class="position-item" data-pos-id="' + pos.id + '"><span class="pos-icon">馃搵</span><span class="pos-name">' + pos.name + '</span><span class="pos-badge">' + posEmps.length + '/' + (pos.headcount || 0) + '</span><div class="pos-employees">' + empTags + (posEmps.length === 0 ? '<span class="empty-tag">鏆傛棤浜哄憳</span>' : '') + '</div></div>';
                        }
                        html += '</div>';
                    }
                    
                    html += '</div>';
                }
                return html;
            };
            
            var deptTreeHtml = buildDeptTree(state.departments);
            
            var totalHeadcount = 0;
            var totalOnboard = 0;
            state.positions.forEach(function(p) {
                totalHeadcount += (p.headcount || 0);
                totalOnboard += state.allEmployees.filter(function(e) {
                    return e.positionId === p.id || e.position_id === p.id;
                }).length;
            });
            
            var positionsHtml = state.positions.map(function(pos) {
                var dept = state.departments.find(function(d) { return d.id === pos.departmentId; });
                var posEmps = state.allEmployees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; });
                return '<div class="summary-row"><span class="summary-value">' + pos.name + '</span><span class="summary-value">' + (dept ? dept.name : '-') + '</span><span class="summary-value">' + (pos.headcount || 0) + '</span><span class="summary-value">' + posEmps.length + '</span><span class="summary-value">' + (pos.status === 1 ? '鍚敤' : '绂佺敤') + '</span></div>';
            }).join('');

            var employeesHtml = state.allEmployees.map(function(emp) {
                var dept = state.departments.find(function(d) { return d.id === emp.departmentId; });
                var pos = state.positions.find(function(p) { return p.id === emp.positionId || p.id === emp.position_id; });
                return '<div class="summary-row"><span class="summary-value">' + emp.name + '</span><span class="summary-value">' + (emp.employeeNo || '-') + '</span><span class="summary-value">' + (dept ? dept.name : '-') + '</span><span class="summary-value">' + (pos ? pos.name : '-') + '</span><span class="summary-value">' + (emp.status === 1 ? '鍦ㄨ亴' : '绂昏亴') + '</span></div>';
            }).join('');

            var statsHtml = '<div class="dashboard-stats">' +
                '<div class="stat-card"><div class="stat-icon-wrapper blue"><span class="stat-icon">馃彚</span></div><div class="stat-info"><div class="stat-value">' + (stats.departmentCount || 0) + '</div><div class="stat-label">閮ㄩ棬鎬绘暟</div></div>' +
                '<div class="stat-card"><div class="stat-icon-wrapper green"><span class="stat-icon">馃懃</span></div><div class="stat-info"><div class="stat-value">' + (stats.employeeCount || 0) + '</div><div class="stat-label">鍛樺伐鎬绘暟</div></div>' +
                '<div class="stat-card"><div class="stat-icon-wrapper purple"><span class="stat-icon">馃搵</span></div><div class="stat-info"><div class="stat-value">' + (stats.positionCount || 0) + '</div><div class="stat-label">宀椾綅鎬绘暟</div></div>' +
                '<div class="stat-card"><div class="stat-icon-wrapper yellow"><span class="stat-icon">猸?/span></div><div class="stat-info"><div class="stat-value">' + (state.keyPositions.length || 0) + '</div><div class="stat-label">鍏抽敭宀椾綅</div></div>' +
                '<div class="stat-card"><div class="stat-icon-wrapper orange"><span class="stat-icon">馃搳</span></div><div class="stat-info"><div class="stat-value">' + totalOnboard + '/' + totalHeadcount + '</div><div class="stat-label">缂栧埗鎯呭喌</div></div>' +
                '<div class="stat-card"><div class="stat-icon-wrapper cyan"><span class="stat-icon">馃搱</span></div><div class="stat-info"><div class="stat-value">' + (stats.depth || 0) + '</div><div class="stat-label">缁勭粐灞傜骇</div></div>' +
            '</div>';

            return '<div class="org-dashboard">' +
                '<div class="dashboard-header"><h1>馃彚 缁勭粐鏋舵瀯鐪嬫澘</h1><button class="btn btn-primary" id="addDeptBtn">+ 鏂板閮ㄩ棬</button></div>' +
                statsHtml +
                '<div class="dashboard-section"><div class="section-header"><h2>馃搳 閮ㄩ棬鎯呭喌</h2></div><div class="org-tree-container">' + deptTreeHtml + '</div></div>' +
                '<div class="dashboard-section"><div class="section-header"><h2>馃搵 宀椾綅鎯呭喌</h2></div><div class="positions-summary"><div class="summary-header"><span class="summary-label">宀椾綅鍚嶇О</span><span class="summary-label">鎵€灞為儴闂?/span><span class="summary-label">缂栧埗浜烘暟</span><span class="summary-label">鍦ㄨ亴浜烘暟</span><span class="summary-label">鐘舵€?/span></div>' + positionsHtml + (state.positions.length === 0 ? '<div class="empty-message">鏆傛棤宀椾綅鏁版嵁</div>' : '') + '</div></div>' +
                '<div class="dashboard-section"><div class="section-header"><h2>馃懃 浜哄憳鎯呭喌</h2></div><div class="employees-summary"><div class="summary-header"><span class="summary-label">濮撳悕</span><span class="summary-label">宸ュ彿</span><span class="summary-label">鎵€灞為儴闂?/span><span class="summary-label">宀椾綅</span><span class="summary-label">鐘舵€?/span></div>' + employeesHtml + (state.allEmployees.length === 0 ? '<div class="empty-message">鏆傛棤浜哄憳鏁版嵁</div>' : '') + '</div></div>' +
            '</div>';
        },

        renderDeptDashboard: function(dept) {
            var deptPositions = state.positions.filter(function(p) { return p.departmentId === dept.id; });
            var deptEmployees = state.allEmployees.filter(function(e) { return e.departmentId === dept.id; });
            var parentName = dept.parentId ? getParentName(dept.parentId) : '鏃?;

            var totalHeadcount = 0;
            var totalOnboard = 0;
            deptPositions.forEach(function(p) {
                totalHeadcount += (p.headcount || 0);
                var onboard = state.allEmployees.filter(function(e) { return e.positionId === p.id || e.position_id === p.id; }).length;
                totalOnboard += onboard;
            });

            var statusHtml = dept.status === 1 ? '<span class="status-tag active">鍚敤</span>' : '<span class="status-tag inactive">绂佺敤</span>';
            var self = this;
            var vacantCount = totalHeadcount - totalOnboard > 0 ? totalHeadcount - totalOnboard : 0;

            var dutiesHtml = deptPositions.length > 0 ? deptPositions.map(function(pos) {
                var posEmps = state.allEmployees.filter(function(e) { return e.positionId === pos.id || e.position_id === pos.id; }).length;
                return '<div class="duty-card"><div class="duty-header"><span class="duty-name">' + pos.name + '</span><span class="duty-level">' + self.getLevelName(pos.level) + '</span></div><div class="duty-content">' + (pos.duty || '鏆傛棤宀椾綅鑱岃矗鎻忚堪') + '</div><div class="duty-meta"><span>缂栧埗 ' + (pos.headcount || 0) + ' 浜?/span><span>|</span><span>鍦ㄨ亴 ' + posEmps + ' 浜?/span></div></div>';
            }).join('') : '<div class="empty-tip">鏆傛棤宀椾綅鏁版嵁</div>';

            var employeesHtml = deptEmployees.length > 0 ? deptEmployees.map(function(emp) {
                return '<div class="employee-card" data-employee-id="' + emp.id + '"><div class="emp-avatar">' + (emp.name || '鏈煡').charAt(0) + '</div><div class="emp-info"><div class="emp-name">' + emp.name + '</div><div class="emp-position">' + (emp.position || '鏈垎閰嶅矖浣?) + '</div></div></div>';
            }).join('') : '<div class="empty-tip">鏆傛棤鍛樺伐鏁版嵁</div>';

            var descHtml = dept.description ? '<div class="dept-section"><h3 class="section-title">閮ㄩ棬鎻忚堪</h3><div class="dept-desc">' + dept.description + '</div></div>' : '';

            var result = '<div class="dept-dashboard">';
            result += '<div class="dept-header-card">';
            result += '<div class="dept-header-info">';
            result += '<h2 class="dept-title">' + dept.name + ' ' + statusHtml + '</h2>';
            result += '<div class="dept-meta">';
            result += '<span class="meta-item"><i class="icon">馃搷</i> 涓婄骇閮ㄩ棬锛? + parentName + '</span>';
            result += '<span class="meta-item"><i class="icon">馃搵</i> 閮ㄩ棬缂栫爜锛? + (dept.code || '-') + '</span>';
            result += '<span class="meta-item"><i class="icon">馃摓</i> 鑱旂郴鐢佃瘽锛? + (dept.phone || '-') + '</span>';
            result += '</div></div>';
            result += '<div class="dept-header-actions">';
            result += '<button class="btn btn-default" id="editDeptBtn">鉁忥笍 缂栬緫</button>';
            result += '<button class="btn btn-danger" id="deleteDeptBtn">馃棏锔?鍒犻櫎</button>';
            result += '</div></div>';
            result += '<div class="dept-stats-grid">';
            result += '<div class="stat-box"><div class="stat-icon-wrapper blue"><span class="stat-icon">馃彚</span></div><div class="stat-info"><div class="stat-number">' + deptPositions.length + '</div><div class="stat-text">宀椾綅鏁?/div></div>';
            result += '<div class="stat-box"><div class="stat-icon-wrapper green"><span class="stat-icon">馃懃</span></div><div class="stat-info"><div class="stat-number">' + totalOnboard + '</div><div class="stat-text">鍦ㄨ亴浜烘暟</div></div>';
            result += '<div class="stat-box"><div class="stat-icon-wrapper purple"><span class="stat-icon">馃搳</span></div><div class="stat-info"><div class="stat-number">' + totalHeadcount + '</div><div class="stat-text">缂栧埗浜烘暟</div></div>';
            result += '<div class="stat-box"><div class="stat-icon-wrapper orange"><span class="stat-icon">馃搱</span></div><div class="stat-info"><div class="stat-number">' + vacantCount + '</div><div class="stat-text">绌虹己浜烘暟</div></div>';
            result += '</div>';
            result += '<div class="dept-section"><h3 class="section-title">宀椾綅鑱岃矗</h3><div class="duty-list">' + dutiesHtml + '</div></div>';
            result += '<div class="dept-section"><h3 class="section-title">閮ㄩ棬鍛樺伐</h3><div class="employee-grid">' + employeesHtml + '</div></div>';
            result += descHtml;
            result += '</div>';
            return result;
        },

        getLevelName: function(level) {
            var levels = { 1: '鍒濈骇', 2: '涓骇', 3: '楂樼骇', 4: '涓撳', 5: '楂樼骇涓撳' };
            return levels[level] || '-';
        },

        getPositionManualData: function(positionId) {
            try {
                var localData = localStorage.getItem('hrPositions');
                if (localData) {
                    var positions = JSON.parse(localData);
                    var key = 'pos_' + positionId;
                    return positions[key] || null;
                }
            } catch (e) {
                console.error('Failed to get position manual data:', e);
            }
            return null;
        },

        renderPositionDetail: function(positionId, callback) {
            var position = state.positions.find(function(p) { return p.id === positionId; });
            if (!position && window.orgData && window.orgData.positions) {
                position = window.orgData.positions.find(function(p) { return p.id === positionId; });
            }
            if (!position) {
                if (callback) callback('<div class="empty-state">鎵句笉鍒拌宀椾綅</div>');
                return;
            }

            var manualData = this.getPositionManualData(positionId);
            
            var dept = state.departments.find(function(d) { return d.id === position.departmentId; });
            if (!dept && window.orgData && window.orgData.departments) {
                dept = window.orgData.departments.find(function(d) { return d.id === position.departmentId; });
            }
            
            var posEmployees = state.allEmployees.filter(function(e) { return e.positionId === position.id || e.position_id === position.id; });
            if (posEmployees.length === 0 && window.orgData && window.orgData.employees) {
                posEmployees = window.orgData.employees.filter(function(e) { return e.positionId === position.id || e.position_id === position.id; });
            }

            var levelNames = { 1: '鍒濈骇', 2: '涓骇', 3: '楂樼骇', 4: '涓撳', 5: '楂樼骇涓撳' };
            var info = manualData && manualData.info ? manualData.info : {};
            var conditions = manualData && manualData.conditions ? manualData.conditions : {};
            var qualification = manualData && manualData.qualification ? manualData.qualification : {};
            var duties = manualData && manualData.duties ? manualData.duties : [];
            var metrics = manualData && manualData.metrics ? manualData.metrics : [];

            var dutiesHtml = duties.length > 0 ? '<div class="info-card"><h3 class="card-title">涓昏宀椾綅鑱岃矗</h3><table class="duty-table"><thead><tr><th>鑱岃矗妯″潡</th><th>鑱岃矗鍒嗙被</th><th>宸ヤ綔绫诲瀷</th><th>鑱岃矗缁嗗垯</th></tr></thead><tbody>' + duties.map(function(d) {
                return '<tr><td>' + (d.module || '-') + '</td><td>' + (d.category || '-') + '</td><td>' + (d.workType || '-') + '</td><td>' + (d.detail || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var metricsHtml = metrics.length > 0 ? '<div class="info-card"><h3 class="card-title">鑰冩牳鎸囨爣</h3><table class="duty-table"><thead><tr><th>鎸囨爣鍚嶇О</th><th>鏉冮噸</th><th>鐩爣鍊?/th><th>璇勪环鏍囧噯</th></tr></thead><tbody>' + metrics.map(function(m) {
                return '<tr><td>' + (m.name || '-') + '</td><td>' + (m.weight || '-') + '</td><td>' + (m.target || '-') + '</td><td>' + (m.criteria || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var documentsHtml = manualData && manualData.documents ? '<div class="info-card"><h3 class="card-title">鍙拌处/鏂囦欢</h3><div class="duty-text">' + manualData.documents + '</div></div>' : '';

            var employeesHtml = posEmployees.length > 0 ? posEmployees.map(function(emp) {
                return '<div class="emp-item" data-employee-id="' + emp.id + '"><div class="emp-avatar-sm">' + (emp.name || '鏈煡').charAt(0) + '</div><div class="emp-info-sm"><span class="emp-name-sm">' + emp.name + '</span><span class="emp-no-sm">' + (emp.employeeNo || '-') + '</span></div></div>';
            }).join('') : '<div class="empty-tip">鏆傛棤鍦ㄨ亴浜哄憳</div>';

            var result = '<div class="position-detail"><div class="detail-header"><button class="btn btn-link" id="backToDept">鈫?杩斿洖閮ㄩ棬</button><h2 class="detail-title">馃搵 ' + (info.positionName || position.name || '宀椾綅') + '鑱岃矗璇存槑涔?/h2></div><div class="info-card"><h3 class="card-title">鍩烘湰淇℃伅</h3><div class="info-grid"><div class="info-item"><label>宀椾綅鍚嶇О</label><span>' + (info.positionName || position.name || '-') + '</span></div><div class="info-item"><label>鑱屼綅鍚嶇О</label><span>' + (info.jobTitle || '-') + '</span></div><div class="info-item"><label>鎵€灞為儴闂?/label><span>' + (info.department || (dept ? dept.name : '-')) + '</span></div><div class="info-item"><label>閮ㄩ棬绫诲瀷</label><span>' + (info.deptType || '-') + '</span></div><div class="info-item"><label>閮ㄩ棬鎬ц川</label><span>' + (info.deptNature || '-') + '</span></div><div class="info-item"><label>宀椾綅鑱岀骇</label><span>' + (info.level || (position.level ? levelNames[position.level] : '-')) + '</span></div><div class="info-item"><label>宀椾綅缂栫爜</label><span>' + (info.positionCode || position.code || '-') + '</span></div><div class="info-item"><label>缂栧埗浜烘暟</label><span>' + (info.headcount || position.headcount || 0) + '</span></div><div class="info-item"><label>鐩村睘涓婄骇</label><span>' + (info.supervisor || '-') + '</span></div><div class="info-item"><label>璺ㄧ骇涓婄骇</label><span>' + (info.crossSupervisor || '-') + '</span></div><div class="info-item"><label>鐩存帴涓嬪睘</label><span>' + (info.directSubordinates || '-') + '</span></div><div class="info-item"><label>闂存帴涓嬪睘</label><span>' + (info.indirectSubordinates || '-') + '</span></div><div class="info-item"><label>鏅嬪崌鏂瑰悜</label><span>' + (info.promotionDirection || '-') + '</span></div><div class="info-item"><label>杞矖宀椾綅</label><span>' + (info.rotationPosition || '-') + '</span></div><div class="info-item"><label>鐢熸晥鏃ユ湡</label><span>' + (info.effectiveDate || '-') + '</span></div><div class="info-item"><label>瀹℃壒浜?/label><span>' + (info.approver || '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">宀椾綅姒傝堪</h3><div class="duty-text">' + (info.summary || position.duty || '鏆傛棤宀椾綅姒傝堪') + '</div></div><div class="info-card"><h3 class="card-title">宀椾綅璁剧疆鐩殑</h3><div class="duty-text">' + ((manualData && manualData.purpose) || (position.duty || '鏆傛棤宀椾綅璁剧疆鐩殑')) + '</div></div>' + dutiesHtml + '<div class="info-card"><h3 class="card-title">浠昏亴璧勬牸</h3><div class="info-grid"><div class="info-item"><label>鏁欒偛鑳屾櫙</label><span>' + (qualification.education || '鏆傛棤瑕佹眰') + '</span></div><div class="info-item"><label>鍩硅缁忓巻</label><span>' + (qualification.training || '鏆傛棤瑕佹眰') + '</span></div><div class="info-item"><label>宸ヤ綔缁忛獙</label><span>' + (qualification.experience || '鏆傛棤瑕佹眰') + '</span></div><div class="info-item"><label>鎶€鑳借姹?/label><span>' + (qualification.skills || '鏆傛棤瑕佹眰') + '</span></div><div class="info-item"><label>鍏朵粬瑕佹眰</label><span>' + (qualification.otherRequirements || '鏆傛棤瑕佹眰') + '</span></div></div></div><div class="info-card"><h3 class="card-title">宸ヤ綔鏉′欢</h3><div class="info-grid"><div class="info-item"><label>宸ヤ綔鏃堕棿</label><span>' + (conditions.workTime || '-') + '</span></div><div class="info-item"><label>宸ヤ綔鍦扮偣</label><span>' + (conditions.workPlace || '-') + '</span></div><div class="info-item"><label>宸ヤ綔鐜</label><span>' + (conditions.workEnv || '-') + '</span></div><div class="info-item"><label>椋庨櫓绛夌骇</label><span>' + (conditions.risk || '-') + '</span></div><div class="info-item"><label>鑱屼笟鐥呭嵄瀹?/label><span>' + (conditions.occupationalHazard || '-') + '</span></div></div></div>' + metricsHtml + documentsHtml + '<div class="info-card"><h3 class="card-title">宀椾綅浜哄憳</h3><div class="employee-list">' + employeesHtml + '</div></div></div>';

            if (callback) callback(result);
        },

        renderEmployeeDetail: function(employeeId, callback) {
            var employee = state.allEmployees.find(function(e) { return e.id === employeeId; });
            if (!employee && window.orgData && window.orgData.employees) {
                employee = window.orgData.employees.find(function(e) { return e.id === employeeId; });
            }
            if (!employee) {
                if (callback) callback('<div class="empty-state">鎵句笉鍒拌鍛樺伐</div>');
                return;
            }

            var self = this;
            API.getEmployeeDetail(employeeId).then(function(res) {
                var detailedEmployee = employee;
                if (res.code === 200 && res.data) {
                    var data = res.data;
                    for (var key in data) {
                        if (data.hasOwnProperty(key)) {
                            detailedEmployee[key] = data[key];
                        }
                    }
                }
                self._renderEmployeeDetail(detailedEmployee, callback);
            }).catch(function(e) {
                console.error('Failed to load employee detail:', e);
                self._renderEmployeeDetail(employee, callback);
            });
        },

        _renderEmployeeDetail: function(detailedEmployee, callback) {
            var dept = state.departments.find(function(d) { return d.id === detailedEmployee.departmentId; });
            if (!dept && window.orgData && window.orgData.departments) {
                dept = window.orgData.departments.find(function(d) { return d.id === detailedEmployee.departmentId; });
            }
            
            var position = state.positions.find(function(p) { return p.id === detailedEmployee.positionId || p.id === detailedEmployee.position_id; });
            if (!position && window.orgData && window.orgData.positions) {
                position = window.orgData.positions.find(function(p) { return p.id === detailedEmployee.positionId || p.id === detailedEmployee.position_id; });
            }

            var formatDate = function(dateStr) {
                if (!dateStr) return '-';
                try {
                    return dateStr.split('T')[0];
                } catch (e) {
                    return dateStr;
                }
            };

            var workExperiencesHtml = detailedEmployee.workExperiences && detailedEmployee.workExperiences.length > 0 ? '<div class="info-card"><h3 class="card-title">宸ヤ綔缁忓巻</h3><table class="detail-table"><thead><tr><th>宸ヤ綔鍗曚綅</th><th>鑱屼綅</th><th>璇佹槑浜?/th><th>鑱旂郴鐢佃瘽</th><th>绂昏亴鍘熷洜</th><th>宸ヤ綔鑱岃矗</th></tr></thead><tbody>' + detailedEmployee.workExperiences.map(function(exp) {
                return '<tr><td>' + (exp.company_name || '-') + '</td><td>' + (exp.position || '-') + '</td><td>' + (exp.reference_name || '-') + '</td><td>' + (exp.reference_phone || '-') + '</td><td>' + (exp.resign_reason || '-') + '</td><td>' + (exp.duties || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var familyMembersHtml = detailedEmployee.familyMembers && detailedEmployee.familyMembers.length > 0 ? '<div class="info-card"><h3 class="card-title">瀹跺涵涓昏鎴愬憳</h3><table class="detail-table"><thead><tr><th>濮撳悕</th><th>鍏崇郴</th><th>宸ヤ綔鍗曚綅</th><th>鑱旂郴鐢佃瘽</th><th>鏀挎不闈㈣矊</th><th>鏄惁绱ф€ヨ仈绯讳汉</th></tr></thead><tbody>' + detailedEmployee.familyMembers.map(function(member) {
                return '<tr><td>' + (member.name || '-') + '</td><td>' + (member.relationship || '-') + '</td><td>' + (member.work_unit || '-') + '</td><td>' + (member.phone || '-') + '</td><td>' + (member.political_status || '-') + '</td><td>' + (member.is_emergency_contact === 1 ? '鏄? : '鍚?) + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var projectPerformancesHtml = detailedEmployee.projectPerformances && detailedEmployee.projectPerformances.length > 0 ? '<div class="info-card"><h3 class="card-title">鏈汉椤圭洰涓氱哗</h3><table class="detail-table"><thead><tr><th>椤圭洰绫诲瀷</th><th>椤圭洰鍚嶇О</th><th>椤圭洰绾у埆</th><th>涓汉瑙掕壊</th><th>椤圭洰閲戦</th><th>椤圭洰鎴愭灉</th><th>瀹㈡埛鍚嶇О</th></tr></thead><tbody>' + detailedEmployee.projectPerformances.map(function(project) {
                return '<tr><td>' + (project.project_type || '-') + '</td><td>' + (project.project_name || '-') + '</td><td>' + (project.project_level || '-') + '</td><td>' + (project.role || '-') + '</td><td>' + (project.amount ? project.amount.toLocaleString() : '-') + '</td><td>' + (project.result || '-') + '</td><td>' + (project.client_name || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var departmentInfosHtml = detailedEmployee.departmentInfos && detailedEmployee.departmentInfos.length > 0 ? '<div class="info-card"><h3 class="card-title">閮ㄩ棬淇℃伅</h3><table class="detail-table"><thead><tr><th>閮ㄩ棬鍚嶇О</th><th>鑱屼綅</th><th>鍏ヨ亴鏃堕棿</th><th>绂昏亴鏃堕棿</th><th>寮傚姩绫诲瀷</th><th>寮傚姩鍗曟嵁鍙?/th><th>瀹℃壒鐘舵€?/th></tr></thead><tbody>' + detailedEmployee.departmentInfos.map(function(item) {
                return '<tr><td>' + (item.department_name || '-') + '</td><td>' + (item.position || '-') + '</td><td>' + formatDate(item.entry_date) + '</td><td>' + formatDate(item.leave_date) + '</td><td>' + (item.change_type || '-') + '</td><td>' + (item.document_no || '-') + '</td><td>' + (item.approval_status || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var educationInfosHtml = detailedEmployee.educationInfos && detailedEmployee.educationInfos.length > 0 ? '<div class="info-card"><h3 class="card-title">鏁欒偛淇℃伅</h3><table class="detail-table"><thead><tr><th>瀛﹀巻</th><th>瀛︽牎</th><th>涓撲笟</th><th>鍏ュ鏃堕棿</th><th>姣曚笟鏃堕棿</th><th>鏄惁鍏ㄦ棩鍒?/th><th>瀛﹀巻璇佷功</th><th>瀛︿綅璇佷功</th><th>璁よ瘉鐘舵€?/th></tr></thead><tbody>' + detailedEmployee.educationInfos.map(function(edu) {
                return '<tr><td>' + (edu.education || '-') + '</td><td>' + (edu.school_name || '-') + '</td><td>' + (edu.major || '-') + '</td><td>' + formatDate(edu.entry_date) + '</td><td>' + formatDate(edu.graduation_date) + '</td><td>' + (edu.is_full_time === 1 ? '鏄? : '鍚?) + '</td><td>' + (edu.education_certificate || '-') + '</td><td>' + (edu.degree_certificate || '-') + '</td><td>' + (edu.certification_status || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var awardsHtml = detailedEmployee.awards && detailedEmployee.awards.length > 0 ? '<div class="info-card"><h3 class="card-title">鑾峰鎯呭喌</h3><table class="detail-table"><thead><tr><th>濂栭」鍚嶇О</th><th>棰佸鍗曚綅</th><th>鑾峰鏃堕棿</th><th>鑾峰鍐呭</th><th>濂栭」绾у埆</th><th>璇佷功闄勪欢</th></tr></thead><tbody>' + detailedEmployee.awards.map(function(award) {
                return '<tr><td>' + (award.award_name || '-') + '</td><td>' + (award.issuing_authority || '-') + '</td><td>' + formatDate(award.award_date) + '</td><td>' + (award.content || '-') + '</td><td>' + (award.level || '-') + '</td><td>' + (award.certificate_attachment || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var titleInfosHtml = detailedEmployee.titleInfos && detailedEmployee.titleInfos.length > 0 ? '<div class="info-card"><h3 class="card-title">鑱岀О淇℃伅</h3><table class="detail-table"><thead><tr><th>鑱岀О鍚嶇О</th><th>璇勫畾鏈烘瀯</th><th>鍙栧緱鏃堕棿</th><th>鏈夋晥鏈熻嚦</th><th>璇佷功闄勪欢</th><th>鑱樹换鏃堕棿</th></tr></thead><tbody>' + detailedEmployee.titleInfos.map(function(title) {
                return '<tr><td>' + (title.title_name || '-') + '</td><td>' + (title.evaluation_institution || '-') + '</td><td>' + formatDate(title.obtain_date) + '</td><td>' + formatDate(title.expire_date) + '</td><td>' + (title.certificate_attachment || '-') + '</td><td>' + formatDate(title.appointment_date) + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var registrationsHtml = detailedEmployee.registrations && detailedEmployee.registrations.length > 0 ? '<div class="info-card"><h3 class="card-title">娉ㄥ唽璇佷俊鎭?/h3><table class="detail-table"><thead><tr><th>璇佷功鍚嶇О</th><th>璇佷功缂栧彿</th><th>鍙栧緱鏃堕棿</th><th>鏈夋晥鏈熻嚦</th><th>璇佷功闄勪欢</th><th>缁х画鏁欒偛鐘舵€?/th></tr></thead><tbody>' + detailedEmployee.registrations.map(function(cert) {
                return '<tr><td>' + (cert.certificate_name || '-') + '</td><td>' + (cert.certificate_number || '-') + '</td><td>' + formatDate(cert.obtain_date) + '</td><td>' + formatDate(cert.expire_date) + '</td><td>' + (cert.certificate_attachment || '-') + '</td><td>' + (cert.continuing_education_status || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var positionCertificatesHtml = detailedEmployee.positionCertificates && detailedEmployee.positionCertificates.length > 0 ? '<div class="info-card"><h3 class="card-title">宀椾綅璇佷俊鎭?/h3><table class="detail-table"><thead><tr><th>璇佷功鍚嶇О</th><th>璇佷功缂栧彿</th><th>鍙栧緱鏃堕棿</th><th>鏈夋晥鏈熻嚦</th><th>璇佷功闄勪欢</th><th>鍙戣瘉鏈哄叧</th></tr></thead><tbody>' + detailedEmployee.positionCertificates.map(function(cert) {
                return '<tr><td>' + (cert.certificate_name || '-') + '</td><td>' + (cert.certificate_number || '-') + '</td><td>' + formatDate(cert.obtain_date) + '</td><td>' + formatDate(cert.expire_date) + '</td><td>' + (cert.certificate_attachment || '-') + '</td><td>' + (cert.issuing_authority || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var transfersHtml = detailedEmployee.transfers && detailedEmployee.transfers.length > 0 ? '<div class="info-card"><h3 class="card-title">浜轰簨璋冨姩鎯呭喌</h3><table class="detail-table"><thead><tr><th>璋冨姩绫诲瀷</th><th>鍘熼儴闂?鑱屼綅</th><th>鏂伴儴闂?鑱屼綅</th><th>璋冨姩鏃堕棿</th><th>寮傚姩鍗曟嵁鍙?/th><th>寮傚姩鍚庤柂璧?/th><th>寮傚姩鍘熷洜</th><th>瀹℃壒浜?/th><th>瀹℃壒鐘舵€?/th></tr></thead><tbody>' + detailedEmployee.transfers.map(function(transfer) {
                return '<tr><td>' + (transfer.transfer_type || '-') + '</td><td>' + (transfer.original_dept_position || '-') + '</td><td>' + (transfer.new_dept_position || '-') + '</td><td>' + formatDate(transfer.transfer_date) + '</td><td>' + (transfer.document_no || '-') + '</td><td>' + (transfer.new_salary ? transfer.new_salary.toLocaleString() : '-') + '</td><td>' + (transfer.reason || '-') + '</td><td>' + (transfer.approver || '-') + '</td><td>' + (transfer.approval_status || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var processRecordsHtml = detailedEmployee.processRecords && detailedEmployee.processRecords.length > 0 ? '<div class="info-card"><h3 class="card-title">娴佺▼璁板綍</h3><table class="detail-table"><thead><tr><th>娴佺▼鍚嶇О</th><th>娴佺▼绫诲瀷</th><th>鍙戣捣鏃堕棿</th><th>瀹屾垚鏃堕棿</th><th>褰撳墠鑺傜偣</th><th>瀹℃壒浜?/th><th>瀹℃壒鎰忚</th><th>鐘舵€?/th></tr></thead><tbody>' + detailedEmployee.processRecords.map(function(record) {
                return '<tr><td>' + (record.process_name || '-') + '</td><td>' + (record.process_type || '-') + '</td><td>' + formatDate(record.initiate_time) + '</td><td>' + formatDate(record.complete_time) + '</td><td>' + (record.current_node || '-') + '</td><td>' + (record.approver || '-') + '</td><td>' + (record.approval_comment || '-') + '</td><td>' + (record.status || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var contractsHtml = detailedEmployee.contracts && detailedEmployee.contracts.length > 0 ? '<div class="info-card"><h3 class="card-title">鍚堝悓淇℃伅</h3><table class="detail-table"><thead><tr><th>鍚堝悓绫诲瀷</th><th>鍚堝悓缂栧彿</th><th>绛捐鏃ユ湡</th><th>鐢熸晥鏃ユ湡</th><th>鍒版湡鏃ユ湡</th><th>鍚堝悓鎵弿浠?/th><th>缁娆℃暟</th><th>鏄惁鏃犲浐瀹氭湡闄?/th></tr></thead><tbody>' + detailedEmployee.contracts.map(function(contract) {
                return '<tr><td>' + (contract.contract_type || '-') + '</td><td>' + (contract.contract_number || '-') + '</td><td>' + formatDate(contract.sign_date) + '</td><td>' + formatDate(contract.effective_date) + '</td><td>' + formatDate(contract.expire_date) + '</td><td>' + (contract.contract_attachment || '-') + '</td><td>' + (contract.renew_count || '-') + '</td><td>' + (contract.is_unlimited === 1 ? '鏄? : '鍚?) + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var trainingsHtml = detailedEmployee.trainings && detailedEmployee.trainings.length > 0 ? '<div class="info-card"><h3 class="card-title">鍩硅璁板綍</h3><table class="detail-table"><thead><tr><th>鍩硅鍚嶇О</th><th>鍩硅鏈烘瀯</th><th>鍩硅寮€濮嬫椂闂?/th><th>鍩硅缁撴潫鏃堕棿</th><th>鍩硅鏃堕暱</th><th>鍩硅璐圭敤</th><th>鍩硅璇佷功</th><th>鍩硅鏁堟灉璇勪环</th></tr></thead><tbody>' + detailedEmployee.trainings.map(function(training) {
                return '<tr><td>' + (training.training_name || '-') + '</td><td>' + (training.training_institution || '-') + '</td><td>' + formatDate(training.start_date) + '</td><td>' + formatDate(training.end_date) + '</td><td>' + (training.duration || '-') + '</td><td>' + (training.cost ? training.cost.toLocaleString() : '-') + '</td><td>' + (training.certificate || '-') + '</td><td>' + (training.evaluation || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var rewardPunishmentsHtml = detailedEmployee.rewardPunishments && detailedEmployee.rewardPunishments.length > 0 ? '<div class="info-card"><h3 class="card-title">濂栨儵璁板綍</h3><table class="detail-table"><thead><tr><th>濂栨儵绫诲瀷</th><th>濂栨儵鍚嶇О</th><th>濂栨儵鏃堕棿</th><th>濂栨儵鍘熷洜</th><th>濂栨儵閲戦</th><th>瀹℃壒鐘舵€?/th></tr></thead><tbody>' + detailedEmployee.rewardPunishments.map(function(record) {
                return '<tr><td>' + (record.type === 'reward' ? '濂栧姳' : '鎯╃綒') + '</td><td>' + (record.name || '-') + '</td><td>' + formatDate(record.date) + '</td><td>' + (record.reason || '-') + '</td><td>' + (record.amount ? record.amount.toLocaleString() : '-') + '</td><td>' + (record.status || '-') + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '';

            var remarkHtml = detailedEmployee.remark ? '<div class="info-card"><h3 class="card-title">澶囨敞</h3><div class="remark-text">' + detailedEmployee.remark + '</div></div>' : '';

            var result = '<div class="employee-detail"><div class="detail-header"><button class="btn btn-link" id="backToDept">鈫?杩斿洖</button><h2 class="detail-title">鍛樺伐璇︽儏</h2></div><div class="emp-profile-card"><div class="emp-avatar-lg">' + (detailedEmployee.name || '鏈煡').charAt(0) + '</div><div class="emp-profile-info"><h3 class="emp-profile-name">' + detailedEmployee.name + '</h3><div class="emp-profile-meta"><span>' + (position ? position.name : '鏈垎閰嶅矖浣?) + '</span><span>|</span><span>' + (dept ? dept.name : '鏈垎閰嶉儴闂?) + '</span></div></div></div><div class="info-card"><h3 class="card-title">鍩烘湰淇℃伅</h3><div class="info-grid"><div class="info-item"><label>濮撳悕</label><span>' + detailedEmployee.name + '</span></div><div class="info-item"><label>宸ュ彿</label><span>' + (detailedEmployee.employeeNo || '-') + '</span></div><div class="info-item"><label>鎬у埆</label><span>' + (detailedEmployee.gender === 1 ? '鐢? : detailedEmployee.gender === 2 ? '濂? : '-') + '</span></div><div class="info-item"><label>骞撮緞</label><span>' + (detailedEmployee.age || '-') + '</span></div><div class="info-item"><label>姘戞棌</label><span>' + (detailedEmployee.nation || '-') + '</span></div><div class="info-item"><label>鍑虹敓鏃ユ湡</label><span>' + formatDate(detailedEmployee.birthDate) + '</span></div><div class="info-item"><label>绫嶈疮</label><span>' + (detailedEmployee.nativePlace || '-') + '</span></div><div class="info-item"><label>鏀挎不闈㈣矊</label><span>' + (detailedEmployee.politicalStatus || '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">鑱旂郴鏂瑰紡</h3><div class="info-grid"><div class="info-item"><label>鎵嬫満鍙风爜</label><span>' + (detailedEmployee.phone || '-') + '</span></div><div class="info-item"><label>閭</label><span>' + (detailedEmployee.email || '-') + '</span></div><div class="info-item"><label>宸ヤ綔閭</label><span>' + (detailedEmployee.workEmail || '-') + '</span></div><div class="info-item"><label>鍔炲叕鐢佃瘽</label><span>' + (detailedEmployee.officePhone || '-') + '</span></div><div class="info-item"><label>寰俊</label><span>' + (detailedEmployee.wechat || '-') + '</span></div><div class="info-item"><label>QQ</label><span>' + (detailedEmployee.qq || '-') + '</span></div><div class="info-item"><label>绱ф€ヨ仈绯讳汉</label><span>' + (detailedEmployee.emergencyContact || '-') + '</span></div><div class="info-item"><label>绱ф€ヨ仈绯荤數璇?/label><span>' + (detailedEmployee.emergencyPhone || '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">璇佷欢淇℃伅</h3><div class="info-grid"><div class="info-item"><label>韬唤璇佸彿</label><span>' + (detailedEmployee.idCard || '-') + '</span></div><div class="info-item"><label>韬唤璇佹湁鏁堟湡璧?/label><span>' + formatDate(detailedEmployee.idCardStartDate) + '</span></div><div class="info-item"><label>韬唤璇佹湁鏁堟湡姝?/label><span>' + formatDate(detailedEmployee.idCardEndDate) + '</span></div><div class="info-item"><label>妗ｆ瀛樻斁鍦?/label><span>' + (detailedEmployee.archiveLocation || '-') + '</span></div><div class="info-item"><label>鎴风睄绫诲瀷</label><span>' + (detailedEmployee.householdType || '-') + '</span></div><div class="info-item"><label>濠氬Щ鐘跺喌</label><span>' + (detailedEmployee.marriageStatus || '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">鏁欒偛鑳屾櫙</h3><div class="info-grid"><div class="info-item"><label>鏈€楂樺鍘?/label><span>' + (detailedEmployee.education || '-') + '</span></div><div class="info-item"><label>瀛︿綅</label><span>' + (detailedEmployee.degree || '-') + '</span></div><div class="info-item"><label>姣曚笟闄㈡牎</label><span>' + (detailedEmployee.schoolName || '-') + '</span></div><div class="info-item"><label>涓撲笟</label><span>' + (detailedEmployee.major || '-') + '</span></div><div class="info-item"><label>姣曚笟鏃ユ湡</label><span>' + formatDate(detailedEmployee.graduationDate) + '</span></div><div class="info-item"><label>澶栬鑳藉姏</label><span>' + (detailedEmployee.foreignLanguage || '-') + '</span></div><div class="info-item"><label>璁＄畻鏈烘妧鑳?/label><span>' + (detailedEmployee.computerSkill || '-') + '</span></div><div class="info-item"><label>宸ヤ綔骞撮檺</label><span>' + (detailedEmployee.workYears || '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">宸ヤ綔淇℃伅</h3><div class="info-grid"><div class="info-item"><label>鎵€灞為儴闂?/label><span>' + (dept ? dept.name : '-') + '</span></div><div class="info-item"><label>宀椾綅</label><span>' + (position ? position.name : '-') + '</span></div><div class="info-item"><label>鑱屼綅绛夌骇</label><span>' + (detailedEmployee.jobLevel || '-') + '</span></div><div class="info-item"><label>鏄惁绠＄悊宀?/label><span>' + (detailedEmployee.isManager === 1 ? '鏄? : detailedEmployee.isManager === 0 ? '鍚? : '-') + '</span></div><div class="info-item"><label>鍏ヨ亴鏃ユ湡</label><span>' + formatDate(detailedEmployee.entryDate) + '</span></div><div class="info-item"><label>杞鏃ユ湡</label><span>' + formatDate(detailedEmployee.regularDate) + '</span></div><div class="info-item"><label>璇曠敤鏈熸埅姝?/label><span>' + formatDate(detailedEmployee.probationEndDate) + '</span></div><div class="info-item"><label>鍛樺伐绫诲瀷</label><span>' + (detailedEmployee.employeeType || '-') + '</span></div><div class="info-item"><label>鐢ㄥ伐褰㈠紡</label><span>' + (detailedEmployee.hireType || '-') + '</span></div><div class="info-item"><label>鐩村睘涓婄骇</label><span>' + (detailedEmployee.directSuperior || '-') + '</span></div><div class="info-item"><label>姹囨姤瀵硅薄</label><span>' + (detailedEmployee.reportTo || '-') + '</span></div><div class="info-item"><label>鍔炲叕鍦扮偣</label><span>' + (detailedEmployee.officeLocation || '-') + '</span></div><div class="info-item"><label>宸ヤ綔鍩庡競</label><span>' + (detailedEmployee.workCity || '-') + '</span></div><div class="info-item"><label>閮ㄩ棬鎬ц川</label><span>' + (detailedEmployee.departmentNature || '-') + '</span></div><div class="info-item"><label>鑰冨嫟瑕佹眰</label><span>' + (detailedEmployee.attendanceRequired === 1 ? '闇€瑕佽€冨嫟' : detailedEmployee.attendanceRequired === 0 ? '鏃犻渶鑰冨嫟' : '-') + '</span></div><div class="info-item"><label>鐘舵€?/label><span class="' + (detailedEmployee.status === 1 ? 'status-active' : 'status-inactive') + '">' + (detailedEmployee.status === 1 ? '鍦ㄨ亴' : '绂昏亴') + '</span></div></div></div><div class="info-card"><h3 class="card-title">钖叕绂忓埄</h3><div class="info-grid"><div class="info-item"><label>鏈堣柂</label><span>' + (detailedEmployee.salary ? detailedEmployee.salary.toLocaleString() : '-') + '</span></div><div class="info-item"><label>骞磋柂</label><span>' + (detailedEmployee.annualSalary ? detailedEmployee.annualSalary.toLocaleString() : '-') + '</span></div><div class="info-item"><label>绀句繚鍩烘暟</label><span>' + (detailedEmployee.socialSecurityBase ? detailedEmployee.socialSecurityBase.toLocaleString() : '-') + '</span></div><div class="info-item"><label>鍏Н閲戝熀鏁?/label><span>' + (detailedEmployee.housingFundBase ? detailedEmployee.housingFundBase.toLocaleString() : '-') + '</span></div><div class="info-item"><label>鏄惁绛捐淇濆瘑鍗忚</label><span>' + (detailedEmployee.confidentialAgreement === 1 ? '鏄? : detailedEmployee.confidentialAgreement === 0 ? '鍚? : '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">鍦板潃淇℃伅</h3><div class="info-grid"><div class="info-item"><label>鎴风睄鍦板潃</label><span>' + (detailedEmployee.registeredAddress || '-') + '</span></div><div class="info-item"><label>鐜颁綇鍧€</label><span>' + (detailedEmployee.currentAddress || '-') + '</span></div><div class="info-item"><label>閭斂缂栫爜</label><span>' + (detailedEmployee.postalCode || '-') + '</span></div></div></div>' + remarkHtml + '<div class="info-card"><h3 class="card-title">鏁欒偛鑳屾櫙璇︽儏</h3><div class="info-grid"><div class="info-item"><label>澶栬姘村钩</label><span>' + (detailedEmployee.foreignLanguage || '-') + '</span></div><div class="info-item"><label>璁＄畻鏈烘按骞?/label><span>' + (detailedEmployee.computerSkill || '-') + '</span></div><div class="info-item"><label>鐜版湁鑱岀О</label><span>' + (detailedEmployee.title || '-') + '</span></div><div class="info-item"><label>鑱岀О鍙栧緱鏃堕棿</label><span>' + formatDate(detailedEmployee.titleDate) + '</span></div><div class="info-item"><label>鑱岀О璇佷功闄勪欢</label><span>' + (detailedEmployee.titleAttachment || '-') + '</span></div><div class="info-item"><label>鑱岀О鍒版湡棰勮</label><span>' + formatDate(detailedEmployee.titleExpireDate) + '</span></div><div class="info-item"><label>宸ヤ綔棰嗗煙</label><span>' + (detailedEmployee.workField || '-') + '</span></div><div class="info-item"><label>椤圭洰绾у埆</label><span>' + (detailedEmployee.projectLevel || '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">宸ヤ綔淇℃伅璇︽儏</h3><div class="info-grid"><div class="info-item"><label>鍒嗙棰嗗</label><span>' + (detailedEmployee.manager || '-') + '</span></div><div class="info-item"><label>鍔犲叆宸ヤ細鏃堕棿</label><span>' + formatDate(detailedEmployee.unionJoinDate) + '</span></div><div class="info-item"><label>姹囨姤鍏崇郴</label><span>' + (detailedEmployee.reportTo || '-') + '</span></div><div class="info-item"><label>妗ｆ瀛樻斁鐘舵€?/label><span>' + (detailedEmployee.archiveStatus || '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">钖叕绂忓埄璇︽儏</h3><div class="info-grid"><div class="info-item"><label>鏈堣柂鏍囧噯</label><span>' + (detailedEmployee.salary ? detailedEmployee.salary.toLocaleString() : '-') + '</span></div><div class="info-item"><label>绀句繚璐拱鍗曚綅</label><span>' + (detailedEmployee.socialSecurityCompany || '-') + '</span></div><div class="info-item"><label>绀句繚寮€濮嬫椂闂?/label><span>' + formatDate(detailedEmployee.socialSecurityStartDate) + '</span></div><div class="info-item"><label>鍏Н閲戣处鍙?/label><span>' + (detailedEmployee.providentFundAccount || '-') + '</span></div><div class="info-item"><label>缁╂晥濂栭噾姣斾緥</label><span>' + (detailedEmployee.performanceBonusRatio || '-') + '</span></div><div class="info-item"><label>椁愯ˉ</label><span>' + (detailedEmployee.mealAllowance ? detailedEmployee.mealAllowance.toLocaleString() : '-') + '</span></div><div class="info-item"><label>浜ら€氳ˉ</label><span>' + (detailedEmployee.transportAllowance ? detailedEmployee.transportAllowance.toLocaleString() : '-') + '</span></div><div class="info-item"><label>閫氳琛?/label><span>' + (detailedEmployee.communicationAllowance ? detailedEmployee.communicationAllowance.toLocaleString() : '-') + '</span></div><div class="info-item"><label>钖叕淇濆瘑绛夌骇</label><span>' + (detailedEmployee.salarySecurityLevel || '-') + '</span></div><div class="info-item"><label>閾惰鍗″彿</label><span>' + (detailedEmployee.bankCard || '-') + '</span></div><div class="info-item"><label>寮€鎴疯</label><span>' + (detailedEmployee.bankName || '-') + '</span></div><div class="info-item"><label>鍏Н閲戝熀鏁?/label><span>' + (detailedEmployee.providentFundBase ? detailedEmployee.providentFundBase.toLocaleString() : '-') + '</span></div></div></div><div class="info-card"><h3 class="card-title">闄勪欢淇℃伅</h3><div class="info-grid"><div class="info-item"><label>绠€鍘嗛檮浠?/label><span>' + (detailedEmployee.resumeAttachment || '-') + '</span></div><div class="info-item"><label>浣撴鎶ュ憡闄勪欢</label><span>' + (detailedEmployee.healthReportAttachment || '-') + '</span></div><div class="info-item"><label>鍔冲姩鍚堝悓鎵弿浠?/label><span>' + (detailedEmployee.contractAttachment || '-') + '</span></div><div class="info-item"><label>淇濆瘑鍗忚鎵弿浠?/label><span>' + (detailedEmployee.confidentialityAttachment || '-') + '</span></div><div class="info-item"><label>绔炰笟闄愬埗鍗忚</label><span>' + (detailedEmployee.nonCompeteAttachment || '-') + '</span></div><div class="info-item"><label>鍏ヨ亴鏉愭枡娓呭崟</label><span>' + (detailedEmployee.entryMaterialsChecklist || '-') + '</span></div><div class="info-item"><label>韬唤璇侀檮浠?/label><span>' + (detailedEmployee.idCardAttachment || '-') + '</span></div><div class="info-item"><label>鍋ュ悍鎶ュ憡</label><span>' + (detailedEmployee.healthReport || '-') + '</span></div></div></div>' + workExperiencesHtml + familyMembersHtml + projectPerformancesHtml + departmentInfosHtml + educationInfosHtml + awardsHtml + titleInfosHtml + registrationsHtml + positionCertificatesHtml + transfersHtml + processRecordsHtml + contractsHtml + trainingsHtml + rewardPunishmentsHtml + '</div>';

            if (callback) callback(result);
        },

        bindEvents: function() {
            var self = this;
            if (state.eventsBound) {
                return;
            }
            state.eventsBound = true;

            var contentEl = document.getElementById('content');
            if (contentEl) {
                contentEl.addEventListener('click', function(e) {
                    var editDeptBtn = document.getElementById('editDeptBtn');
                    if (editDeptBtn && e.target === editDeptBtn) {
                        self.openDeptModal(state.selectedDept);
                    }

                    var deleteDeptBtn = document.getElementById('deleteDeptBtn');
                    if (deleteDeptBtn && e.target === deleteDeptBtn) {
                        self.handleDeleteDept(state.selectedDept);
                    }

                    var backToDeptBtn = document.getElementById('backToDept');
                    if (backToDeptBtn && e.target === backToDeptBtn) {
                        state.navSelectedType = null;
                        state.navSelectedId = null;
                        refreshContent();
                    }

                    var empItem = e.target.closest('.emp-item, .employee-card');
                    if (empItem) {
                        var empId = parseInt(empItem.dataset.employeeId);
                        if (empId) {
                            state.navSelectedType = 'employee';
                            state.navSelectedId = empId;
                            refreshContent();
                        }
                    }

                    var addDeptBtn = document.getElementById('addDeptBtn');
                    if (addDeptBtn && e.target === addDeptBtn) {
                        self.openDeptModal(null);
                    }

                    var editBtn = e.target.closest('.edit-dept-btn');
                    if (editBtn) {
                        var deptId = parseInt(editBtn.dataset.id);
                        var dept = state.departments.find(function(d) { return d.id === deptId; });
                        if (dept) {
                            self.openDeptModal(dept);
                        }
                    }

                    var deleteBtn = e.target.closest('.delete-dept-btn');
                    if (deleteBtn) {
                        var deptId = parseInt(deleteBtn.dataset.id);
                        var dept = state.departments.find(function(d) { return d.id === deptId; });
                        if (dept) {
                            self.handleDeleteDept(dept);
                        }
                    }
                });
            }
        },

        handleDeleteDept: function(dept) {
            var self = this;
            if (confirm('纭畾瑕佸垹闄ら儴闂?' + dept.name + '"鍚楋紵')) {
                API.deleteDepartment(dept.id).then(function(res) {
                    if (res.code === 200) {
                        Toast.success('鍒犻櫎鎴愬姛');
                        self.loadDepartments(function() {
                            if (state.departments.length > 0) {
                                state.selectedDept = state.departments[0];
                                self.loadDepartmentEmployees(state.selectedDept.id, 1, function() {
                                    refreshContent();
                                });
                            } else {
                                state.selectedDept = null;
                                refreshContent();
                            }
                        });
                    } else {
                        Toast.error(res.message || '鍒犻櫎澶辫触');
                    }
                }).catch(function(error) {
                    Toast.error('鍒犻櫎澶辫触');
                });
            }
        },

        openDeptModal: function(dept) {
            var self = this;
            var isEdit = dept ? true : false;
            var parentOptions = '<option value="">鏃犱笂绾ч儴闂?/option>';
            var buildOptions = function(departments, level) {
                for (var i = 0; i < departments.length; i++) {
                    var d = departments[i];
                    if (!isEdit || d.id !== dept.id) {
                        var prefix = '';
                        for (var j = 0; j < level; j++) {
                            prefix += '銆€';
                        }
                        if (level > 0) {
                            prefix += '鈹?;
                        }
                        parentOptions += '<option value="' + d.id + '"' + (dept && dept.parentId === d.id ? ' selected' : '') + '>' + prefix + d.name + '</option>';
                        if (d.children && d.children.length > 0) {
                            buildOptions(d.children, level + 1);
                        }
                    }
                }
            };
            buildOptions(state.departments, 0);

            var employeeOptions = '<option value="">璇烽€夋嫨璐熻矗浜?/option>';
            if (state.allEmployees.length > 0) {
                for (var i = 0; i < state.allEmployees.length; i++) {
                    var emp = state.allEmployees[i];
                    var selected = dept && dept.leaderId === emp.id ? ' selected' : '';
                    employeeOptions += '<option value="' + emp.id + '"' + selected + '>' + emp.name + '</option>';
                }
            }

            var modalInstance = Modal.open({
                title: isEdit ? '缂栬緫閮ㄩ棬' : '鏂板閮ㄩ棬',
                content: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;"><div class="form-field"><label>閮ㄩ棬鍚嶇О <span style="color: red;">*</span></label><input type="text" id="deptName" placeholder="璇疯緭鍏ラ儴闂ㄥ悕绉? value="' + (dept ? dept.name : '') + '"></div><div class="form-field"><label>閮ㄩ棬缂栫爜</label><input type="text" id="deptCode" placeholder="璇疯緭鍏ラ儴闂ㄧ紪鐮? value="' + (dept ? dept.code : '') + '"></div><div class="form-field"><label>涓婄骇閮ㄩ棬</label><select id="parentId">' + parentOptions + '</select></div><div class="form-field"><label>閮ㄩ棬璐熻矗浜?/label><select id="leaderId">' + employeeOptions + '</select></div><div class="form-field"><label>鑱旂郴鐢佃瘽</label><input type="text" id="deptPhone" placeholder="璇疯緭鍏ヨ仈绯荤數璇? value="' + (dept ? dept.phone || '' : '') + '"></div><div class="form-field"><label>鎺掑簭</label><input type="number" id="sortOrder" placeholder="鏁板瓧瓒婂皬瓒婇潬鍓? value="' + (dept ? dept.sortOrder || 0 : 0) + '"></div><div class="form-field full" style="grid-column: span 2;"><label>鐘舵€?/label><select id="deptStatus"><option value="1" ' + (dept && dept.status === 1 ? 'selected' : '') + '>鍚敤</option><option value="0" ' + (dept && dept.status === 0 ? 'selected' : '') + '>绂佺敤</option></select></div><div class="form-field full" style="grid-column: span 2;"><label>閮ㄩ棬鎻忚堪</label><textarea id="deptDesc" rows="3" placeholder="璇疯緭鍏ラ儴闂ㄦ弿杩?>' + (dept ? dept.description || '' : '') + '</textarea></div></div>',
                footer: '<button class="btn btn-default" id="modalCancelBtn">鍙栨秷</button><button class="btn btn-primary" id="modalSaveBtn">淇濆瓨</button>'
            });

            setTimeout(function() {
                var saveBtn = document.getElementById('modalSaveBtn');
                if (saveBtn) {
                    saveBtn.addEventListener('click', function() {
                        var name = document.getElementById('deptName').value.trim();
                        if (!name) {
                            Toast.error('璇疯緭鍏ラ儴闂ㄥ悕绉?);
                            return;
                        }
                        var data = {
                            name: name,
                            code: document.getElementById('deptCode').value.trim(),
                            parentId: parseInt(document.getElementById('parentId').value) || null,
                            leaderId: parseInt(document.getElementById('leaderId').value) || null,
                            phone: document.getElementById('deptPhone').value.trim(),
                            sortOrder: parseInt(document.getElementById('sortOrder').value) || 0,
                            status: parseInt(document.getElementById('deptStatus').value),
                            description: document.getElementById('deptDesc').value.trim()
                        };
                        var url = '/api/org/department';
                        var method = 'POST';
                        if (isEdit) {
                            url = '/api/org/department/' + dept.id;
                            method = 'PUT';
                        }
                        API.request(url, { method: method, body: JSON.stringify(data) }).then(function(res) {
                            if (res.code === 200) {
                                Toast.success(isEdit ? '缂栬緫鎴愬姛' : '鏂板鎴愬姛');
                                modalInstance.close();
                                self.loadDepartments(function() {
                                    self.loadStatistics(function() {
                                        refreshContent();
                                    });
                                });
                            } else {
                                Toast.error(res.message || '淇濆瓨澶辫触');
                            }
                        }).catch(function(error) {
                            Toast.error('淇濆瓨澶辫触');
                        });
                    });
                }

                var cancelBtn = document.getElementById('modalCancelBtn');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function() {
                        modalInstance.close();
                    });
                }
            }, 50);
        },

        destroy: function() {}
    };

    loadModules(function() {
        console.log('org module dependencies loaded');
    });

    return orgModule;
})();

export default orgModule;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = orgModule;
}