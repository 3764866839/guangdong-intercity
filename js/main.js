/**
 * 广东城际官方APP - 主逻辑
 * 响应式网站 - 仿官方蓝白风格
 */

// ============================================
// 数据定义
// ============================================

// 广东城际站点列表（按线路分组，来自官方时刻表查询系统）
const STATION_LINES = {
    '广清城际': [
        '广州白云', '白云湖', '江高', '神山', '花都', '乐同', '狮岭',
        '银盏', '龙塘镇', '清城', '燕湖', '洲心', '飞霞'
    ],
    '广州东环城际': [
        '花城街', '花山镇', '白云机场北', '白云机场南', '白云机场东',
        '帽峰山', '大源', '龙洞', '岑村', '科韵路', '琶洲',
        '广州大学城', '大石东', '番禺'
    ],
    '广肇城际': [
        '陈村', '北滘西', '顺德北', '张槎', '佛山西', '狮山', '狮山北',
        '三水北', '云东海', '大旺', '四会', '鼎湖东', '鼎湖山', '端州', '肇庆'
    ],
    '广惠城际': [
        '广州长隆', '东环', '官桥北', '广州莲花山', '麻涌', '东莞西',
        '道滘', '西平西', '东城南', '寮步', '松山湖北', '大朗镇',
        '常平南', '常平东', '樟木头东', '银瓶', '沥林北',
        '陈江南', '惠环', '龙丰', '西湖东', '云山', '小金口', '惠州北'
    ],
    '琶莲城际': [
        '深井', '化龙南'
    ],
    '穗深城际': [
        '竹料', '佛塱', '九佛', '新龙', '永宁北', '永宁南', '镇龙',
        '钟落潭东', '新塘南', '中堂', '望牛墩',
        '洪梅', '东莞港', '厚街', '虎门北', '虎门东', '长安西', '长安',
        '沙井西', '福海西', '深圳机场北', '深圳机场'
    ]
};

// 全部站点（扁平数组，供搜索等场景使用）
const STATIONS = (function () {
    const all = [];
    Object.values(STATION_LINES).forEach(function (list) {
        list.forEach(function (s) { all.push(s); });
    });
    return all;
})();

// 线路展示颜色
const LINE_COLORS = {
    '广清城际': '#2E7D32',
    '广州东环城际': '#6A1B9A',
    '广肇城际': '#1A73E8',
    '广惠城际': '#C62828',
    '琶莲城际': '#00838F',
    '穗深城际': '#E65100'
};

// 真实API接口（来自官方时刻表查询系统）
const SCHEDULE_API = 'https://iro-traa.gzmtr.com/weChat/schedule';



// 页面标题映射
const PAGE_TITLES = {
    'home': '广东城际',
    'travel': '出行助手',
    'route-map': '线路图',
    'ticket': '票务服务',
    'ticket-detail': '票务详情',
    'service': '服务',
    'lost': '失物招领',
    'station-picker': '选择站点',
    'facilities': '车站设施',
    'facility-content': '设施详情'
};

// 导航Tab映射（哪些页面显示底部导航）
const NAV_PAGES = ['home', 'travel', 'ticket', 'service'];

// 当前页面状态
let currentPage = 'home';
let stationPickerTarget = null;
let pageHistory = [];

// ============================================
// 初始化
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    initApp();
});

function initApp() {
    // 设置当前日期和时间
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // 设置日期输入默认值
    const todayStr = getTodayStr();
    const dateInput = document.getElementById('travelDate');
    if (dateInput) {
        dateInput.value = todayStr;
        dateInput.min = todayStr;
    }
    updateDateInfo();

    // 尝试加载线路图
    loadRouteMap();

    console.log('广东城际APP 初始化完成');
}

// ============================================
// 日期时间更新
// ============================================
function updateDateTime() {
    const el = document.getElementById('currentTime');
    if (!el) return;
    const now = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const mmdd = (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0');
    const holiday = HOLIDAYS[mmdd] || '';
    const str = now.getFullYear() + '年' +
        (now.getMonth() + 1).toString().padStart(2, '0') + '月' +
        now.getDate().toString().padStart(2, '0') + '日 ' +
        '星期' + weekdays[now.getDay()] + (holiday ? '（' + holiday + '）' : '') + ' ' +
        now.getHours().toString().padStart(2, '0') + ':' +
        now.getMinutes().toString().padStart(2, '0') + ':' +
        now.getSeconds().toString().padStart(2, '0');
    el.textContent = str;
}

// ============================================
// 页面导航
// ============================================
function navigateTo(page, preserveView) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // 显示目标页面
    const targetPage = document.getElementById('page-' + page);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // 更新标题
    document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || '广东城际';

    // 更新导航栏高亮
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // 控制底部导航栏显示
    const nav = document.getElementById('appNav');
    if (NAV_PAGES.includes(page)) {
        nav.style.display = 'flex';
    } else {
        nav.style.display = 'none';
    }

    // 控制返回按钮
    const backBtn = document.getElementById('backBtn');
    if (page === 'home') {
        backBtn.classList.remove('visible');
        pageHistory = [];
    } else {
        backBtn.classList.add('visible');
    }

    currentPage = page;

    // "出行助手"入口默认推荐车次视图（返回导航时保留当前视图）
    if (page === 'travel' && !preserveView) {
        trainViewMode = 'recommend';
        updateTrainTabs();
    }

    // "服务"入口默认客服中心视图（返回导航时保留当前视图）
    if (page === 'service' && !preserveView) {
        serviceTabMode = 'service';
        updateServiceTabs();
    }

    // 页面进入时自动加载数据
    if (page === 'lost') {
        searchLost();
    }

    // 车站设施页面加载iframe
    if (page === 'facilities') {
        loadFacilityIframe();
    }

    // 滚动到顶部
    document.getElementById('appContent').scrollTop = 0;
}

function goBack() {
    if (pageHistory.length > 0) {
        const prev = pageHistory.pop();
        navigateTo(prev, true); // 返回导航，保留当前视图模式
    } else {
        navigateTo('home');
    }
}

// ============================================
// 出行助手
// ============================================
function swapStations() {
    const from = document.getElementById('fromStation');
    const to = document.getElementById('toStation');
    const temp = from.value;
    from.value = to.value;
    to.value = temp;
}

// 当前选中的线路（站点选择器左侧）
let currentStationLine = Object.keys(STATION_LINES)[0];

function showStationPicker(target) {
    stationPickerTarget = target;
    pageHistory.push(currentPage);
    navigateTo('station-picker');

    // 重置并渲染双列站点选择器
    resetStationPicker();
}

// 重置站点选择器（清空搜索、默认选中第一条线路）
function resetStationPicker() {
    document.getElementById('stationSearch').value = '';
    document.getElementById('stationPickerBody').classList.remove('searching');
    currentStationLine = Object.keys(STATION_LINES)[0];
    renderStationLines();
    renderLineStations();
}

// 渲染左侧线路列表
function renderStationLines() {
    const container = document.getElementById('stationLines');
    const keyword = document.getElementById('stationSearch').value.trim();
    if (!container) return;

    // 搜索模式下不显示线路栏
    if (keyword) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = Object.keys(STATION_LINES).map(function (line) {
        const active = line === currentStationLine ? ' active' : '';
        const color = LINE_COLORS[line] || '#999';
        return '<div class="line-item' + active + '" onclick="selectStationLine(\'' + line + '\')">' +
            '<span class="line-dot" style="background:' + color + ';"></span>' +
            '<span>' + line.replace('城际', '') + '</span>' +
            '</div>';
    }).join('');
}

// 点击左侧线路，切换右侧站点
function selectStationLine(line) {
    currentStationLine = line;
    renderStationLines();
    renderLineStations();
}

// 渲染右侧站点列表
function renderLineStations() {
    const container = document.getElementById('stationStations');
    if (!container) return;
    const keyword = document.getElementById('stationSearch').value.trim().toLowerCase();
    const pinIcon = window.ICONS
        ? window.ICONS.pin.replace('width="24" height="24"', 'width="16" height="16"')
        : '';

    const stationItem = function (s) {
        return '<div class="station-item" onclick="selectStation(\'' + s + '\')">' +
            '<span class="station-item-icon">' + pinIcon + '</span>' +
            '<span>' + s + '</span>' +
            '</div>';
    };

    // 搜索模式：显示所有匹配分组
    if (keyword) {
        let html = '';
        let total = 0;
        Object.keys(STATION_LINES).forEach(function (line) {
            const matched = STATION_LINES[line].filter(function (s) {
                return s.toLowerCase().includes(keyword);
            });
            if (matched.length === 0) return;
            total += matched.length;
            const color = LINE_COLORS[line] || '#999';
            html += '<div class="station-group-title">' +
                '<span class="line-dot" style="background:' + color + ';width:8px;height:8px;border-radius:50%;"></span>' +
                line + '（' + matched.length + '站）</div>' +
                matched.map(stationItem).join('');
        });

        if (!html) {
            html = '<div class="empty-state">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.search : '') + '</div>' +
                '<div class="empty-text">未找到匹配的站点</div>' +
                '</div>';
        } else {
            html = '<div style="font-size:12px;color:var(--text-light);padding:2px 4px 10px;">共找到 ' + total + ' 个站点</div>' + html;
        }
        container.innerHTML = html;
        return;
    }

    // 正常模式：显示当前线路的站点
    const stations = STATION_LINES[currentStationLine] || [];
    container.innerHTML = '<div class="station-group-title">' +
        '<span class="line-dot" style="background:' + (LINE_COLORS[currentStationLine] || '#999') + ';width:8px;height:8px;border-radius:50%;"></span>' +
        currentStationLine + '（' + stations.length + '站）</div>' +
        stations.map(stationItem).join('');
}

function filterStations() {
    const keyword = document.getElementById('stationSearch').value.trim();
    const body = document.getElementById('stationPickerBody');
    if (body) {
        body.classList.toggle('searching', !!keyword);
    }
    renderStationLines();
    renderLineStations();
}

function selectStation(station) {
    if (stationPickerTarget === 'from') {
        document.getElementById('fromStation').value = station;
    } else {
        document.getElementById('toStation').value = station;
    }
    // 返回上一页
    goBack();
}

// 当前查询状态
let trainViewMode = 'recommend';   // recommend: 推荐车次卡片 | all: 全部时刻表格
let lastTrainData = null;          // 最近一次真实API返回的数据
let lastQuery = null;              // 最近一次查询条件 {from,to,date}

// 服务页面双Tab模式
let serviceTabMode = 'service';    // service: 客服中心 | info: 旅客须知

// 切换服务页面Tab
function switchServiceTab(mode) {
    serviceTabMode = mode;
    updateServiceTabs();
}

// 更新服务页面Tab状态
function updateServiceTabs() {
    document.getElementById('serviceTabContent').style.display = serviceTabMode === 'service' ? 'block' : 'none';
    document.getElementById('infoTabContent').style.display = serviceTabMode === 'info' ? 'block' : 'none';
    var tabSvc = document.getElementById('tabService');
    var tabInfo = document.getElementById('tabInfo');
    if (tabSvc) tabSvc.classList.toggle('active', serviceTabMode === 'service');
    if (tabInfo) tabInfo.classList.toggle('active', serviceTabMode === 'info');
}

function searchTrains() {
    const from = document.getElementById('fromStation').value.trim();
    const to = document.getElementById('toStation').value.trim();
    const date = document.getElementById('travelDate').value;

    if (!from || !to) {
        showToast('请选择出发站和到达站');
        return;
    }
    if (from === to) {
        showToast('出发站和到达站不能相同');
        return;
    }

    const results = document.getElementById('travelResults');
    results.innerHTML = '<div style="text-align:center;padding:30px;color:#999;"><div class="loading-spinner" style="margin:0 auto 12px;"></div><p>正在查询直达车次...</p></div>';

    // 查询直达车次
    fetchRealTrains(from, to, date).then(function (data) {
        if (data && data.length > 0) {
            lastTrainData = data;
            lastQuery = { from: from, to: to, date: date };
            renderTrainView();
            // 直达有结果，同时查询中转方案
            searchTransfers(from, to, date, results);
        } else {
            // 直达无结果，尝试中转方案
            results.innerHTML = '<div style="text-align:center;padding:30px;color:#999;"><div class="loading-spinner" style="margin:0 auto 12px;"></div><p>直达无结果，正在查询中转方案...</p></div>';
            searchTransfers(from, to, date, results);
        }
    }).catch(function () {
        // 直达查询失败，尝试中转方案
        results.innerHTML = '<div style="text-align:center;padding:30px;color:#999;"><div class="loading-spinner" style="margin:0 auto 12px;"></div><p>直达查询失败，正在尝试中转方案...</p></div>';
        searchTransfers(from, to, date, results);
    });
}

// 查找站点所属线路
function findLineForStation(station) {
    for (const [line, stations] of Object.entries(STATION_LINES)) {
        if (stations.includes(station)) return line;
    }
    return null;
}

// 将 "HH:MM" 格式时间转为分钟数用于比较
function timeToMinutes(t) {
    if (!t || t === '--') return -1;
    const p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1]);
}

// 查询中转方案
async function searchTransfers(from, to, date, resultsContainer) {
    const fromLine = findLineForStation(from);
    const toLine = findLineForStation(to);
    if (!fromLine || !toLine || fromLine === toLine) {
        // 同线路或无法确定线路，无需中转
        if (!lastTrainData || !lastQuery) {
            resultsContainer.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.search : '') + '</div>' +
                '<div class="empty-text">未查询到相关车次信息<br><span style="font-size:12px;color:#ccc;">请尝试更换站点或日期</span></div>' +
                '</div>';
        }
        return;
    }

    // 确定候选中转站：优先使用线路换乘映射，再补充出发线路上的其他站点
    var candidates = [];
    // 1) 线路映射推荐站
    const lineMap = LINE_TRANSFERS[fromLine];
    if (lineMap && lineMap[toLine]) {
        candidates.push(lineMap[toLine]);
    }
    // 2) 出发线路上的其他站点（排除出发站和已选推荐站）
    STATION_LINES[fromLine].forEach(function (s) {
        if (s !== from && !candidates.includes(s)) {
            candidates.push(s);
        }
    });
    // 最多查5个
    const toQuery = candidates.slice(0, 5);

    var transferResults = [];

    for (const via of toQuery) {
        try {
            const leg1 = await fetchRealTrains(from, via, date);
            if (!leg1 || leg1.length === 0) continue;
            const leg2 = await fetchRealTrains(via, to, date);
            if (!leg2 || leg2.length === 0) continue;
            // 时序匹配：只保留第二程中在中转站发车时间 >= 第一程到达时间的车次
            var matchedLeg2 = [];
            leg1.forEach(function (l1) {
                const arrTime = getTrainTime(l1, via);
                const arrMin = timeToMinutes(arrTime);
                if (arrMin < 0) return;
                leg2.forEach(function (l2) {
                    const depTime = getTrainTime(l2, via);
                    const depMin = timeToMinutes(depTime);
                    // 至少预留 5 分钟换乘时间
                    if (depMin >= arrMin + 5) {
                        if (!matchedLeg2.some(function (m) { return m.cc === l2.cc; })) {
                            matchedLeg2.push(l2);
                        }
                    }
                });
            });
            if (matchedLeg2.length > 0) {
                transferResults.push({ via: via, leg1: leg1, leg2: matchedLeg2 });
            }
        } catch (e) {
            console.log('中转查询失败 ' + via + ': ' + e.message);
        }
    }

    // 按换乘便捷度排序：总耗时短优先，推荐站优先
    transferResults.sort(function (a, b) {
        var aScore = 1000, bScore = 1000;
        if (lineMap && lineMap[toLine] === a.via) aScore -= 500;
        if (lineMap && lineMap[toLine] === b.via) bScore -= 500;
        return aScore - bScore;
    });

    // 渲染结果
    if (lastTrainData && lastQuery) {
        renderTransferResults(transferResults, from, to, date, resultsContainer, true);
    } else {
        if (transferResults.length > 0) {
            lastTrainData = null;
            lastQuery = null;
            renderTransferResults(transferResults, from, to, date, resultsContainer, false);
        } else {
            resultsContainer.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.search : '') + '</div>' +
                '<div class="empty-text">未查询到相关车次信息<br><span style="font-size:12px;color:#ccc;">请尝试更换站点或日期</span></div>' +
                '</div>';
        }
    }
}

// 渲染中转方案
function renderTransferResults(transfers, from, to, date, container, hasDirect) {
    if (!transfers || transfers.length === 0) return;

    var html = '<div style="margin-top:' + (hasDirect ? '24' : '0') + 'px;">';
    html += '<div style="padding:8px 0 4px;font-size:14px;font-weight:600;color:var(--text-secondary);">' +
        getDateDisplay(date) + ' ' + from + ' → ' + to + ' 换乘方案（共' + transfers.length + '种）</div>';

    transfers.forEach(function (t, idx) {
        // 第一程展示最早出发的2个车次
        var leg1List = t.leg1.slice(0, 2);
        // 第二程展示与第一程时序匹配的2个车次
        var leg2List = t.leg2.slice(0, 2);

        var isRecommended = (idx === 0);
        html += '<div class="result-card" style="border-left:3px solid ' + (isRecommended ? 'var(--primary)' : 'var(--secondary)') + ';">';
        if (isRecommended) {
            html += '<div style="font-size:11px;color:var(--primary);margin-bottom:4px;"><span style="background:var(--primary);color:#fff;padding:1px 8px;border-radius:8px;font-weight:600;">推荐</span> 推荐换乘方案</div>';
        }
        html += '<div style="font-size:13px;font-weight:600;color:var(--primary);margin-bottom:8px;">中转站：' + t.via + '</div>';

        // 第一程
        html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">第一程：' + from + ' → ' + t.via + '</div>';
        leg1List.forEach(function (train) {
            var depTime = getTrainTime(train, from);
            var arrTime = getTrainTime(train, t.via);
            html += '<div style="display:flex;justify-content:space-between;padding:4px 8px;background:#F5F8FF;border-radius:4px;margin-bottom:2px;font-size:13px;">' +
                '<span><strong>' + (train.cc || '') + '</strong></span>' +
                '<span>' + depTime + ' → ' + arrTime + '</span>' +
                '</div>';
        });

        // 换乘提示
        html += '<div style="font-size:11px;color:#E65100;margin:4px 0;text-align:center;">↓ 换乘 ' + t.via + '站 ↓</div>';

        // 第二程
        html += '<div style="font-size:12px;color:var(--text-secondary);margin:4px 0 4px;">第二程：' + t.via + ' → ' + to + '</div>';
        leg2List.forEach(function (train) {
            var depTime = getTrainTime(train, t.via);
            var arrTime = getTrainTime(train, to);
            html += '<div style="display:flex;justify-content:space-between;padding:4px 8px;background:#F0FFF4;border-radius:4px;margin-bottom:2px;font-size:13px;">' +
                '<span><strong>' + (train.cc || '') + '</strong></span>' +
                '<span>' + depTime + ' → ' + arrTime + '</span>' +
                '</div>';
        });

        html += '<div style="font-size:11px;color:#999;margin-top:6px;padding-top:6px;border-top:1px dashed #eee;">提示：请预留充足换乘时间（至少5分钟），实际时刻以车站公告为准</div>';
        html += '</div>';
    });

    html += '</div>';
    container.innerHTML += html;
}

// 切换推荐车次 / 全部时刻视图
function switchTrainView(mode) {
    trainViewMode = mode;
    updateTrainTabs();
    renderTrainView();
}

function updateTrainTabs() {
    const tabRec = document.getElementById('tabRecommend');
    const tabAll = document.getElementById('tabAll');
    if (tabRec) tabRec.classList.toggle('active', trainViewMode === 'recommend');
    if (tabAll) tabAll.classList.toggle('active', trainViewMode === 'all');
}

// 按当前视图模式渲染结果
function renderTrainView() {
    if (!lastTrainData || !lastQuery) return;
    if (trainViewMode === 'all') {
        renderAllTrainsView(lastTrainData, lastQuery);
    } else {
        renderRecommendView(lastTrainData, lastQuery);
    }
}

// 调用真实API查询车次（优先本地代理，其次直接调用，官方无数据时回退演示数据）
async function fetchRealTrains(from, to, date) {
    const formattedDate = date.replace(/-/g, '');
    const directUrl = SCHEDULE_API +
        '?from=' + encodeURIComponent(from) +
        '&to=' + encodeURIComponent(to) +
        '&date=' + formattedDate;

    // 尝试本地代理（服务端转发，无CORS限制）
    try {
        const proxyUrl = '/api/schedule?from=' + encodeURIComponent(from) +
            '&to=' + encodeURIComponent(to) +
            '&date=' + formattedDate;
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
            const proxyJson = await proxyRes.json();
            // 官方接口返回有效车次数组时直接使用
            if (proxyJson && Array.isArray(proxyJson.data) && proxyJson.data.length > 0) {
                return proxyJson.data;
            }
        }
    } catch (e) {
        console.log('本地代理不可用，尝试直接调用: ' + e.message);
    }

    // 直接调用官方API（可能受CORS限制）
    try {
        const response = await fetch(directUrl);
        if (response.ok) {
            const json = await response.json();
            if (json && Array.isArray(json.data) && json.data.length > 0) {
                return json.data;
            }
        }
    } catch (e) {
        console.log('直接调用官方API失败: ' + e.message);
    }

    // 官方接口无数据（当前 weChat/schedule 接口返回 data:null），回退演示数据保证界面可用
    const mock = generateMockTrains(from, to, date);
    if (mock.length > 0) {
        mock.__mock = true; // 标记为演示数据，渲染时提示
    }
    return mock;
}

// 生成演示车次数据（官方接口不可用时的兜底，字段结构与官方一致，仅用于界面展示）
function generateMockTrains(from, to, date) {
    var trains = [];
    var fromLine = findLineForStation(from);
    var toLine = findLineForStation(to);
    if (!fromLine || !toLine) return trains;

    // 构建站点顺序链：同线路取真实区间站点，跨线路简化为起终点
    var stationPath = [];
    if (fromLine === toLine) {
        var line = STATION_LINES[fromLine];
        var fi = line.indexOf(from), ti = line.indexOf(to);
        if (fi === -1 || ti === -1) return trains;
        var start = Math.min(fi, ti), end = Math.max(fi, ti);
        stationPath = line.slice(start, end + 1);
        if (fi > ti) stationPath.reverse();
    } else {
        stationPath = [from, to];
    }
    if (stationPath.length < 2) return trains;

    // 每站约 10 分钟，停站约 2 分钟
    var step = 10, stop = 2;
    var startLine = stationPath[0], endStation = stationPath[stationPath.length - 1];
    var baseCode = 7900 + (fromLine.charCodeAt(0) % 50);

    for (var i = 0; i < 6; i++) {
        var depHour = 6 + i * 2; // 06:00 / 08:00 / 10:00 / 12:00 / 14:00 / 16:00
        var minOffset = 0;
        var details = stationPath.map(function (s, idx) {
            var alight = '', board = '';
            if (idx === 0) {
                board = padTime(depHour, minOffset);
            } else if (idx === stationPath.length - 1) {
                alight = padTime(depHour, minOffset);
            } else {
                alight = padTime(depHour, minOffset);
                minOffset += stop;
                board = padTime(depHour, minOffset);
            }
            minOffset += step;
            return { stationName: s, boardTime: board, alightTime: alight };
        });

        trains.push({
            cc: 'C' + (baseCode + i),
            startStation: startLine,
            endStation: endStation,
            travelTimeFormatted: formatMockDuration((stationPath.length - 1) * step),
            stationDetails: details
        });
    }
    return trains;
}

// 格式化演示车次耗时
function formatMockDuration(totalMinutes) {
    var h = Math.floor(totalMinutes / 60), m = totalMinutes % 60;
    return (h > 0 ? h + '时' : '') + m + '分';
}

// 将小时+分钟偏移格式化为 HH:MM（支持跨24点取模）
function padTime(hour, minuteOffset) {
    var total = hour * 60 + minuteOffset;
    total = ((total % 1440) + 1440) % 1440;
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
}

// 获取车次在指定站的时间
function getTrainTime(train, station) {
    if (train.stationDetails) {
        const detail = train.stationDetails.find(function (s) {
            return s.stationName === station;
        });
        if (detail) return detail.boardTime || detail.alightTime || '--';
    }
    return '--';
}

// 判断车次是否已发车（当天车次）
function isTrainDeparted(depTime, date) {
    const parts = (depTime || '--').split(':');
    if (parts.length < 2 || parts[0] === '--') return false;
    const depMinutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return depMinutes < currentMinutes && date === getTodayStr();
}

// 法定节假日与特殊节日映射表（MM-DD）
const HOLIDAYS = {
    '01-01': '元旦',
    '02-14': '情人节',
    '03-08': '妇女节',
    '04-04': '清明节',
    '04-05': '清明节',
    '05-01': '劳动节',
    '06-01': '儿童节',
    '07-01': '建党节',
    '08-01': '建军节',
    '09-10': '教师节',
    '10-01': '国庆节',
    '12-25': '圣诞节'
};

// 获取日期显示文本（含星期几和节日标注）
function getDateDisplay(dateStr) {
    if (!dateStr) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdays[d.getDay()];
    const mmdd = parts[1] + '-' + parts[2];
    const holiday = HOLIDAYS[mmdd] || '';
    return dateStr + ' 星期' + weekday + (holiday ? '（' + holiday + '）' : '');
}

// 更新日期输入右侧的日期信息显示（星期几 + 节日）
function updateDateInfo() {
    const input = document.getElementById('travelDate');
    const info = document.getElementById('dateInfo');
    if (!input || !info) return;
    const val = input.value;
    if (!val) { info.textContent = ''; return; }
    const display = getDateDisplay(val);
    info.textContent = display;
}

// 线路间换乘推荐站映射（出发线路 → 目标线路 → 推荐换乘站）
const LINE_TRANSFERS = {
    '广清城际': { '广州东环城际': '花都', '穗深城际': '竹料' },
    '广州东环城际': { '广清城际': '花都', '广惠城际': '琶洲', '穗深城际': '竹料' },
    '穗深城际': { '广清城际': '竹料', '广州东环城际': '竹料', '广惠城际': '东莞西' },
    '广惠城际': { '广州东环城际': '琶洲', '穗深城际': '东莞西' },
    '广肇城际': { '广惠城际': '佛山西' },
    '琶莲城际': { '广州东环城际': '琶洲' }
};

// 推荐车次视图（卡片）
function renderRecommendView(trainData, query) {
    const results = document.getElementById('travelResults');
    const from = query.from, to = query.to, date = query.date;
    const isToday = date === getTodayStr();

    // 按出发时间排序
    const sorted = trainData.slice().sort(function (a, b) {
        return getTrainTime(a, from).localeCompare(getTrainTime(b, from));
    });

    // 当日区分已出发/未出发；未来日期全部为未出发
    const upcoming = sorted.filter(function (t) {
        return !isToday || !isTrainDeparted(getTrainTime(t, from), date);
    });
    const departed = sorted.filter(function (t) {
        return isToday && isTrainDeparted(getTrainTime(t, from), date);
    });

    const cards = upcoming.concat(departed).map(function (train) {
        const fromTime = getTrainTime(train, from);
        const toTime = getTrainTime(train, to);
        const duration = train.travelTimeFormatted || train.totalTimeFormatted || '';
        const isPast = isToday && isTrainDeparted(fromTime, date);

        return '<div class="result-card" style="' + (isPast ? 'opacity:0.5;' : '') + '">' +
            '<div class="train-info">' +
            '<span class="train-number">' + (train.cc || train.trainNumber || '') + '</span>' +
            '<span class="train-type">' + (train.fromStation === from ? '始发' : '过路') + ' · ' + (train.toStation === to ? '终到' : '过路') + '</span>' +
            '</div>' +
            '<div class="time-info">' +
            '<div class="time-station">' +
            '<div class="time">' + fromTime + '</div>' +
            '<div class="station">' + from + '</div>' +
            '</div>' +
            '<div class="time-duration">' +
            '<div class="duration">' + duration + '</div>' +
            '<div class="train-line"></div>' +
            '</div>' +
            '<div class="time-station">' +
            '<div class="time">' + toTime + '</div>' +
            '<div class="station">' + to + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="extra-info">' +
            '<span>' + (window.ICONS ? window.ICONS.calendar.replace('width="24" height="24"', 'width="14" height="14"') : '') + ' ' + getDateDisplay(date) + '</span>' +
            '<span>终点站：' + (train.endStation || '') + '</span>' +
            '<span>' + (isPast ? '已过点' : '可乘坐') + '</span>' +
            '</div>' +
            '</div>';
    });

    var headerText = getDateDisplay(date) + ' ' + from + ' → ' + to + ' 共 ' + sorted.length + ' 个车次' +
        (trainData.__mock ? '（演示数据，官方接口暂不可用）' : '（实时数据）');
    if (departed.length > 0) {
        headerText += '<br><span style="font-size:12px;font-weight:400;color:#999;">其中 ' + departed.length + ' 个车次已过点，已移至底部</span>';
    }

    results.innerHTML = '<div style="padding:8px 0 4px;font-size:14px;font-weight:600;color:var(--text-secondary);">' +
        headerText + '</div>' +
        (departed.length > 0 ? '<div style="padding:8px 0 4px;font-size:12px;font-weight:500;color:#999;border-top:1px dashed #ddd;margin-top:12px;padding-top:12px;">— 以下车次已过点 —</div>' : '') +
        cards.join('');
}

// 全部时刻视图（表格）
function renderAllTrainsView(trainData, query) {
    const results = document.getElementById('travelResults');
    const from = query.from, to = query.to, date = query.date;
    const isToday = date === getTodayStr();

    // 按出发时间排序
    const sorted = trainData.slice().sort(function (a, b) {
        return getTrainTime(a, from).localeCompare(getTrainTime(b, from));
    });

    // 当日区分已出发/未出发；未来日期全部为未出发
    const upcoming = sorted.filter(function (t) {
        return !isToday || !isTrainDeparted(getTrainTime(t, from), date);
    });
    const departed = sorted.filter(function (t) {
        return isToday && isTrainDeparted(getTrainTime(t, from), date);
    });

    var rows = '';
    // 未出发车次
    rows += upcoming.map(function (train) {
        const depTime = getTrainTime(train, from);
        const arrTime = getTrainTime(train, to);
        return '<tr>' +
            '<td><strong>' + (train.cc || '') + '</strong></td>' +
            '<td>' + from + '</td>' +
            '<td>' + to + '</td>' +
            '<td>' + depTime + '</td>' +
            '<td>' + arrTime + '</td>' +
            '<td><span style="color:#2E7D32;">正常</span></td>' +
            '</tr>';
    }).join('');
    // 已出发车次（灰色）
    if (departed.length > 0) {
        rows += '<tr style="background:#F5F5F5;"><td colspan="6" style="text-align:center;color:#999;font-size:12px;padding:10px;">— 以下车次已过点 —</td></tr>';
        rows += departed.map(function (train) {
            const depTime = getTrainTime(train, from);
            const arrTime = getTrainTime(train, to);
            return '<tr style="opacity:0.5;background:#FAFAFA;">' +
                '<td><strong>' + (train.cc || '') + '</strong></td>' +
                '<td>' + from + '</td>' +
                '<td>' + to + '</td>' +
                '<td>' + depTime + '</td>' +
                '<td>' + arrTime + '</td>' +
                '<td><span style="color:#999;">已过点</span></td>' +
                '</tr>';
        }).join('');
    }

    results.innerHTML = '<div class="schedule-table-wrap" style="margin:0;">' +
        '<div style="padding:14px 16px;font-size:14px;font-weight:600;color:var(--text-primary);border-bottom:1px solid var(--border);">' +
        getDateDisplay(date) + ' ' + from + ' → ' + to + ' 共 ' + sorted.length + ' 个车次' +
        (trainData.__mock ? '（演示数据，官方接口暂不可用）' : '（实时数据）') +
        (departed.length > 0 ? '<br><span style="font-size:12px;font-weight:400;color:#999;">其中 ' + departed.length + ' 个车次已过点</span>' : '') +
        '</div>' +
        '<div style="overflow-x:auto;">' +
        '<table class="schedule-table">' +
        '<thead><tr><th>车次</th><th>出发站</th><th>到达站</th><th>出发时间</th><th>到达时间</th><th>状态</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '</div>' +
        '</div>';
}

// 获取今天日期字符串 YYYY-MM-DD
function getTodayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
        (d.getMonth() + 1).toString().padStart(2, '0') + '-' +
        d.getDate().toString().padStart(2, '0');
}

// ============================================
// 线路图
// ============================================
function loadRouteMap() {
    const img = document.getElementById('routeMapImage');
    if (img) {
        img.onclick = function () {
            window.open(this.src, '_blank');
        };
    }
}

function handleMapError() {
    const img = document.getElementById('routeMapImage');
    if (img) {
        img.style.display = 'none';
        const container = img.parentElement;
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'width:100%;padding:60px 20px;background:#F5F7FA;border-radius:12px;text-align:center;color:#999;';
        placeholder.innerHTML = '<div style="margin-bottom:12px;color:#bbb;">' + (window.ICONS ? window.ICONS.map.replace('width="24" height="24"', 'width="48" height="48"') : '') + '</div>线路图加载中<br><br><span style="font-size:13px;">请访问官方页面查看：<br><a href="https://gdcj.gzmtr.com/wxMetro/ccyjxz/xltxz.html" target="_blank" style="color:var(--primary);">点击查看线路图</a></span>';
        container.appendChild(placeholder);
    }
}

// ============================================
// 购票乘车 - 外部应用跳转
// ============================================

// 应用配置
const APP_CONFIG = {
    '12306': {
        name: '铁路12306',
        desc: '正在跳转至铁路12306官方APP下载页',
        // 12306 官方APP下载页
        webUrl: 'https://mobile.12306.cn/otsmobile/h5/otsbussiness/downloadapp/downloadapp.html'
    },
    'qrcode': {
        name: '广州地铁',
        desc: '正在跳转至广州地铁官方APP下载页',
        // 广州地铁 官方APP下载页（区分 iOS / 安卓）
        webUrl: {
            ios: 'https://apps.apple.com/cn/app/%E5%B9%BF%E5%B7%9E%E5%9C%B0%E9%93%81%E5%AE%98%E6%96%B9app/id580097761',
            android: 'https://sj.qq.com/appdetail/com.infothinker.gzmetro?&from_wxz=1'
        }
    }
};

// 检测设备平台
function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    return 'android'; // 默认安卓
}

// 直接打开（跳转至官方APP下载/打开页）
function openApp(type) {
    const config = APP_CONFIG[type];
    if (!config) return;

    const url = typeof config.webUrl === 'object'
        ? config.webUrl[detectPlatform()]
        : config.webUrl;

    // 直接跳转
    window.location.href = url;
}

// ============================================
// 票务服务
// ============================================
function showTicketDetail(type) {
    pageHistory.push(currentPage);
    navigateTo('ticket-detail');

    const content = document.getElementById('ticketDetailContent');

    // 板块标题图标
    const titleIcon = function (iconName) {
        return window.ICONS && window.ICONS[iconName]
            ? window.ICONS[iconName].replace('width="24" height="24"', 'width="20" height="20"')
            : '';
    };

    // 合并展示：购票指引 / 票务须知 / 票价查询 / 退改签规则
    const sections = [
        {
            icon: 'book',
            title: '购票指引',
            body:
                '<p style="margin-bottom:12px;">乘坐城际铁路旅客可选择以下两种方式购票：</p>' +
                '<p style="font-weight:600;color:var(--primary);margin-bottom:6px;">方式一：铁路12306票务系统</p>' +
                '<ul style="padding-left:20px;margin-bottom:12px;">' +
                '<li style="list-style:disc;">通过12306网站或手机APP购票</li>' +
                '<li style="list-style:disc;">车站售票窗口购票</li>' +
                '<li style="list-style:disc;">自动售票机购票</li>' +
                '</ul>' +
                '<p style="font-weight:600;color:var(--primary);margin-bottom:6px;">方式二：城际铁路公交化多元支付票务系统</p>' +
                '<ul style="padding-left:20px;margin-bottom:12px;">' +
                '<li style="list-style:disc;">广州地铁官方APP注册，实名认证后使用城际乘车码</li>' +
                '<li style="list-style:disc;">支持身份证、护照、港澳通行证等证件</li>' +
                '<li style="list-style:disc;">可使用羊城通/岭南通/全国交通一卡通绑定后乘车</li>' +
                '</ul>' +
                '<p style="font-size:12px;color:#999;">以上信息仅供参考，具体以车站公告为准</p>'
        },
        {
            icon: 'doc',
            title: '票务须知',
            body:
                '<p style="font-weight:600;margin:10px 0 6px;">一、车票有效期</p>' +
                '<p>车票有效期为"当日使用一次有效"，可改乘当日其他列车。</p>' +
                '<p style="font-weight:600;margin:10px 0 6px;">二、儿童票</p>' +
                '<p>年满6周岁且未满14周岁的儿童应购买儿童优惠票；年满14周岁的儿童应购买全价票。</p>' +
                '<p style="font-weight:600;margin:10px 0 6px;">三、学生票</p>' +
                '<p>学生凭学生证每学年可购买4次单程学生优惠票。</p>' +
                '<p style="font-weight:600;margin:10px 0 6px;">四、乘车时限</p>' +
                '<p>乘车时限为360分钟，超时需按出闸站城际线网单程最高票价缴交超时车费。</p>' +
                '<p style="font-weight:600;margin:10px 0 6px;">五、刷卡进站</p>' +
                '<p>刷卡进站时余额需大于等于34元。</p>' +
                '<p style="font-size:12px;color:#999;margin-top:16px;">详细规则请参阅《城际铁路票务须知》全文</p>'
        },
        {
            icon: 'wallet',
            title: '票价查询',
            body:
                '<p>票价信息请以车站公告的《动车组列车站间票价表》为准。</p>' +
                '<p style="margin-top:12px;">您可以通过以下方式查询：</p>' +
                '<ul style="padding-left:20px;margin-top:8px;">' +
                '<li style="list-style:disc;">车站售票窗口查询</li>' +
                '<li style="list-style:disc;">12306官方网站查询</li>' +
                '<li style="list-style:disc;">广州地铁官方APP查询</li>' +
                '<li style="list-style:disc;">拨打服务热线 020-96891 咨询</li>' +
                '</ul>'
        },
        {
            icon: 'refresh',
            title: '退改签规则',
            body:
                '<p style="font-weight:600;margin:10px 0 6px;">一、改签</p>' +
                '<p>可改乘当日其他列车。改乘前请自行查看改乘车次停站站点、时间等信息。</p>' +
                '<p style="font-weight:600;margin:10px 0 6px;">二、退票</p>' +
                '<p>车站办理预售期内未有进站记录的电子客票退票，不核收手续费。</p>' +
                '<p style="font-weight:600;margin:10px 0 6px;">三、12306办理</p>' +
                '<p>通过12306网站办理变更到站、改签、退票，按12306网站现行标准执行。</p>' +
                '<p style="font-weight:600;margin:10px 0 6px;">四、现金购票</p>' +
                '<p>使用现金方式购买或已开具电子发票的电子客票，仅可在车站窗口办理改签、变更到站手续。</p>'
        }
    ];

    let html = '<div class="ticket-page" style="padding:16px;">';
    sections.forEach(function (s) {
        html += '<div class="ticket-card" style="cursor:default;margin-bottom:12px;">' +
            '<div class="ticket-title"><span style="color:var(--primary);">' + titleIcon(s.icon) + '</span>' + s.title + '</div>' +
            '<div class="ticket-desc" style="margin-top:12px;font-size:14px;">' + s.body + '</div>' +
            '</div>';
    });
    html += '</div>';

    content.innerHTML = html;
}

// ============================================
// 在线客服
// ============================================
function submitService() {
    const subject = document.getElementById('serviceSubject').value;
    const name = document.getElementById('serviceName').value.trim();
    const phone = document.getElementById('servicePhone').value.trim();
    const line = document.getElementById('serviceLine').value;
    const station = document.getElementById('serviceStation').value.trim();
    const address = document.getElementById('serviceAddress').value.trim();
    const content = document.getElementById('serviceContent').value.trim();
    const replyInput = document.querySelector('input[name="serviceReply"]:checked');
    const needReply = replyInput ? replyInput.value : '是';

    if (!name) {
        showToast('请输入姓名');
        return;
    }
    if (!phone) {
        showToast('请输入联系电话');
        return;
    }
    if (!/^1\d{10}$/.test(phone)) {
        showToast('请输入正确的手机号码');
        return;
    }
    if (!address) {
        showToast('请输入具体地址');
        return;
    }
    if (!content) {
        showToast('请输入诉求内容');
        return;
    }

    // 提交按钮状态
    const btn = document.querySelector('.service-form .btn-primary');
    const oldText = btn ? btn.textContent : '';
    if (btn) {
        btn.disabled = true;
        btn.textContent = '提交中...';
    }

    fetch('/api/service-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subject: subject,
            name: name,
            phone: phone,
            line: line,
            station: station,
            address: address,
            content: content,
            needReply: needReply
        })
    }).then(function (resp) {
        return resp.json().catch(function () { return { code: resp.status, message: '服务响应异常' }; });
    }).then(function (data) {
        if (data.code === 200) {
            showToast('工单提交成功，客服人员将尽快与您联系');
            document.getElementById('serviceName').value = '';
            document.getElementById('servicePhone').value = '';
            document.getElementById('serviceStation').value = '';
            document.getElementById('serviceAddress').value = '';
            document.getElementById('serviceContent').value = '';
        } else {
            showToast((data.message || '提交失败') + '，请稍后重试');
        }
    }).catch(function () {
        showToast('网络异常，提交失败，请稍后重试');
    }).finally(function () {
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText;
        }
    });
}

// 展开/收起失物登记表单
function toggleLostRegister() {
    document.getElementById('lostRegisterForm').parentElement.classList.toggle('open');
}

// 提交失物登记（通过官方客服工单系统真实提交）
function submitLostReport() {
    const name = document.getElementById('lostReportName').value.trim();
    const desc = document.getElementById('lostReportDesc').value.trim();
    const line = document.getElementById('lostReportLine').value;
    const place = document.getElementById('lostReportPlace').value.trim();
    const date = document.getElementById('lostReportDate').value;
    const contact = document.getElementById('lostReportContact').value.trim();
    const phone = document.getElementById('lostReportPhone').value.trim();

    if (!name) {
        showToast('请输入物品名称');
        return;
    }
    if (!place) {
        showToast('请输入遗失站点/地点');
        return;
    }
    if (!contact) {
        showToast('请输入联系人姓名');
        return;
    }
    if (!phone) {
        showToast('请输入联系电话');
        return;
    }
    if (!/^1\d{10}$/.test(phone)) {
        showToast('请输入正确的手机号码');
        return;
    }

    // 拼装诉求内容
    let content = '物品名称：' + name;
    if (desc) content += '；物品描述：' + desc;
    if (line) content += '；遗失线路：' + line;
    content += '；遗失地点：' + place;
    if (date) content += '；遗失日期：' + date;
    content += '（失物招领登记）';

    const btn = document.querySelector('.lost-register .btn-primary');
    const oldText = btn ? btn.textContent : '';
    if (btn) {
        btn.disabled = true;
        btn.textContent = '提交中...';
    }

    fetch('/api/service-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            subject: '失物招领登记',
            name: contact,
            phone: phone,
            line: line,
            station: place,
            address: place,
            content: content,
            needReply: '是'
        })
    }).then(function (resp) {
        return resp.json().catch(function () { return { code: resp.status, message: '服务响应异常' }; });
    }).then(function (data) {
        if (data.code === 200) {
            showToast('失物登记提交成功，客服人员将尽快与您联系');
            document.getElementById('lostReportName').value = '';
            document.getElementById('lostReportDesc').value = '';
            document.getElementById('lostReportPlace').value = '';
            document.getElementById('lostReportDate').value = '';
            document.getElementById('lostReportContact').value = '';
            document.getElementById('lostReportPhone').value = '';
            document.getElementById('lostReportLine').value = '';
        } else {
            showToast((data.message || '提交失败') + '，请稍后重试');
        }
    }).catch(function () {
        showToast('网络异常，提交失败，请稍后重试');
    }).finally(function () {
        if (btn) {
            btn.disabled = false;
            btn.textContent = oldText;
        }
    });
}
// 失物招领样本数据（22条）
const SAMPLE_LOST_ITEMS = [
    { name: '黑色双肩背包', detail: '黑色尼龙材质，内含身份证、银行卡、充电宝一个', line: '广清城际', place: '花都站', date: '2026-07-28', status: '待认领' },
    { name: '银色行李箱', detail: '24寸银色硬壳行李箱，品牌Samsonite，内含衣物', line: '广清城际', place: '清城站', date: '2026-07-29', status: '待认领' },
    { name: '蓝色雨伞', detail: '深蓝色折叠雨伞，伞柄有木柄装饰', line: '广州东环城际', place: '广州白云站', date: '2026-07-27', status: '待认领' },
    { name: '白色AirPods耳机', detail: '白色AirPods Pro充电盒，序列号已磨损', line: '穗深城际', place: '新塘南站', date: '2026-07-30', status: '待认领' },
    { name: '棕色钱包', detail: '棕色真皮驾驶证夹，内含驾驶证、行驶证', line: '广肇城际', place: '肇庆东站', date: '2026-07-26', status: '已认领' },
    { name: 'iPhone 14手机', detail: '深紫色iPhone 14，屏幕有裂纹，带透明手机壳', line: '广惠城际', place: '惠州北站', date: '2026-07-29', status: '待认领' },
    { name: '儿童水壶', detail: '粉色独角兽造型保温水壶，500ml容量', line: '广清城际', place: '花都站候车室', date: '2026-07-31', status: '待认领' },
    { name: '身份证', detail: '居民身份证，姓名已隐去，签发机关广州市公安局', line: '广州东环城际', place: 'T2航站楼站', date: '2026-07-25', status: '已认领' },
    { name: '移动电源', detail: '小米移动电源3，20000mAh，黑色，外观有明显使用痕迹', line: '穗深城际', place: '琶洲站', date: '2026-07-28', status: '待认领' },
    { name: '钥匙串', detail: '5把钥匙，配有灰色皮质钥匙扣和一个门禁卡套', line: '广肇城际', place: '佛山西站', date: '2026-07-27', status: '待认领' },
    { name: '眼镜盒', detail: '深蓝色硬质眼镜盒，内含一副金属框眼镜', line: '广惠城际', place: '惠州南站', date: '2026-07-30', status: '待认领' },
    { name: '购物袋', detail: '优衣格纹购物袋，内含衣物若干和一双运动鞋', line: '广清城际', place: '清城站站台', date: '2026-07-26', status: '待认领' },
    { name: 'Switch游戏机', detail: '红蓝款Switch主机，配Joy-Con手柄，有贴膜', line: '广州东环城际', place: '广州白云站安检处', date: '2026-07-29', status: '待认领' },
    { name: '护照', detail: '中国护照一本，有效期至2029年', line: '穗深城际', place: '深圳机场站', date: '2026-07-24', status: '已认领' },
    { name: '文件袋', detail: 'A4透明文件袋，内含合同文件和一张名片', line: '广肇城际', place: '肇庆站', date: '2026-07-31', status: '待认领' },
    { name: '无线鼠标', detail: '罗技M590无线静音鼠标，银灰色', line: '广惠城际', place: '惠东站', date: '2026-07-28', status: '待认领' },
    { name: '蓝牙耳机', detail: 'OPPO Enco X2耳机，白色充电盒，支持降噪', line: '广清城际', place: '花都站出站口', date: '2026-07-27', status: '待认领' },
    { name: '保温杯', detail: '黑色象印保温杯，500ml，底部有贴纸', line: '广州东环城际', place: '马头庄站', date: '2026-07-30', status: '待认领' },
    { name: '会员卡袋', detail: '黑色皮质卡包，内含多张会员卡和积分卡', line: '穗深城际', place: '中堂站', date: '2026-07-26', status: '待认领' },
    { name: '数据线', detail: '苹果Lightning数据线，白色，约1.5米长', line: '广肇城际', place: '佛山西站候车室', date: '2026-07-25', status: '已认领' },
    { name: '相机SD卡', detail: 'SanDisk 64GB SD存储卡，用于数码相机', line: '广惠城际', place: '惠东南站', date: '2026-07-29', status: '待认领' },
    { name: '手环', detail: '小米手环8，黑色腕带，屏幕有划痕', line: '广清城际', place: '清城站安检机', date: '2026-07-24', status: '待认领' }
];

// 页面加载时自动展示失物招领数据
function searchLost() {
    const keyword = document.getElementById('lostKeyword').value.trim().toLowerCase();
    const line = document.getElementById('lostLine').value;
    const container = document.getElementById('lostList');

    // 拷贝数组，避免后续 sort() 原地修改全局样本数据
    let results = SAMPLE_LOST_ITEMS.slice();

    // 关键词筛选
    if (keyword) {
        results = results.filter(function (item) {
            return item.name.toLowerCase().includes(keyword) ||
                item.detail.toLowerCase().includes(keyword) ||
                item.place.toLowerCase().includes(keyword) ||
                item.line.toLowerCase().includes(keyword);
        });
    }

    // 线路筛选
    if (line) {
        results = results.filter(function (item) {
            return item.line === line;
        });
    }

    // 按日期倒序
    results.sort(function (a, b) {
        return (b.date || '').localeCompare(a.date || '');
    });

    renderLostItems(results, keyword, line, container);
}

// HTML 转义，防止用户输入注入页面
function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 渲染失物列表
function renderLostItems(items, keyword, line, container) {
    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state">' +
            '<div class="empty-icon">' + (window.ICONS ? window.ICONS.search : '') + '</div>' +
            '<div class="empty-text">未找到匹配的遗失物品<br><span style="font-size:12px;color:#999;">请尝试其他关键词</span></div>' +
            '</div>';
        return;
    }

    const pendingCount = items.filter(function (i) { return (i.status || '').indexOf('待认领') !== -1 || !i.status; }).length;

    let html = '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px 12px;">' +
        '<span style="font-size:13px;font-weight:600;color:var(--text-secondary);">' +
        '共 ' + items.length + ' 条记录' +
        (keyword || line ? '（筛选结果）' : '') +
        '</span>' +
        '<span style="font-size:12px;color:#E65100;">' + pendingCount + ' 件待认领</span>' +
        '</div>';

    html += items.map(function (item) {
        const status = item.status || '待认领';
        const statusClass = status.indexOf('待认领') !== -1 ? 'status-pending' : status.indexOf('已认领') !== -1 ? 'status-claimed' : 'status-found';
        const initial = escapeHtml((item.name || '').charAt(0) || '?');
        return '<div class="lost-item">' +
            '<div class="lost-icon">' + initial + '</div>' +
            '<div class="lost-info">' +
            '<div class="lost-name">' + escapeHtml(item.name) + '</div>' +
            '<div class="lost-detail">' + escapeHtml(item.detail) + '</div>' +
            '<div style="display:flex;gap:10px;align-items:center;margin-top:6px;flex-wrap:wrap;">' +
            '<span style="font-size:12px;color:var(--text-light);">' + escapeHtml(item.date) + ' | ' + escapeHtml(item.line) + ' | ' + escapeHtml(item.place) + '</span>' +
            '<span class="lost-status ' + statusClass + '">' + escapeHtml(status) + '</span>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');

    container.innerHTML = html;
}

// ============================================
// 旅客须知 (手风琴)
// ============================================
function toggleInfo(header) {
    header.classList.toggle('active');
    const body = header.nextElementSibling;
    body.classList.toggle('show');
}

// ============================================
// Toast 提示
// ============================================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerHTML = message;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
        toast.classList.remove('show');
    }, 2500);
}

// ============================================
// 车站设施查询（卫生间 / 母婴室 / 便民举措）
// ============================================

// 当前设施查询Tab
let facilityTabMode = 'wc';   // wc: 卫生间 | baby: 母婴室 | bm: 便民举措

// 设施官方URL映射
const FACILITY_URLS = {
    'wc': 'https://wx.gzmtr.com:50443/#/wcSearch?language=Cn',
    'baby': 'https://wx.gzmtr.com:50443/#/babyRoomSearch?language=Cn',
    'bm': 'https://gdcj.gzmtr.com/wxMetro/fwck/bm.htm'
};

// 设施Tab名称映射
const FACILITY_LABELS = {
    'wc': '卫生间',
    'baby': '母婴室',
    'bm': '便民举措'
};

// 切换设施页面Tab
function switchFacilityTab(mode) {
    facilityTabMode = mode;
    var tabWc = document.getElementById('tabFacilityWC');
    var tabBaby = document.getElementById('tabFacilityBaby');
    var tabBm = document.getElementById('tabFacilityBM');
    if (tabWc) tabWc.classList.toggle('active', mode === 'wc');
    if (tabBaby) tabBaby.classList.toggle('active', mode === 'baby');
    if (tabBm) tabBm.classList.toggle('active', mode === 'bm');

    // 加载对应的iframe页面
    loadFacilityIframe();
}

// 加载设施iframe
function loadFacilityIframe() {
    // 便民举措页面(gdcj.gzmtr.com)返回 X-Frame-Options: DENY，禁止iframe嵌入，
    // 需通过后端代理取回内容后自行渲染；卫生间/母婴室页面无此限制，可正常iframe。
    if (facilityTabMode === 'bm') {
        loadFacilityBM();
        return;
    }

    var iframe = document.getElementById('facilityIframe');
    var loading = document.getElementById('facilityLoading');
    var url = FACILITY_URLS[facilityTabMode];
    
    if (!iframe || !url) return;
    
    // 显示loading，隐藏iframe
    if (loading) {
        loading.style.display = 'block';
        loading.innerHTML = '<div class="loading-spinner" style="margin:0 auto 12px;"></div><div class="loading-text">加载中...</div>';
    }
    iframe.style.display = 'none';
    
    // 设置iframe URL
    iframe.src = url;
    
    // iframe加载完成后隐藏loading
    iframe.onload = function() {
        if (loading) loading.style.display = 'none';
        iframe.style.display = 'block';
    };
    
    // 加载超时处理
    setTimeout(function() {
        if (loading && loading.style.display !== 'none') {
            if (loading) loading.style.display = 'none';
            iframe.style.display = 'block';
        }
    }, 8000);
    
    // 加载错误处理
    iframe.onerror = function() {
        if (loading) {
            loading.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.alert : '') + '</div>' +
                '<div class="empty-text">加载失败</div>' +
                '<button class="btn-primary" style="margin-top:16px;" onclick="window.open(\'' + url + '\', \'_blank\')">在新窗口打开</button>' +
                '</div>';
        }
    };
}

// 加载便民举措内容（bm.htm 禁止 iframe，通过后端代理取回 HTML 解析图片渲染）
function loadFacilityBM() {
    var container = document.getElementById('facilityIframeContainer');
    var iframe = document.getElementById('facilityIframe');
    if (!container) return;
    if (iframe) iframe.style.display = 'none';

    container.innerHTML = '<div class="loading-state" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-page);z-index:10;">' +
        '<div class="loading-spinner" style="margin:0 auto 12px;"></div><div class="loading-text">加载中...</div></div>';

    var loadingEl = container.querySelector('.loading-state');

    fetch('/api/facilities/bm')
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function (html) {
            // 解析 HTML，提取正文中的图片
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var imgs = doc.querySelectorAll('#main-content img, #main-content p img');
            var imgSrc = '';
            if (imgs.length > 0) {
                var src = imgs[0].getAttribute('src') || '';
                if (src && !/^https?:\/\//i.test(src)) {
                    // 相对路径补全为官方绝对地址
                    src = 'https://gdcj.gzmtr.com/wxMetro' + (src.charAt(0) === '/' ? '' : '/') + src.replace(/^\.\.\//, 'fwck/../');
                    if (src.indexOf('wxMetro') === -1) src = 'https://gdcj.gzmtr.com/wxMetro/' + src;
                }
                imgSrc = src;
            }
            if (imgSrc) {
                container.innerHTML = '<div style="padding:16px;">' +
                    '<div style="font-size:15px;font-weight:600;color:var(--primary);margin-bottom:12px;">便民举措</div>' +
                    '<img src="' + imgSrc + '" alt="便民举措" style="width:100%;height:auto;border-radius:8px;display:block;" onerror="this.parentNode.innerHTML=\'<div class=empty-state><div class=empty-icon></div><div class=empty-text>图片加载失败</div><button class=btn-primary style=margin-top:16px; onclick=window.open(\\\'' + imgSrc + '\\\',\\\'_blank\\\')>在新窗口打开</button></div>\';">' +
                    '<div style="margin-top:12px;padding:10px 12px;background:#F0F5FF;border-radius:8px;font-size:12px;color:var(--text-secondary);line-height:1.6;">本页面由官方「便民举措」内容自动获取展示，数据以官方发布为准。</div>' +
                    '</div>';
            } else {
                container.innerHTML = '<div class="empty-state" style="padding:40px 24px;">' +
                    '<div class="empty-icon">' + (window.ICONS ? window.ICONS.alert : '') + '</div>' +
                    '<div class="empty-text">便民举措内容加载失败</div>' +
                    '<button class="btn-primary" style="margin-top:16px;" onclick="window.open(\'https://gdcj.gzmtr.com/wxMetro/fwck/bm.htm\', \'_blank\')">在新窗口打开官方页面</button>' +
                    '</div>';
            }
        })
        .catch(function () {
            container.innerHTML = '<div class="empty-state" style="padding:40px 24px;">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.alert : '') + '</div>' +
                '<div class="empty-text">便民举措内容加载失败</div>' +
                '<button class="btn-primary" style="margin-top:16px;" onclick="window.open(\'https://gdcj.gzmtr.com/wxMetro/fwck/bm.htm\', \'_blank\')">在新窗口打开官方页面</button>' +
                '</div>';
        });
}

// ============================================
// 暴露全局函数
// ============================================
window.navigateTo = navigateTo;
window.goBack = goBack;
window.swapStations = swapStations;
window.showStationPicker = showStationPicker;
window.filterStations = filterStations;
window.selectStationLine = selectStationLine;
window.selectStation = selectStation;
window.searchTrains = searchTrains;
window.switchTrainView = switchTrainView;
window.handleMapError = handleMapError;
window.showTicketDetail = showTicketDetail;
window.openApp = openApp;
window.submitService = submitService;
window.searchLost = searchLost;
window.toggleLostRegister = toggleLostRegister;
window.submitLostReport = submitLostReport;
window.toggleInfo = toggleInfo;
window.switchServiceTab = switchServiceTab;
window.switchFacilityTab = switchFacilityTab;
window.loadFacilityIframe = loadFacilityIframe;
