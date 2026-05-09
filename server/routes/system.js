import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/system/users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, real_name as name, role, status FROM user');
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get users error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/system/users', async (req, res) => {
    try {
        const { username, password, name, role, permissions = [], status = 1 } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO user (username, password, real_name, role, permissions, status, create_time) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [username, password, name, role, JSON.stringify(permissions), status]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: '用户创建成功' });
    } catch (error) {
        console.error('Create user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/system/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, name, role, permissions, status } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE user SET username = ?, real_name = ?, role = ?, permissions = ?, status = ? WHERE id = ?',
            [username, name, role, JSON.stringify(permissions), status, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '用户更新成功' });
    } catch (error) {
        console.error('Update user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/system/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM user WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '用户删除成功' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/roles', async (req, res) => {
    try {
        const roles = [
            { id: 1, name: 'super_admin', label: '超级管理员', permissions: ['all'] },
            { id: 2, name: 'admin', label: '管理员', permissions: ['org', 'employee', 'attendance', 'leave', 'performance'] },
            { id: 3, name: 'hr', label: 'HR', permissions: ['employee', 'attendance', 'leave', 'recruitment', 'training'] },
            { id: 4, name: 'manager', label: '部门经理', permissions: ['team', 'attendance', 'leave', 'performance'] },
            { id: 5, name: 'employee', label: '员工', permissions: ['profile', 'attendance', 'leave'] }
        ];
        res.json({ code: 200, data: roles, message: 'success' });
    } catch (error) {
        console.error('Get roles error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/config', async (req, res) => {
    try {
        const config = {
            companyName: 'HRMS人力资源管理系统',
            systemVersion: 'v1.0.0',
            maxUploadSize: 10,
            sessionTimeout: 30
        };
        res.json({ code: 200, data: config, message: 'success' });
    } catch (error) {
        console.error('Get config error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/system/config', async (req, res) => {
    try {
        res.json({ code: 200, data: {}, message: '配置更新成功' });
    } catch (error) {
        console.error('Update config error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/permissions', async (req, res) => {
    try {
        const permissions = [
            { id: 'dashboard', name: '仪表盘', icon: 'dashboard' },
            { id: 'employee', name: '员工管理', icon: 'users' },
            { id: 'department', name: '部门管理', icon: 'building' },
            { id: 'position', name: '岗位管理', icon: 'briefcase' },
            { id: 'attendance', name: '考勤管理', icon: 'clock' },
            { id: 'leave', name: '请假管理', icon: 'calendar' },
            { id: 'performance', name: '绩效管理', icon: 'trending-up' },
            { id: 'training', name: '培训管理', icon: 'book-open' },
            { id: 'recruitment', name: '招聘管理', icon: 'user-plus' },
            { id: 'talent', name: '人才管理', icon: 'star' },
            { id: 'alert', name: '预警管理', icon: 'alert-triangle' },
            { id: 'hr', name: '人事管理', icon: 'file-text' },
            { id: 'system', name: '系统管理', icon: 'settings' },
            { id: 'security', name: '安全管理', icon: 'shield' },
            { id: 'openapi', name: '接口管理', icon: 'api' },
            { id: 'import', name: '数据导入', icon: 'upload' }
        ];
        res.json({ code: 200, data: permissions, message: 'success' });
    } catch (error) {
        console.error('Get permissions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/role/:id/permissions', async (req, res) => {
    try {
        const { id } = req.params;
        
        const rolePermissions = {
            1: { roleId: 1, permissions: ['all'], roleName: '超级管理员' },
            2: { roleId: 2, permissions: ['dashboard', 'employee', 'department', 'position', 'attendance', 'leave', 'performance', 'system'], roleName: '管理员' },
            3: { roleId: 3, permissions: ['dashboard', 'employee', 'attendance', 'leave', 'recruitment', 'training'], roleName: 'HR' },
            4: { roleId: 4, permissions: ['dashboard', 'employee', 'attendance', 'leave', 'performance'], roleName: '部门经理' },
            5: { roleId: 5, permissions: ['dashboard', 'employee', 'attendance', 'leave'], roleName: '员工' }
        };
        
        res.json({ code: 200, data: rolePermissions[id] || { roleId: parseInt(id), permissions: [], roleName: '未知角色' }, message: 'success' });
    } catch (error) {
        console.error('Get role permissions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/logs', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        
        const logs = [
            { id: 1, type: 'login', user: 'admin', action: '登录系统', result: 'success', time: '2026-05-09 10:30:00', ip: '192.168.1.100' },
            { id: 2, type: 'operation', user: 'admin', action: '创建员工', result: 'success', time: '2026-05-09 10:25:00', ip: '192.168.1.100' },
            { id: 3, type: 'operation', user: 'manager', action: '审批请假', result: 'success', time: '2026-05-09 10:20:00', ip: '192.168.1.150' },
            { id: 4, type: 'login', user: 'user1', action: '登录系统', result: 'success', time: '2026-05-09 10:15:00', ip: '192.168.1.200' },
            { id: 5, type: 'operation', user: 'hr', action: '发布培训', result: 'success', time: '2026-05-09 10:10:00', ip: '192.168.1.120' },
            { id: 6, type: 'login', user: 'guest', action: '登录系统', result: 'failed', time: '2026-05-09 10:05:00', ip: '10.0.0.5' },
            { id: 7, type: 'operation', user: 'admin', action: '更新配置', result: 'success', time: '2026-05-09 10:00:00', ip: '192.168.1.100' },
            { id: 8, type: 'operation', user: 'manager', action: '查看绩效', result: 'success', time: '2026-05-09 09:55:00', ip: '192.168.1.150' }
        ];
        
        res.json({ code: 200, data: logs, message: 'success' });
    } catch (error) {
        console.error('Get system logs error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;