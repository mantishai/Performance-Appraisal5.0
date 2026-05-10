// 岗位说明书弹窗功能
window.currentHrPositionId = null;
window.currentHrPositionReadOnly = false;

// 打开编辑模式弹窗
function openPositionModal(positionId) {
    window.currentHrPositionId = positionId;
    window.currentHrPositionReadOnly = false;
    loadHrPositionDesc();
    setPositionModalReadOnly(false);
    document.getElementById('hrPositionModal').classList.add('show');
}

// 打开只读查看弹窗
function openReadOnlyPositionModal(positionId) {
    window.currentHrPositionId = positionId;
    window.currentHrPositionReadOnly = true;
    loadHrPositionDesc();
    setPositionModalReadOnly(true);
    document.getElementById('hrPositionModal').classList.add('show');
}

// 关闭弹窗
function closePositionModal() {
    document.getElementById('hrPositionModal').classList.remove('show');
}

// 设置表单只读状态
function setPositionModalReadOnly(readOnly) {
    const modal = document.getElementById('hrPositionModal');
    if (!modal) return;
    
    if (readOnly) {
        modal.classList.add('readonly');
    } else {
        modal.classList.remove('readonly');
    }
    
    // 禁用所有输入元素
    const allInputs = modal.querySelectorAll('input, textarea, select, [type="checkbox"]');
    allInputs.forEach(input => {
        input.disabled = readOnly;
        if (readOnly) {
            input.setAttribute('readonly', 'readonly');
        } else {
            input.removeAttribute('readonly');
        }
    });
    
    // 控制按钮显示
    const saveBtn = document.getElementById('hrSaveBtn');
    const resetBtn = document.getElementById('hrResetBtn');
    const editBtn = document.getElementById('hrEditBtn');
    
    if (readOnly) {
        // 查看模式：隐藏保存和恢复按钮，显示编辑按钮
        if (saveBtn) saveBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        if (editBtn) editBtn.style.display = 'inline-block';
        
        // 隐藏编辑相关按钮（导入、增加、删除）
        const editButtons = modal.querySelectorAll('.section-actions button');
        editButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    } else {
        // 编辑模式：显示保存和恢复按钮，隐藏编辑按钮
        if (saveBtn) saveBtn.style.display = 'inline-block';
        if (resetBtn) resetBtn.style.display = 'inline-block';
        if (editBtn) editBtn.style.display = 'none';
        
        // 显示编辑相关按钮
        const editButtons = modal.querySelectorAll('.section-actions button');
        editButtons.forEach(btn => {
            btn.style.display = 'inline-block';
        });
    }
}

// 切换编辑/查看模式
function togglePositionEdit() {
    const isReadOnly = window.currentHrPositionReadOnly;
    if (isReadOnly) {
        // 切换到编辑模式
        window.currentHrPositionReadOnly = false;
        setPositionModalReadOnly(false);
    } else {
        // 切换到查看模式
        window.currentHrPositionReadOnly = true;
        setPositionModalReadOnly(true);
    }
}

// 获取岗位数据
function getPositionData(positionId) {
    const mockData = {
        'hr1': {
            info: {
                positionName: '人力资源总监',
                jobTitle: '总监',
                level: 'M4',
                department: '人力资源部',
                deptType: '职能部门',
                deptNature: '管理部门',
                supervisor: 'CEO',
                crossSupervisor: '',
                directSubordinates: '5',
                indirectSubordinates: '25',
                promotionDirection: '高管层',
                rotationPosition: '',
                effectiveDate: '2024-01-01',
                approver: 'CEO',
                positionCode: 'HR-DIR-001',
                summary: '全面负责人力资源管理工作，制定并执行公司人力资源战略，优化人力资源管理体系，提升组织效能和员工满意度。'
            },
            purpose: '建立和完善公司人力资源管理体系，确保公司人才供给和发展，支持公司战略目标的实现。',
            duties: [
                { module: '战略规划', category: '人力资源战略', workType: '核心', detail: '制定公司人力资源战略规划，确保与公司整体战略一致' },
                { module: '组织管理', category: '组织架构', workType: '核心', detail: '设计和优化组织架构，提升组织效率' },
                { module: '人才管理', category: '人才招聘', workType: '重点', detail: '领导人才招聘工作，建立人才储备体系' },
                { module: '绩效管理', category: '绩效体系', workType: '核心', detail: '建立和完善绩效考核体系，推动绩效文化' },
                { module: '薪酬福利', category: '薪酬体系', workType: '重点', detail: '设计和管理薪酬福利体系，确保外部竞争力和内部公平性' }
            ],
            qualification: {
                education: '本科及以上学历，人力资源管理、工商管理等相关专业',
                training: '人力资源管理培训、领导力培训、战略规划培训',
                experience: '10年以上人力资源管理经验，5年以上管理岗位经验，具备战略思维和领导力',
                skills: '精通人力资源各模块管理，熟悉劳动法律法规，优秀的沟通协调能力和团队管理能力',
                otherRequirements: '具备良好的职业道德和保密意识，能够承受较大工作压力'
            },
            conditions: {
                workTime: '周一至周五，9:00-18:00',
                workPlace: '公司总部',
                workEnv: '办公室环境',
                risk: '低',
                occupationalHazard: '无'
            },
            metrics: [
                { dimension: '人才管理', metric: '核心人才保有率', standard: '≥95%', source: 'HR系统' },
                { dimension: '招聘效能', metric: '招聘周期', standard: '≤30天', source: '招聘系统' },
                { dimension: '绩效体系', metric: '绩效完成率', standard: '≥90%', source: '绩效系统' },
                { dimension: '员工满意度', metric: '满意度得分', standard: '≥85分', source: '调研系统' }
            ],
            documents: '负责审批人力资源相关制度文件，签发招聘计划、培训计划、薪酬调整方案等重要文件。'
        },
        'hr2': {
            info: {
                positionName: '人力资源经理',
                jobTitle: '经理',
                level: 'M2',
                department: '人力资源部',
                deptType: '职能部门',
                deptNature: '管理部门',
                supervisor: '人力资源总监',
                crossSupervisor: '',
                directSubordinates: '3',
                indirectSubordinates: '0',
                promotionDirection: '人力资源总监',
                rotationPosition: '',
                effectiveDate: '2024-06-01',
                approver: '人力资源总监',
                positionCode: 'HR-MGR-001',
                summary: '负责人力资源日常管理工作，包括招聘、培训、绩效、员工关系等模块，确保各项人力资源工作有序开展。'
            },
            purpose: '执行人力资源战略，负责日常人力资源管理事务，支持业务部门发展需求。',
            duties: [
                { module: '招聘管理', category: '招聘执行', workType: '核心', detail: '组织实施招聘工作，筛选候选人，协调面试安排' },
                { module: '培训发展', category: '培训计划', workType: '重点', detail: '制定年度培训计划，组织实施各类培训活动' },
                { module: '绩效管理', category: '绩效执行', workType: '核心', detail: '组织绩效考核工作，跟进绩效结果应用' },
                { module: '员工关系', category: '员工关怀', workType: '基础', detail: '处理员工咨询和投诉，组织员工活动' },
                { module: '人事事务', category: '日常管理', workType: '基础', detail: '办理员工入职、离职、调岗等手续' }
            ],
            qualification: {
                education: '本科及以上学历，人力资源管理、心理学等相关专业',
                training: '人力资源管理培训、劳动法培训、绩效管理培训',
                experience: '5年以上人力资源管理经验，熟悉人力资源各模块工作',
                skills: '良好的沟通能力、组织协调能力、问题解决能力',
                otherRequirements: '具备团队合作精神，工作细致认真'
            },
            conditions: {
                workTime: '周一至周五，9:00-18:00',
                workPlace: '公司总部',
                workEnv: '办公室环境',
                risk: '低',
                occupationalHazard: '无'
            },
            metrics: [
                { dimension: '招聘效率', metric: '招聘完成率', standard: '≥95%', source: '招聘系统' },
                { dimension: '培训效果', metric: '培训完成率', standard: '≥90%', source: '培训系统' },
                { dimension: '员工满意度', metric: '员工投诉处理及时率', standard: '100%', source: 'HR系统' }
            ],
            documents: '负责起草人力资源相关文件，处理员工档案管理工作。'
        },
        'hr3': {
            info: {
                positionName: '招聘专员',
                jobTitle: '专员',
                level: 'P3',
                department: '人力资源部',
                deptType: '职能部门',
                deptNature: '业务部门',
                supervisor: '人力资源经理',
                crossSupervisor: '',
                directSubordinates: '0',
                indirectSubordinates: '0',
                promotionDirection: '人力资源主管',
                rotationPosition: '培训专员',
                effectiveDate: '2025-01-01',
                approver: '人力资源经理',
                positionCode: 'HR-REC-001',
                summary: '负责公司招聘工作，发布招聘信息，筛选简历，组织面试，完成招聘任务。'
            },
            purpose: '为公司各部门提供合格的人才支持，确保招聘目标的实现。',
            duties: [
                { module: '招聘执行', category: '职位发布', workType: '核心', detail: '发布招聘信息，维护招聘渠道' },
                { module: '简历筛选', category: '候选人筛选', workType: '核心', detail: '筛选简历，进行初步面试' },
                { module: '面试协调', category: '面试安排', workType: '重点', detail: '协调面试时间，安排面试流程' },
                { module: 'offer管理', category: '录用流程', workType: '重点', detail: '发放录用通知，跟进入职' }
            ],
            qualification: {
                education: '本科及以上学历，人力资源、心理学等相关专业',
                training: '招聘技巧培训、面试技巧培训',
                experience: '2年以上招聘工作经验',
                skills: '良好的沟通能力、判断力、执行力',
                otherRequirements: '具备团队合作精神，工作积极主动'
            },
            conditions: {
                workTime: '周一至周五，9:00-18:00',
                workPlace: '公司总部',
                workEnv: '办公室环境',
                risk: '低',
                occupationalHazard: '无'
            },
            metrics: [
                { dimension: '招聘效率', metric: '简历筛选及时率', standard: '≥95%', source: '招聘系统' },
                { dimension: '招聘质量', metric: '试用期通过率', standard: '≥85%', source: 'HR系统' }
            ],
            documents: '负责招聘相关文档的整理和归档工作。'
        },
        'hr4': {
            info: {
                positionName: '培训专员',
                jobTitle: '专员',
                level: 'P3',
                department: '人力资源部',
                deptType: '职能部门',
                deptNature: '业务部门',
                supervisor: '人力资源经理',
                crossSupervisor: '',
                directSubordinates: '0',
                indirectSubordinates: '0',
                promotionDirection: '培训主管',
                rotationPosition: '招聘专员',
                effectiveDate: '2025-03-01',
                approver: '人力资源经理',
                positionCode: 'HR-TRN-001',
                summary: '负责公司培训体系建设和培训活动组织实施，提升员工能力和绩效。'
            },
            purpose: '构建完善的培训体系，为员工提供持续学习和发展的机会。',
            duties: [
                { module: '培训规划', category: '需求分析', workType: '核心', detail: '开展培训需求调研，制定培训计划' },
                { module: '培训实施', category: '课程组织', workType: '核心', detail: '组织各类培训课程，协调师资资源' },
                { module: '培训评估', category: '效果评估', workType: '重点', detail: '评估培训效果，跟踪培训转化' },
                { module: '知识管理', category: '课件开发', workType: '基础', detail: '开发和维护培训课件' }
            ],
            qualification: {
                education: '本科及以上学历，教育、人力资源等相关专业',
                training: '培训管理培训、课程设计培训',
                experience: '2年以上培训工作经验',
                skills: '良好的组织协调能力、表达能力、学习能力',
                otherRequirements: '具备创新意识，善于沟通'
            },
            conditions: {
                workTime: '周一至周五，9:00-18:00',
                workPlace: '公司总部',
                workEnv: '办公室环境',
                risk: '低',
                occupationalHazard: '无'
            },
            metrics: [
                { dimension: '培训覆盖', metric: '员工培训学时', standard: '≥40小时/人/年', source: '培训系统' },
                { dimension: '培训效果', metric: '培训满意度', standard: '≥85分', source: '调研系统' }
            ],
            documents: '负责培训相关文档的管理和归档工作。'
        },
        'hr5': {
            info: {
                positionName: '绩效专员',
                jobTitle: '专员',
                level: 'P3',
                department: '人力资源部',
                deptType: '职能部门',
                deptNature: '业务部门',
                supervisor: '人力资源经理',
                crossSupervisor: '',
                directSubordinates: '0',
                indirectSubordinates: '0',
                promotionDirection: '绩效主管',
                rotationPosition: '薪酬专员',
                effectiveDate: '2025-02-01',
                approver: '人力资源经理',
                positionCode: 'HR-PER-001',
                summary: '负责公司绩效考核体系的实施和维护，确保绩效考核工作公正、公平、公开。'
            },
            purpose: '建立科学的绩效考核体系，激励员工提升绩效，支持公司目标的实现。',
            duties: [
                { module: '绩效体系', category: '制度维护', workType: '核心', detail: '维护绩效考核制度，更新考核标准' },
                { module: '绩效执行', category: '考核组织', workType: '核心', detail: '组织绩效考核工作，收集考核数据' },
                { module: '绩效分析', category: '数据统计', workType: '重点', detail: '分析绩效考核结果，提供改进建议' },
                { module: '绩效沟通', category: '反馈跟进', workType: '重点', detail: '协助绩效面谈，跟进改进计划' }
            ],
            qualification: {
                education: '本科及以上学历，人力资源、统计学等相关专业',
                training: '绩效管理培训、数据分析培训',
                experience: '2年以上绩效管理经验',
                skills: '良好的数据分析能力、沟通能力、保密意识',
                otherRequirements: '工作细致认真，具备较强的逻辑思维'
            },
            conditions: {
                workTime: '周一至周五，9:00-18:00',
                workPlace: '公司总部',
                workEnv: '办公室环境',
                risk: '低',
                occupationalHazard: '无'
            },
            metrics: [
                { dimension: '绩效周期', metric: '考核完成及时率', standard: '100%', source: '绩效系统' },
                { dimension: '考核质量', metric: '考核申诉率', standard: '≤5%', source: 'HR系统' }
            ],
            documents: '负责绩效考核相关文档的管理和归档工作。'
        }
    };
    
    // 如果是 pos_ 开头的ID，返回默认模板
    if (positionId.startsWith('pos_')) {
        return {
            info: {
                positionName: '岗位名称',
                jobTitle: '职位',
                level: 'P5',
                department: '所属部门',
                deptType: '职能部门',
                deptNature: '业务部门',
                supervisor: '直属上级',
                crossSupervisor: '',
                directSubordinates: '0',
                indirectSubordinates: '0',
                promotionDirection: '',
                rotationPosition: '',
                effectiveDate: new Date().toISOString().split('T')[0],
                approver: '审批人',
                positionCode: 'POS-001',
                summary: '请填写该岗位的工作概述。'
            },
            purpose: '请填写该岗位的设置目的。',
            duties: [
                { module: '模块名称', category: '分类', workType: '核心', detail: '请填写职责描述' }
            ],
            qualification: {
                education: '请填写学历要求',
                training: '请填写培训要求',
                experience: '请填写工作经验要求',
                skills: '请填写技能要求',
                otherRequirements: '请填写其他要求'
            },
            conditions: {
                workTime: '周一至周五，9:00-18:00',
                workPlace: '公司总部',
                workEnv: '办公室环境',
                risk: '低',
                occupationalHazard: '无'
            },
            metrics: [
                { dimension: '考核维度', metric: '考核指标', standard: '量化标准', source: '数据来源' }
            ],
            documents: '请填写台账/文件签发与主持信息。'
        };
    }
    
    return mockData[positionId] || mockData['hr1'];
}

// 从服务器/本地加载岗位数据
async function loadHrPositionDesc() {
    const positionId = window.currentHrPositionId;
    let data = null;
    
    try {
        const res = await fetch(`/api/hr/position/${positionId}`);
        if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
                data = result.data;
            }
        }
    } catch (e) {
        console.log('API unavailable, using local storage or mock data');
    }
    
    if (!data) {
        const localData = localStorage.getItem('hrPositions');
        if (localData) {
            try {
                const positions = JSON.parse(localData);
                data = positions[positionId];
            } catch (e) {
                console.error('Failed to parse local data:', e);
            }
        }
    }
    
    if (!data) {
        data = getPositionData(positionId);
    }
    
    applyPositionData(data);
}

// 应用数据到弹窗表单
function applyPositionData(data) {
    // 更新标题
    const title = `📋 ${data.info.positionName || '岗位'}职责说明书`;
    document.getElementById('hrPositionModalTitle').textContent = title;
    
    // 基本信息
    const info = data.info || {};
    document.getElementById('hrPositionName').value = info.positionName || '';
    document.getElementById('hrJobTitle').value = info.jobTitle || '';
    document.getElementById('hrLevel').value = info.level || '';
    document.getElementById('hrDepartment').value = info.department || '';
    document.getElementById('hrDeptType').value = info.deptType || '';
    document.getElementById('hrDeptNature').value = info.deptNature || '';
    document.getElementById('hrSupervisor').value = info.supervisor || '';
    document.getElementById('hrCrossSupervisor').value = info.crossSupervisor || '';
    document.getElementById('hrDirectSubordinates').value = info.directSubordinates || '';
    document.getElementById('hrIndirectSubordinates').value = info.indirectSubordinates || '';
    document.getElementById('hrPromotionDirection').value = info.promotionDirection || '';
    document.getElementById('hrRotationPosition').value = info.rotationPosition || '';
    document.getElementById('hrEffectiveDate').value = info.effectiveDate || '';
    document.getElementById('hrApprover').value = info.approver || '';
    document.getElementById('hrPositionCode').value = info.positionCode || '';
    document.getElementById('hrSummary').value = info.summary || '';
    
    // 岗位设置目的
    document.getElementById('hrPurpose').value = data.purpose || '';
    
    // 职责表格
    renderDutyTable(data.duties || []);
    
    // 任职资格
    const qualification = data.qualification || {};
    document.getElementById('hrEducation').value = qualification.education || '';
    document.getElementById('hrTraining').value = qualification.training || '';
    document.getElementById('hrExperience').value = qualification.experience || '';
    document.getElementById('hrSkills').value = qualification.skills || '';
    document.getElementById('hrOtherRequirements').value = qualification.otherRequirements || '';
    
    // 工作条件
    const conditions = data.conditions || {};
    document.getElementById('hrWorkTime').value = conditions.workTime || '';
    document.getElementById('hrWorkPlace').value = conditions.workPlace || '';
    document.getElementById('hrWorkEnv').value = conditions.workEnv || '';
    document.getElementById('hrRisk').value = conditions.risk || '';
    document.getElementById('hrOccupationalHazard').value = conditions.occupationalHazard || '';
    
    // 考核指标
    renderMetricTable(data.metrics || []);
    
    // 台账文件
    document.getElementById('hrDocuments').value = data.documents || '';
}

// 渲染职责表格
function renderDutyTable(duties) {
    const tbody = document.getElementById('hrDutyTableBody');
    tbody.innerHTML = duties.map((duty, index) => `
        <tr>
            <td><input type="checkbox" class="hr-duty-checkbox"></td>
            <td><textarea>${escapeHtml(duty.module || '')}</textarea></td>
            <td><textarea>${escapeHtml(duty.category || '')}</textarea></td>
            <td>
                <select>
                    <option value="核心" ${duty.workType === '核心' ? 'selected' : ''}>核心</option>
                    <option value="重点" ${duty.workType === '重点' ? 'selected' : ''}>重点</option>
                    <option value="基础" ${duty.workType === '基础' ? 'selected' : ''}>基础</option>
                </select>
            </td>
            <td><textarea>${escapeHtml(duty.detail || '')}</textarea></td>
        </tr>
    `).join('');
}

// 渲染考核指标表格
function renderMetricTable(metrics) {
    const tbody = document.getElementById('hrMetricTableBody');
    tbody.innerHTML = metrics.map((metric, index) => `
        <tr>
            <td><input type="checkbox" class="hr-metric-checkbox"></td>
            <td><textarea>${escapeHtml(metric.dimension || '')}</textarea></td>
            <td><textarea>${escapeHtml(metric.metric || '')}</textarea></td>
            <td><textarea>${escapeHtml(metric.standard || '')}</textarea></td>
            <td><textarea>${escapeHtml(metric.source || '')}</textarea></td>
        </tr>
    `).join('');
}

// 添加职责行
function addHrDutyRow() {
    const tbody = document.getElementById('hrDutyTableBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="checkbox" class="hr-duty-checkbox"></td>
        <td><textarea placeholder="职责模块"></textarea></td>
        <td><textarea placeholder="职责分类"></textarea></td>
        <td>
            <select>
                <option value="核心">核心</option>
                <option value="重点">重点</option>
                <option value="基础">基础</option>
            </select>
        </td>
        <td><textarea placeholder="职责细则"></textarea></td>
    `;
    tbody.appendChild(newRow);
}

// 删除选中的职责行
function deleteSelectedHrDuties() {
    const checkboxes = document.querySelectorAll('.hr-duty-checkbox:checked');
    checkboxes.forEach(checkbox => {
        checkbox.closest('tr').remove();
    });
}

// 全选/取消全选职责复选框
function toggleSelectAllHrDuties() {
    const headerCheckbox = event.target;
    const checkboxes = document.querySelectorAll('.hr-duty-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = headerCheckbox.checked;
    });
}

// 添加考核指标行
function addHrMetricRow() {
    const tbody = document.getElementById('hrMetricTableBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="checkbox" class="hr-metric-checkbox"></td>
        <td><textarea placeholder="考核维度"></textarea></td>
        <td><textarea placeholder="核心指标"></textarea></td>
        <td><textarea placeholder="量化标准"></textarea></td>
        <td><textarea placeholder="数据来源"></textarea></td>
    `;
    tbody.appendChild(newRow);
}

// 删除选中的考核指标行
function deleteSelectedHrMetrics() {
    const checkboxes = document.querySelectorAll('.hr-metric-checkbox:checked');
    checkboxes.forEach(checkbox => {
        checkbox.closest('tr').remove();
    });
}

// 全选/取消全选考核指标复选框
function toggleSelectAllHrMetrics() {
    const headerCheckbox = event.target;
    const checkboxes = document.querySelectorAll('.hr-metric-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = headerCheckbox.checked;
    });
}

// CSV导入职责
function importHrDutyFromCSV() {
    document.getElementById('hrDutyFileInput').click();
}

// CSV导入考核指标
function importHrMetricFromCSV() {
    document.getElementById('hrMetricFileInput').click();
}

// 保存岗位说明书
async function saveHrPositionDesc() {
    const positionData = collectPositionData();
    
    try {
        const res = await fetch('/api/hr/position/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                positionId: window.currentHrPositionId,
                data: positionData
            })
        });
        
        if (res.ok) {
            const result = await res.json();
            if (result.success) {
                saveToLocalStorage(positionData);
                showToast('✅ 保存成功');
                window.currentHrPositionReadOnly = true;
                setPositionModalReadOnly(true);
            } else {
                showToast('❌ 保存失败');
            }
        } else {
            throw new Error('Network error');
        }
    } catch (e) {
        // 即使没有后端，也保存到本地并显示成功
        saveToLocalStorage(positionData);
        showToast('✅ 保存成功（本地）');
        window.currentHrPositionReadOnly = true;
        setPositionModalReadOnly(true);
    }
}

// 收集表单数据
function collectPositionData() {
    // 收集职责数据
    const dutyRows = document.querySelectorAll('#hrDutyTableBody tr');
    const duties = Array.from(dutyRows).map(row => ({
        module: row.querySelector('td:nth-child(2) textarea').value,
        category: row.querySelector('td:nth-child(3) textarea').value,
        workType: row.querySelector('td:nth-child(4) select').value,
        detail: row.querySelector('td:nth-child(5) textarea').value
    }));
    
    // 收集考核指标数据
    const metricRows = document.querySelectorAll('#hrMetricTableBody tr');
    const metrics = Array.from(metricRows).map(row => ({
        dimension: row.querySelector('td:nth-child(2) textarea').value,
        metric: row.querySelector('td:nth-child(3) textarea').value,
        standard: row.querySelector('td:nth-child(4) textarea').value,
        source: row.querySelector('td:nth-child(5) textarea').value
    }));
    
    return {
        info: {
            positionName: document.getElementById('hrPositionName').value,
            jobTitle: document.getElementById('hrJobTitle').value,
            level: document.getElementById('hrLevel').value,
            department: document.getElementById('hrDepartment').value,
            deptType: document.getElementById('hrDeptType').value,
            deptNature: document.getElementById('hrDeptNature').value,
            supervisor: document.getElementById('hrSupervisor').value,
            crossSupervisor: document.getElementById('hrCrossSupervisor').value,
            directSubordinates: document.getElementById('hrDirectSubordinates').value,
            indirectSubordinates: document.getElementById('hrIndirectSubordinates').value,
            promotionDirection: document.getElementById('hrPromotionDirection').value,
            rotationPosition: document.getElementById('hrRotationPosition').value,
            effectiveDate: document.getElementById('hrEffectiveDate').value,
            approver: document.getElementById('hrApprover').value,
            positionCode: document.getElementById('hrPositionCode').value,
            summary: document.getElementById('hrSummary').value
        },
        purpose: document.getElementById('hrPurpose').value,
        duties: duties,
        qualification: {
            education: document.getElementById('hrEducation').value,
            training: document.getElementById('hrTraining').value,
            experience: document.getElementById('hrExperience').value,
            skills: document.getElementById('hrSkills').value,
            otherRequirements: document.getElementById('hrOtherRequirements').value
        },
        conditions: {
            workTime: document.getElementById('hrWorkTime').value,
            workPlace: document.getElementById('hrWorkPlace').value,
            workEnv: document.getElementById('hrWorkEnv').value,
            risk: document.getElementById('hrRisk').value,
            occupationalHazard: document.getElementById('hrOccupationalHazard').value
        },
        metrics: metrics,
        documents: document.getElementById('hrDocuments').value
    };
}

// 保存到localStorage
function saveToLocalStorage(positionData) {
    try {
        const existing = localStorage.getItem('hrPositions');
        const positions = existing ? JSON.parse(existing) : {};
        positions[window.currentHrPositionId] = positionData;
        localStorage.setItem('hrPositions', JSON.stringify(positions));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

// 导出PDF
async function exportPositionToPDF() {
    const data = collectPositionData();
    
    const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${data.info.positionName} - 岗位说明书</title>
            <style>
                body { font-family: 'Microsoft YaHei', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { text-align: center; color: #1a3a5c; border-bottom: 2px solid #1a4a6f; padding-bottom: 10px; }
                h2 { color: #1a4a6f; margin-top: 24px; }
                h3 { color: #2d5a7b; margin-top: 16px; }
                .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 16px 0; }
                .info-item { padding: 8px; background: #f8fafc; border-radius: 4px; }
                .info-label { font-weight: 500; color: #475569; }
                .info-value { margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; }
                th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
                th { background: #eef4fa; color: #1f5e7e; font-weight: 600; }
                textarea { border: none; width: 100%; min-height: 80px; resize: none; }
                .section { margin: 16px 0; padding: 16px; background: #fafafa; border-radius: 8px; }
                .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
                .summary-card { background: linear-gradient(135deg, #1a4a6f, #0b2b3b); padding: 12px; border-radius: 8px; color: white; text-align: center; }
                .summary-value { font-size: 20px; font-weight: 700; }
                .summary-label { font-size: 11px; opacity: 0.9; }
            </style>
        </head>
        <body>
            <h1>📋 ${data.info.positionName} 职责说明书</h1>
            
            <h2>一、基本信息</h2>
            <div class="info-grid">
                <div class="info-item"><div class="info-label">职务名称</div><div class="info-value">${escapeHtml(data.info.jobTitle)}</div></div>
                <div class="info-item"><div class="info-label">职级范围</div><div class="info-value">${escapeHtml(data.info.level)}</div></div>
                <div class="info-item"><div class="info-label">所属部门</div><div class="info-value">${escapeHtml(data.info.department)}</div></div>
                <div class="info-item"><div class="info-label">部门类型</div><div class="info-value">${escapeHtml(data.info.deptType)}</div></div>
                <div class="info-item"><div class="info-label">部门性质</div><div class="info-value">${escapeHtml(data.info.deptNature)}</div></div>
                <div class="info-item"><div class="info-label">直属主管</div><div class="info-value">${escapeHtml(data.info.supervisor)}</div></div>
                <div class="info-item"><div class="info-label">直接下属</div><div class="info-value">${escapeHtml(data.info.directSubordinates)}</div></div>
                <div class="info-item"><div class="info-label">间接下属</div><div class="info-value">${escapeHtml(data.info.indirectSubordinates)}</div></div>
                <div class="info-item"><div class="info-label">晋升方向</div><div class="info-value">${escapeHtml(data.info.promotionDirection)}</div></div>
                <div class="info-item"><div class="info-label">生效日期</div><div class="info-value">${escapeHtml(data.info.effectiveDate)}</div></div>
                <div class="info-item"><div class="info-label">审批人</div><div class="info-value">${escapeHtml(data.info.approver)}</div></div>
                <div class="info-item"><div class="info-label">职位代码</div><div class="info-value">${escapeHtml(data.info.positionCode)}</div></div>
            </div>
            
            <h2>二、职位概述</h2>
            <div style="padding: 12px; background: #f8fafc; border-radius: 4px;">${escapeHtml(data.info.summary)}</div>
            
            <h2>三、岗位设置目的</h2>
            <div style="padding: 12px; background: #f8fafc; border-radius: 4px;">${escapeHtml(data.purpose)}</div>
            
            <h2>四、主要岗位职责</h2>
            <table>
                <tr><th>职责模块</th><th>职责分类</th><th>工作分类</th><th>职责细则</th></tr>
                ${data.duties.map(d => `<tr><td>${escapeHtml(d.module)}</td><td>${escapeHtml(d.category)}</td><td>${escapeHtml(d.workType)}</td><td>${escapeHtml(d.detail)}</td></tr>`).join('')}
            </table>
            
            <h2>五、任职资格</h2>
            <div class="section">
                <h3>教育背景</h3>
                <div>${escapeHtml(data.qualification.education)}</div>
                <h3>培训经历</h3>
                <div>${escapeHtml(data.qualification.training)}</div>
                <h3>工作经验</h3>
                <div>${escapeHtml(data.qualification.experience)}</div>
                <h3>技能要求</h3>
                <div>${escapeHtml(data.qualification.skills)}</div>
                <h3>其他要求</h3>
                <div>${escapeHtml(data.qualification.otherRequirements)}</div>
            </div>
            
            <h2>六、工作条件</h2>
            <div class="info-grid">
                <div class="info-item"><div class="info-label">工作时间</div><div class="info-value">${escapeHtml(data.conditions.workTime)}</div></div>
                <div class="info-item"><div class="info-label">工作场所</div><div class="info-value">${escapeHtml(data.conditions.workPlace)}</div></div>
                <div class="info-item"><div class="info-label">工作环境</div><div class="info-value">${escapeHtml(data.conditions.workEnv)}</div></div>
                <div class="info-item"><div class="info-label">危险性</div><div class="info-value">${escapeHtml(data.conditions.risk)}</div></div>
                <div class="info-item"><div class="info-label">职业病危害因素</div><div class="info-value">${escapeHtml(data.conditions.occupationalHazard)}</div></div>
            </div>
            
            <h2>七、考核指标</h2>
            <table>
                <tr><th>考核维度</th><th>核心指标</th><th>量化标准</th><th>数据来源</th></tr>
                ${data.metrics.map(m => `<tr><td>${escapeHtml(m.dimension)}</td><td>${escapeHtml(m.metric)}</td><td>${escapeHtml(m.standard)}</td><td>${escapeHtml(m.source)}</td></tr>`).join('')}
            </table>
            
            <h2>八、台账/文件签发与主持</h2>
            <div style="padding: 12px; background: #f8fafc; border-radius: 4px;">${escapeHtml(data.documents)}</div>
        </body>
        </html>
    `;
    
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url);
    
    setTimeout(() => {
        win.print();
        URL.revokeObjectURL(url);
    }, 500);
}

// 辅助函数：HTML转义
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toast提示
function showToast(message) {
    if (window.Toast && window.Toast.info) {
        window.Toast.info(message);
    } else if (window.Utils && window.Utils.Toast) {
        window.Utils.Toast.info(message);
    } else {
        alert(message);
    }
}

// 获取岗位ID（根据岗位名称）
function getPositionIdByName(positionName) {
    const nameMap = {
        '人力资源总监': 'hr1',
        '人力资源经理': 'hr2',
        '招聘专员': 'hr3',
        '培训专员': 'hr4',
        '绩效专员': 'hr5'
    };
    return nameMap[positionName] || 'hr1';
}

// 导出到全局
window.openPositionModal = openPositionModal;
window.openReadOnlyPositionModal = openReadOnlyPositionModal;
window.closePositionModal = closePositionModal;
window.setPositionModalReadOnly = setPositionModalReadOnly;
window.togglePositionEdit = togglePositionEdit;
window.loadHrPositionDesc = loadHrPositionDesc;
window.saveHrPositionDesc = saveHrPositionDesc;
window.addHrDutyRow = addHrDutyRow;
window.deleteSelectedHrDuties = deleteSelectedHrDuties;
window.toggleSelectAllHrDuties = toggleSelectAllHrDuties;
window.addHrMetricRow = addHrMetricRow;
window.deleteSelectedHrMetrics = deleteSelectedHrMetrics;
window.toggleSelectAllHrMetrics = toggleSelectAllHrMetrics;
window.importHrDutyFromCSV = importHrDutyFromCSV;
window.importHrMetricFromCSV = importHrMetricFromCSV;
window.exportPositionToPDF = exportPositionToPDF;
window.getPositionIdByName = getPositionIdByName;