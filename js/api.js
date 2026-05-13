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
                }
            };

            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {})
                }
            };
            
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

    getEmployeeDetail(id) {
        return this.request(`/employees/${id}/detail`);
    },

    updateEmployeeDetail(id, data) {
        return this.request(`/employees/${id}/detail`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    getEmployeeByName(name) {
        const encodedName = encodeURIComponent(name);
        return this.request(`/employees/by-name/${encodedName}`);
    },

    getEmployeeByNo(employeeNo) {
        const encodedNo = encodeURIComponent(employeeNo);
        return this.request(`/employees/by-no/${encodedNo}`);
    },

    changePassword(oldPassword, newPassword) {
        return this.request('/user/change-password', { 
            method: 'PUT', 
            body: JSON.stringify({ oldPassword, newPassword }) 
        });
    },

    resetPassword(userId, newPassword) {
        return this.request(`/admin/reset-password/${userId}`, { 
            method: 'PUT', 
            body: JSON.stringify({ newPassword }) 
        });
    },

    getUsers(role) {
        const params = role ? `?role=${role}` : '';
        return this.request(`/admin/users${params}`);
    },

    addUser(username, password, displayName, role = 'employee') {
        return this.request('/admin/users', { 
            method: 'POST', 
            body: JSON.stringify({ username, password, displayName, role }) 
        });
    },

    deleteUser(userId) {
        return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
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
        return this.request('/org/departments/tree');
    },
    
    getOrgStatistics() {
        return this.request('/org/department/statistics');
    },
    
    getOrgEmployees() {
        return this.request('/org/employees/for-select');
    },
    
    getDepartmentEmployees(deptId, page) {
        return this.request(`/org/department/${deptId}/employees?page=${page}`);
    },

    createDepartment(data) {
        return this.request('/org/department', { method: 'POST', body: JSON.stringify(data) });
    },

    updateDepartment(id, data) {
        return this.request(`/org/department/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deleteDepartment(id) {
        return this.request(`/org/department/${id}`, { method: 'DELETE' });
    },

    getEmployeesForSelect() {
        return this.request('/org/employees/for-select');
    },

    getDepartmentOptions() {
        return this.request('/org/departments/options');
    },

    getPositions() {
        return this.request('/positions');
    },

    getOrgPositions() {
        return this.request('/org/positions');
    },

    createPosition(data) {
        return this.request('/org/position', { method: 'POST', body: JSON.stringify(data) });
    },

    updatePosition(id, data) {
        return this.request(`/org/position/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    deletePosition(id) {
        return this.request(`/org/position/${id}`, { method: 'DELETE' });
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
    },

    getSystemUsers() {
        return this.request('/admin/users');
    },

    getSystemRoles() {
        return this.request('/admin/roles');
    },

    getSystemPermissions() {
        return this.request('/admin/permissions');
    },

    getSystemLogs() {
        return this.request('/admin/logs');
    },

    getSystemConfig() {
        return this.request('/admin/config');
    },

    getSystemRolePermissions(roleId) {
        return this.request(`/admin/roles/${roleId}/permissions`);
    },

    updateSystemRolePermissions(roleId, permissions) {
        return this.request(`/admin/roles/${roleId}/permissions`, { 
            method: 'PUT', 
            body: JSON.stringify({ permissions }) 
        });
    },

    resetSystemUserPassword(userId) {
        return this.request(`/admin/users/${userId}/reset-password`, { 
            method: 'PUT', 
            body: JSON.stringify({ newPassword: '123456' }) 
        });
    },

    updateSystemUserStatus(userId, status) {
        return this.request(`/admin/users/${userId}/status`, { 
            method: 'PUT', 
            body: JSON.stringify({ status }) 
        });
    },

    deleteSystemUser(userId) {
        return this.request(`/admin/users/${userId}`, { method: 'DELETE' });
    },

    updateSystemUser(userId, data) {
        return this.request(`/admin/users/${userId}`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        });
    },

    createSystemUser(data) {
        return this.request('/admin/users', { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
    },

    updateSystemConfig(configs) {
        return this.request('/admin/config', { 
            method: 'PUT', 
            body: JSON.stringify({ configs }) 
        });
    },

    clearSystemLogs() {
        return this.request('/admin/logs', { method: 'DELETE' });
    },

    getOpenapiApps() {
        return this.request('/openapi/apps');
    },

    createOpenapiApp(data) {
        return this.request('/openapi/apps', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateOpenapiApp(id, data) {
        return this.request(`/openapi/app/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deleteOpenapiApp(id) {
        return this.request(`/openapi/app/${id}`, { method: 'DELETE' });
    },

    getOpenapiAppPermissions(id) {
        return this.request(`/openapi/app/${id}/permissions`);
    },

    updateOpenapiAppPermissions(id, permissions) {
        return this.request(`/openapi/app/${id}/permissions`, {
            method: 'PUT',
            body: JSON.stringify({ permissions })
        });
    },

    getOpenapiAPIs() {
        return this.request('/openapi/apis');
    },

    getOpenapiLogs(page = 1, limit = 20) {
        return this.request(`/openapi/logs?page=${page}&limit=${limit}`);
    },

    getOpenapiStatistics() {
        return this.request('/openapi/statistics');
    },

    getOpenapiDoc() {
        return this.request('/openapi/doc');
    },

    testOpenapi(data) {
        return this.request('/openapi/test', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getPerformanceKPIs() {
        return this.request('/performance/kpis');
    },

    createPerformanceKPI(data) {
        return this.request('/performance/kpis', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updatePerformanceKPI(id, data) {
        return this.request(`/performance/kpis/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deletePerformanceKPI(id) {
        return this.request(`/performance/kpis/${id}`, { method: 'DELETE' });
    },

    getPerformancePlans() {
        return this.request('/performance/plans');
    },

    createPerformancePlan(data) {
        return this.request('/performance/plans', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updatePerformancePlan(id, data) {
        return this.request(`/performance/plans/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    deletePerformancePlan(id) {
        return this.request(`/performance/plans/${id}`, { method: 'DELETE' });
    },

    getPerformanceAppeals() {
        return this.request('/performance/appeals');
    },

    handlePerformanceAppeal(id, data) {
        return this.request(`/performance/appeals/${id}/handle`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    getCourseRegistrations(courseId) {
        return this.request(`/training/registrations/${courseId || 'all'}`);
    },

    getTrainingStatistics() {
        return this.request('/training/statistics');
    },

    updateTrainingCourseStatus(id, status) {
        return this.request(`/training/courses/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    createTrainingRecord(data) {
        return this.request('/training/records', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getNineGridData() {
        return this.request('/talent/nine-grid');
    },

    updateNineGrid(data) {
        return this.request('/talent/nine-grid', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    getSuccessors(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/talent/successors${query ? '?' + query : ''}`);
    },

    updateSuccessor(id, data) {
        return this.request(`/talent/successors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    createKeyPosition(data) {
        return this.request('/talent/key-positions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    updateKeyPositionLevel(id, level) {
        return this.request(`/talent/key-positions/${id}/level`, {
            method: 'PUT',
            body: JSON.stringify({ level })
        });
    },

    deleteKeyPosition(id) {
        return this.request(`/talent/key-positions/${id}`, { method: 'DELETE' });
    },

    getAlertStatistics() {
        return this.request('/alert/statistics');
    },

    getAlertRules() {
        return this.request('/alert/rules');
    },

    updateAlertRule(id, data) {
        return this.request(`/alert/rules/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    getImportRecords() {
        return this.request('/import/records');
    },

    getReportFields() {
        return this.request('/import/fields');
    },

    getReportTemplates() {
        return this.request('/import/templates');
    },

    deleteReportTemplate(id) {
        return this.request(`/import/templates/${id}`, { method: 'DELETE' });
    },

    getImportTemplate(type) {
        return this.request(`/import/template/${type}`);
    },

    previewImportData(data) {
        return this.request('/import/preview', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    executeImport(data) {
        return this.request('/import/execute', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getArchiveTables() {
        return this.request('/archive/tables');
    },

    getArchiveRecords(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/archive/records${query ? '?' + query : ''}`);
    },

    previewArchive(data) {
        return this.request('/archive/preview', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    executeArchive(data) {
        return this.request('/archive/execute', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    restoreArchive(id) {
        return this.request(`/archive/restore/${id}`, { method: 'POST' });
    },

    saveReportTemplate(data) {
        return this.request('/import/templates', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    previewReport(data) {
        return this.request('/import/preview-report', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    exportReport(data) {
        return this.request('/import/export', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    getIpWhitelist() {
        return this.request('/security/ip-whitelist');
    },

    getSecurityPolicy() {
        return this.request('/security/policy');
    },

    getTalentPool() {
        return this.request('/talent/talent-pool');
    },

    getTalentCoverage() {
        return this.request('/talent/coverage-report');
    },

    getCoverageReport() {
        return this.request('/talent/coverage-report');
    }
};

export default API;
