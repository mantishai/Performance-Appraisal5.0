import express from 'express';

const app = express();
const PORT = 8080;

app.get('/api/test', (req, res) => {
    res.json({ message: 'Test successful' });
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});
