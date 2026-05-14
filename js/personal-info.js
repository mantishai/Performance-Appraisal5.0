import API from './api.js';
import { Toast } from './utils.js';

// 防重复点击标志
let personalInfoLoading = false;

// 打开个人信息弹窗（直接使用员工详情模块的弹窗，只读模式）
async function openPersonalInfoModal() {
    if (personalInfoLoading) {
        Toast.info('正在加载，请稍候...');
        return;
    }
    personalInfoLoading = true;
    
    try {
        // 使用全局关闭所有弹窗
        if (window.ModalManager) {
            window.ModalManager.closeAll();
        } else {
            // 兼容旧版本
            const modals = document.querySelectorAll('.modal-overlay, .modal, .drawer');
            modals.forEach(modal => {
                modal.classList.remove('show');
                modal.style.display = 'none';
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
            });
            
            // 专门关闭岗位说明书弹窗
            if (window.closePositionModal) {
                window.closePositionModal();
            }
        }
        
        // 等待一小段时间让DOM更新
        await new Promise(resolve => setTimeout(resolve, 80));
        
        // 先获取当前用户信息
        const userRes = await API.getCurrentUser();
        if (userRes.code !== 200) {
            Toast.error('获取用户信息失败');
            return;
        }
        
        const user = userRes.data;
        
        // 查找关联的员工
        let foundEmployee = null;
        const empRes = await API.getEmployees();
        
        if (empRes.code === 200) {
            const employees = empRes.data;
            
            // 优先按工号匹配
            if (user.employee_no) {
                foundEmployee = employees.find(emp => emp.employee_no === user.employee_no || emp.employeeNo === user.employee_no);
            }
            
            // 如果按工号没找到，按姓名匹配
            if (!foundEmployee) {
                const userName = user.name || user.real_name || user.username;
                if (userName) {
                    foundEmployee = employees.find(emp => emp.name === userName);
                }
            }
        }
        
        if (foundEmployee && foundEmployee.id) {
            // 使用员工详情模块的弹窗，设置为只读模式
            import('./modules/employee-detail.js').then(({ default: employeeDetailModule }) => {
                // 设置为只读模式
                employeeDetailModule.setReadOnly(true);
                // 打开弹窗
                employeeDetailModule.open(foundEmployee);
            });
        } else {
            Toast.error('未找到关联的员工信息');
        }
        
    } catch (error) {
        console.error('加载个人信息失败:', error);
        Toast.error('加载个人信息失败');
        return;
    } finally {
        personalInfoLoading = false;
    }
}

// 关闭弹窗
function closePersonalInfoModal() {
    // 调用员工详情模块的关闭方法
    import('./modules/employee-detail.js').then(({ default: employeeDetailModule }) => {
        employeeDetailModule.close();
    });
}

// 导出到全局
window.openPersonalInfoModal = openPersonalInfoModal;
window.closePersonalInfoModal = closePersonalInfoModal;

export { openPersonalInfoModal, closePersonalInfoModal };
