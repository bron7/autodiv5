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

// 获取所有用户数据
app.get('/api/users', async (req, res) => {
    try {
        const [users] = await db.query('SELECT * FROM users');
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// 初始化用户成就数据
app.post('/init-user-data', async (req, res) => {
    const { email, mbti } = req.body;

    try {
        // 检查用户是否已存在
        const [existingUser] = await db.query('SELECT * FROM user_honors WHERE email = ?', [email]);
        
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'User already exists in honor data' });
        }

        // 初始化成就数据
        const unlockedHonors = ['初出茅庐'];
        if (mbti) {
            unlockedHonors.push('MBTI');
        }

        // 添加新用户成就数据
        await db.query(
            'INSERT INTO user_honors (email, unlocked_honors) VALUES (?, ?)',
            [email, JSON.stringify(unlockedHonors)]
        );

        res.json({ message: 'User data initialized successfully' });
    } catch (err) {
        console.error('Error initializing user data:', err);
        res.status(500).json({ error: 'Failed to initialize user data' });
    }
});

// 更新用户头像
app.put('/api/users/:email/avatar', async (req, res) => {
    const { email } = req.params;
    const { avatar } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE users SET avatar = ? WHERE email = ?',
            [avatar, email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [updatedUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        res.json({ message: 'Avatar updated successfully', user: updatedUser[0] });
    } catch (err) {
        console.error('Error updating avatar:', err);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

// 注册新用户
app.post('/api/register', async (req, res) => {
    const { username, email, password, mbti, active = 'yes', outgoing = 'yes', avatar } = req.body;

    // 基础验证
    if (!username || !email || !password) {
        console.log('Missing required fields:', { username, email, password });
        return res.status(400).json({ error: 'Username, email and password are required' });
    }

    try {
        console.log('Checking for existing user with email:', email);
        // 检查邮箱是否已存在
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            console.log('Email already exists:', email);
            return res.status(400).json({ error: 'Email already exists' });
        }

        console.log('Creating new user:', { username, email, mbti, active, outgoing });
        // 创建新用户
        const [result] = await db.query(
            `INSERT INTO users (username, email, password, mbti, active, outgoing, avatar) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, email, password, mbti || '', active, outgoing, avatar || 'resources/avatar/mbti/default.jpg']
        );

        console.log('User created with ID:', result.insertId);
        // 获取新创建的用户
        const [newUser] = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);

        // 初始化用户成就数据
        try {
            const unlockedHonors = ['初出茅庐'];
            if (mbti) {
                unlockedHonors.push('MBTI');
            }
            await db.query(
                'INSERT INTO user_honors (email, unlocked_honors) VALUES (?, ?)',
                [email, JSON.stringify(unlockedHonors)]
            );
            console.log('User honors initialized for:', email);
        } catch (honorErr) {
            console.error('Error initializing user honors:', honorErr);
            // 继续执行，因为成就初始化失败不应该影响用户注册
        }

        res.status(201).json({
            message: 'User registered successfully',
            user: newUser[0]
        });
    } catch (err) {
        console.error('Error registering user:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            sqlMessage: err.sqlMessage
        });
        res.status(500).json({ 
            error: 'Failed to register user',
            details: err.message
        });
    }
});

// 测试数据库连接
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1');
        res.json({ dbTest: rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    // 启动 honor-backend 目录下的 server.js
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