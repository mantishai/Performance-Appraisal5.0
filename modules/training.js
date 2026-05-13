import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    currentTab: 'courses',
    currentView: 'employee',
    courses: [],
    registrations: [],
    myRegistrations: [],
    signins: [],
    records: [],
    statistics: null,
    employees: [],
    filterCategory: '',
    currentEmployeeId: 1
};

const trainingModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 8);
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [coursesRes, regsRes, myRegsRes, signinsRes, recordsRes, statsRes, employeesRes] = await Promise.all([
                API.getTrainingCourses(),
                API.getCourseRegistrations(0),
                API.getMyCourses(state.currentEmployeeId),
                API.request('/training/records'),
                API.getTrainingRecords(),
                API.getTrainingStatistics(),
                API.getEmployees()
            ]);
            if (coursesRes.code === 200) state.courses = coursesRes.data;
            if (regsRes.code === 200) state.registrations = regsRes.data;
            if (myRegsRes.code === 200) state.myRegistrations = myRegsRes.data;
            if (signinsRes.code === 200) state.signins = signinsRes.data;
            if (recordsRes.code === 200) state.records = recordsRes.data;
            if (statsRes.code === 200) state.statistics = statsRes.data;
            if (employeesRes.code === 200) state.employees = employeesRes.data;
        } catch (error) {
            console.error('Failed to load training data:', error);
        }
    },

    renderContent(container) {
        const stats = state.statistics || { totalSessions: 0, totalParticipants: 0, totalHours: 0, avgSatisfaction: 0 };
        const myCourseIds = state.myRegistrations.map(r => r.courseId);

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">培训管理</h1>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">📚</div>
                    <div class="stat-info">
                        <div class="stat-label">培训场次</div>
                        <div class="stat-value">${stats.totalSessions}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">👥</div>
                    <div class="stat-info">
                        <div class="stat-label">参与人次</div>
                        <div class="stat-value">${stats.totalParticipants}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">⏱️</div>
                    <div class="stat-info">
                        <div class="stat-label">总学时</div>
                        <div class="stat-value">${stats.totalHours}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">⭐</div>
                    <div class="stat-info">
                        <div class="stat-label">平均满意度</div>
                        <div class="stat-value">${stats.avgSatisfaction.toFixed(1)}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <div style="display: flex; gap: 8px;">
                        <button class="btn ${state.currentTab === 'courses' ? 'btn-primary' : 'btn-default'}" data-tab="courses">📚 课程中心</button>
                        <button class="btn ${state.currentTab === 'manage' ? 'btn-primary' : 'btn-default'}" data-tab="manage">⚙️ 课程管理</button>
                        <button class="btn ${state.currentTab === 'signin' ? 'btn-primary' : 'btn-default'}" data-tab="signin">✍️ 签到管理</button>
                        <button class="btn ${state.currentTab === 'records' ? 'btn-primary' : 'btn-default'}" data-tab="records">📋 培训记录</button>
                        <button class="btn ${state.currentTab === 'statistics' ? 'btn-primary' : 'btn-default'}" data-tab="statistics">📊 培训统计</button>
                    </div>
                </div>

                ${state.currentTab === 'courses' ? this.renderCoursesTab(myCourseIds) : ''}
                ${state.currentTab === 'manage' ? this.renderManageTab() : ''}
                ${state.currentTab === 'signin' ? this.renderSigninTab() : ''}
                ${state.currentTab === 'records' ? this.renderRecordsTab() : ''}
                ${state.currentTab === 'statistics' ? this.renderStatisticsTab() : ''}
            </div>
        `;

        this.bindEvents(container);
    },

    renderCoursesTab(myCourseIds) {
        const categories = ['技术', '管理', '通用'];
        const filteredCourses = state.filterCategory
            ? state.courses.filter(c => c.category === state.filterCategory)
            : state.courses;

        return `
            <div style="margin-bottom: 16px;">
                <select id="categoryFilter" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px; margin-right: 12px;">
                    <option value="">全部分类</option>
                    ${categories.map(c => `<option value="${c}" ${state.filterCategory === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
                <span style="color: #8ba9c4; font-size: 13px;">我的报名：${myCourseIds.length}门课程</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                ${filteredCourses.map(c => `
                    <div style="border: 1px solid rgba(24, 144, 255, 0.1); border-radius: 16px; overflow: hidden; background: #fff; transition: all 0.3s;">
                        <div style="height: 120px; background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%); display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 48px;">${c.category === '技术' ? '💻' : c.category === '管理' ? '📊' : '🎯'}</span>
                        </div>
                        <div style="padding: 16px;">
                            <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px;">${c.name}</div>
                            <div style="font-size: 13px; color: #8ba9c4; margin-bottom: 8px;">📅 ${c.startDate} 至 ${c.endDate}</div>
                            <div style="font-size: 13px; color: #8ba9c4; margin-bottom: 8px;">👨‍🏫 ${c.lecturer} | ⏱️ ${c.hours}课时</div>
                            <div style="font-size: 13px; color: #8ba9c4; margin-bottom: 12px;">👥 ${c.enrolledCount}/${c.capacity}人</div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn ${myCourseIds.includes(c.id) ? 'btn-default' : 'btn-primary'}" style="flex: 1;" data-id="${c.id}" data-action="${myCourseIds.includes(c.id) ? 'cancel' : 'register'}">${myCourseIds.includes(c.id) ? '已报名' : '立即报名'}</button>
                                <button class="btn btn-default" data-id="${c.id}" data-action="detail">详情</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderManageTab() {
        const statusMap = { open: '报名中', closed: '已结束' };

        return `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-primary" id="addCourseBtn">+ 新增课程</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>课程名称</th>
                            <th>分类</th>
                            <th>讲师</th>
                            <th>课时</th>
                            <th>容量</th>
                            <th>已报名</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.courses.map(c => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td><span class="status-tag ${c.category === '技术' ? 'info' : c.category === '管理' ? 'warning' : 'active'}">${c.category}</span></td>
                                <td>${c.lecturer}</td>
                                <td>${c.hours}</td>
                                <td>${c.capacity}</td>
                                <td>${c.enrolledCount}</td>
                                <td><span class="status-tag ${c.status === 'open' ? 'active' : 'inactive'}">${statusMap[c.status]}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" data-id="${c.id}" data-action="edit">编辑</button>
                                        <button class="action-btn" data-id="${c.id}" data-action="${c.status === 'open' ? 'close' : 'open'}">${c.status === 'open' ? '关闭' : '开启'}</button>
                                        <button class="action-btn" data-id="${c.id}" data-action="viewRegistrations">报名列表</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSigninTab() {
        return `
            <div style="margin-bottom: 16px;">
                <select id="signinCourseSelect" style="padding: 8px 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 8px;">
                    <option value="">选择课程</option>
                    ${state.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                    <div style="font-weight: 600; margin-bottom: 12px;">✍️ 签到</div>
                    <div style="padding: 20px; background: rgba(24, 144, 255, 0.03); border-radius: 12px;">
                        <div class="form-field">
                            <label>工号</label>
                            <input type="text" id="signinEmployeeNo" placeholder="请输入员工工号">
                        </div>
                        <button class="btn btn-primary" id="manualSigninBtn" style="margin-top: 12px;">确认签到</button>
                    </div>
                </div>
                <div>
                    <div style="font-weight: 600; margin-bottom: 12px;">📋 签到记录</div>
                    <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>员工</th>
                                    <th>时间</th>
                                    <th>方式</th>
                                </tr>
                            </thead>
                            <tbody id="signinTableBody">
                                ${state.signins.map(s => `
                                    <tr>
                                        <td>${s.employeeName}</td>
                                        <td>${s.signinTime}</td>
                                        <td>${s.signinType === 'manual' ? '手动' : '扫码'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderRecordsTab() {
        return `
            <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 600;">培训记录列表</div>
                <button class="btn btn-primary" id="addRecordBtn">+ 录入考核结果</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>员工</th>
                            <th>课程</th>
                            <th>培训日期</th>
                            <th>实际学时</th>
                            <th>考核结果</th>
                            <th>证书编号</th>
                            <th>满意度</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.records.map(r => `
                            <tr>
                                <td><strong>${r.employeeName}</strong></td>
                                <td>${r.courseName}</td>
                                <td>${r.trainingDate}</td>
                                <td>${r.actualHours}课时</td>
                                <td><span class="status-tag ${r.assessmentResult === '优秀' ? 'active' : 'info'}">${r.assessmentResult}</span></td>
                                <td>${r.certificateNo}</td>
                                <td>⭐${r.satisfaction || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderStatisticsTab() {
        const stats = state.statistics || { totalSessions: 0, totalParticipants: 0, totalHours: 0, avgSatisfaction: 0 };

        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div style="padding: 20px; background: rgba(24, 144, 255, 0.05); border-radius: 16px;">
                    <div style="font-weight: 600; margin-bottom: 16px;">📊 月度培训趋势</div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${['1月', '2月', '3月', '4月', '5月'].map((month, i) => `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; font-size: 13px;">${month}</div>
                                <div style="flex: 1; height: 20px; background: rgba(24, 144, 255, 0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${[60, 75, 45, 80, 90][i]}%; height: 100%; background: linear-gradient(90deg, #1890ff, #52c41a); border-radius: 4px;"></div>
                                </div>
                                <div style="width: 40px; font-size: 13px; text-align: right;">${[3, 4, 2, 5, 6][i]}场</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div style="padding: 20px; background: rgba(114, 46, 209, 0.05); border-radius: 16px;">
                    <div style="font-weight: 600; margin-bottom: 16px;">🏢 部门参与度</div>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${['技术部', '产品部', '市场部', '人事部'].map((dept, i) => `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 60px; font-size: 13px;">${dept}</div>
                                <div style="flex: 1; height: 20px; background: rgba(114, 46, 209, 0.1); border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${[70, 55, 40, 35][i]}%; height: 100%; background: linear-gradient(90deg, #722ed1, #1890ff); border-radius: 4px;"></div>
                                </div>
                                <div style="width: 40px; font-size: 13px; text-align: right;">${[35, 28, 20, 15][i]}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents(container) {
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                state.currentTab = btn.dataset.tab;
                this.renderContent(container);
            });
        });

        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            state.filterCategory = e.target.value;
            this.renderContent(container);
        });

        document.getElementById('addCourseBtn')?.addEventListener('click', () => this.openCourseModal());
        document.getElementById('addRecordBtn')?.addEventListener('click', () => this.openRecordModal());
        document.getElementById('manualSigninBtn')?.addEventListener('click', () => this.handleManualSignin());

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                this.handleAction(id, action, container);
            }
        });
    },

    handleAction(id, action, container) {
        switch (action) {
            case 'register':
                this.registerCourse(id, container);
                break;
            case 'cancel':
                this.cancelRegistration(id, container);
                break;
            case 'detail':
                const course = state.courses.find(c => c.id === id);
                if (course) this.openCourseDetailModal(course);
                break;
            case 'edit':
                const c = state.courses.find(c => c.id === id);
                if (c) this.openCourseModal(c);
                break;
            case 'close':
            case 'open':
                this.toggleCourseStatus(id, action, container);
                break;
            case 'viewRegistrations':
                this.viewCourseRegistrations(id);
                break;
        }
    },

    async registerCourse(courseId, container) {
        try {
            await API.registerTraining(courseId, state.currentEmployeeId);
            Toast.success('报名成功');
            await this.loadData();
            this.renderContent(container);
        } catch (error) {
            Toast.error('报名失败');
        }
    },

    async cancelRegistration(courseId, container) {
        const reg = state.myRegistrations.find(r => r.courseId === courseId);
        if (!reg) return;

        try {
            await API.cancelRegistration(reg.id);
            Toast.success('已取消报名');
            await this.loadData();
            this.renderContent(container);
        } catch (error) {
            Toast.error('取消失败');
        }
    },

    openCourseDetailModal(course) {
        Modal.open({
            title: course.name,
            content: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">课程分类</label>
                        <div style="font-weight: 600;">${course.category}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">课时</label>
                        <div style="font-weight: 600;">${course.hours}课时</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">讲师</label>
                        <div style="font-weight: 600;">${course.lecturer}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">培训日期</label>
                        <div style="font-weight: 600;">${course.startDate} 至 ${course.endDate}</div>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <label style="color: #8ba9c4; font-size: 12px; display: block; margin-bottom: 8px;">讲师介绍</label>
                    <div style="padding: 12px; background: rgba(24, 144, 255, 0.03); border-radius: 8px;">${course.lecturerIntro}</div>
                </div>
                <div style="margin-top: 16px;">
                    <label style="color: #8ba9c4; font-size: 12px; display: block; margin-bottom: 8px;">课程大纲</label>
                    <div style="padding: 12px; background: rgba(24, 144, 255, 0.03); border-radius: 8px; white-space: pre-wrap;">${course.outline || '暂无大纲'}</div>
                </div>
                <div style="margin-top: 16px;">
                    <label style="color: #8ba9c4; font-size: 12px; display: block; margin-bottom: 8px;">适合对象</label>
                    <div style="padding: 12px; background: rgba(24, 144, 255, 0.03); border-radius: 8px;">${course.target || '全体员工'}</div>
                </div>
            `
        });
    },

    openCourseModal(course = null) {
        const isEdit = !!course;

        Modal.open({
            title: isEdit ? '编辑课程' : '新增课程',
            content: `
                <form id="courseForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>课程名称 <span class="required">*</span></label>
                            <input type="text" id="courseName" value="${course?.name || ''}" placeholder="如：Vue3实战开发">
                        </div>
                        <div class="form-field">
                            <label>课程分类</label>
                            <select id="courseCategory">
                                <option value="技术" ${course?.category === '技术' ? 'selected' : ''}>技术</option>
                                <option value="管理" ${course?.category === '管理' ? 'selected' : ''}>管理</option>
                                <option value="通用" ${course?.category === '通用' ? 'selected' : ''}>通用</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>讲师 <span class="required">*</span></label>
                            <input type="text" id="courseLecturer" value="${course?.lecturer || ''}" placeholder="讲师姓名">
                        </div>
                        <div class="form-field">
                            <label>课时</label>
                            <input type="number" id="courseHours" value="${course?.hours || 6}" min="1">
                        </div>
                        <div class="form-field">
                            <label>容量</label>
                            <input type="number" id="courseCapacity" value="${course?.capacity || 50}" min="1">
                        </div>
                        <div class="form-field">
                            <label>培训日期</label>
                            <input type="date" id="courseStartDate" value="${course?.startDate || ''}">
                        </div>
                        <div class="form-field full">
                            <label>讲师介绍</label>
                            <textarea id="courseLecturerIntro" rows="2" placeholder="讲师背景介绍">${course?.lecturerIntro || ''}</textarea>
                        </div>
                        <div class="form-field full">
                            <label>课程大纲</label>
                            <textarea id="courseOutline" rows="3" placeholder="请输入课程大纲，每行一项">${course?.outline || ''}</textarea>
                        </div>
                        <div class="form-field full">
                            <label>适合对象</label>
                            <input type="text" id="courseTarget" value="${course?.target || ''}" placeholder="如：前端工程师">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveCourseBtn">保存</button>
            `
        });

        document.getElementById('saveCourseBtn')?.addEventListener('click', async () => {
            const data = {
                name: document.getElementById('courseName').value,
                category: document.getElementById('courseCategory').value,
                lecturer: document.getElementById('courseLecturer').value,
                hours: parseInt(document.getElementById('courseHours').value) || 6,
                capacity: parseInt(document.getElementById('courseCapacity').value) || 50,
                startDate: document.getElementById('courseStartDate').value,
                endDate: document.getElementById('courseStartDate').value,
                lecturerIntro: document.getElementById('courseLecturerIntro').value,
                outline: document.getElementById('courseOutline').value,
                target: document.getElementById('courseTarget').value
            };

            if (!data.name || !data.lecturer) {
                Toast.error('请填写必填项');
                return;
            }

            if (isEdit) {
                await API.updateTrainingCourse(course.id, data);
                Toast.success('课程已更新');
            } else {
                await API.createTrainingCourse(data);
                Toast.success('课程已创建');
            }

            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    async toggleCourseStatus(id, action, container) {
        const status = action === 'close' ? 'closed' : 'open';
        await API.updateTrainingCourse(id, { status });
        Toast.success(status === 'open' ? '课程已开启' : '课程已关闭');
        await this.loadData();
        this.renderContent(container);
    },

    async viewCourseRegistrations(courseId) {
        const regsRes = await API.getCourseRegistrations(courseId);
        const regs = regsRes.code === 200 ? regsRes.data : [];
        const course = state.courses.find(c => c.id === courseId);

        Modal.open({
            title: `${course?.name || ''} - 报名列表`,
            content: `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>员工</th>
                                <th>报名时间</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${regs.map(r => `
                                <tr>
                                    <td>${r.employeeName}</td>
                                    <td>${r.registerTime}</td>
                                    <td><span class="status-tag active">${r.status === 'registered' ? '已报名' : '已取消'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `
        });
    },

    async handleManualSignin() {
        const employeeNo = document.getElementById('signinEmployeeNo').value;
        const courseId = parseInt(document.getElementById('signinCourseSelect')?.value);

        if (!employeeNo || !courseId) {
            Toast.error('请选择课程并输入工号');
            return;
        }

        const employee = state.employees.find(e => e.employeeNo === employeeNo);
        if (!employee) {
            Toast.error('未找到该工号对应的员工');
            return;
        }

        try {
            await API.signInTraining(courseId, employee.id, 'manual');
            Toast.success('签到成功');
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        } catch (error) {
            Toast.error('签到失败');
        }
    },

    openRecordModal() {
        Modal.open({
            title: '录入考核结果',
            content: `
                <form id="recordForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>员工 <span class="required">*</span></label>
                            <select id="recordEmployee">
                                <option value="">请选择</option>
                                ${state.employees.map(e => `<option value="${e.id}">${e.name} (${e.employeeNo})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field full">
                            <label>课程 <span class="required">*</span></label>
                            <select id="recordCourse">
                                <option value="">请选择</option>
                                ${state.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>培训日期</label>
                            <input type="date" id="recordDate" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-field">
                            <label>实际学时</label>
                            <input type="number" id="recordHours" value="6" min="1">
                        </div>
                        <div class="form-field">
                            <label>考核结果</label>
                            <select id="recordResult">
                                <option value="优秀">优秀</option>
                                <option value="良好">良好</option>
                                <option value="合格">合格</option>
                                <option value="不合格">不合格</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>满意度评分</label>
                            <input type="number" id="recordSatisfaction" value="4.5" step="0.1" min="1" max="5">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveRecordBtn">保存</button>
            `
        });

        document.getElementById('saveRecordBtn')?.addEventListener('click', async () => {
            const employeeId = parseInt(document.getElementById('recordEmployee').value);
            const courseId = parseInt(document.getElementById('recordCourse').value);
            const course = state.courses.find(c => c.id === courseId);
            const employee = state.employees.find(e => e.id === employeeId);

            if (!employeeId || !courseId) {
                Toast.error('请选择员工和课程');
                return;
            }

            const data = {
                employeeId,
                employeeName: employee?.name || '',
                courseId,
                courseName: course?.name || '',
                trainingDate: document.getElementById('recordDate').value,
                actualHours: parseInt(document.getElementById('recordHours').value) || 6,
                assessmentResult: document.getElementById('recordResult').value,
                satisfaction: parseFloat(document.getElementById('recordSatisfaction').value) || 4.5
            };

            await API.createTrainingRecord(data);
            Toast.success('记录已创建');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    destroy() {}
};

export default trainingModule;
