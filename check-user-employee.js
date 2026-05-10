import pool from './server/db.js';

async function checkUserEmployeeRelation() {
    console.log('查询用户与员工关联关系...\n');
    
    try {
        // 查询用户表
        const [users] = await pool.execute(
            'SELECT id, username, real_name as name, employee_id FROM user ORDER BY id ASC'
        );
        
        console.log('用户列表：');
        users.forEach((user) => {
            console.log(`ID: ${user.id}, 用户名: ${user.username}, 姓名: ${user.name}, 员工ID: ${user.employee_id}`);
        });
        
        console.log(`\n共 ${users.length} 个用户`);
        
        // 查询用户与员工关联
        console.log('\n\n用户-员工关联：');
        const [relations] = await pool.execute(
            'SELECT u.id as user_id, u.username, u.real_name as user_name, ' +
            'e.id as employee_id, e.name as employee_name, e.employee_no ' +
            'FROM user u LEFT JOIN employee e ON u.employee_id = e.id ORDER BY u.id'
        );
        
        relations.forEach((rel) => {
            console.log(`用户ID: ${rel.user_id}, 用户名: ${rel.username}, 员工ID: ${rel.employee_id || '未关联'}, 员工姓名: ${rel.employee_name || '未关联'}`);
        });
        
    } catch (error) {
        console.error('查询失败:', error.message);
    }
    
    process.exit(0);
}

checkUserEmployeeRelation();
