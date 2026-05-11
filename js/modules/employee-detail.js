import { Toast, Modal, escapeHtml } from '../utils.js';
import API from '../api.js';

const state = {
    currentEmployee: null,
    isEditMode: false,
    departments: [],
    positions: [],
    workExperiences: [],
    familyMembers: [],
    projectPerformances: [],
    departmentInfos: [],
    educationInfos: [],
    awards: [],
    titleInfos: [],
    registrations: [],
    positionCertificates: [],
    transfers: [],
    processRecords: []
};

const employeeDetailModule = {
    async open(employee) {
        state.currentEmployee = employee;
        await this.loadRelatedData(employee.id);
        this.ensureModalExists();
        this.renderModal();
        this.bindEvents();
    },

    setReadOnly(readOnly) {
        state.isEditMode = !readOnly;
    },

    ensureModalExists() {
        let drawer = document.getElementById('detailDrawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'detailDrawer';
            drawer.className = 'modal-overlay';
            drawer.innerHTML = `
                <div class="modal-container-large">
                    <div class="modal-header">
                        <h2>👤 员工详情</h2>
                        <div class="modal-header-actions">
                            <button class="btn-modal-export" id="exportEmployeePDFBtn">📄 导出PDF</button>
                            <button class="modal-close">×</button>
                        </div>
                    </div>
                    <div class="modal-body" id="detailContent" style="max-height: 70vh; overflow-y: auto;"></div>
                    <div class="modal-actions" id="detailActions">
                        <button class="btn-modal btn-modal-secondary" id="toggleEditBtn">编辑</button>
                        <button class="btn-modal btn-modal-secondary" id="cancelDetailBtn" style="display: none;">取消</button>
                        <button class="btn-modal btn-modal-primary" id="saveDetailBtn" style="display: none;">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(drawer);
        }
    },

    async loadRelatedData(employeeId) {
        try {
            const [detailRes, deptRes, posRes] = await Promise.all([
                API.getEmployeeDetail(employeeId),
                API.getDepartments(),
                API.getPositions()
            ]);
            
            if (detailRes.code === 200) {
                const data = detailRes.data;
                state.currentEmployee = { ...state.currentEmployee, ...data };
                state.workExperiences = data.workExperiences || [];
                state.familyMembers = data.familyMembers || [];
                state.projectPerformances = data.projectPerformances || [];
                state.departmentInfos = data.departmentInfos || [];
                state.educationInfos = data.educationInfos || [];
                state.awards = data.awards || [];
                state.titleInfos = data.titleInfos || [];
                state.registrations = data.registrations || [];
                state.positionCertificates = data.positionCertificates || [];
                state.transfers = data.transfers || [];
                state.processRecords = data.processRecords || [];
            }
            
            if (deptRes.code === 200) {
                state.departments = deptRes.data || [];
            }
            
            if (posRes.code === 200) {
                state.positions = posRes.data || [];
            }
        } catch (error) {
            console.error('Failed to load employee detail:', error);
        }
    },

    renderModal() {
        const employee = state.currentEmployee;
        const isEditMode = state.isEditMode;

        const nations = ['汉族', '蒙古族', '回族', '藏族', '维吾尔族', '苗族', '彝族', '壮族', '布依族', '朝鲜族', '满族', '侗族', '瑶族', '白族', '土家族', '哈尼族', '哈萨克族', '傣族', '黎族', '傈僳族', '佤族', '畲族', '高山族', '拉祜族', '水族', '东乡族', '纳西族', '景颇族', '柯尔克孜族', '土族', '达斡尔族', '仫佬族', '羌族', '布朗族', '撒拉族', '毛南族', '仡佬族', '锡伯族', '阿昌族', '普米族', '塔吉克族', '怒族', '乌孜别克族', '俄罗斯族', '鄂温克族', '德昂族', '保安族', '裕固族', '京族', '塔塔尔族', '独龙族', '鄂伦春族', '赫哲族', '门巴族', '珞巴族', '基诺族'];
        const politicalStatusOptions = ['群众', '共青团员', '中共党员', '中共预备党员', '民革党员', '民盟盟员', '民建会员', '民进会员', '农工党党员', '致公党党员', '九三学社社员', '台盟盟员', '无党派人士'];
        const healthReportOptions = ['已提交', '未提交', '待复查'];
        const marriageStatusOptions = ['未婚', '已婚', '离异', '丧偶'];
        const educationOptions = ['专科', '本科', '硕士', '博士'];
        const titleOptions = ['无', '助理工程师', '工程师', '高级工程师'];
        const workFieldOptions = ['建筑设计', '工程施工', '工程监理', '工程检测', '工程造价', '市政公用'];
        const projectLevelOptions = ['三级工程', '二级工程', '一级工程'];
        const employeeTypeOptions = ['正式员工', '实习生', '兼职', '劳务派遣'];
        const hireTypeOptions = ['合同制', '事业编制', '劳务派遣'];
        const yesNoOptions = ['是', '否'];
        const householdTypeOptions = [
            { value: 'urban', label: '城镇' },
            { value: 'rural', label: '农村' }
        ];

        const drawer = document.getElementById('detailDrawer');
        const content = document.getElementById('detailContent');

        content.innerHTML = `
            <style>
                .detail-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(24, 144, 255, 0.1); }
                .detail-section-title { font-weight: 600; color: #1a3a5c; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
                .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
                .detail-item { display: flex; flex-direction: column; }
                .detail-label { font-size: 12px; color: #8ba9c4; margin-bottom: 6px; font-weight: 500; }
                .detail-input { padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.88rem; background: #fafcff; color: #1a3a5c; }
                .detail-input:focus { outline: none; border-color: #f0b429; box-shadow: 0 0 0 3px rgba(240,180,41,0.2); background: white; }
                .detail-input:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
                .photo-upload-area { border: 2px dashed #b8d4e8; border-radius: 14px; padding: 28px; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafcff; }
                .photo-upload-area:hover { border-color: #f0b429; background: #fffef8; }
                .table-container { overflow-x: auto; border-radius: 14px; border: 1px solid #e2e8f0; margin-top: 12px; }
                .detail-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                .detail-table th { background: linear-gradient(135deg, #e6f0fa, #d8e8f5); padding: 12px; font-weight: 600; color: #1a4a6f; border-bottom: 2px solid #b8d4e8; text-align: left; }
                .detail-table td { padding: 12px; border-bottom: 1px solid #e8f0f7; background: white; }
                .btn-table { padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.75rem; font-weight: 500; }
                .btn-table-edit { background: #3b82f6; color: white; margin-right: 4px; }
                .btn-table-delete { background: #ef4444; color: white; }
                .btn-table-add { background: #22c55e; color: white; margin-top: 12px; padding: 8px 16px; }
                .btn-table-upload { background: #f0b429; color: white; }
                .form-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
                .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 28px; position: sticky; bottom: 0; padding: 16px 0; background: white; border-top: 1px solid #e2e8f0; }
                .btn-modal { padding: 12px 24px; border-radius: 12px; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; }
                .btn-modal-primary { background: linear-gradient(135deg, #1a4a6f, #0b2b3b); color: white; }
                .btn-modal-secondary { background: #f1f5f9; color: #1a4a6f; }
                .btn-modal-edit { background: #3b82f6; color: white; }
            </style>

            <div class="detail-section" style="border-top: none; margin-top: 0; padding-top: 0;">
                <div class="detail-section-title">👤 基本信息</div>
                <div style="display: grid; grid-template-columns: 150px 1fr; gap: 20px;">
                    <div class="photo-upload-area">
                        <div id="photoPreview" style="width: 120px; height: 160px; margin: 0 auto; background: #e8f0f7; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 48px;">👤</span>
                        </div>
                        <div style="margin-top: 12px; font-size: 12px; color: #8ba9c4;">点击上传照片</div>
                        <input type="file" id="photoInput" accept="image/*" style="display: none;">
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">姓名 <span style="color: #e84747;">*</span></span>
                            <input type="text" id="modalName" class="detail-input" value="${escapeHtml(employee.name || '')}" ${!isEditMode ? 'disabled' : ''}>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">性别</span>
                            <select id="modalGender" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                                <option value="男" ${employee.gender !== 2 ? 'selected' : ''}>男</option>
                                <option value="女" ${employee.gender === 2 ? 'selected' : ''}>女</option>
                            </select>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">年龄</span>
                            <input type="number" id="modalAge" class="detail-input" value="${employee.age || ''}" ${!isEditMode ? 'disabled' : ''}>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">民族</span>
                            <select id="modalNation" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                                ${nations.map(n => `<option value="${n}" ${employee.nation === n ? 'selected' : ''}>${n}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🆔 身份信息</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">身份证号</span>
                        <input type="text" id="modalIdCard" class="detail-input" value="${employee.idCard || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">政治面貌</span>
                        <select id="modalPoliticalStatus" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${politicalStatusOptions.map(p => `<option value="${p}" ${employee.politicalStatus === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">档案所在地</span>
                        <input type="text" id="modalArchiveLocation" class="detail-input" value="${employee.archiveLocation || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">体检报告</span>
                        <select id="modalHealthReport" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${healthReportOptions.map(h => `<option value="${h}" ${employee.healthReport === h ? 'selected' : ''}>${h}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">户口性质</span>
                        <select id="modalHouseholdType" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${householdTypeOptions.map(h => `<option value="${h.value}" ${employee.householdType === h.value ? 'selected' : ''}>${h.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">婚姻状况</span>
                        <select id="modalMarriageStatus" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${marriageStatusOptions.map(m => `<option value="${m}" ${employee.marriageStatus === m ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📞 联系信息</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">户籍地址</span>
                        <input type="text" id="modalRegisteredAddress" class="detail-input" value="${employee.registeredAddress || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">现住址</span>
                        <input type="text" id="modalCurrentAddress" class="detail-input" value="${employee.currentAddress || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">手机号码</span>
                        <input type="text" id="modalPhone" class="detail-input" value="${employee.phone || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">电子邮箱</span>
                        <input type="text" id="modalEmail" class="detail-input" value="${employee.email || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">紧急联系人</span>
                        <input type="text" id="modalEmergencyContact" class="detail-input" value="${employee.emergencyContact || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">紧急联系人电话</span>
                        <input type="text" id="modalEmergencyPhone" class="detail-input" value="${employee.emergencyPhone || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🎓 学历与职称信息</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">最高学历</span>
                        <select id="modalEducation" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${educationOptions.map(e => `<option value="${e}" ${employee.education === e ? 'selected' : ''}>${e}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">毕业时间</span>
                        <input type="date" id="modalGraduationDate" class="detail-input" value="${employee.graduationDate || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">专业</span>
                        <input type="text" id="modalMajor" class="detail-input" value="${employee.major || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">现有职称</span>
                        <select id="modalTitle" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${titleOptions.map(t => `<option value="${t}" ${employee.title === t ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">职称取得时间</span>
                        <input type="date" id="modalTitleDate" class="detail-input" value="${employee.titleDate || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">工龄</span>
                        <input type="number" id="modalWorkYears" class="detail-input" value="${employee.workYears || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">工作领域</span>
                        <select id="modalWorkField" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            <option value="">请选择</option>
                            ${workFieldOptions.map(w => `<option value="${w}" ${employee.workField === w ? 'selected' : ''}>${w}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">项目级别</span>
                        <select id="modalProjectLevel" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            <option value="">请选择</option>
                            ${projectLevelOptions.map(p => `<option value="${p}" ${employee.projectLevel === p ? 'selected' : ''}>${p}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">是否担任负责人</span>
                        <select id="modalIsManager" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${yesNoOptions.map(y => `<option value="${y}" ${(employee.isManager === 1 ? '是' : '否') === y ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">💼 工作信息</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">工号</span>
                        <input type="text" id="modalEmployeeNo" class="detail-input" value="${escapeHtml(employee.employeeNo || '')}" disabled>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">归属部门</span>
                        <select id="modalDepartment" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            <option value="">请选择部门</option>
                            ${state.departments.map(d => `<option value="${d.id}" ${employee.department_id === d.id ? 'selected' : ''}>${d.dept_name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">工作岗位</span>
                        <select id="modalPosition" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            <option value="">请选择岗位</option>
                            ${state.positions.filter(p => !employee.department_id || p.departmentId === employee.department_id).map(p => `<option value="${p.id}" ${employee.position_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">入职时间</span>
                        <input type="date" id="modalEntryDate" class="detail-input" value="${employee.entryDate || employee.hire_date || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">转正日期</span>
                        <input type="date" id="modalRegularDate" class="detail-input" value="${employee.regularDate || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">部门性质</span>
                        <input type="text" id="modalDepartmentNature" class="detail-input" value="${employee.departmentNature || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">人员性质</span>
                        <select id="modalEmployeeType" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${employeeTypeOptions.map(e => `<option value="${e}" ${employee.employeeType === e ? 'selected' : ''}>${e}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">直接上级</span>
                        <input type="text" id="modalDirectSuperior" class="detail-input" value="${employee.directSuperior || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">分管领导</span>
                        <input type="text" id="modalManager" class="detail-input" value="${employee.manager || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">是否考勤</span>
                        <select id="modalAttendanceRequired" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${yesNoOptions.map(y => `<option value="${y}" ${(employee.attendanceRequired === 1 ? '是' : '否') === y ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">聘用性质</span>
                        <select id="modalHireType" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            ${hireTypeOptions.map(h => `<option value="${h}" ${employee.hireType === h ? 'selected' : ''}>${h}</option>`).join('')}
                        </select>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">加入工会时间</span>
                        <input type="date" id="modalUnionJoinDate" class="detail-input" value="${employee.unionJoinDate || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">保密协议</span>
                        <select id="modalConfidentialAgreement" class="detail-input" ${!isEditMode ? 'disabled' : ''}>
                            <option value="已签订" ${employee.confidentialAgreement === 1 ? 'selected' : ''}>已签订</option>
                            <option value="未签订" ${employee.confidentialAgreement !== 1 ? 'selected' : ''}>未签订</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">💰 薪酬福利</div>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">月薪标准</span>
                        <input type="number" id="modalSalary" class="detail-input" value="${employee.salary || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">参考年薪</span>
                        <input type="number" id="modalAnnualSalary" class="detail-input" value="${employee.annualSalary || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">社保基数</span>
                        <input type="number" id="modalSocialSecurityBase" class="detail-input" value="${employee.socialSecurityBase || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">社保购买单位</span>
                        <input type="text" id="modalSocialSecurityCompany" class="detail-input" value="${employee.socialSecurityCompany || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">社保开始时间</span>
                        <input type="date" id="modalSocialSecurityStartDate" class="detail-input" value="${employee.socialSecurityStartDate || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">银行卡号</span>
                        <input type="text" id="modalBankCard" class="detail-input" value="${employee.bankCard || ''}" ${!isEditMode ? 'disabled' : ''}>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📁 附件</div>
                <div style="padding: 16px; background: #fafcff; border-radius: 12px; border: 1px dashed #b8d4e8;">
                    <button class="btn-table btn-table-upload" style="margin: 0;" ${!isEditMode ? 'disabled' : ''}>📤 上传体检报告</button>
                    <div style="margin-top: 12px; font-size: 12px; color: #8ba9c4;">支持 PDF、图片等格式</div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📋 工作经历</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>起止时间</th>
                                <th>工作单位</th>
                                <th>职位</th>
                                <th>证明人</th>
                                <th>联系电话</th>
                                <th>证明材料</th>
                                <th>简历附件</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="workExperienceBody">
                            ${state.workExperiences.length > 0 ? state.workExperiences.map((exp, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 120px;" value="${exp.period || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${exp.company || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${exp.position || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${exp.reference || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${exp.phone || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><button class="btn-table btn-table-upload" ${!isEditMode ? 'disabled' : ''}>上传</button></td>
                                    <td><button class="btn-table btn-table-upload" ${!isEditMode ? 'disabled' : ''}>上传</button></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="9" style="text-align: center; padding: 20px;">暂无工作经历</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addWorkExperience()">➕ 添加工作经历</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">👨‍👩‍👧‍👦 家庭主要成员</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>姓名</th>
                                <th>关系</th>
                                <th>工作单位</th>
                                <th>联系电话</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="familyMemberBody">
                            ${state.familyMembers.length > 0 ? state.familyMembers.map((fm, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${fm.name || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 80px;" value="${fm.relation || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${fm.company || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${fm.phone || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${fm.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="7" style="text-align: center; padding: 20px;">暂无家庭成员</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addFamilyMember()">➕ 添加家庭成员</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">⭐ 本人项目业绩</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>项目类型</th>
                                <th>开始时间</th>
                                <th>结束时间</th>
                                <th>项目名称</th>
                                <th>项目级别</th>
                                <th>个人角色</th>
                                <th>证明材料</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="projectPerformanceBody">
                            ${state.projectPerformances.length > 0 ? state.projectPerformances.map((p, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${p.type || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${p.startDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${p.endDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${p.name || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${p.level || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${p.role || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><button class="btn-table btn-table-upload" ${!isEditMode ? 'disabled' : ''}>上传</button></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="9" style="text-align: center; padding: 20px;">暂无项目业绩</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addProjectPerformance()">➕ 添加项目业绩</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🏢 部门信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>部门名称</th>
                                <th>职位</th>
                                <th>入职时间</th>
                                <th>离职时间</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="departmentInfoBody">
                            ${state.departmentInfos.length > 0 ? state.departmentInfos.map((d, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${d.department || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${d.position || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${d.entryDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${d.leaveDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${d.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="7" style="text-align: center; padding: 20px;">暂无部门信息</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addDepartmentInfo()">➕ 添加部门信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🎓 教育信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>学历</th>
                                <th>学校</th>
                                <th>专业</th>
                                <th>入学时间</th>
                                <th>毕业时间</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="educationInfoBody">
                            ${state.educationInfos.length > 0 ? state.educationInfos.map((e, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 80px;" value="${e.education || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${e.school || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${e.major || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${e.entryDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${e.graduationDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${e.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="8" style="text-align: center; padding: 20px;">暂无教育信息</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addEducationInfo()">➕ 添加教育信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🏆 获奖情况</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>奖项名称</th>
                                <th>颁奖单位</th>
                                <th>获奖时间</th>
                                <th>获奖内容</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="awardBody">
                            ${state.awards.length > 0 ? state.awards.map((a, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${a.name || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${a.issuer || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${a.date || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${a.content || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${a.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="7" style="text-align: center; padding: 20px;">暂无获奖记录</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addAward()">➕ 添加获奖记录</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📜 职称信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>职称名称</th>
                                <th>评定机构</th>
                                <th>取得时间</th>
                                <th>有效期至</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="titleInfoBody">
                            ${state.titleInfos.length > 0 ? state.titleInfos.map((t, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${t.name || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${t.issuer || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${t.date || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${t.expireDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${t.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="7" style="text-align: center; padding: 20px;">暂无职称信息</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addTitleInfo()">➕ 添加职称信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🪪 注册证信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>证书名称</th>
                                <th>证书编号</th>
                                <th>取得时间</th>
                                <th>有效期至</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="registrationBody">
                            ${state.registrations.length > 0 ? state.registrations.map((r, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${r.name || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 120px;" value="${r.number || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${r.date || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${r.expireDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${r.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="7" style="text-align: center; padding: 20px;">暂无注册证信息</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addRegistration()">➕ 添加注册证信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📑 岗位证信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>证书名称</th>
                                <th>证书编号</th>
                                <th>取得时间</th>
                                <th>有效期至</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="positionCertificateBody">
                            ${state.positionCertificates.length > 0 ? state.positionCertificates.map((p, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${p.name || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 120px;" value="${p.number || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${p.date || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${p.expireDate || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${p.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="7" style="text-align: center; padding: 20px;">暂无岗位证信息</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addPositionCertificate()">➕ 添加岗位证信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📋 人事调动情况</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>调动类型</th>
                                <th>原部门</th>
                                <th>原职位</th>
                                <th>新部门</th>
                                <th>新职位</th>
                                <th>调动时间</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="transferBody">
                            ${state.transfers.length > 0 ? state.transfers.map((t, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${t.type || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 120px;" value="${t.oldDepartment || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${t.oldPosition || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 120px;" value="${t.newDepartment || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${t.newPosition || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="date" class="detail-input" style="width: 100px;" value="${t.date || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${t.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="9" style="text-align: center; padding: 20px;">暂无人事调动记录</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addTransfer()">➕ 添加人事调动</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🔄 流程记录</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>流程名称</th>
                                <th>流程类型</th>
                                <th>发起时间</th>
                                <th>完成时间</th>
                                <th>状态</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="processRecordBody">
                            ${state.processRecords.length > 0 ? state.processRecords.map((p, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><input type="text" class="detail-input" style="width: 150px;" value="${p.name || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${p.type || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="datetime-local" class="detail-input" style="width: 150px;" value="${p.startTime || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="datetime-local" class="detail-input" style="width: 150px;" value="${p.endTime || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${p.status || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td><input type="text" class="detail-input" style="width: 100px;" value="${p.note || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                    <td>
                                        <button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button>
                                        <button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''} onclick="this.closest('tr').remove();">删除</button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr><td colspan="8" style="text-align: center; padding: 20px;">暂无流程记录</td></tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" style="float: right;" onclick="addProcessRecord()">➕ 添加流程记录</button>
            </div>
        `;

        drawer.classList.add('show');
    },

    bindEvents() {
        const drawer = document.getElementById('detailDrawer');
        const content = document.getElementById('detailContent');

        document.getElementById('photoPreview')?.addEventListener('click', () => {
            document.getElementById('photoInput')?.click();
        });

        document.getElementById('toggleEditBtn')?.addEventListener('click', () => {
            state.isEditMode = !state.isEditMode;
            const editBtn = document.getElementById('toggleEditBtn');
            const saveBtn = document.getElementById('saveDetailBtn');
            const cancelBtn = document.getElementById('cancelDetailBtn');

            if (state.isEditMode) {
                editBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
                cancelBtn.style.display = 'inline-block';
                document.querySelectorAll('.detail-input').forEach(el => {
                    if (el.id !== 'modalEmployeeNo') {
                        el.disabled = false;
                    }
                });
            } else {
                editBtn.style.display = 'inline-block';
                saveBtn.style.display = 'none';
                cancelBtn.style.display = 'none';
                document.querySelectorAll('.detail-input').forEach(el => {
                    if (el.id !== 'modalEmployeeNo') {
                        el.disabled = true;
                    }
                });
            }
        });

        document.getElementById('saveDetailBtn')?.addEventListener('click', async () => {
            await this.saveDetail();
        });

        document.getElementById('cancelDetailBtn')?.addEventListener('click', () => {
            state.isEditMode = false;
            const editBtn = document.getElementById('toggleEditBtn');
            const saveBtn = document.getElementById('saveDetailBtn');
            const cancelBtn = document.getElementById('cancelDetailBtn');
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
            document.querySelectorAll('.detail-input').forEach(el => {
                if (el.id !== 'modalEmployeeNo') {
                    el.disabled = true;
                }
            });
            this.open(state.currentEmployee);
        });

        drawer?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.close();
            }
        });

        document.querySelector('#detailDrawer .modal-close')?.addEventListener('click', () => {
            this.close();
        });

        // 部门-岗位联动
        document.getElementById('modalDepartment')?.addEventListener('change', async () => {
            await this.updatePositionOptions();
        });

        // 全局表格添加函数
        const isDisabled = !state.isEditMode ? 'disabled' : '';
        
        window.addWorkExperience = () => {
            const tbody = document.getElementById('workExperienceBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 120px;" placeholder="起止时间" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="工作单位" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="职位" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="证明人" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="联系电话" ${isDisabled}></td>
                <td><button class="btn-table btn-table-upload" ${isDisabled}>上传</button></td>
                <td><button class="btn-table btn-table-upload" ${isDisabled}>上传</button></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addFamilyMember = () => {
            const tbody = document.getElementById('familyMemberBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="姓名" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 80px;" placeholder="关系" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="工作单位" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="联系电话" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addProjectPerformance = () => {
            const tbody = document.getElementById('projectPerformanceBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="项目类型" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="项目名称" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="项目级别" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="个人角色" ${isDisabled}></td>
                <td><button class="btn-table btn-table-upload" ${isDisabled}>上传</button></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addDepartmentInfo = () => {
            const tbody = document.getElementById('departmentInfoBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="部门名称" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="职位" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addEducationInfo = () => {
            const tbody = document.getElementById('educationInfoBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 80px;" placeholder="学历" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="学校" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="专业" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addAward = () => {
            const tbody = document.getElementById('awardBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="奖项名称" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="颁奖单位" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="获奖内容" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addTitleInfo = () => {
            const tbody = document.getElementById('titleInfoBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="职称名称" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="评定机构" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addRegistration = () => {
            const tbody = document.getElementById('registrationBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="证书名称" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 120px;" placeholder="证书编号" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addPositionCertificate = () => {
            const tbody = document.getElementById('positionCertificateBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="证书名称" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 120px;" placeholder="证书编号" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addTransfer = () => {
            const tbody = document.getElementById('transferBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="调动类型" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 120px;" placeholder="原部门" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="原职位" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 120px;" placeholder="新部门" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="新职位" ${isDisabled}></td>
                <td><input type="date" class="detail-input" style="width: 100px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };

        window.addProcessRecord = () => {
            const tbody = document.getElementById('processRecordBody');
            const row = tbody.insertRow();
            const idx = tbody.rows.length;
            row.innerHTML = `
                <td>${idx}</td>
                <td><input type="text" class="detail-input" style="width: 150px;" placeholder="流程名称" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="流程类型" ${isDisabled}></td>
                <td><input type="datetime-local" class="detail-input" style="width: 150px;" ${isDisabled}></td>
                <td><input type="datetime-local" class="detail-input" style="width: 150px;" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="状态" ${isDisabled}></td>
                <td><input type="text" class="detail-input" style="width: 100px;" placeholder="备注" ${isDisabled}></td>
                <td>
                    <button class="btn-table btn-table-edit" ${isDisabled}>编辑</button>
                    <button class="btn-table btn-table-delete" ${isDisabled} onclick="this.closest('tr').remove();">删除</button>
                </td>
            `;
        };
    },

    async updatePositionOptions() {
        const departmentId = document.getElementById('modalDepartment').value;
        const positionSelect = document.getElementById('modalPosition');
        
        positionSelect.innerHTML = '<option value="">请选择工作岗位</option>';
        if (!departmentId) return;

        const filteredPositions = state.positions.filter(p => p.departmentId === parseInt(departmentId));
        filteredPositions.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos.id;
            option.textContent = pos.name;
            positionSelect.appendChild(option);
        });
    },

    async saveDetail() {
        const data = {
            id: state.currentEmployee.id,
            name: document.getElementById('modalName').value,
            gender: document.getElementById('modalGender').value === '男' ? 1 : 2,
            age: parseInt(document.getElementById('modalAge').value) || null,
            nation: document.getElementById('modalNation').value,
            idCard: document.getElementById('modalIdCard').value,
            politicalStatus: document.getElementById('modalPoliticalStatus').value,
            archiveLocation: document.getElementById('modalArchiveLocation').value,
            healthReport: document.getElementById('modalHealthReport').value,
            householdType: document.getElementById('modalHouseholdType').value,
            marriageStatus: document.getElementById('modalMarriageStatus').value,
            registeredAddress: document.getElementById('modalRegisteredAddress').value,
            currentAddress: document.getElementById('modalCurrentAddress').value,
            phone: document.getElementById('modalPhone').value,
            email: document.getElementById('modalEmail').value,
            emergencyContact: document.getElementById('modalEmergencyContact').value,
            emergencyPhone: document.getElementById('modalEmergencyPhone').value,
            education: document.getElementById('modalEducation').value,
            graduationDate: document.getElementById('modalGraduationDate').value,
            major: document.getElementById('modalMajor').value,
            title: document.getElementById('modalTitle').value,
            titleDate: document.getElementById('modalTitleDate').value,
            workYears: parseInt(document.getElementById('modalWorkYears').value) || null,
            workField: document.getElementById('modalWorkField').value,
            projectLevel: document.getElementById('modalProjectLevel').value,
            isManager: document.getElementById('modalIsManager').value === '是' ? 1 : 0,
            department_id: parseInt(document.getElementById('modalDepartment').value) || null,
            position_id: parseInt(document.getElementById('modalPosition').value) || null,
            entryDate: document.getElementById('modalEntryDate').value,
            regularDate: document.getElementById('modalRegularDate').value,
            departmentNature: document.getElementById('modalDepartmentNature').value,
            employeeType: document.getElementById('modalEmployeeType').value,
            directSuperior: document.getElementById('modalDirectSuperior').value,
            manager: document.getElementById('modalManager').value,
            attendanceRequired: document.getElementById('modalAttendanceRequired').value === '是' ? 1 : 0,
            hireType: document.getElementById('modalHireType').value,
            unionJoinDate: document.getElementById('modalUnionJoinDate').value,
            confidentialAgreement: document.getElementById('modalConfidentialAgreement').value === '已签订' ? 1 : 0,
            salary: parseFloat(document.getElementById('modalSalary').value) || null,
            annualSalary: parseFloat(document.getElementById('modalAnnualSalary').value) || null,
            socialSecurityBase: parseFloat(document.getElementById('modalSocialSecurityBase').value) || null,
            socialSecurityCompany: document.getElementById('modalSocialSecurityCompany').value,
            socialSecurityStartDate: document.getElementById('modalSocialSecurityStartDate').value,
            bankCard: document.getElementById('modalBankCard').value
        };

        try {
            const res = await API.updateEmployeeDetail(state.currentEmployee.id, data);
            if (res.code === 200) {
                Toast.success('员工信息更新成功');
                state.isEditMode = false;
                document.getElementById('toggleEditBtn').textContent = '编辑';
                document.getElementById('saveDetailBtn').style.display = 'none';
                document.getElementById('cancelEditBtn').style.display = 'none';
                document.querySelectorAll('.detail-input').forEach(el => {
                    if (el.id !== 'modalEmployeeNo') {
                        el.disabled = true;
                    }
                });
            } else {
                Toast.error(res.message || '更新失败');
            }
        } catch (error) {
            console.error('Save failed:', error);
            Toast.error('保存失败');
        }
    },

    close() {
        const drawer = document.getElementById('detailDrawer');
        drawer?.classList.remove('show');
        state.isEditMode = false;
    }
};

export default employeeDetailModule;