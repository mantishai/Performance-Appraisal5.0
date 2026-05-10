import http from 'http';

function testAPI(employeeId) {
    console.log(`测试员工详情API (ID=${employeeId})...\n`);
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: `/api/employees/${employeeId}/detail`,
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        console.log('HTTP状态码:', res.statusCode);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('\n响应数据:', data);
        });
    });
    
    req.on('error', (e) => {
        console.log('❌ 请求失败:', e.message);
    });
    
    req.end();
}

testAPI(2);
