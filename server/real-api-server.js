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

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJSON(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    const method = req.method;

    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    try {
        if (url === '/api/org/departments' && method === 'GET') {
            const [rows] = await pool.execute(`
                SELECT id, name, code, parent_id as parentId, status, phone, description
                FROM department
                ORDER BY id
            `);
            sendJSON(res, { code: 200, data: rows, message: 'success' });
        }
        else if (url === '/api/org/positions' && method === 'GET') {
            const [rows] = await pool.execute(`
                SELECT p.id, p.position_name as name, p.position_code as code,
                       p.dept_id as departmentId, p.position_level as level,
                       p.headcount, p.job_description as duties,
                       p.requirement as requirements, p.is_key_position as isKeyPosition,
                       (SELECT COUNT(*) FROM employee WHERE position_id = p.id) as current
                FROM \`position\` p
                ORDER BY p.id
            `);
            const positions = rows.map(row => ({
                ...row,
                current: row.current || 0,
                vacant: (row.headcount || 0) - (row.current || 0),
                level: typeof row.level === 'string' ? row.level : (row.level || 1),
                isKeyPosition: row.isKeyPosition || 0,
                duties: row.duties || '',
                requirements: row.requirements || ''
            }));
            sendJSON(res, { code: 200, data: positions, message: 'success' });
        }
        else if (url === '/api/org/employees' && method === 'GET') {
            const [rows] = await pool.execute(`
                SELECT id, name, employee_no as employeeNo, position_id as positionId,
                       department_id as departmentId, status, phone, email
                FROM employee
                ORDER BY id
            `);
            sendJSON(res, { code: 200, data: rows, message: 'success' });
        }
        else if (url === '/api/org/statistics' && method === 'GET') {
            const [deptCount] = await pool.execute('SELECT COUNT(*) as count FROM department');
            const [empCount] = await pool.execute('SELECT COUNT(*) as count FROM employee WHERE status = 1');
            const [posCount] = await pool.execute('SELECT COUNT(*) as count FROM `position`');
            const [keyPosCount] = await pool.execute('SELECT COUNT(*) as count FROM `position` WHERE is_key_position = 1');
            const [totalHead] = await pool.execute('SELECT COALESCE(SUM(headcount), 0) as total FROM `position`');
            const [totalCurrent] = await pool.execute('SELECT COUNT(*) as total FROM employee WHERE status = 1');

            const totalHeadcount = totalHead[0]?.total || 0;
            const totalOnboard = totalCurrent[0]?.total || 0;
            const fillRate = totalHeadcount > 0 ? Math.round((totalOnboard / totalHeadcount) * 100) : 0;

            sendJSON(res, {
                code: 200,
                data: {
                    departmentCount: deptCount[0]?.count || 0,
                    employeeCount: empCount[0]?.count || 0,
                    positionCount: posCount[0]?.count || 0,
                    keyPositionCount: keyPosCount[0]?.count || 0,
                    fillRate: fillRate
                },
                message: 'success'
            });
        }
        else if (url.match(/^\/api\/org\/position$/) && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const [result] = await pool.execute(
                        `INSERT INTO \`position\` (position_name, position_code, dept_id, position_level, headcount, job_description, requirement, is_key_position)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [data.name, data.code, data.departmentId, data.level || 1, data.headcount, data.duties, data.requirements, data.isKeyPosition || 0]
                    );
                    sendJSON(res, { code: 200, data: { id: result.insertId }, message: '创建成功' });
                } catch (error) {
                    console.error('Create position error:', error);
                    sendJSON(res, { code: 500, message: '创建失败' }, 500);
                }
            });
        }
        else if (url.match(/^\/api\/org\/department$/) && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const [result] = await pool.execute(
                        `INSERT INTO department (name, code, parent_id, status, phone, description)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [data.name, data.code, data.parentId || 0, data.status || 1, data.phone || '', data.description || '']
                    );
                    sendJSON(res, { code: 200, data: { id: result.insertId }, message: '创建成功' });
                } catch (error) {
                    console.error('Create department error:', error);
                    sendJSON(res, { code: 500, message: '创建失败' }, 500);
                }
            });
        }
        else {
            res.writeHead(404);
            res.end('Not Found');
        }
    } catch (error) {
        console.error('Server error:', error);
        sendJSON(res, { code: 500, message: 'Server error' }, 500);
    }
});

server.listen(8080, () => {
    console.log('✅ 真实API服务器启动成功！');
    console.log('📡 监听端口: http://localhost:8080');
    console.log('🔗 API端点:');
    console.log('   - GET  /api/org/departments');
    console.log('   - GET  /api/org/positions');
    console.log('   - GET  /api/org/employees');
    console.log('   - GET  /api/org/statistics');
    console.log('   - POST /api/org/position');
    console.log('   - POST /api/org/department');
});
