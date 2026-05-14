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
        navSelectedId: null,
        searchQuery: ''
    };

    function getParentName(deptId) {
        var dept = state.departments.find(function(d) { return d.id === deptId; });
        return dept ? dept.name : '-';
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
        state.searchQuery = '';
    }

    function refreshContent(callback) {
        var content = document.getElementById('content');
        if (content) {
            orgModule.renderContent(content, callback);
        } else if (callback) {
            callback();
        }
    }

    function buildDepartmentTree(depts) {
        function buildTree(items, parentId) {
            return items.filter(function(item) { return item.parentId === parentId; }).map(function(item) {
                var children = buildTree(items, item.id);
                return {
                    ...item,
                    children: children
                };
            });
        }
        return buildTree(depts, 0);
    }

    var orgModule = {
        render: function(container) {
            initState();
            container.innerHTML = Skeleton.renderCard();
            var self = this;
            loadModules(function() {
                self.loadInitialData(function() {
                    self.renderContent(container);
                    self.bindEvents();
                });
            });
        },

        loadInitialData: function(callback) {
            var completed = 0;
            var total = 4;

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
                    state.departments = buildDepartmentTree(res.data);
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
                var mainHtml = '<div class="org-container">' + mainContent + '</div>';
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

        getPositionStatus: function(pos) {
            var posEmps = state.allEmployees.filter(function(e) {
                return e.positionId === pos.id || e.position_id === pos.id;
            });
            if (posEmps.length >= (pos.headcount || 0)) {
                return { text: '已满编', class: 'status-full' };
            } else if (posEmps.length === 0) {
                return { text: '空缺', class: 'status-vacant' };
            } else {
                return { text: '招聘中', class: 'status-recruiting' };
            }
        },

        getEmployeeStatus: function(emp) {
            return emp.status === 1 ? { text: '在职', class: 'status-active' } : { text: '离职', class: 'status-inactive' };
        },

        getDeptStatus: function(dept) {
            return dept.status === 1 ? { text: '启用', class: 'status-enabled' } : { text: '禁用', class: 'status-disabled' };
        },

        getFillRate: function(pos) {
            var posEmps = state.allEmployees.filter(function(e) {
                return e.positionId === pos.id || e.position_id === pos.id;
            });
            var headcount = pos.headcount || 0;
            return headcount > 0 ? Math.round((posEmps.length / headcount) * 100) : 0;
        },

        getFillRateColor: function(rate) {
            if (rate >= 80) return '#10b981';
            if (rate >= 50) return '#f59e0b';
            return '#ef4444';
        },

        renderDashboard: function() {
            var stats = state.statistics;
            var totalHeadcount = 0;
            var totalOnboard = 0;
            
            state.positions.forEach(function(p) {
                totalHeadcount += (p.headcount || 0);
                totalOnboard += state.allEmployees.filter(function(e) {
                    return e.positionId === p.id || e.position_id === p.id;
                }).length;
            });

            var fillRate = totalHeadcount > 0 ? Math.round((totalOnboard / totalHeadcount) * 100) : 0;

            var statsCards = '<div class="stats-cards-grid">';
            statsCards += this.renderStatCard('department', '部门总数', stats.departmentCount || state.departments.length, 'blue');
            statsCards += this.renderStatCard('employee', '员工总数', stats.employeeCount || state.allEmployees.length, 'green');
            statsCards += this.renderStatCard('position', '岗位总数', stats.positionCount || state.positions.length, 'purple');
            statsCards += this.renderStatCard('key-position', '关键岗位', state.keyPositions.length, 'orange');
            statsCards += this.renderStatCard('fill-rate', '编制达成率', fillRate + '%', 'cyan', true, fillRate);
            statsCards += this.renderStatCard('vacant', '空缺岗位', totalHeadcount - totalOnboard, 'red');
            statsCards += '</div>';

            var deptTreeHtml = this.renderDeptTreeCards(state.departments);

            var positionsList = this.renderPositionsList();

            return '<div class="org-dashboard">' +
                '<div class="dashboard-header">' +
                    '<h1>组织架构</h1>' +
                    '<div class="dashboard-actions">' +
                        '<button class="btn btn-primary" id="addDeptBtn">+ 新建部门</button>' +
                        '<button class="btn btn-secondary" id="addPositionBtn">+ 新建岗位</button>' +
                    '</div>' +
                '</div>' +
                statsCards +
                '<div class="dashboard-main">' +
                    '<div class="main-sidebar">' +
                        '<div class="search-box">' +
                            '<input type="text" id="orgSearchInput" placeholder="搜索部门、岗位或员工..." />' +
                            '<span class="search-icon">🔍</span>' +
                        '</div>' +
                        '<div class="tree-container">' + deptTreeHtml + '</div>' +
                    '</div>' +
                    '<div class="main-content">' + positionsList + '</div>' +
                '</div>' +
            '</div>';
        },

        renderStatCard: function(icon, label, value, color, showProgress, progressValue) {
            var iconMap = {
                'department': '🏢',
                'employee': '👤',
                'position': '💼',
                'key-position': '⭐',
                'fill-rate': '📊',
                'vacant': '🔍'
            };
            
            var colorClass = 'stat-card-' + color;
            var progressHtml = showProgress ? '<div class="stat-progress"><div class="stat-progress-bar" style="width: ' + progressValue + '%"></div></div>' : '';
            
            return '<div class="stat-card ' + colorClass + '">' +
                '<div class="stat-icon">' + iconMap[icon] + '</div>' +
                '<div class="stat-info">' +
                    '<div class="stat-value">' + value + '</div>' +
                    '<div class="stat-label">' + label + '</div>' +
                    progressHtml +
                '</div>' +
            '</div>';
        },

        renderDeptTreeCards: function(depts, level) {
            var self = this;
            if (level === undefined) level = 0;
            var html = '';
            
            for (var i = 0; i < depts.length; i++) {
                var dept = depts[i];
                var deptPositions = state.positions.filter(function(p) { return p.departmentId === dept.id; });
                var deptEmployees = state.allEmployees.filter(function(e) { return e.departmentId === dept.id; });
                var headcount = deptPositions.reduce(function(sum, p) { return sum + (p.headcount || 0); }, 0);
                var fillRate = headcount > 0 ? Math.round((deptEmployees.length / headcount) * 100) : 0;
                var status = this.getDeptStatus(dept);
                var paddingLeft = level * 12;

                html += '<div class="dept-card" data-dept-id="' + dept.id + '" style="padding-left: ' + paddingLeft + 'px;">';
                html += '<div class="dept-card-header">';
                html += '<div class="dept-card-left">';
                html += '<span class="dept-icon">🏢</span>';
                html += '<div class="dept-info">';
                html += '<div class="dept-name">' + dept.name + '</div>';
                html += '<div class="dept-meta">';
                html += '<span class="dept-count">员工 ' + deptEmployees.length + '人</span>';
                html += '<span class="dept-divider">|</span>';
                html += '<span class="dept-count">岗位 ' + deptPositions.length + '个</span>';
                html += '</div>';
                html += '</div>';
                html += '</div>';
                html += '<div class="dept-card-right">';
                html += '<span class="status-tag ' + status.class + '">' + status.text + '</span>';
                html += '<div class="dept-fill-rate">';
                html += '<div class="fill-rate-bar"><div class="fill-rate-fill" style="width: ' + fillRate + '%"></div></div>';
                html += '<span class="fill-rate-text">' + fillRate + '%</span>';
                html += '</div>';
                html += '<div class="dept-actions">';
                html += '<button class="action-btn edit-btn" data-id="' + dept.id + '" title="编辑"><svg viewBox="0 0 24 24"><path d="M12 20h9l-4-4H3v-4l4-4h9l4 4v9l-4 4zm-1-7.5l1.5-1.5 3 3-1.5 1.5-3-3z"/></svg></button>';
                html += '<button class="action-btn delete-btn" data-id="' + dept.id + '" title="删除"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>';
                html += '</div>';
                html += '</div>';
                html += '</div>';

                if (deptPositions.length > 0) {
                    html += '<div class="dept-positions">';
                    for (var j = 0; j < deptPositions.length; j++) {
                        html += self.renderPositionMiniCard(deptPositions[j]);
                    }
                    html += '</div>';
                }

                if (dept.children && dept.children.length > 0) {
                    html += self.renderDeptTreeCards(dept.children, level + 1);
                }

                html += '</div>';
            }

            return html;
        },

        renderPositionMiniCard: function(pos) {
            var posEmps = state.allEmployees.filter(function(e) {
                return e.positionId === pos.id || e.position_id === pos.id;
            });
            var status = this.getPositionStatus(pos);
            var fillRate = this.getFillRate(pos);
            
            return '<div class="position-mini-card" data-pos-id="' + pos.id + '">' +
                '<div class="pos-mini-header">' +
                    '<span class="pos-icon">💼</span>' +
                    '<span class="pos-name">' + pos.name + '</span>' +
                    '<span class="status-tag ' + status.class + '">' + status.text + '</span>' +
                '</div>' +
                '<div class="pos-mini-body">' +
                    '<div class="pos-fill-rate">' +
                        '<div class="mini-fill-bar"><div class="mini-fill-fill" style="width: ' + fillRate + '%"></div></div>' +
                        '<span>' + posEmps.length + '/' + (pos.headcount || 0) + '</span>' +
                    '</div>' +
                    '<div class="pos-employees">' +
                        posEmps.slice(0, 3).map(function(e) {
                            return '<span class="emp-chip">' + e.name.charAt(0) + '</span>';
                        }).join('') +
                        (posEmps.length > 3 ? '<span class="emp-more">+' + (posEmps.length - 3) + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>';
        },

        renderPositionsList: function() {
            var positions = state.positions;
            if (positions.length === 0) {
                return '<div class="empty-state"><span class="empty-icon">📋</span><div class="empty-text">暂无岗位数据</div></div>';
            }

            var html = '<div class="positions-section">' +
                '<div class="section-header">' +
                    '<h2>岗位列表</h2>' +
                    '<div class="filter-tabs">' +
                        '<button class="filter-tab active" data-filter="all">全部</button>' +
                        '<button class="filter-tab" data-filter="vacant">空缺</button>' +
                        '<button class="filter-tab" data-filter="recruiting">招聘中</button>' +
                        '<button class="filter-tab" data-filter="full">已满编</button>' +
                    '</div>' +
                '</div>' +
                '<div class="positions-grid">';

            for (var i = 0; i < positions.length; i++) {
                html += this.renderPositionCard(positions[i]);
            }

            html += '</div></div>';
            return html;
        },

        renderPositionCard: function(pos) {
            var dept = state.departments.find(function(d) { return d.id === pos.departmentId; });
            var posEmps = state.allEmployees.filter(function(e) {
                return e.positionId === pos.id || e.position_id === pos.id;
            });
            var status = this.getPositionStatus(pos);
            var fillRate = this.getFillRate(pos);
            var isKeyPosition = pos.isKeyPosition === 1;

            return '<div class="position-card" data-pos-id="' + pos.id + '">' +
                '<div class="pos-card-header">' +
                    '<div class="pos-card-left">' +
                        '<span class="pos-icon-lg">💼</span>' +
                        '<div class="pos-card-info">' +
                            '<div class="pos-card-name">' + pos.name + (isKeyPosition ? '<span class="key-badge">⭐</span>' : '') + '</div>' +
                            '<div class="pos-card-dept">' + (dept ? dept.name : '-') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<span class="status-tag ' + status.class + '">' + status.text + '</span>' +
                '</div>' +
                '<div class="pos-card-body">' +
                    '<div class="pos-stats-row">' +
                        '<div class="pos-stat-item">' +
                            '<div class="pos-stat-value">' + posEmps.length + '</div>' +
                            '<div class="pos-stat-label">在职人数</div>' +
                        '</div>' +
                        '<div class="pos-stat-item">' +
                            '<div class="pos-stat-value">' + (pos.headcount || 0) + '</div>' +
                            '<div class="pos-stat-label">编制人数</div>' +
                        '</div>' +
                        '<div class="pos-stat-item">' +
                            '<div class="pos-stat-value fill-rate-value" style="color: ' + this.getFillRateColor(fillRate) + '">' + fillRate + '%</div>' +
                            '<div class="pos-stat-label">达成率</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="pos-progress">' +
                        '<div class="pos-progress-bar"><div class="pos-progress-fill" style="width: ' + fillRate + '%; background: ' + this.getFillRateColor(fillRate) + '"></div></div>' +
                    '</div>' +
                '</div>' +
                '<div class="pos-card-footer">' +
                    '<div class="pos-emp-list">' +
                        posEmps.slice(0, 4).map(function(e) {
                            var empStatus = this.getEmployeeStatus(e);
                            return '<div class="emp-mini-card ' + empStatus.class + '" data-emp-id="' + e.id + '">' +
                                '<span class="emp-mini-avatar">' + e.name.charAt(0) + '</span>' +
                                '<span class="emp-mini-name">' + e.name + '</span>' +
                            '</div>';
                        }.bind(this)).join('') +
                        (posEmps.length > 4 ? '<div class="emp-more-card">+' + (posEmps.length - 4) + '</div>' : '') +
                    '</div>' +
                    '<div class="pos-card-actions">' +
                        '<button class="action-btn edit-btn" data-id="' + pos.id + '" title="编辑"><svg viewBox="0 0 24 24"><path d="M12 20h9l-4-4H3v-4l4-4h9l4 4v9l-4 4zm-1-7.5l1.5-1.5 3 3-1.5 1.5-3-3z"/></svg></button>' +
                        '<button class="action-btn delete-btn" data-id="' + pos.id + '" title="删除"><svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        },

        renderDeptDashboard: function(dept) {
            var deptPositions = state.positions.filter(function(p) { return p.departmentId === dept.id; });
            var deptEmployees = state.allEmployees.filter(function(e) { return e.departmentId === dept.id; });
            var parentName = dept.parentId ? getParentName(dept.parentId) : '-';
            var status = this.getDeptStatus(dept);

            var totalHeadcount = 0;
            var totalOnboard = 0;
            deptPositions.forEach(function(p) {
                totalHeadcount += (p.headcount || 0);
                totalOnboard += state.allEmployees.filter(function(e) {
                    return e.positionId === p.id || e.position_id === p.id;
                }).length;
            });
            var fillRate = totalHeadcount > 0 ? Math.round((totalOnboard / totalHeadcount) * 100) : 0;
            var vacantCount = Math.max(0, totalHeadcount - totalOnboard);

            return '<div class="dept-detail-page">' +
                '<div class="detail-header">' +
                    '<button class="btn btn-link back-btn" id="backToDashboard">← 返回看板</button>' +
                    '<div class="detail-title-section">' +
                        '<span class="detail-icon">🏢</span>' +
                        '<div class="detail-title-info">' +
                            '<h1>' + dept.name + '</h1>' +
                            '<div class="detail-meta">' +
                                '<span class="meta-item">上级部门: ' + parentName + '</span>' +
                                '<span class="meta-divider">|</span>' +
                                '<span class="meta-item">部门编码: ' + (dept.code || '-') + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="detail-actions">' +
                        '<span class="status-tag ' + status.class + '">' + status.text + '</span>' +
                        '<button class="btn btn-primary" id="editDeptBtn">编辑部门</button>' +
                        '<button class="btn btn-danger" id="deleteDeptBtn">删除部门</button>' +
                    '</div>' +
                '</div>' +
                '<div class="detail-stats">' +
                    this.renderDetailStat('岗位数量', deptPositions.length, '#667eea') +
                    this.renderDetailStat('在职人数', totalOnboard, '#10b981') +
                    this.renderDetailStat('编制人数', totalHeadcount, '#3b82f6') +
                    this.renderDetailStat('空缺人数', vacantCount, '#f59e0b') +
                '</div>' +
                '<div class="detail-content">' +
                    '<div class="detail-section">' +
                        '<div class="section-header">' +
                            '<h2>编制达成率</h2>' +
                        '</div>' +
                        '<div class="fill-rate-chart">' +
                            '<div class="fill-rate-ring">' +
                                '<svg viewBox="0 0 100 100">' +
                                    '<circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="8"/>' +
                                    '<circle cx="50" cy="50" r="40" fill="none" stroke="' + this.getFillRateColor(fillRate) + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + fillRate * 2.51 + ' 251" transform="rotate(-90 50 50)"/>' +
                                '</svg>' +
                                '<div class="fill-rate-center">' +
                                    '<div class="fill-rate-number">' + fillRate + '%</div>' +
                                    '<div class="fill-rate-label">编制达成</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="fill-rate-bars">' +
                                '<div class="bar-item">' +
                                    '<div class="bar-label">已入职</div>' +
                                    '<div class="bar"><div class="bar-fill" style="width: ' + fillRate + '%; background: #10b981"></div></div>' +
                                    '<div class="bar-value">' + totalOnboard + '人</div>' +
                                '</div>' +
                                '<div class="bar-item">' +
                                    '<div class="bar-label">空缺</div>' +
                                    '<div class="bar"><div class="bar-fill" style="width: ' + (100 - fillRate) + '%; background: #f59e0b"></div></div>' +
                                    '<div class="bar-value">' + vacantCount + '人</div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="detail-section">' +
                        '<div class="section-header">' +
                            '<h2>部门岗位</h2>' +
                            '<button class="btn btn-secondary btn-sm" id="addPositionBtn">+ 新建岗位</button>' +
                        '</div>' +
                        '<div class="positions-list-detail">' +
                            (deptPositions.length > 0 ? deptPositions.map(function(pos) {
                                return this.renderPositionDetailCard(pos);
                            }.bind(this)).join('') : '<div class="empty-state-small">暂无岗位</div>') +
                        '</div>' +
                    '</div>' +
                    '<div class="detail-section">' +
                        '<div class="section-header">' +
                            '<h2>部门员工</h2>' +
                        '</div>' +
                        '<div class="employees-grid">' +
                            (deptEmployees.length > 0 ? deptEmployees.map(function(emp) {
                                return this.renderEmployeeCard(emp);
                            }.bind(this)).join('') : '<div class="empty-state-small">暂无员工</div>') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        },

        renderDetailStat: function(label, value, color) {
            return '<div class="detail-stat">' +
                '<div class="stat-dot" style="background: ' + color + '"></div>' +
                '<div class="stat-content">' +
                    '<div class="stat-value">' + value + '</div>' +
                    '<div class="stat-label">' + label + '</div>' +
                '</div>' +
            '</div>';
        },

        renderPositionDetailCard: function(pos) {
            var posEmps = state.allEmployees.filter(function(e) {
                return e.positionId === pos.id || e.position_id === pos.id;
            });
            var status = this.getPositionStatus(pos);
            var fillRate = this.getFillRate(pos);

            return '<div class="position-detail-card" data-pos-id="' + pos.id + '">' +
                '<div class="pos-detail-header">' +
                    '<span class="pos-icon">💼</span>' +
                    '<div class="pos-detail-info">' +
                        '<div class="pos-detail-name">' + pos.name + (pos.isKeyPosition === 1 ? '<span class="key-badge">⭐</span>' : '') + '</div>' +
                        '<div class="pos-detail-code">编码: ' + (pos.code || '-') + '</div>' +
                    '</div>' +
                    '<span class="status-tag ' + status.class + '">' + status.text + '</span>' +
                '</div>' +
                '<div class="pos-detail-body">' +
                    '<div class="pos-detail-stats">' +
                        '<span>' + posEmps.length + '人在职</span>' +
                        '<span>|</span>' +
                        '<span>编制' + (pos.headcount || 0) + '人</span>' +
                    '</div>' +
                    '<div class="pos-detail-progress">' +
                        '<div class="progress-bar"><div class="progress-fill" style="width: ' + fillRate + '%"></div></div>' +
                        '<span>' + fillRate + '%</span>' +
                    '</div>' +
                '</div>' +
                '<div class="pos-detail-footer">' +
                    '<div class="pos-detail-actions">' +
                        '<button class="action-btn edit-btn" data-id="' + pos.id + '">编辑</button>' +
                        '<button class="action-btn delete-btn" data-id="' + pos.id + '">删除</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        },

        renderEmployeeCard: function(emp) {
            var pos = state.positions.find(function(p) { return p.id === emp.positionId || p.id === emp.position_id; });
            var status = this.getEmployeeStatus(emp);

            return '<div class="employee-card" data-emp-id="' + emp.id + '">' +
                '<div class="emp-avatar">' + emp.name.charAt(0) + '</div>' +
                '<div class="emp-info">' +
                    '<div class="emp-name">' + emp.name + '</div>' +
                    '<div class="emp-position">' + (pos ? pos.name : '-') + '</div>' +
                    '<div class="emp-meta">' +
                        '<span class="emp-no">' + (emp.employeeNo || '-') + '</span>' +
                        '<span class="status-tag small ' + status.class + '">' + status.text + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="emp-actions">' +
                    '<button class="action-btn view-btn" data-id="' + emp.id + '" title="查看详情"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg></button>' +
                '</div>' +
            '</div>';
        },

        renderPositionDetail: function(positionId, callback) {
            var position = state.positions.find(function(p) { return p.id === positionId; });
            if (!position && window.orgData && window.orgData.positions) {
                position = window.orgData.positions.find(function(p) { return p.id === positionId; });
            }
            if (!position) {
                if (callback) callback('<div class="empty-state"><span class="empty-icon">🔍</span><div class="empty-text">找不到该岗位</div></div>');
                return;
            }

            var dept = state.departments.find(function(d) { return d.id === position.departmentId; });
            var posEmployees = state.allEmployees.filter(function(e) {
                return e.positionId === position.id || e.position_id === position.id;
            });
            var status = this.getPositionStatus(position);
            var fillRate = this.getFillRate(position);

            var result = '<div class="position-detail-page">' +
                '<div class="detail-header">' +
                    '<button class="btn btn-link back-btn" id="backToDept">← 返回部门</button>' +
                    '<div class="detail-title-section">' +
                        '<span class="detail-icon">💼</span>' +
                        '<div class="detail-title-info">' +
                            '<h1>' + position.name + '</h1>' +
                            '<div class="detail-meta">' +
                                '<span class="meta-item">所属部门: ' + (dept ? dept.name : '-') + '</span>' +
                                '<span class="meta-divider">|</span>' +
                                '<span class="status-tag ' + status.class + '">' + status.text + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="detail-actions">' +
                        '<button class="btn btn-primary" id="editPositionBtn">编辑岗位</button>' +
                        '<button class="btn btn-danger" id="deletePositionBtn">删除岗位</button>' +
                    '</div>' +
                '</div>' +
                '<div class="position-detail-content">' +
                    '<div class="detail-info-grid">' +
                        '<div class="info-item"><label>岗位编码</label><span>' + (position.code || '-') + '</span></div>' +
                        '<div class="info-item"><label>岗位级别</label><span>' + this.getLevelName(position.level) + '</span></div>' +
                        '<div class="info-item"><label>编制人数</label><span>' + (position.headcount || 0) + '</span></div>' +
                        '<div class="info-item"><label>在职人数</label><span>' + posEmployees.length + '</span></div>' +
                        '<div class="info-item"><label>编制达成率</label><span style="color: ' + this.getFillRateColor(fillRate) + '">' + fillRate + '%</span></div>' +
                        '<div class="info-item"><label>是否关键岗位</label><span>' + (position.isKeyPosition === 1 ? '是' : '否') + '</span></div>' +
                    '</div>' +
                    '<div class="detail-section">' +
                        '<div class="section-header"><h2>职责描述</h2></div>' +
                        '<div class="detail-description">' + (position.duties || '暂无职责描述') + '</div>' +
                    '</div>' +
                    '<div class="detail-section">' +
                        '<div class="section-header"><h2>岗位要求</h2></div>' +
                        '<div class="detail-description">' + (position.requirements || '暂无岗位要求') + '</div>' +
                    '</div>' +
                    '<div class="detail-section">' +
                        '<div class="section-header"><h2>在岗人员</h2></div>' +
                        '<div class="employees-list-detail">' +
                            (posEmployees.length > 0 ? posEmployees.map(function(emp) {
                                return this.renderEmployeeDetailCard(emp);
                            }.bind(this)).join('') : '<div class="empty-state-small">暂无在岗人员</div>') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

            if (callback) callback(result);
        },

        getLevelName: function(level) {
            var levels = { 1: '初级', 2: '中级', 3: '高级', 4: '主管', 5: '高级主管' };
            return levels[level] || '-';
        },

        renderEmployeeDetailCard: function(emp) {
            var status = this.getEmployeeStatus(emp);

            return '<div class="employee-detail-card" data-emp-id="' + emp.id + '">' +
                '<div class="emp-detail-avatar">' + emp.name.charAt(0) + '</div>' +
                '<div class="emp-detail-info">' +
                    '<div class="emp-detail-name">' + emp.name + '</div>' +
                    '<div class="emp-detail-no">' + (emp.employeeNo || '-') + '</div>' +
                '</div>' +
                '<span class="status-tag ' + status.class + '">' + status.text + '</span>' +
                '<button class="action-btn view-btn" data-id="' + emp.id + '">查看详情</button>' +
            '</div>';
        },

        renderEmployeeDetail: function(employeeId, callback) {
            var employee = state.allEmployees.find(function(e) { return e.id === employeeId; });
            if (!employee && window.orgData && window.orgData.employees) {
                employee = window.orgData.employees.find(function(e) { return e.id === employeeId; });
            }
            if (!employee) {
                if (callback) callback('<div class="empty-state"><span class="empty-icon">🔍</span><div class="empty-text">找不到该员工</div></div>');
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
            var position = state.positions.find(function(p) {
                return p.id === detailedEmployee.positionId || p.id === detailedEmployee.position_id;
            });
            var status = this.getEmployeeStatus(detailedEmployee);

            var result = '<div class="employee-detail-page">' +
                '<div class="detail-header">' +
                    '<button class="btn btn-link back-btn" id="backToDept">← 返回</button>' +
                    '<div class="detail-title-section">' +
                        '<span class="detail-icon emp-icon">' + detailedEmployee.name.charAt(0) + '</span>' +
                        '<div class="detail-title-info">' +
                            '<h1>' + detailedEmployee.name + '</h1>' +
                            '<div class="detail-meta">' +
                                '<span class="meta-item">' + (position ? position.name : '-') + '</span>' +
                                '<span class="meta-divider">|</span>' +
                                '<span class="meta-item">' + (dept ? dept.name : '-') + '</span>' +
                                '<span class="meta-divider">|</span>' +
                                '<span class="status-tag ' + status.class + '">' + status.text + '</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="employee-detail-content">' +
                    '<div class="detail-info-grid-full">' +
                        '<div class="info-item"><label>工号</label><span>' + (detailedEmployee.employeeNo || '-') + '</span></div>' +
                        '<div class="info-item"><label>性别</label><span>' + (detailedEmployee.gender === 1 ? '男' : detailedEmployee.gender === 2 ? '女' : '-') + '</span></div>' +
                        '<div class="info-item"><label>年龄</label><span>' + (detailedEmployee.age || '-') + '</span></div>' +
                        '<div class="info-item"><label>民族</label><span>' + (detailedEmployee.nation || '-') + '</span></div>' +
                        '<div class="info-item"><label>手机</label><span>' + (detailedEmployee.phone || '-') + '</span></div>' +
                        '<div class="info-item"><label>邮箱</label><span>' + (detailedEmployee.email || '-') + '</span></div>' +
                        '<div class="info-item"><label>入职日期</label><span>' + (detailedEmployee.entryDate || '-') + '</span></div>' +
                        '<div class="info-item"><label>学历</label><span>' + (detailedEmployee.education || '-') + '</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

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
                    var backBtn = document.getElementById('backToDashboard') || document.getElementById('backToDept');
                    if (backBtn && e.target === backBtn) {
                        state.navSelectedType = null;
                        state.navSelectedId = null;
                        window.orgSelectedType = null;
                        window.orgSelectedId = null;
                        refreshContent();
                        return;
                    }

                    var addDeptBtn = document.getElementById('addDeptBtn');
                    if (addDeptBtn && e.target === addDeptBtn) {
                        self.openDeptModal();
                        return;
                    }

                    var editDeptBtn = document.getElementById('editDeptBtn');
                    if (editDeptBtn && e.target === editDeptBtn) {
                        self.openDeptModal(state.selectedDept);
                        return;
                    }

                    var deleteDeptBtn = document.getElementById('deleteDeptBtn');
                    if (deleteDeptBtn && e.target === deleteDeptBtn) {
                        self.handleDeleteDept(state.selectedDept);
                        return;
                    }

                    var deptCard = e.target.closest('.dept-card');
                    if (deptCard) {
                        var deptId = deptCard.dataset.deptId;
                        var dept = state.departments.find(function(d) { return d.id === deptId; });
                        if (dept) {
                            state.selectedDept = dept;
                            state.navSelectedType = null;
                            state.navSelectedId = null;
                            refreshContent();
                        }
                        return;
                    }

                    var posCard = e.target.closest('.position-card, .position-mini-card, .position-detail-card');
                    if (posCard) {
                        var posId = posCard.dataset.posId;
                        state.navSelectedType = 'position';
                        state.navSelectedId = posId;
                        refreshContent();
                        return;
                    }

                    var empCard = e.target.closest('.employee-card, .employee-detail-card');
                    if (empCard) {
                        var empId = empCard.dataset.empId;
                        state.navSelectedType = 'employee';
                        state.navSelectedId = empId;
                        refreshContent();
                        return;
                    }

                    var editBtn = e.target.closest('.edit-btn');
                    if (editBtn) {
                        var id = editBtn.dataset.id;
                        if (editBtn.closest('.dept-card')) {
                            var dept = state.departments.find(function(d) { return d.id === id; });
                            if (dept) self.openDeptModal(dept);
                        } else if (editBtn.closest('.position-card, .position-mini-card, .position-detail-card')) {
                            var pos = state.positions.find(function(p) { return p.id === id; });
                            if (pos) self.openPositionModal(pos);
                        }
                        return;
                    }

                    var deleteBtn = e.target.closest('.delete-btn');
                    if (deleteBtn) {
                        if (deleteBtn.closest('.dept-card')) {
                            var id = deleteBtn.dataset.id;
                            var dept = state.departments.find(function(d) { return d.id === id; });
                            if (dept) self.handleDeleteDept(dept);
                        } else if (deleteBtn.closest('.position-card, .position-mini-card')) {
                            var id = deleteBtn.dataset.id;
                            var pos = state.positions.find(function(p) { return p.id === id; });
                            if (pos) self.handleDeletePosition(pos);
                        }
                        return;
                    }
                });

                var searchInput = document.getElementById('orgSearchInput');
                if (searchInput) {
                    searchInput.addEventListener('input', function(e) {
                        state.searchQuery = e.target.value;
                    });
                }

                var filterTabs = document.querySelectorAll('.filter-tab');
                filterTabs.forEach(function(tab) {
                    tab.addEventListener('click', function() {
                        filterTabs.forEach(function(t) { t.classList.remove('active'); });
                        tab.classList.add('active');
                    });
                });
            }
        },

        openDeptModal: function(dept) {
            var isEdit = !!dept;
            var title = isEdit ? '编辑部门' : '新建部门';
            
            var parentOptions = this.renderParentOptions(dept ? dept.parentId : 0);

            var content = '<div class="dept-form">' +
                '<div class="form-group">' +
                    '<label>部门名称 <span class="required">*</span></label>' +
                    '<input type="text" id="deptName" value="' + (dept ? dept.name : '') + '" placeholder="请输入部门名称" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>部门编码 <span class="required">*</span></label>' +
                    '<input type="text" id="deptCode" value="' + (dept ? dept.code : '') + '" placeholder="请输入部门编码" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>上级部门</label>' +
                    '<select id="deptParent">' + parentOptions + '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>部门负责人</label>' +
                    '<select id="deptLeader">' + this.renderLeaderOptions(dept ? dept.managerId : '') + '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>联系电话</label>' +
                    '<input type="text" id="deptPhone" value="' + (dept ? dept.phone : '') + '" placeholder="请输入联系电话" />' +
                '</div>' +
                '<div class="form-group full">' +
                    '<label>部门描述</label>' +
                    '<textarea id="deptDesc" placeholder="请输入部门描述">' + (dept ? dept.description : '') + '</textarea>' +
                '</div>' +
            '</div>';

            var footer = '<button class="btn btn-secondary" id="modalCancel">取消</button>' +
                '<button class="btn btn-primary" id="modalConfirm">' + title + '</button>';

            var instance = Modal.open({ title, content, footer });

            setTimeout(function() {
                var cancelBtn = document.getElementById('modalCancel');
                var confirmBtn = document.getElementById('modalConfirm');

                cancelBtn?.addEventListener('click', function() {
                    instance.close();
                });

                confirmBtn?.addEventListener('click', function() {
                    var name = document.getElementById('deptName').value;
                    var code = document.getElementById('deptCode').value;
                    var parentId = document.getElementById('deptParent').value;
                    var leaderId = document.getElementById('deptLeader').value;
                    var phone = document.getElementById('deptPhone').value;
                    var desc = document.getElementById('deptDesc').value;

                    if (!name.trim()) {
                        Toast.error('请输入部门名称');
                        return;
                    }
                    if (!code.trim()) {
                        Toast.error('请输入部门编码');
                        return;
                    }

                    var data = {
                        name: name.trim(),
                        code: code.trim(),
                        parent_id: parentId ? parseInt(parentId) : 0,
                        leader_id: leaderId ? parseInt(leaderId) : null,
                        phone: phone.trim(),
                        description: desc.trim()
                    };

                    if (isEdit) {
                        API.updateDepartment(dept.id, data).then(function(res) {
                            if (res.code === 200) {
                                Toast.success('更新成功');
                                instance.close();
                                self.loadInitialData(refreshContent);
                            } else {
                                Toast.error(res.message || '更新失败');
                            }
                        }).catch(function() {
                            Toast.error('更新失败');
                        });
                    } else {
                        API.createDepartment(data).then(function(res) {
                            if (res.code === 200) {
                                Toast.success('创建成功');
                                instance.close();
                                self.loadInitialData(refreshContent);
                            } else {
                                Toast.error(res.message || '创建失败');
                            }
                        }).catch(function() {
                            Toast.error('创建失败');
                        });
                    }
                });
            }, 0);
        },

        renderParentOptions: function(selectedId) {
            var options = '<option value="0">无上级部门</option>';
            
            function buildOptions(depts, level) {
                var html = '';
                for (var i = 0; i < depts.length; i++) {
                    var dept = depts[i];
                    var prefix = level > 0 ? '├─'.repeat(level) + ' ' : '';
                    html += '<option value="' + dept.id + '"' + (dept.id === selectedId ? ' selected' : '') + '>' + prefix + dept.name + '</option>';
                    if (dept.children && dept.children.length > 0) {
                        html += buildOptions(dept.children, level + 1);
                    }
                }
                return html;
            }

            options += buildOptions(state.departments, 0);
            return options;
        },

        renderLeaderOptions: function(selectedId) {
            var options = '<option value="">请选择负责人</option>';
            state.allEmployees.forEach(function(emp) {
                if (emp.status === 1) {
                    options += '<option value="' + emp.id + '"' + (emp.id === selectedId ? ' selected' : '') + '>' + emp.name + '</option>';
                }
            });
            return options;
        },

        openPositionModal: function(pos) {
            var isEdit = !!pos;
            var title = isEdit ? '编辑岗位' : '新建岗位';

            var deptOptions = this.renderDeptOptions(pos ? pos.departmentId : '');

            var content = '<div class="position-form">' +
                '<div class="form-group">' +
                    '<label>岗位名称 <span class="required">*</span></label>' +
                    '<input type="text" id="posName" value="' + (pos ? pos.name : '') + '" placeholder="请输入岗位名称" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>岗位编码 <span class="required">*</span></label>' +
                    '<input type="text" id="posCode" value="' + (pos ? pos.code : '') + '" placeholder="请输入岗位编码" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>所属部门 <span class="required">*</span></label>' +
                    '<select id="posDept">' + deptOptions + '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>岗位级别</label>' +
                    '<select id="posLevel">' +
                        '<option value="1"' + (pos && pos.level === 1 ? ' selected' : '') + '>初级</option>' +
                        '<option value="2"' + (pos && pos.level === 2 ? ' selected' : '') + '>中级</option>' +
                        '<option value="3"' + (pos && pos.level === 3 ? ' selected' : '') + '>高级</option>' +
                        '<option value="4"' + (pos && pos.level === 4 ? ' selected' : '') + '>主管</option>' +
                        '<option value="5"' + (pos && pos.level === 5 ? ' selected' : '') + '>高级主管</option>' +
                    '</select>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>编制人数 <span class="required">*</span></label>' +
                    '<input type="number" id="posHeadcount" value="' + (pos ? pos.headcount : '1') + '" min="1" placeholder="请输入编制人数" />' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>是否关键岗位</label>' +
                    '<select id="posKey">' +
                        '<option value="0"' + (pos && pos.isKeyPosition !== 1 ? ' selected' : '') + '>否</option>' +
                        '<option value="1"' + (pos && pos.isKeyPosition === 1 ? ' selected' : '') + '>是</option>' +
                    '</select>' +
                '</div>' +
                '<div class="form-group full">' +
                    '<label>职责描述</label>' +
                    '<textarea id="posDuties" placeholder="请输入职责描述">' + (pos ? pos.duties : '') + '</textarea>' +
                '</div>' +
                '<div class="form-group full">' +
                    '<label>岗位要求</label>' +
                    '<textarea id="posRequirements" placeholder="请输入岗位要求">' + (pos ? pos.requirements : '') + '</textarea>' +
                '</div>' +
            '</div>';

            var footer = '<button class="btn btn-secondary" id="modalCancel">取消</button>' +
                '<button class="btn btn-primary" id="modalConfirm">' + title + '</button>';

            var instance = Modal.open({ title, content, footer });

            setTimeout(function() {
                var cancelBtn = document.getElementById('modalCancel');
                var confirmBtn = document.getElementById('modalConfirm');

                cancelBtn?.addEventListener('click', function() {
                    instance.close();
                });

                confirmBtn?.addEventListener('click', function() {
                    var name = document.getElementById('posName').value;
                    var code = document.getElementById('posCode').value;
                    var deptId = document.getElementById('posDept').value;
                    var level = document.getElementById('posLevel').value;
                    var headcount = document.getElementById('posHeadcount').value;
                    var isKey = document.getElementById('posKey').value;
                    var duties = document.getElementById('posDuties').value;
                    var requirements = document.getElementById('posRequirements').value;

                    if (!name.trim()) {
                        Toast.error('请输入岗位名称');
                        return;
                    }
                    if (!code.trim()) {
                        Toast.error('请输入岗位编码');
                        return;
                    }
                    if (!deptId) {
                        Toast.error('请选择所属部门');
                        return;
                    }
                    if (!headcount || parseInt(headcount) < 1) {
                        Toast.error('请输入有效的编制人数');
                        return;
                    }

                    var data = {
                        name: name.trim(),
                        code: code.trim(),
                        departmentId: parseInt(deptId),
                        level: parseInt(level),
                        headcount: parseInt(headcount),
                        isKeyPosition: parseInt(isKey),
                        duties: duties.trim(),
                        requirements: requirements.trim()
                    };

                    if (isEdit) {
                        API.updatePosition(pos.id, data).then(function(res) {
                            if (res.code === 200) {
                                Toast.success('更新成功');
                                instance.close();
                                self.loadInitialData(refreshContent);
                            } else {
                                Toast.error(res.message || '更新失败');
                            }
                        }).catch(function() {
                            Toast.error('更新失败');
                        });
                    } else {
                        API.createPosition(data).then(function(res) {
                            if (res.code === 200) {
                                Toast.success('创建成功');
                                instance.close();
                                self.loadInitialData(refreshContent);
                            } else {
                                Toast.error(res.message || '创建失败');
                            }
                        }).catch(function() {
                            Toast.error('创建失败');
                        });
                    }
                });
            }, 0);
        },

        renderDeptOptions: function(selectedId) {
            var options = '<option value="">请选择部门</option>';
            
            function buildOptions(depts, level) {
                var html = '';
                for (var i = 0; i < depts.length; i++) {
                    var dept = depts[i];
                    var prefix = level > 0 ? '├─'.repeat(level) + ' ' : '';
                    html += '<option value="' + dept.id + '"' + (dept.id === selectedId ? ' selected' : '') + '>' + prefix + dept.name + '</option>';
                    if (dept.children && dept.children.length > 0) {
                        html += buildOptions(dept.children, level + 1);
                    }
                }
                return html;
            }

            options += buildOptions(state.departments, 0);
            return options;
        },

        handleDeleteDept: function(dept) {
            Modal.confirm('确定要删除部门 "' + dept.name + '" 吗？删除后将无法恢复。', function() {
                API.deleteDepartment(dept.id).then(function(res) {
                    if (res.code === 200) {
                        Toast.success('删除成功');
                        state.selectedDept = null;
                        self.loadInitialData(refreshContent);
                    } else {
                        Toast.error(res.message || '删除失败');
                    }
                }).catch(function() {
                    Toast.error('删除失败');
                });
            });
        },

        handleDeletePosition: function(pos) {
            Modal.confirm('确定要删除岗位 "' + pos.name + '" 吗？删除后将无法恢复。', function() {
                API.deletePosition(pos.id).then(function(res) {
                    if (res.code === 200) {
                        Toast.success('删除成功');
                        self.loadInitialData(refreshContent);
                    } else {
                        Toast.error(res.message || '删除失败');
                    }
                }).catch(function() {
                    Toast.error('删除失败');
                });
            });
        },

        destroy: function() {}
    };

    return orgModule;
})();

export default orgModule;