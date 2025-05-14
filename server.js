const express = require('express');
const fs = require('fs');
const db = require('./ms/db');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json()); // 使用 Express 内置的 JSON 解析中间件

// 新增：提供静态文件
app.use(express.static(path.join(__dirname)));

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

// 新增：初始化用户成就数据
app.post('/init-user-data', (req, res) => {
    const { email, mbti } = req.body; // 修改：接收 mbti 参数

    // 读取现有成就数据
    const honorDataPath = path.join(__dirname, 'ms/honor.json');
    fs.readFile(honorDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading honor data:', err);
            return res.status(500).json({ error: 'Failed to read honor data' });
        }

        const honors = JSON.parse(data);

        // 检查用户是否已存在
        const userExists = honors.some(user => user.email === email);
        if (userExists) {
            return res.status(400).json({ error: 'User already exists in honor data' });
        }

        // 初始化成就数据
        const unlockedHonors = ['初出茅庐']; // 默认解锁“初出茅庐”成就
        if (mbti) { // 如果用户填写了 MBTI，则额外解锁“MBTI”成就
            unlockedHonors.push('MBTI');
        }

        // 添加新用户成就数据
        const newUserHonor = {
            email,
            unlockedHonors
        };
        honors.push(newUserHonor);

        // 将更新后的成就数据写回文件
        fs.writeFile(honorDataPath, JSON.stringify(honors, null, 2), err => {
            if (err) {
                console.error('Error writing honor data:', err);
                return res.status(500).json({ error: 'Failed to write honor data' });
            }
            res.json({ message: 'User data initialized successfully' });
        });
    });
});

// 新增：保存用户数据到 ms.json 文件
app.post('/save-user-data', (req, res) => {
    const newUser = req.body;

    // 读取现有用户数据
    fs.readFile(userDataPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading user data:', err);
            return res.status(500).json({ error: 'Failed to read user data' });
        }

        const users = JSON.parse(data);

        // 检查邮箱是否已存在
        const emailExists = users.some(user => user.email === newUser.email);
        if (emailExists) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // 添加新用户数据
        users.push(newUser);

        // 将更新后的用户数据写回文件
        fs.writeFile(userDataPath, JSON.stringify(users, null, 2), err => {
            if (err) {
                console.error('Error writing user data:', err);
                return res.status(500).json({ error: 'Failed to write user data' });
            }
            res.json({ message: 'User registered successfully' });
        });
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

// 注册新用户
app.post('/api/register', async (req, res) => {
    const { username, email, password, mbti, active = 'yes', outgoing = 'yes', avatar } = req.body;

    // 基础验证
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required' });
    }

    try {
        // 1. 读取现有 JSON 数据
        const data = fs.readFileSync(userDataPath, 'utf8');
        const users = JSON.parse(data);

        // 防止重复注册
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // 2. 创建新用户对象
        const newUser = {
            username,
            email,
            password,
            mbti: mbti || '',
            active,
            outgoing,
            avatar: avatar || 'resources/avatar/mbti/default.jpg'
        };

        // 3. 添加到 JSON 数据并写回文件
        users.push(newUser);
        fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));

        // 4. 插入到数据库
        await db.query(
            `INSERT INTO users (username, email, password, mbti, active, outgoing, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, password, mbti, active, outgoing, avatar]
        );
         console.log(`✅ 已插入用户到数据库: ${email}`);
         const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
         console.log('🔍 插入后查询用户:', rows);
        // 5. 返回响应
        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });
               
    } catch (err) {
        console.error('Error registering user:', err.message);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// 在 server.js 中测试
app.get('/test-db', async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.query('SELECT 1');
        res.json({ dbTest: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // 新增：启动 honor-backend 目录下的 server.js
    const honorBackendPath = path.join(__dirname, 'honor-backend', 'server.js');
    exec(`node ${honorBackendPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting honor-backend server: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`honor-backend server stderr: ${stderr}`);
            return;
        }
        console.log(`honor-backend server stdout: ${stdout}`);
    });
});