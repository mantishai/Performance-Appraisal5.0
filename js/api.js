const API_BASE_URL = '/api';

const ATTENDANCE_CONFIG = {
    WORK_START: '09:00',
    WORK_END: '18:00'
};

const mockData = {
    employees: [
        { id: 1, name: '张三', employeeNo: 'E001', department: '技术部', departmentId: 1, position: '前端工程师', positionId: 1, phone: '13800138001', email: 'zhangsan@company.com', entryDate: '2023-01-15', status: 1, probationEnd: '2023-04-15', birthday: '1995-03-15' },
        { id: 2, name: '李四', employeeNo: 'E002', department: '产品部', departmentId: 2, position: '产品经理', positionId: 3, phone: '13800138002', email: 'lisi@company.com', entryDate: '2023-02-20', status: 1, probationEnd: '2023-05-20', birthday: '1990-06-20' },
        { id: 3, name: '王五', employeeNo: 'E003', department: '技术部', departmentId: 1, position: '后端工程师', positionId: 2, phone: '13800138003', email: 'wangwu@company.com', entryDate: '2023-03-10', status: 1, probationEnd: '2023-06-10', birthday: '1992-08-10' },
        { id: 4, name: '赵六', employeeNo: 'E004', department: '市场部', departmentId: 3, position: '市场专员', positionId: 4, phone: '13800138004', email: 'zhaoliu@company.com', entryDate: '2023-04-05', status: 0, probationEnd: null, birthday: '1993-10-25' },
        { id: 5, name: '钱七', employeeNo: 'E005', department: '人事部', departmentId: 4, position: 'HR', positionId: 5, phone: '13800138005', email: 'qianqi@company.com', entryDate: '2023-05-12', status: 1, probationEnd: null, birthday: '1991-12-08' },
        { id: 6, name: '孙八', employeeNo: 'E006', department: '技术部', departmentId: 1, position: '实习生', positionId: 1, phone: '13800138006', email: 'sunba@company.com', entryDate: '2024-01-10', status: 2, probationEnd: '2024-04-10', birthday: '1998-07-20' }
    ],
    departments: [
        { id: 1, name: '技术部', parentId: null, manager: '张三', employeeCount: 3, children: [] },
        { id: 2, name: '产品部', parentId: null, manager: '李四', employeeCount: 1, children: [] },
        { id: 3, name: '市场部', parentId: null, manager: '赵六', employeeCount: 1, children: [] },
        { id: 4, name: '人事部', parentId: null, manager: '钱七', employeeCount: 1, children: [] }
    ],
    positions: [
        { id: 1, name: '前端工程师', departmentId: 1, departmentName: '技术部', level: 'P5', headcount: 10, current: 8, vacant: 2 },
        { id: 2, name: '后端工程师', departmentId: 1, departmentName: '技术部', level: 'P5', headcount: 15, current: 12, vacant: 3 },
        { id: 3, name: '产品经理', departmentId: 2, departmentName: '产品部', level: 'P6', headcount: 5, current: 5, vacant: 0 },
        { id: 4, name: '市场专员', departmentId: 3, departmentName: '市场部', level: 'P4', headcount: 8, current: 6, vacant: 2 },
        { id: 5, name: 'HR', departmentId: 4, departmentName: '人事部', level: 'P5', headcount: 3, current: 3, vacant: 0 }
    ],
    contracts: [
        { id: 1, employeeId: 1, employeeName: '张三', contractNo: 'C001', type: '全职', startDate: '2023-01-15', endDate: '2026-01-14', status: 1, salary: 15000 },
        { id: 2, employeeId: 2, employeeName: '李四', contractNo: 'C002', type: '全职', startDate: '2023-02-20', endDate: '2026-02-19', status: 1, salary: 18000 },
        { id: 3, employeeId: 3, employeeName: '王五', contractNo: 'C003', type: '全职', startDate: '2023-03-10', endDate: '2024-03-09', status: 1, salary: 14000 },
        { id: 4, employeeId: 4, employeeName: '赵六', contractNo: 'C004', type: '全职', startDate: '2023-04-05', endDate: '2024-04-04', status: 0, salary: 10000 }
    ],
    transfers: [
        { id: 1, employeeId: 1, employeeName: '张三', type: '转正', oldValue: '试用期', newValue: '正式员工', reason: '试用期表现优秀', applyDate: '2024-01-10', status: 'pending', approveDate: null, approver: null },
        { id: 2, employeeId: 3, employeeName: '王五', type: '调动', oldValue: '技术部-后端工程师', newValue: '技术部-前端工程师', reason: '个人发展需要', applyDate: '2024-01-08', status: 'approved', approveDate: '2024-01-12', approver: '钱七' },
        { id: 3, employeeId: 4, employeeName: '赵六', type: '离职', oldValue: '市场部-市场专员', newValue: '-', reason: '个人原因', applyDate: '2024-01-05', status: 'rejected', approveDate: '2024-01-07', approver: '钱七' }
    ],
    archives: {
        1: { employeeId: 1, items: [
            { key: 'idCard', name: '身份证', status: 'complete', date: '2023-01-15' },
            { key: 'degree', name: '学历证书', status: 'complete', date: '2023-01-15' },
            { key: 'contract', name: '劳动合同', status: 'complete', date: '2023-01-15' },
            { key: 'social', name: '社保卡', status: 'complete', date: '2023-01-20' },
            { key: '体检', name: '体检报告', status: 'missing', date: null }
        ]},
        2: { employeeId: 2, items: [
            { key: 'idCard', name: '身份证', status: 'complete', date: '2023-02-20' },
            { key: 'degree', name: '学历证书', status: 'complete', date: '2023-02-20' },
            { key: 'contract', name: '劳动合同', status: 'complete', date: '2023-02-20' },
            { key: 'social', name: '社保卡', status: 'complete', date: '2023-02-25' }
        ]}
    },
    attendanceRecords: [
        { id: 1, employeeId: 1, employeeName: '张三', department: '技术部', date: '2024-01-15', checkIn: '09:00', checkOut: '18:00', status: '正常' },
        { id: 2, employeeId: 1, employeeName: '张三', department: '技术部', date: '2024-01-16', checkIn: '08:55', checkOut: '18:05', status: '正常' },
        { id: 3, employeeId: 1, employeeName: '张三', department: '技术部', date: '2024-01-17', checkIn: '09:10', checkOut: '17:50', status: '迟到' },
        { id: 4, employeeId: 2, employeeName: '李四', department: '产品部', date: '2024-01-15', checkIn: '08:50', checkOut: '18:30', status: '正常' },
        { id: 5, employeeId: 3, employeeName: '王五', department: '技术部', date: '2024-01-15', checkIn: '09:30', checkOut: '18:00', status: '迟到' },
        { id: 6, employeeId: 3, employeeName: '王五', department: '技术部', date: '2024-01-16', checkIn: '09:40', checkOut: null, status: '缺卡' },
        { id: 7, employeeId: 3, employeeName: '王五', department: '技术部', date: '2024-01-17', checkIn: '09:50', checkOut: '17:30', status: '迟到' }
    ],
    leaves: [
        { id: 1, employeeId: 1, employeeName: '张三', department: '技术部', type: '年假', startDate: '2024-01-20', endDate: '2024-01-22', reason: '春节回家', status: 'pending', applyDate: '2024-01-10', approveDate: null, approver: null },
        { id: 2, employeeId: 2, employeeName: '李四', department: '产品部', type: '病假', startDate: '2024-01-18', endDate: '2024-01-18', reason: '身体不适', status: 'approved', applyDate: '2024-01-15', approveDate: '2024-01-15', approver: '钱七' }
    ],
    performancePlans: [
        { id: 1, name: '2024年Q1考核', cycle: 'quarterly', startDate: '2024-01-01', endDate: '2024-03-31', departments: ['技术部', '产品部', '市场部'], status: 'ongoing' },
        { id: 2, name: '2024年年度考核', cycle: 'yearly', startDate: '2024-12-01', endDate: '2024-12-31', departments: ['技术部', '产品部'], status: 'pending' }
    ],
    performanceKPIs: [
        { id: 1, name: '代码质量', type: 'quantitative', standardScore: 20, formula: 'Bug率<5%', dataSource: '测试报告' },
        { id: 2, name: '任务完成率', type: 'quantitative', standardScore: 25, formula: '(完成数/总任务数)*100%', dataSource: '项目管理系统' },
        { id: 3, name: '团队协作', type: 'qualitative', standardScore: 15, formula: '上级评定(1-100)', dataSource: '上级评价' },
        { id: 4, name: '技术分享', type: 'qualitative', standardScore: 10, formula: '分享次数', dataSource: '培训记录' },
        { id: 5, name: '工作态度', type: 'qualitative', standardScore: 15, formula: '上级评定(1-100)', dataSource: '上级评价' },
        { id: 6, name: '创新能力', type: 'qualitative', standardScore: 15, formula: '创新项目数', dataSource: '项目管理系统' }
    ],
    performanceEvaluations: [
        { id: 1, employeeId: 1, employeeName: '张三', planId: 1, planName: '2024年Q1考核', department: '技术部', position: '前端工程师', selfScore: 85, selfComment: '完成了多个项目，代码质量有所提升', selfStatus: 'completed', leaderScore: 88, leaderComment: '表现良好，值得肯定', leaderStatus: 'completed', finalScore: 86.5, grade: 'B', bonus: 1.2, rank: 3, status: 'completed' },
        { id: 2, employeeId: 2, employeeName: '李四', planId: 1, planName: '2024年Q1考核', department: '产品部', position: '产品经理', selfScore: 90, selfComment: '产品规划清晰，需求把控到位', selfStatus: 'completed', leaderScore: 92, leaderComment: '超出预期', leaderStatus: 'completed', finalScore: 91, grade: 'A', bonus: 1.5, rank: 1, status: 'completed' },
        { id: 3, employeeId: 3, employeeName: '王五', planId: 1, planName: '2024年Q1考核', department: '技术部', position: '后端工程师', selfScore: 78, selfComment: '完成了后端API开发', selfStatus: 'completed', leaderScore: 80, leaderComment: '中规中矩', leaderStatus: 'pending', finalScore: null, grade: null, bonus: null, rank: null, status: 'pending' },
        { id: 4, employeeId: 4, employeeName: '赵六', planId: 1, planName: '2024年Q1考核', department: '市场部', position: '市场专员', selfScore: null, selfComment: null, selfStatus: 'pending', leaderScore: null, leaderComment: null, leaderStatus: 'pending', finalScore: null, grade: null, bonus: null, rank: null, status: 'pending' }
    ],
    performanceAppeals: [
        { id: 1, employeeId: 3, employeeName: '王五', evaluationId: 3, reason: '认为评分偏低，代码质量评分不公', originalScore: 79, status: 'pending', handleComment: null, newScore: null }
    ],
    trainingCourses: [
        { id: 1, name: 'Vue3实战开发', category: '技术', lecturer: '张老师', lecturerIntro: '资深前端专家，10年开发经验', hours: 12, capacity: 50, enrolledCount: 32, startDate: '2025-05-20', endDate: '2025-05-22', status: 'open', outline: '1.Vue3新特性\n2.Composition API\n3.状态管理\n4.实战项目', target: '前端工程师' },
        { id: 2, name: '产品设计思维', category: '管理', lecturer: '李老师', lecturerIntro: '知名产品专家，曾任职腾讯', hours: 8, capacity: 30, enrolledCount: 25, startDate: '2025-05-25', endDate: '2025-05-26', status: 'open', outline: '1.用户研究\n2.需求分析\n3.产品设计\n4.案例分析', target: '产品经理' },
        { id: 3, name: '职场沟通技巧', category: '通用', lecturer: '王老师', lecturerIntro: '职业培训师，沟通力专家', hours: 6, capacity: 60, enrolledCount: 45, startDate: '2025-06-01', endDate: '2025-06-01', status: 'open', outline: '1.沟通原理\n2.技巧训练\n3.情景演练', target: '全体员工' }
    ],
    trainingRegistrations: [
        { id: 1, courseId: 1, employeeId: 1, status: 'registered', registerTime: '2025-05-01' },
        { id: 2, courseId: 1, employeeId: 2, status: 'registered', registerTime: '2025-05-02' },
        { id: 3, courseId: 2, employeeId: 2, status: 'registered', registerTime: '2025-05-03' }
    ],
    trainingSignins: [
        { id: 1, courseId: 1, employeeId: 1, signinTime: '2025-05-20 09:00', signinType: 'manual' },
        { id: 2, courseId: 1, employeeId: 2, signinTime: '2025-05-20 09:05', signinType: 'manual' }
    ],
    trainingRecords: [
        { id: 1, employeeId: 1, employeeName: '张三', courseId: 1, courseName: 'Vue3实战开发', trainingDate: '2025-05-20', actualHours: 12, assessmentResult: '优秀', certificateNo: 'CERT20250001', satisfaction: 4.8 },
        { id: 2, employeeId: 2, employeeName: '李四', courseId: 2, courseName: '产品设计思维', trainingDate: '2025-05-15', actualHours: 8, assessmentResult: '良好', certificateNo: 'CERT20250002', satisfaction: 4.5 }
    ],
    alerts: [
        { id: 1, type: 'contract', title: '合同到期提醒', description: '王五的合同将在30天内到期', level: 'high', date: '2024-02-09', status: 'pending', employeeId: 3 },
        { id: 2, type: 'birthday', title: '员工生日', description: '张三本月生日', level: 'low', date: '2024-03-15', status: 'pending', employeeId: 1 },
        { id: 3, type: 'probation', title: '试用期转正', description: '张三试用期将在7天内结束', level: 'medium', date: '2024-04-08', status: 'pending', employeeId: 1 }
    ],
    alertRules: [
        { id: 1, type: 'contract', name: '合同到期预警', enabled: true, days: 30 },
        { id: 2, type: 'birthday', name: '员工生日提醒', enabled: true, days: 7 },
        { id: 3, type: 'probation', name: '试用期转正', enabled: true, days: 7 },
        { id: 4, type: 'attendance', name: '考勤异常预警', enabled: true, days: 3 },
        { id: 5, type: 'recruitment', name: '职位超时预警', enabled: true, days: 30 },
        { id: 6, type: 'interview', name: '面试未评价提醒', enabled: true, days: 3 },
        { id: 7, type: 'performance', name: '考核周期提醒', enabled: true, days: 3 },
        { id: 8, type: 'selfReview', name: '自评截止提醒', enabled: true, days: 3 },
        { id: 9, type: 'leaderReview', name: '上级评截止提醒', enabled: true, days: 3 },
        { id: 10, type: 'training', name: '培训报名截止提醒', enabled: true, days: 1 },
        { id: 11, type: 'trainingSignin', name: '培训签到提醒', enabled: true, days: 0 }
    ],
    jobs: [
        { id: 1, title: '前端工程师', department: '技术部', location: '北京', salaryRange: '15k-25k', headcount: 3, status: 'open', description: '负责公司前端开发工作', requirements: '3年以上前端开发经验', publishDate: '2024-01-01' },
        { id: 2, title: '后端工程师', department: '技术部', location: '北京', salaryRange: '18k-30k', headcount: 5, status: 'open', description: '负责公司后端开发工作', requirements: '3年以上后端开发经验', publishDate: '2024-01-05' },
        { id: 3, title: '产品经理', department: '产品部', location: '上海', salaryRange: '20k-35k', headcount: 2, status: 'open', description: '负责产品规划与设计', requirements: '5年以上产品经验', publishDate: '2024-01-10' }
    ],
    candidates: [
        { id: 1, name: '张三', phone: '13800138001', email: 'zhangsan@example.com', position: '前端工程师', source: 'BOSS直聘', status: 'interviewing', workYears: 3, education: '本科', resumeText: '姓名：张三\n电话：13800138001\n邮箱：zhangsan@example.com\n工作年限：3年\n学历：本科', interviews: [] },
        { id: 2, name: '李四', phone: '13800138002', email: 'lisi@example.com', position: '后端工程师', source: '猎聘', status: 'offer', workYears: 5, education: '硕士', resumeText: '姓名：李四\n电话：13800138002\n邮箱：lisi@example.com\n工作年限：5年\n学历：硕士', interviews: [] },
        { id: 3, name: '王五', phone: '13800138003', email: 'wangwu@example.com', position: '前端工程师', source: '拉勾网', status: 'screening', workYears: 2, education: '本科', resumeText: '姓名：王五\n电话：13800138003\n邮箱：wangwu@example.com\n工作年限：2年\n学历：本科', interviews: [] },
        { id: 4, name: '赵六', phone: '13800138004', email: 'zhaoliu@example.com', position: '产品经理', source: 'BOSS直聘', status: 'rejected', workYears: 6, education: '本科', resumeText: '姓名：赵六\n电话：13800138004\n邮箱：zhaoliu@example.com\n工作年限：6年\n学历：本科', interviews: [] }
    ],
    interviews: [
        { id: 1, candidateId: 1, candidateName: '张三', position: '前端工程师', round: 1, interviewerId: 2, interviewerName: '李四', interviewTime: '2026-01-15 14:00', location: '会议室A', status: 'scheduled', evaluation: null },
        { id: 2, candidateId: 2, candidateName: '李四', position: '后端工程师', round: 2, interviewerId: 3, interviewerName: '王五', interviewTime: '2026-01-12 10:00', location: '会议室B', status: 'completed', evaluation: { rating: 4, strengths: '技术扎实', weaknesses: '表达需加强', overall: '推荐', recommended: true } },
        { id: 3, candidateId: 1, candidateName: '张三', position: '前端工程师', round: 2, interviewerId: 3, interviewerName: '王五', interviewTime: '2026-01-20 15:00', location: '会议室C', status: 'pending' }
    ],
    offers: [
        { id: 1, candidateId: 2, candidateName: '李四', position: '后端工程师', baseSalary: 22000, allowances: 3000, probationPercent: 80, probationMonths: 3, startDate: '2024-02-01', status: 'sent', sentDate: '2024-01-15' }
    ],
    keyPositions: [
        { id: 1, positionId: 1, positionName: '前端工程师', department: '技术部', criticalLevel: 'B', riskLevel: 'low', successorCount: 1, status: 'active' },
        { id: 2, positionId: 3, positionName: '产品经理', department: '产品部', criticalLevel: 'A', riskLevel: 'medium', successorCount: 2, status: 'active' }
    ],
    successors: [
        { id: 1, keyPositionId: 1, candidateId: 3, candidateName: '王五', currentPosition: '后端工程师', readiness: '2-3年', score: 85, strengths: '学习能力强，技术扎实', developmentNeeds: '需要学习前端框架' },
        { id: 2, keyPositionId: 2, candidateId: 1, candidateName: '张三', currentPosition: '前端工程师', readiness: '1年内', score: 90, strengths: '逻辑清晰，沟通能力强', developmentNeeds: '需要产品思维训练' },
        { id: 3, keyPositionId: 2, candidateId: 4, candidateName: '赵六', currentPosition: '市场专员', readiness: '3年以上', score: 75, strengths: '市场敏感度高', developmentNeeds: '需要产品相关培训' }
    ],
    nineGridData: [
        { id: 1, employeeId: 1, employeeName: '张三', department: '技术部', position: '前端工程师', performance: 'B', potential: '高', gridX: 3, gridY: 2, gridPosition: 'B1', developmentSuggestion: '管理能力培训' },
        { id: 2, employeeId: 2, employeeName: '李四', department: '产品部', position: '产品经理', performance: 'A', potential: '高', gridX: 3, gridY: 3, gridPosition: 'A1', developmentSuggestion: '高级产品管理培训' },
        { id: 3, employeeId: 3, employeeName: '王五', department: '技术部', position: '后端工程师', performance: 'B', potential: '中', gridX: 2, gridY: 2, gridPosition: 'B2', developmentSuggestion: '技术深度提升' },
        { id: 4, employeeId: 4, employeeName: '赵六', department: '市场部', position: '市场专员', performance: 'C', potential: '中', gridX: 2, gridY: 1, gridPosition: 'C2', developmentSuggestion: '工作态度改进' },
        { id: 5, employeeId: 5, employeeName: '钱七', department: '人事部', position: 'HR', performance: 'A', potential: '中', gridX: 2, gridY: 3, gridPosition: 'A2', developmentSuggestion: 'HR高级培训' }
    ],
    talentPool: [
        { id: 1, employeeId: 1, employeeName: '张三', poolType: 'high_potential', assessmentDate: '2024-01-15', nextReviewDate: '2024-07-15', developmentPlan: '参加领导力培训' },
        { id: 2, employeeId: 2, employeeName: '李四', poolType: 'high_potential', assessmentDate: '2024-01-10', nextReviewDate: '2024-07-10', developmentPlan: '产品战略培训' }
    ],
    talentStats: {
        totalKeyPositions: 15,
        coveredCount: 10,
        coverageRate: 66.7,
        highRiskCount: 3,
        mediumRiskCount: 5,
        lowRiskCount: 7
    },
    alertRecords: [
        { id: 1, type: 'contract', typeText: '合同到期', title: '合同到期提醒', content: '王五的合同将在30天内到期', level: 'high', targetId: 3, status: 'pending', createTime: '2024-02-09 09:00:00' },
        { id: 2, type: 'birthday', typeText: '生日祝福', title: '员工生日', content: '张三本月生日', level: 'low', targetId: 1, status: 'pending', createTime: '2024-03-15 09:00:00' },
        { id: 3, type: 'probation', typeText: '试用期转正', title: '试用期到期提醒', content: '张三试用期将在7天内结束', level: 'medium', targetId: 1, status: 'pending', createTime: '2024-04-08 09:00:00' },
        { id: 4, type: 'attendance', typeText: '考勤异常', title: '连续迟到警告', content: '王五连续3天迟到', level: 'high', targetId: 3, status: 'pending', createTime: '2024-01-20 09:00:00' }
    ],
    alertRuleConfigs: [
        { id: 1, ruleName: '合同到期提醒', ruleType: 'contract', triggerDays: 30, riskLevel: 'high', isEnabled: true, receiverRoles: ['hr', 'manager'] },
        { id: 2, ruleName: '员工生日提醒', ruleType: 'birthday', triggerDays: 3, riskLevel: 'low', isEnabled: true, receiverRoles: ['hr', 'manager', 'employee'] },
        { id: 3, ruleName: '试用期到期提醒', ruleType: 'probation', triggerDays: 15, riskLevel: 'medium', isEnabled: true, receiverRoles: ['hr', 'manager'] },
        { id: 4, ruleName: '考勤异常提醒', ruleType: 'attendance', triggerDays: 3, riskLevel: 'high', isEnabled: true, receiverRoles: ['hr', 'manager'] },
        { id: 5, ruleName: '离职风险预测', ruleType: 'turnover', triggerDays: 0, riskLevel: 'high', isEnabled: true, receiverRoles: ['hr', 'manager'] },
        { id: 6, ruleName: '职位超时提醒', ruleType: 'recruitment', triggerDays: 30, riskLevel: 'medium', isEnabled: true, receiverRoles: ['hr'] },
        { id: 7, ruleName: '绩效下滑提醒', ruleType: 'performance', triggerDays: 0, riskLevel: 'medium', isEnabled: true, receiverRoles: ['hr', 'manager'] },
        { id: 8, ruleName: '培训缺失提醒', ruleType: 'training', triggerDays: 365, riskLevel: 'low', isEnabled: true, receiverRoles: ['hr', 'manager'] }
    ],
    riskPredictions: [
        { id: 1, employeeId: 3, employeeName: '王五', riskScore: 85, riskLevel: 'high', factors: ['考勤异常', '绩效下滑', '请假频繁'], predictionDate: '2024-01-20' },
        { id: 2, employeeId: 4, employeeName: '赵六', riskScore: 65, riskLevel: 'medium', factors: ['离职风险'], predictionDate: '2024-01-20' },
        { id: 3, employeeId: 1, employeeName: '张三', riskScore: 25, riskLevel: 'low', factors: ['稳定'], predictionDate: '2024-01-20' }
    ],
    importRecords: [
        { id: 1, type: 'employee', fileName: '员工导入_20240101.xlsx', totalCount: 50, successCount: 48, failCount: 2, errorLogUrl: '/logs/error_1.xlsx', importBy: '张三', importTime: '2024-01-01 10:30:00', status: 'completed' },
        { id: 2, type: 'attendance', fileName: '考勤导入_20240105.xlsx', totalCount: 200, successCount: 198, failCount: 2, errorLogUrl: '/logs/error_2.xlsx', importBy: '李四', importTime: '2024-01-05 14:20:00', status: 'completed' },
        { id: 3, type: 'performance', fileName: '绩效导入_20240110.xlsx', totalCount: 30, successCount: 30, failCount: 0, errorLogUrl: null, importBy: '王五', importTime: '2024-01-10 09:15:00', status: 'completed' }
    ],
    reportTemplates: [
        { id: 1, name: '员工花名册', dataSource: 'employee', fields: ['name', 'employeeNo', 'department', 'position', 'entryDate'], filters: [{ field: 'status', operator: 'eq', value: '1' }], sortBy: 'entryDate', sortOrder: 'desc', chartType: 'table', createdBy: '张三', createTime: '2024-01-01' },
        { id: 2, name: '考勤月报', dataSource: 'attendance', fields: ['employeeName', 'date', 'checkIn', 'checkOut', 'status'], filters: [], sortBy: 'date', sortOrder: 'desc', chartType: 'table', createdBy: '李四', createTime: '2024-01-05' }
    ],
    archiveTables: [
        { id: 1, tableName: 'attendance_record', displayName: '考勤记录', canArchive: true, archiveThreshold: 1 },
        { id: 2, tableName: 'leave_record', displayName: '请假记录', canArchive: true, archiveThreshold: 1 },
        { id: 3, tableName: 'performance_evaluation', displayName: '绩效评估', canArchive: true, archiveThreshold: 2 },
        { id: 4, tableName: 'training_record', displayName: '培训记录', canArchive: true, archiveThreshold: 1 }
    ],
    archiveRecords: [
        { id: 1, tableName: 'attendance_record', archiveDate: '2024-01-01', dataStartDate: '2023-01-01', dataEndDate: '2023-12-31', recordCount: 36000, status: 'archived', operator: '张三' },
        { id: 2, tableName: 'leave_record', archiveDate: '2024-01-01', dataStartDate: '2023-01-01', dataEndDate: '2023-12-31', recordCount: 1200, status: 'archived', operator: '李四' }
    ],
    reportFields: {
        employee: [
            { name: 'name', displayName: '姓名', type: 'string' },
            { name: 'employeeNo', displayName: '工号', type: 'string' },
            { name: 'department', displayName: '部门', type: 'string' },
            { name: 'position', displayName: '岗位', type: 'string' },
            { name: 'entryDate', displayName: '入职日期', type: 'date' },
            { name: 'status', displayName: '状态', type: 'number' }
        ],
        attendance: [
            { name: 'employeeName', displayName: '员工', type: 'string' },
            { name: 'date', displayName: '日期', type: 'date' },
            { name: 'checkIn', displayName: '签到时间', type: 'time' },
            { name: 'checkOut', displayName: '签退时间', type: 'time' },
            { name: 'status', displayName: '状态', type: 'string' }
        ],
        performance: [
            { name: 'employeeName', displayName: '员工', type: 'string' },
            { name: 'period', displayName: '周期', type: 'string' },
            { name: 'score', displayName: '得分', type: 'number' },
            { name: 'grade', displayName: '等级', type: 'string' }
        ]
    },
    openapiApps: [
        { id: 1, appName: 'OA系统', appKey: 'AK_1234567890', appSecret: 'SK_abcdef1234567890', status: 'active', callbackUrl: 'https://oa.example.com/callback', ipWhitelist: ['192.168.1.0/24'], qpsLimit: 100, dailyLimit: 10000, createTime: '2025-01-01', lastCallTime: '2025-05-01 10:30:00' },
        { id: 2, appName: '财务系统', appKey: 'AK_0987654321', appSecret: 'SK_098765fedcba4321', status: 'active', callbackUrl: 'https://finance.example.com/callback', ipWhitelist: ['10.0.0.0/8'], qpsLimit: 50, dailyLimit: 5000, createTime: '2025-02-15', lastCallTime: '2025-05-01 09:15:00' }
    ],
    openapiAPIs: [
        { id: 1, module: 'employee', name: '获取员工列表', path: '/api/employee/list', method: 'GET', description: '分页获取员工列表' },
        { id: 2, module: 'employee', name: '获取员工详情', path: '/api/employee/{id}', method: 'GET', description: '根据ID获取员工详细信息' },
        { id: 3, module: 'employee', name: '新增员工', path: '/api/employee/create', method: 'POST', description: '创建新员工' },
        { id: 4, module: 'employee', name: '更新员工', path: '/api/employee/update', method: 'PUT', description: '更新员工信息' },
        { id: 5, module: 'attendance', name: '获取考勤记录', path: '/api/attendance/list', method: 'GET', description: '获取考勤记录列表' },
        { id: 6, module: 'attendance', name: '打卡', path: '/api/attendance/checkin', method: 'POST', description: '员工打卡' },
        { id: 7, module: 'contract', name: '获取合同列表', path: '/api/contract/list', method: 'GET', description: '获取合同列表' },
        { id: 8, module: 'contract', name: '获取合同详情', path: '/api/contract/{id}', method: 'GET', description: '获取合同详情' },
        { id: 9, module: 'recruitment', name: '获取职位列表', path: '/api/recruitment/jobs', method: 'GET', description: '获取招聘职位列表' },
        { id: 10, module: 'recruitment', name: '获取候选人', path: '/api/recruitment/candidates', method: 'GET', description: '获取候选人列表' }
    ],
    openapiPermissions: [
        { appId: 1, apiId: 1, permission: 'read' },
        { appId: 1, apiId: 2, permission: 'read' },
        { appId: 1, apiId: 5, permission: 'read' },
        { appId: 1, apiId: 6, permission: 'write' },
        { appId: 2, apiId: 1, permission: 'read' },
        { appId: 2, apiId: 7, permission: 'read' },
        { appId: 2, apiId: 8, permission: 'read' }
    ],
    openapiLogs: [
        { id: 1, appId: 1, appName: 'OA系统', apiPath: '/api/employee/list', method: 'GET', statusCode: 200, responseTime: 45, clientIp: '192.168.1.100', requestTime: '2025-05-01 10:30:00' },
        { id: 2, appId: 1, appName: 'OA系统', apiPath: '/api/attendance/checkin', method: 'POST', statusCode: 200, responseTime: 89, clientIp: '192.168.1.100', requestTime: '2025-05-01 10:32:00' },
        { id: 3, appId: 2, appName: '财务系统', apiPath: '/api/contract/list', method: 'GET', statusCode: 200, responseTime: 56, clientIp: '10.0.0.50', requestTime: '2025-05-01 09:15:00' }
    ],
    openapiDoc: {
        employee: [
            { 
                id: 1, 
                module: 'employee', 
                name: '获取员工列表', 
                path: '/api/employee/list', 
                method: 'GET', 
                description: '分页获取员工列表',
                params: [
                    { name: 'page', type: 'number', required: false, description: '页码，默认1' },
                    { name: 'pageSize', type: 'number', required: false, description: '每页数量，默认10' },
                    { name: 'keyword', type: 'string', required: false, description: '搜索关键词' }
                ],
                responseExample: {
                    code: 200,
                    message: 'success',
                    data: {
                        list: [{ id: 1, name: '张三', employeeNo: 'E001', department: '技术部' }],
                        total: 100,
                        page: 1,
                        pageSize: 10
                    }
                }
            },
            { 
                id: 2, 
                module: 'employee', 
                name: '获取员工详情', 
                path: '/api/employee/{id}', 
                method: 'GET', 
                description: '根据ID获取员工详细信息',
                params: [
                    { name: 'id', type: 'number', required: true, description: '员工ID' }
                ],
                responseExample: {
                    code: 200,
                    message: 'success',
                    data: {
                        id: 1,
                        name: '张三',
                        employeeNo: 'E001',
                        department: '技术部',
                        position: '前端工程师',
                        phone: '13800138001'
                    }
                }
            },
            { 
                id: 3, 
                module: 'employee', 
                name: '新增员工', 
                path: '/api/employee/create', 
                method: 'POST', 
                description: '创建新员工',
                params: [
                    { name: 'name', type: 'string', required: true, description: '姓名' },
                    { name: 'employeeNo', type: 'string', required: true, description: '工号' },
                    { name: 'department', type: 'string', required: true, description: '部门' }
                ],
                responseExample: {
                    code: 200,
                    message: 'success',
                    data: { id: 100, name: '新员工' }
                }
            },
            { 
                id: 4, 
                module: 'employee', 
                name: '更新员工', 
                path: '/api/employee/update', 
                method: 'PUT', 
                description: '更新员工信息',
                params: [
                    { name: 'id', type: 'number', required: true, description: '员工ID' },
                    { name: 'name', type: 'string', required: false, description: '姓名' }
                ],
                responseExample: {
                    code: 200,
                    message: 'success',
                    data: { id: 1, name: '更新后' }
                }
            }
        ],
        attendance: [
            { 
                id: 5, 
                module: 'attendance', 
                name: '获取考勤记录', 
                path: '/api/attendance/list', 
                method: 'GET', 
                description: '获取考勤记录列表',
                params: [
                    { name: 'employeeId', type: 'number', required: false, description: '员工ID' },
                    { name: 'startDate', type: 'string', required: false, description: '开始日期' },
                    { name: 'endDate', type: 'string', required: false, description: '结束日期' }
                ],
                responseExample: {
                    code: 200,
                    message: 'success',
                    data: [{ id: 1, employeeName: '张三', date: '2025-05-01', status: '正常' }]
                }
            },
            { 
                id: 6, 
                module: 'attendance', 
                name: '打卡', 
                path: '/api/attendance/checkin', 
                method: 'POST', 
                description: '员工打卡',
                params: [
                    { name: 'employeeId', type: 'number', required: true, description: '员工ID' },
                    { name: 'type', type: 'string', required: true, description: '打卡类型：in/out' }
                ],
                responseExample: {
                    code: 200,
                    message: '打卡成功',
                    data: { id: 100, checkIn: '2025-05-01 09:00:00' }
                }
            }
        ]
    },
    systemUsers: [
        { id: 1, username: 'admin', name: '管理员', role: 'super_admin', email: 'admin@example.com', phone: '13800138001', password: 'hashed_******', status: 'active', lastLoginTime: '2026-05-01 09:00:00' },
        { id: 2, username: 'hr1', name: 'HR管理员', role: 'hr_admin', email: 'hr@example.com', phone: '13800138002', password: 'hashed_******', status: 'active', lastLoginTime: '2026-05-01 09:10:00' },
        { id: 3, username: 'manager1', name: '部门经理', role: 'department_manager', email: 'manager@example.com', phone: '13800138003', password: 'hashed_******', status: 'active', lastLoginTime: '2026-05-01 09:20:00' },
        { id: 4, username: 'emp1', name: '普通员工', role: 'employee', email: 'emp1@example.com', phone: '13800138004', password: 'hashed_******', status: 'active', lastLoginTime: '2026-05-01 09:30:00' }
    ],
    systemRoles: [
        { id: 1, name: '超级管理员', code: 'super_admin', userCount: 1, status: 'active' },
        { id: 2, name: 'HR管理员', code: 'hr_admin', userCount: 1, status: 'active' },
        { id: 3, name: '部门经理', code: 'department_manager', userCount: 1, status: 'active' },
        { id: 4, name: '普通员工', code: 'employee', userCount: 1, status: 'active' }
    ],
    systemPermissions: [
        { id: 1, module: 'employee', name: '员工查看', code: 'employee:view' },
        { id: 2, module: 'employee', name: '员工新增', code: 'employee:create' },
        { id: 3, module: 'employee', name: '员工编辑', code: 'employee:edit' },
        { id: 4, module: 'employee', name: '员工删除', code: 'employee:delete' },
        { id: 5, module: 'employee', name: '员工导出', code: 'employee:export' },
        { id: 6, module: 'personnel', name: '人事查看', code: 'personnel:view' },
        { id: 7, module: 'personnel', name: '人事新增', code: 'personnel:create' },
        { id: 8, module: 'personnel', name: '人事编辑', code: 'personnel:edit' },
        { id: 9, module: 'personnel', name: '人事删除', code: 'personnel:delete' },
        { id: 10, module: 'attendance', name: '考勤查看', code: 'attendance:view' },
        { id: 11, module: 'attendance', name: '考勤打卡', code: 'attendance:checkin' },
        { id: 12, module: 'attendance', name: '考勤审批', code: 'attendance:approve' },
        { id: 13, module: 'recruitment', name: '招聘查看', code: 'recruitment:view' },
        { id: 14, module: 'recruitment', name: '招聘发布', code: 'recruitment:publish' },
        { id: 15, module: 'recruitment', name: '招聘面试', code: 'recruitment:interview' },
        { id: 16, module: 'recruitment', name: '招聘录用', code: 'recruitment:hire' },
        { id: 17, module: 'performance', name: '绩效查看', code: 'performance:view' },
        { id: 18, module: 'performance', name: '绩效自评', code: 'performance:self_evaluate' },
        { id: 19, module: 'performance', name: '绩效他评', code: 'performance:others_evaluate' },
        { id: 20, module: 'performance', name: '绩效申诉', code: 'performance:appeal' },
        { id: 21, module: 'training', name: '培训查看', code: 'training:view' },
        { id: 22, module: 'training', name: '培训报名', code: 'training:register' },
        { id: 23, module: 'training', name: '培训管理', code: 'training:manage' },
        { id: 24, module: 'system', name: '用户管理', code: 'system:users' },
        { id: 25, module: 'system', name: '角色管理', code: 'system:roles' },
        { id: 26, module: 'system', name: '系统设置', code: 'system:settings' }
    ],
    rolePermissions: {
        1: ['employee:view', 'employee:create', 'employee:edit', 'employee:delete', 'employee:export', 'personnel:view', 'personnel:create', 'personnel:edit', 'personnel:delete', 'attendance:view', 'attendance:checkin', 'attendance:approve', 'recruitment:view', 'recruitment:publish', 'recruitment:interview', 'recruitment:hire', 'performance:view', 'performance:self_evaluate', 'performance:others_evaluate', 'performance:appeal', 'training:view', 'training:register', 'training:manage', 'system:users', 'system:roles', 'system:settings'],
        2: ['employee:view', 'employee:create', 'employee:edit', 'employee:export', 'personnel:view', 'personnel:create', 'personnel:edit', 'personnel:delete', 'attendance:view', 'attendance:approve', 'recruitment:view', 'recruitment:publish', 'recruitment:interview', 'recruitment:hire', 'performance:view', 'training:view', 'training:manage'],
        3: ['employee:view', 'attendance:view', 'attendance:approve', 'performance:view', 'performance:others_evaluate', 'recruitment:view', 'recruitment:interview', 'training:view'],
        4: ['employee:view', 'attendance:view', 'attendance:checkin', 'performance:view', 'performance:self_evaluate', 'performance:appeal', 'training:view', 'training:register']
    },
    systemLogs: [
        { id: 1, userId: 1, username: '管理员', module: 'employee', action: '新增员工', content: '新增员工：张三', ip: '192.168.1.100', createTime: '2025-05-01 10:30:00', status: 'success' },
        { id: 2, userId: 2, username: 'HR管理员', module: 'attendance', action: '审批请假', content: '审批请假：李四', ip: '192.168.1.101', createTime: '2025-05-01 11:00:00', status: 'success' },
        { id: 3, userId: 1, username: '管理员', module: 'system', action: '系统设置', content: '修改系统名称', ip: '192.168.1.100', createTime: '2025-05-01 14:00:00', status: 'success' },
        { id: 4, userId: 3, username: '部门经理', module: 'recruitment', action: '发布职位', content: '发布职位：前端工程师', ip: '192.168.1.102', createTime: '2025-05-01 15:30:00', status: 'success' }
    ],
    systemConfigs: [
        { id: 1, key: 'system_name', value: 'HRMS', description: '系统名称' },
        { id: 2, key: 'theme_color', value: '#1890ff', description: '主题色' },
        { id: 3, key: 'session_timeout', value: '3600', description: '会话超时(秒)' },
        { id: 4, key: 'password_policy', value: '6', description: '密码最小长度' },
        { id: 5, key: 'login_attempts', value: '5', description: '登录尝试次数' },
        { id: 6, key: 'file_upload_limit', value: '10', description: '文件上传大小限制(MB)' },
        { id: 7, key: 'smtp_server', value: 'smtp.example.com', description: 'SMTP服务器' },
        { id: 8, key: 'smtp_port', value: '587', description: 'SMTP端口' },
        { id: 9, key: 'smtp_user', value: 'noreply@example.com', description: '发件人邮箱' }
    ],
    systemAnnouncements: [
        { id: 1, title: '系统升级通知', content: '系统将于今晚22:00-24:00进行系统升级，升级期间系统将暂时无法使用，请提前做好相关工作安排。', publishTime: '2025-05-01', isTop: true },
        { id: 2, title: '新功能上线', content: '考勤管理新增月度考勤统计功能已上线，欢迎使用！', publishTime: '2025-04-28', isTop: false },
        { id: 3, title: '培训课程报名', content: '2025年度第二期培训课程开始报名，有兴趣的员工请登录系统报名。', publishTime: '2025-04-25', isTop: false }
    ],
    systemTodos: [
        { id: 1, title: '提交月度报告', completed: false, createTime: '2025-05-01', dueTime: '2025-05-05' },
        { id: 2, title: '完成绩效考核', completed: true, createTime: '2025-04-20', dueTime: '2025-04-30' },
        { id: 3, title: '参加部门会议', completed: false, createTime: '2025-05-02', dueTime: '2025-05-02' }
    ],
    systemSchedule: [
        { id: 1, title: '部门周会', time: '2025-05-02 09:00', location: '会议室A', type: 'meeting' },
        { id: 2, title: '项目评审', time: '2025-05-02 14:00', location: '会议室B', type: 'task' },
        { id: 3, title: '培训课程', time: '2025-05-03 10:00', location: '培训室', type: 'training' }
    ],
    currentUser: {
        id: 1,
        username: 'admin',
        name: '管理员',
        role: 'super_admin',
        email: 'admin@example.com',
        phone: '13800138001',
        permissions: ['employee:view', 'employee:create', 'employee:edit', 'employee:delete', 'employee:export', 'personnel:view', 'personnel:create', 'personnel:edit', 'personnel:delete', 'attendance:view', 'attendance:checkin', 'attendance:approve', 'recruitment:view', 'recruitment:publish', 'recruitment:interview', 'recruitment:hire', 'performance:view', 'performance:self_evaluate', 'performance:others_evaluate', 'performance:appeal', 'training:view', 'training:register', 'training:manage', 'system:users', 'system:roles', 'system:settings']
    }
};

const API = {
    useMock: false,

    delay(ms = 300) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    parseResume(text) {
        const lines = text.split('\n');
        const result = { name: '', phone: '', email: '', workYears: 0, education: '' };
        lines.forEach(line => {
            if (line.includes('姓名：')) result.name = line.split('姓名：')[1].trim();
            else if (line.includes('电话：')) result.phone = line.split('电话：')[1].trim();
            else if (line.includes('邮箱：')) result.email = line.split('邮箱：')[1].trim();
            else if (line.includes('工作年限：')) result.workYears = parseInt(line.split('工作年限：')[1]) || 0;
            else if (line.includes('学历：')) result.education = line.split('学历：')[1].trim();
        });
        return result;
    },

    getTemplateFields(type) {
        const fieldsMap = {
            employee: ['姓名', '工号', '部门', '岗位', '入职日期', '联系电话', '邮箱'],
            attendance: ['工号', '姓名', '日期', '签到时间', '签退时间'],
            performance: ['工号', '姓名', '考核周期', '得分', '等级']
        };
        return fieldsMap[type] || [];
    },

    getPreviewData(type) {
        if (type === 'employee') {
            return [
                { name: '员工A', employeeNo: 'E001', department: '技术部', position: '前端工程师', entryDate: '2024-01-01', phone: '13800138001', email: 'a@example.com' },
                { name: '员工B', employeeNo: 'E002', department: '产品部', position: '产品经理', entryDate: '2024-01-05', phone: '13800138002', email: 'b@example.com' },
                { name: '员工C', employeeNo: 'E003', department: '市场部', position: '市场专员', entryDate: '2024-01-10', phone: '13800138003', email: 'c@example.com' },
                { name: '员工D', employeeNo: 'E004', department: '人事部', position: 'HR', entryDate: '2024-01-15', phone: '13800138004', email: 'd@example.com' }
            ];
        } else if (type === 'attendance') {
            return [
                { employeeNo: 'E001', employeeName: '员工A', date: '2024-01-01', checkIn: '09:00', checkOut: '18:00' },
                { employeeNo: 'E002', employeeName: '员工B', date: '2024-01-01', checkIn: '08:55', checkOut: '18:15' }
            ];
        } else if (type === 'performance') {
            return [
                { employeeNo: 'E001', employeeName: '员工A', period: '2024Q1', score: 90, grade: 'A' },
                { employeeNo: 'E002', employeeName: '员工B', period: '2024Q1', score: 85, grade: 'B' }
            ];
        }
        return [];
    },

    getFieldMapping(type) {
        const mapping = {
            employee: { '姓名': 'name', '工号': 'employeeNo', '部门': 'department', '岗位': 'position', '入职日期': 'entryDate', '联系电话': 'phone', '邮箱': 'email' },
            attendance: { '工号': 'employeeNo', '姓名': 'employeeName', '日期': 'date', '签到时间': 'checkIn', '签退时间': 'checkOut' },
            performance: { '工号': 'employeeNo', '姓名': 'employeeName', '考核周期': 'period', '得分': 'score', '等级': 'grade' }
        };
        return mapping[type] || {};
    },

    getReportPreviewData(config) {
        const { dataSource = 'employee', fields = [], filters = [] } = config;
        
        if (dataSource === 'employee') {
            const data = [
                { name: '张三', employeeNo: 'E001', department: '技术部', position: '前端工程师', entryDate: '2023-01-15', status: 1 },
                { name: '李四', employeeNo: 'E002', department: '产品部', position: '产品经理', entryDate: '2023-02-20', status: 1 },
                { name: '王五', employeeNo: 'E003', department: '技术部', position: '后端工程师', entryDate: '2023-03-10', status: 1 },
                { name: '赵六', employeeNo: 'E004', department: '市场部', position: '市场专员', entryDate: '2023-04-05', status: 1 },
                { name: '钱七', employeeNo: 'E005', department: '人事部', position: 'HR', entryDate: '2023-05-12', status: 1 }
            ];
            return data.map(item => {
                const result = {};
                fields.forEach(field => {
                    result[field] = item[field];
                });
                return result;
            });
        } else if (dataSource === 'attendance') {
            const data = [
                { employeeName: '张三', date: '2024-01-01', checkIn: '09:00', checkOut: '18:00', status: '正常' },
                { employeeName: '李四', date: '2024-01-01', checkIn: '08:55', checkOut: '18:15', status: '正常' },
                { employeeName: '王五', date: '2024-01-01', checkIn: '09:15', checkOut: '17:30', status: '迟到' }
            ];
            return data.map(item => {
                const result = {};
                fields.forEach(field => {
                    result[field] = item[field];
                });
                return result;
            });
        } else if (dataSource === 'performance') {
            const data = [
                { employeeName: '张三', period: '2024Q1', score: 90, grade: 'A' },
                { employeeName: '李四', period: '2024Q1', score: 85, grade: 'B' },
                { employeeName: '王五', period: '2024Q1', score: 78, grade: 'B' }
            ];
            return data.map(item => {
                const result = {};
                fields.forEach(field => {
                    result[field] = item[field];
                });
                return result;
            });
        }
        return [];
    },

    getArchivePreviewData(config) {
        const { tableName, startDate, endDate } = config;
        const recordCount = Math.floor(Math.random() * 5000) + 1000;
        return {
            tableName,
            displayName: this.getTableDisplayName(tableName),
            recordCount,
            startDate,
            endDate
        };
    },

    getTableDisplayName(tableName) {
        const displayNames = {
            'attendance_record': '考勤记录',
            'leave_record': '请假记录',
            'performance_evaluation': '绩效评估',
            'training_record': '培训记录'
        };
        return displayNames[tableName] || tableName;
    },

    calculateGrade(score) {
        if (score >= 95) return 'S';
        if (score >= 85) return 'A';
        if (score >= 75) return 'B';
        if (score >= 60) return 'C';
        return 'D';
    },

    calculateBonus(score) {
        if (score >= 95) return 2.0;
        if (score >= 85) return 1.5;
        if (score >= 75) return 1.2;
        if (score >= 60) return 1.0;
        return 0.8;
    },

    async request(url, options = {}) {
        if (this.useMock) {
            await this.delay();
            return this.mockRequest(url, options);
        }
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...options.headers }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    mockRequest(url, options = {}) {
        const method = options.method || 'GET';
        const body = options.body ? JSON.parse(options.body) : {};

        if (url.includes('/dashboard')) {
            const pendingLeaves = mockData.leaves.filter(l => l.status === 'pending').length;
            return { code: 200, data: { totalEmployees: mockData.employees.length, newJoin: 5, leave: 2, pending: pendingLeaves }, message: 'success' };
        }

        if (url.includes('/employees')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.employees, message: 'success' };
            }
            if (method === 'POST') {
                const dept = mockData.departments.find(d => d.name === body.department);
                const pos = mockData.positions.find(p => p.name === body.position);
                
                const newEmployee = { 
                    ...body, 
                    id: Date.now(),
                    departmentId: dept?.id || 1,
                    positionId: pos?.id || 1,
                    email: body.email || `${body.employeeNo}@company.com`,
                    potentialTag: body.potentialTag || '中坚'
                };
                mockData.employees.push(newEmployee);
                return { code: 200, data: newEmployee, message: 'success' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/employees\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.employees.findIndex(e => e.id === id);
                    if (index > -1) {
                        mockData.employees[index] = { ...mockData.employees[index], ...body };
                        return { code: 200, data: mockData.employees[index], message: 'success' };
                    }
                }
                return { code: 404, data: null, message: 'Employee not found' };
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/employees\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.employees.findIndex(e => e.id === id);
                    if (index > -1) {
                        mockData.employees.splice(index, 1);
                        return { code: 200, data: null, message: 'success' };
                    }
                }
                return { code: 404, data: null, message: 'Employee not found' };
            }
        }

        if (url.includes('/org/departments')) {
            if (method === 'GET') return { code: 200, data: mockData.departments, message: 'success' };
            if (method === 'POST') {
                const newDept = { ...body, id: Date.now(), employeeCount: 0, children: [] };
                mockData.departments.push(newDept);
                return { code: 200, data: newDept, message: 'success' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/org\/department\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.departments.findIndex(d => d.id === id);
                    if (index > -1) {
                        mockData.departments[index] = { ...mockData.departments[index], ...body };
                        return { code: 200, data: mockData.departments[index], message: 'success' };
                    }
                }
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/org\/department\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.departments.findIndex(d => d.id === id);
                    if (index > -1) {
                        const hasChildren = mockData.departments.some(d => d.parentId === id);
                        if (hasChildren) return { code: 400, data: null, message: '该部门下有子部门，无法删除' };
                        const hasEmployees = mockData.employees.some(e => e.departmentId === id);
                        if (hasEmployees) return { code: 400, data: null, message: '该部门下有员工，无法删除' };
                        mockData.departments.splice(index, 1);
                        return { code: 200, data: null, message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/org/positions')) {
            if (method === 'GET') return { code: 200, data: mockData.positions, message: 'success' };
            if (method === 'POST') {
                const dept = mockData.departments.find(d => d.id === body.departmentId);
                const newPos = { ...body, id: Date.now(), departmentName: dept?.name || '', current: 0, vacant: body.headcount || 0 };
                mockData.positions.push(newPos);
                return { code: 200, data: newPos, message: 'success' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/org\/position\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.positions.findIndex(p => p.id === id);
                    if (index > -1) {
                        const dept = mockData.departments.find(d => d.id === body.departmentId);
                        mockData.positions[index] = { ...mockData.positions[index], ...body, departmentName: dept?.name || mockData.positions[index].departmentName };
                        return { code: 200, data: mockData.positions[index], message: 'success' };
                    }
                }
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/org\/position\/(\d+)/);
                if (idMatch) {                    const id = parseInt(idMatch[1]);
                    const index = mockData.positions.findIndex(p => p.id === id);
                    if (index > -1) {
                        const hasEmployees = mockData.employees.some(e => e.positionId === id);
                        if (hasEmployees) return { code: 400, data: null, message: '该岗位下有员工，无法删除' };
                        mockData.positions.splice(index, 1);
                        return { code: 200, data: null, message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/hr/contracts')) {
            if (method === 'GET') return { code: 200, data: mockData.contracts, message: 'success' };
            if (method === 'POST') {
                const newContract = { ...body, id: Date.now(), status: 1 };
                mockData.contracts.push(newContract);
                return { code: 200, data: newContract, message: 'success' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/hr\/contract\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.contracts.findIndex(c => c.id === id);
                    if (index > -1) {
                        if (url.includes('/renew')) {
                            mockData.contracts[index] = { ...mockData.contracts[index], ...body, status: 1 };
                            return { code: 200, data: mockData.contracts[index], message: '合同续签成功' };
                        }
                        if (url.includes('/terminate')) {
                            mockData.contracts[index] = { ...mockData.contracts[index], ...body, status: 0 };
                            return { code: 200, data: mockData.contracts[index], message: '合同已终止' };
                        }
                        mockData.contracts[index] = { ...mockData.contracts[index], ...body };
                        return { code: 200, data: mockData.contracts[index], message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/hr/transfers')) {
            if (method === 'GET') return { code: 200, data: mockData.transfers, message: 'success' };
            if (method === 'POST') {
                const newTransfer = { ...body, id: Date.now(), status: 'pending', applyDate: new Date().toISOString().split('T')[0], approveDate: null, approver: null };
                mockData.transfers.push(newTransfer);
                return { code: 200, data: newTransfer, message: 'success' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/hr\/transfer\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.transfers.findIndex(t => t.id === id);
                    if (index > -1) {
                        if (url.includes('/approve')) {
                            mockData.transfers[index].status = 'approved';
                            mockData.transfers[index].approveDate = new Date().toISOString().split('T')[0];
                            mockData.transfers[index].approver = body.approver || '管理员';
                            const emp = mockData.employees.find(e => e.id === mockData.transfers[index].employeeId);
                            if (emp && mockData.transfers[index].type === '转正') {
                                emp.probationEnd = null;
                            }
                            return { code: 200, data: mockData.transfers[index], message: '审批通过' };
                        }
                        if (url.includes('/reject')) {
                            mockData.transfers[index].status = 'rejected';
                            mockData.transfers[index].approveDate = new Date().toISOString().split('T')[0];
                            mockData.transfers[index].approver = body.approver || '管理员';
                            return { code: 200, data: mockData.transfers[index], message: '已拒绝' };
                        }
                    }
                }
            }
        }

        if (url.includes('/hr/archive')) {
            const empIdMatch = url.match(/\/hr\/archive\/(\d+)/);
            if (empIdMatch) {
                const empId = parseInt(empIdMatch[1]);
                if (!mockData.archives[empId]) {
                    mockData.archives[empId] = { employeeId: empId, items: [
                        { key: 'idCard', name: '身份证', status: 'missing', date: null },
                        { key: 'degree', name: '学历证书', status: 'missing', date: null },
                        { key: 'contract', name: '劳动合同', status: 'missing', date: null },
                        { key: 'social', name: '社保卡', status: 'missing', date: null }
                    ]};
                }
                return { code: 200, data: mockData.archives[empId], message: 'success' };
            }
            if (method === 'PUT') {
                const empId = body.employeeId;
                if (empId && mockData.archives[empId]) {
                    mockData.archives[empId] = body;
                    return { code: 200, data: mockData.archives[empId], message: 'success' };
                }
            }
        }

        if (url.includes('/attendance/checkin')) {
            if (method === 'POST') {
                const today = new Date().toISOString().split('T')[0];
                const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                let existingRecord = mockData.attendanceRecords.find(r => r.employeeId === body.employeeId && r.date === today);
                
                if (existingRecord) {
                    if (body.type === 'in' && !existingRecord.checkIn) {
                        existingRecord.checkIn = now;
                        existingRecord.status = existingRecord.checkIn > ATTENDANCE_CONFIG.WORK_START ? '迟到' : '正常';
                    } else if (body.type === 'out' && !existingRecord.checkOut) {
                        existingRecord.checkOut = now;
                        if (existingRecord.status === '正常' && existingRecord.checkOut < ATTENDANCE_CONFIG.WORK_END) {
                            existingRecord.status = '早退';
                        }
                    }
                } else {
                    const emp = mockData.employees.find(e => e.id === body.employeeId);
                    const status = body.type === 'in' && now > ATTENDANCE_CONFIG.WORK_START ? '迟到' : '正常';
                    const newRecord = {
                        id: Date.now(),
                        employeeId: body.employeeId,
                        employeeName: emp?.name || '',
                        department: emp?.department || '',
                        date: today,
                        checkIn: body.type === 'in' ? now : null,
                        checkOut: body.type === 'out' ? now : null,
                        status: body.type === 'in' ? status : '缺卡'
                    };
                    mockData.attendanceRecords.push(newRecord);
                    existingRecord = newRecord;
                }
                return { code: 200, data: existingRecord, message: '打卡成功' };
            }
        }

        if (url.includes('/attendance/records')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const employeeId = urlParams.get('employeeId');
            const month = urlParams.get('month');
            let records = [...mockData.attendanceRecords];
            
            if (employeeId) {
                records = records.filter(r => r.employeeId === parseInt(employeeId));
            }
            if (month) {
                records = records.filter(r => r.date.startsWith(month));
            }
            return { code: 200, data: records, message: 'success' };
        }

        if (url.includes('/attendance/summary')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const month = urlParams.get('month');
            const year = month ? parseInt(month.split('-')[0]) : new Date().getFullYear();
            const monthNum = month ? parseInt(month.split('-')[1]) : new Date().getMonth() + 1;
            
            const summary = mockData.employees.map(emp => {
                const empRecords = mockData.attendanceRecords.filter(r => 
                    r.employeeId === emp.id && 
                    r.date.startsWith(`${year}-${String(monthNum).padStart(2, '0')}`)
                );
                const attendanceDays = empRecords.filter(r => r.status !== '缺卡').length;
                const lateCount = empRecords.filter(r => r.status === '迟到').length;
                const earlyLeaveCount = empRecords.filter(r => r.status === '早退').length;
                const leaveDays = mockData.leaves.filter(l => 
                    l.employeeId === emp.id && 
                    l.status === 'approved' &&
                    (l.startDate.startsWith(month) || l.endDate.startsWith(month))
                ).reduce((acc, l) => {
                    const start = new Date(l.startDate);
                    const end = new Date(l.endDate);
                    return acc + Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                }, 0);
                
                return {
                    employeeId: emp.id,
                    employeeName: emp.name,
                    department: emp.department,
                    attendanceDays,
                    lateCount,
                    earlyLeaveCount,
                    leaveDays
                };
            });
            return { code: 200, data: summary, message: 'success' };
        }

        if (url.includes('/leave')) {
            if (method === 'POST') {
                const emp = mockData.employees.find(e => e.id === body.employeeId);
                const newLeave = {
                    ...body,
                    id: Date.now(),
                    employeeName: emp?.name || '',
                    department: emp?.department || '',
                    status: 'pending',
                    applyDate: new Date().toISOString().split('T')[0],
                    approveDate: null,
                    approver: null
                };
                mockData.leaves.push(newLeave);
                return { code: 200, data: newLeave, message: '申请已提交' };
            }
        }

        if (url.includes('/leave/list')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const employeeId = urlParams.get('employeeId');
            let leaves = [...mockData.leaves];
            
            if (employeeId) {
                leaves = leaves.filter(l => l.employeeId === parseInt(employeeId));
            }
            return { code: 200, data: leaves, message: 'success' };
        }

        if (url.includes('/leave/') && url.includes('/approve')) {
            if (method === 'PUT') {
                const idMatch = url.match(/\/leave\/(\d+)\/approve/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.leaves.findIndex(l => l.id === id);
                    if (index > -1) {
                        mockData.leaves[index].status = 'approved';
                        mockData.leaves[index].approveDate = new Date().toISOString().split('T')[0];
                        mockData.leaves[index].approver = body.approver || '管理员';
                        return { code: 200, data: mockData.leaves[index], message: '审批通过' };
                    }
                }
            }
        }

        if (url.includes('/leave/') && url.includes('/reject')) {
            if (method === 'PUT') {
                const idMatch = url.match(/\/leave\/(\d+)\/reject/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.leaves.findIndex(l => l.id === id);
                    if (index > -1) {
                        mockData.leaves[index].status = 'rejected';
                        mockData.leaves[index].approveDate = new Date().toISOString().split('T')[0];
                        mockData.leaves[index].approver = body.approver || '管理员';
                        return { code: 200, data: mockData.leaves[index], message: '已拒绝' };
                    }
                }
            }
        }

        if (url.includes('/alerts')) {
            if (method === 'GET') return { code: 200, data: mockData.alerts, message: 'success' };
            if (method === 'POST') {
                const newAlert = { ...body, id: Date.now(), status: 'pending', date: new Date().toISOString().split('T')[0] };
                mockData.alerts.push(newAlert);
                return { code: 200, data: newAlert, message: 'success' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/alerts\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.alerts.findIndex(a => a.id === id);
                    if (index > -1) {
                        mockData.alerts[index] = { ...mockData.alerts[index], ...body };
                        return { code: 200, data: mockData.alerts[index], message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/departments')) return { code: 200, data: mockData.departments, message: 'success' };
        if (url.includes('/positions')) return { code: 200, data: mockData.positions, message: 'success' };
        if (url.includes('/performance/plans')) return { code: 200, data: mockData.performancePlans, message: 'success' };
        if (url.includes('/training/courses')) return { code: 200, data: mockData.trainingCourses, message: 'success' };
        if (url.includes('/alert/rules')) return { code: 200, data: mockData.alertRules, message: 'success' };

        if (url.includes('/recruitment/jobs')) {
            if (method === 'GET') return { code: 200, data: mockData.jobs, message: 'success' };
            if (method === 'POST') {
                const newJob = { ...body, id: Date.now(), status: 'open', publishDate: new Date().toISOString().split('T')[0] };
                mockData.jobs.push(newJob);
                return { code: 200, data: newJob, message: '职位发布成功' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/recruitment\/job\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.jobs.findIndex(j => j.id === id);
                    if (index > -1) {
                        mockData.jobs[index] = { ...mockData.jobs[index], ...body };
                        return { code: 200, data: mockData.jobs[index], message: 'success' };
                    }
                }
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/recruitment\/job\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.jobs.findIndex(j => j.id === id);
                    if (index > -1) {
                        mockData.jobs[index].status = 'closed';
                        return { code: 200, data: mockData.jobs[index], message: '职位已下架' };
                    }
                }
            }
        }

        if (url.includes('/recruitment/candidates')) {
            if (url.includes('/upload')) {
                const parsed = this.parseResume(body.resumeText || '');
                return { code: 200, data: { ...parsed, id: Date.now() }, message: '简历解析成功' };
            }
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const position = urlParams.get('position');
                const status = urlParams.get('status');
                let candidates = [...mockData.candidates];
                if (position) candidates = candidates.filter(c => c.position === position);
                if (status) candidates = candidates.filter(c => c.status === status);
                return { code: 200, data: candidates, message: 'success' };
            }
            if (method === 'POST') {
                const newCandidate = { ...body, id: Date.now(), status: 'screening', interviews: [] };
                mockData.candidates.push(newCandidate);
                return { code: 200, data: newCandidate, message: '候选人添加成功' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/recruitment\/candidate\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.candidates.findIndex(c => c.id === id);
                    if (index > -1) {
                        if (url.includes('/status')) {
                            mockData.candidates[index].status = body.status;
                            return { code: 200, data: mockData.candidates[index], message: '状态更新成功' };
                        }
                        mockData.candidates[index] = { ...mockData.candidates[index], ...body };
                        return { code: 200, data: mockData.candidates[index], message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/recruitment/interviews')) {
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const interviewerId = urlParams.get('interviewerId');
                let interviews = [...mockData.interviews];
                if (interviewerId) interviews = interviews.filter(i => i.interviewerId === parseInt(interviewerId));
                return { code: 200, data: interviews, message: 'success' };
            }
            if (method === 'POST') {
                const newInterview = { ...body, id: Date.now(), status: 'scheduled', evaluation: null };
                mockData.interviews.push(newInterview);
                return { code: 200, data: newInterview, message: '面试安排成功' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/recruitment\/interview\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.interviews.findIndex(i => i.id === id);
                    if (index > -1) {
                        if (url.includes('/evaluation')) {
                            mockData.interviews[index].evaluation = body;
                            mockData.interviews[index].status = 'completed';
                            return { code: 200, data: mockData.interviews[index], message: '评价提交成功' };
                        }
                    }
                }
            }
        }

        if (url.includes('/recruitment/offers')) {
            if (method === 'GET') return { code: 200, data: mockData.offers, message: 'success' };
            if (method === 'POST') {
                const newOffer = { ...body, id: Date.now(), status: 'draft', sentDate: null };
                mockData.offers.push(newOffer);
                return { code: 200, data: newOffer, message: 'Offer创建成功' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/recruitment\/offer\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.offers.findIndex(o => o.id === id);
                    if (index > -1) {
                        if (url.includes('/send')) {
                            mockData.offers[index].status = 'sent';
                            mockData.offers[index].sentDate = new Date().toISOString().split('T')[0];
                            return { code: 200, data: mockData.offers[index], message: 'Offer已发送' };
                        }
                        if (url.includes('/accept')) {
                            mockData.offers[index].status = 'accepted';
                            return { code: 200, data: mockData.offers[index], message: 'Offer已接受' };
                        }
                        if (url.includes('/reject')) {
                            mockData.offers[index].status = 'rejected';
                            return { code: 200, data: mockData.offers[index], message: 'Offer已拒绝' };
                        }
                    }
                }
            }
        }

        if (url.includes('/performance/plans')) {
            if (method === 'GET') return { code: 200, data: mockData.performancePlans, message: 'success' };
            if (method === 'POST') {
                const newPlan = { ...body, id: Date.now(), status: 'pending' };
                mockData.performancePlans.push(newPlan);
                return { code: 200, data: newPlan, message: '计划创建成功' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/performance\/plan\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.performancePlans.findIndex(p => p.id === id);
                    if (index > -1) {
                        mockData.performancePlans[index] = { ...mockData.performancePlans[index], ...body };
                        return { code: 200, data: mockData.performancePlans[index], message: 'success' };
                    }
                }
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/performance\/plan\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.performancePlans.findIndex(p => p.id === id);
                    if (index > -1) {
                        mockData.performancePlans.splice(index, 1);
                        return { code: 200, data: null, message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/performance/kpis')) {
            if (method === 'GET') return { code: 200, data: mockData.performanceKPIs, message: 'success' };
            if (method === 'POST') {
                const newKPI = { ...body, id: Date.now() };
                mockData.performanceKPIs.push(newKPI);
                return { code: 200, data: newKPI, message: 'KPI创建成功' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/performance\/kpi\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.performanceKPIs.findIndex(k => k.id === id);
                    if (index > -1) {
                        mockData.performanceKPIs[index] = { ...mockData.performanceKPIs[index], ...body };
                        return { code: 200, data: mockData.performanceKPIs[index], message: 'success' };
                    }
                }
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/performance\/kpi\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.performanceKPIs.findIndex(k => k.id === id);
                    if (index > -1) {
                        mockData.performanceKPIs.splice(index, 1);
                        return { code: 200, data: null, message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/performance/evaluations')) {
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const planId = urlParams.get('planId');
                const employeeId = urlParams.get('employeeId');
                let evaluations = [...mockData.performanceEvaluations];
                if (planId) evaluations = evaluations.filter(e => e.planId === parseInt(planId));
                if (employeeId) evaluations = evaluations.filter(e => e.employeeId === parseInt(employeeId));
                return { code: 200, data: evaluations, message: 'success' };
            }
            if (method === 'POST') {
                if (url.includes('/self')) {
                    const idMatch = url.match(/\/performance\/evaluation\/(\d+)/);
                    if (idMatch) {
                        const id = parseInt(idMatch[1]);
                        const index = mockData.performanceEvaluations.findIndex(e => e.id === id);
                        if (index > -1) {
                            mockData.performanceEvaluations[index].selfScore = body.selfScore;
                            mockData.performanceEvaluations[index].selfComment = body.selfComment;
                            mockData.performanceEvaluations[index].selfStatus = 'completed';
                            if (mockData.performanceEvaluations[index].leaderStatus === 'completed') {
                                const final = (body.selfScore + mockData.performanceEvaluations[index].leaderScore) / 2;
                                mockData.performanceEvaluations[index].finalScore = final;
                                mockData.performanceEvaluations[index].grade = this.calculateGrade(final);
                                mockData.performanceEvaluations[index].bonus = this.calculateBonus(final);
                                mockData.performanceEvaluations[index].status = 'completed';
                            }
                            return { code: 200, data: mockData.performanceEvaluations[index], message: '自评提交成功' };
                        }
                    }
                }
                if (url.includes('/leader')) {
                    const idMatch = url.match(/\/performance\/evaluation\/(\d+)/);
                    if (idMatch) {
                        const id = parseInt(idMatch[1]);
                        const index = mockData.performanceEvaluations.findIndex(e => e.id === id);
                        if (index > -1) {
                            mockData.performanceEvaluations[index].leaderScore = body.leaderScore;
                            mockData.performanceEvaluations[index].leaderComment = body.leaderComment;
                            mockData.performanceEvaluations[index].leaderStatus = 'completed';
                            if (mockData.performanceEvaluations[index].selfStatus === 'completed') {
                                const final = (mockData.performanceEvaluations[index].selfScore + body.leaderScore) / 2;
                                mockData.performanceEvaluations[index].finalScore = final;
                                mockData.performanceEvaluations[index].grade = this.calculateGrade(final);
                                mockData.performanceEvaluations[index].bonus = this.calculateBonus(final);
                                mockData.performanceEvaluations[index].status = 'completed';
                            }
                            return { code: 200, data: mockData.performanceEvaluations[index], message: '上级评价提交成功' };
                        }
                    }
                }
            }
        }

        if (url.includes('/performance/result/statistics')) {
            const completed = mockData.performanceEvaluations.filter(e => e.status === 'completed');
            const gradeDistribution = { S: 0, A: 0, B: 0, C: 0, D: 0 };
            const deptScores = {};
            completed.forEach(e => {
                if (e.grade) gradeDistribution[e.grade]++;
                if (!deptScores[e.department]) deptScores[e.department] = [];
                if (e.finalScore) deptScores[e.department].push(e.finalScore);
            });
            const deptAvg = Object.keys(deptScores).map(d => ({
                department: d,
                avgScore: deptScores[d].reduce((a, b) => a + b, 0) / deptScores[d].length
            }));
            return { code: 200, data: { gradeDistribution, deptAvg, completedCount: completed.length }, message: 'success' };
        }

        if (url.includes('/performance/appeals')) {
            if (method === 'GET') return { code: 200, data: mockData.performanceAppeals, message: 'success' };
        }

        if (url.includes('/performance/appeal/')) {
            if (method === 'PUT') {
                const idMatch = url.match(/\/performance\/appeal\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.performanceAppeals.findIndex(a => a.id === id);
                    if (index > -1) {
                        mockData.performanceAppeals[index] = { ...mockData.performanceAppeals[index], ...body, status: body.newScore ? 'resolved' : 'rejected' };
                        return { code: 200, data: mockData.performanceAppeals[index], message: '申诉处理成功' };
                    }
                }
            }
        }

        if (url.includes('/training/courses')) {
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const category = urlParams.get('category');
                let courses = [...mockData.trainingCourses];
                if (category) courses = courses.filter(c => c.category === category);
                return { code: 200, data: courses, message: 'success' };
            }
            if (method === 'POST') {
                const newCourse = { ...body, id: Date.now(), enrolledCount: 0, status: 'open' };
                mockData.trainingCourses.push(newCourse);
                return { code: 200, data: newCourse, message: '课程创建成功' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/training\/course\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.trainingCourses.findIndex(c => c.id === id);
                    if (index > -1) {
                        mockData.trainingCourses[index] = { ...mockData.trainingCourses[index], ...body };
                        return { code: 200, data: mockData.trainingCourses[index], message: 'success' };
                    }
                }
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/training\/course\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.trainingCourses.findIndex(c => c.id === id);
                    if (index > -1) {
                        mockData.trainingCourses.splice(index, 1);
                        return { code: 200, data: null, message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/training/register')) {
            if (method === 'POST') {
                const emp = mockData.employees.find(e => e.id === body.employeeId);
                const newReg = {
                    id: Date.now(),
                    courseId: body.courseId,
                    employeeId: body.employeeId,
                    employeeName: emp?.name || '',
                    status: 'registered',
                    registerTime: new Date().toISOString().split('T')[0]
                };
                mockData.trainingRegistrations.push(newReg);
                const course = mockData.trainingCourses.find(c => c.id === body.courseId);
                if (course) course.enrolledCount++;
                return { code: 200, data: newReg, message: '报名成功' };
            }
            if (method === 'DELETE') {
                const idMatch = url.match(/\/training\/register\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.trainingRegistrations.findIndex(r => r.id === id);
                    if (index > -1) {
                        const reg = mockData.trainingRegistrations[index];
                        const course = mockData.trainingCourses.find(c => c.id === reg.courseId);
                        if (course) course.enrolledCount--;
                        mockData.trainingRegistrations.splice(index, 1);
                        return { code: 200, data: null, message: '取消报名成功' };
                    }
                }
            }
        }

        if (url.includes('/training/my-courses')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const employeeId = urlParams.get('employeeId');
            let regs = [...mockData.trainingRegistrations];
            if (employeeId) regs = regs.filter(r => r.employeeId === parseInt(employeeId));
            return { code: 200, data: regs, message: 'success' };
        }

        if (url.includes('/training/registrations/')) {
            const idMatch = url.match(/\/training\/registrations\/(\d+)/);
            if (idMatch) {
                const courseId = parseInt(idMatch[1]);
                const regs = mockData.trainingRegistrations.filter(r => r.courseId === courseId);
                return { code: 200, data: regs, message: 'success' };
            }
        }

        if (url.includes('/training/signin')) {
            if (method === 'POST') {
                const emp = mockData.employees.find(e => e.id === body.employeeId);
                const newSignin = {
                    id: Date.now(),
                    courseId: body.courseId,
                    employeeId: body.employeeId,
                    employeeName: emp?.name || '',
                    signinTime: new Date().toLocaleString('zh-CN'),
                    signinType: body.signinType || 'manual'
                };
                mockData.trainingSignins.push(newSignin);
                return { code: 200, data: newSignin, message: '签到成功' };
            }
        }

        if (url.includes('/training/records')) {
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const employeeId = urlParams.get('employeeId');
                let records = [...mockData.trainingRecords];
                if (employeeId) records = records.filter(r => r.employeeId === parseInt(employeeId));
                return { code: 200, data: records, message: 'success' };
            }
            if (method === 'POST') {
                const newRecord = { ...body, id: Date.now(), certificateNo: 'CERT' + Date.now() };
                mockData.trainingRecords.push(newRecord);
                return { code: 200, data: newRecord, message: '记录创建成功' };
            }
        }

        if (url.includes('/training/statistics')) {
            const stats = {
                totalSessions: mockData.trainingCourses.length,
                totalParticipants: mockData.trainingRegistrations.length,
                totalHours: mockData.trainingRecords.reduce((sum, r) => sum + (r.actualHours || 0), 0),
                avgSatisfaction: mockData.trainingRecords.length > 0
                    ? mockData.trainingRecords.reduce((sum, r) => sum + (r.satisfaction || 0), 0) / mockData.trainingRecords.length
                    : 0
            };
            return { code: 200, data: stats, message: 'success' };
        }

        if (url.includes('/talent/key-positions')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.keyPositions, message: 'success' };
            }
            if (method === 'POST') {
                const position = mockData.positions.find(p => p.id === body.positionId);
                const newKeyPosition = {
                    ...body,
                    id: Date.now(),
                    positionName: position?.name || '',
                    department: position?.departmentName || '',
                    successorCount: 0,
                    riskLevel: 'high',
                    status: 'active'
                };
                mockData.keyPositions.push(newKeyPosition);
                return { code: 200, data: newKeyPosition, message: '关键岗位添加成功' };
            }
        }

        if (url.includes('/talent/key-position/')) {
            const idMatch = url.match(/\/talent\/key-position\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                const index = mockData.keyPositions.findIndex(k => k.id === id);
                if (method === 'PUT' && url.includes('/level')) {
                    if (index > -1) {
                        mockData.keyPositions[index].criticalLevel = body.criticalLevel;
                        return { code: 200, data: mockData.keyPositions[index], message: '关键级别更新成功' };
                    }
                }
                if (method === 'DELETE') {
                    if (index > -1) {
                        mockData.keyPositions.splice(index, 1);
                        return { code: 200, data: null, message: '取消标记成功' };
                    }
                }
            }
        }

        if (url.includes('/talent/successors')) {
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const keyPositionId = urlParams.get('keyPositionId');
                let successors = [...mockData.successors];
                if (keyPositionId) successors = successors.filter(s => s.keyPositionId === parseInt(keyPositionId));
                return { code: 200, data: successors, message: 'success' };
            }
            if (method === 'POST') {
                const candidate = mockData.employees.find(e => e.id === body.candidateId);
                const newSuccessor = {
                    ...body,
                    id: Date.now(),
                    candidateName: candidate?.name || '',
                    currentPosition: candidate?.position || ''
                };
                mockData.successors.push(newSuccessor);
                const keyPosition = mockData.keyPositions.find(k => k.id === body.keyPositionId);
                if (keyPosition) {
                    keyPosition.successorCount++;
                    keyPosition.riskLevel = keyPosition.successorCount >= 2 ? 'low' : keyPosition.successorCount === 1 ? 'medium' : 'high';
                }
                return { code: 200, data: newSuccessor, message: '继任者添加成功' };
            }
        }

        if (url.includes('/talent/successor/')) {
            const idMatch = url.match(/\/talent\/successor\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                const index = mockData.successors.findIndex(s => s.id === id);
                if (method === 'PUT') {
                    if (index > -1) {
                        mockData.successors[index] = { ...mockData.successors[index], ...body };
                        return { code: 200, data: mockData.successors[index], message: 'success' };
                    }
                }
                if (method === 'DELETE') {
                    if (index > -1) {
                        const successor = mockData.successors[index];
                        mockData.successors.splice(index, 1);
                        const keyPosition = mockData.keyPositions.find(k => k.id === successor.keyPositionId);
                        if (keyPosition) {
                            keyPosition.successorCount--;
                            keyPosition.riskLevel = keyPosition.successorCount >= 2 ? 'low' : keyPosition.successorCount === 1 ? 'medium' : 'high';
                        }
                        return { code: 200, data: null, message: '继任者移除成功' };
                    }
                }
            }
        }

        if (url.includes('/talent/nine-grid')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.nineGridData, message: 'success' };
            }
            if (method === 'PUT') {
                const { employeeId, gridX, gridY, potential } = body;
                const index = mockData.nineGridData.findIndex(g => g.employeeId === employeeId);
                const performanceLevel = gridY === 3 ? 'A' : gridY === 2 ? 'B' : 'C';
                const positionCode = performanceLevel + (gridX === 3 ? '1' : gridX === 2 ? '2' : '3');
                if (index > -1) {
                    mockData.nineGridData[index] = {
                        ...mockData.nineGridData[index],
                        gridX,
                        gridY,
                        potential,
                        performance: performanceLevel,
                        gridPosition: positionCode
                    };
                    return { code: 200, data: mockData.nineGridData[index], message: '九宫格位置更新成功' };
                }
            }
        }

        if (url.includes('/talent/talent-pool')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.talentPool, message: 'success' };
            }
            if (method === 'POST') {
                const employee = mockData.employees.find(e => e.id === body.employeeId);
                const newTalent = {
                    ...body,
                    id: Date.now(),
                    employeeName: employee?.name || '',
                    assessmentDate: new Date().toISOString().split('T')[0]
                };
                mockData.talentPool.push(newTalent);
                return { code: 200, data: newTalent, message: '加入人才池成功' };
            }
        }

        if (url.includes('/talent/talent-pool/')) {
            const idMatch = url.match(/\/talent\/talent-pool\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                const index = mockData.talentPool.findIndex(t => t.id === id);
                if (index > -1) {
                    mockData.talentPool.splice(index, 1);
                    return { code: 200, data: null, message: '移出人才池成功' };
                }
            }
        }

        if (url.includes('/talent/coverage-report')) {
            return { code: 200, data: mockData.talentStats, message: 'success' };
        }

        if (url.includes('/talent/employee/')) {
            const idMatch = url.match(/\/talent\/employee\/(\d+)/);
            if (idMatch) {
                const employeeId = parseInt(idMatch[1]);
                const employee = mockData.employees.find(e => e.id === employeeId);
                const gridData = mockData.nineGridData.find(g => g.employeeId === employeeId);
                const performanceHistory = mockData.performanceEvaluations.filter(p => p.employeeId === employeeId);
                const isInPool = mockData.talentPool.some(t => t.employeeId === employeeId);
                const isSuccessor = mockData.successors.filter(s => s.candidateId === employeeId).map(s => {
                    const keyPosition = mockData.keyPositions.find(k => k.id === s.keyPositionId);
                    return { ...s, positionName: keyPosition?.positionName };
                });

                return {
                    code: 200,
                    data: {
                        employee,
                        gridData,
                        performanceHistory,
                        isInPool,
                        isSuccessor
                    },
                    message: 'success'
                };
            }
        }

        if (url.includes('/alert/statistics')) {
            const total = mockData.alertRecords.length;
            const pending = mockData.alertRecords.filter(a => a.status === 'pending').length;
            const handled = mockData.alertRecords.filter(a => a.status === 'handled').length;
            const highRisk = mockData.alertRecords.filter(a => a.level === 'high' && a.status === 'pending').length;
            const trendData = [
                { date: '2024-01-15', count: 3 },
                { date: '2024-01-16', count: 5 },
                { date: '2024-01-17', count: 4 },
                { date: '2024-01-18', count: 6 },
                { date: '2024-01-19', count: 3 },
                { date: '2024-01-20', count: 4 },
                { date: '2024-01-21', count: 4 }
            ];
            return {
                code: 200,
                data: { total, pending, handled, highRisk, trendData },
                message: 'success'
            };
        }

        if (url.includes('/alert/list')) {
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const type = urlParams.get('type');
            const level = urlParams.get('level');
            const status = urlParams.get('status');
            let alerts = [...mockData.alertRecords];
            if (type) alerts = alerts.filter(a => a.type === type);
            if (level) alerts = alerts.filter(a => a.level === level);
            if (status) alerts = alerts.filter(a => a.status === status);
            return { code: 200, data: alerts, message: 'success' };
        }

        if (url.includes('/alert/') && url.includes('/handle')) {
            const idMatch = url.match(/\/alert\/(\d+)\/handle/);
            if (idMatch && method === 'PUT') {
                const id = parseInt(idMatch[1]);
                const index = mockData.alertRecords.findIndex(a => a.id === id);
                if (index > -1) {
                    mockData.alertRecords[index].status = 'handled';
                    mockData.alertRecords[index].handleComment = body.handleComment || '';
                    mockData.alertRecords[index].handleTime = new Date().toISOString();
                    return { code: 200, data: mockData.alertRecords[index], message: '预警已处理' };
                }
            }
        }

        if (url.includes('/alert/') && url.includes('/ignore')) {
            const idMatch = url.match(/\/alert\/(\d+)\/ignore/);
            if (idMatch && method === 'PUT') {
                const id = parseInt(idMatch[1]);
                const index = mockData.alertRecords.findIndex(a => a.id === id);
                if (index > -1) {
                    mockData.alertRecords[index].status = 'ignored';
                    return { code: 200, data: mockData.alertRecords[index], message: '预警已忽略' };
                }
            }
        }

        if (url.includes('/alert/batch-handle')) {
            if (method === 'POST') {
                const ids = body.ids || [];
                const handleComment = body.handleComment || '';
                ids.forEach(id => {
                    const index = mockData.alertRecords.findIndex(a => a.id === id);
                    if (index > -1) {
                        mockData.alertRecords[index].status = 'handled';
                        mockData.alertRecords[index].handleComment = handleComment;
                        mockData.alertRecords[index].handleTime = new Date().toISOString();
                    }
                });
                return { code: 200, data: null, message: '批量处理成功' };
            }
        }

        if (url.includes('/alert/rules')) {
            return { code: 200, data: mockData.alertRuleConfigs, message: 'success' };
        }

        if (url.includes('/alert/rule/') && !url.includes('/toggle')) {
            const idMatch = url.match(/\/alert\/rule\/(\d+)/);
            if (idMatch && method === 'PUT') {
                const id = parseInt(idMatch[1]);
                const index = mockData.alertRuleConfigs.findIndex(r => r.id === id);
                if (index > -1) {
                    mockData.alertRuleConfigs[index] = { ...mockData.alertRuleConfigs[index], ...body };
                    return { code: 200, data: mockData.alertRuleConfigs[index], message: '规则已更新' };
                }
            }
        }

        if (url.includes('/alert/rule/') && url.includes('/toggle')) {
            const idMatch = url.match(/\/alert\/rule\/(\d+)\/toggle/);
            if (idMatch && method === 'POST') {
                const id = parseInt(idMatch[1]);
                const index = mockData.alertRuleConfigs.findIndex(r => r.id === id);
                if (index > -1) {
                    mockData.alertRuleConfigs[index].isEnabled = !mockData.alertRuleConfigs[index].isEnabled;
                    return { code: 200, data: mockData.alertRuleConfigs[index], message: '规则状态已切换' };
                }
            }
        }

        if (url.includes('/alert/risk-prediction')) {
            const riskPredictions = [...mockData.riskPredictions];
            const riskDistribution = { high: 1, medium: 1, low: 1 };
            const departmentRisks = [
                { department: '技术部', riskScore: 55 },
                { department: '产品部', riskScore: 30 },
                { department: '市场部', riskScore: 65 },
                { department: '人事部', riskScore: 25 }
            ];
            return {
                code: 200,
                data: {
                    riskPredictions,
                    riskDistribution,
                    departmentRisks
                },
                message: 'success'
            };
        }

        if (url.includes('/alert/trigger')) {
            if (method === 'POST') {
                return { code: 200, data: null, message: '预警检查已触发' };
            }
        }

        if (url.includes('/import/template/')) {
            const typeMatch = url.match(/\/import\/template\/(\w+)/);
            if (typeMatch) {
                const type = typeMatch[1];
                return { 
                    code: 200, 
                    data: { 
                        url: `/templates/${type}.xlsx`, 
                        type, 
                        fields: getTemplateFields(type)
                    }, 
                    message: 'success' 
                };
            }
        }

        if (url.includes('/import/upload')) {
            if (method === 'POST') {
                const fileId = Date.now();
                return { code: 200, data: { fileId, status: 'uploaded' }, message: '文件上传成功' };
            }
        }

        if (url.includes('/import/preview')) {
            if (method === 'POST') {
                const previewData = getPreviewData(body.type);
                return { 
                    code: 200, 
                    data: { 
                        totalCount: previewData.length, 
                        validCount: Math.floor(previewData.length * 0.96), 
                        errorCount: Math.floor(previewData.length * 0.04), 
                        previewData, 
                        fieldMapping: getFieldMapping(body.type)
                    }, 
                    message: 'success' 
                };
            }
        }

        if (url.includes('/import/execute')) {
            if (method === 'POST') {
                const importRecord = {
                    id: Date.now(),
                    type: body.type,
                    fileName: body.fileName || '导入文件.xlsx',
                    totalCount: body.totalCount || 50,
                    successCount: Math.floor((body.totalCount || 50) * 0.96),
                    failCount: Math.floor((body.totalCount || 50) * 0.04),
                    errorLogUrl: null,
                    importBy: '当前用户',
                    importTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    status: 'processing'
                };
                mockData.importRecords.push(importRecord);
                setTimeout(() => {
                    importRecord.status = 'completed';
                }, 2000);
                return { code: 200, data: importRecord, message: '导入开始执行' };
            }
        }

        if (url.includes('/import/records')) {
            return { code: 200, data: mockData.importRecords, message: 'success' };
        }

        if (url.includes('/report/fields')) {
            return { code: 200, data: mockData.reportFields, message: 'success' };
        }

        if (url.includes('/report/template/list')) {
            return { code: 200, data: mockData.reportTemplates, message: 'success' };
        }

        if (url.includes('/report/template/') && !url.includes('list')) {
            const idMatch = url.match(/\/report\/template\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                const template = mockData.reportTemplates.find(t => t.id === id);
                if (template) {
                    return { code: 200, data: template, message: 'success' };
                }
            }
        }

        if (url.includes('/report/template') && method === 'POST') {
            const newTemplate = { ...body, id: Date.now(), createTime: new Date().toISOString().split('T')[0], createdBy: '当前用户' };
            mockData.reportTemplates.push(newTemplate);
            return { code: 200, data: newTemplate, message: '模板保存成功' };
        }

        if (url.includes('/report/template') && method === 'DELETE') {
            const idMatch = url.match(/\/report\/template\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                const index = mockData.reportTemplates.findIndex(t => t.id === id);
                if (index > -1) {
                    mockData.reportTemplates.splice(index, 1);
                }
            }
            return { code: 200, data: null, message: '模板删除成功' };
        }

        if (url.includes('/report/preview')) {
            if (method === 'POST') {
                const previewData = getReportPreviewData(body);
                return { code: 200, data: previewData, message: 'success' };
            }
        }

        if (url.includes('/report/export')) {
            if (method === 'POST') {
                return { code: 200, data: { url: '/reports/report_export.xlsx' }, message: '导出成功' };
            }
        }

        if (url.includes('/archive/tables')) {
            return { code: 200, data: mockData.archiveTables, message: 'success' };
        }

        if (url.includes('/archive/preview')) {
            if (method === 'POST') {
                const previewData = getArchivePreviewData(body);
                return { code: 200, data: previewData, message: 'success' };
            }
        }

        if (url.includes('/archive/execute')) {
            if (method === 'POST') {
                const archiveRecord = {
                    id: Date.now(),
                    tableName: body.tableName,
                    archiveDate: new Date().toISOString().split('T')[0],
                    dataStartDate: body.startDate,
                    dataEndDate: body.endDate,
                    recordCount: body.recordCount || 1000,
                    status: 'archived',
                    operator: '当前用户'
                };
                mockData.archiveRecords.push(archiveRecord);
                return { code: 200, data: archiveRecord, message: '归档成功' };
            }
        }

        if (url.includes('/archive/records')) {
            return { code: 200, data: mockData.archiveRecords, message: 'success' };
        }

        if (url.includes('/archive/restore/')) {
            const idMatch = url.match(/\/archive\/restore\/(\d+)/);
            if (idMatch && method === 'POST') {
                const id = parseInt(idMatch[1]);
                const record = mockData.archiveRecords.find(r => r.id === id);
                if (record) {
                    record.status = 'restored';
                }
                return { code: 200, data: record, message: '恢复成功' };
            }
        }

        if (url.includes('/openapi/apps')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.openapiApps, message: 'success' };
            }
            if (method === 'POST') {
                const newApp = {
                    ...body,
                    id: Date.now(),
                    appKey: `AK_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
                    appSecret: `SK_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 16)}`,
                    status: 'active',
                    createTime: new Date().toISOString().split('T')[0],
                    lastCallTime: null
                };
                mockData.openapiApps.push(newApp);
                return { code: 200, data: newApp, message: '创建成功' };
            }
        }

        if (url.includes('/openapi/app/')) {
            const idMatch = url.match(/\/openapi\/app\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                const index = mockData.openapiApps.findIndex(a => a.id === id);
                if (index > -1) {
                    if (method === 'PUT') {
                        mockData.openapiApps[index] = { ...mockData.openapiApps[index], ...body };
                        return { code: 200, data: mockData.openapiApps[index], message: '更新成功' };
                    }
                    if (method === 'DELETE') {
                        mockData.openapiApps.splice(index, 1);
                        return { code: 200, data: null, message: '删除成功' };
                    }
                }
            }
        }

        if (url.includes('/openapi/app/') && url.includes('/status')) {
            const idMatch = url.match(/\/openapi\/app\/(\d+)\/status/);
            if (idMatch && method === 'PUT') {
                const id = parseInt(idMatch[1]);
                const app = mockData.openapiApps.find(a => a.id === id);
                if (app) {
                    app.status = body.status;
                    return { code: 200, data: app, message: '状态更新成功' };
                }
            }
        }

        if (url.includes('/openapi/app/') && url.includes('/secret')) {
            const idMatch = url.match(/\/openapi\/app\/(\d+)\/secret/);
            if (idMatch && method === 'GET') {
                const id = parseInt(idMatch[1]);
                const app = mockData.openapiApps.find(a => a.id === id);
                if (app) {
                    return { code: 200, data: { appKey: app.appKey, appSecret: app.appSecret }, message: 'success' };
                }
            }
            if (idMatch && method === 'POST') {
                const id = parseInt(idMatch[1]);
                const app = mockData.openapiApps.find(a => a.id === id);
                if (app) {
                    app.appSecret = `SK_${Date.now().toString(36)}${Math.random().toString(36).substr(2, 16)}`;
                    return { code: 200, data: { appKey: app.appKey, appSecret: app.appSecret }, message: '密钥重置成功' };
                }
            }
        }

        if (url.includes('/openapi/apis')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.openapiAPIs, message: 'success' };
            }
        }

        if (url.includes('/openapi/app/') && url.includes('/permissions')) {
            const idMatch = url.match(/\/openapi\/app\/(\d+)\/permissions/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                if (method === 'GET') {
                    const permissions = mockData.openapiPermissions.filter(p => p.appId === id);
                    return { code: 200, data: permissions, message: 'success' };
                }
                if (method === 'PUT') {
                    mockData.openapiPermissions = mockData.openapiPermissions.filter(p => p.appId !== id);
                    if (body.permissions) {
                        mockData.openapiPermissions.push(...body.permissions);
                    }
                    return { code: 200, data: null, message: '权限更新成功' };
                }
            }
        }

        if (url.includes('/openapi/logs')) {
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                let logs = [...mockData.openapiLogs];
                if (urlParams.get('appId')) {
                    logs = logs.filter(l => l.appId === parseInt(urlParams.get('appId')));
                }
                if (urlParams.get('status')) {
                    logs = logs.filter(l => l.statusCode === parseInt(urlParams.get('status')));
                }
                return { code: 200, data: logs, message: 'success' };
            }
        }

        if (url.includes('/openapi/statistics')) {
            if (method === 'GET') {
                const today = new Date().toISOString().split('T')[0];
                const todayCalls = mockData.openapiLogs.filter(l => l.requestTime.startsWith(today)).length;
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                const yesterdayCalls = mockData.openapiLogs.filter(l => l.requestTime.startsWith(yesterday)).length;
                const successCount = mockData.openapiLogs.filter(l => l.statusCode === 200).length;
                const successRate = mockData.openapiLogs.length > 0 ? (successCount / mockData.openapiLogs.length * 100).toFixed(1) : 100;
                const avgResponseTime = mockData.openapiLogs.length > 0 ? (mockData.openapiLogs.reduce((sum, l) => sum + l.responseTime, 0) / mockData.openapiLogs.length).toFixed(1) : 0;
                
                const trendData = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
                    const count = mockData.openapiLogs.filter(l => l.requestTime.startsWith(date)).length;
                    trendData.push({ date, count });
                }
                
                const apiCallCount = {};
                mockData.openapiLogs.forEach(l => {
                    apiCallCount[l.apiPath] = (apiCallCount[l.apiPath] || 0) + 1;
                });
                const apiRanking = Object.entries(apiCallCount)
                    .map(([apiPath, count]) => ({ apiPath, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);
                
                const appCallCount = {};
                mockData.openapiLogs.forEach(l => {
                    appCallCount[l.appName] = (appCallCount[l.appName] || 0) + 1;
                });
                const appRanking = Object.entries(appCallCount)
                    .map(([appName, count]) => ({ appName, count }))
                    .sort((a, b) => b.count - a.count);
                
                return {
                    code: 200,
                    data: {
                        todayCalls,
                        yesterdayCalls,
                        successRate,
                        avgResponseTime,
                        trendData,
                        apiRanking,
                        appRanking
                    },
                    message: 'success'
                };
            }
        }

        if (url.includes('/openapi/test')) {
            if (method === 'POST') {
                const newLog = {
                    id: Date.now(),
                    appId: 1,
                    appName: '测试应用',
                    apiPath: body.path,
                    method: body.method,
                    statusCode: 200,
                    responseTime: Math.floor(Math.random() * 100) + 20,
                    clientIp: '127.0.0.1',
                    requestTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
                };
                mockData.openapiLogs.push(newLog);
                return { code: 200, data: { success: true, result: '测试成功' }, message: 'success' };
            }
        }

        if (url.includes('/openapi/doc')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.openapiDoc, message: 'success' };
            }
        }

        if (url.includes('/system/users')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.systemUsers, message: 'success' };
            }
            if (method === 'POST') {
                const newUser = { ...body, id: Date.now(), status: 'active', lastLoginTime: '' };
                mockData.systemUsers.push(newUser);
                return { code: 200, data: newUser, message: 'success' };
            }
        }

        if (url.includes('/system/user/')) {
            const idMatch = url.match(/\/system\/user\/(\d+)/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                const index = mockData.systemUsers.findIndex(u => u.id === id);
                if (index > -1) {
                    if (method === 'PUT') {
                        mockData.systemUsers[index] = { ...mockData.systemUsers[index], ...body };
                        return { code: 200, data: mockData.systemUsers[index], message: 'success' };
                    }
                    if (method === 'DELETE') {
                        mockData.systemUsers.splice(index, 1);
                        return { code: 200, data: null, message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/system/user/') && url.includes('/password')) {
            const idMatch = url.match(/\/system\/user\/(\d+)\/password/);
            if (idMatch && method === 'PUT') {
                return { code: 200, data: { message: '密码已重置为默认值' }, message: 'success' };
            }
        }

        if (url.includes('/system/user/') && url.includes('/status')) {
            const idMatch = url.match(/\/system\/user\/(\d+)\/status/);
            if (idMatch && method === 'PUT') {
                const id = parseInt(idMatch[1]);
                const index = mockData.systemUsers.findIndex(u => u.id === id);
                if (index > -1) {
                    mockData.systemUsers[index].status = body.status;
                    return { code: 200, data: mockData.systemUsers[index], message: 'success' };
                }
            }
        }

        if (url.includes('/system/roles')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.systemRoles, message: 'success' };
            }
        }

        if (url.includes('/system/permissions')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.systemPermissions, message: 'success' };
            }
        }

        if (url.includes('/system/role/') && url.includes('/permissions')) {
            const idMatch = url.match(/\/system\/role\/(\d+)\/permissions/);
            if (idMatch) {
                const id = parseInt(idMatch[1]);
                if (method === 'GET') {
                    return { code: 200, data: { roleId: id, permissions: mockData.rolePermissions[id] || [] }, message: 'success' };
                }
                if (method === 'PUT') {
                    mockData.rolePermissions[id] = body.permissions || [];
                    return { code: 200, data: { roleId: id, permissions: mockData.rolePermissions[id] }, message: 'success' };
                }
            }
        }

        if (url.includes('/system/config')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.systemConfigs, message: 'success' };
            }
            if (method === 'PUT') {
                body.forEach(item => {
                    const index = mockData.systemConfigs.findIndex(c => c.key === item.key);
                    if (index > -1) {
                        mockData.systemConfigs[index].value = item.value;
                    }
                });
                return { code: 200, data: mockData.systemConfigs, message: 'success' };
            }
        }

        if (url.includes('/system/logs')) {
            if (method === 'GET') {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                let logs = [...mockData.systemLogs];
                if (urlParams.get('module')) logs = logs.filter(l => l.module === urlParams.get('module'));
                if (urlParams.get('username')) logs = logs.filter(l => l.username === urlParams.get('username'));
                return { code: 200, data: logs, message: 'success' };
            }
            if (method === 'DELETE') {
                mockData.systemLogs = [];
                return { code: 200, data: null, message: 'success' };
            }
        }

        if (url.includes('/system/statistics')) {
            if (method === 'GET') {
                const userCount = mockData.systemUsers.length;
                const roleCount = mockData.systemRoles.length;
                const logCount = mockData.systemLogs.length;
                const todayLogCount = mockData.systemLogs.filter(l => l.createTime.startsWith(new Date().toISOString().split('T')[0])).length;
                return { 
                    code: 200, 
                    data: { userCount, roleCount, logCount, todayLogCount }, 
                    message: 'success' 
                };
            }
        }

        if (url.includes('/system/announcements')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.systemAnnouncements, message: 'success' };
            }
            if (method === 'POST') {
                const newAnnouncement = { ...body, id: Date.now(), publishTime: new Date().toISOString().split('T')[0] };
                mockData.systemAnnouncements.push(newAnnouncement);
                return { code: 200, data: newAnnouncement, message: 'success' };
            }
        }

        if (url.includes('/system/todos')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.systemTodos, message: 'success' };
            }
            if (method === 'PUT') {
                const idMatch = url.match(/\/system\/todo\/(\d+)/);
                if (idMatch) {
                    const id = parseInt(idMatch[1]);
                    const index = mockData.systemTodos.findIndex(t => t.id === id);
                    if (index > -1) {
                        mockData.systemTodos[index].completed = body.completed;
                        return { code: 200, data: mockData.systemTodos[index], message: 'success' };
                    }
                }
            }
        }

        if (url.includes('/system/schedule')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.systemSchedule, message: 'success' };
            }
        }

        if (url.includes('/system/current-user')) {
            if (method === 'GET') {
                return { code: 200, data: mockData.currentUser, message: 'success' };
            }
            if (method === 'PUT') {
                mockData.currentUser = { ...mockData.currentUser, ...body };
                return { code: 200, data: mockData.currentUser, message: 'success' };
            }
        }

        if (url.includes('/system/dashboard')) {
            if (method === 'GET') {
                const hour = new Date().getHours();
                let greeting = '您好';
                if (hour < 12) greeting = '早上好';
                else if (hour < 18) greeting = '下午好';
                else greeting = '晚上好';
                
                const completedTodos = mockData.systemTodos.filter(t => t.completed).length;
                const totalTodos = mockData.systemTodos.length;
                
                return { 
                    code: 200, 
                    data: { 
                        greeting,
                        currentUser: mockData.currentUser,
                        todos: { completed: completedTodos, total: totalTodos },
                        announcements: mockData.systemAnnouncements,
                        schedule: mockData.systemSchedule
                    }, 
                    message: 'success' 
                };
            }
        }

        return { code: 200, data: null, message: 'success' };
    },

    getEmployees() { return this.request('/employees'); },
    updateEmployee(id, data) { return this.request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteEmployee(id) { return this.request(`/employees/${id}`, { method: 'DELETE' }); },
    getDepartments() { return this.request('/departments'); },
    getPositions() { return this.request('/positions'); },
    getOrgDepartments() { return this.request('/org/departments'); },
    getOrgPositions() { return this.request('/org/positions'); },
    getContracts() { return this.request('/hr/contracts'); },
    createContract(data) { return this.request('/hr/contract', { method: 'POST', body: JSON.stringify(data) }); },
    renewContract(id, data) { return this.request(`/hr/contract/${id}/renew`, { method: 'PUT', body: JSON.stringify(data) }); },
    terminateContract(id, data) { return this.request(`/hr/contract/${id}/terminate`, { method: 'PUT', body: JSON.stringify(data) }); },
    getTransfers() { return this.request('/hr/transfers'); },
    createTransfer(data) { return this.request('/hr/transfer', { method: 'POST', body: JSON.stringify(data) }); },
    approveTransfer(id, approver) { return this.request(`/hr/transfer/${id}/approve`, { method: 'PUT', body: JSON.stringify({ approver }) }); },
    rejectTransfer(id, approver) { return this.request(`/hr/transfer/${id}/reject`, { method: 'PUT', body: JSON.stringify({ approver }) }); },
    getArchive(employeeId) { return this.request(`/hr/archive/${employeeId}`); },
    updateArchive(data) { return this.request('/hr/archive', { method: 'PUT', body: JSON.stringify(data) }); },
    getAlerts() { return this.request('/alerts'); },
    createAlert(data) { return this.request('/alerts', { method: 'POST', body: JSON.stringify(data) }); },
    updateAlert(id, data) { return this.request(`/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    getDashboard() { return this.request('/dashboard'); },
    checkIn(employeeId, type) { return this.request('/attendance/checkin', { method: 'POST', body: JSON.stringify({ employeeId, type }) }); },
    getAttendanceRecords(params) { 
        const query = new URLSearchParams(params).toString();
        return this.request(`/attendance/records?${query}`); 
    },
    getAttendanceSummary(month) { 
        return this.request(`/attendance/summary?month=${month}`); 
    },
    applyLeave(data) { return this.request('/leave', { method: 'POST', body: JSON.stringify(data) }); },
    getLeaves(employeeId) { 
        const query = employeeId ? `?employeeId=${employeeId}` : '';
        return this.request(`/leave/list${query}`); 
    },
    approveLeave(id, approver) { return this.request(`/leave/${id}/approve`, { method: 'PUT', body: JSON.stringify({ approver }) }); },
    rejectLeave(id, approver) { return this.request(`/leave/${id}/reject`, { method: 'PUT', body: JSON.stringify({ approver }) }); },
    getJobs() { return this.request('/recruitment/jobs'); },
    createJob(data) { return this.request('/recruitment/job', { method: 'POST', body: JSON.stringify(data) }); },
    updateJob(id, data) { return this.request(`/recruitment/job/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    closeJob(id) { return this.request(`/recruitment/job/${id}`, { method: 'DELETE' }); },
    getCandidates(params) { 
        const query = new URLSearchParams(params || {}).toString();
        return this.request(`/recruitment/candidates?${query}`); 
    },
    parseResume(data) { return this.request('/recruitment/candidates/upload', { method: 'POST', body: JSON.stringify(data) }); },
    createCandidate(data) { return this.request('/recruitment/candidate', { method: 'POST', body: JSON.stringify(data) }); },
    updateCandidateStatus(id, status) { return this.request(`/recruitment/candidate/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); },
    getInterviews(params) { 
        const query = new URLSearchParams(params || {}).toString();
        return this.request(`/recruitment/interviews?${query}`); 
    },
    scheduleInterview(data) { return this.request('/recruitment/interview', { method: 'POST', body: JSON.stringify(data) }); },
    evaluateInterview(id, data) { return this.request(`/recruitment/interview/${id}/evaluation`, { method: 'PUT', body: JSON.stringify(data) }); },
    getOffers() { return this.request('/recruitment/offers'); },
    createOffer(data) { return this.request('/recruitment/offer', { method: 'POST', body: JSON.stringify(data) }); },
    sendOffer(id) { return this.request(`/recruitment/offer/${id}/send`, { method: 'PUT' }); },
    acceptOffer(id) { return this.request(`/recruitment/offer/${id}/accept`, { method: 'PUT' }); },
    rejectOffer(id) { return this.request(`/recruitment/offer/${id}/reject`, { method: 'PUT' }); },
    getPerformancePlans() { return this.request('/performance/plans'); },
    createPerformancePlan(data) { return this.request('/performance/plan', { method: 'POST', body: JSON.stringify(data) }); },
    updatePerformancePlan(id, data) { return this.request(`/performance/plan/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deletePerformancePlan(id) { return this.request(`/performance/plan/${id}`, { method: 'DELETE' }); },
    getPerformanceKPIs() { return this.request('/performance/kpis'); },
    createPerformanceKPI(data) { return this.request('/performance/kpi', { method: 'POST', body: JSON.stringify(data) }); },
    updatePerformanceKPI(id, data) { return this.request(`/performance/kpi/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deletePerformanceKPI(id) { return this.request(`/performance/kpi/${id}`, { method: 'DELETE' }); },
    getPerformanceEvaluations(params) { 
        const query = new URLSearchParams(params || {}).toString();
        return this.request(`/performance/evaluations?${query}`); 
    },
    submitSelfEvaluation(id, data) { return this.request(`/performance/evaluation/${id}/self`, { method: 'POST', body: JSON.stringify(data) }); },
    submitLeaderEvaluation(id, data) { return this.request(`/performance/evaluation/${id}/leader`, { method: 'POST', body: JSON.stringify(data) }); },
    getPerformanceStatistics() { return this.request('/performance/result/statistics'); },
    getPerformanceAppeals() { return this.request('/performance/appeals'); },
    handlePerformanceAppeal(id, data) { return this.request(`/performance/appeal/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    getTrainingCourses(params) { 
        const query = new URLSearchParams(params || {}).toString();
        return this.request(`/training/courses?${query}`); 
    },
    getTrainingCourse(id) { return this.request(`/training/course/${id}`); },
    createTrainingCourse(data) { return this.request('/training/course', { method: 'POST', body: JSON.stringify(data) }); },
    updateTrainingCourse(id, data) { return this.request(`/training/course/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteTrainingCourse(id) { return this.request(`/training/course/${id}`, { method: 'DELETE' }); },
    registerTraining(courseId, employeeId) { return this.request('/training/register', { method: 'POST', body: JSON.stringify({ courseId, employeeId }) }); },
    cancelRegistration(id) { return this.request(`/training/register/${id}`, { method: 'DELETE' }); },
    getMyCourses(employeeId) { return this.request(`/training/my-courses?employeeId=${employeeId}`); },
    getCourseRegistrations(courseId) { return this.request(`/training/registrations/${courseId}`); },
    signInTraining(courseId, employeeId, signinType) { return this.request('/training/signin', { method: 'POST', body: JSON.stringify({ courseId, employeeId, signinType }) }); },
    getTrainingRecords(employeeId) { return this.request(`/training/records?employeeId=${employeeId}`); },
    createTrainingRecord(data) { return this.request('/training/record', { method: 'POST', body: JSON.stringify(data) }); },
    getTrainingStatistics() { return this.request('/training/statistics'); },
    
    getKeyPositions() { return this.request('/talent/key-positions'); },
    createKeyPosition(data) { return this.request('/talent/key-positions', { method: 'POST', body: JSON.stringify(data) }); },
    updateKeyPositionLevel(id, criticalLevel) { return this.request(`/talent/key-position/${id}/level`, { method: 'PUT', body: JSON.stringify({ criticalLevel }) }); },
    deleteKeyPosition(id) { return this.request(`/talent/key-position/${id}`, { method: 'DELETE' }); },
    getSuccessors(keyPositionId) { 
        const query = keyPositionId ? `?keyPositionId=${keyPositionId}` : '';
        return this.request(`/talent/successors${query}`); 
    },
    addSuccessor(data) { return this.request('/talent/successors', { method: 'POST', body: JSON.stringify(data) }); },
    updateSuccessor(id, data) { return this.request(`/talent/successor/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    removeSuccessor(id) { return this.request(`/talent/successor/${id}`, { method: 'DELETE' }); },
    getNineGridData() { return this.request('/talent/nine-grid'); },
    updateNineGrid(data) { return this.request('/talent/nine-grid', { method: 'PUT', body: JSON.stringify(data) }); },
    getTalentPool() { return this.request('/talent/talent-pool'); },
    addToTalentPool(data) { return this.request('/talent/talent-pool', { method: 'POST', body: JSON.stringify(data) }); },
    removeFromTalentPool(id) { return this.request(`/talent/talent-pool/${id}`, { method: 'DELETE' }); },
    getCoverageReport() { return this.request('/talent/coverage-report'); },
    getTalentDetail(id) { return this.request(`/talent/employee/${id}`); },
    
    getAlertStatistics() { return this.request('/alert/statistics'); },
    getAlertList(params) { 
        const query = new URLSearchParams(params || {}).toString();
        return this.request(`/alert/list?${query}`); 
    },
    handleAlert(id, handleComment) { return this.request(`/alert/${id}/handle`, { method: 'PUT', body: JSON.stringify({ handleComment }) }); },
    ignoreAlert(id) { return this.request(`/alert/${id}/ignore`, { method: 'PUT' }); },
    batchHandleAlerts(ids, handleComment) { return this.request('/alert/batch-handle', { method: 'POST', body: JSON.stringify({ ids, handleComment }) }); },
    getAlertRules() { return this.request('/alert/rules'); },
    updateAlertRule(id, data) { return this.request(`/alert/rule/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    toggleAlertRule(id) { return this.request(`/alert/rule/${id}/toggle`, { method: 'POST' }); },
    getRiskPredictions() { return this.request('/alert/risk-prediction'); },
    triggerAlertCheck() { return this.request('/alert/trigger', { method: 'POST' }); },

    getImportTemplate(type) { return this.request(`/import/template/${type}`); },
    uploadImportFile(data) { return this.request('/import/upload', { method: 'POST', body: JSON.stringify(data) }); },
    previewImportData(data) { return this.request('/import/preview', { method: 'POST', body: JSON.stringify(data) }); },
    executeImport(data) { return this.request('/import/execute', { method: 'POST', body: JSON.stringify(data) }); },
    getImportRecords() { return this.request('/import/records'); },

    getReportFields() { return this.request('/report/fields'); },
    getReportTemplates() { return this.request('/report/template/list'); },
    getReportTemplate(id) { return this.request(`/report/template/${id}`); },
    saveReportTemplate(data) { return this.request('/report/template', { method: 'POST', body: JSON.stringify(data) }); },
    deleteReportTemplate(id) { return this.request(`/report/template/${id}`, { method: 'DELETE' }); },
    previewReport(data) { return this.request('/report/preview', { method: 'POST', body: JSON.stringify(data) }); },
    exportReport(data) { return this.request('/report/export', { method: 'POST', body: JSON.stringify(data) }); },

    getArchiveTables() { return this.request('/archive/tables'); },
    previewArchive(data) { return this.request('/archive/preview', { method: 'POST', body: JSON.stringify(data) }); },
    executeArchive(data) { return this.request('/archive/execute', { method: 'POST', body: JSON.stringify(data) }); },
    getArchiveRecords() { return this.request('/archive/records'); },
    restoreArchive(id) { return this.request(`/archive/restore/${id}`, { method: 'POST' }); },

    getOpenapiApps() { return this.request('/openapi/apps'); },
    createOpenapiApp(data) { return this.request('/openapi/apps', { method: 'POST', body: JSON.stringify(data) }); },
    updateOpenapiApp(id, data) { return this.request(`/openapi/app/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteOpenapiApp(id) { return this.request(`/openapi/app/${id}`, { method: 'DELETE' }); },
    updateOpenapiAppStatus(id, status) { return this.request(`/openapi/app/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); },
    getOpenapiAppSecret(id) { return this.request(`/openapi/app/${id}/secret`); },
    resetOpenapiAppSecret(id) { return this.request(`/openapi/app/${id}/secret`, { method: 'POST' }); },
    getOpenapiAPIs() { return this.request('/openapi/apis'); },
    getOpenapiAppPermissions(id) { return this.request(`/openapi/app/${id}/permissions`); },
    updateOpenapiAppPermissions(id, permissions) { return this.request(`/openapi/app/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }); },
    getOpenapiLogs(params) { 
        const query = new URLSearchParams(params || {}).toString();
        return this.request(`/openapi/logs?${query}`); 
    },
    getOpenapiStatistics() { return this.request('/openapi/statistics'); },
    testOpenapiAPI(data) { return this.request('/openapi/test', { method: 'POST', body: JSON.stringify(data) }); },
    getOpenapiDoc() { return this.request('/openapi/doc'); },
    
    getSystemUsers() { return this.request('/system/users'); },
    createSystemUser(data) { return this.request('/system/users', { method: 'POST', body: JSON.stringify(data) }); },
    updateSystemUser(id, data) { return this.request(`/system/user/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
    deleteSystemUser(id) { return this.request(`/system/user/${id}`, { method: 'DELETE' }); },
    resetSystemUserPassword(id) { return this.request(`/system/user/${id}/password`, { method: 'PUT' }); },
    updateSystemUserStatus(id, status) { return this.request(`/system/user/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); },
    
    getSystemRoles() { return this.request('/system/roles'); },
    getSystemPermissions() { return this.request('/system/permissions'); },
    getSystemRolePermissions(id) { return this.request(`/system/role/${id}/permissions`); },
    updateSystemRolePermissions(id, permissions) { return this.request(`/system/role/${id}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }); },
    
    getSystemConfig() { return this.request('/system/config'); },
    updateSystemConfig(data) { return this.request('/system/config', { method: 'PUT', body: JSON.stringify(data) }); },
    
    getSystemLogs(params) {
        const query = new URLSearchParams(params || {}).toString();
        return this.request(`/system/logs?${query}`);
    },
    clearSystemLogs() { return this.request('/system/logs', { method: 'DELETE' }); },
    
    getSystemStatistics() { return this.request('/system/statistics'); },
    
    getSystemAnnouncements() { return this.request('/system/announcements'); },
    createSystemAnnouncement(data) { return this.request('/system/announcements', { method: 'POST', body: JSON.stringify(data) }); },
    
    getSystemTodos() { return this.request('/system/todos'); },
    updateSystemTodo(id, completed) { return this.request(`/system/todo/${id}`, { method: 'PUT', body: JSON.stringify({ completed }) }); },
    
    getSystemSchedule() { return this.request('/system/schedule'); },
    
    getCurrentUser() { return this.request('/system/current-user'); },
    updateCurrentUser(data) { return this.request('/system/current-user', { method: 'PUT', body: JSON.stringify(data) }); },
    
    getSystemDashboard() { return this.request('/system/dashboard'); }
};

export default API;
