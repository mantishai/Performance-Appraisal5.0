import pool from './server/db.js';

async function testAPI() {
    try {
        console.log('=== 测试用户管理API ===\n');

        // 模拟API查询
        console.log('1. 测试 GET /admin/users:');
        const [rows] = await pool.execute(`
            SELECT u.id, u.username, u.display_name as name, u.role, u.employee_no, u.status, u.create_time,
                   e.email, e.phone, e.last_login_time
            FROM user u
            LEFT JOIN employee e ON u.employee_no = e.employee_no
            WHERE 1=1
            ORDER BY u.create_time DESC
        `);

        console.log(`   查询到 ${rows.length} 条记录`);

        // 转换状态格式
        const formattedRows = rows.map(row => ({
            ...row,
            status: row.status === 1 ? 'active' : 'inactive'
        }));

        console.log('\n2. 转换后的数据:');
        formattedRows.forEach(row => {
            console.log(`   ID: ${row.id}, 用户名: ${row.username}, 姓名: ${row.name}, 角色: ${row.role}, 状态: ${row.status}`);
        });

        console.log('\n3. 期望的JSON格式:');
        console.log(JSON.stringify({ code: 200, data: formattedRows, message: 'success' }, null, 2));

    } catch (error) {
        console.error('测试失败:', error);
    } finally {
        process.exit(0);
    }
}

testAPI();
