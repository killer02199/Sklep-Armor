const ALLOWED_ROLES = [
    '1308450447014494274',
    '1465806412952113373',
    '1416737946526023711',
    '1308450447014494273',
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
    '1308450446955909159'
];

const DISCORD_CLIENT_ID = '1474406038483505376';
const DISCORD_CLIENT_SECRET = '4B8yCL_N_NDFwYiImUiIckiJFR1r9AHp';
const DISCORD_GUILD_ID = '1308450446758645811';

function getCallbackUrl(env, request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}/auth/discord/callback`;
}

function redirectToDiscord(request, env) {
    const callbackUrl = getCallbackUrl(env, request);
    const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
    discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
    discordAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    discordAuthUrl.searchParams.set('response_type', 'code');
    discordAuthUrl.searchParams.set('scope', 'identify guilds guilds.members.read');
    discordAuthUrl.searchParams.set('state', createState(request));
    
    return Response.redirect(discordAuthUrl.toString(), 302);
}

function createState(request) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${random}`);
}

function verifyState(request) {
    const url = new URL(request.url);
    return url.searchParams.get('state');
}

async function getDiscordToken(code, callbackUrl) {
    const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: callbackUrl,
        }),
    });
    
    if (!response.ok) {
        console.error('Token exchange failed:', await response.text());
        return null;
    }
    
    return await response.json();
}

async function getDiscordUser(accessToken) {
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    
    if (!response.ok) return null;
    return await response.json();
}

async function getUserRoles(accessToken, guildId) {
    const response = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    
    if (!response.ok) return { roles: [] };
    return await response.json();
}

async function checkUserAccess(accessToken) {
    const memberData = await getUserRoles(accessToken, DISCORD_GUILD_ID);
    const userRoles = memberData.roles || [];
    return userRoles.some(roleId => ALLOWED_ROLES.includes(roleId));
}

function setSessionCookie(response, userData) {
    const sessionData = btoa(JSON.stringify(userData));
    const cookie = `session=${sessionData}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${24 * 60 * 60}`;
    response.headers.set('Set-Cookie', cookie);
    return response;
}

function getSessionData(request) {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;
    
    const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => c.split('='))
    );
    
    if (!cookies.session) return null;
    
    try {
        return JSON.parse(atob(cookies.session));
    } catch {
        return null;
    }
}

function clearSessionCookie(response) {
    response.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return response;
}

async function handleRequest(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    if (pathname.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/i)) {
        return fetch(`https://armor-shop-static.pages.dev${pathname}`);
    }
    
    if (pathname === '/auth/discord') {
        return redirectToDiscord(request, env);
    }
    
    if (pathname === '/auth/discord/callback') {
        const code = url.searchParams.get('code');
        if (!code) {
            return Response.redirect(new URL('/?error=nocode', request.url).toString(), 302);
        }
        
        const callbackUrl = getCallbackUrl(env, request);
        const tokenData = await getDiscordToken(code, callbackUrl);
        
        if (!tokenData || !tokenData.access_token) {
            return Response.redirect(new URL('/?error=autherror', request.url).toString(), 302);
        }
        
        const userData = await getDiscordUser(tokenData.access_token);
        if (!userData) {
            return Response.redirect(new URL('/?error=usererror', request.url).toString(), 302);
        }
        
        const hasAccess = await checkUserAccess(tokenData.access_token);
        
        if (hasAccess) {
            const sessionUser = {
                id: userData.id,
                username: userData.username,
                avatar: userData.avatar,
                accessToken: tokenData.access_token
            };
            
            const response = Response.redirect(new URL('/', request.url).toString(), 302);
            return setSessionCookie(response, sessionUser);
        } else {
            return Response.redirect(new URL('/?error=noaccess', request.url).toString(), 302);
        }
    }
    
    if (pathname === '/auth/logout') {
        const response = Response.redirect(new URL('/', request.url).toString(), 302);
        return clearSessionCookie(response);
    }
    
    if (pathname === '/api/auth/status') {
        const session = getSessionData(request);
        if (session && session.id) {
            return new Response(JSON.stringify({
                authenticated: true,
                user: {
                    id: session.id,
                    username: session.username,
                    avatar: session.avatar
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        return new Response(JSON.stringify({ authenticated: false }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (pathname === '/' || pathname === '') {
        const session = getSessionData(request);
        
        if (session && session.id) {
            const indexResponse = await fetch(`https://armor-shop-static.pages.dev/index.html`);
            return new Response(await indexResponse.text(), {
                headers: { 'Content-Type': 'text/html' }
            });
        } else {
            const loginResponse = await fetch(`https://armor-shop-static.pages.dev/login.html`);
            return new Response(await loginResponse.text(), {
                headers: { 'Content-Type': 'text/html' }
            });
        }
    }
    
    const session = getSessionData(request);
    if (session && session.id) {
        const indexResponse = await fetch(`https://armor-shop-static.pages.dev/index.html`);
        return new Response(await indexResponse.text(), {
            headers: { 'Content-Type': 'text/html' }
        });
    } else {
        const loginResponse = await fetch(`https://armor-shop-static.pages.dev/login.html`);
        return new Response(await loginResponse.text(), {
            headers: { 'Content-Type': 'text/html' }
        });
    }
}

export default {
    async fetch(request, env) {
        try {
            return await handleRequest(request, env);
        } catch (error) {
            console.error('Error:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }
};
