// 岗位说明书弹窗功能
window.currentHrPositionId = null;
window.currentHrPositionReadOnly = false;

// 打开编辑模式弹窗
function openPositionModal(positionId) {
    window.currentHrPositionId = positionId;
    window.currentHrPositionReadOnly = false;
    loadHrPositionDesc();
    setPositionModalReadOnly(false);
    
    if (window.ModalManager) {
        window.ModalManager.open('hrPositionModal');
    } else {
        const modal = document.getElementById('hrPositionModal');
        modal.classList.add('show');
    }
}

// 打开只读查看弹窗
function openReadOnlyPositionModal(positionId) {
    window.currentHrPositionId = positionId;
    window.currentHrPositionReadOnly = true;
    loadHrPositionDesc();
    setPositionModalReadOnly(true);
    
    if (window.ModalManager) {
        window.ModalManager.open('hrPositionModal');
    } else {
        const modal = document.getElementById('hrPositionModal');
        modal.classList.add('show');
    }
}

// 关闭岗位说明书弹窗
function closePositionModal() {
    if (window.ModalManager) {
        window.ModalManager.close('hrPositionModal');
    } else {
        const modal = document.getElementById('hrPositionModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
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

// 从服务器加载岗位数据
async function loadHrPositionDesc() {
    const positionId = window.currentHrPositionId;
    console.log('📋 加载岗位说明书，岗位ID:', positionId);
    
    // 1. 优先通过 position_id 直接查找岗位说明书
    try {
        const res = await fetch(`/api/position-description/by-position/${positionId}`);
        if (res.ok) {
            const result = await res.json();
            if (result.code === 200 && result.data) {
                console.log('✅ 通过 position_id 找到岗位说明书:', result.data);
                applyPositionDataFromAPI(result.data);
                return;
            }
        }
    } catch (e) {
        console.warn('⚠️ 通过 position_id 查找失败，尝试其他方式:', e);
    }
    
    // 2. 从列表中查找匹配 position_id 的岗位说明书
    let foundDesc = null;
    try {
        const listRes = await fetch('/api/position-description/list');
        if (listRes.ok) {
            const listResult = await listRes.json();
            if (listResult.code === 200 && listResult.data && listResult.data.length > 0) {
                console.log('📋 岗位说明书列表:', listResult.data);
                
                // 优先找 position_id 匹配的
                foundDesc = listResult.data.find(d => d.position_id == positionId);
                if (foundDesc) {
                    console.log('✅ 找到匹配 position_id 的岗位说明书:', foundDesc);
                }
                
                // 如果没找到 position_id 匹配的，尝试找 id 匹配的
                if (!foundDesc) {
                    foundDesc = listResult.data.find(d => d.id == positionId);
                    if (foundDesc) {
                        console.log('✅ 找到匹配 id 的岗位说明书:', foundDesc);
                    }
                }
                
                // 如果还是没找到，使用第一个
                if (!foundDesc) {
                    foundDesc = listResult.data[0];
                    console.log('⚠️ 未找到匹配的岗位说明书，使用第一个:', foundDesc);
                }
                
                if (foundDesc) {
                    // 加载完整详情
                    try {
                        const res = await fetch(`/api/position-description/${foundDesc.id}`);
                        if (res.ok) {
                            const result = await res.json();
                            if (result.code === 200 && result.data) {
                                console.log('✅ 加载岗位说明书详情成功:', result.data);
                                applyPositionDataFromAPI(result.data);
                                return;
                            }
                        }
                    } catch (e) {
                        console.error('Failed to load position description detail:', e);
                    }
                    
                    // 如果加载详情失败，使用列表中的基本信息
                    applyPositionDataFromAPI({
                        ...foundDesc,
                        duties: [],
                        qualification: null,
                        metrics: []
                    });
                    return;
                }
            }
        }
    } catch (e) {
        console.error('Failed to load position description list:', e);
    }
    
    // 3. 如果列表方式失败，尝试直接用ID加载
    try {
        const res = await fetch(`/api/position-description/${positionId}`);
        if (res.ok) {
            const result = await res.json();
            if (result.code === 200 && result.data) {
                applyPositionDataFromAPI(result.data);
                return;
            }
        }
    } catch (e) {
        console.error('Failed to load position description detail:', e);
    }
    
    // 4. 如果全部失败，使用默认空模板
    console.warn('❌ 加载岗位说明书失败，使用默认模板');
    applyPositionDataFromAPI(getDefaultPositionTemplate());
}

// 获取默认岗位模板
function getDefaultPositionTemplate() {
    // 先尝试从全局获取员工相关数据
    let employeeData = window.currentEmployeeData;
    let template = {
        id: 0,
        position_id: null,
        position_code: '',
        position_name: '',
        job_title: '',
        level: '',
        department: '',
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
        headcount: 1,
        summary: '',
        purpose: '',
        work_time: '周一至周五，9:00-18:00',
        work_place: '公司总部',
        work_env: '办公室环境',
        risk_level: '低',
        occupational_hazard: '',
        documents: '',
        duties: [],
        qualification: null,
        metrics: []
    };
    
    // 如果有员工数据，用它来填充模板
    if (employeeData) {
        const { employee, department, position } = employeeData;
        
        if (position) {
            template.position_id = position.id;
            template.position_name = position.name || position.position_name || '';
            template.job_title = position.name || position.position_name || '';
            template.level = position.level || '';
            template.position_code = position.code || '';
        }
        
        if (department) {
            template.department = department.name || department.dept_name || '';
        }
        
        console.log('📋 使用员工数据填充的默认模板:', template);
    }
    
    return template;
}

// 应用从API获取的数据到表单
async function applyPositionDataFromAPI(data) {
    // 先尝试从全局获取员工相关数据，如果有的话
    let employeeData = window.currentEmployeeData;
    console.log('📋 applyPositionDataFromAPI - 接收到的数据:', data);
    console.log('👤 applyPositionDataFromAPI - 当前员工数据:', employeeData);
    
    // 如果有员工数据，用它来补充岗位说明书信息
    if (employeeData) {
        const { employee, department, position } = employeeData;
        
        // 如果岗位说明书没有岗位名称，使用员工的岗位名称
        if (!data.position_name && position) {
            data.position_name = position.name || position.position_name;
        }
        // 如果岗位说明书没有部门，使用员工的部门名称
        if (!data.department && department) {
            data.department = department.name || department.dept_name;
        }
        // 如果岗位说明书没有position_id，使用员工的岗位ID
        if (!data.position_id && position) {
            data.position_id = position.id;
        }
        // 如果岗位说明书没有职级，使用岗位的职级
        if (!data.level && position) {
            data.level = position.level || '';
        }
        console.log('✅ 使用员工数据补充后的岗位说明书:', data);
    }
    
    // 更新标题
    const title = `📋 ${data.position_name || '岗位'}职责说明书`;
    document.getElementById('hrPositionModalTitle').textContent = title;
    
    // 更新统计卡片
    document.getElementById('statPositionName').textContent = data.position_name || '-';
    document.getElementById('statDepartment').textContent = data.department || '-';
    document.getElementById('statLevel').textContent = data.level || '-';
    document.getElementById('statHeadcount').textContent = data.headcount || 0;
    
    // 从API获取在职人数和空缺人数
    try {
        const positionIdForQuery = data.position_id || (employeeData && employeeData.position && employeeData.position.id) || '';
        const res = await fetch('/api/employees?position=' + positionIdForQuery);
        if (res.ok) {
            const result = await res.json();
            if (result.code === 200) {
                const onboardCount = result.data.filter(emp => emp.status === 1).length;
                const headcount = data.headcount || 0;
                const vacancyCount = Math.max(0, headcount - onboardCount);
                
                document.getElementById('statOnboard').textContent = onboardCount;
                document.getElementById('statVacancy').textContent = vacancyCount;
            }
        }
    } catch (e) {
        console.error('Failed to get employee count:', e);
        document.getElementById('statOnboard').textContent = '-';
        document.getElementById('statVacancy').textContent = '-';
    }
    
    // 基本信息
    document.getElementById('hrPositionName').value = data.position_name || '';
    document.getElementById('hrJobTitle').value = data.job_title || '';
    document.getElementById('hrLevel').value = data.level || '';
    document.getElementById('hrDepartment').value = data.department || '';
    document.getElementById('hrDeptType').value = data.dept_type || '';
    document.getElementById('hrDeptNature').value = data.dept_nature || '';
    document.getElementById('hrSupervisor').value = data.supervisor || '';
    document.getElementById('hrCrossSupervisor').value = data.cross_supervisor || '';
    document.getElementById('hrDirectSubordinates').value = data.direct_subordinates || 0;
    document.getElementById('hrIndirectSubordinates').value = data.indirect_subordinates || 0;
    document.getElementById('hrPromotionDirection').value = data.promotion_direction || '';
    document.getElementById('hrRotationPosition').value = data.rotation_position || '';
    document.getElementById('hrEffectiveDate').value = data.effective_date || '';
    document.getElementById('hrApprover').value = data.approver || '';
    document.getElementById('hrPositionCode').value = data.position_code || '';
    document.getElementById('hrHeadcount').value = data.headcount || 0;
    document.getElementById('hrSummary').value = data.summary || '';
    
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
    document.getElementById('hrWorkTime').value = data.work_time || '';
    document.getElementById('hrWorkPlace').value = data.work_place || '';
    document.getElementById('hrWorkEnv').value = data.work_env || '';
    document.getElementById('hrRisk').value = data.risk_level || '';
    document.getElementById('hrOccupationalHazard').value = data.occupational_hazard || '';
    
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
    
    // 如果没有数据，添加一行空行
    if (duties.length === 0) {
        addHrDutyRow();
    }
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
    
    // 如果没有数据，添加一行空行
    if (metrics.length === 0) {
        addHrMetricRow();
    }
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
    try {
        const positionData = collectPositionData();
        
        if (!positionData) {
            showToast('❌ 数据收集失败');
            return;
        }
        
        const positionId = window.currentHrPositionId;
        
        try {
            let res;
            if (positionId && !positionId.startsWith('pos_') && !positionId.startsWith('hr')) {
                // 更新已有岗位
                res = await fetch(`/api/position-description/${positionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(positionData)
                });
            } else {
                // 创建新岗位
                res = await fetch('/api/position-description', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(positionData)
                });
            }
            
            if (res.ok) {
                const result = await res.json();
                if (result.code === 200) {
                    showToast('✅ 保存成功');
                    window.currentHrPositionReadOnly = true;
                    setPositionModalReadOnly(true);
                    if (window.refreshPositionList) {
                        window.refreshPositionList();
                    }
                } else {
                    showToast('❌ 保存失败：' + (result.message || '未知错误'));
                }
            } else {
                throw new Error('Network error');
            }
        } catch (e) {
            console.error('Failed to save to API:', e);
            showToast('❌ 保存失败，请检查网络连接');
        }
    } catch (e) {
        console.error('saveHrPositionDesc error:', e);
        showToast('❌ 保存异常');
    }
}

// 收集表单数据
function collectPositionData() {
    try {
        // 收集职责数据
        const dutyRows = document.querySelectorAll('#hrDutyTableBody tr');
        const duties = Array.from(dutyRows).map(row => {
            const moduleEl = row.querySelector('td:nth-child(2) textarea');
            const categoryEl = row.querySelector('td:nth-child(3) textarea');
            const workTypeEl = row.querySelector('td:nth-child(4) select');
            const detailEl = row.querySelector('td:nth-child(5) textarea');
            return {
                module: moduleEl ? moduleEl.value : '',
                category: categoryEl ? categoryEl.value : '',
                workType: workTypeEl ? workTypeEl.value : '核心',
                detail: detailEl ? detailEl.value : ''
            };
        });
        
        // 收集考核指标数据
        const metricRows = document.querySelectorAll('#hrMetricTableBody tr');
        const metrics = Array.from(metricRows).map(row => {
            const dimensionEl = row.querySelector('td:nth-child(2) textarea');
            const metricEl = row.querySelector('td:nth-child(3) textarea');
            const standardEl = row.querySelector('td:nth-child(4) textarea');
            const sourceEl = row.querySelector('td:nth-child(5) textarea');
            return {
                dimension: dimensionEl ? dimensionEl.value : '',
                metric: metricEl ? metricEl.value : '',
                standard: standardEl ? standardEl.value : '',
                source: sourceEl ? sourceEl.value : ''
            };
        });
        
        // 安全获取表单值
        const getValue = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : '';
        };
        
        return {
            position_name: getValue('hrPositionName'),
            job_title: getValue('hrJobTitle'),
            level: getValue('hrLevel'),
            department: getValue('hrDepartment'),
            dept_type: getValue('hrDeptType'),
            dept_nature: getValue('hrDeptNature'),
            supervisor: getValue('hrSupervisor'),
            cross_supervisor: getValue('hrCrossSupervisor'),
            direct_subordinates: parseInt(getValue('hrDirectSubordinates')) || 0,
            indirect_subordinates: parseInt(getValue('hrIndirectSubordinates')) || 0,
            promotion_direction: getValue('hrPromotionDirection'),
            rotation_position: getValue('hrRotationPosition'),
            effective_date: getValue('hrEffectiveDate'),
            approver: getValue('hrApprover'),
            position_code: getValue('hrPositionCode'),
            headcount: parseInt(getValue('hrHeadcount')) || 0,
            summary: getValue('hrSummary'),
            purpose: getValue('hrPurpose'),
            work_time: getValue('hrWorkTime'),
            work_place: getValue('hrWorkPlace'),
            work_env: getValue('hrWorkEnv'),
            risk_level: getValue('hrRisk'),
            occupational_hazard: getValue('hrOccupationalHazard'),
            documents: getValue('hrDocuments'),
            duties: duties,
            qualification: {
                education: getValue('hrEducation'),
                training: getValue('hrTraining'),
                experience: getValue('hrExperience'),
                skills: getValue('hrSkills'),
                otherRequirements: getValue('hrOtherRequirements')
            },
            metrics: metrics
        };
    } catch (e) {
        console.error('collectPositionData error:', e);
        return null;
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
            <title>${data.position_name} - 岗位说明书</title>
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
            <h1>📋 ${data.position_name} 职责说明书</h1>
            
            <h2>一、基本信息</h2>
            <div class="info-grid">
                <div class="info-item"><div class="info-label">职务名称</div><div class="info-value">${escapeHtml(data.job_title)}</div></div>
                <div class="info-item"><div class="info-label">职级范围</div><div class="info-value">${escapeHtml(data.level)}</div></div>
                <div class="info-item"><div class="info-label">所属部门</div><div class="info-value">${escapeHtml(data.department)}</div></div>
                <div class="info-item"><div class="info-label">部门类型</div><div class="info-value">${escapeHtml(data.dept_type)}</div></div>
                <div class="info-item"><div class="info-label">部门性质</div><div class="info-value">${escapeHtml(data.dept_nature)}</div></div>
                <div class="info-item"><div class="info-label">直属主管</div><div class="info-value">${escapeHtml(data.supervisor)}</div></div>
                <div class="info-item"><div class="info-label">直接下属</div><div class="info-value">${escapeHtml(data.direct_subordinates)}</div></div>
                <div class="info-item"><div class="info-label">间接下属</div><div class="info-value">${escapeHtml(data.indirect_subordinates)}</div></div>
                <div class="info-item"><div class="info-label">晋升方向</div><div class="info-value">${escapeHtml(data.promotion_direction)}</div></div>
                <div class="info-item"><div class="info-label">生效日期</div><div class="info-value">${escapeHtml(data.effective_date)}</div></div>
                <div class="info-item"><div class="info-label">审批人</div><div class="info-value">${escapeHtml(data.approver)}</div></div>
                <div class="info-item"><div class="info-label">职位代码</div><div class="info-value">${escapeHtml(data.position_code)}</div></div>
            </div>
            
            <h2>二、职位概述</h2>
            <div style="padding: 12px; background: #f8fafc; border-radius: 4px;">${escapeHtml(data.summary)}</div>
            
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
                <div class="info-item"><div class="info-label">工作时间</div><div class="info-value">${escapeHtml(data.work_time)}</div></div>
                <div class="info-item"><div class="info-label">工作场所</div><div class="info-value">${escapeHtml(data.work_place)}</div></div>
                <div class="info-item"><div class="info-label">工作环境</div><div class="info-value">${escapeHtml(data.work_env)}</div></div>
                <div class="info-item"><div class="info-label">危险性</div><div class="info-value">${escapeHtml(data.risk_level)}</div></div>
                <div class="info-item"><div class="info-label">职业病危害因素</div><div class="info-value">${escapeHtml(data.occupational_hazard)}</div></div>
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
async function getPositionIdByName(positionName) {
    try {
        // 从API获取岗位说明书列表
        const res = await fetch('/api/position-description/list');
        if (res.ok) {
            const result = await res.json();
            if (result.code === 200 && result.data) {
                // 根据岗位名称查找
                const position = result.data.find(p => 
                    p.position_name === positionName || 
                    p.job_title === positionName
                );
                if (position) {
                    return position.id.toString();
                }
            }
        }
    } catch (e) {
        console.error('Failed to get position ID from API:', e);
    }
    
    // 默认返回第一个岗位的ID（如果没找到）
    return '1';
}

// 导出到全局
window.openPositionModal = openPositionModal;
window.openReadOnlyPositionModal = openReadOnlyPositionModal;
window.closePositionModal = closePositionModal;
window.setPositionModalReadOnly = setPositionModalReadOnly;
window.togglePositionEdit = togglePositionEdit;
window.loadHrPositionDesc = loadHrPositionDesc;
window.applyPositionDataFromAPI = applyPositionDataFromAPI;
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
