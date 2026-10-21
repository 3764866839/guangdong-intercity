/**
 * 广东城际APP - SVG图标库
 * 使用 currentColor 继承颜色，stroke风格与官方蓝白风格一致
 */
(function () {
    // 通用SVG图标模板（Feather风格线条图标）
    const S = function (paths, extra) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" ' + (extra || '') + '>' + paths + '</svg>';
    };

    const ICONS = {
        // 首页
        home: S('<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9 21v-6h6v6"/>'),
        // 列车
        train: S('<rect x="4" y="3" width="16" height="13" rx="2"/><path d="M4 9h16"/><circle cx="8" cy="17" r="1"/><circle cx="16" cy="17" r="1"/><path d="M7 21l2-2M17 21l-2-2"/><circle cx="8.5" cy="12.5" r="0.5"/><circle cx="15.5" cy="12.5" r="0.5"/>'),
        // 时钟
        clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
        // 电话
        phone: S('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 2z"/>'),
        // 书籍/须知
        book: S('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M20 17v4H6.5a2.5 2.5 0 0 1 0-5"/>'),
        // 地图
        map: S('<path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z"/><path d="M9 3v16M15 5v16"/>'),
        // 车票
        ticket: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h2M3 14h2M19 10h2M19 14h2M15 5v14" stroke-dasharray="3 2"/>'),
        // 搜索
        search: S('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
        // 客服气泡
        chat: S('<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.4-.7L3 21l1.8-5.3a8.3 8.3 0 0 1-.8-3.4 8.4 8.4 0 0 1 8.4-8.3h.5a8.4 8.4 0 0 1 8.1 7.5z"/>'),
        // 文档
        doc: S('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/>'),
        // 换乘箭头
        swap: S('<path d="M17 1l4 4-4 4"/><path d="M21 5H9"/><path d="M7 23l-4-4 4-4"/><path d="M3 19h12"/>'),
        // 返回箭头
        back: S('<path d="M15 18l-6-6 6-6"/>'),
        // 右箭头
        chevronRight: S('<path d="M9 18l6-6-6-6"/>'),
        // 下箭头
        chevronDown: S('<path d="M6 9l6 6 6-6"/>'),
        // 日历
        calendar: S('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
        // 位置
        pin: S('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
        // 对勾
        check: S('<path d="M20 6L9 17l-5-5"/>'),
        // 警告
        alert: S('<path d="M10.3 3.8L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
        // 信息
        info: S('<circle cx="12" cy="12" r="9"/><path d="M12 16v-5M12 8h.01"/>'),
        // 钱包/票款
        wallet: S('<rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M16 15h2"/>'),
        // 换票
        refresh: S('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>'),
        // 放大镜放大
        zoomIn: S('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6M11 8v6"/>'),
        // 爱心(表扬)
        heart: S('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>'),
        // 星星(建议)
        star: S('<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2 1.2-6.8-5-4.9 6.9-1z"/>'),
        // 感叹号(投诉)
        alertCircle: S('<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>'),
        // 问号(咨询)
        helpCircle: S('<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
        // 手表/时间
        watch: S('<circle cx="12" cy="12" r="6"/><path d="M12 9v3l2 2M9 2h6M9 22h6"/>'),
        // 二维码/乘车码
        qrcode: S('<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"/>'),
        // 外部链接
        external: S('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'),
        // 下载
        download: S('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
        // 编辑(失物登记)
        edit: S('<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>')
    };

    window.ICONS = ICONS;

    // 初始化：将页面上所有 [data-icon] 元素替换为对应SVG图标
    function initIcons() {
        document.querySelectorAll('[data-icon]').forEach(function (el) {
            const name = el.getAttribute('data-icon');
            if (ICONS[name]) {
                el.innerHTML = ICONS[name];
            }
        });
    }

    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIcons);
    } else {
        initIcons();
    }
})();