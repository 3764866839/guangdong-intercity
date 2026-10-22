/**
 * 广东城际APP - 本地开发服务器 + API代理
 * 用法: node server.js  然后访问 http://localhost:8080
 * 功能: 1. 静态文件服务  2. /api/plan 等代理到官方接口
 *       （官方 weChat/schedule 已下线，车次查询统一走 /api/plan）
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const TARGET_HOST = 'iro-traa.gzmtr.com';
const TARGET_ORIGIN = 'https://' + TARGET_HOST;
// 官方 2026-09 起对 /weChat/* 强制要求 key，缺失即 404。
// 该 key 是官方前端硬编码的，随时可能被换——故不把它当常量，而是运行时从官方
// traa-metro.html 现抓（见 extractOfficialKey / refreshOfficialKey），失效自动重取。
const OFFICIAL_PAGE = '/traa-metro.html';
let officialApiKey = 'xxglslyx';               // 预置当前已知值，首次请求即可用（失效会自动重取）
let officialKeyFetchedAt = 0;
let officialKeySource = 'hardcoded-fallback';  // hardcoded-fallback | page | page-fallback

// 从官方页面 HTML 里提取 key。绑定关系故意放宽（不要求引号形式），
// 以兼容官方将来改写调用方式：既支持 &key=xxglslyx，也支持 params.append('key','xxglslyx')
function extractOfficialKey(html) {
    if (!html) return null;
    const patterns = [
        /["'`]key["'`]\s*,\s*["'`]([A-Za-z0-9_-]{4,64})["'`]/,
        /[?&]key=([A-Za-z0-9_-]{4,64})/,
        /["'`]key=([A-Za-z0-9_-]{4,64})["'`]/
    ];
    for (const re of patterns) {
        const m = html.match(re);
        if (m && m[1] && m[1] !== 'null' && m[1] !== 'undefined') return m[1];
    }
    return null;
}

// 现抓官方 key；成功返回新 key，失败返回 null（保留旧 key 不动）
function refreshOfficialKey() {
    return new Promise(function (resolve) {
        const req = https.get(TARGET_ORIGIN + OFFICIAL_PAGE, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Accept': 'text/html,*/*'
            },
            timeout: 15000
        }, function (r) {
            let body = '';
            r.on('data', function (c) { body += c; });
            r.on('end', function () {
                const found = extractOfficialKey(body);
                if (found) {
                    if (found !== officialApiKey) {
                        console.log('[key] 官方接口 key 已更新: ' + officialApiKey + ' -> ' + found + '（来源 ' + OFFICIAL_PAGE + '）');
                    }
                    officialApiKey = found;
                    officialKeyFetchedAt = Date.now();
                    officialKeySource = 'page';
                    resolve(found);
                } else {
                    console.log('[key] 未能从官方页面提取 key，继续沿用: ' + officialApiKey);
                    officialKeySource = 'page-fallback';
                    resolve(null);
                }
            });
        });
        req.on('timeout', function () { req.destroy(); resolve(null); });
        req.on('error', function (e) {
            console.log('[key] 抓取官方页面失败(' + e.message + ')，继续沿用: ' + officialApiKey);
            resolve(null);
        });
    });
}

// ========== 官方工单系统 (kfmcs.gzmtr.com:22601) 常量 ==========
const KF_HOST = 'kfmcs.gzmtr.com';
const KF_PORT = 22601;
const KF_JID = 'ynzumxu5yxo3oa#test779_web21685359737927899';
const KF_ORG = 'ynzumxu5yxo3oa';
const KF_APP = 'test779';
const KF_USER = 'web21685359737927899';
const KF_CUSTOMER = '2SQm';
const KF_WORKGROUP = 'service';
const KF_TEMPLATE = '277337558fe647e588a320c5f1658e93';
const KF_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// 通用 HTTPS 请求（支持 GET/POST）—— 带超时保护，避免上游挂起时永久等待
function httpsRequest(url, options, body) {
    return new Promise(function (resolve, reject) {
        const req = https.request(url, options, function (res) {
            let data = '';
            res.on('data', function (chunk) { data += chunk; });
            res.on('end', function () {
                resolve({ status: res.statusCode, body: data });
            });
        });
        // 超时（10秒）后销毁连接，防止请求永久挂起
        req.setTimeout(10000, function () {
            req.destroy(new Error('上游请求超时'));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

// 提交工单到官方客服系统（完整链路: token -> POST /v2/orders）
async function submitKfOrder(form) {
    const base = 'https://' + KF_HOST + ':' + KF_PORT;

    // 1. 获取 X-Token
    const tokenRes = await httpsRequest(
        base + '/prod/rest/token?jidNode=' + encodeURIComponent(KF_JID),
        { method: 'GET', headers: { 'User-Agent': KF_UA, 'Accept': 'application/json, text/plain, */*' } }
    );
    let token = '';
    try {
        token = JSON.parse(tokenRes.body).token || '';
    } catch (e) { /* 忽略解析错误 */ }
    if (!token) {
        return { code: 500, message: '获取工单令牌失败，请稍后重试' };
    }

    // 2. 构造工单数据
    const postData = {
        priority: 2,                       // 高优先级
        customerId: KF_CUSTOMER,
        jidNode: KF_JID,
        env: 'prod',
        orgName: KF_ORG,
        appName: KF_APP,
        userName: KF_USER,
        workgroupId: KF_WORKGROUP,
        subject: form.subject || '咨询',
        description: form.content,
        templateId: KF_TEMPLATE,
        extendFields: {
            extend3: form.name,                     // 姓名
            extend4: form.phone,                    // 电话
            extend8: form.address || '',            // 具体地址
            extend10: form.needReply === '是' ? '0' : '1', // 是否需要回复(0是/1否)
            extend62: form.line || '',              // 所在线路
            extend63: form.station || ''            // 所在站点
        }
    };

    // 3. 提交工单
    const orderRes = await httpsRequest(
        base + '/order/rest/' + KF_ORG + '/' + KF_APP + '/v2/orders',
        {
            method: 'POST',
            headers: {
                'User-Agent': KF_UA,
                'Content-Type': 'application/json',
                'X-Token': token,
                'Accept': 'application/json, text/plain, */*'
            }
        },
        '[' + JSON.stringify(postData) + ']'
    );

    let result = {};
    try {
        result = JSON.parse(orderRes.body);
    } catch (e) {
        result = { code: orderRes.status, message: orderRes.body };
    }
    return result;
}

// MIME类型映射
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// ========== 官方 API 限流保护 ==========
// 背景: 官方 iro-traa.gzmtr.com 接口按 IP 限流，高频请求（如调试时的连发测试）
//       会触发临时封禁（返回 data:null 数十分钟至数小时）。这里对发往官方的
//       代理请求做节流：每 10 秒最多 6 个请求，超出返回 429，避免应用自身
//       把当前 IP 打爆。
const OFFICIAL_RATE = { windowMs: 10000, max: 6, hits: [], blockUntil: 0 };
function officialRateLimited() {
    const now = Date.now();
    if (now < OFFICIAL_RATE.blockUntil) return true;
    // 清除窗口外的记录
    OFFICIAL_RATE.hits = OFFICIAL_RATE.hits.filter(function (t) { return now - t < OFFICIAL_RATE.windowMs; });
    if (OFFICIAL_RATE.hits.length >= OFFICIAL_RATE.max) {
        // 超额：静默阻塞 30 秒，避免界面连环报错
        OFFICIAL_RATE.blockUntil = now + 30000;
        return true;
    }
    OFFICIAL_RATE.hits.push(now);
    return false;
}
function rateLimitResponse(res) {
    res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: 429, message: '请求过于频繁，请稍后重试' }));
}

// ========== 全局异常兜底 ==========
// async 请求处理中的任何未捕获异常都会形成 unhandledRejection，
// Node 默认会直接终止进程——这里记录日志并保持服务存活。
process.on('uncaughtException', function (err) {
    console.error('[uncaughtException]', err && err.message, err && err.stack);
});
process.on('unhandledRejection', function (reason) {
    console.error('[unhandledRejection]', reason && reason.message ? reason.message : reason);
});

const server = http.createServer(function (req, res) {
    // 同步抛出（如 URL 解析）也兜住，避免进程崩溃
    handleRequest(req, res).catch(function (err) {
        console.error('[请求处理异常]', req.url, err && err.message);
        if (!res.writableEnded) {
            try {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: '服务器内部错误' }));
            } catch (e) { /* 响应已无法发送 */ }
        }
    });
});

async function handleRequest(req, res) {
    const url = new URL(req.url, 'http://localhost:' + PORT);
    let pathname;
    try {
        pathname = decodeURIComponent(url.pathname);
    } catch (e) {
        // 非法百分号编码的 URL，拒绝请求避免进程崩溃
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: '非法请求路径' }));
        return;
    }

    // 过滤空字节/换行等非法字符（path.join 遇到会抛异常导致进程崩溃）
    if (pathname.indexOf('\0') !== -1 || pathname.indexOf('\n') !== -1 || pathname.indexOf('\r') !== -1) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: '非法请求路径' }));
        return;
    }

    // ========== API代理: /api/schedule（官方已下线） ==========
    // 官方 weChat/schedule 接口已下线（恒返回 400），官方页面现仅使用
    // weChat/plan（智能规划）、weChat/price、weChat/carriage。
    // 此路由返回明确提示，前端已改为从 plan 的 B_pure_intercity 方案提取直达车次。
    if (pathname === '/api/schedule') {
        res.writeHead(410, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            code: 410,
            message: '官方实时时刻表接口(schedule)已下线，请使用 /api/plan 智能路线规划接口',
            data: null
        }));
        return;
    }

    // ========== API代理: POST /api/service-order 提交工单到官方客服系统 ==========
    if (pathname === '/api/service-order' && req.method === 'POST') {
        let body = '';
        req.on('data', function (chunk) { body += chunk; });
        req.on('end', function () {
            let form = {};
            try {
                form = JSON.parse(body);
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ code: 400, message: '请求体格式错误' }));
                return;
            }

            submitKfOrder(form).then(function (result) {
                res.writeHead(200, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify(result));
            }).catch(function (err) {
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ code: 502, message: '工单服务连接失败: ' + err.message }));
            });
        });
        return;
    }

    // ========== API代理: 通用代理工具函数 ==========
    function proxyUrl(targetUrl, contentType, res) {
        const isHttps = targetUrl.startsWith('https');
        const mod = isHttps ? https : http;
        const req = mod.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Accept': contentType.includes('json') ? 'application/json, text/plain, */*' : 'text/html, */*'
            }
        }, function (apiRes) {
            let body = '';
            apiRes.on('data', function (chunk) { body += chunk; });
            apiRes.on('end', function () {
                res.writeHead(apiRes.statusCode, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(body);
            });
            apiRes.on('error', function () {
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: '上游响应中断' }));
            });
        });
        req.setTimeout(10000, function () { req.destroy(); });
        req.on('error', function () {
            if (res.writableEnded) return;
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: '代理请求失败' }));
        });
    }

    // 设施 SPA 反向代理: 转发 wx.gzmtr.com:50443 的任意路径（HTML/JS/CSS 等相对资源）
    function proxyFacility(targetPath, res) {
        const req = https.request({
            host: 'wx.gzmtr.com',
            port: 50443,
            path: targetPath,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Accept': '*/*'
            }
        }, function (apiRes) {
            const contentType = apiRes.headers['content-type'] || 'application/octet-stream';
            res.writeHead(apiRes.statusCode, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            // 流式转发，大文件（chunk-vendors.js 等）不占用内存
            apiRes.pipe(res);
        });
        req.setTimeout(15000, function () { req.destroy(); });
        req.on('error', function () {
            if (res.writableEnded) return;
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: '设施页面代理失败，请稍后重试' }));
        });
        req.end();
    }

    // iro-traa.gzmtr.com 的 JSON API 代理（/weChat/plan、/weChat/price、/weChat/carriage）
    // 注意: 官方接口对带 Origin 的浏览器跨域请求返回 403，必须由服务端无 Origin 转发。
    // key 失效自愈：带 key 转发 -> 上游 404 则回官方页面重抓 key -> 用新 key 自动重试一次
    function proxyGzmtrApi(apiPath, query, res) {
        const baseQuery = query.replace(/([?&])key=[^&]*/g, '$1').replace(/[?&]$/, '');
        const withKey = function (k) {
            return (baseQuery ? baseQuery + '&' : '?') + 'key=' + encodeURIComponent(k);
        };

        const forward = function (k, onUpstream404) {
            const apiUrl = TARGET_ORIGIN + apiPath + withKey(k);
            const req = https.get(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': TARGET_ORIGIN + OFFICIAL_PAGE
                }
            }, function (apiRes) {
                let body = '';
                apiRes.on('data', function (chunk) { body += chunk; });
                apiRes.on('end', function () {
                    // 404 + 上游为纯文本（非 JSON）= key 被换掉的典型特征，交回上层重取 key
                    const looksLikeKeyReject = apiRes.statusCode === 404 &&
                        (apiRes.headers['content-type'] || '').indexOf('json') === -1;
                    if (looksLikeKeyReject && !onUpstream404.used) {
                        onUpstream404.used = true;
                        onUpstream404.handle();
                        return;
                    }
                    if (res.writableEnded) return;
                    res.writeHead(apiRes.statusCode, {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(body);
                });
                apiRes.on('error', function (err) {
                    if (res.writableEnded || res.headersSent) return;
                    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ message: '上游响应中断: ' + err.message }));
                });
            });
            req.setTimeout(10000, function () { req.destroy(); });
            req.on('error', function (err) {
                if (res.writableEnded || res.headersSent) return;
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: '代理请求失败: ' + err.message }));
            });
        };

        const retryFlag = { used: false };
        const attemptedKey = officialApiKey;   // 本次请求实际使用的 key，用于判断是否真的换到了新值
        forward(attemptedKey, {
            used: false,
            handle: function () {
                console.log('[key] 上游 404，判定 key 失效（本次使用: ' + attemptedKey + '），重新从官方页面获取…');
                refreshOfficialKey().then(function (fresh) {
                    if (res.writableEnded || res.headersSent) return;
                    // 注意：refreshOfficialKey 成功时会就地改写 officialApiKey，
                    // 因此这里必须与「本次请求用过的 key」比较，而不是与官方全局值比较
                    if (!fresh || fresh === attemptedKey) {
                        console.log('[key] 未取到与本次不同的新 key，按原样返回上游 404');
                        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({
                            code: 404,
                            message: '官方接口拒绝访问，且自动更新 key 未取到新值，请检查官方页面接口是否已变更'
                        }));
                        return;
                    }
                    console.log('[key] 已换用新 key 重试: ' + fresh);
                    forward(fresh, retryFlag);
                });
            }
        });
    }

    // ========== API代理: 车站设施 - 数据查询 (卫生间/母婴室/AED等) ==========
    // 官方数据接口 apis.gzmtr.com/app-map 的 CORS 只放行 wx.gzmtr.com:50443，
    // 浏览器无法直连，必须由服务端转发。调用示例:
    //   /api/facilities/query?type=卫生间   -> POST https://apis.gzmtr.com/app-map/device/findByType/卫生间
    if (pathname === '/api/facilities/query') {
        const type = (url.searchParams.get('type') || '').trim();
        if (!type) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: '缺少 type 参数' }));
            return;
        }
        const apiUrl = 'https://apis.gzmtr.com/app-map/device/findByType/' + encodeURIComponent(type);
        const apiReq = https.request(apiUrl, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Content-Type': 'application/json',
                'Origin': 'https://wx.gzmtr.com:50443',
                'Referer': 'https://wx.gzmtr.com:50443/'
            }
        }, function (apiRes) {
            let data = '';
            apiRes.on('data', function (chunk) { data += chunk; });
            apiRes.on('end', function () {
                res.writeHead(apiRes.statusCode, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(data);
            });
            apiRes.on('error', function () {
                if (res.writableEnded) return;
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: '设施数据响应中断' }));
            });
        });
        apiReq.setTimeout(10000, function () { apiReq.destroy(); });
        apiReq.on('error', function () {
            if (res.writableEnded) return;
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: '设施数据查询失败' }));
        });
        apiReq.write('{}');
        apiReq.end();
        return;
    }

    // ========== API代理: 车站设施 - 母婴室/哺乳室 ==========
    if (pathname === '/api/facilities/bm') {
        proxyUrl('https://gdcj.gzmtr.com/wxMetro/fwck/bm.htm', 'text/html; charset=utf-8', res);
        return;
    }

    // ========== API代理: 车站设施 - 卫生间/母婴室 SPA 反向代理 ==========
    // 背景: wx.gzmtr.com:50443 会对部分浏览器 TLS 握手直接断连（curl/schannel 实测失败，
    //       Node/OpenSSL 正常），导致 iframe 直连空白。因此统一走服务端转发。
    // 路径映射:
    //   /api/facilities/wc         -> https://wx.gzmtr.com:50443/  (SPA 根, hash 由前端附带)
    //   /api/facilities/babyroom   -> https://wx.gzmtr.com:50443/
    //   /api/facilities/proxy/xxx  -> https://wx.gzmtr.com:50443/xxx  (SPA 内部相对资源)
    // SPA 数据接口 https://apis.gzmtr.com/app-map 为绝对地址且 CORS 全开，浏览器可直接访问。
    if (pathname === '/api/facilities/wc' || pathname === '/api/facilities/babyroom' || pathname.startsWith('/api/facilities/proxy')) {
        let targetPath = pathname.replace(/^\/api\/facilities\/(wc|babyroom|proxy)/, '');
        if (targetPath === '') targetPath = '/';
        proxyFacility(targetPath + url.search, res);
        return;
    }

    // ========== API代理: 失物招领官方数据 ==========
    // 官方系统为服务端渲染 HTML（POST item/location/page），前端抓取后解析展示
    if (pathname === '/api/lost-items') {
        if (req.method === 'POST') {
            // 收集表单体（application/x-www-form-urlencoded）
            let body = '';
            req.on('data', function (chunk) { body += chunk; });
            req.on('end', function () {
                const apiReq = http.request({
                    host: 'dzs.gzmtr.cn',
                    port: 9027,
                    path: '/lost/lost_intercity.php',
                    method: 'POST',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(body),
                        'Referer': 'http://dzs.gzmtr.cn:9027/lost/lost_intercity.php'
                    }
                }, function (apiRes) {
                    let data = '';
                    apiRes.on('data', function (c) { data += c; });
                    apiRes.on('end', function () {
                        res.writeHead(apiRes.statusCode, {
                            'Content-Type': 'text/html; charset=utf-8',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(data);
                    });
                    apiRes.on('error', function () {
                        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ message: '官方失物招领响应中断' }));
                    });
                });
                apiReq.setTimeout(10000, function () { apiReq.destroy(); });
                apiReq.on('error', function () {
                    if (res.writableEnded) return;
                    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ message: '官方失物招领连接失败' }));
                });
                apiReq.write(body);
                apiReq.end();
            });
            return;
        }
        // GET：官方默认首页
        proxyUrl('http://dzs.gzmtr.cn:9027/lost/lost_intercity.php', 'text/html; charset=utf-8', res);
        return;
    }

    // ========== API代理: /api/plan 官方智能路线规划（地铁+城际混合） ==========
    // 官方页面 https://iro-traa.gzmtr.com/traa-metro.html 使用:
    // origin=起点&destination=终点&departure_time=HH:mm&date=YYYYMMDD&top_n=15
    if (pathname === '/api/plan') {
        if (officialRateLimited()) {
            rateLimitResponse(res);
            return;
        }
        proxyGzmtrApi('/weChat/plan', url.search, res);
        return;
    }

    // ========== API代理: /api/price 官方票价查询 ==========
    // from=站&to=站&datetime=YYYYMMDDHHmm
    if (pathname === '/api/price') {
        if (officialRateLimited()) {
            rateLimitResponse(res);
            return;
        }
        proxyGzmtrApi('/weChat/price', url.search, res);
        return;
    }

    // ========== API代理: /api/carriage 官方编组信息 ==========
    // date=YYYYMMDD
    if (pathname === '/api/carriage') {
        if (officialRateLimited()) {
            rateLimitResponse(res);
            return;
        }
        proxyGzmtrApi('/weChat/carriage', url.search, res);
        return;
    }

    // ========== 健康检查: 前端探测后端服务是否在线 ==========
    if (pathname === '/api/ping') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
        return;
    }

    // ========== 健康检查: 官方接口 key 状态（key 被换时用于快速定位） ==========
    if (pathname === '/api/health/upstream') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            targetHost: TARGET_HOST,
            key: officialApiKey,
            keySource: officialKeySource,
            keyFetchedAt: officialKeyFetchedAt ? new Date(officialKeyFetchedAt).toISOString() : null,
            keyAgeMinutes: officialKeyFetchedAt ? Math.round((Date.now() - officialKeyFetchedAt) / 60000) : null,
            uptimeSeconds: Math.round(process.uptime()),
            note: 'key 失效时服务端会自动回官方页面重抓并重试，此接口用于确认当前生效值'
        }, null, 2));
        return;
    }

    // ========== 静态文件服务 ==========
    let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);

    // 防止路径穿越（用相对路径边界判断，避免字符串前缀匹配绕过）
    const relPath = path.relative(ROOT, filePath);
    if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, function (err, stat) {
        if (err || !stat.isFile()) {
            // 未找到文件时回退到 index.html（SPA）
            filePath = path.join(ROOT, 'index.html');
            fs.stat(filePath, function (err2, stat2) {
                if (err2) {
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }
                serveFile(filePath, res);
            });
            return;
        }
        serveFile(filePath, res);
    });
}

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, function (err, data) {
        if (err) {
            res.writeHead(500);
            res.end('Server Error');
            return;
        }
        res.writeHead(200, {
            'Content-Type': type,
            // 禁止浏览器缓存 HTML/JS/CSS，避免页面更新后用户仍在使用旧版本
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(data);
    });
}

server.listen(PORT, function () {
    console.log('========================================');
    console.log('  广东城际APP 已启动');
    console.log('  访问地址: http://localhost:' + PORT);
    console.log('  API代理:  /api/plan (官方智能路线规划: 直达车次+地铁换乘)');
    console.log('  API代理:  /api/price /api/carriage (票价/编组)');
    console.log('  API代理:  /api/lost-items (官方失物招领)');
    console.log('  API代理:  /api/facilities/* (车站设施)');
    console.log('  健康检查: /api/ping | /api/health/upstream (官方 key 状态)');
    console.log('========================================');
    // 启动即对齐一次官方 key；失败不影响启动（预置值兜底，请求时还会自动重试）
    refreshOfficialKey().then(function (k) {
        console.log('[key] 启动校验完成，当前生效 key: ' + officialApiKey + (k ? '' : '（沿用预置值）'));
    });
});
