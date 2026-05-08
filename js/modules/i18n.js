import zhCN from '../../locales/zh-CN.js';
import enUS from '../../locales/en-US.js';

const locales = {
    'zh-CN': zhCN,
    'en-US': enUS
};

let currentLocale = localStorage.getItem('locale') || 'zh-CN';
let listeners = [];

const i18n = {
    getCurrentLocale() {
        return currentLocale;
    },

    setLocale(locale) {
        if (locales[locale]) {
            currentLocale = locale;
            localStorage.setItem('locale', locale);
            document.documentElement.lang = locale;
            this.notifyListeners();
            return true;
        }
        return false;
    },

    getAvailableLocales() {
        return [
            { code: 'zh-CN', name: '简体中文', nativeName: '中文' },
            { code: 'en-US', name: 'English', nativeName: 'English' }
        ];
    },

    t(key, params = {}) {
        const keys = key.split('.');
        let value = locales[currentLocale];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        if (typeof value !== 'string') {
            console.warn(`Translation value is not a string: ${key}`);
            return key;
        }

        return value.replace(/\{(\w+)\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    },

    tc(key, count = 0, params = {}) {
        const translation = this.t(key, params);
        if (translation === key) return key;

        if (count > 1 && translation.includes('{count}')) {
            return translation.replace('{count}', count);
        }

        return translation;
    },

    onLocaleChange(callback) {
        if (typeof callback === 'function') {
            listeners.push(callback);
            return () => {
                listeners = listeners.filter(cb => cb !== callback);
            };
        }
        return () => {};
    },

    notifyListeners() {
        const event = {
            locale: currentLocale,
            translations: locales[currentLocale]
        };
        listeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Locale change listener error:', error);
            }
        });
    },

    translatePage(container) {
        if (!container) container = document.body;

        const translateElement = (element) => {
            const nodes = element.childNodes;
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent.trim();
                    if (text && !this.isTranslatedElement(node.parentElement)) {
                        const key = this.getTranslationKey(text);
                        if (key) {
                            const translation = this.t(key);
                            if (translation !== key) {
                                node.textContent = translation;
                            }
                        }
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const tagName = node.tagName.toLowerCase();
                    if (['script', 'style', 'input', 'textarea', 'select'].indexOf(tagName) === -1) {
                        const dataKey = node.dataset.i18n;
                        if (dataKey) {
                            const keys = dataKey.split(',');
                            keys.forEach(key => {
                                const [attr, k] = key.trim().split(':');
                                if (attr === 'text') {
                                    node.textContent = this.t(k.trim());
                                } else {
                                    node.setAttribute(attr, this.t(k.trim()));
                                }
                            });
                        }
                        translateElement(node);
                    }
                }
            }
        };

        translateElement(container);
    },

    isTranslatedElement(element) {
        if (!element) return false;
        const tagName = element.tagName?.toLowerCase();
        return ['input', 'textarea', 'select', 'button', 'script', 'style'].indexOf(tagName) !== -1 ||
               element.closest('[data-i18n-ignore]') !== null;
    },

    getTranslationKey(text) {
        const commonTexts = {
            '个人看板': 'dashboard.title',
            '员工管理': 'employee.title',
            '考勤管理': 'attendance.title',
            '绩效考核': 'performance.title',
            '招聘管理': 'recruitment.title',
            '培训管理': 'training.title',
            '系统管理': 'system.title',
            '数据大屏': 'datav.title',
            '导出中心': 'export.title',
            '数据迁移': 'migration.title',
            '系统初始化': 'setup.title',
            '确定': 'common.confirm',
            '取消': 'common.cancel',
            '保存': 'common.save',
            '删除': 'common.delete',
            '编辑': 'common.edit',
            '新增': 'common.add',
            '搜索': 'common.search',
            '重置': 'common.reset',
            '导出': 'common.export',
            '导入': 'common.import',
            '操作': 'common.operation',
            '状态': 'common.status',
            '暂无数据': 'common.noData',
            '加载中...': 'common.loading',
            '下一步': 'common.next',
            '上一步': 'common.prev',
            '完成': 'common.finish',
            '刷新': 'common.refresh',
            '下载': 'common.download',
            '查看': 'common.view',
            '关闭': 'common.close',
            '返回': 'common.back'
        };
        return commonTexts[text];
    },

    formatDate(date, format = 'short') {
        const d = new Date(date);
        if (isNaN(d.getTime())) return date;

        const localeMap = {
            'zh-CN': 'zh-CN',
            'en-US': 'en-US'
        };

        const options = {
            short: { year: 'numeric', month: '2-digit', day: '2-digit' },
            long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
            time: { hour: '2-digit', minute: '2-digit' },
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        };

        return d.toLocaleDateString(currentLocale === 'en-US' ? 'en-US' : 'zh-CN', options[format] || options.short);
    },

    formatNumber(num, decimals = 0) {
        if (typeof num !== 'number') return num;
        return num.toLocaleString(currentLocale === 'en-US' ? 'en-US' : 'zh-CN', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    formatCurrency(amount, currency = 'CNY') {
        const currencyMap = {
            'CNY': currentLocale === 'en-US' ? 'USD' : 'CNY',
            'USD': 'USD',
            'EUR': 'EUR'
        };

        return new Intl.NumberFormat(currentLocale === 'en-US' ? 'en-US' : 'zh-CN', {
            style: 'currency',
            currency: currencyMap[currency] || currency
        }).format(amount);
    },

    formatPercent(value, decimals = 1) {
        if (typeof value !== 'number') return value;
        return `${(value * 100).toFixed(decimals)}%`;
    }
};

window.i18n = i18n;

export default i18n;
