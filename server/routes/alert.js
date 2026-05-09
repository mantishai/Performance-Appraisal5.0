import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/alert/statistics', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT alert_type as type, risk_level as level, status, COUNT(*) as count
            FROM alert_record
            GROUP BY alert_type, risk_level, status
        `);
        
        const stats = {
            total: 0,
            byType: {},
            byLevel: {},
            byStatus: {}
        };
        
        rows.forEach(row => {
            stats.total += row.count;
            stats.byType[row.type] = (stats.byType[row.type] || 0) + row.count;
            stats.byLevel[row.level] = (stats.byLevel[row.level] || 0) + row.count;
            stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + row.count;
        });
        
        res.json({ code: 200, data: stats, message: 'success' });
    } catch (error) {
        console.error('Get alert statistics error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/alert/list', async (req, res) => {
    try {
        const { type, level, status } = req.query;
        
        let query = 'SELECT * FROM alert_record WHERE 1=1';
        const params = [];
        
        if (type) {
            query += ' AND alert_type = ?';
            params.push(type);
        }
        if (level) {
            query += ' AND risk_level = ?';
            params.push(level);
        }
        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await pool.execute(query, params);
        res.json({ code: 200, data: rows, message: 'success' });
    } catch (error) {
        console.error('Get alert list error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/alert/:id/handle', async (req, res) => {
    try {
        const { id } = req.params;
        const { handled_by, remark } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE alert_record SET status = ?, handler_id = ?, handle_remark = ?, handle_time = NOW() WHERE id = ?',
            [1, handled_by, remark, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '预警已处理' });
    } catch (error) {
        console.error('Handle alert error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/alert/:id/ignore', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'UPDATE alert_record SET status = ?, handle_time = NOW() WHERE id = ?',
            [2, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '预警已忽略' });
    } catch (error) {
        console.error('Ignore alert error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/alert/rules', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM alert_rule ORDER BY id');
        
        const rules = rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type,
            threshold: row.threshold,
            enabled: row.status === 1,
            description: row.description,
            sortOrder: row.sort_order
        }));
        
        res.json({ code: 200, data: rules, message: 'success' });
    } catch (error) {
        console.error('Get alert rules error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/alert/rule/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, threshold, description } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE alert_rule SET name = ?, type = ?, threshold = ?, description = ?, update_time = NOW() WHERE id = ?',
            [name, type, threshold, description, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows }, message: '规则更新成功' });
    } catch (error) {
        console.error('Update alert rule error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.post('/alert/rule/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute('SELECT status FROM alert_rule WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.json({ code: 404, message: '规则不存在' });
        }
        
        const newStatus = rows[0].status === 1 ? 0 : 1;
        
        const [result] = await pool.execute(
            'UPDATE alert_rule SET status = ?, update_time = NOW() WHERE id = ?',
            [newStatus, id]
        );
        
        res.json({ code: 200, data: { affectedRows: result.affectedRows, enabled: newStatus === 1 }, message: '规则状态已切换' });
    } catch (error) {
        console.error('Toggle alert rule error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.get('/alert/risk-prediction', async (req, res) => {
    try {
        const [contractAlerts] = await pool.execute(
            'SELECT COUNT(*) as count FROM alert_record WHERE alert_type = "contract" AND status = 0'
        );
        const [expiringEmployees] = await pool.execute(`
            SELECT COUNT(*) as count FROM labor_contract 
            WHERE expiry_date IS NOT NULL 
            AND expiry_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
        `);
        const [overtimeAlerts] = await pool.execute(
            'SELECT COUNT(*) as count FROM alert_record WHERE alert_type = "overtime" AND status = 0'
        );
        
        const [deptRisk] = await pool.execute(`
            SELECT d.dept_name as department,
                   COUNT(CASE WHEN ar.alert_type = "overtime" THEN 1 END) as overtimeRisk,
                   COUNT(CASE WHEN ar.alert_type = "contract" THEN 1 END) as contractRisk,
                   COUNT(CASE WHEN ar.alert_type = "performance" THEN 1 END) as performanceRisk
            FROM department d
            LEFT JOIN employee e ON d.id = e.department_id
            LEFT JOIN alert_record ar ON e.id = ar.target_id AND ar.status = 0
            GROUP BY d.id, d.dept_name
        `);
        
        res.json({ 
            code: 200, 
            data: {
                riskPredictions: [
                    { type: 'contract', count: parseInt(contractAlerts[0]?.count) || 0, label: '合同到期风险' },
                    { type: 'expiring', count: parseInt(expiringEmployees[0]?.count) || 0, label: '即将到期员工' },
                    { type: 'overtime', count: parseInt(overtimeAlerts[0]?.count) || 0, label: '加班异常风险' }
                ],
                riskDistribution: {
                    contract: parseInt(contractAlerts[0]?.count) || 0,
                    overtime: parseInt(overtimeAlerts[0]?.count) || 0,
                    performance: 0,
                    other: 0
                },
                departmentRisks: deptRisk.map(row => ({
                    department: row.department,
                    overtimeRisk: parseInt(row.overtimeRisk) || 0,
                    contractRisk: parseInt(row.contractRisk) || 0,
                    performanceRisk: parseInt(row.performanceRisk) || 0,
                    total: (parseInt(row.overtimeRisk) || 0) + (parseInt(row.contractRisk) || 0) + (parseInt(row.performanceRisk) || 0)
                }))
            }, 
            message: 'success' 
        });
    } catch (error) {
        console.error('Get risk prediction error:', error);
        res.json({ 
            code: 200, 
            data: { riskPredictions: [], riskDistribution: {}, departmentRisks: [] }, 
            message: 'success' 
        });
    }
});

router.post('/alert/trigger', async (req, res) => {
    try {
        await pool.execute('INSERT INTO alert_record (alert_type, risk_level, status, related_id, created_at) VALUES ("manual", "medium", 0, 0, NOW())');
        res.json({ code: 200, message: '预警检查已触发' });
    } catch (error) {
        console.error('Trigger alert check error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;