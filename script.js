// 监听显示注册表单的链接点击事件
document.getElementById('show-register').addEventListener('click', function(event) {
    event.preventDefault();
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.style.display = 'block';
    } else {
        console.error('注册表单元素未找到');
    }
});

// 新增：监听关闭按钮点击事件
document.getElementById('close-register').addEventListener('click', function() {
    document.getElementById('register-form').style.display = 'none';
});

// 监听注册表单提交事件
document.getElementById('register').addEventListener('submit', function(event) {
    event.preventDefault();

    // 获取表单数据
    const username = document.getElementById('register-username').value;
    const mbti = document.getElementById('register-mbti').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const active = document.getElementById('register-active').value;
    const outgoing = document.getElementById('register-outgoing').value;

    // 验证必填项
    if (!username || !email || !password || !confirmPassword || !active || !outgoing) {
        alert('请填写所有必填项');
        return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('请输入有效的邮箱地址');
        return;
    }

    // 验证密码强度（示例：至少6位）
    if (password.length < 6) {
        alert('密码至少需要6位');
        return;
    }

    // 验证两次密码是否一致
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }

    // 构建用户数据对象
    const userData = {
        username: username,
        mbti: mbti,
        email: email,
        password: password,
        active: active,
        outgoing: outgoing
    };

    // 将用户数据保存到 ms.json 文件
    saveUserData(userData);
});

function saveUserData(data) {
    // 使用 AJAX 请求将用户数据发送到后端
    fetch('/save-user-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            alert(result.error); // 显示错误信息
        } else {
            alert('注册成功'); // 显示注册成功提示
            document.getElementById('register-form').style.display = 'none'; // 隐藏注册表单

            // 新增：注册成功后，更新头像并初始化成就数据
            updateAvatarAndInitHonor(data);

            window.location.href = '/'; // 跳转到登录页面
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('注册失败，请重试');
    });
}

// 新增：更新头像并初始化成就数据
function updateAvatarAndInitHonor(userData) {
    const { email, mbti } = userData;
    const avatarPath = `resources/avatar/mbti/${mbti || 'default'}.jpg`;

    // 更新头像
    fetch(`/api/users/${email}/avatar`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: avatarPath })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Avatar updated successfully') {
            console.log('头像更新成功');
        } else {
            console.error('头像更新失败');
        }
    })
    .catch(error => {
        console.error('头像更新失败:', error);
    });

    // 初始化成就数据
    fetch('/init-user-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'User data initialized successfully') {
            console.log('成就数据初始化成功');
        } else {
            console.error('成就数据初始化失败');
        }
    })
    .catch(error => {
        console.error('成就数据初始化失败:', error);
    });
}

// 加载用户数据的JSON文件
const userDataUrl = '/ms/ms.json'; // 修改为相对路径，确保服务器能够正确访问

// 获取登录表单元素
const loginForm = document.querySelector('form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// 添加登录表单提交事件监听器
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // 阻止表单默认提交行为

    const username = usernameInput.value.trim(); // 实际上是邮箱
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('请输入邮箱和密码');
        return;
    }

    try {
        // 从JSON文件中加载用户数据
        const response = await fetch(userDataUrl);
        const users = await response.json();

        console.log('Loaded users:', users); // 添加调试信息，查看加载的用户数据

        // 查找匹配的用户（根据邮箱匹配）
        const user = users.find(u => u.email === username);

        console.log('Found user:', user); // 添加调试信息，查看找到的用户

        if (user && user.password === password) {
            // 将用户名存储到 localStorage 中
            localStorage.setItem('loggedInUsername', user.username);
            localStorage.setItem('loggedInUser', JSON.stringify(user)); // 新增：存储完整的用户信息
            window.location.href = 'main.html'; // 登录成功后直接跳转到 main.html
        } else {
            console.error('邮箱或密码错误:', username, password); // 添加调试信息
            alert('邮箱或密码错误，请重试');
        }
    } catch (error) {
        console.error('加载用户数据失败:', error);
        alert('登录失败，请稍后再试');
    }
});

// 动态加载小队列表
document.addEventListener("DOMContentLoaded", function () {
    const recentTeamsContainer = document.getElementById("recent-teams");

    // 模拟获取用户小队数据
    fetch("/api/user/teams") // 替换为实际的 API 路径
        .then(response => response.json())
        .then(data => {
            const teams = data.slice(0, 3); // 只显示最新的三个小队
            teams.forEach(team => {
                const teamCard = `
                    <div class="col-md-4">
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">${team.name}</h5>
                                <p class="card-text">${team.description}</p>
                            </div>
                        </div>
                    </div>
                `;
                recentTeamsContainer.insertAdjacentHTML("beforeend", teamCard);
            });
        })
        .catch(error => console.error("Failed to load teams:", error));
});