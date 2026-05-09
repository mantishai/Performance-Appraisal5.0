const API_BASE_URL = '/api';

const ATTENDANCE_CONFIG = {
    WORK_START: '09:00',
    WORK_END: '18:00'
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
            if (line.includes('姓名：')) result.name = line.split('姓名：')[1]?.trim();
            else if (line.includes('电话：')) result.phone = line.split('电话：')[1]?.trim();
            else if (line.includes('邮箱：')) result.email = line.split('邮箱：')[1]?.trim();
            else if (line.includes('工作年限：')) result.workYears = parseInt(line.split('工作年限：')[1]) || 0;
            else if (line.includes('学历：')) result.education = line.split('学历：')[1]?.trim();
        });
        return result;
    },

    getTemplateFields(type) {
        const fields = {
            employee: ['name', 'employeeNo', 'department', 'position', 'entryDate', 'status'],
            attendance: ['employeeName', 'date', 'checkIn', 'checkOut', 'status'],
            performance: ['employeeName', 'period', 'score', 'grade']
        };
        return fields[type] || fields.employee;
    },

    async request(url, options = {}) {
        try {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            };

            const mergedOptions = { ...defaultOptions, ...options };
            
            const response = await fetch(API_BASE_URL + url, mergedOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('[error] API request failed:', error);
            throw error;
        }
    },

    login(username, password) {
        return this.request('/auth/login', { 
            method: 'POST', 
            body: JSON.stringify({ username, password }) 
        });
    },
    
    logout() {
        return this.request('/auth/logout', { method: 'POST' });
    },
    
    getCurrentUser() {
        return this.request('/auth/me');
    },

    getInterviews(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/recruitment/interviews${query ? '?' + query : ''}`);
    },

    getAlertList(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/alert/list${query ? '?' + query : ''}`);
    },

    getEmployees(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/employees${query ? '?' + query : ''}`);
    },

    getEmployeeById(id) {
        return this.request(`/employees/${id}`);
    },

    createEmployee(data) {
        return this.request('/employees', { method: 'POST', body: JSON.stringify(data) });
    },

    updateEmployee(id, data) {
        return this.request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteEmployee(id) {
        return this.request(`/employees/${id}`, { method: 'DELETE' });
    },

    getDepartments() {
        return this.request('/departments');
    },

    getOrgDepartments() {
        return this.request('/org/departments');
    },

    getPositions() {
        return this.request('/positions');
    },

    getOrgPositions() {
        return this.request('/org/positions');
    },

    getContracts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/hr/contracts${query ? '?' + query : ''}`);
    },

    createContract(data) {
        return this.request('/hr/contract', { method: 'POST', body: JSON.stringify(data) });
    },

    updateContract(id, data) {
        return this.request(`/hr/contract/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteContract(id) {
        return this.request(`/hr/contract/${id}`, { method: 'DELETE' });
    },

    renewContract(id, data) {
        return this.request(`/hr/contract/${id}/renew`, { method: 'PUT', body: JSON.stringify(data) });
    },

    terminateContract(id, data) {
        return this.request(`/hr/contract/${id}/terminate`, { method: 'PUT', body: JSON.stringify(data) });
    },

    getTransfers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/hr/transfers${query ? '?' + query : ''}`);
    },

    createTransfer(data) {
        return this.request('/hr/transfer', { method: 'POST', body: JSON.stringify(data) });
    },

    updateTransfer(id, data) {
        return this.request(`/hr/transfer/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteTransfer(id) {
        return this.request(`/hr/transfer/${id}`, { method: 'DELETE' });
    },

    approveTransfer(id, approver) {
        return this.request(`/hr/transfer/${id}/approve`, { method: 'PUT', body: JSON.stringify({ approver }) });
    },

    rejectTransfer(id, approver) {
        return this.request(`/hr/transfer/${id}/reject`, { method: 'PUT', body: JSON.stringify({ approver }) });
    },

    getArchive(employeeId) {
        return this.request(`/hr/archive/${employeeId}`);
    },

    getArchives(employeeId) {
        return this.request(`/hr/archive/${employeeId}`);
    },

    updateArchive(data) {
        return this.request('/hr/archive', { method: 'PUT', body: JSON.stringify(data) });
    },

    updateArchives(employeeId, data) {
        return this.request('/hr/archive', { method: 'PUT', body: JSON.stringify(data) });
    },

    triggerAlertCheck() {
        return Promise.resolve({ code: 200, message: 'success' });
    },

    getAttendanceRecords(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/attendance/records${query ? '?' + query : ''}`);
    },

    getAttendanceSummary(month) {
        return this.request(`/attendance/summary?month=${month}`);
    },

    checkin(data) {
        return this.request('/attendance/checkin', { method: 'POST', body: JSON.stringify(data) });
    },

    getLeaves(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/leave/list${query ? '?' + query : ''}`);
    },

    createLeave(data) {
        return this.request('/leave/apply', { method: 'POST', body: JSON.stringify(data) });
    },

    updateLeave(id, data) {
        return this.request(`/leave/update/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    approveLeave(id, data) {
        return this.request(`/leave/approve/${id}`, { method: 'POST', body: JSON.stringify(data) });
    },

    deleteLeave(id) {
        return this.request(`/leave/delete/${id}`, { method: 'DELETE' });
    },

    getPerformancePlans() {
        return this.request('/performance/plans');
    },

    createPerformancePlan(data) {
        return this.request('/performance/plan', { method: 'POST', body: JSON.stringify(data) });
    },

    getPerformanceEvaluations(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/performance/evaluations${query ? '?' + query : ''}`);
    },

    submitSelfEvaluation(id, data) {
        return this.request(`/performance/evaluation/${id}/self`, { method: 'POST', body: JSON.stringify(data) });
    },

    submitLeaderEvaluation(id, data) {
        return this.request(`/performance/evaluation/${id}/leader`, { method: 'POST', body: JSON.stringify(data) });
    },

    getKPIs() {
        return this.request('/performance/kpis');
    },

    createKPI(data) {
        return this.request('/performance/kpi', { method: 'POST', body: JSON.stringify(data) });
    },

    updateKPI(id, data) {
        return this.request(`/performance/kpi/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteKPI(id) {
        return this.request(`/performance/kpi/${id}`, { method: 'DELETE' });
    },

    getPerformanceStatistics() {
        return this.request('/performance/result/statistics');
    },

    getTrainingCourses(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/training/courses${query ? '?' + query : ''}`);
    },

    createTrainingCourse(data) {
        return this.request('/training/course', { method: 'POST', body: JSON.stringify(data) });
    },

    updateTrainingCourse(id, data) {
        return this.request(`/training/course/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteTrainingCourse(id) {
        return this.request(`/training/course/${id}`, { method: 'DELETE' });
    },

    getMyCourses(employeeId) {
        return this.request(`/training/my-courses?employee_id=${employeeId}`);
    },

    getTrainingRecords(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/training/records${query ? '?' + query : ''}`);
    },

    registerCourse(courseId, employeeId) {
        return this.request('/training/register', { method: 'POST', body: JSON.stringify({ courseId, employeeId }) });
    },

    getAlerts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/alert/list${query ? '?' + query : ''}`);
    },

    getAlertRules() {
        return this.request('/alert/rules');
    },

    updateAlertRule(id, data) {
        return this.request(`/alert/rule/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    getRiskPredictions() {
        return this.request('/alert/risk-prediction');
    },

    getJobs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/recruitment/jobs${query ? '?' + query : ''}`);
    },

    createJob(data) {
        return this.request('/recruitment/job', { method: 'POST', body: JSON.stringify(data) });
    },

    updateJob(id, data) {
        return this.request(`/recruitment/job/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteJob(id) {
        return this.request(`/recruitment/job/${id}`, { method: 'DELETE' });
    },

    getCandidates(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/recruitment/candidates${query ? '?' + query : ''}`);
    },

    createCandidate(data) {
        return this.request('/recruitment/candidate', { method: 'POST', body: JSON.stringify(data) });
    },

    updateCandidate(id, data) {
        return this.request(`/recruitment/candidate/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteCandidate(id) {
        return this.request(`/recruitment/candidate/${id}`, { method: 'DELETE' });
    },

    createInterview(data) {
        return this.request('/recruitment/interview', { method: 'POST', body: JSON.stringify(data) });
    },

    updateInterview(id, data) {
        return this.request(`/recruitment/interview/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteInterview(id) {
        return this.request(`/recruitment/interview/${id}`, { method: 'DELETE' });
    },

    getOffers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/recruitment/offers${query ? '?' + query : ''}`);
    },

    createOffer(data) {
        return this.request('/recruitment/offer', { method: 'POST', body: JSON.stringify(data) });
    },

    updateOffer(id, data) {
        return this.request(`/recruitment/offer/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteOffer(id) {
        return this.request(`/recruitment/offer/${id}`, { method: 'DELETE' });
    },

    getKeyPositions() {
        return this.request('/talent/key-positions');
    },

    getNineGrid() {
        return this.request('/talent/nine-grid');
    },

    getSuccessors(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/talent/successors${query ? '?' + query : ''}`);
    },

    getTalentCoverage() {
        return this.request('/talent/coverage-report');
    },

    getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/audit/logs${query ? '?' + query : ''}`);
    },

    getAuditStatistics() {
        return this.request('/audit/statistics');
    },

    getSensitiveOperations() {
        return this.request('/audit/sensitive');
    },

    getSecurityEvents(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/security/events${query ? '?' + query : ''}`);
    },

    getSecurityStatistics() {
        return this.request('/security/statistics');
    },

    getDashboard() {
        return this.request('/dashboard');
    },

    getSystemDashboard() {
        return this.request('/system/dashboard');
    },

    getSystemAnnouncements() {
        return this.request('/system/announcements');
    },

    getSystemTodos() {
        return this.request('/system/todos');
    },

    getSystemSchedule() {
        return this.request('/system/schedule');
    },
    
    getNotifications() {
        return this.request('/notifications');
    },
    
    markNotificationAsRead(id) {
        return this.request(`/notifications/${id}/read`, { method: 'PUT' });
    },
    
    markAllNotificationsAsRead() {
        return this.request('/notifications/read-all', { method: 'PUT' });
    }
};

export default API;
