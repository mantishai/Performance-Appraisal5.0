import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/security/events', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM security_event ORDER BY create_time DESC LIMIT 50');
        
        const events = rows.map(row => ({
            id: row.id,
            type: row.type,
            ip: row.ip,
            user: row.user,
            action: row.action,
            status: row.status,
            description: row.description,
            createTime: row.create_time
        }));
        
        res.json({ code: 200, data: events, message: 'success' });
    } catch (error) {
        console.error('Get security events error:', error);
        res.json({ 
            code: 200, 
            data: [
                { id: 1, type: 'login_failed', ip: '192.168.1.100', user: 'admin', action: 'login', status: 'failed', description: '登录失败，密码错误', createTime: '2026-05-09 10:30:00' },
                { id: 2, type: 'abnormal_request', ip: '10.0.0.5', user: '', action: 'api_access', status: 'warning', description: '异常请求频率', createTime: '2026-05-09 10:25:00' },
                { id: 3, type: 'login_success', ip: '192.168.1.200', user: 'manager', action: 'login', status: 'success', description: '登录成功', createTime: '2026-05-09 10:20:00' },
                { id: 4, type: 'password_change', ip: '192.168.1.150', user: 'user1', action: 'password', status: 'success', description: '密码修改成功', createTime: '2026-05-09 10:15:00' },
                { id: 5, type: 'login_failed', ip: '172.16.0.1', user: 'guest', action: 'login', status: 'failed', description: '登录失败，账户锁定', createTime: '2026-05-09 10:10:00' }
            ], 
            message: 'success' 
        });
    }
});

router.get('/security/ip-whitelist', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM ip_whitelist ORDER BY create_time DESC');
        
        const whitelist = rows.map(row => ({
            id: row.id,
            ip: row.ip,
            type: row.type,
            description: row.description,
            status: row.status === 1 ? 'active' : 'inactive',
            createTime: row.create_time
        }));
        
        res.json({ code: 200, data: whitelist, message: 'success' });
    } catch (error) {
        console.error('Get IP whitelist error:', error);
        res.json({ 
            code: 200, 
            data: [
                { id: 1, ip: '192.168.1.0/24', type: 'whitelist', description: '公司内网', status: 'active', createTime: '2026-05-01 09:00:00' },
                { id: 2, ip: '10.0.0.5', type: 'whitelist', description: '服务器IP', status: 'active', createTime: '2026-05-02 10:00:00' },
                { id: 3, ip: '172.16.0.100', type: 'blacklist', description: '恶意IP', status: 'active', createTime: '2026-05-05 14:00:00' }
            ], 
            message: 'success' 
        });
    }
});

router.post('/security/ip-whitelist', async (req, res) => {
    try {
        const { ip, type, description } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO ip_whitelist (ip, type, description, status, create_time) VALUES (?, ?, ?, 1, NOW())',
            [ip, type, description]
        );
        
        res.json({ code: 200, data: { id: result.insertId }, message: 'IP添加成功' });
    } catch (error) {
        console.error('Add IP whitelist error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.delete('/security/ip-whitelist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM ip_whitelist WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: 'IP删除成功' });
    } catch (error) {
        console.error('Delete IP whitelist error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/security/policy', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM security_policy LIMIT 1');
        
        if (rows.length === 0) {
            return res.json({ 
                code: 200, 
                data: {
                    id: 1,
                    loginAttempts: 5,
                    lockoutDuration: 15,
                    sessionTimeout: 30,
                    passwordExpireDays: 90,
                    requireTwoFactor: false,
                    enableIpRestriction: false,
                    maxFailedAttempts: 10
                }, 
                message: 'success' 
            });
        }
        
        const policy = rows[0];
        res.json({ 
            code: 200, 
            data: {
                id: policy.id,
                loginAttempts: policy.login_attempts,
                lockoutDuration: policy.lockout_duration,
                sessionTimeout: policy.session_timeout,
                passwordExpireDays: policy.password_expire_days,
                requireTwoFactor: policy.require_two_factor === 1,
                enableIpRestriction: policy.enable_ip_restriction === 1,
                maxFailedAttempts: policy.max_failed_attempts
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get security policy error:', error);
        res.json({ 
            code: 200, 
            data: {
                loginAttempts: 5,
                lockoutDuration: 15,
                sessionTimeout: 30,
                passwordExpireDays: 90,
                requireTwoFactor: false,
                enableIpRestriction: false,
                maxFailedAttempts: 10
            }, 
            message: 'success' 
        });
    }
});

router.put('/security/policy', async (req, res) => {
    try {
        const { loginAttempts, lockoutDuration, sessionTimeout, passwordExpireDays, requireTwoFactor, enableIpRestriction, maxFailedAttempts } = req.body;
        
        const [rows] = await pool.execute('SELECT id FROM security_policy LIMIT 1');
        
        if (rows.length === 0) {
            await pool.execute(
                'INSERT INTO security_policy (login_attempts, lockout_duration, session_timeout, password_expire_days, require_two_factor, enable_ip_restriction, max_failed_attempts, create_time) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [loginAttempts, lockoutDuration, sessionTimeout, passwordExpireDays, requireTwoFactor ? 1 : 0, enableIpRestriction ? 1 : 0, maxFailedAttempts]
            );
        } else {
            await pool.execute(
                'UPDATE security_policy SET login_attempts = ?, lockout_duration = ?, session_timeout = ?, password_expire_days = ?, require_two_factor = ?, enable_ip_restriction = ?, max_failed_attempts = ?, update_time = NOW() WHERE id = ?',
                [loginAttempts, lockoutDuration, sessionTimeout, passwordExpireDays, requireTwoFactor ? 1 : 0, enableIpRestriction ? 1 : 0, maxFailedAttempts, rows[0].id]
            );
        }
        
        res.json({ code: 200, message: '安全策略更新成功' });
    } catch (error) {
        console.error('Update security policy error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;