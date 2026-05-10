import pool from './server/db.js';

async function checkEmployees() {
    console.log('查询员工数据...\n');
    
    try {
        const [employees] = await pool.execute(
            'SELECT id, name, employee_no, department_id, position_id, status FROM employee ORDER BY id ASC'
        );
        
        console.log('员工列表：');
        employees.forEach((emp, index) => {
            console.log(`${index + 1}. ID: ${emp.id}, 姓名: ${emp.name}, 工号: ${emp.employee_no}, 部门ID: ${emp.department_id}, 岗位ID: ${emp.position_id}, 状态: ${emp.status}`);
        });
        
        console.log(`\n共 ${employees.length} 个员工`);
        
    } catch (error) {
        console.error('查询失败:', error.message);
    }
    
    process.exit(0);
}

checkEmployees();
