import pool from './server/db.js';
import fs from 'fs';
import path from 'path';

async function checkPositions() {
    console.log('正在查询岗位数据...\n');
    
    try {
        // 查询所有岗位，关联部门信息
        const [positions] = await pool.execute(
            'SELECT p.id, p.position_name, p.position_code, p.position_level, ' +
            'p.dept_id, d.dept_name, p.headcount, p.current_count, p.status ' +
            'FROM position p LEFT JOIN department d ON p.dept_id = d.id ' +
            'ORDER BY p.id ASC'
        );
        
        // 生成输出内容
        let output = '='.repeat(100) + '\n';
        output += '📋 岗位列表\n';
        output += '='.repeat(100) + '\n\n';
        
        if (positions.length === 0) {
            output += '❌ 暂无岗位数据\n';
        } else {
            // 详细表格
            output += 'ID   岗位名称           岗位代码        职级      所属部门           编制   在职    状态\n';
            output += '---  ------------------  -------------  --------  -----------------  -----  -----  ------\n';
            
            positions.forEach((pos) => {
                const name = (pos.position_name || '未命名').substring(0, 18).padEnd(18);
                const code = (pos.position_code || '-').substring(0, 13).padEnd(13);
                const level = (pos.position_level || '-').substring(0, 8).padEnd(8);
                const dept = (pos.dept_name || '-').substring(0, 17).padEnd(17);
                const headcount = String(pos.headcount || 0).padStart(5);
                const current = String(pos.current_count || 0).padStart(5);
                const status = pos.status === 1 ? '启用' : '禁用';
                
                output +=
                    String(pos.id).padEnd(4) + ' ' +
                    name + '  ' +
                    code + '  ' +
                    level + '  ' +
                    dept + '  ' +
                    headcount + '  ' +
                    current + '  ' +
                    status + '\n';
            });
            
            output += '\n' + '='.repeat(100) + '\n';
            output += '✅ 共 ' + positions.length + ' 个岗位\n\n';
            
            // 单独列出岗位名称
            output += '📝 岗位名称列表：\n';
            positions.forEach((pos, index) => {
                output += (index + 1) + '. ' + (pos.position_name || '未命名') + '\n';
            });
            output += '\n';
            
            // JSON格式数据
            output += '📊 JSON格式数据：\n';
            output += JSON.stringify(positions, null, 2) + '\n';
        }
        
        // 写入文件
        const outputPath = path.join(process.cwd(), 'positions-list.txt');
        fs.writeFileSync(outputPath, output, 'utf8');
        
        console.log('✅ 查询完成！结果已保存到: ' + outputPath);
        console.log('='.repeat(100) + '\n');
        
        // 简单输出到控制台
        console.log('📝 岗位名称列表：');
        positions.forEach((pos, index) => {
            console.log((index + 1) + '. ' + (pos.position_name || '未命名'));
        });
        console.log('\n✅ 共 ' + positions.length + ' 个岗位\n');
        
    } catch (error) {
        console.error('❌ 查询失败:', error.message);
        if (error.sql) {
            console.error('SQL语句:', error.sql);
        }
    }
    
    process.exit(0);
}

checkPositions();
