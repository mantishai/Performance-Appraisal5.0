import API from './api.js';
import { Toast } from './utils.js';

// 打开修改密码弹窗
async function openChangePasswordModal() {
    try {
        // 获取当前用户信息
        const userRes = await API.getCurrentUser();
        if (userRes.code !== 200) {
            Toast.error('获取用户信息失败');
            return;
        }
        
        const user = userRes.data;
        document.getElementById('cpUsername').value = user.username || '';
        
        // 清空密码输入框
        document.getElementById('cpOldPassword').value = '';
        document.getElementById('cpNewPassword').value = '';
        document.getElementById('cpConfirmPassword').value = '';
        
        document.getElementById('changePasswordModal').classList.add('show');
    } catch (error) {
        console.error('打开修改密码弹窗失败:', error);
        Toast.error('操作失败');
    }
}

// 关闭修改密码弹窗
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('show');
}

// 提交修改密码
async function submitChangePassword() {
    try {
        const oldPassword = document.getElementById('cpOldPassword').value.trim();
        const newPassword = document.getElementById('cpNewPassword').value.trim();
        const confirmPassword = document.getElementById('cpConfirmPassword').value.trim();
        
        // 验证输入
        if (!oldPassword) {
            Toast.error('请输入旧密码');
            return;
        }
        
        if (!newPassword) {
            Toast.error('请输入新密码');
            return;
        }
        
        if (newPassword.length < 6) {
            Toast.error('新密码长度不能少于6位');
            return;
        }
        
        if (oldPassword === newPassword) {
            Toast.error('新密码不能与旧密码相同');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            Toast.error('两次输入的新密码不一致');
            return;
        }
        
        // 调用API修改密码
        const res = await API.changePassword(oldPassword, newPassword);
        
        if (res.code === 200) {
            Toast.success(res.message);
            closeChangePasswordModal();
            if (window.closePersonalInfoModal) {
                window.closePersonalInfoModal();
            }
            setTimeout(() => {
                if (confirm('密码修改成功，请重新登录')) {
                    window.location.href = '/login.html';
                }
            }, 1000);
        } else {
            Toast.error(res.message);
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        Toast.error('修改密码失败');
    }
}

// 导出到全局
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.submitChangePassword = submitChangePassword;

export { openChangePasswordModal, closeChangePasswordModal, submitChangePassword };
