require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
app.set('trust proxy', 1);

const ALLOWED_ROLES = [
    '1308450447014494271',
    '1308450447014494270',
    '1447687593205563522',
    '1470199734592602276',
    '1371576158411554950',
    '1352538738756030538',
    '1447887629751291964',
    '1371576366096584815',
    '1308450446775685239',
    '1324827873164394536',
    '1308450446955909154',
    '1324111106209218711',
    '1308450446955909157',
    '1308450447014494274',
    '1416737946526023711',
    '1308450447014494273'
];

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/discord/callback';
const SESSION_SECRET = process.env.SESSION_SECRET;

const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;
const HISTORY_FILE = isVercel
    ? '/tmp/login_history.json'
    : path.join(__dirname, 'login_history.json');

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new DiscordStrategy({
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['identify', 'guilds', 'guilds.members.read']
}, (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, {
        ...profile,
        accessToken,
        refreshToken
    }));
}));

async function checkUserRoles(userId, accessToken) {
    try {
        const response = await fetch(
            `https://discord.com/api/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            console.log('Nie udało się pobrać danych członka');
            return false;
        }

        const memberData = await response.json();
        const userRoles = memberData.roles || [];
        const hasAllowedRole = userRoles.some(roleId => ALLOWED_ROLES.includes(roleId));

        console.log(`Użytkownik ${userId}: role=${JSON.stringify(userRoles)}, dostęp=${hasAllowedRole}`);
        return hasAllowedRole;
    } catch (error) {
        console.error('Błąd sprawdzania ról:', error);
        return false;
    }
}

function saveLoginHistory(userId, username) {
    let history = [];

    if (fs.existsSync(HISTORY_FILE)) {
        try {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) {
            history = [];
        }
    }

    const entry = {
        userId,
        username,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('pl-PL')
    };

    history.unshift(entry);

    if (history.length > 100) {
        history = history.slice(0, 100);
    }

    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('Błąd zapisu historii logowań:', error);
    }

    console.log(`[LOGIN] ${username} (${userId}) - ${entry.date}`);
}

function getLoginHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        } catch (e) {
            return [];
        }
    }
    return [];
}

app.get('/auth/discord', passport.authenticate('discord'));

app.get(
    '/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/?error=unauthorized' }),
    async (req, res) => {
        try {
            const accessToken = req.user?.accessToken;

            if (!accessToken) {
                console.error('Brak accessToken');
                return res.redirect('/?error=authfailed');
            }

            const hasAccess = await checkUserRoles(req.user.id, accessToken);

            if (hasAccess) {
                req.session.discordUser = {
                    id: req.user.id,
                    username: req.user.username,
                    avatar: req.user.avatar
                };
                req.session.isAuthenticated = true;

                saveLoginHistory(req.user.id, req.user.username);
                return res.redirect('/');
            } else {
                return res.redirect('/?error=noaccess');
            }
        } catch (error) {
            console.error('Błąd callback:', error);
            return res.redirect('/?error=authfailed');
        }
    }
);

app.get('/auth/logout', (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.isAuthenticated && req.session.discordUser) {
        res.json({
            authenticated: true,
            user: req.session.discordUser
        });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/login-history', (req, res) => {
    const history = getLoginHistory();
    res.json(history);
});

function requireAuth(req, res, next) {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/?error=unauthorized');
}

app.get('/', (req, res) => {
    if (req.session.isAuthenticated) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.sendFile(path.join(__dirname, 'login.html'));
    }
});

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/script.js', express.static(path.join(__dirname, 'script.js')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Serwer działa na porcie ${PORT}`);
    console.log(`========================================`);
    console.log(`Logowanie: http://localhost:${PORT}/auth/discord`);
    console.log(`Wylogowanie: http://localhost:${PORT}/auth/logout`);
    console.log(`========================================`);
});
