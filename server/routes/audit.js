import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/audit/logs', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, startDate, endDate } = req.query;
        const offset = (page - 1) * limit;
        
        const actionTypeMap = {
            'login': 'LOGIN',
            'create': 'CREATE',
            'update': 'UPDATE',
            'delete': 'DELETE',
            'approve': 'UPDATE',
            'export': 'EXPORT',
            'import': 'IMPORT',
            'permission': 'UPDATE'
        };
        
        const moduleMap = {
            '/login': 'system',
            '员工管理': 'employee',
            '张三': 'employee',
            '测试部': 'employee',
            '李四的请假申请': 'hr',
            '员工列表': 'employee',
            '考勤数据': 'attendance',
            '角色管理': 'system'
        };
        
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
        
        const formattedLogs = logs.map(log => ({
            id: log.id,
            username: log.user,
            module: moduleMap[log.target] || 'system',
            action: actionTypeMap[log.type] || 'READ',
            detail: `${log.action}: ${log.target}`,
            ip: log.ip,
            createTime: log.time,
            result: log.result,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }));
        
        res.json({ code: 200, data: formattedLogs, message: 'success' });
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
                todayTotal: 10,
                create: 1,
                update: 4,
                delete: 1,
                read: 4
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
        const typeMap = {
            'password_change': 'password_reset',
            'permission_update': 'permission_change',
            'user_delete': 'batch_delete',
            'data_export': 'data_export',
            'login_failed': 'config_modify',
            'system_config': 'config_modify',
            'database_backup': 'config_modify',
            'api_key_create': 'permission_change'
        };
        
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
        
        const formattedSensitive = sensitiveOperations.map(op => ({
            id: op.id,
            type: typeMap[op.type] || 'config_modify',
            username: op.user,
            detail: `${op.action}: ${op.target}`,
            createTime: op.time,
            ip: op.ip
        }));
        
        res.json({ code: 200, data: formattedSensitive, message: 'success' });
    } catch (error) {
        console.error('Get sensitive operations error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;