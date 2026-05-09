import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/audit/logs', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;
        
        const logs = [
            { id: 1, type: 'login', user: 'admin', action: '用户登录', target: '/login', result: 'success', time: '2026-05-09 10:30:00', ip: '192.168.1.100' },
            { id: 2, type: 'create', user: 'admin', action: '创建员工', target: '员工管理', result: 'success', time: '2026-05-09 10:25:00', ip: '192.168.1.100' },
            { id: 3, type: 'update', user: 'manager', action: '更新员工信息', target: '张三', result: 'success', time: '2026-05-09 10:20:00', ip: '192.168.1.150' },
            { id: 4, type: 'delete', user: 'admin', action: '删除部门', target: '测试部', result: 'success', time: '2026-05-09 10:15:00', ip: '192.168.1.100' },
            { id: 5, type: 'login', user: 'user1', action: '用户登录', target: '/login', result: 'success', time: '2026-05-09 10:10:00', ip: '192.168.1.200' },
            { id: 6, type: 'approve', user: 'manager', action: '审批请假', target: '李四的请假申请', result: 'success', time: '2026-05-09 10:05:00', ip: '192.168.1.150' },
            { id: 7, type: 'login', user: 'guest', action: '用户登录', target: '/login', result: 'failed', time: '2026-05-09 10:00:00', ip: '10.0.0.5' },
            { id: 8, type: 'export', user: 'hr', action: '导出数据', target: '员工列表', result: 'success', time: '2026-05-09 09:55:00', ip: '192.168.1.120' },
            { id: 9, type: 'import', user: 'hr', action: '导入数据', target: '考勤数据', result: 'success', time: '2026-05-09 09:50:00', ip: '192.168.1.120' },
            { id: 10, type: 'permission', user: 'admin', action: '修改权限', target: '角色管理', result: 'success', time: '2026-05-09 09:45:00', ip: '192.168.1.100' }
        ];
        
        res.json({ code: 200, data: logs, message: 'success' });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/audit/statistics', async (req, res) => {
    try {
        res.json({ 
            code: 200, 
            data: {
                totalLogs: 156,
                todayLogs: 12,
                loginSuccess: 89,
                loginFailed: 15,
                operations: 52,
                byType: {
                    login: 104,
                    create: 15,
                    update: 20,
                    delete: 8,
                    approve: 5,
                    export: 3,
                    import: 1
                },
                byUser: {
                    admin: 65,
                    manager: 42,
                    hr: 30,
                    user1: 19
                }
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get audit statistics error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/audit/sensitive', async (req, res) => {
    try {
        const sensitiveOperations = [
            { id: 1, type: 'password_change', user: 'admin', action: '修改密码', target: 'admin', time: '2026-05-09 10:30:00', ip: '192.168.1.100', riskLevel: 'high' },
            { id: 2, type: 'permission_update', user: 'admin', action: '修改权限', target: '角色管理', time: '2026-05-09 10:20:00', ip: '192.168.1.100', riskLevel: 'high' },
            { id: 3, type: 'user_delete', user: 'admin', action: '删除用户', target: 'test_user', time: '2026-05-09 10:10:00', ip: '192.168.1.100', riskLevel: 'medium' },
            { id: 4, type: 'data_export', user: 'hr', action: '导出数据', target: '员工信息', time: '2026-05-09 09:55:00', ip: '192.168.1.120', riskLevel: 'medium' },
            { id: 5, type: 'login_failed', user: 'unknown', action: '登录失败', target: '/login', time: '2026-05-09 09:45:00', ip: '10.0.0.5', riskLevel: 'low' },
            { id: 6, type: 'system_config', user: 'admin', action: '修改系统配置', target: '系统设置', time: '2026-05-09 09:30:00', ip: '192.168.1.100', riskLevel: 'high' },
            { id: 7, type: 'database_backup', user: 'admin', action: '数据库备份', target: '全量备份', time: '2026-05-09 09:15:00', ip: '192.168.1.100', riskLevel: 'medium' },
            { id: 8, type: 'api_key_create', user: 'admin', action: '创建API密钥', target: 'OpenAPI应用', time: '2026-05-09 09:00:00', ip: '192.168.1.100', riskLevel: 'high' }
        ];
        
        res.json({ code: 200, data: sensitiveOperations, message: 'success' });
    } catch (error) {
        console.error('Get sensitive operations error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;