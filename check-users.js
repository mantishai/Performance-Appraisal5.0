import pool from './server/db.js';

async function checkData() {
    try {
        console.log('=== 检查用户表和员工表数据 ===\n');

        // 检查用户表
        console.log('1. 用户表数据:');
        const [users] = await pool.execute('SELECT id, username, display_name, role, employee_no, status FROM user ORDER BY id');
        console.log(`   共 ${users.length} 条记录:`);
        users.forEach(u => {
            console.log(`   ID: ${u.id}, 用户名: ${u.username}, 显示名: ${u.display_name}, 角色: ${u.role}, 工号: ${u.employee_no || '无'}, 状态: ${u.status}`);
        });

        // 检查员工表
        console.log('\n2. 员工表数据:');
        const [employees] = await pool.execute('SELECT id, name, employee_no FROM employee ORDER BY id');
        console.log(`   共 ${employees.length} 条记录:`);
        employees.forEach(e => {
            console.log(`   ID: ${e.id}, 姓名: ${e.name}, 工号: ${e.employee_no}`);
        });

        // 检查是否有关联
        console.log('\n3. 关联检查:');
        const [joined] = await pool.execute(`
            SELECT u.id, u.username, u.employee_no, e.name as employee_name
            FROM user u
            LEFT JOIN employee e ON u.employee_no = e.employee_no
            ORDER BY u.id
        `);
        console.log(`   共 ${joined.length} 条关联记录:`);
        joined.forEach(j => {
            console.log(`   用户: ${j.username}, 工号: ${j.employee_no || '无'}, 员工: ${j.employee_name || '无'}`);
        });

    } catch (error) {
        console.error('检查失败:', error);
    } finally {
        process.exit(0);
    }
}

checkData();
