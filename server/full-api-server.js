import http from 'http';
import { createPool } from 'mysql2/promise';

const pool = createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'hr_system',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    timezone: '+08:00'
});

function sendJSON(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data, null, 2));
}

const users = new Map();

async function loadUsers() {
    try {
        const [rows] = await pool.execute('SELECT * FROM user');
        rows.forEach(user => {
            users.set(user.username, user);
        });
    } catch (error) {
        console.error('Load users error:', error.message);
    }
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
        if (url === '/api/auth/login' && method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { username, password } = JSON.parse(body);
                    const [rows] = await pool.execute(
                        'SELECT id, username, display_name, real_name, role, status FROM user WHERE username = ? AND password = ?',
                        [username, password]
                    );
                    
                    if (rows.length > 0) {
                        const user = rows[0];
                        if (user.status === 1) {
                            sendJSON(res, {
                                code: 200,
                                data: {
                                    token: 'mock-token-' + Date.now(),
                                    user: user
                                },
                                message: 'Login success'
                            });
                        } else {
                            sendJSON(res, { code: 401, message: 'Account disabled' }, 401);
                        }
                    } else {
                        sendJSON(res, { code: 401, message: 'Invalid credentials' }, 401);
                    }
                } catch (error) {
                    sendJSON(res, { code: 500, message: 'Login failed' }, 500);
                }
            });
        }
        else if (url === '/api/auth/me' && method === 'GET') {
            const [rows] = await pool.execute(
                'SELECT id, username, display_name, real_name, role, status FROM user WHERE id = 1'
            );
            if (rows.length > 0) {
                sendJSON(res, { code: 200, data: rows[0], message: 'success' });
            } else {
                sendJSON(res, { code: 401, message: 'Not authenticated' }, 401);
            }
        }
        else if (url === '/api/org/departments' && method === 'GET') {
            const [rows] = await pool.execute(`
                SELECT id, dept_name as name, dept_code as code, parent_id as parentId, status, phone, description
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
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ code: 404, message: 'Not Found' }));
        }
    } catch (error) {
        console.error('Server error:', error);
        sendJSON(res, { code: 500, message: 'Server error: ' + error.message }, 500);
    }
});

loadUsers().then(() => {
    server.listen(8080, () => {
        console.log('API Server started on http://localhost:8080');
        console.log('Endpoints:');
        console.log('  POST /api/auth/login');
        console.log('  GET  /api/auth/me');
        console.log('  GET  /api/org/departments');
        console.log('  GET  /api/org/positions');
        console.log('  GET  /api/org/employees');
        console.log('  GET  /api/org/statistics');
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
