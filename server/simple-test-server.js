import http from 'http';
import { createPool } from 'mysql2/promise';

const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hr_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '+08:00'
});

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    if (req.url === '/api/org/positions' && req.method === 'GET') {
        try {
            const [rows] = await pool.execute(`
                SELECT p.*, p.position_name as name, p.dept_id as departmentId,
                       (SELECT COUNT(*) FROM employee WHERE position_id = p.id) as current,
                       p.is_key_position as isKeyPosition,
                       p.position_code as code,
                       p.job_description as duties,
                       p.requirement as requirements
                FROM \`position\` p
            `);
            
            const positions = rows.map(row => ({
                id: row.id,
                name: row.position_name,
                code: row.position_code || '',
                departmentId: row.dept_id,
                level: typeof row.position_level === 'string' ? row.position_level : (row.position_level || 1),
                headcount: row.headcount || 0,
                current: row.current || 0,
                vacant: (row.headcount || 0) - (row.current || 0),
                isKeyPosition: row.is_key_position || 0,
                duties: row.job_description || '',
                requirements: row.requirement || ''
            }));
            
            res.writeHead(200);
            res.end(JSON.stringify({ code: 200, data: positions, message: 'success' }));
        } catch (error) {
            console.error('Database error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ code: 500, message: 'Database error' }));
        }
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Not found' }));
    }
});

server.listen(8080, () => {
    console.log('✅ 测试服务器启动成功！');
    console.log('📡 API地址: http://localhost:8080/api/org/positions');
});
