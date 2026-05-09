import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const [rows] = await pool.execute(
            'SELECT id, username, real_name as name, role, permissions FROM user WHERE username = ? AND password = ?',
            [username, password]
        );
        
        if (rows.length === 0) {
            return res.json({ code: 401, message: '用户名或密码错误' });
        }
        
        const user = rows[0];
        user.permissions = user.permissions && typeof user.permissions === 'string' 
            ? JSON.parse(user.permissions) 
            : (user.permissions || []);
        
        res.json({ 
            code: 200, 
            data: user, 
            message: '登录成功' 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/auth/me', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, username, real_name as name, role, permissions FROM user WHERE id = 1'
        );
        
        if (rows.length === 0) {
            return res.json({ code: 401, message: '未登录' });
        }
        
        const user = rows[0];
        user.permissions = user.permissions && typeof user.permissions === 'string' 
            ? JSON.parse(user.permissions) 
            : (user.permissions || []);
        
        res.json({ code: 200, data: user, message: 'success' });
    } catch (error) {
        console.error('Get current user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/current-user', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, username, real_name as name, role, permissions FROM user WHERE id = 1'
        );
        
        if (rows.length === 0) {
            return res.json({ code: 401, message: '未登录' });
        }
        
        const user = rows[0];
        user.permissions = user.permissions && typeof user.permissions === 'string' 
            ? JSON.parse(user.permissions) 
            : (user.permissions || []);
        
        res.json({ code: 200, data: user, message: 'success' });
    } catch (error) {
        console.error('Get current user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/auth/logout', async (req, res) => {
    res.json({ code: 200, message: '登出成功' });
});

export default router;