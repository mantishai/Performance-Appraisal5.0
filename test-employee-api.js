import http from 'http';

function testAPI() {
    console.log('测试员工列表API...\n');
    
    const options = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/employees',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        console.log('HTTP状态码:', res.statusCode);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            const result = JSON.parse(data);
            console.log('\n返回数据:');
            console.log('code:', result.code);
            console.log('message:', result.message);
            console.log('data:', JSON.stringify(result.data, null, 2));
        });
    });
    
    req.on('error', (e) => {
        console.log('❌ 请求失败:', e.message);
    });
    
    req.end();
}

testAPI();
