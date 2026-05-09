import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/openapi/apps', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM openapi_app ORDER BY create_time DESC');
        
        const apps = rows.map(row => ({
            id: row.id,
            name: row.name,
            appKey: row.app_key,
            appSecret: row.app_secret,
            status: row.status === 1 ? 'active' : 'inactive',
            description: row.description,
            permissions: row.permissions ? JSON.parse(row.permissions) : [],
            createTime: row.create_time,
            updateTime: row.update_time
        }));
        
        res.json({ code: 200, data: apps, message: 'success' });
    } catch (error) {
        console.error('Get openapi apps error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/openapi/apps', async (req, res) => {
    try {
        const { name, description, permissions = [] } = req.body;
        const appKey = 'app_' + Date.now().toString(36);
        const appSecret = 'secret_' + Math.random().toString(36).substr(2, 15);
        
        const [result] = await pool.execute(
            'INSERT INTO openapi_app (name, app_key, app_secret, description, permissions, status, create_time) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            [name, appKey, appSecret, description, JSON.stringify(permissions)]
        );
        
        res.json({ code: 200, data: { id: result.insertId, appKey, appSecret }, message: '应用创建成功' });
    } catch (error) {
        console.error('Create openapi app error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/openapi/app/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE openapi_app SET name = ?, description = ?, status = ?, update_time = NOW() WHERE id = ?',
            [name, description, status === 'active' ? 1 : 0, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '应用更新成功' });
    } catch (error) {
        console.error('Update openapi app error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/openapi/apis', async (req, res) => {
    try {
        const apis = [
            { id: 1, path: '/api/employees', method: 'GET', name: '获取员工列表', description: '获取所有员工信息', status: 'active' },
            { id: 2, path: '/api/employees/:id', method: 'GET', name: '获取员工详情', description: '获取单个员工详细信息', status: 'active' },
            { id: 3, path: '/api/employees', method: 'POST', name: '创建员工', description: '创建新员工', status: 'active' },
            { id: 4, path: '/api/employees/:id', method: 'PUT', name: '更新员工', description: '更新员工信息', status: 'active' },
            { id: 5, path: '/api/employees/:id', method: 'DELETE', name: '删除员工', description: '删除员工', status: 'active' },
            { id: 6, path: '/api/departments', method: 'GET', name: '获取部门列表', description: '获取所有部门信息', status: 'active' },
            { id: 7, path: '/api/positions', method: 'GET', name: '获取岗位列表', description: '获取所有岗位信息', status: 'active' },
            { id: 8, path: '/api/leave/list', method: 'GET', name: '获取请假列表', description: '获取请假申请列表', status: 'active' },
            { id: 9, path: '/api/leave/apply', method: 'POST', name: '提交请假', description: '提交请假申请', status: 'active' },
            { id: 10, path: '/api/attendance/records', method: 'GET', name: '获取考勤记录', description: '获取考勤记录列表', status: 'active' },
            { id: 11, path: '/api/performance/evaluations', method: 'GET', name: '获取绩效列表', description: '获取绩效评估列表', status: 'active' },
            { id: 12, path: '/api/training/courses', method: 'GET', name: '获取培训课程', description: '获取培训课程列表', status: 'active' }
        ];
        
        res.json({ code: 200, data: apis, message: 'success' });
    } catch (error) {
        console.error('Get openapi apis error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/openapi/app/:id/permissions', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute('SELECT permissions FROM openapi_app WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.json({ code: 404, message: '应用不存在' });
        }
        
        const permissions = rows[0].permissions ? JSON.parse(rows[0].permissions) : [];
        
        res.json({ code: 200, data: permissions, message: 'success' });
    } catch (error) {
        console.error('Get openapi app permissions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/openapi/app/:id/permissions', async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE openapi_app SET permissions = ?, update_time = NOW() WHERE id = ?',
            [JSON.stringify(permissions), id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '权限更新成功' });
    } catch (error) {
        console.error('Update openapi app permissions error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/openapi/logs', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        const [rows] = await pool.execute(
            'SELECT * FROM openapi_log ORDER BY create_time DESC LIMIT ?, ?',
            [offset, parseInt(limit)]
        );
        
        const logs = rows.map(row => ({
            id: row.id,
            appId: row.app_id,
            appName: row.app_name,
            apiPath: row.api_path,
            method: row.method,
            status: row.status,
            responseTime: row.response_time,
            ip: row.ip,
            createTime: row.create_time
        }));
        
        res.json({ code: 200, data: logs, message: 'success' });
    } catch (error) {
        console.error('Get openapi logs error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/openapi/statistics', async (req, res) => {
    try {
        const [totalRows] = await pool.execute('SELECT COUNT(*) as count FROM openapi_log');
        const [todayRows] = await pool.execute('SELECT COUNT(*) as count FROM openapi_log WHERE DATE(create_time) = CURDATE()');
        const [errorRows] = await pool.execute('SELECT COUNT(*) as count FROM openapi_log WHERE status >= 400');
        const [avgTime] = await pool.execute('SELECT AVG(response_time) as avg FROM openapi_log');
        
        const [methodStats] = await pool.execute('SELECT method, COUNT(*) as count FROM openapi_log GROUP BY method');
        
        res.json({ 
            code: 200, 
            data: {
                totalRequests: parseInt(totalRows[0]?.count) || 0,
                todayRequests: parseInt(todayRows[0]?.count) || 0,
                errorRate: ((parseInt(errorRows[0]?.count) || 0) / (parseInt(totalRows[0]?.count) || 1) * 100).toFixed(1),
                avgResponseTime: parseFloat(avgTime[0]?.avg) || 0,
                byMethod: methodStats.reduce((acc, row) => {
                    acc[row.method] = parseInt(row.count) || 0;
                    return acc;
                }, { GET: 0, POST: 0, PUT: 0, DELETE: 0 })
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get openapi statistics error:', error);
        res.json({ 
            code: 200, 
            data: { totalRequests: 0, todayRequests: 0, errorRate: '0', avgResponseTime: 0, byMethod: {} }, 
            message: 'success' 
        });
    }
});

router.get('/openapi/doc', async (req, res) => {
    try {
        const doc = {
            swagger: '2.0',
            info: {
                title: 'HRMS API',
                version: '1.0.0',
                description: '人力资源管理系统API文档'
            },
            basePath: '/api',
            schemes: ['http', 'https'],
            paths: {
                '/employees': {
                    get: { summary: '获取员工列表', parameters: [] },
                    post: { summary: '创建员工', parameters: [] }
                },
                '/employees/{id}': {
                    get: { summary: '获取员工详情', parameters: [] },
                    put: { summary: '更新员工', parameters: [] },
                    delete: { summary: '删除员工', parameters: [] }
                },
                '/departments': { get: { summary: '获取部门列表', parameters: [] } },
                '/positions': { get: { summary: '获取岗位列表', parameters: [] } },
                '/leave/list': { get: { summary: '获取请假列表', parameters: [] } },
                '/leave/apply': { post: { summary: '提交请假申请', parameters: [] } }
            }
        };
        
        res.json({ code: 200, data: doc, message: 'success' });
    } catch (error) {
        console.error('Get openapi doc error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/openapi/test', async (req, res) => {
    try {
        const { appKey, appSecret, apiPath, method, body } = req.body;
        
        const [rows] = await pool.execute('SELECT id, name FROM openapi_app WHERE app_key = ? AND app_secret = ?', [appKey, appSecret]);
        
        if (rows.length === 0) {
            return res.json({ code: 401, message: '无效的应用密钥' });
        }
        
        res.json({ code: 200, data: { success: true, message: '测试成功' }, message: 'success' });
    } catch (error) {
        console.error('Test openapi error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;