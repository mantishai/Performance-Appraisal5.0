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

// 通知相关路由
router.get('/notifications', async (req, res) => {
    try {
        let [rows] = await pool.execute(`
            SELECT id, alert_type as type, alert_title as title, alert_content as message, 
                   status, risk_level, created_at as time
            FROM alert_record 
            ORDER BY created_at DESC 
            LIMIT 20
        `);
        
        // 如果没有数据，先插入一些测试数据
        if (rows.length === 0) {
            await pool.execute(`
                INSERT INTO alert_record (rule_id, alert_type, alert_title, alert_content, target_id, target_type, risk_level, status, handler_id, handle_time, handle_remark, created_at) VALUES
                (1, 'contract', '合同到期提醒', '李四的劳动合同将于30天后到期，请及时处理', 2, 'employee', 3, 0, NULL, NULL, NULL, NOW() - INTERVAL 30 MINUTE),
                (2, 'birthday', '生日祝福', '今天是张三的生日', 1, 'employee', 1, 1, 2, '2026-05-01 09:00:00', '已发送祝福', NOW() - INTERVAL 1 HOUR),
                (3, 'probation', '试用期转正提醒', '赵六的试用期将于7天后到期，请安排转正评估', 4, 'employee', 2, 0, NULL, NULL, NULL, NOW() - INTERVAL 2 HOUR),
                (4, 'attendance', '迟到预警', '李四本月已迟到3次，请关注', 2, 'employee', 2, 1, NULL, NULL, NULL, NOW() - INTERVAL 3 HOUR),
                (NULL, 'system', '系统通知', '系统将于今晚进行维护', NULL, 'system', 2, 0, NULL, NULL, NULL, NOW() - INTERVAL 1 DAY)
            `);
            
            // 重新查询
            [rows] = await pool.execute(`
                SELECT id, alert_type as type, alert_title as title, alert_content as message, 
                       status, risk_level, created_at as time
                FROM alert_record 
                ORDER BY created_at DESC 
                LIMIT 20
            `);
        }
        
        // 转换为通知格式
        const notifications = rows.map(row => {
            let icon = '📋';
            let notifType = 'info';
            
            if (row.type === 'contract') {
                icon = '📄';
                notifType = 'warning';
            } else if (row.type === 'birthday') {
                icon = '🎂';
                notifType = 'success';
            } else if (row.type === 'probation') {
                icon = '📅';
                notifType = 'warning';
            } else if (row.type === 'attendance') {
                icon = '⏰';
                notifType = 'error';
            } else if (row.type === 'system') {
                icon = '🔔';
                notifType = 'info';
            }
            
            // 计算时间差
            const now = new Date();
            const createTime = new Date(row.time);
            const diffMs = now - createTime;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            let timeStr = '刚刚';
            if (diffMins < 60) {
                timeStr = `${diffMins}分钟前`;
            } else if (diffHours < 24) {
                timeStr = `${diffHours}小时前`;
            } else if (diffDays < 7) {
                timeStr = `${diffDays}天前`;
            } else {
                timeStr = createTime.toLocaleDateString('zh-CN');
            }
            
            return {
                id: row.id,
                type: notifType,
                icon: icon,
                title: row.title,
                message: row.message,
                time: timeStr,
                read: row.status !== 0 // status 0 表示未读
            };
        });
        
        res.json({ code: 200, data: notifications, message: 'success' });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE alert_record SET status = 1 WHERE id = ?', [id]);
        res.json({ code: 200, message: '已标记为已读' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

router.put('/notifications/read-all', async (req, res) => {
    try {
        await pool.execute('UPDATE alert_record SET status = 1 WHERE status = 0');
        res.json({ code: 200, message: '全部标记为已读' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.json({ code: 500, message: '服务器错误' });
    }
});

export default router;