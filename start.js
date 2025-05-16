const { spawn } = require('child_process');
const path = require('path');

// 启动主服务器
const mainServer = spawn('node', ['server.js'], {
    stdio: 'inherit'
});

// 启动成就服务器
const honorServer = spawn('node', ['honor-backend/server.js'], {
    stdio: 'inherit'
});

// 处理进程退出
process.on('SIGINT', () => {
    mainServer.kill();
    honorServer.kill();
    process.exit();
});

// 处理错误
mainServer.on('error', (err) => {
    console.error('主服务器错误:', err);
});

honorServer.on('error', (err) => {
    console.error('成就服务器错误:', err);
}); 