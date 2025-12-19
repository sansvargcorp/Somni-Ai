// Global User System (LocalStorage Database)
let currentUser = JSON.parse(localStorage.getItem('somni_user')) || null;
const USERS_KEY = 'somni_users';

// Theme System
const themeToggle = document.querySelector('.theme-toggle');
if (themeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    document.body.classList.toggle('light-mode', savedTheme === 'light');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Sleep Debt Calculator (Scientifically Accurate)
function calculateSleepDebt(logs = [], sportModifier = 0) {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(log => log.timestamp > weekAgo);
    const idealWeekly = (7.5 + sportModifier) * 7; // 52.5h base + sport
    const actualSleep = recentLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    return Math.max(0, idealWeekly - actualSleep).toFixed(1);
}

// User Management
function createUser(username, password, sport = 'none') {
    const userId = btoa(username + Date.now() + Math.random().toString());
    const sportModifier = { none: 0, gym: 0.5, athlete: 1 }[sport];
    
    const newUser = {
        id: userId,
        username,
        password: btoa(password),
        plan: 'free',
        features: { core: false, pro: false, elite: false, feeling: false, weekly: false },
        logs: [],
        sport,
        sportModifier,
        promo_used: false,
        created: Date.now()
    };
    
    // Save to users array
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Set as current
    currentUser = newUser;
    localStorage.setItem('somni_user', JSON.stringify(newUser));
    window.location.href = 'dashboard.html';
}

function login(username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username && u.password === btoa(password));
    
    if (user) {
        currentUser = user;
        localStorage.setItem('somni_user', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Demo Calculator
    if (document.getElementById('demo-bed')) {
        document.getElementById('demo-bed').addEventListener('change', calculateDemoDebt);
        document.getElementById('demo-wake').addEventListener('change', calculateDemoDebt);
        document.getElementById('demo-sport').addEventListener('change', calculateDemoDebt);
    }
    
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            login(username, password);
        });
    }
    
    // Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;
            const sport = document.getElementById('signup-sport').value;
            createUser(username, password, sport);
        });
    }
    
    // Dashboard Load
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
    }
    
    // Plan Check from URL
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan && currentUser) {
        setPlan(plan);
    }
});

// Demo Debt Calculator
function calculateDemoDebt() {
    const bed = document.getElementById('demo-bed').value;
    const wake = document.getElementById('demo-wake').value;
    const sport = parseFloat(document.getElementById('demo-sport').value);
    
    const bedTime = new Date('2000-01-01T' + bed);
    const wakeTime = new Date('2000-01-01T' + wake);
    let duration = (wakeTime - bedTime) / (1000 * 60 * 60);
    
    if (duration < 0) duration += 24;
    const weeklyAvg = duration;
    const debt = Math.max(0, (52.5 + sport * 7) - (weeklyAvg * 7));
    
    document.getElementById('demo-result').innerHTML = `
        <div style="font-size:2.5rem; color:#ef4444; margin:1rem 0;">${debt.toFixed(1)}h</div>
        <p>${duration.toFixed(1)}h/night average</p>
        <p>Your debt is <strong>${debt > 10 ? 'critical' : debt > 5 ? 'high' : 'manageable'}</strong></p>
        <a href="signup.html" class="cta-primary" style="margin-top:1.5rem;">Fix This Free →</a>
    `;
}

// Plan Management
function setPlan(plan) {
    if (!currentUser) return;
    
    currentUser.plan = plan;
    switch(plan) {
        case 'core':
            currentUser.features.core = true;
            currentUser.features.feeling = true;
            break;
        case 'pro':
            currentUser.features.core = true;
            currentUser.features.pro = true;
            currentUser.features.feeling = true;
            currentUser.features.weekly = true;
            break;
        case 'elite':
            currentUser.features = { core: true, pro: true, elite: true, feeling: true, weekly: true };
            break;
    }
    localStorage.setItem('somni_user', JSON.stringify(currentUser));
    localStorage.setItem(USERS_KEY, JSON.stringify(
        JSON.parse(localStorage.getItem(USERS_KEY) || '[]').map(u => u.id === currentUser.id ? currentUser : u)
    ));
}

// HIDDEN PROMO (Inspect to find)
function applyPromo() {
    const code = document.getElementById('promo-input').value;
    if (code === 'TEST123' && currentUser && !currentUser.promo_used) {
        currentUser.promo_used = true;
        setPlan('elite');
        alert('✅ Elite unlocked permanently via promo');
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid or already used');
    }
}

// Dashboard Loader
function loadDashboard() {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    const debt = calculateSleepDebt(currentUser.logs, currentUser.sportModifier);
    document.getElementById('current-debt').textContent = debt + 'h';
    
    const lastLog = currentUser.logs[currentUser.logs.length - 1];
    if (lastLog) {
        document.getElementById('last-night').textContent = 
            `${(lastLog.duration || 0).toFixed(1)}h | ${new Date(lastLog.timestamp).toLocaleDateString()}`;
    }
    
    // Feature Flags
    const planBadge = document.getElementById('plan-badge');
    planBadge.textContent = currentUser.promo_used ? 'Elite (Promo)' : 
                           currentUser.plan.charAt(0).toUpperCase() + currentUser.plan.slice(1) + ' Plan';
    
    if (currentUser.features.feeling || currentUser.promo_used) {
        document.getElementById('feeling-link').classList.remove('locked');
    }
    if (currentUser.features.weekly || currentUser.promo_used) {
        document.getElementById('weekly-link').classList.remove('locked');
    }
}

// Feature Check Helper
function hasFeature(feature) {
    if (!currentUser) return false;
    if (currentUser.promo_used) return true;
    return currentUser.features[feature] || false;
}
