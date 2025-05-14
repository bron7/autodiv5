const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 读取用户数据
const userDataPath = path.join(__dirname, 'ms/ms.json');

// 获取所有用户数据
app.get('/api/users', (req, res) => {
    fs.readFile(userDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err); // 添加错误日志
            return res.status(500).json({ error: 'Failed to read user data' });
        }
        res.json(JSON.parse(data));
    });
});

// 更新用户头像
app.put('/api/users/:email/avatar', (req, res) => {
    const { email } = req.params;
    const { avatar } = req.body;

    fs.readFile(userDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err); // 添加错误日志
            return res.status(500).json({ error: 'Failed to read user data' });
        }

        const users = JSON.parse(data);
        const userIndex = users.findIndex(user => user.email === email);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        users[userIndex].avatar = avatar;

        fs.writeFile(userDataPath, JSON.stringify(users, null, 2), err => {
            if (err) {
                console.error('Error updating user data:', err); // 添加错误日志
                return res.status(500).json({ error: 'Failed to update user data' });
            }
            res.json({ message: 'Avatar updated successfully', user: users[userIndex] });
        });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});