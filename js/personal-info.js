import API from './api.js';
import { Toast } from './utils.js';

// 打开个人信息弹窗
async function openPersonalInfoModal() {
    try {
        // 先获取当前用户信息
        const userRes = await API.getCurrentUser();
        if (userRes.code !== 200) {
            Toast.error('获取用户信息失败');
            return;
        }
        
        const user = userRes.data;
        
        // 获取用户姓名
        const userName = user.name || user.real_name || user.username;
        if (!userName) {
            Toast.error('无法获取用户姓名');
            return;
        }
        
        // 按姓名查找员工信息
        const empRes = await API.getEmployeeByName(userName);
        if (empRes.code === 200) {
            loadPersonalInfoToModal(empRes.data);
            document.getElementById('personalInfoModal').classList.add('show');
        } else {
            Toast.error(`未找到姓名为「${userName}」的员工信息`);
            return;
        }
    } catch (error) {
        console.error('加载个人信息失败:', error);
        Toast.error('加载个人信息失败');
        return;
    }
    
    document.getElementById('personalInfoModal').classList.add('show');
}

// 将数据加载到弹窗
function loadPersonalInfoToModal(data) {
    // 基本信息
    document.getElementById('piName').value = data.name || '';
    document.getElementById('piEmployeeNo').value = data.employeeNo || '';
    document.getElementById('piGender').value = data.gender || '';
    document.getElementById('piBirthDate').value = formatDate(data.birthDate) || '';
    
    // 身份信息
    document.getElementById('piIdCard').value = maskIdCard(data.idCard) || '';
    document.getElementById('piEmploymentType').value = data.employmentType || '';
    
    // 联系信息
    document.getElementById('piPhone').value = data.phone || '';
    document.getElementById('piEmail').value = data.email || '';
    document.getElementById('piAddress').value = data.address || '';
    
    // 工作信息
    document.getElementById('piDepartment').value = data.department || '';
    document.getElementById('piPosition').value = data.position || '';
    document.getElementById('piJobLevel').value = data.jobLevel || '';
    document.getElementById('piEntryDate').value = formatDate(data.entryDate) || '';
    document.getElementById('piRegularDate').value = formatDate(data.regularDate) || '';
    document.getElementById('piStatus').value = data.status || '';
}

// 格式化日期
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return dateStr;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        return dateStr;
    }
}

// 身份证号脱敏
function maskIdCard(idCard) {
    if (!idCard) return '';
    if (idCard.length === 18) {
        return idCard.replace(/(\d{4})\d{10}(\d{4})/, '$1**********$2');
    }
    return idCard;
}

// 关闭弹窗
function closePersonalInfoModal() {
    document.getElementById('personalInfoModal').classList.remove('show');
}

// 导出到全局
window.openPersonalInfoModal = openPersonalInfoModal;
window.closePersonalInfoModal = closePersonalInfoModal;

export { openPersonalInfoModal, closePersonalInfoModal };
