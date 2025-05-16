const express = require('express');
const path = require('path');
const db = require('../ms/db');

const app = express();
const PORT = 3001;

app.use(express.json());

// 获取用户成就数据
app.get('/api/honors/:email', async (req, res) => {
    try {
        const [honors] = await db.query(
            'SELECT * FROM user_honors WHERE email = ?',
            [req.params.email]
        );
        
        if (honors.length === 0) {
            return res.status(404).json({ error: 'User honors not found' });
        }
        
        res.json(honors[0]);
    } catch (err) {
        console.error('Error fetching user honors:', err);
        res.status(500).json({ error: 'Failed to fetch user honors' });
    }
});

// 更新用户成就数据
app.put('/api/honors/:email', async (req, res) => {
    const { unlockedHonors } = req.body;
    
    try {
        const [result] = await db.query(
            'UPDATE user_honors SET unlocked_honors = ? WHERE email = ?',
            [JSON.stringify(unlockedHonors), req.params.email]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User honors not found' });
        }
        
        res.json({ message: 'Honors updated successfully' });
    } catch (err) {
        console.error('Error updating user honors:', err);
        res.status(500).json({ error: 'Failed to update user honors' });
    }
});

app.listen(PORT, () => {
    console.log(`Honor backend server is running on http://localhost:${PORT}`);
});