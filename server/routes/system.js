import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/system/users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, name, role, status FROM system_user');
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get users error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/system/users', async (req, res) => {
    try {
        const { username, password, name, role, permissions = [], status = 'active' } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO system_user (username, password, name, role, permissions, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
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
            'UPDATE system_user SET username = ?, name = ?, role = ?, permissions = ?, status = ? WHERE id = ?',
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
        
        const [result] = await pool.execute('DELETE FROM system_user WHERE id = ?', [id]);
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '用户删除成功' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/roles', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM system_role');
        rows.forEach(row => {
            row.permissions = row.permissions ? JSON.parse(row.permissions) : [];
        });
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get roles error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/system/config', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM system_config');
        const config = {};
        rows.forEach(row => {
            try {
                config[row.key] = JSON.parse(row.value);
            } catch {
                config[row.key] = row.value;
            }
        });
        res.json({ code: 200, data: config, message: 'success' });
    } catch (error) {
        console.error('Get config error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/system/config', async (req, res) => {
    try {
        const configData = req.body;
        
        for (const [key, value] of Object.entries(configData)) {
            const [existing] = await pool.execute('SELECT id FROM system_config WHERE `key` = ?', [key]);
            
            const jsonValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            
            if (existing.length > 0) {
                await pool.execute('UPDATE system_config SET value = ? WHERE `key` = ?', [jsonValue, key]);
            } else {
                await pool.execute('INSERT INTO system_config (`key`, value) VALUES (?, ?)', [key, jsonValue]);
            }
        }
        
        res.json({ code: 200, data: {}, message: '配置更新成功' });
    } catch (error) {
        console.error('Update config error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;