import { Toast, Modal, escapeHtml, EventBus } from '../utils.js';
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
    processRecords: [],
    contracts: [],
    trainings: [],
    rewardPunishments: [],
    backgroundChecks: [],
    reminders: [],
    auditLogs: []
};

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return dateStr.split('T')[0] || '';
    }
};

const employeeDetailModule = {
    async open(employee) {
        if (!employee) {
            console.error('[ERROR] employee is null or undefined');
            return;
        }
        
        // 修复：员工详情模块只应该管理自己的弹窗，不要去操作其他模块的弹窗
        /*
        // 清理旧的弹窗
        const hideModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                modal.style.setProperty('display', 'none', 'important');
                modal.style.setProperty('visibility', 'hidden', 'important');
                modal.style.setProperty('opacity', '0', 'important');
                modal.style.setProperty('pointer-events', 'none', 'important');
            }
        };
        
        hideModal('hrPositionModal');
        hideModal('changePasswordModal');
        hideModal('personalInfoModal');
        */
        
        state.currentEmployee = employee;
        
        await this.loadRelatedData(employee.id);
        
        this.ensureModalExists();
        
        this.renderModal();
        
        this.bindEvents();
        
        setTimeout(() => {
            const drawer = document.getElementById('detailDrawer');
            if (drawer) {
                drawer.style.setProperty('display', 'flex', 'important');
                drawer.style.setProperty('visibility', 'visible', 'important');
            }
        }, 100);
    },

    bindEvents() {
        const drawer = document.getElementById('detailDrawer');
        if (!drawer) return;
        
        const self = this;
        
        // 关闭按钮事件
        const closeBtn = document.getElementById('closeDetailDrawerBtn');
        if (closeBtn) {
            closeBtn.replaceWith(closeBtn.cloneNode(true));
            const newCloseBtn = document.getElementById('closeDetailDrawerBtn');
            newCloseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const positionModal = document.getElementById('hrPositionModal');
                if (positionModal) {
                    positionModal.classList.remove('show');
                }
                self.close();
            });
        }
        
        // 点击遮罩层关闭
        drawer.removeEventListener('click', self.handleOverlayClick);
        self.handleOverlayClick = (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                self.close();
            }
        };
        drawer.addEventListener('click', self.handleOverlayClick);
        

        // ESC 键关闭
        document.removeEventListener('keydown', self.handleEscKey);
        self.handleEscKey = (e) => {
            if (e.key === 'Escape') {
                self.close();
            }
        };
        document.addEventListener('keydown', self.handleEscKey);

        // 编辑按钮
        const toggleEditBtn = drawer.querySelector('#toggleEditBtn');
        if (toggleEditBtn) {
            toggleEditBtn.removeEventListener('click', self.handleToggleEditClick);
            self.handleToggleEditClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                state.isEditMode = true;
                self.switchToEditMode();
            };
            toggleEditBtn.addEventListener('click', self.handleToggleEditClick);
        }

        // 取消按钮
        const cancelDetailBtn = drawer.querySelector('#cancelDetailBtn');
        if (cancelDetailBtn) {
            cancelDetailBtn.removeEventListener('click', self.handleCancelClick);
            self.handleCancelClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                state.isEditMode = false;
                self.switchToViewMode();
            };
            cancelDetailBtn.addEventListener('click', self.handleCancelClick);
        }

        // 保存按钮
        const saveDetailBtn = drawer.querySelector('#saveDetailBtn');
        if (saveDetailBtn) {
            saveDetailBtn.removeEventListener('click', self.handleSaveClick);
            self.handleSaveClick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                saveDetailBtn.disabled = true;
                saveDetailBtn.style.opacity = '0.7';
                try {
                    await self.saveDetail();
                } catch (error) {
                    console.error('[ERROR] saveDetailBtn click error:', error);
                    Toast.error('保存失败：' + error.message);
                } finally {
                    saveDetailBtn.disabled = false;
                    saveDetailBtn.style.opacity = '1';
                }
            };
            saveDetailBtn.addEventListener('click', self.handleSaveClick);
        }

        // 部门-岗位联动
        const departmentSelect = drawer.querySelector('#modalDepartment');
        const positionSelect = drawer.querySelector('#modalPosition');
        if (departmentSelect && positionSelect) {
            departmentSelect.removeEventListener('change', self.handleDepartmentChange);
            self.handleDepartmentChange = (e) => {
                const selectedDeptId = parseInt(e.target.value);
                if (isNaN(selectedDeptId)) {
                    positionSelect.innerHTML = '<option value="">请选择岗位</option>';
                    return;
                }
                const filteredPositions = state.positions.filter(p => p.departmentId === selectedDeptId);
                positionSelect.innerHTML = '<option value="">请选择岗位</option>' + 
                    filteredPositions.map(p => `<option value="${p.id}">${p.name || p.position_name}</option>`).join('');
            };
            departmentSelect.addEventListener('change', self.handleDepartmentChange);
        }
    },

    // 安全获取元素值的辅助函数
    safeGetValue(drawer, selector) {
        const element = drawer.querySelector(selector);
        return element ? element.value : '';
    },

    // 安全获取数值的辅助函数
    safeGetNumberValue(drawer, selector) {
        const element = drawer.querySelector(selector);
        if (!element || !element.value) return null;
        const num = parseFloat(element.value);
        return isNaN(num) ? null : num;
    },

    // 安全获取整数的辅助函数
    safeGetIntValue(drawer, selector) {
        const element = drawer.querySelector(selector);
        if (!element || !element.value) return null;
        const num = parseInt(element.value);
        return isNaN(num) ? null : num;
    },

    async saveDetail() {
        const drawer = document.getElementById('detailDrawer');
        const employee = state.currentEmployee;
        
        try {
            const data = {
                name: this.safeGetValue(drawer, '#modalName'),
                gender: this.safeGetIntValue(drawer, '#modalGender'),
                age: this.safeGetIntValue(drawer, '#modalAge'),
                nation: this.safeGetValue(drawer, '#modalNation'),
                birthDate: this.safeGetValue(drawer, '#modalBirthDate'),
                nativePlace: this.safeGetValue(drawer, '#modalNativePlace'),
                resumeAttachment: this.safeGetValue(drawer, '#modalResumeAttachment'),
                idCard: this.safeGetValue(drawer, '#modalIdCard'),
                politicalStatus: this.safeGetValue(drawer, '#modalPoliticalStatus'),
                archiveLocation: this.safeGetValue(drawer, '#modalArchiveLocation'),
                healthReport: this.safeGetValue(drawer, '#modalHealthReport'),
                householdType: this.safeGetValue(drawer, '#modalHouseholdType'),
                marriageStatus: this.safeGetValue(drawer, '#modalMarriageStatus'),
                idCardStartDate: this.safeGetValue(drawer, '#modalIdCardStartDate'),
                idCardEndDate: this.safeGetValue(drawer, '#modalIdCardEndDate'),
                idCardAttachment: this.safeGetValue(drawer, '#modalIdCardAttachment'),
                registeredAddress: this.safeGetValue(drawer, '#modalRegisteredAddress'),
                currentAddress: this.safeGetValue(drawer, '#modalCurrentAddress'),
                phone: this.safeGetValue(drawer, '#modalPhone'),
                email: this.safeGetValue(drawer, '#modalEmail'),
                emergencyContact: this.safeGetValue(drawer, '#modalEmergencyContact'),
                emergencyPhone: this.safeGetValue(drawer, '#modalEmergencyPhone'),
                wechat: this.safeGetValue(drawer, '#modalWechat'),
                qq: this.safeGetValue(drawer, '#modalQq'),
                postalCode: this.safeGetValue(drawer, '#modalPostalCode'),
                education: this.safeGetValue(drawer, '#modalEducation'),
                graduationDate: this.safeGetValue(drawer, '#modalGraduationDate'),
                major: this.safeGetValue(drawer, '#modalMajor'),
                schoolName: this.safeGetValue(drawer, '#modalSchoolName'),
                degree: this.safeGetValue(drawer, '#modalDegree'),
                foreignLanguage: this.safeGetValue(drawer, '#modalForeignLanguage'),
                computerSkill: this.safeGetValue(drawer, '#modalComputerSkill'),
                title: this.safeGetValue(drawer, '#modalTitle'),
                titleDate: this.safeGetValue(drawer, '#modalTitleDate'),
                titleAttachment: this.safeGetValue(drawer, '#modalTitleAttachment'),
                titleExpireDate: this.safeGetValue(drawer, '#modalTitleExpireDate'),
                workYears: this.safeGetIntValue(drawer, '#modalWorkYears'),
                workField: this.safeGetValue(drawer, '#modalWorkField'),
                projectLevel: this.safeGetValue(drawer, '#modalProjectLevel'),
                isManager: this.safeGetIntValue(drawer, '#modalIsManager'),
                employeeNo: this.safeGetValue(drawer, '#modalEmployeeNo'),
                department_id: this.safeGetIntValue(drawer, '#modalDepartment'),
                position_id: this.safeGetIntValue(drawer, '#modalPosition'),
                entryDate: this.safeGetValue(drawer, '#modalEntryDate'),
                regularDate: this.safeGetValue(drawer, '#modalRegularDate'),
                probationEndDate: this.safeGetValue(drawer, '#modalProbationEndDate'),
                departmentNature: this.safeGetValue(drawer, '#modalDepartmentNature'),
                employeeType: this.safeGetValue(drawer, '#modalEmployeeType'),
                directSuperior: this.safeGetValue(drawer, '#modalDirectSuperior'),
                manager: this.safeGetValue(drawer, '#modalManager'),
                attendanceRequired: this.safeGetIntValue(drawer, '#modalAttendanceRequired'),
                hireType: this.safeGetValue(drawer, '#modalHireType'),
                unionJoinDate: this.safeGetValue(drawer, '#modalUnionJoinDate'),
                confidentialAgreement: this.safeGetIntValue(drawer, '#modalConfidentialAgreement'),
                workEmail: this.safeGetValue(drawer, '#modalWorkEmail'),
                officePhone: this.safeGetValue(drawer, '#modalOfficePhone'),
                officeLocation: this.safeGetValue(drawer, '#modalOfficeLocation'),
                reportTo: this.safeGetValue(drawer, '#modalReportTo'),
                workCity: this.safeGetValue(drawer, '#modalWorkCity'),
                annualSalary: this.safeGetNumberValue(drawer, '#modalAnnualSalary'),
                socialSecurityBase: this.safeGetNumberValue(drawer, '#modalSocialSecurityBase'),
                socialSecurityCompany: this.safeGetNumberValue(drawer, '#modalSocialSecurityCompany'),
                socialSecurityStartDate: this.safeGetValue(drawer, '#modalSocialSecurityStartDate'),
                providentFundBase: this.safeGetNumberValue(drawer, '#modalProvidentFundBase'),
                providentFundAccount: this.safeGetValue(drawer, '#modalProvidentFundAccount'),
                performanceBonusRatio: this.safeGetNumberValue(drawer, '#modalPerformanceBonusRatio'),
                mealAllowance: this.safeGetNumberValue(drawer, '#modalMealAllowance'),
                transportAllowance: this.safeGetNumberValue(drawer, '#modalTransportAllowance'),
                communicationAllowance: this.safeGetNumberValue(drawer, '#modalCommunicationAllowance'),
                salarySecurityLevel: this.safeGetValue(drawer, '#modalSalarySecurityLevel'),
                bankCard: this.safeGetValue(drawer, '#modalBankCard'),
                bankName: this.safeGetValue(drawer, '#modalBankName'),
                healthReportAttachment: this.safeGetValue(drawer, '#modalHealthReportAttachment'),
                entryMaterialsChecklist: this.safeGetValue(drawer, '#modalEntryMaterialsChecklist'),
                contractAttachment: this.safeGetValue(drawer, '#modalContractAttachment'),
                confidentialityAttachment: this.safeGetValue(drawer, '#modalConfidentialityAttachment'),
                nonCompeteAttachment: this.safeGetValue(drawer, '#modalNonCompeteAttachment'),
                archiveStatus: this.safeGetValue(drawer, '#modalArchiveStatus')
            };

            const res = await API.updateEmployeeDetail(employee.id, data);
            
            if (res && res.code === 200) {
                Toast.success('保存成功');
                state.isEditMode = false;
                await this.loadRelatedData(employee.id);
                this.renderModal();
                this.bindEvents();
                
                // 触发员工更新事件，通知其他模块
                const updatedEmployee = { ...employee, ...data };
                EventBus.emit('employee:updated', updatedEmployee);
            } else {
                Toast.error(res?.message || '保存失败');
            }
        } catch (error) {
            console.error('Save error:', error);
            Toast.error('保存失败：' + error.message);
        }
    },

    setReadOnly(readOnly) {
        state.isEditMode = !readOnly;
    },

    switchToEditMode() {
        const drawer = document.getElementById('detailDrawer');
        if (!drawer) return;

        const toggleEditBtn = drawer.querySelector('#toggleEditBtn');
        const cancelDetailBtn = drawer.querySelector('#cancelDetailBtn');
        const saveDetailBtn = drawer.querySelector('#saveDetailBtn');
        
        if (toggleEditBtn) toggleEditBtn.style.display = 'none';
        if (cancelDetailBtn) cancelDetailBtn.style.display = 'inline-block';
        if (saveDetailBtn) saveDetailBtn.style.display = 'inline-block';

        const inputs = drawer.querySelectorAll('.detail-input');
        inputs.forEach(input => {
            input.disabled = false;
        });
        
        this.bindEvents();
    },

    switchToViewMode() {
        const drawer = document.getElementById('detailDrawer');
        if (!drawer) return;

        const toggleEditBtn = drawer.querySelector('#toggleEditBtn');
        const cancelDetailBtn = drawer.querySelector('#cancelDetailBtn');
        const saveDetailBtn = drawer.querySelector('#saveDetailBtn');
        
        if (toggleEditBtn) toggleEditBtn.style.display = 'inline-block';
        if (cancelDetailBtn) cancelDetailBtn.style.display = 'none';
        if (saveDetailBtn) saveDetailBtn.style.display = 'none';

        const inputs = drawer.querySelectorAll('.detail-input');
        inputs.forEach(input => {
            input.disabled = true;
        });
    },

    close() {
        const drawer = document.getElementById('detailDrawer');
        if (drawer) {
            drawer.removeEventListener('click', this.handleOverlayClick);
            document.removeEventListener('keydown', this.handleEscKey);
        }
        
        // 使用 ModalManager 关闭弹窗
        if (window.ModalManager) {
            window.ModalManager.close('detailDrawer');
        } else {
            // 降级处理
            if (drawer) {
                drawer.style.setProperty('display', 'none', 'important');
                drawer.style.setProperty('opacity', '0', 'important');
                drawer.style.setProperty('visibility', 'hidden', 'important');
            }
        }
    },

    ensureModalExists() {
        const hideModal = (modalId) => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                modal.style.setProperty('display', 'none', 'important');
                modal.style.setProperty('visibility', 'hidden', 'important');
                modal.style.setProperty('opacity', '0', 'important');
                modal.style.setProperty('pointer-events', 'none', 'important');
            }
        };
        
        // 修复：员工详情模块只应该管理自己的弹窗，不要去操作其他模块的弹窗
        /*
        hideModal('hrPositionModal');
        hideModal('changePasswordModal');
        hideModal('personalInfoModal');
        */
        
        const oldDrawer = document.getElementById('detailDrawer');
        if (oldDrawer) {
            oldDrawer.parentNode?.removeChild(oldDrawer);
        }
        
        const drawer = document.createElement('div');
        drawer.id = 'detailDrawer';
        drawer.className = 'modal-overlay';
        
        drawer.innerHTML = `
                <style>
                    #detailDrawer.modal-overlay {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        background: rgba(0, 0, 0, 0.7) !important;
                        z-index: 9999 !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        pointer-events: auto !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                    }
                    #detailDrawer .modal-container-large {
                        background: white !important;
                        border-radius: 16px !important;
                        width: 90% !important;
                        max-width: 1000px !important;
                        max-height: 85vh !important;
                        overflow: hidden !important;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
                        display: block !important;
                        opacity: 1 !important;
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 20px 24px;
                        border-bottom: 1px solid #e2e8f0;
                        background: linear-gradient(135deg, #1a4a6f, #0b2b3b);
                        color: white;
                    }
                    .modal-header h2 {
                        margin: 0;
                        font-size: 1.25rem;
                    }
                    .modal-header-actions {
                        display: flex;
                        gap: 12px;
                    }
                    .btn-modal-export {
                        padding: 8px 16px;
                        border: none;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        cursor: pointer;
                        font-size: 0.85rem;
                    }
                    .btn-modal-export:hover {
                        background: rgba(255,255,255,0.3);
                    }
                    .modal-close {
                        width: 32px;
                        height: 32px;
                        border: none;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        cursor: pointer;
                        font-size: 1.25rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .modal-close:hover {
                        background: rgba(255,255,255,0.3);
                    }
                    .modal-body {
                        padding: 24px;
                        max-height: 65vh;
                        overflow-y: auto;
                    }
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
                <div class="modal-container-large">
                    <div class="modal-header">
                        <h2>👤 员工详情</h2>
                        <div class="modal-header-actions">
                            <button class="btn-modal-export" id="exportEmployeePDFBtn">📄 导出PDF</button>
                            <button class="modal-close" id="closeDetailDrawerBtn">×</button>
                        </div>
                    </div>
                    <div class="modal-body" id="detailContent"></div>
                    <div class="modal-actions" id="detailActions">
                        <button class="btn-modal btn-modal-secondary" id="toggleEditBtn">编辑</button>
                        <button class="btn-modal btn-modal-secondary" id="cancelDetailBtn" style="display: none;">取消</button>
                        <button class="btn-modal btn-modal-primary" id="saveDetailBtn" style="display: none;">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(drawer);
            
            drawer.style.setProperty('display', 'flex', 'important');
            drawer.style.setProperty('position', 'fixed', 'important');
            drawer.style.setProperty('top', '0', 'important');
            drawer.style.setProperty('left', '0', 'important');
            drawer.style.setProperty('width', '100%', 'important');
            drawer.style.setProperty('height', '100%', 'important');
            drawer.style.setProperty('background', 'rgba(0, 0, 0, 0.7)', 'important');
            drawer.style.setProperty('z-index', '9999', 'important');
            drawer.style.setProperty('align-items', 'center', 'important');
            drawer.style.setProperty('justify-content', 'center', 'important');
            drawer.style.setProperty('opacity', '1', 'important');
            drawer.style.setProperty('visibility', 'visible', 'important');
            drawer.style.setProperty('pointer-events', 'auto', 'important');
            drawer.style.setProperty('overflow', 'hidden', 'important');
            
            drawer.classList.add('show');
    },

    loadRelatedData: async function(employeeId) {
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
                state.contracts = data.contracts || [];
                state.trainings = data.trainings || [];
                state.rewardPunishments = data.rewardPunishments || [];
                state.backgroundChecks = data.backgroundChecks || [];
                state.reminders = data.reminders || [];
                state.auditLogs = data.auditLogs || [];
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
        
        if (!employee) {
            console.error('[ERROR] currentEmployee is null, cannot render');
            return;
        }
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
        const householdTypeOptions = [{ value: 'urban', label: '城镇' }, { value: 'rural', label: '农村' }];

        const drawer = document.getElementById('detailDrawer');
        const content = document.getElementById('detailContent');
        
        if (!content) return;

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
                .detail-textarea { padding: 10px 14px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.88rem; background: #fafcff; color: #1a3a5c; min-height: 80px; resize: vertical; }
                .detail-textarea:focus { outline: none; border-color: #f0b429; box-shadow: 0 0 0 3px rgba(240,180,41,0.2); background: white; }
                .detail-textarea:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
                .photo-upload-area { border: 2px dashed #b8d4e8; border-radius: 14px; padding: 28px; text-align: center; cursor: pointer; transition: all 0.2s; background: #fafcff; }
                .photo-upload-area:hover { border-color: #f0b429; background: #fffef8; }
                .table-container { overflow-x: auto; border-radius: 14px; border: 1px solid #e2e8f0; margin-top: 12px; }
                .detail-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
                .detail-table th { background: linear-gradient(135deg, #e6f0fa, #d8e8f5); padding: 12px; font-weight: 600; color: #1a4a6f; border-bottom: 2px solid #b8d4e8; text-align: left; }
                .detail-table td { padding: 10px; border-bottom: 1px solid #e8f0f7; background: white; }
                .btn-table { padding: 4px 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 0.75rem; font-weight: 500; }
                .btn-table-edit { background: #3b82f6; color: white; margin-right: 4px; }
                .btn-table-delete { background: #ef4444; color: white; }
                .btn-table-add { background: #22c55e; color: white; margin-top: 12px; padding: 8px 16px; }
                .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 28px; position: sticky; bottom: 0; padding: 16px 0; background: white; border-top: 1px solid #e2e8f0; }
                .btn-modal { padding: 12px 24px; border-radius: 12px; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; }
                .btn-modal-primary { background: linear-gradient(135deg, #1a4a6f, #0b2b3b); color: white; }
                .btn-modal-secondary { background: #f1f5f9; color: #1a4a6f; }
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
                        <div class="detail-item"><span class="detail-label">归属部门 *</span><select id="modalDepartment" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="">请选择部门</option>${state.departments.map(d => `<option value="${d.id}" ${employee.department_id === d.id ? 'selected' : ''}>${d.name || d.dept_name}</option>`).join('')}</select></div>
                        <div class="detail-item"><span class="detail-label">工作岗位 *</span><select id="modalPosition" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="">请选择岗位</option>${state.positions.filter(p => p.departmentId === employee.department_id).map(p => `<option value="${p.id}" ${employee.position_id === p.id ? 'selected' : ''}>${p.name || p.position_name}</option>`).join('')}</select></div>
                        <div class="detail-item"><span class="detail-label">姓名 *</span><input type="text" id="modalName" class="detail-input" value="${escapeHtml(employee.name || '')}" ${!isEditMode ? 'disabled' : ''}></div>
                        <div class="detail-item"><span class="detail-label">性别</span><select id="modalGender" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="1" ${employee.genderCode === 1 ? 'selected' : ''}>男</option><option value="2" ${employee.genderCode === 2 ? 'selected' : ''}>女</option></select></div>
                        <div class="detail-item"><span class="detail-label">年龄</span><input type="number" id="modalAge" class="detail-input" value="${employee.age || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                        <div class="detail-item"><span class="detail-label">民族</span><select id="modalNation" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${nations.map(n => `<option value="${n}" ${employee.nation === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
                        <div class="detail-item"><span class="detail-label">出生日期</span><input type="date" id="modalBirthDate" class="detail-input" value="${formatDate(employee.birthDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                        <div class="detail-item"><span class="detail-label">籍贯</span><input type="text" id="modalNativePlace" class="detail-input" value="${employee.nativePlace || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                        <div class="detail-item"><span class="detail-label">简历附件</span><input type="text" id="modalResumeAttachment" class="detail-input" value="${employee.resumeAttachment || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🆔 身份信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">身份证号</span><input type="text" id="modalIdCard" class="detail-input" value="${employee.idCard || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">政治面貌</span><select id="modalPoliticalStatus" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${politicalStatusOptions.map(p => `<option value="${p}" ${employee.politicalStatus === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">档案所在地</span><input type="text" id="modalArchiveLocation" class="detail-input" value="${employee.archiveLocation || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">体检报告</span><select id="modalHealthReport" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${healthReportOptions.map(h => `<option value="${h}" ${employee.healthReport === h ? 'selected' : ''}>${h}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">户口性质</span><select id="modalHouseholdType" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${householdTypeOptions.map(h => `<option value="${h.value}" ${employee.householdType === h.value ? 'selected' : ''}>${h.label}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">婚姻状况</span><select id="modalMarriageStatus" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${marriageStatusOptions.map(m => `<option value="${m}" ${employee.marriageStatus === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">身份证有效期起</span><input type="date" id="modalIdCardStartDate" class="detail-input" value="${formatDate(employee.idCardStartDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">身份证有效期至</span><input type="date" id="modalIdCardEndDate" class="detail-input" value="${formatDate(employee.idCardEndDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">身份证附件</span><input type="text" id="modalIdCardAttachment" class="detail-input" value="${employee.idCardAttachment || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📞 联系信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">户籍地址</span><input type="text" id="modalRegisteredAddress" class="detail-input" value="${employee.registeredAddress || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">现住址</span><input type="text" id="modalCurrentAddress" class="detail-input" value="${employee.currentAddress || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">手机号码</span><input type="text" id="modalPhone" class="detail-input" value="${employee.phone || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">电子邮箱</span><input type="text" id="modalEmail" class="detail-input" value="${employee.email || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">紧急联系人</span><input type="text" id="modalEmergencyContact" class="detail-input" value="${employee.emergencyContact || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">紧急联系人电话</span><input type="text" id="modalEmergencyPhone" class="detail-input" value="${employee.emergencyPhone || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">个人微信</span><input type="text" id="modalWechat" class="detail-input" value="${employee.wechat || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">QQ号</span><input type="text" id="modalQq" class="detail-input" value="${employee.qq || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">邮编</span><input type="text" id="modalPostalCode" class="detail-input" value="${employee.postalCode || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🎓 学历与职称信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">最高学历</span><select id="modalEducation" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${educationOptions.map(e => `<option value="${e}" ${employee.education === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">毕业时间</span><input type="date" id="modalGraduationDate" class="detail-input" value="${formatDate(employee.graduationDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">专业</span><input type="text" id="modalMajor" class="detail-input" value="${employee.major || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">毕业院校</span><input type="text" id="modalSchoolName" class="detail-input" value="${employee.schoolName || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">学位</span><select id="modalDegree" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="">请选择</option><option value="学士" ${employee.degree === '学士' ? 'selected' : ''}>学士</option><option value="硕士" ${employee.degree === '硕士' ? 'selected' : ''}>硕士</option><option value="博士" ${employee.degree === '博士' ? 'selected' : ''}>博士</option></select></div>
                    <div class="detail-item"><span class="detail-label">外语水平</span><input type="text" id="modalForeignLanguage" class="detail-input" value="${employee.foreignLanguage || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">计算机水平</span><input type="text" id="modalComputerSkill" class="detail-input" value="${employee.computerSkill || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">现有职称</span><select id="modalTitle" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${titleOptions.map(t => `<option value="${t}" ${employee.title === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">职称取得时间</span><input type="date" id="modalTitleDate" class="detail-input" value="${formatDate(employee.titleDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">职称证书附件</span><input type="text" id="modalTitleAttachment" class="detail-input" value="${employee.titleAttachment || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">职称到期预警</span><input type="date" id="modalTitleExpireDate" class="detail-input" value="${formatDate(employee.titleExpireDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">工龄</span><input type="number" id="modalWorkYears" class="detail-input" value="${employee.workYears || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">工作领域</span><select id="modalWorkField" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="">请选择</option>${workFieldOptions.map(w => `<option value="${w}" ${employee.workField === w ? 'selected' : ''}>${w}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">项目级别</span><select id="modalProjectLevel" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="">请选择</option>${projectLevelOptions.map(p => `<option value="${p}" ${employee.projectLevel === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">是否担任负责人</span><select id="modalIsManager" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${yesNoOptions.map(y => `<option value="${y === '是' ? 1 : 0}" ${employee.isManager === 1 ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">💼 工作信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">工号</span><input type="text" id="modalEmployeeNo" class="detail-input" value="${employee.employeeNo || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">入职时间</span><input type="date" id="modalEntryDate" class="detail-input" value="${formatDate(employee.entryDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">转正日期</span><input type="date" id="modalRegularDate" class="detail-input" value="${formatDate(employee.regularDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">试用期到期</span><input type="date" id="modalProbationEndDate" class="detail-input" value="${formatDate(employee.probationEndDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">部门性质</span><input type="text" id="modalDepartmentNature" class="detail-input" value="${employee.departmentNature || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">人员性质</span><select id="modalEmployeeType" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${employeeTypeOptions.map(e => `<option value="${e}" ${employee.employeeType === e ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">直接上级</span><input type="text" id="modalDirectSuperior" class="detail-input" value="${employee.directSuperior || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">分管领导</span><input type="text" id="modalManager" class="detail-input" value="${employee.manager || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">是否考勤</span><select id="modalAttendanceRequired" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${yesNoOptions.map(y => `<option value="${y === '是' ? 1 : 0}" ${employee.attendanceRequired === 1 ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">聘用性质</span><select id="modalHireType" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${hireTypeOptions.map(h => `<option value="${h}" ${employee.hireType === h ? 'selected' : ''}>${h}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">加入工会时间</span><input type="date" id="modalUnionJoinDate" class="detail-input" value="${formatDate(employee.unionJoinDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">保密协议</span><select id="modalConfidentialAgreement" class="detail-input" ${!isEditMode ? 'disabled' : ''}>${yesNoOptions.map(y => `<option value="${y === '是' ? 1 : 0}" ${employee.confidentialAgreement === 1 ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
                    <div class="detail-item"><span class="detail-label">工作邮箱</span><input type="text" id="modalWorkEmail" class="detail-input" value="${employee.workEmail || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">办公电话</span><input type="text" id="modalOfficePhone" class="detail-input" value="${employee.officePhone || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">办公地点</span><input type="text" id="modalOfficeLocation" class="detail-input" value="${employee.officeLocation || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">汇报关系</span><select id="modalReportTo" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="">请选择</option><option value="实线" ${employee.reportTo === '实线' ? 'selected' : ''}>实线汇报</option><option value="虚线" ${employee.reportTo === '虚线' ? 'selected' : ''}>虚线汇报</option></select></div>
                    <div class="detail-item"><span class="detail-label">工作地</span><input type="text" id="modalWorkCity" class="detail-input" value="${employee.workCity || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">💰 薪酬福利</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">月薪标准</span><input type="number" id="modalSalary" class="detail-input" value="${employee.salary || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">参考年薪</span><input type="number" id="modalAnnualSalary" class="detail-input" value="${employee.annualSalary || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">社保基数</span><input type="number" id="modalSocialSecurityBase" class="detail-input" value="${employee.socialSecurityBase || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">社保购买单位</span><input type="text" id="modalSocialSecurityCompany" class="detail-input" value="${employee.socialSecurityCompany || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">社保开始时间</span><input type="date" id="modalSocialSecurityStartDate" class="detail-input" value="${formatDate(employee.socialSecurityStartDate)}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">公积金基数</span><input type="number" id="modalProvidentFundBase" class="detail-input" value="${employee.providentFundBase || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">公积金账号</span><input type="text" id="modalProvidentFundAccount" class="detail-input" value="${employee.providentFundAccount || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">绩效奖金比例</span><input type="number" id="modalPerformanceBonusRatio" class="detail-input" value="${employee.performanceBonusRatio || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">餐补</span><input type="number" id="modalMealAllowance" class="detail-input" value="${employee.mealAllowance || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">交通补</span><input type="number" id="modalTransportAllowance" class="detail-input" value="${employee.transportAllowance || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">通讯补</span><input type="number" id="modalCommunicationAllowance" class="detail-input" value="${employee.communicationAllowance || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">薪酬保密等级</span><input type="text" id="modalSalarySecurityLevel" class="detail-input" value="${employee.salarySecurityLevel || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">银行卡号</span><input type="text" id="modalBankCard" class="detail-input" value="${employee.bankCard || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">开户行</span><input type="text" id="modalBankName" class="detail-input" value="${employee.bankName || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📎 附件</div>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">体检报告附件</span><input type="text" id="modalHealthReportAttachment" class="detail-input" value="${employee.healthReportAttachment || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">劳动合同扫描件</span><input type="text" id="modalContractAttachment" class="detail-input" value="${employee.contractAttachment || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">保密协议扫描件</span><input type="text" id="modalConfidentialityAttachment" class="detail-input" value="${employee.confidentialityAttachment || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">竞业限制协议</span><input type="text" id="modalNonCompeteAttachment" class="detail-input" value="${employee.nonCompeteAttachment || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">入职材料清单</span><input type="text" id="modalEntryMaterialsChecklist" class="detail-input" value="${employee.entryMaterialsChecklist || ''}" ${!isEditMode ? 'disabled' : ''}></div>
                    <div class="detail-item"><span class="detail-label">档案存放状态</span><select id="modalArchiveStatus" class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="">请选择</option><option value="公司" ${employee.archiveStatus === '公司' ? 'selected' : ''}>公司</option><option value="人才市场" ${employee.archiveStatus === '人才市场' ? 'selected' : ''}>人才市场</option><option value="个人" ${employee.archiveStatus === '个人' ? 'selected' : ''}>个人</option></select></div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📋 工作经历</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>起止时间</th><th>工作单位</th><th>职位</th><th>证明人</th><th>联系电话</th><th>离职原因</th><th>工作职责</th><th>操作</th></tr></thead>
                        <tbody id="workExperienceBody">
                            ${state.workExperiences.map((exp, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(exp.period || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(exp.company || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(exp.position || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(exp.reference || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(exp.phone || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(exp.leave_reason || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><textarea class="detail-textarea" ${!isEditMode ? 'disabled' : ''}>${escapeHtml(exp.job_description || '')}</textarea></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addWorkExperienceBtn">➕ 添加工作经历</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">👨👩👧👦 家庭主要成员</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>姓名</th><th>关系</th><th>工作单位</th><th>联系电话</th><th>政治面貌</th><th>是否紧急联系人</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="familyMemberBody">
                            ${state.familyMembers.map((member, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(member.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(member.relation || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(member.company || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(member.phone || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(member.political_status || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><select class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="0" ${member.is_emergency === 0 ? 'selected' : ''}>否</option><option value="1" ${member.is_emergency === 1 ? 'selected' : ''}>是</option></select></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(member.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addFamilyMemberBtn">➕ 添加家庭成员</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🏆 本人项目业绩</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>项目类型</th><th>开始时间</th><th>结束时间</th><th>项目名称</th><th>项目级别</th><th>个人角色</th><th>项目金额</th><th>项目成果</th><th>客户名称</th><th>操作</th></tr></thead>
                        <tbody id="projectPerformanceBody">
                            ${state.projectPerformances.map((proj, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(proj.type || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(proj.start_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(proj.end_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(proj.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(proj.level || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(proj.role || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="number" class="detail-input" value="${proj.amount || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><textarea class="detail-textarea" ${!isEditMode ? 'disabled' : ''}>${escapeHtml(proj.result_description || '')}</textarea></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(proj.client_name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addProjectPerformanceBtn">➕ 添加项目业绩</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🏢 部门信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>部门名称</th><th>职位</th><th>入职时间</th><th>离职时间</th><th>异动类型</th><th>异动单据号</th><th>审批状态</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="departmentInfoBody">
                            ${state.departmentInfos.map((dept, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(dept.department || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(dept.position || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(dept.entry_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(dept.leave_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(dept.transfer_type || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(dept.transfer_doc_no || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(dept.approval_status || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(dept.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addDepartmentInfoBtn">➕ 添加部门信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🎓 教育信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>学历</th><th>学校</th><th>专业</th><th>入学时间</th><th>毕业时间</th><th>是否全日制</th><th>学历证书</th><th>学位证书</th><th>认证状态</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="educationInfoBody">
                            ${state.educationInfos.map((edu, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(edu.education || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(edu.school || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(edu.major || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(edu.entry_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(edu.graduation_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><select class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="0" ${edu.is_fulltime === 0 ? 'selected' : ''}>否</option><option value="1" ${edu.is_fulltime === 1 ? 'selected' : ''}>是</option></select></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(edu.certificate_attachment || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(edu.degree_attachment || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(edu.education_verify_status || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(edu.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addEducationInfoBtn">➕ 添加教育信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🏅 获奖情况</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>奖项名称</th><th>颁奖单位</th><th>获奖时间</th><th>获奖内容</th><th>奖项级别</th><th>证书附件</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="awardBody">
                            ${state.awards.map((award, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(award.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(award.issuer || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(award.date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><textarea class="detail-textarea" ${!isEditMode ? 'disabled' : ''}>${escapeHtml(award.content || '')}</textarea></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(award.award_level || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(award.certificate_attachment || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(award.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addAwardBtn">➕ 添加获奖情况</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📜 职称信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>职称名称</th><th>评定机构</th><th>取得时间</th><th>有效期至</th><th>证书附件</th><th>聘任时间</th><th>到期预警</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="titleInfoBody">
                            ${state.titleInfos.map((title, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(title.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(title.issuer || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(title.date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(title.expire_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(title.certificate_attachment || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(title.appointment_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(title.expire_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(title.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addTitleInfoBtn">➕ 添加职称信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📝 注册证信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>证书名称</th><th>证书编号</th><th>取得时间</th><th>有效期至</th><th>证书附件</th><th>继续教育状态</th><th>到期预警</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="registrationBody">
                            ${state.registrations.map((reg, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(reg.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(reg.number || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(reg.date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(reg.expire_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(reg.certificate_attachment || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(reg.continuing_education || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(reg.expire_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(reg.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addRegistrationBtn">➕ 添加注册证信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📝 岗位证信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>证书名称</th><th>证书编号</th><th>取得时间</th><th>有效期至</th><th>证书附件</th><th>发证机关</th><th>到期预警</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="positionCertificateBody">
                            ${state.positionCertificates.map((cert, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(cert.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(cert.number || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(cert.date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(cert.expire_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(cert.certificate_attachment || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(cert.issuing_authority || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(cert.expire_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(cert.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addPositionCertificateBtn">➕ 添加岗位证信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📋 人事调动情况</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>调动类型</th><th>原部门</th><th>原职位</th><th>新部门</th><th>新职位</th><th>调动时间</th><th>异动单据号</th><th>异动后薪资</th><th>异动原因</th><th>审批人</th><th>审批状态</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="transferBody">
                            ${state.transfers.map((transfer, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.type || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.old_department || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.old_position || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.new_department || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.new_position || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(transfer.date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.transfer_doc_no || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="number" class="detail-input" value="${transfer.after_salary || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><textarea class="detail-textarea" ${!isEditMode ? 'disabled' : ''}>${escapeHtml(transfer.reason || '')}</textarea></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.approver || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.approval_status || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(transfer.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addTransferBtn">➕ 添加人事调动</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📊 流程记录</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>流程名称</th><th>流程类型</th><th>发起时间</th><th>完成时间</th><th>当前节点</th><th>审批人</th><th>审批意见</th><th>状态</th><th>备注</th></tr></thead>
                        <tbody id="processRecordBody">
                            ${state.processRecords.map((record, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(record.name || '')}" disabled></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(record.type || '')}" disabled></td>
                                <td><input type="datetime-local" class="detail-input" value="${record.start_time || ''}" disabled></td>
                                <td><input type="datetime-local" class="detail-input" value="${record.end_time || ''}" disabled></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(record.current_node || '')}" disabled></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(record.approver || '')}" disabled></td>
                                <td><textarea class="detail-textarea" disabled>${escapeHtml(record.approval_comment || '')}</textarea></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(record.status || '')}" disabled></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(record.note || '')}" ${!isEditMode ? 'disabled' : ''}></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📄 合同信息</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>合同类型</th><th>合同编号</th><th>签订日期</th><th>生效日期</th><th>到期日期</th><th>合同扫描件</th><th>续签次数</th><th>是否无固定期限</th><th>到期预警</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="contractBody">
                            ${state.contracts.map((contract, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(contract.contract_type || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(contract.contract_no || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(contract.sign_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(contract.start_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(contract.end_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(contract.contract_attachment || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="number" class="detail-input" value="${contract.renewal_count || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><select class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="0" ${contract.is_permanent === 0 ? 'selected' : ''}>否</option><option value="1" ${contract.is_permanent === 1 ? 'selected' : ''}>是</option></select></td>
                                <td><input type="date" class="detail-input" value="${formatDate(contract.end_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(contract.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addContractBtn">➕ 添加合同信息</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📚 培训记录</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>培训名称</th><th>培训机构</th><th>培训开始时间</th><th>培训结束时间</th><th>培训时长</th><th>培训费用</th><th>培训证书</th><th>培训效果评价</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="trainingBody">
                            ${state.trainings.map((training, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(training.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(training.organization || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(training.start_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(training.end_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="number" class="detail-input" value="${training.duration || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="number" class="detail-input" value="${training.fee || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(training.certificate || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(training.evaluation || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(training.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addTrainingBtn">➕ 添加培训记录</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">⚖️ 奖惩记录</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>奖惩类型</th><th>奖惩名称</th><th>奖惩时间</th><th>奖惩原因</th><th>奖惩金额</th><th>审批状态</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="rewardPunishmentBody">
                            ${state.rewardPunishments.map((rp, index) => `
                                <tr><td>${index + 1}</td>
                                <td><select class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="奖励" ${rp.type === '奖励' ? 'selected' : ''}>奖励</option><option value="惩罚" ${rp.type === '惩罚' ? 'selected' : ''}>惩罚</option></select></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(rp.name || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(rp.date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(rp.reason || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="number" class="detail-input" value="${rp.amount || ''}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(rp.approval_status || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(rp.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addRewardPunishmentBtn">➕ 添加奖惩记录</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🔍 背景调查</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>调查项目</th><th>调查方式</th><th>调查日期</th><th>调查结果</th><th>调查人</th><th>备注</th><th>操作</th></tr></thead>
                        <tbody id="backgroundCheckBody">
                            ${state.backgroundChecks.map((check, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(check.item || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(check.method || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(check.date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(check.result || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(check.investigator || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(check.note || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addBackgroundCheckBtn">➕ 添加背景调查</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">🔔 提醒</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>提醒类型</th><th>提醒日期</th><th>提醒内容</th><th>是否已读</th><th>操作</th></tr></thead>
                        <tbody id="reminderBody">
                            ${state.reminders.map((reminder, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(reminder.type || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="date" class="detail-input" value="${formatDate(reminder.reminder_date)}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(reminder.content || '')}" ${!isEditMode ? 'disabled' : ''}></td>
                                <td><select class="detail-input" ${!isEditMode ? 'disabled' : ''}><option value="0" ${reminder.is_read === 0 ? 'selected' : ''}>否</option><option value="1" ${reminder.is_read === 1 ? 'selected' : ''}>是</option></select></td>
                                <td><button class="btn-table btn-table-edit" ${!isEditMode ? 'disabled' : ''}>编辑</button><button class="btn-table btn-table-delete" ${!isEditMode ? 'disabled' : ''}>删除</button></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <button class="btn-table btn-table-add" id="addReminderBtn">➕ 添加提醒</button>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">📋 审计日志</div>
                <div class="table-container">
                    <table class="detail-table">
                        <thead><tr><th>序号</th><th>操作类型</th><th>操作人</th><th>操作时间</th><th>操作内容</th><th>IP地址</th></tr></thead>
                        <tbody id="auditLogBody">
                            ${state.auditLogs.map((log, index) => `
                                <tr><td>${index + 1}</td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(log.operation_type || '')}" disabled></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(log.operator || '')}" disabled></td>
                                <td><input type="datetime-local" class="detail-input" value="${log.created_at || ''}" disabled></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(log.operation_content || '')}" disabled></td>
                                <td><input type="text" class="detail-input" value="${escapeHtml(log.ip_address || '')}" disabled></td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        
        const toggleEditBtn = drawer.querySelector('#toggleEditBtn');
        const cancelDetailBtn = drawer.querySelector('#cancelDetailBtn');
        const saveDetailBtn = drawer.querySelector('#saveDetailBtn');

        if (toggleEditBtn) {
            toggleEditBtn.style.display = isEditMode ? 'none' : 'inline-block';
        }
        if (cancelDetailBtn) {
            cancelDetailBtn.style.display = isEditMode ? 'inline-block' : 'none';
        }
        if (saveDetailBtn) {
            saveDetailBtn.style.display = isEditMode ? 'inline-block' : 'none';
        }
    }
};

export default employeeDetailModule;