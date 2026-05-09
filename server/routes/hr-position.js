import express from 'express';
const router = express.Router();

let positionDataStore = {};

router.post('/save', (req, res) => {
    try {
        const { positionId, data } = req.body;
        positionDataStore[positionId] = data;
        res.json({ success: true, message: '保存成功' });
    } catch (error) {
        console.error('Save position error:', error);
        res.json({ success: false, message: '保存失败' });
    }
});

router.get('/:positionId', (req, res) => {
    try {
        const { positionId } = req.params;
        const data = positionDataStore[positionId];
        
        if (data) {
            res.json({ success: true, data: data });
        } else {
            res.json({ success: false, message: '未找到岗位数据' });
        }
    } catch (error) {
        console.error('Get position error:', error);
        res.json({ success: false, message: '获取失败' });
    }
});

export default router;