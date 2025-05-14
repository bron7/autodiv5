const fs = require('fs');
const path = require('path');
const db = require('./db');

const msJsonPath = path.join(__dirname, 'ms.json');
const honorJsonPath = path.join(__dirname, 'honor.json');

async function migrateAllDataToDatabase() {
    try {
        // 1. 迁移 ms.json -> users 表
        const msData = fs.readFileSync(msJsonPath, 'utf8');
        const users = JSON.parse(msData);

        for (const user of users) {
            await db.query(
                `INSERT IGNORE INTO users (email, mbti, avatar) VALUES (?, ?, ?)`,
                [user.email, user.mbti || null, user.avatar || null]
            );
        }
        console.log('✅ Users data migrated to MySQL successfully');

        // 2. 迁移 honor.json -> honors 表
        const honorData = fs.readFileSync(honorJsonPath, 'utf8');
        const honors = JSON.parse(honorData);

        for (const honor of honors) {
            const { email, unlockedHonors } = honor;
            await db.query(
                `INSERT IGNORE INTO honors (email, unlockedHonors) VALUES (?, ?)`,
                [email, JSON.stringify(unlockedHonors)]
            );
        }
        console.log('✅ Honors data migrated to MySQL successfully');

    } catch (error) {
        console.error('❌ Error migrating data:', error.message);
    }
}

migrateAllDataToDatabase();