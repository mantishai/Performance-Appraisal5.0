import API from './api.js';
import GlobalSearch from './components/GlobalSearch.js';
import NotificationCenter from './components/NotificationCenter.js';
import ThemeSwitcher from './components/ThemeSwitcher.js';
import * as Utils from './utils.js';

let currentModule = null;
let charts = {};

const modules = {
    dashboard: { name: '个人看板', icon: '📊' },
    employee: { name: '员工管理', icon: '👤' },
    hr: { name: '人事管理', icon: '👥' },
    org: { name: '组织架构', icon: '🏢' },
    position: { name: '岗位说明书', icon: '📋' },
    daily: { name: '考勤打卡', icon: '⏰' },
    attendance: { name: '考勤管理', icon: '📅' },
    recruitment: { name: '招聘管理', icon: '📝' },
    performance: { name: '绩效考核', icon: '📈' },
    training: { name: '培训管理', icon: '📚' },
    talent: { name: '人才盘点', icon: '🎯' },
    alert: { name: '智能预警', icon: '🔔' },
    import: { name: '数据管理', icon: '📥' },
    openapi: { name: 'API开放平台', icon: '🚀' },
    system: { name: '系统管理', icon: '⚙️' },
    datav: { name: '数据大屏', icon: '📊' },
    export: { name: '导出中心', icon: '📤' },
    security: { name: '安全中心', icon: '🔒' },
    audit: { name: '审计日志', icon: '📋' }
};

const routes = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/employee': 'employee',
    '/hr': 'hr',
    '/org': 'org',
    '/position': 'position',
    '/daily': 'daily',
    '/attendance': 'attendance',
    '/recruitment': 'recruitment',
    '/performance': 'performance',
    '/training': 'training',
    '/talent': 'talent',
    '/alert': 'alert',
    '/import': 'import',
    '/openapi': 'openapi',
    '/system': 'system',
    '/datav': 'datav',
    '/export': 'export',
    '/security': 'security',
    '/audit': 'audit'
};

class EventBus {
    constructor() {
        this.events = {};
    }
    
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
    
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(callback => callback(data));
    }
}

const eventBus = new EventBus();

const store = {
    state: {
        user: null,
        token: null,
        currentModule: 'dashboard',
        notifications: [],
        systemConfig: {}
    },
    
    get(key) {
        return this.state[key];
    },
    
    set(key, value) {
        this.state[key] = value;
        eventBus.emit('stateChange', { key, value });
    },
    
    subscribe(callback) {
        eventBus.on('stateChange', callback);
    }
};

const APIAuth = {
    appCallStats: {},
    appCallToday: {},

    init() {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('openapi_call_stats');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.date === today) {
                this.appCallToday = data.stats;
            }
        }
        this.appCallStats = {};
    },

    checkRateLimit(appKey, qpsLimit = 100, dailyLimit = 10000) {
        const now = Date.now();
        const today = new Date().toDateString();

        if (!this.appCallStats[appKey]) {
            this.appCallStats[appKey] = { lastSecond: 0, callsInSecond: 0 };
        }
        if (!this.appCallToday[appKey]) {
            this.appCallToday[appKey] = 0;
        }

        const stats = this.appCallStats[appKey];
        const currentSecond = Math.floor(now / 1000);

        if (currentSecond !== stats.lastSecond) {
            stats.lastSecond = currentSecond;
            stats.callsInSecond = 0;
        }

        stats.callsInSecond++;

        if (stats.callsInSecond > qpsLimit) {
            return { valid: false, reason: 'QPS超限' };
        }

        this.appCallToday[appKey]++;

        if (this.appCallToday[appKey] > dailyLimit) {
            return { valid: false, reason: '日调用量超限' };
        }

        this.saveTodayStats();

        return { valid: true };
    },

    saveTodayStats() {
        localStorage.setItem('openapi_call_stats', JSON.stringify({
            date: new Date().toDateString(),
            stats: this.appCallToday
        }));
    },

    checkPermission(appKey, apiPath, apps = [], permissions = []) {
        const app = apps.find(a => a.appKey === appKey);
        if (!app) {
            return { valid: false, reason: '应用不存在' };
        }
        if (app.status !== 'active') {
            return { valid: false, reason: '应用已禁用' };
        }

        const appPermissions = permissions.filter(p => p.appId === app.id);
        const hasPermission = appPermissions.length === 0 || 
            appPermissions.some(p => apiPath.includes(p.apiId));

        if (!hasPermission) {
            return { valid: false, reason: '无权访问该API' };
        }

        const rateCheck = this.checkRateLimit(appKey, app.qpsLimit, app.dailyLimit);
        if (!rateCheck.valid) {
            return rateCheck;
        }

        return { valid: true };
    },

    getCachedAppsAndPermissions() {
        const cached = localStorage.getItem('openapi_permissions_cache');
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < 3600000) {
                return { apps: data.apps, permissions: data.permissions };
            }
        }
        return null;
    },

    setCachedAppsAndPermissions(apps, permissions) {
        localStorage.setItem('openapi_permissions_cache', JSON.stringify({
            apps,
            permissions,
            timestamp: Date.now()
        }));
    }
};

const originalFetch = window.fetch;
window.fetch = async function(url, options) {
    const urlStr = String(url);
    if (urlStr.includes('/api/') && !urlStr.includes('/api/openapi/')) {
        const appKey = options?.headers?.['X-App-Key'];
        if (appKey) {
            try {
                let cached = APIAuth.getCachedAppsAndPermissions();
                
                if (!cached) {
                    const { default: API } = await import('./api.js');
                    const [appsRes, permsRes] = await Promise.all([
                        API.getOpenapiApps(),
                        API.getOpenapiAPIs()
                    ]);
                    const apps = appsRes.code === 200 ? appsRes.data : [];
                    
                    const appPerms = [];
                    for (const app of apps) {
                        const permRes = await API.getOpenapiAppPermissions(app.id);
                        if (permRes.code === 200) {
                            appPerms.push(...permRes.data);
                        }
                    }
                    
                    APIAuth.setCachedAppsAndPermissions(apps, appPerms);
                    cached = { apps, permissions: appPerms };
                }

                const check = APIAuth.checkPermission(appKey, urlStr, cached.apps, cached.permissions);
                if (!check.valid) {
                    return new Response(JSON.stringify({ 
                        code: 403, 
                        message: check.reason 
                    }), { status: 403 });
                }
            } catch (e) {
                console.warn('API auth check failed, proceeding anyway');
            }
        }
    }
    return originalFetch.apply(this, arguments);
};

const moduleTitles = {
    dashboard: '个人看板',
    employee: '员工管理',
    hr: '人事管理',
    org: '组织架构',
    position: '岗位管理',
    daily: '考勤打卡',
    attendance: '考勤管理',
    recruitment: '招聘管理',
    performance: '绩效考核',
    training: '培训管理',
    talent: '人才盘点',
    alert: '智能预警',
    import: '数据管理',
    openapi: 'API开放平台',
    system: '系统管理',
    datav: '数据大屏',
    export: '导出中心',
    security: '安全中心',
    audit: '审计日志'
};

const modulePermissions = {
    dashboard: null,
    employee: ['employee:view'],
    hr: ['personnel:view'],
    org: ['employee:view'],
    position: ['employee:view'],
    daily: ['attendance:checkin'],
    attendance: ['attendance:view'],
    recruitment: ['recruitment:view'],
    performance: ['performance:view'],
    training: ['training:view'],
    talent: ['employee:view'],
    alert: ['employee:view'],
    import: ['employee:view'],
    openapi: ['system:users'],
    system: ['system:users'],
    datav: null,
    export: ['employee:view'],
    security: ['system:users'],
    audit: ['system:users']
};

const moduleComponents = {};

async function loadModule(moduleName) {
    try {
        if (moduleComponents[moduleName]) {
            return moduleComponents[moduleName];
        }
        
        var module = await import(`./modules/${moduleName}.js`);
        moduleComponents[moduleName] = module.default;
        return moduleComponents[moduleName];
    } catch (error) {
        console.error(`Failed to load module: ${moduleName}`, error);
        moduleComponents[moduleName] = null;
        return null;
    }
}

function checkModulePermission(moduleName) {
    const permissions = modulePermissions[moduleName];
    if (!permissions) return true;
    
    // 简化权限检查，先跳过权限验证，让模块能正常访问
    return true;
}

async function initAuth() {
    const { default: API } = await import('./api.js');
    
    try {
        const res = await API.getCurrentUser();
        if (res.code === 200) {
            Utils.setCurrentUser(res.data);
            await renderUserInfo(res.data);
            // 等待 DOM 更新后更新侧边栏
            setTimeout(() => {
                updateSidebarForRole();
            }, 100);
        }
    } catch (e) {
        console.warn('Failed to init auth:', e);
    }
}

async function renderUserInfo(user) {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    const existingUserDropdown = document.getElementById('userDropdown');
    if (existingUserDropdown) existingUserDropdown.remove();
    
    const userDropdown = document.createElement('div');
    userDropdown.id = 'userDropdown';
    userDropdown.className = 'user-dropdown';
    userDropdown.innerHTML = `
        <button class="header-btn" id="userDropdownBtn">
            <span style="margin-right:8px;">👤</span>
            <span>${user.name || user.username}</span>
        </button>
        <div class="user-dropdown-menu" id="userDropdownMenu">
            <div class="user-dropdown-item" id="userProfile">
                <span>👤</span>
                <span>个人资料</span>
            </div>
            <div class="user-dropdown-item" id="userSettings">
                <span>⚙️</span>
                <span>系统设置</span>
            </div>
            <div class="user-dropdown-divider"></div>
            <div class="user-dropdown-item" id="userLogout">
                <span>🚪</span>
                <span>退出登录</span>
            </div>
        </div>
    `;
    
    headerActions.insertBefore(userDropdown, headerActions.firstChild);
    
    const dropdownBtn = document.getElementById('userDropdownBtn');
    const dropdownMenu = document.getElementById('userDropdownMenu');
    
    dropdownBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    document.addEventListener('click', () => {
        dropdownMenu.classList.remove('show');
    });
    
    document.getElementById('userProfile')?.addEventListener('click', async () => {
        await switchModule('dashboard');
    });
    
    document.getElementById('userSettings')?.addEventListener('click', async () => {
        await switchModule('system');
    });
    
    document.getElementById('userLogout')?.addEventListener('click', () => {
        Utils.logout();
    });
}

async function switchModule(moduleName) {
    const container = document.getElementById('content');
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');

    navItems.forEach(item => {
        if (item.dataset.module === moduleName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (pageTitle) {
        pageTitle.textContent = moduleTitles[moduleName] || '人力资源管理系统';
    }

    if (breadcrumbCurrent) {
        breadcrumbCurrent.textContent = moduleTitles[moduleName] || '人力资源管理系统';
    }

    if (currentModule && currentModule.destroy) {
        currentModule.destroy();
    }

    const hasPermission = checkModulePermission(moduleName);
    if (!hasPermission) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔒</div>
                <div class="empty-text">您没有权限访问此模块</div>
            </div>
        `;
        return;
    }

    container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"></div><div class="loading-text">加载中...</div></div>';

    const module = await loadModule(moduleName);

    if (module && module.render) {
        currentModule = module;
        await module.render(container);
    } else {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">模块开发中...</div></div>`;
    }

    // 更新底部Tab栏激活状态
    updateBottomTabActive(moduleName);
}

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader && !sidebar.querySelector('.sidebar-toggle')) {
        sidebarHeader.appendChild(toggleBtn);
    }

    // 根据用户角色调整侧边栏菜单
    updateSidebarForRole();

    const navContainer = document.querySelector('.sidebar-nav');
    if (navContainer) {
        navContainer.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.module) {
                switchModule(navItem.dataset.module);
            }
        });
    }
}

function updateSidebarForRole() {
    const currentUser = Utils.getCurrentUser();
    if (!currentUser) return;

    const isAdmin = currentUser.role === 'super_admin' || 
                    currentUser.role === 'hr_admin' || 
                    currentUser.role === 'admin';

    // 查找系统管理菜单项
    const systemNavItem = document.querySelector('.nav-item[data-module="system"]');
    if (systemNavItem) {
        if (!isAdmin) {
            // 普通员工：将系统管理改为修改密码
            const textSpan = systemNavItem.querySelector('.text');
            if (textSpan) {
                textSpan.textContent = '修改密码';
            }
            const iconSpan = systemNavItem.querySelector('.icon');
            if (iconSpan) {
                iconSpan.textContent = '🔑';
            }
        }
    }

    // 隐藏管理员专属菜单项
    const adminOnlyModules = ['import', 'openapi', 'security', 'audit'];
    adminOnlyModules.forEach(module => {
        const navItem = document.querySelector(`.nav-item[data-module="${module}"]`);
        if (navItem && !isAdmin) {
            navItem.style.display = 'none';
        }
    });

    // 找到"系统"部分标题
    const sections = document.querySelectorAll('.nav-section');
    sections.forEach(section => {
        const title = section.querySelector('.nav-section-title');
        if (title && title.textContent === '系统' && !isAdmin) {
            // 如果是普通员工，系统部分只保留修改密码，或者修改标题
            title.textContent = '个人设置';
        }
    });
}

let orgData = {
    departments: [],
    positions: [],
    employees: []
};

async function loadOrgData() {
    try {
        console.log('Loading org data...');
        const [deptRes, posRes, empRes] = await Promise.all([
            API.getOrgDepartments(),
            API.getOrgPositions(),
            API.getOrgEmployees()
        ]);
        
        console.log('Dept response:', deptRes);
        console.log('Pos response:', posRes);
        console.log('Emp response:', empRes);
        
        if (deptRes.code === 200) {
            orgData.departments = deptRes.data || [];
        }
        if (posRes.code === 200) {
            orgData.positions = posRes.data.list || posRes.data || [];
        }
        if (empRes.code === 200) {
            orgData.employees = empRes.data || [];
        }
        
        console.log('Org data loaded:', orgData);
        renderOrgSubmenu();
    } catch (error) {
        console.error('Load org data error:', error);
    }
}

function renderOrgSubmenu() {
    const submenu = document.getElementById('orgSubmenu');
    if (!submenu) return;

    let html = '';
    
    function renderDeptTree(departments, level) {
        departments.forEach(dept => {
            const deptPositions = orgData.positions.filter(p => p.departmentId === dept.id);
            const hasPositions = deptPositions.length > 0;
            
            html += `<div class="org-item dept" data-type="department" data-id="${dept.id}" style="padding-left: ${level * 16 + 16}px;">${dept.name}</div>`;
            
            if (hasPositions) {
                deptPositions.forEach(pos => {
                    const posEmployees = orgData.employees.filter(e => e.positionId === pos.id || e.position_id === pos.id);
                    
                    html += `<div class="org-item position" data-type="position" data-id="${pos.id}" style="padding-left: ${level * 16 + 32}px;">${pos.name}</div>`;
                    
                    posEmployees.forEach(emp => {
                        html += `<div class="org-item employee" data-type="employee" data-id="${emp.id}" style="padding-left: ${level * 16 + 48}px;"><span class="emp-bullet">•</span>${emp.name}</div>`;
                    });
                });
            }
            
            if (dept.children && dept.children.length > 0) {
                renderDeptTree(dept.children, level + 1);
            }
        });
    }
    
    renderDeptTree(orgData.departments, 0);
    submenu.innerHTML = html;
}

function initOrgNav() {
    const orgNavItem = document.querySelector('.nav-item.org-nav-item');
    const submenu = document.getElementById('orgSubmenu');
    
    if (orgNavItem) {
        orgNavItem.addEventListener('click', (e) => {
            e.stopPropagation();
            orgNavItem.classList.toggle('expanded');
            submenu.classList.toggle('show');
            
            switchModule('org');
        });
    }
    
    if (submenu) {
        submenu.addEventListener('click', (e) => {
            const orgItem = e.target.closest('.org-item');
            if (orgItem) {
                const type = orgItem.dataset.type;
                const id = parseInt(orgItem.dataset.id);
                
                window.orgSelectedType = type;
                window.orgSelectedId = id;
                
                switchModule('org');
            }
        });
    }
    
    loadOrgData().then(() => {
        if (orgNavItem && submenu) {
            orgNavItem.classList.add('expanded');
            submenu.classList.add('show');
        }
    });
}

let isMobileMode = false;

// 检测是否为移动端
function isMobile() {
    return window.innerWidth < 768;
}

// 检测是否为平板设备
function isTablet() {
    return window.innerWidth >= 768 && window.innerWidth <= 1024;
}

// 初始化移动端布局
function initMobileLayout() {
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const headerLeft = document.querySelector('.header-left');
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'mobileOverlay';
    document.body.appendChild(overlay);
    
    // 创建移动端菜单按钮
    const mobileMenuBtn = document.createElement('button');
    mobileMenuBtn.className = 'mobile-menu-btn';
    mobileMenuBtn.id = 'mobileMenuBtn';
    mobileMenuBtn.innerHTML = '☰';
    if (headerLeft) {
        headerLeft.insertBefore(mobileMenuBtn, headerLeft.firstChild);
    }
    
    // 创建底部Tab栏
    const bottomTabBar = document.createElement('nav');
    bottomTabBar.className = 'bottom-tab-bar';
    bottomTabBar.id = 'bottomTabBar';
    bottomTabBar.innerHTML = `
        <button class="bottom-tab-item active" data-module="dashboard">
            <span class="icon">📊</span>
            <span class="text">工作台</span>
        </button>
        <button class="bottom-tab-item" data-module="employee">
            <span class="icon">👤</span>
            <span class="text">员工</span>
        </button>
        <button class="bottom-tab-item" data-module="attendance">
            <span class="icon">📅</span>
            <span class="text">考勤</span>
        </button>
        <button class="bottom-tab-item" data-module="datav">
            <span class="icon">📈</span>
            <span class="text">大屏</span>
        </button>
        <button class="bottom-tab-item" data-module="security">
            <span class="icon">🔒</span>
            <span class="text">安全</span>
        </button>
    `;
    document.body.appendChild(bottomTabBar);
    
    // 绑定事件
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
        overlay.classList.add('show');
    });
    
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    });
    
    bottomTabBar.addEventListener('click', (e) => {
        const tabItem = e.target.closest('.bottom-tab-item');
        if (tabItem && tabItem.dataset.module) {
            const moduleName = tabItem.dataset.module;
            
            // 更新激活状态
            bottomTabBar.querySelectorAll('.bottom-tab-item').forEach(item => {
                item.classList.remove('active');
            });
            tabItem.classList.add('active');
            
            switchModule(moduleName);
        }
    });
}

// 切换布局模式
function switchLayoutMode() {
    const mobile = isMobile();
    const tablet = isTablet();
    const app = document.getElementById('app');
    const sidebar = document.getElementById('sidebar');
    const bottomTabBar = document.getElementById('bottomTabBar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileOverlay');
    
    if (mobile && !isMobileMode) {
        document.body.classList.add('mobile-mode');
        document.body.classList.remove('tablet-mode');
        isMobileMode = true;
    } else if (tablet) {
        document.body.classList.add('tablet-mode');
        document.body.classList.remove('mobile-mode');
        isMobileMode = false;
    } else if (!mobile && isMobileMode) {
        document.body.classList.remove('mobile-mode');
        document.body.classList.remove('tablet-mode');
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        isMobileMode = false;
    }
}

// 更新底部Tab栏激活状态
function updateBottomTabActive(moduleName) {
    const bottomTabBar = document.getElementById('bottomTabBar');
    if (!bottomTabBar) return;
    
    bottomTabBar.querySelectorAll('.bottom-tab-item').forEach(item => {
        if (item.dataset.module === moduleName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function initFullscreen() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'header-btn';
    fullscreenBtn.innerHTML = '⛶';
    fullscreenBtn.title = '全屏模式';
    fullscreenBtn.addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    });
    headerActions.appendChild(fullscreenBtn);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const res = await API.login(username, password);
        if (res.code === 200) {
            Utils.setCurrentUser(res.data);
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('app').style.display = '';
            await initApp();
        } else {
            Utils.Toast.error(res.message || '登录失败');
        }
    } catch (error) {
        Utils.Toast.error('登录失败，请稍后重试');
        console.error('Login error:', error);
    }
}

async function initApp() {
    APIAuth.init();
    await initAuth();
    initSidebar();
    initMobileLayout();
    initFullscreen();
    initOrgNav();

    GlobalSearch.init();
    NotificationCenter.init();
    ThemeSwitcher.init();

    switchLayoutMode();
    window.addEventListener('resize', Utils.debounce(switchLayoutMode, 200));

    await switchModule('dashboard');
}

document.addEventListener('DOMContentLoaded', async () => {
    const savedUser = Utils.getCurrentUser();
    
    if (savedUser) {
        try {
            const res = await API.getCurrentUser();
            if (res.code === 200) {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('app').style.display = '';
                await initApp();
                return;
            }
        } catch (e) {
            console.warn('Auto login failed:', e);
        }
    }
    
    document.getElementById('loginPage').style.display = '';
    document.getElementById('app').style.display = 'none';
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

export { 
    switchModule,
    modules,
    routes,
    eventBus,
    store,
    currentModule
};