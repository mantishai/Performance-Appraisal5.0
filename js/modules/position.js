import { Toast, Skeleton } from '../utils.js';

const state = {
    positions: [
        { id: 1, name: '前端工程师', department: '技术部', level: 'P5', headcount: 10, current: 8, vacant: 2, description: '负责公司Web前端开发工作' },
        { id: 2, name: '后端工程师', department: '技术部', level: 'P5', headcount: 15, current: 12, vacant: 3, description: '负责公司后端服务开发' },
        { id: 3, name: '产品经理', department: '产品部', level: 'P6', headcount: 5, current: 5, vacant: 0, description: '负责产品规划和设计' },
        { id: 4, name: '市场专员', department: '市场部', level: 'P4', headcount: 8, current: 6, vacant: 2, description: '负责市场推广和运营' }
    ]
};

const positionModule = {
    async render(container) {
        container.innerHTML = Skeleton.renderTable(4, 7);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.renderContent(container);
    },

    renderContent(container) {
        container.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">岗位说明书</h1>
                <button class="btn btn-primary">+ 新增岗位</button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>岗位名称</th>
                                <th>所属部门</th>
                                <th>职级</th>
                                <th>编制人数</th>
                                <th>在职人数</th>
                                <th>空缺人数</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.positions.map(p => `
                                <tr>
                                    <td><strong>${p.name}</strong></td>
                                    <td>${p.department}</td>
                                    <td>${p.level}</td>
                                    <td>${p.headcount}</td>
                                    <td>${p.current}</td>
                                    <td>${p.vacant > 0 ? `<span style="color: #f5222d; font-weight: 500;">${p.vacant}</span>` : p.vacant}</td>
                                    <td>
                                        <div class="action-btns">
                                            <button class="action-btn" data-id="${p.id}" data-action="view">查看</button>
                                            <button class="action-btn" data-id="${p.id}" data-action="edit">编辑</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.bindEvents(container);
    },

    bindEvents(container) {
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const id = parseInt(btn.dataset.id);
                const action = btn.dataset.action;
                this.handleAction(id, action);
            }
        });
    },

    handleAction(id, action) {
        const pos = state.positions.find(p => p.id === id);
        if (action === 'view' && pos) {
            Toast.info(`查看【${pos.name}】岗位说明书`);
        } else if (action === 'edit') {
            Toast.info('编辑岗位信息');
        }
    },

    destroy() {}
};

export default positionModule;