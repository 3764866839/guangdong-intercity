/**
 * 广东城际APP - 本地开发服务器 + API代理
 * 用法: node server.js  然后访问 http://localhost:8080
 * 功能: 1. 静态文件服务  2. /api/schedule 代理到官方实时时刻表接口
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const TARGET_HOST = 'iro-traa.gzmtr.com';
const TARGET_PATH = '/weChat/schedule';

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

const server = http.createServer(async function (req, res) {
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

    // ========== API代理: /api/schedule?from=X&to=Y&date=YYYYMMDD ==========
    if (pathname === '/api/schedule') {
        const query = url.searchParams;
        const from = query.get('from') || '';
        const to = query.get('to') || '';
        const date = query.get('date') || '';

        if (!from || !to || !date) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: '参数缺失: from, to, date 为必填' }));
            return;
        }

        const apiUrl = 'https://' + TARGET_HOST + TARGET_PATH +
            '?from=' + encodeURIComponent(from) +
            '&to=' + encodeURIComponent(to) +
            '&date=' + encodeURIComponent(date);

        const request = https.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://' + TARGET_HOST + '/table.html'
            }
        }, function (apiRes) {
            let body = '';
            apiRes.on('data', function (chunk) { body += chunk; });
            apiRes.on('end', function () {
                res.writeHead(apiRes.statusCode, {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(body);
            });
            // 上游响应中断时避免客户端请求挂起
            apiRes.on('error', function (err) {
                res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ message: '上游响应中断: ' + err.message }));
            });
        });

        // 超时（10秒）后销毁连接，防止请求永久挂起
        request.setTimeout(10000, function () {
            request.destroy(new Error('上游请求超时'));
        });

        request.on('error', function (err) {
            // 客户端可能已断开，写响应前先判断
            if (res.writableEnded) return;
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ message: '代理请求失败: ' + err.message }));
        });
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

    // ========== API代理: 车站设施 - 母婴室/哺乳室 ==========
    if (pathname === '/api/facilities/bm') {
        proxyUrl('https://gdcj.gzmtr.com/wxMetro/fwck/bm.htm', 'text/html; charset=utf-8', res);
        return;
    }

    // ========== API代理: 车站设施 - 卫生间查询 ==========
    if (pathname === '/api/facilities/wc') {
        proxyUrl('https://wx.gzmtr.com:50443/#/wcSearch?language=Cn', 'text/html; charset=utf-8', res);
        return;
    }

    // ========== API代理: 车站设施 - 母婴室查询 ==========
    if (pathname === '/api/facilities/babyroom') {
        proxyUrl('https://wx.gzmtr.com:50443/#/babyRoomSearch?language=Cn', 'text/html; charset=utf-8', res);
        return;
    }

    // ========== API代理: 失物招领官方数据 ==========
    if (pathname === '/api/lost-items') {
        proxyUrl('http://dzs.gzmtr.cn:9027/lost/lost_intercity.php', 'text/html; charset=utf-8', res);
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
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, function (err, data) {
        if (err) {
            res.writeHead(500);
            res.end('Server Error');
            return;
        }
        res.writeHead(200, { 'Content-Type': type });
        res.end(data);
    });
}

server.listen(PORT, function () {
    console.log('========================================');
    console.log('  广东城际APP 已启动');
    console.log('  访问地址: http://localhost:' + PORT);
    console.log('  API代理:  /api/schedule (官方实时时刻表)');
    console.log('  API代理:  /api/lost-items (官方失物招领)');
    console.log('  API代理:  /api/facilities/* (车站设施)');
    console.log('========================================');
});
