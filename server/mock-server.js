const http = require('http');

const server = http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    if (req.method === 'OPTIONS') {
        res.end();
        return;
    }
    
    const url = req.url.split('?')[0];
    
    const response = {
        code: 200,
        data: [],
        message: 'success'
    };
    
    if (url === '/api/auth/me') {
        response.data = {
            id: 1,
            username: 'admin',
            display_name: 'System Admin',
            real_name: 'Administrator',
            role: 'admin',
            status: 1
        };
    }
    else if (url === '/api/auth/login') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            if (data.username === 'admin' && data.password === '1') {
                response.data = {
                    token: 'test-token',
                    user: {
                        id: 1,
                        username: 'admin',
                        display_name: 'System Admin',
                        real_name: 'Administrator',
                        role: 'admin',
                        status: 1
                    }
                };
            } else {
                response.code = 401;
                response.message = 'Invalid credentials';
            }
            res.end(JSON.stringify(response));
        });
        return;
    }
    else if (url === '/api/org/departments' || url === '/api/org/departments/tree') {
        response.data = [
            { id: 1, name: '总经理办公室', code: 'CEO', parentId: 0, status: 1 },
            { id: 2, name: '技术部', code: 'TECH', parentId: 1, status: 1 },
            { id: 3, name: '产品部', code: 'PROD', parentId: 1, status: 1 },
            { id: 4, name: '人力资源部', code: 'HR', parentId: 1, status: 1 },
            { id: 5, name: '销售部', code: 'SALES', parentId: 1, status: 1 },
            { id: 6, name: '财务部', code: 'FINANCE', parentId: 1, status: 1 },
            { id: 7, name: '前端开发组', code: 'FE', parentId: 2, status: 1 },
            { id: 8, name: '后台开发组', code: 'BE', parentId: 2, status: 1 }
        ];
    }
    else if (url === '/api/org/positions') {
        response.data = [
            { id: 1, name: '技术总监', code: 'CTO', departmentId: 2, level: 'VP', headcount: 1, current: 1, vacant: 0, isKeyPosition: 1 },
            { id: 2, name: '前端开发工程师', code: 'FE', departmentId: 7, level: 'P3', headcount: 3, current: 2, vacant: 1, isKeyPosition: 1 },
            { id: 3, name: '后台开发工程师', code: 'BE', departmentId: 8, level: 'P3', headcount: 3, current: 1, vacant: 2, isKeyPosition: 1 },
            { id: 4, name: '产品经理', code: 'PM', departmentId: 3, level: 'P4', headcount: 2, current: 1, vacant: 1, isKeyPosition: 1 },
            { id: 5, name: 'HR经理', code: 'HRM', departmentId: 4, level: 'P4', headcount: 1, current: 1, vacant: 0, isKeyPosition: 0 }
        ];
    }
    else if (url === '/api/org/employees' || url === '/api/org/employees/for-select') {
        response.data = [
            { id: 1, name: '张三', employeeNo: 'EMP001', positionId: 1, departmentId: 2, status: 1 },
            { id: 2, name: '李四', employeeNo: 'EMP002', positionId: 2, departmentId: 7, status: 1 },
            { id: 3, name: '王五', employeeNo: 'EMP003', positionId: 2, departmentId: 7, status: 1 },
            { id: 4, name: '赵六', employeeNo: 'EMP004', positionId: 3, departmentId: 8, status: 1 },
            { id: 5, name: '钱七', employeeNo: 'EMP005', positionId: 4, departmentId: 3, status: 1 },
            { id: 6, name: '孙八', employeeNo: 'EMP006', positionId: 5, departmentId: 4, status: 1 }
        ];
    }
    else if (url === '/api/org/statistics') {
        response.data = {
            departmentCount: 8,
            employeeCount: 6,
            positionCount: 5,
            keyPositionCount: 4,
            fillRate: 67
        };
    }
    else if (url === '/api/dashboard') {
        response.data = {
            totalEmployees: 28,
            totalDepartments: 8,
            totalPositions: 15,
            activePositions: 13,
            pendingLeaves: 2,
            upcomingInterviews: 3,
            monthlyEvaluations: 10
        };
    }
    
    res.end(JSON.stringify(response));
});

server.listen(8080, () => {
    console.log('Mock API Server started on http://localhost:8080');
});
