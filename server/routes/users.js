import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// 全局变量存储当前登录用户（用于演示，实际生产环境应使用session）
let currentLoggedInUser = null;

// 设置当前登录用户（从auth.js同步）
export function setCurrentUser(user) {
    currentLoggedInUser = user;
}

// 获取当前登录用户
export function getCurrentUser() {
    return currentLoggedInUser;
}

// 员工自助修改密码
router.put('/user/change-password', async (req, res) => {
    try {
        if (!currentLoggedInUser) {
            return res.json({ code: 401, message: '未登录' });
        }
        
        const { oldPassword, newPassword } = req.body;
        
        // 验证输入
        if (!oldPassword || !newPassword) {
            return res.json({ code: 400, message: '旧密码和新密码不能为空' });
        }
        
        if (newPassword.length < 6) {
            return res.json({ code: 400, message: '新密码长度不能少于6位' });
        }
        
        if (oldPassword === newPassword) {
            return res.json({ code: 400, message: '新密码不能与旧密码相同' });
        }
        
        // 验证旧密码
        const [users] = await pool.execute(
            'SELECT password FROM user WHERE id = ?',
            [currentLoggedInUser.id]
        );
        
        if (users.length === 0) {
            return res.json({ code: 404, message: '用户不存在' });
        }
        
        const user = users[0];
        if (user.password !== oldPassword) {
            return res.json({ code: 400, message: '旧密码不正确' });
        }
        
        // 更新密码
        await pool.execute(
            'UPDATE user SET password = ?, update_time = NOW() WHERE id = ?',
            [newPassword, currentLoggedInUser.id]
        );
        
        res.json({ code: 200, message: '密码修改成功，请重新登录' });
    } catch (error) {
        console.error('Change password error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取用户列表（管理员）- 同时关联员工信息
router.get('/admin/users', async (req, res) => {
    try {
        const { role } = req.query;
        
        let query = `
            SELECT u.id, u.username, u.display_name as name, u.role, u.employee_no, u.status, u.create_time,
                   e.email, e.phone
            FROM user u
            LEFT JOIN employee e ON u.employee_no = e.employee_no
            WHERE 1=1
        `;
        const params = [];
        
        if (role) {
            query += ' AND u.role = ?';
            params.push(role);
        }
        
        query += ' ORDER BY u.create_time DESC';
        
        const [rows] = await pool.execute(query, params);
        
        // 转换状态格式
        const formattedRows = rows.map(row => ({
            ...row,
            status: row.status === 1 ? 'active' : 'inactive'
        }));
        
        res.json({ code: 200, data: formattedRows, message: 'success' });
    } catch (error) {
        console.error('Get users error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 创建用户（管理员）
router.post('/admin/users', async (req, res) => {
    try {
        const { username, password, name, role = 'employee', email, phone } = req.body;
        
        // 验证输入
        if (!username || !password) {
            return res.json({ code: 400, message: '用户名和密码不能为空' });
        }
        
        if (password.length < 6) {
            return res.json({ code: 400, message: '密码长度不能少于6位' });
        }
        
        // 检查用户名是否已存在
        const [existing] = await pool.execute(
            'SELECT id FROM user WHERE username = ?',
            [username]
        );
        
        if (existing.length > 0) {
            return res.json({ code: 400, message: '用户名已存在' });
        }
        
        // 插入用户
        const [result] = await pool.execute(
            'INSERT INTO user (username, password, display_name, role, employee_no, status, create_time) VALUES (?, ?, ?, ?, NULL, 1, NOW())',
            [username, password, name || username, role]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '用户添加成功' });
    } catch (error) {
        console.error('Add user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 更新用户（管理员）
router.put('/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, name, role, email, phone } = req.body;
        
        // 更新用户
        const [result] = await pool.execute(
            'UPDATE user SET username = ?, display_name = ?, role = ?, update_time = NOW() WHERE id = ?',
            [username, name, role, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.json({ code: 404, message: '用户不存在' });
        }
        
        res.json({ code: 200, message: '用户更新成功' });
    } catch (error) {
        console.error('Update user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 重置用户密码（管理员）
router.put('/admin/users/:userId/reset-password', async (req, res) => {
    try {
        const { userId } = req.params;
        const { newPassword = '123456' } = req.body;
        
        // 更新密码
        const [result] = await pool.execute(
            'UPDATE user SET password = ?, update_time = NOW() WHERE id = ?',
            [newPassword, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.json({ code: 404, message: '用户不存在' });
        }
        
        res.json({ code: 200, message: '密码重置成功' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 更新用户状态（管理员）
router.put('/admin/users/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        
        const statusValue = status === 'active' ? 1 : 0;
        
        // 更新状态
        const [result] = await pool.execute(
            'UPDATE user SET status = ?, update_time = NOW() WHERE id = ?',
            [statusValue, userId]
        );
        
        if (result.affectedRows === 0) {
            return res.json({ code: 404, message: '用户不存在' });
        }
        
        res.json({ code: 200, message: '状态更新成功' });
    } catch (error) {
        console.error('Update user status error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 删除用户（管理员）
router.delete('/admin/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 不能删除自己
        if (currentLoggedInUser && parseInt(userId) === currentLoggedInUser.id) {
            return res.json({ code: 400, message: '不能删除自己' });
        }
        
        const [result] = await pool.execute('DELETE FROM user WHERE id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.json({ code: 404, message: '用户不存在' });
        }
        
        res.json({ code: 200, message: '用户删除成功' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取角色列表
router.get('/admin/roles', async (req, res) => {
    try {
        const roles = [
            { id: 1, code: 'super_admin', name: '超级管理员', userCount: 1 },
            { id: 2, code: 'hr_admin', name: 'HR管理员', userCount: 0 },
            { id: 3, code: 'department_manager', name: '部门经理', userCount: 0 },
            { id: 4, code: 'employee', name: '普通员工', userCount: 0 }
        ];
        
        // 获取每个角色的用户数
        const [userCounts] = await pool.execute(
            'SELECT role, COUNT(*) as count FROM user GROUP BY role'
        );
        
        userCounts.forEach(row => {
            const role = roles.find(r => r.code === row.role);
            if (role) {
                role.userCount = row.count;
            }
        });
        
        res.json({ code: 200, data: roles, message: 'success' });
    } catch (error) {
        console.error('Get roles error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取权限列表
router.get('/admin/permissions', async (req, res) => {
    try {
        const permissions = [
            // 员工管理
            { code: 'employee.view', name: '查看员工', module: 'employee' },
            { code: 'employee.add', name: '新增员工', module: 'employee' },
            { code: 'employee.edit', name: '编辑员工', module: 'employee' },
            { code: 'employee.delete', name: '删除员工', module: 'employee' },
            
            // 人事管理
            { code: 'personnel.view', name: '查看人事', module: 'personnel' },
            { code: 'personnel.contract', name: '合同管理', module: 'personnel' },
            { code: 'personnel.transfer', name: '调动管理', module: 'personnel' },
            
            // 考勤管理
            { code: 'attendance.view', name: '查看考勤', module: 'attendance' },
            { code: 'attendance.checkin', name: '打卡管理', module: 'attendance' },
            { code: 'attendance.leave', name: '请假审批', module: 'attendance' },
            
            // 招聘管理
            { code: 'recruitment.view', name: '查看招聘', module: 'recruitment' },
            { code: 'recruitment.publish', name: '发布职位', module: 'recruitment' },
            { code: 'recruitment.interview', name: '面试管理', module: 'recruitment' },
            
            // 绩效考核
            { code: 'performance.view', name: '查看绩效', module: 'performance' },
            { code: 'performance.evaluate', name: '绩效评估', module: 'performance' },
            { code: 'performance.kpi', name: 'KPI管理', module: 'performance' },
            
            // 培训管理
            { code: 'training.view', name: '查看培训', module: 'training' },
            { code: 'training.course', name: '课程管理', module: 'training' },
            { code: 'training.record', name: '培训记录', module: 'training' },
            
            // 人才盘点
            { code: 'talent.view', name: '查看人才', module: 'talent' },
            { code: 'talent.ninegrid', name: '九宫格', module: 'talent' },
            { code: 'talent.succession', name: '继任管理', module: 'talent' },
            
            // 系统管理
            { code: 'system.user', name: '用户管理', module: 'system' },
            { code: 'system.role', name: '角色权限', module: 'system' },
            { code: 'system.config', name: '系统设置', module: 'system' },
            { code: 'system.log', name: '操作日志', module: 'system' }
        ];
        
        res.json({ code: 200, data: permissions, message: 'success' });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取角色权限
router.get('/admin/roles/:roleId/permissions', async (req, res) => {
    try {
        const { roleId } = req.params;
        
        // 超级管理员拥有所有权限
        const isSuperAdmin = roleId === '1';
        
        // 默认权限（员工拥有查看权限）
        const defaultPermissions = [
            'employee.view', 'attendance.view', 'performance.view',
            'training.view', 'talent.view'
        ];
        
        // 管理员权限
        const adminPermissions = [
            'employee.view', 'employee.add', 'employee.edit', 'employee.delete',
            'personnel.view', 'personnel.contract', 'personnel.transfer',
            'attendance.view', 'attendance.checkin', 'attendance.leave',
            'recruitment.view', 'recruitment.publish', 'recruitment.interview',
            'performance.view', 'performance.evaluate', 'performance.kpi',
            'training.view', 'training.course', 'training.record',
            'talent.view', 'talent.ninegrid', 'talent.succession',
            'system.user', 'system.role', 'system.config', 'system.log'
        ];
        
        let permissions = [];
        if (isSuperAdmin) {
            permissions = adminPermissions;
        } else if (roleId === '4') {
            permissions = defaultPermissions;
        } else {
            permissions = defaultPermissions;
        }
        
        res.json({ code: 200, data: { permissions }, message: 'success' });
    } catch (error) {
        console.error('Get role permissions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 更新角色权限
router.put('/admin/roles/:roleId/permissions', async (req, res) => {
    try {
        const { roleId } = req.params;
        const { permissions } = req.body;
        
        // 在实际应用中，这里会保存到数据库
        console.log(`Role ${roleId} permissions updated:`, permissions);
        
        res.json({ code: 200, message: '权限更新成功' });
    } catch (error) {
        console.error('Update role permissions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取操作日志
router.get('/admin/logs', async (req, res) => {
    try {
        const logs = [
            { id: 1, createTime: new Date().toISOString(), username: 'admin', module: 'system', action: '登录', content: '用户admin登录系统', ip: '127.0.0.1', status: 'success' },
            { id: 2, createTime: new Date(Date.now() - 3600000).toISOString(), username: 'admin', module: 'employee', action: '新增员工', content: '新增员工：张三', ip: '127.0.0.1', status: 'success' },
            { id: 3, createTime: new Date(Date.now() - 7200000).toISOString(), username: 'admin', module: 'system', action: '修改密码', content: '用户admin修改密码', ip: '127.0.0.1', status: 'success' }
        ];
        
        res.json({ code: 200, data: logs, message: 'success' });
    } catch (error) {
        console.error('Get logs error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 清空操作日志
router.delete('/admin/logs', async (req, res) => {
    try {
        res.json({ code: 200, message: '日志清空成功' });
    } catch (error) {
        console.error('Clear logs error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 获取系统配置
router.get('/admin/config', async (req, res) => {
    try {
        const configs = [
            { key: 'system_name', value: 'HR系统', description: '系统名称' },
            { key: 'system_logo', value: '', description: '系统Logo' },
            { key: 'system_version', value: '1.0.0', description: '系统版本' },
            { key: 'theme_color', value: '#1890ff', description: '主题颜色' }
        ];
        
        res.json({ code: 200, data: configs, message: 'success' });
    } catch (error) {
        console.error('Get config error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

// 更新系统配置
router.put('/admin/config', async (req, res) => {
    try {
        const { configs } = req.body;
        console.log('System config updated:', configs);
        res.json({ code: 200, message: '配置更新成功' });
    } catch (error) {
        console.error('Update config error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;
