import { Toast, Modal, Skeleton } from '../utils.js';
import API from '../api.js';

const state = {
    currentTab: 'jobs',
    jobs: [],
    candidates: [],
    interviews: [],
    offers: [],
    filterPosition: '',
    filterStatus: '',
    searchKeyword: '',
    employees: []
};

const recruitmentModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 8);
        await this.loadData();
        this.renderContent(container);
    },

    async loadData() {
        try {
            const [jobsRes, candidatesRes, interviewsRes, offersRes, employeesRes] = await Promise.all([
                API.getJobs(),
                API.getCandidates(),
                API.getInterviews(),
                API.getOffers(),
                API.getEmployees()
            ]);
            if (jobsRes.code === 200) state.jobs = jobsRes.data;
            if (candidatesRes.code === 200) state.candidates = candidatesRes.data;
            if (interviewsRes.code === 200) state.interviews = interviewsRes.data;
            if (offersRes.code === 200) state.offers = offersRes.data;
            if (employeesRes.code === 200) state.employees = employeesRes.data;
        } catch (error) {
            console.error('Failed to load recruitment data:', error);
        }
    },

    renderContent(container) {
        const pendingInterviews = state.interviews.filter(i => i.status === 'scheduled' || i.status === 'pending').length;
        const openJobs = state.jobs.filter(j => j.status === 'open').length;

        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">招聘管理</h1>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue">📋</div>
                    <div class="stat-info">
                        <div class="stat-label">在招职位</div>
                        <div class="stat-value">${openJobs}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">👥</div>
                    <div class="stat-info">
                        <div class="stat-label">候选人</div>
                        <div class="stat-value">${state.candidates.length}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">📅</div>
                    <div class="stat-info">
                        <div class="stat-label">待面试</div>
                        <div class="stat-value">${pendingInterviews}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">📄</div>
                    <div class="stat-info">
                        <div class="stat-label">待发放Offer</div>
                        <div class="stat-value">${state.offers.filter(o => o.status === 'draft').length}</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid rgba(24, 144, 255, 0.1); padding-bottom: 16px;">
                    <button class="btn ${state.currentTab === 'jobs' ? 'btn-primary' : 'btn-default'}" data-tab="jobs">📋 职位管理</button>
                    <button class="btn ${state.currentTab === 'candidates' ? 'btn-primary' : 'btn-default'}" data-tab="candidates">👥 候选人库</button>
                    <button class="btn ${state.currentTab === 'interviews' ? 'btn-primary' : 'btn-default'}" data-tab="interviews">📅 面试安排</button>
                    <button class="btn ${state.currentTab === 'offers' ? 'btn-primary' : 'btn-default'}" data-tab="offers">📄 Offer管理</button>
                </div>

                ${state.currentTab === 'jobs' ? this.renderJobsTab() : ''}
                ${state.currentTab === 'candidates' ? this.renderCandidatesTab() : ''}
                ${state.currentTab === 'interviews' ? this.renderInterviewsTab() : ''}
                ${state.currentTab === 'offers' ? this.renderOffersTab() : ''}
            </div>
        `;

        this.bindEvents(container);
    },

    renderJobsTab() {
        return `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-primary" id="addJobBtn">+ 发布职位</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>职位名称</th>
                            <th>部门</th>
                            <th>工作地点</th>
                            <th>薪资范围</th>
                            <th>招聘人数</th>
                            <th>状态</th>
                            <th>发布时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.jobs.map(j => `
                            <tr>
                                <td><strong>${j.title}</strong></td>
                                <td>${j.department}</td>
                                <td>${j.location}</td>
                                <td>${j.salaryRange}</td>
                                <td>${j.headcount}</td>
                                <td><span class="status-tag ${j.status === 'open' ? 'active' : 'inactive'}">${j.status === 'open' ? '招聘中' : '已下架'}</span></td>
                                <td>${j.publishDate}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" data-id="${j.id}" data-action="edit">编辑</button>
                                        <button class="action-btn" data-id="${j.id}" data-action="${j.status === 'open' ? 'close' : 'open'}">${j.status === 'open' ? '下架' : '上架'}</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderCandidatesTab() {
        const statusOptions = ['', 'screening', 'interviewing', 'offer', 'rejected'];
        const statusMap = { screening: '待筛选', interviewing: '面试中', offer: '录用', rejected: '淘汰' };
        const filteredCandidates = state.candidates.filter(c => {
            if (state.filterStatus && c.status !== state.filterStatus) return false;
            if (state.searchKeyword) {
                const kw = state.searchKeyword.toLowerCase();
                if (!c.name.toLowerCase().includes(kw) && !c.phone.includes(kw)) return false;
            }
            return true;
        });

        return `
            <div class="toolbar">
                <div class="search-box">
                    <span>🔍</span>
                    <input type="text" placeholder="搜索姓名、手机号..." id="candidateSearch" value="${state.searchKeyword}">
                </div>
                <select class="filter-select" id="statusFilter">
                    <option value="">全部状态</option>
                    ${statusOptions.filter(s => s).map(s => `<option value="${s}" ${state.filterStatus === s ? 'selected' : ''}>${statusMap[s]}</option>`).join('')}
                </select>
            </div>
            <div style="margin-bottom: 16px; display: flex; gap: 12px;">
                <button class="btn btn-primary" id="addCandidateBtn">+ 添加候选人</button>
                <button class="btn btn-default" id="uploadResumeBtn">📎 上传简历</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>姓名</th>
                            <th>应聘职位</th>
                            <th>学历</th>
                            <th>工作年限</th>
                            <th>来源渠道</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredCandidates.map(c => `
                            <tr>
                                <td><strong>${c.name}</strong></td>
                                <td>${c.position}</td>
                                <td>${c.education}</td>
                                <td>${c.workYears}年</td>
                                <td>${c.source}</td>
                                <td><span class="status-tag ${c.status === 'offer' ? 'active' : c.status === 'rejected' ? 'inactive' : 'pending'}">${statusMap[c.status] || c.status}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" data-id="${c.id}" data-action="view">详情</button>
                                        <button class="action-btn" data-id="${c.id}" data-action="schedule">安排面试</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderInterviewsTab() {
        const myInterviews = state.interviews.filter(i => i.interviewerId === 1);
        const allInterviews = state.interviews;

        return `
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 8px;">我的面试</div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>候选人</th>
                                    <th>职位</th>
                                    <th>时间</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${myInterviews.length > 0 ? myInterviews.map(i => `
                                    <tr>
                                        <td>${i.candidateName}</td>
                                        <td>${i.position}</td>
                                        <td>${i.interviewTime}</td>
                                        <td><span class="status-tag ${i.status === 'completed' ? 'active' : 'pending'}">${i.status === 'completed' ? '已完成' : '待评价'}</span></td>
                                        <td>
                                            ${i.status !== 'completed' ? `<button class="action-btn" data-id="${i.id}" data-action="evaluate">评价</button>` : '<span style="color: #8ba9c4;">已评价</span>'}
                                        </td>
                                    </tr>
                                `).join('') : '<tr><td colspan="5" style="text-align: center;">暂无面试安排</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style="width: 1px; background: rgba(24, 144, 255, 0.1);"></div>
                <div style="flex: 2;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <div style="font-weight: 600;">全部面试</div>
                        <button class="btn btn-primary btn-sm" id="addInterviewBtn">+ 安排面试</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>候选人</th>
                                    <th>职位</th>
                                    <th>轮次</th>
                                    <th>面试官</th>
                                    <th>时间</th>
                                    <th>地点</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allInterviews.map(i => `
                                    <tr>
                                        <td>${i.candidateName}</td>
                                        <td>${i.position}</td>
                                        <td>第${i.round}轮</td>
                                        <td>${i.interviewerName}</td>
                                        <td>${i.interviewTime}</td>
                                        <td>${i.location}</td>
                                        <td><span class="status-tag ${i.status === 'completed' ? 'active' : 'pending'}">${i.status === 'completed' ? '已完成' : i.status === 'scheduled' ? '已安排' : '待面试'}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderOffersTab() {
        const statusMap = { draft: '待发送', sent: '已发送', accepted: '已接受', rejected: '已拒绝' };
        const statusClass = { draft: 'pending', sent: 'info', accepted: 'active', rejected: 'inactive' };

        return `
            <div style="margin-bottom: 16px;">
                <button class="btn btn-primary" id="createOfferBtn">+ 创建Offer</button>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>候选人</th>
                            <th>职位</th>
                            <th>基本工资</th>
                            <th>补贴</th>
                            <th>试用期</th>
                            <th>预计入职</th>
                            <th>状态</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.offers.map(o => `
                            <tr>
                                <td><strong>${o.candidateName}</strong></td>
                                <td>${o.position}</td>
                                <td>¥${o.baseSalary.toLocaleString()}</td>
                                <td>¥${o.allowances.toLocaleString()}</td>
                                <td>${o.probationMonths}个月</td>
                                <td>${o.startDate}</td>
                                <td><span class="status-tag ${statusClass[o.status]}">${statusMap[o.status]}</span></td>
                                <td>
                                    <div class="action-btns">
                                        ${o.status === 'draft' ? `<button class="action-btn" data-id="${o.id}" data-action="send">发送</button>` : ''}
                                        ${o.status === 'sent' ? `
                                            <button class="action-btn" data-id="${o.id}" data-action="accept">接受</button>
                                            <button class="action-btn" data-id="${o.id}" data-action="reject">拒绝</button>
                                        ` : ''}
                                        ${o.status === 'accepted' ? '<span style="color: #52c41a;">✓ 已入职</span>' : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
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

        document.getElementById('addJobBtn')?.addEventListener('click', () => this.openJobModal());
        document.getElementById('addCandidateBtn')?.addEventListener('click', () => this.openCandidateModal());
        document.getElementById('uploadResumeBtn')?.addEventListener('click', () => this.openResumeUploadModal());
        document.getElementById('addInterviewBtn')?.addEventListener('click', () => this.openInterviewModal());
        document.getElementById('createOfferBtn')?.addEventListener('click', () => this.openOfferModal());

        document.getElementById('candidateSearch')?.addEventListener('input', (e) => {
            state.searchKeyword = e.target.value;
            this.renderContent(container);
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            state.filterStatus = e.target.value;
            this.renderContent(container);
        });

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                this.handleAction(id, action, container);
            }
        });
    },

    handleAction(id, action, container) {
        switch (action) {
            case 'edit':
                const job = state.jobs.find(j => j.id === id);
                if (job) this.openJobModal(job);
                break;
            case 'close':
            case 'open':
                this.toggleJobStatus(id, container);
                break;
            case 'view':
                const candidate = state.candidates.find(c => c.id === id);
                if (candidate) this.openCandidateDetailModal(candidate);
                break;
            case 'schedule':
                const c = state.candidates.find(c => c.id === id);
                if (c) this.openInterviewModal(c);
                break;
            case 'evaluate':
                const interview = state.interviews.find(i => i.id === id);
                if (interview) this.openEvaluationModal(interview, container);
                break;
            case 'send':
                this.sendOffer(id, container);
                break;
            case 'accept':
                this.acceptOffer(id, container);
                break;
            case 'reject':
                this.rejectOffer(id, container);
                break;
        }
    },

    async toggleJobStatus(id, container) {
        const job = state.jobs.find(j => j.id === id);
        if (!job) return;

        if (job.status === 'open') {
            await API.closeJob(id);
            Toast.success('职位已下架');
        } else {
            await API.updateJob(id, { status: 'open' });
            Toast.success('职位已上架');
        }
        await this.loadData();
        this.renderContent(container);
    },

    openJobModal(job = null) {
        const isEdit = !!job;

        Modal.open({
            title: isEdit ? '编辑职位' : '发布职位',
            content: `
                <form id="jobForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>职位名称 <span class="required">*</span></label>
                            <input type="text" id="jobTitle" value="${job?.title || ''}" placeholder="如：前端工程师">
                        </div>
                        <div class="form-field">
                            <label>所属部门 <span class="required">*</span></label>
                            <select id="jobDept">
                                <option value="">请选择</option>
                                ${state.jobs.length > 0 ? '' : '<option value="技术部">技术部</option><option value="产品部">产品部</option><option value="市场部">市场部</option><option value="人事部">人事部</option>'}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>工作地点 <span class="required">*</span></label>
                            <input type="text" id="jobLocation" value="${job?.location || '北京'}" placeholder="如：北京">
                        </div>
                        <div class="form-field">
                            <label>薪资范围 <span class="required">*</span></label>
                            <input type="text" id="jobSalary" value="${job?.salaryRange || ''}" placeholder="如：15k-25k">
                        </div>
                        <div class="form-field">
                            <label>招聘人数 <span class="required">*</span></label>
                            <input type="number" id="jobHeadcount" value="${job?.headcount || 1}" min="1">
                        </div>
                        <div class="form-field full">
                            <label>职位描述</label>
                            <textarea id="jobDesc" rows="3" placeholder="请输入职位描述">${job?.description || ''}</textarea>
                        </div>
                        <div class="form-field full">
                            <label>任职要求</label>
                            <textarea id="jobReq" rows="3" placeholder="请输入任职要求">${job?.requirements || ''}</textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveJobBtn">保存</button>
            `
        });

        document.getElementById('saveJobBtn')?.addEventListener('click', async () => {
            const data = {
                title: document.getElementById('jobTitle').value,
                department: document.getElementById('jobDept').value,
                location: document.getElementById('jobLocation').value,
                salaryRange: document.getElementById('jobSalary').value,
                headcount: parseInt(document.getElementById('jobHeadcount').value) || 1,
                description: document.getElementById('jobDesc').value,
                requirements: document.getElementById('jobReq').value
            };

            if (!data.title || !data.department) {
                Toast.error('请填写必填项');
                return;
            }

            if (isEdit) {
                await API.updateJob(job.id, data);
                Toast.success('职位已更新');
            } else {
                await API.createJob(data);
                Toast.success('职位发布成功');
            }

            await API.triggerAlertCheck();
            Toast.info('已检查完成');

            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    openCandidateModal(candidate = null) {
        Modal.open({
            title: '添加候选人',
            content: `
                <form id="candidateForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>姓名 <span class="required">*</span></label>
                            <input type="text" id="candName" value="${candidate?.name || ''}" placeholder="请输入姓名">
                        </div>
                        <div class="form-field">
                            <label>手机号 <span class="required">*</span></label>
                            <input type="text" id="candPhone" value="${candidate?.phone || ''}" placeholder="请输入手机号">
                        </div>
                        <div class="form-field">
                            <label>邮箱</label>
                            <input type="email" id="candEmail" value="${candidate?.email || ''}" placeholder="请输入邮箱">
                        </div>
                        <div class="form-field">
                            <label>应聘职位 <span class="required">*</span></label>
                            <select id="candPosition">
                                <option value="">请选择</option>
                                ${state.jobs.map(j => `<option value="${j.title}" ${candidate?.position === j.title ? 'selected' : ''}>${j.title}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>学历</label>
                            <select id="candEducation">
                                <option value="本科" ${candidate?.education === '本科' ? 'selected' : ''}>本科</option>
                                <option value="硕士" ${candidate?.education === '硕士' ? 'selected' : ''}>硕士</option>
                                <option value="博士" ${candidate?.education === '博士' ? 'selected' : ''}>博士</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>工作年限</label>
                            <input type="number" id="candWorkYears" value="${candidate?.workYears || 0}" min="0">
                        </div>
                        <div class="form-field">
                            <label>来源渠道</label>
                            <select id="candSource">
                                <option value="BOSS直聘" ${candidate?.source === 'BOSS直聘' ? 'selected' : ''}>BOSS直聘</option>
                                <option value="猎聘" ${candidate?.source === '猎聘' ? 'selected' : ''}>猎聘</option>
                                <option value="拉勾网" ${candidate?.source === '拉勾网' ? 'selected' : ''}>拉勾网</option>
                                <option value="智联招聘" ${candidate?.source === '智联招聘' ? 'selected' : ''}>智联招聘</option>
                                <option value="内推" ${candidate?.source === '内推' ? 'selected' : ''}>内推</option>
                            </select>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveCandidateBtn">保存</button>
            `
        });

        document.getElementById('saveCandidateBtn')?.addEventListener('click', async () => {
            const data = {
                name: document.getElementById('candName').value,
                phone: document.getElementById('candPhone').value,
                email: document.getElementById('candEmail').value,
                position: document.getElementById('candPosition').value,
                education: document.getElementById('candEducation').value,
                workYears: parseInt(document.getElementById('candWorkYears').value) || 0,
                source: document.getElementById('candSource').value
            };

            if (!data.name || !data.phone || !data.position) {
                Toast.error('请填写必填项');
                return;
            }

            await API.createCandidate(data);
            Toast.success('候选人添加成功');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    openResumeUploadModal() {
        Modal.open({
            title: '上传简历',
            content: `
                <form id="resumeForm">
                    <div class="form-field full">
                        <label>粘贴简历内容 <span class="required">*</span></label>
                        <textarea id="resumeText" rows="10" style="width: 100%; padding: 12px; border: 1px solid rgba(24, 144, 255, 0.2); border-radius: 12px; font-size: 14px; resize: vertical;" placeholder="请粘贴简历内容，系统将自动解析姓名、电话、邮箱、工作年限、学历等信息..."></textarea>
                    </div>
                    <div style="margin-top: 12px; font-size: 12px; color: #8ba9c4;">
                        支持格式：姓名、电话、邮箱、工作年限、学历 等信息换行分隔
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="parseResumeBtn">解析并添加</button>
            `
        });

        document.getElementById('parseResumeBtn')?.addEventListener('click', async () => {
            const resumeText = document.getElementById('resumeText').value;
            if (!resumeText.trim()) {
                Toast.error('请输入简历内容');
                return;
            }

            try {
                const res = await API.parseResume({ resumeText });
                if (res.code === 200) {
                    const parsed = res.data;
                    Toast.success('简历解析成功');
                    document.querySelector('.modal-overlay.show')?.remove();
                    this.openCandidateModal({
                        name: parsed.name,
                        phone: parsed.phone,
                        email: parsed.email,
                        education: parsed.education,
                        workYears: parsed.workYears
                    });
                }
            } catch (error) {
                Toast.error('简历解析失败');
            }
        });
    },

    openCandidateDetailModal(candidate) {
        const statusOptions = ['screening', 'interviewing', 'offer', 'rejected'];
        const statusMap = { screening: '待筛选', interviewing: '面试中', offer: '录用', rejected: '淘汰' };

        Modal.open({
            title: '候选人详情',
            content: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">姓名</label>
                        <div style="font-weight: 600; margin-top: 4px;">${candidate.name}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">手机号</label>
                        <div style="font-weight: 600; margin-top: 4px;">${candidate.phone}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">邮箱</label>
                        <div style="font-weight: 600; margin-top: 4px;">${candidate.email || '-'}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">应聘职位</label>
                        <div style="font-weight: 600; margin-top: 4px;">${candidate.position}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">学历</label>
                        <div style="font-weight: 600; margin-top: 4px;">${candidate.education}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">工作年限</label>
                        <div style="font-weight: 600; margin-top: 4px;">${candidate.workYears}年</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">来源渠道</label>
                        <div style="font-weight: 600; margin-top: 4px;">${candidate.source}</div>
                    </div>
                    <div class="form-field">
                        <label style="color: #8ba9c4; font-size: 12px;">当前状态</label>
                        <div style="margin-top: 4px;">
                            <select id="detailStatus">
                                ${statusOptions.map(s => `<option value="${s}" ${candidate.status === s ? 'selected' : ''}>${statusMap[s]}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 16px;">
                    <label style="color: #8ba9c4; font-size: 12px;">简历内容</label>
                    <div style="margin-top: 8px; padding: 12px; background: rgba(24, 144, 255, 0.03); border-radius: 8px; white-space: pre-wrap; font-size: 13px;">${candidate.resumeText || '暂无简历内容'}</div>
                </div>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">关闭</button>
                <button class="btn btn-primary" id="updateStatusBtn">更新状态</button>
            `
        });

        document.getElementById('updateStatusBtn')?.addEventListener('click', async () => {
            const newStatus = document.getElementById('detailStatus').value;
            await API.updateCandidateStatus(candidate.id, newStatus);
            Toast.success('状态已更新');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    openInterviewModal(candidate = null) {
        Modal.open({
            title: '安排面试',
            content: `
                <form id="interviewForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>候选人 <span class="required">*</span></label>
                            <select id="interviewCand" ${candidate ? 'disabled' : ''}>
                                <option value="">请选择</option>
                                ${state.candidates.map(c => `<option value="${c.id}" ${candidate?.id === c.id ? 'selected' : ''}>${c.name} - ${c.position}</option>`).join('')}
                            </select>
                            ${candidate ? `<input type="hidden" id="interviewCandId" value="${candidate.id}">` : ''}
                        </div>
                        <div class="form-field">
                            <label>面试轮次</label>
                            <select id="interviewRound">
                                <option value="1">第一轮</option>
                                <option value="2">第二轮</option>
                                <option value="3">第三轮</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>面试官</label>
                            <select id="interviewer">
                                <option value="">请选择</option>
                                ${state.employees.map(e => `<option value="${e.id}">${e.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>面试时间 <span class="required">*</span></label>
                            <input type="datetime-local" id="interviewTime">
                        </div>
                        <div class="form-field">
                            <label>面试地点</label>
                            <input type="text" id="interviewLocation" value="会议室A" placeholder="如：会议室A">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveInterviewBtn">安排</button>
            `
        });

        document.getElementById('saveInterviewBtn')?.addEventListener('click', async () => {
            const candId = candidate?.id || parseInt(document.getElementById('interviewCandId')?.value || document.getElementById('interviewCand').value);
            const cand = state.candidates.find(c => c.id === candId);
            const interviewerId = parseInt(document.getElementById('interviewer').value);
            const interviewer = state.employees.find(e => e.id === interviewerId);

            const data = {
                candidateId: candId,
                candidateName: cand?.name || '',
                position: cand?.position || '',
                round: parseInt(document.getElementById('interviewRound').value),
                interviewerId: interviewerId,
                interviewerName: interviewer?.name || '',
                interviewTime: document.getElementById('interviewTime').value,
                location: document.getElementById('interviewLocation').value
            };

            if (!data.candidateId || !data.interviewTime) {
                Toast.error('请填写必填项');
                return;
            }

            await API.scheduleInterview(data);
            await API.updateCandidateStatus(candId, 'interviewing');
            Toast.success('面试已安排');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    openEvaluationModal(interview, container) {
        Modal.open({
            title: '面试评价',
            content: `
                <form id="evaluationForm">
                    <div class="form-grid">
                        <div class="form-field full">
                            <label>候选人：${interview.candidateName}</label>
                        </div>
                        <div class="form-field">
                            <label>评分(1-5) <span class="required">*</span></label>
                            <select id="evalRating">
                                <option value="5">5分 - 优秀</option>
                                <option value="4" selected>4分 - 良好</option>
                                <option value="3">3分 - 一般</option>
                                <option value="2">2分 - 较差</option>
                                <option value="1">1分 - 不通过</option>
                            </select>
                        </div>
                        <div class="form-field">
                            <label>是否推荐</label>
                            <select id="evalRecommend">
                                <option value="true">推荐进入下一轮</option>
                                <option value="false">不推荐</option>
                            </select>
                        </div>
                        <div class="form-field full">
                            <label>优势</label>
                            <textarea id="evalStrengths" rows="2" placeholder="请输入候选人优势"></textarea>
                        </div>
                        <div class="form-field full">
                            <label>不足</label>
                            <textarea id="evalWeaknesses" rows="2" placeholder="请输入候选人不足"></textarea>
                        </div>
                        <div class="form-field full">
                            <label>综合评价</label>
                            <textarea id="evalOverall" rows="2" placeholder="请输入综合评价"></textarea>
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="submitEvalBtn">提交评价</button>
            `
        });

        document.getElementById('submitEvalBtn')?.addEventListener('click', async () => {
            const recommended = document.getElementById('evalRecommend').value === 'true';
            const data = {
                rating: parseInt(document.getElementById('evalRating').value),
                strengths: document.getElementById('evalStrengths').value,
                weaknesses: document.getElementById('evalWeaknesses').value,
                overall: document.getElementById('evalOverall').value,
                recommended
            };

            await API.evaluateInterview(interview.id, data);

            if (recommended) {
                await API.updateCandidateStatus(interview.candidateId, 'offer');
            } else {
                await API.updateCandidateStatus(interview.candidateId, 'rejected');
            }

            Toast.success('评价已提交');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(container);
        });
    },

    openOfferModal() {
        Modal.open({
            title: '创建Offer',
            content: `
                <form id="offerForm">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>候选人 <span class="required">*</span></label>
                            <select id="offerCand">
                                <option value="">请选择</option>
                                ${state.candidates.filter(c => c.status === 'interviewing' || c.status === 'offer').map(c => `<option value="${c.id}">${c.name} - ${c.position}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-field">
                            <label>基本工资 <span class="required">*</span></label>
                            <input type="number" id="offerBaseSalary" placeholder="如：15000">
                        </div>
                        <div class="form-field">
                            <label>补贴</label>
                            <input type="number" id="offerAllowances" value="0" placeholder="如：3000">
                        </div>
                        <div class="form-field">
                            <label>试用期(月)</label>
                            <input type="number" id="offerProbation" value="3" min="1" max="6">
                        </div>
                        <div class="form-field">
                            <label>预计入职日期 <span class="required">*</span></label>
                            <input type="date" id="offerStartDate">
                        </div>
                    </div>
                </form>
            `,
            footer: `
                <button class="btn btn-default modal-cancel">取消</button>
                <button class="btn btn-primary" id="saveOfferBtn">创建</button>
            `
        });

        document.getElementById('saveOfferBtn')?.addEventListener('click', async () => {
            const candId = parseInt(document.getElementById('offerCand').value);
            const cand = state.candidates.find(c => c.id === candId);

            const data = {
                candidateId: candId,
                candidateName: cand?.name || '',
                position: cand?.position || '',
                baseSalary: parseInt(document.getElementById('offerBaseSalary').value) || 0,
                allowances: parseInt(document.getElementById('offerAllowances').value) || 0,
                probationMonths: parseInt(document.getElementById('offerProbation').value) || 3,
                startDate: document.getElementById('offerStartDate').value
            };

            if (!data.candidateId || !data.baseSalary || !data.startDate) {
                Toast.error('请填写必填项');
                return;
            }

            await API.createOffer(data);
            Toast.success('Offer已创建');
            document.querySelector('.modal-overlay.show')?.remove();
            await this.loadData();
            this.renderContent(document.getElementById('content'));
        });
    },

    async sendOffer(id, container) {
        await API.sendOffer(id);
        Toast.success('Offer已发送');
        await this.loadData();
        this.renderContent(container);
    },

    async acceptOffer(id, container) {
        const offer = state.offers.find(o => o.id === id);
        await API.acceptOffer(id);
        Toast.success('Offer已接受，正在创建员工档案...');

        const candidate = state.candidates.find(c => c.id === offer.candidateId);
        if (candidate) {
            const probationEnd = new Date(offer.startDate);
            probationEnd.setMonth(probationEnd.getMonth() + offer.probationMonths);

            const newEmployee = {
                name: candidate.name,
                employeeNo: 'E' + String(Date.now()).slice(-6),
                department: state.jobs.find(j => j.title === candidate.position)?.department || '技术部',
                position: candidate.position,
                phone: candidate.phone,
                email: candidate.email,
                entryDate: offer.startDate,
                status: 1,
                probationEnd: probationEnd.toISOString().split('T')[0],
                source: '招聘'
            };

            try {
                await API.request('/employees', { method: 'POST', body: JSON.stringify(newEmployee) });
                Toast.success('员工档案已创建');
            } catch (error) {
                console.error('Failed to create employee:', error);
            }
        }

        window.dispatchEvent(new CustomEvent('offerAccepted', { detail: { offer, candidate } }));
        await this.loadData();
        this.renderContent(container);
    },

    async rejectOffer(id, container) {
        await API.rejectOffer(id);
        Toast.warning('Offer已拒绝');
        await this.loadData();
        this.renderContent(container);
    },

    destroy() {}
};

export default recruitmentModule;
