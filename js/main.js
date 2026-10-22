/**
 * 广东城际官方APP - 主逻辑
 * 响应式网站 - 仿官方蓝白风格
 */

// ============================================
// 数据定义
// ============================================

// 广东城际站点列表（按线路分组，与官方站点数据一致，来源: https://iro-traa.gzmtr.com/traa.html）
const STATION_LINES = {
    '广清城际': [
        '广州白云', '白云湖', '江高', '神山', '花都', '乐同', '狮岭',
        '银盏', '龙塘镇', '清城', '燕湖', '洲心', '飞霞'
    ],
    '广州东环城际': [
        '花都', '花城街', '花山镇', '白云机场北', '白云机场南', '白云机场东',
        '竹料', '帽峰山', '大源', '龙洞', '岑村', '科韵路', '琶洲',
        '广州大学城', '大石东', '番禺'
    ],
    '广肇城际': [
        '番禺', '陈村', '北滘西', '顺德北', '张槎', '佛山西', '狮山', '狮山北',
        '三水北', '云东海', '大旺', '四会', '鼎湖东', '鼎湖山', '端州', '肇庆'
    ],
    '广惠城际': [
        '番禺', '广州长隆', '东环', '官桥北', '广州莲花山', '麻涌', '东莞西',
        '道滘', '西平西', '东城南', '寮步', '松山湖北', '大朗镇',
        '常平南', '常平东', '樟木头东', '银瓶', '沥林北',
        '陈江南', '惠环', '龙丰', '西湖东', '云山', '小金口', '惠州北'
    ],
    '琶莲城际': [
        '琶洲', '深井', '化龙南', '广州莲花山'
    ],
    '穗深城际': [
        '竹料', '佛塱', '九佛', '新龙', '永宁北', '永宁南', '镇龙',
        '钟落潭东', '新塘南', '中堂', '望牛墩', '东莞西',
        '洪梅', '东莞港', '厚街', '虎门北', '虎门东', '长安西', '长安',
        '沙井西', '福海西', '深圳机场北', '深圳机场'
    ]
};

// 地铁换乘枢纽站（官方 HUB_DATA：地铁站名 → 城际站名/换乘信息，来源: https://iro-traa.gzmtr.com/traa-metro.html）
const METRO_HUBS = {
    '新塘': { intercity: '新塘南', transferTime: 8 },
    '广州南站': { intercity: '番禺', transferTime: 15 },
    '琶洲': { intercity: '琶洲', transferTime: 12 },
    '科韵路': { intercity: '科韵路', transferTime: 10 },
    '大石': { intercity: '大石东', transferTime: 15 },
    '汉溪长隆': { intercity: '广州长隆', transferTime: 15 },
    '龙洞': { intercity: '龙洞', transferTime: 12 },
    '竹料': { intercity: '竹料', transferTime: 5 },
    '机场北': { intercity: '白云机场北', transferTime: 8 },
    '广州北站': { intercity: '花都', transferTime: 10 },
    '广州白云站': { intercity: '广州白云', transferTime: 8 },
    '陈村': { intercity: '陈村', transferTime: 8 },
    '张槎': { intercity: '张槎', transferTime: 10 },
    '东平': { intercity: '顺德北', transferTime: 10 },
    '北滘西站': { intercity: '北滘西', transferTime: 12 },
    '深井': { intercity: '深井', transferTime: 8 },
    '佛山西站': { intercity: '佛山西', transferTime: 10 },
    '地铁香雪': { intercity: '香雪', transferTime: 3 },
    '地铁长平': { intercity: '长平', transferTime: 3 },
    '地铁水西': { intercity: '水西', transferTime: 3 },
    '市民广场': { intercity: '萝岗', transferTime: 3 }
};

// 地铁站显示名（与官方一致）
const METRO_DISPLAY = {
    '白云机场北': '白云机场北（T2）',
    '白云机场南': '白云机场南（T1）',
    '白云机场东': '白云机场东（T3）'
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

// 官方站点完整列表（490站，站名→拼音，来源: https://iro-traa.gzmtr.com/stations.html 的 STATION_PINYIN_MAP）
// 包含城际站+地铁站+有轨站，plan 接口均支持作为起终点（如 体育西路→东平）；拼音用于首字母索引/搜索
const ALL_OFFICIAL_STATIONS = {
    "白江":"baijiang",
    "白云大道北":"baiyundadaobei",
    "白云东平":"baiyundongping",
    "白云公园":"baiyungongyuan",
    "白云湖":"baiyunhu",
    "白云机场北":"baiyunjichangbei",
    "白云机场东":"baiyunjichangdong",
    "白云机场南":"baiyunjichangnan",
    "白云文化广场":"baiyunwenhuaguangchang",
    "板桥":"banqiao",
    "傍江":"bangjiang",
    "宝岗大道":"baogangdadao",
    "保盈大道":"baoyingdadao",
    "北滘公园":"beijiaogongyuan",
    "北滘西":"beijiaoxi",
    "北滘西站":"beijiaoxizhan",
    "北京路":"beijinglu",
    "北山":"beishan",
    "北师大实验学校":"beishidashiyanxuexiao",
    "滨江东路":"binjiangdonglu",
    "博爱中路":"boaizhonglu",
    "彩虹桥":"caihongqiao",
    "岑村":"cencun",
    "昌岗":"changgang",
    "常平东":"changpingdong",
    "常平南":"changpingnan",
    "朝安":"zhaoan",
    "车陂":"chebei",
    "车陂南":"chebeinan",
    "陈村":"chencun",
    "陈村北":"chencunbei",
    "陈家祠":"chenjiaci",
    "陈江南":"chenjiangnan",
    "陈头岗":"chentougang",
    "赤草":"chicao",
    "赤岗":"chigang",
    "赤岗塔":"chigangta",
    "赤沙":"chisha",
    "赤沙北":"chishabei",
    "虫雷岗":"chongleigang",
    "从化客运站":"conghuakeyunzhan",
    "大冲口":"dachongkou",
    "大墩":"dadun",
    "大干围":"daganwei",
    "大观南路":"daguannanlu",
    "大金钟路":"dajinzhonglu",
    "大剧院":"dajuyuan",
    "大朗镇":"dalangzhen",
    "大良钟楼":"daliangzhonglou",
    "大沙地":"dashadi",
    "大沙东":"dashadong",
    "大石":"dashi",
    "大石东":"dashidong",
    "大塘":"datang",
    "大旺":"dawang",
    "大学城北":"daxuechengbei",
    "大学城南":"daxuechengnan",
    "大涌":"dayong",
    "大源":"dayuan",
    "大洲":"dazhou",
    "道滘":"daojiao",
    "地铁水西":"ditieshuixi",
    "地铁香雪":"ditiexiangxue",
    "地铁长平":"ditiechangping",
    "登洲":"dengzhou",
    "低涌":"diyong",
    "棣园":"diyuan",
    "叠滘":"diejiao",
    "鼎湖东":"dinghudong",
    "鼎湖山":"dinghushan",
    "东城南":"dongchengnan",
    "东风":"dongfeng",
    "东莞港":"dongguangang",
    "东莞西":"dongguanxi",
    "东湖":"donghu",
    "东环":"donghuan",
    "东乐路":"donglelu",
    "东平":"dongping",
    "东圃":"dongpu",
    "东沙":"dongsha",
    "东山口":"dongshankou",
    "东晓南":"dongxiaonan",
    "东涌":"dongyong",
    "动物园":"dongwuyuan",
    "端州":"duanzhou",
    "鹅掌坦":"ezhangtan",
    "二沙岛":"ershadao",
    "番禺":"fanyu",
    "番禺广场":"fanyuguangchang",
    "芳村":"fangcun",
    "飞鹅岭":"feieling",
    "飞沙角":"feishajiao",
    "飞霞":"feixia",
    "飞翔公园":"feixianggongyuan",
    "枫下":"fengxia",
    "凤岗":"fenggang",
    "凤凰新村":"fenghuangxincun",
    "佛塱":"folang",
    "佛山大学":"foshandaxue",
    "佛山西":"foshanxi",
    "佛山西站":"foshanxizhan",
    "福海西":"fuhaixi",
    "妇儿中心":"fuerzhongxin",
    "干部健康中心":"ganbujiankangzhongxin",
    "岗顶":"gangding",
    "高村":"gaocun",
    "高塘石":"gaotangshi",
    "高增":"gaozeng",
    "工业大道南":"gongyedadaonan",
    "公园前":"gongyuanqian",
    "官湖":"guanhu",
    "官桥北":"guanqiaobei",
    "官洲":"guanzhou",
    "广教":"guangjiao",
    "广隆":"guanglong",
    "广州白云":"guangzhoubaiyun",
    "广州白云站":"guangzhoubaiyunzhan",
    "广州北站":"guangzhoubeizhan",
    "广州大学城":"guangzhoudaxuecheng",
    "广州东站":"guangzhoudongzhan",
    "广州火车站":"guangzhouhuochezhan",
    "广州莲花山":"guangzhoulianhuashan",
    "广州南站":"guangzhounanzhan",
    "广州塔":"guangzhouta",
    "广州体育馆":"guangzhoutiyuguan",
    "广州长隆":"guangzhouchanglong",
    "桂城":"guicheng",
    "海傍":"haibang",
    "海心沙":"haixinsha",
    "海涌路":"haiyonglu",
    "海珠广场":"haizhuguangchang",
    "汉溪长隆":"hanxichanglong",
    "何棠下":"hetangxia",
    "河沙":"hesha",
    "鹤边":"hebian",
    "鹤洞":"hedong",
    "鹤洞东":"hedongdong",
    "鹤龙":"helong",
    "横沥":"hengli",
    "横沙":"hengsha",
    "红卫":"hongwei",
    "洪梅":"hongmei",
    "厚街":"houjie",
    "湖涌":"huyong",
    "虎门北":"humenbei",
    "虎门东":"humendong",
    "花城大道":"huachengdadao",
    "花城街":"huachengjie",
    "花城路":"huachenglu",
    "花地湾":"huadiwan",
    "花都":"huadu",
    "花都广场":"huaduguangchang",
    "花都汽车城":"huaduqichecheng",
    "花果山公园":"huaguoshangongyuan",
    "花卉世界":"huahuishijie",
    "花山镇":"huashanzhen",
    "花围":"huawei",
    "华翠路":"huacuilu",
    "华景路":"huajinglu",
    "华林寺":"hualinsi",
    "华师":"huashi",
    "化龙南":"hualongnan",
    "环市北":"huanshibei",
    "黄边":"huangbian",
    "黄埔大道":"huangpudadao",
    "黄埔图书馆":"huangputushuguan",
    "黄埔新港":"huangpuxingang",
    "黄村":"huangcun",
    "黄阁":"huangge",
    "黄阁汽车城":"huanggeqichecheng",
    "黄花岗":"huanghuagang",
    "黄陂":"huangbei",
    "黄沙":"huangsha",
    "会江":"huijiang",
    "会议中心":"huiyizhongxin",
    "会展东":"huizhandong",
    "会展中":"huizhanzhong",
    "惠环":"huihuan",
    "惠州北":"huizhoubei",
    "机场北":"jichangbei",
    "机场南":"jichangnan",
    "姬堂":"jitang",
    "纪念堂":"jiniantang",
    "季华六路":"jihualiulu",
    "季华园":"jihuayuan",
    "加庄":"jiazhuang",
    "嘉禾望岗":"jiahewanggang",
    "江高":"jianggao",
    "江南西":"jiangnanxi",
    "江泰路":"jiangtailu",
    "江夏":"jiangxia",
    "蕉门":"jiaomen",
    "滘口":"jiaokou",
    "滘心":"jiaoxin",
    "金峰":"jinfeng",
    "金坑":"jinkeng",
    "金融高新区":"jinronggaoxinqu",
    "金洲":"jinzhou",
    "锦龙":"jinlong",
    "京溪南方医院":"jingxinanfangyiyuan",
    "九佛":"jiufo",
    "驹荣北路":"jurongbeilu",
    "菊树":"jushu",
    "聚龙":"julong",
    "峻泰路":"juntailu",
    "开源大道东":"kaiyuandadaodong",
    "康怡公园":"kangyigongyuan",
    "柯木塱":"kemulang",
    "科丰路":"kefenglu",
    "科盛路":"keshenglu",
    "科学城":"kexuecheng",
    "科韵路":"keyunlu",
    "客村":"kecun",
    "坑贝":"kengbei",
    "坑口":"kengkou",
    "魁奇路":"kuiqilu",
    "澜石":"lanshi",
    "乐嘉路":"lejialu",
    "乐同":"letong",
    "沥滘":"lijiao",
    "沥林北":"lilinbei",
    "荔村":"licun",
    "莲塘":"liantang",
    "联和":"lianhe",
    "寮步":"liaobu",
    "烈士陵园":"lieshilingyuan",
    "猎德":"liede",
    "猎德大桥南":"liedeqiaonan",
    "林和西":"linhexi",
    "林岳北":"linyuebei",
    "林岳东":"linyuedong",
    "林岳西":"linyuexi",
    "岭头":"lingtou",
    "岭头东":"lingtoudong",
    "流花":"liuhua",
    "龙洞":"longdong",
    "龙丰":"longfeng",
    "龙归":"longgui",
    "龙口西":"longkouxi",
    "龙潭":"longtan",
    "龙塘镇":"longtangzhen",
    "龙溪":"longxi",
    "鹭江":"lujiang",
    "绿岛湖":"lvdaohu",
    "伦教":"lunjiao",
    "罗村":"luocun",
    "萝峰":"luofeng",
    "萝岗":"luogang",
    "洛溪":"luoxi",
    "麻涌":"mayong",
    "马鞍山公园":"maanshangongyuan",
    "马沥":"mali",
    "马务":"mawu",
    "帽峰山":"maofengshan",
    "梅花园":"meihuayuan",
    "美的":"meide",
    "美的大道":"meidedadao",
    "庙头":"miaotou",
    "磨碟沙":"modiesha",
    "南村万博":"nancunwanbo",
    "南风":"nanfeng",
    "南岗":"nangang",
    "南桂路":"nanguilu",
    "南海大学城":"nanhaidaxuecheng",
    "南海神庙":"nanhaishenmiao",
    "南横":"nanheng",
    "南漖":"nanjiao",
    "南浦":"nanpu",
    "南浦西":"nanpuxi",
    "南沙客运港":"nanshakeyungang",
    "南涌":"nanyong",
    "南洲":"nanzhou",
    "南庄":"nanzhuang",
    "农讲所":"nongjiangsuo",
    "琶醍":"pati",
    "琶洲":"pazhou",
    "琶洲大桥南":"pazhoudaqiaonan",
    "琶洲塔":"pazhouta",
    "彭边":"pengbian",
    "平南":"pingnan",
    "平西":"pingxi",
    "普君北路":"pujunbeilu",
    "千灯湖":"qiandenghu",
    "羌洞":"qiangdong",
    "清城":"qingcheng",
    "清塘":"qingtang",
    "清㘵":"qingbu",
    "庆盛":"qingsheng",
    "区少年宫（萝岗）":"qushaoniangong",
    "区庄":"quzhuang",
    "人和":"renhe",
    "如意坊":"ruyifang",
    "三山新城北":"sanshanxinchengbei",
    "三山新城南":"sanshanxinchengnan",
    "三水北":"sanshuibei",
    "三溪":"sanxi",
    "三元里":"sanyuanli",
    "沙贝":"shabei",
    "沙村":"shacun",
    "沙岗":"shagang",
    "沙河":"shahe",
    "沙河顶":"shaheding",
    "沙井西":"shajingxi",
    "沙溪":"shaxi",
    "沙涌":"shayong",
    "沙园":"shayuan",
    "厦滘":"shajiao",
    "山田":"shantian",
    "上步":"shangbu",
    "上涌":"shangyong",
    "深井":"shenjing",
    "深圳机场":"shenzhenjichang",
    "深圳机场北":"shenzhenjichangbei",
    "神岗":"shengang",
    "神山":"shenshan",
    "神舟路":"shenzhoulu",
    "狮岭":"shiling",
    "狮山":"shishan",
    "狮山北":"shishanbei",
    "石壁":"shibi",
    "石井":"shijing",
    "石梁":"shiliang",
    "石牌桥":"shipaiqiao",
    "石碁":"shiqi",
    "石碁南":"shiqinan",
    "石潭":"shitan",
    "石湾":"shiwan",
    "石围塘":"shiweitang",
    "石溪":"shixi",
    "石洲":"shizhou",
    "世纪莲":"shijilian",
    "市二宫":"shiergong",
    "市广路":"shiguanglu",
    "市民广场":"shiminguangchang",
    "市桥":"shiqiao",
    "双岗":"shuanggang",
    "双沙":"shuangsha",
    "水西":"shuixi",
    "顺德北":"shundebei",
    "顺德欢乐海岸":"shundehuanlehaian",
    "顺德人民医院":"shunderenminyiyuan",
    "顺德学院站":"shundexueyuanzhan",
    "顺德一中":"shundeyizhong",
    "四会":"sihui",
    "松山湖北":"songshanhubei",
    "苏元":"suyuan",
    "太和":"taihe",
    "太平":"taiping",
    "潭村":"tancun",
    "潭洲会展":"tanzhouhuizhan",
    "坦尾":"tanwei",
    "汤村":"tangcun",
    "棠东":"tangdong",
    "棠下":"tangxia",
    "棠涌":"tangyong",
    "塘坑":"tangkeng",
    "淘金":"taojin",
    "体育西路":"tiyuxilu",
    "体育中心":"tiyuzhongxin",
    "体育中心南":"tiyuzhongxinnan",
    "天河公园":"tianhegongyuan",
    "天河客运站":"tianhekeyunzhan",
    "天河南":"tianhenan",
    "天河智慧城":"tianhezhihuicheng",
    "天河珠村":"tianhezhucun",
    "天平架":"tianpingjia",
    "亭岗":"tinggang",
    "同德":"tongde",
    "同福西":"tongfuxi",
    "同和":"tonghe",
    "同济路":"tongjilu",
    "团一大广场":"tuanyidaguangchang",
    "湾华":"wanhua",
    "万顷沙":"wanqingsha",
    "万胜围":"wanshengwei",
    "旺村":"wangcun",
    "望牛墩":"wangniudun",
    "文冲":"wenchong",
    "文翰湖公园（季华实验室）":"wenhanhugongyuanjihuashiyanshi",
    "文化公园":"wenhuagongyuan",
    "五凤":"wufeng",
    "五山":"wushan",
    "五羊邨":"wuyangcun",
    "西场":"xichang",
    "西村":"xicun",
    "西湖东":"xihudong",
    "西塱":"xilang",
    "西门口":"ximenkou",
    "西平西":"xipingxi",
    "西约":"xiyue",
    "西洲":"xizhou",
    "下中路":"xiazhonglu",
    "夏东":"xiadong",
    "夏港":"xiagang",
    "夏良":"xialiang",
    "夏西":"xiaxi",
    "夏园":"xiayuan",
    "仙涌":"xianyong",
    "暹岗":"xiangang",
    "贤江":"xianjiang",
    "贤江公园":"xianjianggongyuan",
    "贤江西":"xianjiangxi",
    "冼村":"xiancun",
    "线坑":"xiankeng",
    "香雪":"xiangxue",
    "香雪大道东":"xiangxuedadaodong",
    "香雪公园":"xiangxuegongyuan",
    "萧岗":"xiaogang",
    "小北":"xiaobei",
    "小金口":"xiaojinkou",
    "小坪":"xiaoping",
    "晓港":"xiaogang",
    "孝德东":"xiaodedong",
    "谢村":"xiecun",
    "新城东":"xinchengdong",
    "新丰路":"xinfenglu",
    "水西（有轨）":"shuixiyouguai",
    "新港东":"xingangdong",
    "新和":"xinhe",
    "新龙":"xinlong",
    "新南":"xinnan",
    "新沙":"xinsha",
    "新市墟":"xinshixu",
    "新塘":"xintang",
    "新塘南":"xintangnan",
    "新造":"xinzao",
    "兴业东路":"xingyedonglu",
    "浔峰岗":"xunfenggang",
    "浔峰岗北":"xunfenggangbei",
    "亚艺公园":"yayigongyuan",
    "燕岗":"yangang",
    "燕湖":"yanhu",
    "燕山":"yanshan",
    "燕塘":"yantang",
    "杨箕":"yangji",
    "杨箕东":"yangjidong",
    "一德路":"yidelu",
    "逸景路":"yijinglu",
    "银瓶":"yinping",
    "银盏":"yinzhan",
    "永宁北":"yongningbei",
    "永宁南":"yongningnan",
    "永泰":"yongtai",
    "鱼珠":"yuzhu",
    "玉器街":"yuqijie",
    "玉岩路":"yuyanlu",
    "裕丰围":"yufengwei",
    "员村":"yuancun",
    "员岗":"yuangang",
    "岳步":"yuebu",
    "越秀公园":"yuexiugongyuan",
    "云东海":"yundonghai",
    "云山":"yunshan",
    "云台花园":"yuntaihuayuan",
    "云霄路":"yunxiaolu",
    "增城广场":"zengchengguangchang",
    "张槎":"zhangcha",
    "樟木头东":"zhangmutoudong",
    "长安":"changan",
    "长安西":"changanxi",
    "长湴":"changban",
    "长岭居小学":"changlingjuxiaoxue",
    "长平":"changping",
    "长寿路":"changshoulu",
    "长洲":"changzhou",
    "肇庆":"zhaoqing",
    "镇安":"zhenan",
    "镇龙":"zhenlong",
    "镇龙北":"zhenlongbei",
    "镇龙西":"zhenlongxi",
    "知识城":"zhishicheng",
    "植物园":"zhiwuyuan",
    "智慧新城":"zhihuixincheng",
    "中大":"zhongda",
    "中大南门":"zhongdananmen",
    "中区":"zhongqu",
    "中山八":"zhongshanba",
    "中山公园":"zhongshangongyuan",
    "中堂":"zhongtang",
    "中新":"zhongxin",
    "中医药大学":"zhongyiyaodaxue",
    "钟村":"zhongcun",
    "钟岗":"zhonggang",
    "钟落潭":"zhongluotan",
    "钟落潭东":"zhongluotandong",
    "洲心":"zhouxin",
    "朱村":"zhucun",
    "珠江新城":"zhujiangxincheng",
    "竹料":"zhuliao",
    "梓元岗":"ziyuangang",
    "祖庙":"zumiao"
};

// 官方停运站（来源: https://iro-traa.gzmtr.com/traa.html 的 disabledStationNames）
const DISABLED_STATIONS = ['白云机场南'];

// 官方接口说明：weChat/schedule 已下线（返回400），官方页面现仅使用
// weChat/plan（智能规划，含纯城际直达 B_pure_intercity）、weChat/price、weChat/carriage
// 直达车次数据统一从 plan 结果中提取 B_pure_intercity 方案。



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
    // 运行环境检测（file:// 打开或无后端服务时给出提示）
    checkEnvironment();

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

// 运行环境检测：本应用依赖本地后端 server.js（/api 代理）。
// 直接用浏览器打开 index.html（file://）或部署在无代理的静态服务器上时，
// 实时车次查询、工单提交、设施页面都会不可用，这里给出明确提示。
function checkEnvironment() {
    const banner = document.getElementById('envWarning');
    if (!banner) return;
    const show = function (msg) {
        const text = banner.querySelector('.env-warning-text');
        if (text) text.textContent = msg;
        banner.style.display = 'flex';
    };

    // 文件方式打开：API 一定不可用
    if (location.protocol === 'file:') {
        show('当前以文件方式打开，实时车次查询与工单提交不可用。请运行 node server.js 后访问 http://localhost:8080');
        return;
    }

    // http/https 下探测后端是否在线（/api/ping 由 server.js 提供）
    fetch('/api/ping').then(function (r) {
        if (!r.ok) throw new Error('后端无响应');
        return r.json();
    }).then(function (j) {
        if (!j || j.ok !== true) throw new Error('后端响应异常');
    }).catch(function () {
        show('未检测到本地服务（/api 接口不可用），实时车次查询与工单提交将不可用');
    });
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

    // 车站设施页面加载数据列表
    if (page === 'facilities') {
        loadFacilityData();
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
// 地铁站点视图：line=按线路分类 | letter=按拼音首字母
let metroGroupMode = 'line';
// 当前筛选的地铁线路（空字符串=全部）
let metroLineFilter = '';

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
    metroLineFilter = '';
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

    var html = '';
    // 城际线路（放最前面）
    html += '<div class="line-section-label">城际线路</div>';
    html += Object.keys(STATION_LINES).map(function (line) {
        const active = line === currentStationLine ? ' active' : '';
        const color = LINE_COLORS[line] || '#999';
        return '<div class="line-item' + active + '" data-line="' + line + '" onclick="selectStationLine(\'' + line + '\')">' +
            '<span class="line-dot" style="background:' + color + ';"></span>' +
            '<span>' + line.replace('城际', '') + '</span>' +
            '</div>';
    }).join('');

    // 地铁/有轨电车线路（左侧直接点线路筛选，同官方 stations.html）
    var metroLines = window.METRO_LINE_STATIONS || [];
    if (metroLines.length) {
        html += '<div class="line-section-label">地铁·有轨线路</div>';
        html += metroLines.map(function (l) {
            const active = (currentStationLine === '地铁站点' && metroGroupMode === 'line' && metroLineFilter === l.name) ? ' active' : '';
            return '<div class="line-item' + active + '" data-metro="' + l.name + '" onclick="selectMetroLineFromSidebar(\'' + l.name + '\')">' +
                '<span class="line-dot" style="background:' + l.color + ';"></span>' +
                '<span>' + l.name + '</span>' +
                '</div>';
        }).join('');
    }

    container.innerHTML = html;
}

// 点击左侧线路，切换右侧站点
function selectStationLine(line) {
    currentStationLine = line;
    if (line === '地铁站点') metroLineFilter = '';
    renderStationLines();
    renderLineStations();
    scrollActiveLineIntoView(line);
}

// 滚动左侧栏，让当前选中项进入可视区
function scrollActiveLineIntoView(line) {
    var c = document.getElementById('stationLines');
    if (!c) return;
    var target = null;
    // 地铁线路项通过 data-line 标识
    var items = c.querySelectorAll('.line-item[data-line], .line-item[data-metro]');
    for (var i = 0; i < items.length; i++) {
        if (items[i].getAttribute('data-line') === line || items[i].getAttribute('data-metro') === line) {
            target = items[i];
            break;
        }
    }
    if (target) target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// 地铁站点视图：切换 按线路/按拼音
function setMetroGroupMode(mode) {
    metroGroupMode = mode;
    metroLineFilter = '';
    renderLineStations();
}

// 地铁站点视图：筛选某条线路（空=全部）
function selectMetroLine(name) {
    metroLineFilter = name;
    renderLineStations();
    var c = document.getElementById('stationStations');
    if (c) c.scrollTop = 0;
}

// 地铁站点视图：左侧栏点击某条线路直接筛选（并切回按线路模式）
function selectMetroLineFromSidebar(name) {
    currentStationLine = '地铁站点';
    metroGroupMode = 'line';
    metroLineFilter = name;
    renderStationLines();
    renderLineStations();
    var c = document.getElementById('stationStations');
    if (c) c.scrollTop = 0;
    scrollActiveLineIntoView(name);
}

// 站点行右侧的线路/换乘徽标
function metroLineBadge(station, currentLine) {
    const stLines = window.METRO_STATION_LINES || {};
    const hub = METRO_HUBS[station];
    let badge = '';
    if (hub) {
        badge = (hub.intercity && hub.intercity !== station) ? '换乘' + hub.intercity : '换乘城际';
    }
    const others = (stLines[station] || []).filter(function (n) { return n !== currentLine; });
    if (others.length > 0) {
        badge = (badge ? badge + ' · ' : '') + others.join('/');
    }
    return badge
        ? '<span style="font-size:11px;color:#888;margin-left:auto;white-space:nowrap;max-width:45%;overflow:hidden;text-overflow:ellipsis;">' + badge + '</span>'
        : '';
}

// 渲染右侧站点列表
function renderLineStations() {
    const container = document.getElementById('stationStations');
    if (!container) return;
    const keyword = document.getElementById('stationSearch').value.trim().toLowerCase();
    const pinIcon = window.ICONS
        ? window.ICONS.pin.replace('width="24" height="24"', 'width="16" height="16"')
        : '';

    const stationItem = function (s, extra) {
        const disabled = DISABLED_STATIONS.includes(s);
        // 转义站名中的单引号/反斜杠，防止破坏 onclick 字符串（如"区少年宫（萝岗）"等）
        const esc = String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return '<div class="station-item" style="' + (disabled ? 'opacity:0.45;cursor:not-allowed;' : '') + '" onclick="' + (disabled ? 'showToast(\'该站已停止对外服务，暂不可选\')' : 'selectStation(\'' + esc + '\')') + '">' +
            '<span class="station-item-icon">' + pinIcon + '</span>' +
            '<span>' + s + '</span>' +
            (disabled ? '<span style="font-size:10px;color:#C62828;margin-left:auto;white-space:nowrap;">停运</span>' : '') +
            (extra || '') +
            '</div>';
    };

    // 地铁换乘站分组（正常模式）
    if (currentStationLine === '地铁换乘站' && !keyword) {
        var hubNames = Object.keys(METRO_HUBS);
        container.innerHTML = '<div class="station-group-title">' +
            '<span class="line-dot" style="background:#1677ff;width:8px;height:8px;border-radius:50%;"></span>' +
            '地铁换乘站（' + hubNames.length + '站）</div>' +
            '<div style="font-size:11px;color:#999;padding:0 4px 8px;line-height:1.5;">地铁站出站换乘城际，例如 科韵路(5号线) 换乘城际</div>' +
            hubNames.map(function (s) {
                var hub = METRO_HUBS[s];
                var tip = hub ? '  → 换乘' + hub.intercity : '';
                return stationItem(s, '<span style="font-size:11px;color:#999;margin-left:auto;white-space:nowrap;">' + tip + '</span>');
            }).join('');
        return;
    }

    // 全部地铁站点分组（正常模式）：默认按线路分类，可切换按拼音
    if (currentStationLine === '地铁站点' && !keyword) {
        // 排除已展示的城际站与枢纽站，避免重复
        var already = {};
        Object.values(STATION_LINES).forEach(function (list) {
            list.forEach(function (s) { already[s] = true; });
        });
        Object.keys(METRO_HUBS).forEach(function (s) { already[s] = true; });
        var metroOnly = Object.keys(ALL_OFFICIAL_STATIONS).filter(function (s) {
            if (already[s]) return false;
            if (DISABLED_STATIONS.includes(s)) return false;
            return true;
        }).sort(function (a, b) {
            var pa = ALL_OFFICIAL_STATIONS[a] || '';
            var pb = ALL_OFFICIAL_STATIONS[b] || '';
            return (pa + a).localeCompare(pb + b);
        });

        var lines = window.METRO_LINE_STATIONS || [];

        // 模式切换按钮
        var toggle = '<div class="metro-mode-toggle">' +
            '<span class="metro-mode-btn' + (metroGroupMode === 'line' ? ' active' : '') + '" onclick="setMetroGroupMode(\'line\')">按线路</span>' +
            '<span class="metro-mode-btn' + (metroGroupMode === 'letter' ? ' active' : '') + '" onclick="setMetroGroupMode(\'letter\')">按拼音</span>' +
            '</div>';

        if (metroGroupMode === 'line') {
            // ---- 按线路分类（默认） ----
            var chip = function (name, color) {
                var active = metroLineFilter === name ? ' active' : '';
                return '<span class="line-chip' + active + '" onclick="selectMetroLine(\'' + name + '\')">' +
                    '<span class="line-dot" style="background:' + color + ';width:8px;height:8px;border-radius:50%;"></span>' +
                    name + '</span>';
            };
            // 城际线路 chips（放前面，点击切到对应城际线路视图）
            var intercityChips = Object.keys(STATION_LINES).map(function (line) {
                var active = currentStationLine === line ? ' active' : '';
                var color = LINE_COLORS[line] || '#607D8B';
                return '<span class="line-chip' + active + '" onclick="selectStationLine(\'' + line + '\')">' +
                    '<span class="line-dot" style="background:' + color + ';width:8px;height:8px;border-radius:50%;"></span>' +
                    line.replace('城际', '') + '</span>';
            }).join('');
            // 地铁/有轨线路 chips
            var metroChips = lines.map(function (l) { return chip(l.name, l.color); }).join('');
            var nav = '<div class="station-line-nav">' +
                '<span class="line-chip' + (metroLineFilter === '' ? ' active' : '') + '" onclick="selectMetroLine(\'\')">全部</span>' +
                intercityChips + metroChips +
                '</div>';

            var lineTitle = function (l) {
                return '<div id="stationLine-' + l.name + '"><div class="station-group-title">' +
                    '<span class="line-dot" style="background:' + l.color + ';width:8px;height:8px;border-radius:50%;"></span>' +
                    l.name + '（' + l.stations.length + '站）</div>' +
                    l.stations.map(function (s) { return stationItem(s, metroLineBadge(s, l.name)); }).join('') +
                    '</div>';
            };

            var listHtml = '';
            if (metroLineFilter) {
                var lf = null;
                lines.forEach(function (l) { if (l.name === metroLineFilter) lf = l; });
                if (lf) listHtml = lineTitle(lf);
            } else {
                listHtml = lines.map(lineTitle).join('');
            }

            container.innerHTML = '<div style="font-size:12px;color:var(--text-light);padding:2px 4px 6px;">地铁/有轨电车线路站点（' + lines.length + '条线路，点击线路快速筛选）</div>' +
                toggle + nav + listHtml;
            return;
        }

        // ---- 按拼音首字母分组 ----
        var groups = {};
        metroOnly.forEach(function (s) {
            var py = ALL_OFFICIAL_STATIONS[s] || '';
            var letter = (py.charAt(0) || 'A').toUpperCase();
            if (!/[A-Z]/.test(letter)) letter = 'A';
            if (!groups[letter]) groups[letter] = [];
            groups[letter].push(s);
        });
        var letters = Object.keys(groups).sort();

        // 字母导航条
        var nav = '<div class="station-letter-nav">' +
            letters.map(function (L) {
                return '<span class="letter-btn" onclick="scrollToStationLetter(\'' + L + '\')">' + L + '</span>';
            }).join('') +
            '</div>';

        var listHtml = letters.map(function (L) {
            return '<div id="stationLetter-' + L + '"><div class="station-group-title">' +
                '<span class="line-dot" style="background:#607D8B;width:8px;height:8px;border-radius:50%;"></span>' +
                L + '（' + groups[L].length + '站）</div>' +
                groups[L].map(function (s) { return stationItem(s); }).join('') +
                '</div>';
        }).join('');

        container.innerHTML = '<div style="font-size:12px;color:var(--text-light);padding:2px 4px 6px;">全部地铁站点（' + metroOnly.length + '站，点击字母快速跳转）</div>' +
            toggle + nav + listHtml;
        return;
    }

    // 搜索模式：显示所有匹配分组（含地铁换乘站）
    if (keyword) {
        let html = '';
        let total = 0;
        const hubMatched = Object.keys(METRO_HUBS).filter(function (s) {
            return s.toLowerCase().includes(keyword) || (METRO_HUBS[s].intercity || '').includes(keyword);
        });
        if (hubMatched.length > 0) {
            total += hubMatched.length;
            html += '<div class="station-group-title">' +
                '<span class="line-dot" style="background:#1677ff;width:8px;height:8px;border-radius:50%;"></span>' +
                '地铁换乘站（' + hubMatched.length + '站）</div>' +
                hubMatched.map(function (s) { return stationItem(s); }).join('');
        }
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
                matched.map(function (s) { return stationItem(s); }).join('');
        });

        // 官方全量站点（含地铁站/有轨站，plan 接口均支持）：搜索中命中即展示
        // 支持中文关键字与拼音（如 tyxl → 体育西路）
        const officialMatched = Object.keys(ALL_OFFICIAL_STATIONS).filter(function (s) {
            if (DISABLED_STATIONS.includes(s)) return false;
            const py = ALL_OFFICIAL_STATIONS[s] || '';
            return s.toLowerCase().includes(keyword) || py.toLowerCase().includes(keyword);
        });
        // 排除已在上方城际线路/枢纽中展示的站，避免重复
        const alreadyShown = new Set();
        Object.values(STATION_LINES).forEach(function (list) {
            list.forEach(function (s) { alreadyShown.add(s); });
        });
        Object.keys(METRO_HUBS).forEach(function (s) { alreadyShown.add(s); });
        const newMatched = officialMatched.filter(function (s) { return !alreadyShown.has(s); });
        if (newMatched.length > 0) {
            total += newMatched.length;
            html += '<div class="station-group-title">' +
                '<span class="line-dot" style="background:#607D8B;width:8px;height:8px;border-radius:50%;"></span>' +
                '地铁站点（' + newMatched.length + '站）</div>' +
                newMatched.map(function (s) { return stationItem(s, metroLineBadge(s, '')); }).join('');
        }

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
        stations.map(function (s) { return stationItem(s); }).join('');
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

// 滚动到站点列表中的字母分组（地铁站点视图）
function scrollToStationLetter(letter) {
    const el = document.getElementById('stationLetter-' + letter);
    const container = document.getElementById('stationStations');
    if (el && container) {
        // 用容器滚动定位到该分组
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
    if (DISABLED_STATIONS.includes(from) || DISABLED_STATIONS.includes(to)) {
        showToast('该站已停止对外服务，请重新选择站点');
        return;
    }
    // 同枢纽站检查（与官方一致）：如 广州南站 ↔ 番禺 实为同一站
    if (isSameHubStation(from, to)) {
        showToast('两站相距较近，请步行前往。');
        return;
    }

    // 防抖：2 秒内忽略重复点击，避免连点打爆官方接口限流
    const now = Date.now();
    if (searchTrains._lastClick && now - searchTrains._lastClick < 2000) {
        return;
    }
    searchTrains._lastClick = now;

    const results = document.getElementById('travelResults');

    // 统一使用官方智能规划接口（plan）：
    // - B_pure_intercity 方案 = 纯城际直达车次（含车次号/站台/票价）
    // - A_pure_metro / C_metro_intercity = 地铁/混合换乘方案
    results.innerHTML = '<div style="text-align:center;padding:30px;color:#999;"><div class="loading-spinner" style="margin:0 auto 12px;"></div><p>正在查询官方时刻与路线规划...</p></div>';

    fetchOfficialPlans(from, to, date).then(function (plans) {
        if (plans && plans.__unavailable) {
            // 官方数据服务暂时不可用（限流/维护）
            results.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.alert : '') + '</div>' +
                '<div class="empty-text">官方数据服务暂时繁忙<br><span style="font-size:12px;color:#ccc;">请稍等片刻后重试</span></div>' +
                '</div>';
            return;
        }
        if (!plans || plans.length === 0) {
            results.innerHTML = '<div class="empty-state">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.search : '') + '</div>' +
                '<div class="empty-text">未查询到相关车次信息<br><span style="font-size:12px;color:#ccc;">请尝试更换站点或日期</span></div>' +
                '</div>';
            return;
        }

        // 提取纯城际直达方案（无换乘的 intercity 单段）
        const directPlans = plans.filter(function (p) {
            return p.route_type === 'B_pure_intercity' && (p.transfer_total || 0) === 0 &&
                p.segments && p.segments.length === 1 && p.segments[0].type === 'intercity';
        });

        if (directPlans.length > 0) {
            // 直达车次 → 转换为既有直达视图数据结构（推荐车次/全部时刻 tab）
            lastTrainData = directPlans.map(function (p) {
                const seg = p.segments[0];
                const det = seg.intercity_detail || {};
                const depMin = timeToMinutes(seg.departure), arrMin = timeToMinutes(seg.arrival);
                const durMin = (depMin >= 0 && arrMin >= 0) ? (arrMin - depMin) : 0;
                return {
                    cc: det.train_number || '',
                    startStation: seg.from,
                    endStation: seg.to,
                    depTime: seg.departure,
                    arrTime: seg.arrival,
                    fareYuan: det.fare_yuan || seg.intercity_yuan || 0,
                    originPlatform: det.origin_platform || '',
                    destPlatform: det.dest_platform || '',
                    travelTimeFormatted: (durMin > 0 ? (Math.floor(durMin / 60) > 0 ? Math.floor(durMin / 60) + '时' : '') + (durMin % 60) + '分' : ''),
                    stationDetails: [
                        { stationName: seg.from, boardTime: seg.departure, alightTime: '' },
                        { stationName: seg.to, boardTime: '', alightTime: seg.arrival }
                    ]
                };
            });
            lastQuery = { from: from, to: to, date: date };
            renderTrainView();
            // 追加展示官方智能换乘方案（含地铁），直达结果在上方
            renderPlanResults(plans, from, to, date, results, true);
        } else {
            // 无直达：直接渲染官方智能换乘方案
            lastTrainData = null;
            lastQuery = null;
            renderPlanResults(plans, from, to, date, results, false);
        }
    }).catch(function () {
        results.innerHTML = '<div class="empty-state">' +
            '<div class="empty-icon">' + (window.ICONS ? window.ICONS.search : '') + '</div>' +
            '<div class="empty-text">查询服务暂不可用<br><span style="font-size:12px;color:#ccc;">请稍后重试</span></div>' +
            '</div>';
    });
}

// 同枢纽检查（与官方 isSameHubStation 一致）：地铁站与其对应城际站视为同一站
// 如 广州南站 ↔ 番禺、新塘 ↔ 新塘南、北滘西站 ↔ 北滘西
function isSameHubStation(stationA, stationB) {
    if (stationA === stationB) return true;
    const metroToIntercity = {};
    const intercityToMetros = {};
    Object.keys(METRO_HUBS).forEach(function (metro) {
        const intercity = METRO_HUBS[metro].intercity;
        metroToIntercity[metro] = intercity;
        if (!intercityToMetros[intercity]) intercityToMetros[intercity] = [];
        intercityToMetros[intercity].push(metro);
    });
    const getGroupKey = function (station) {
        if (metroToIntercity[station]) return metroToIntercity[station];
        if (intercityToMetros[station]) return station;
        return null;
    };
    const groupA = getGroupKey(stationA);
    const groupB = getGroupKey(stationB);
    if (groupA && groupB && groupA === groupB) return true;
    return false;
}

// 调用官方智能路线规划 API（地铁+城际混合，经本地代理）
async function fetchOfficialPlans(from, to, date) {
    // 当天查询用当前时间，其他日期用 06:00（与官方页面逻辑一致）
    const isToday = date === getTodayStr();
    let time = '06:00';
    if (isToday) {
        const now = new Date();
        time = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    }
    const url = '/api/plan?origin=' + encodeURIComponent(from) +
        '&destination=' + encodeURIComponent(to) +
        '&departure_time=' + encodeURIComponent(time) +
        '&date=' + date.replace(/-/g, '') +
        '&top_n=15';
    let results = await requestOfficialPlans(url);

    // 当天查询无结果时（如深夜已过末班车），用 06:00 再查一次全天方案
    if ((!results || results.length === 0) && isToday && time !== '06:00') {
        const retryUrl = url.replace(/departure_time=[^&]+/, 'departure_time=06%3A00');
        results = await requestOfficialPlans(retryUrl);
    }
    return results || [];
}

// 请求官方 plan 接口并解析结果（内部辅助）
async function requestOfficialPlans(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    if (json && json.code === 200 && json.data && Array.isArray(json.data.results)) {
        return filterOfficialPlans(json.data.results);
    }
    if (json && json.code === 200 && json.data === null) {
        // 官方接口暂时无数据（限流/维护）：空数组 + 标记，界面提示"服务繁忙"
        const none = [];
        none.__unavailable = true;
        return none;
    }
    return [];
}

// 与官方页面一致的结果过滤：
// 1) 含未知线路/未知车次的方案剔除
// 2) 混合方案（C_metro_intercity / D_intercity_metro）耗时 > 同类型最短方案 2 倍的剔除
function filterOfficialPlans(results) {
    let filtered = results.filter(function (r) { return !hasUnknownSegment(r); });
    const mixedTypes = ['C_metro_intercity', 'D_intercity_metro'];
    const mixedRoutes = filtered.filter(function (r) { return mixedTypes.indexOf(r.route_type) !== -1; });
    if (mixedRoutes.length > 0) {
        const groups = {};
        mixedRoutes.forEach(function (r) {
            const type = r.route_type;
            if (!groups[type]) groups[type] = [];
            groups[type].push(r);
        });
        const minTimes = {};
        Object.keys(groups).forEach(function (type) {
            const times = groups[type].map(function (r) { return r.total_time_min || 0; }).filter(function (t) { return t > 0; });
            minTimes[type] = times.length > 0 ? Math.min.apply(null, times) : 0;
        });
        filtered = filtered.filter(function (r) {
            if (mixedTypes.indexOf(r.route_type) === -1) return true;
            const minTime = minTimes[r.route_type];
            if (minTime === undefined || minTime === 0) return true;
            return (r.total_time_min || 0) <= 2 * minTime;
        });
    }
    return filtered;
}

// 判断方案是否包含未知线路/未知车次段（与官方 hasUnknownSegment 一致）
function hasUnknownSegment(route) {
    const segs = route.segments || [];
    for (const seg of segs) {
        if (seg.type === 'metro') {
            if (!seg.metro_lines || seg.metro_lines.length === 0) return true;
            for (const line of seg.metro_lines) {
                const lineName = line.line_name || '';
                if (lineName === '未知线路' || lineName === '未知' || lineName.indexOf('未知') !== -1) return true;
            }
        } else if (seg.type === 'intercity') {
            const trainNum = seg.train_number || (seg.intercity_detail && seg.intercity_detail.train_number) || '';
            if (trainNum === '未知' || trainNum.indexOf('未知') !== -1) return true;
        }
    }
    return false;
}

// 站点显示名（地铁机场站显示为 T1/T2/T3）
function displayStationName(name) {
    if (!name) return name;
    return METRO_DISPLAY[name] || name;
}

// 地铁线路官方配色 [背景色, 文字色]（来自官方 traa-metro.html 样式表）
const METRO_LINE_COLORS = {
    '1号线': ['#F5A100', '#6B3E00'], '2号线': ['#00629B', '#FFFFFF'], '3号线': ['#F68E1F', '#4C2C00'],
    '4号线': ['#00843D', '#FFFFFF'], '5号线': ['#C41E3A', '#FFFFFF'], '6号线': ['#8A2C78', '#FFFFFF'],
    '7号线': ['#9ECB54', '#3D5C00'], '8号线': ['#009C91', '#FFFFFF'], '9号线': ['#69C49A', '#1F4D35'],
    '10号线': ['#E56521', '#FFFFFF'], '11号线': ['#CF7F32', '#FFFFFF'], '12号线': ['#1F9BAF', '#FFFFFF'],
    '13号线': ['#6B8E23', '#FFFFFF'], '14号线': ['#964F2E', '#FFFFFF'], '18号线': ['#3FA9F5', '#003366'],
    '21号线': ['#2E99CF', '#FFFFFF'], '22号线': ['#D95C27', '#FFFFFF'], 'APM线': ['#00A3E0', '#003366'],
    '广佛线': ['#C9DD5A', '#3D4A00'], '佛山2号线': ['#DC8878', '#FFFFFF'], '佛山3号线': ['#0A6EB4', '#FFFFFF']
};

// 地铁线路标签（彩色圆角块）
function metroLineTag(lineName) {
    const c = METRO_LINE_COLORS[lineName] || ['#1677ff', '#FFFFFF'];
    return '<span style="display:inline-block;background:' + c[0] + ';color:' + c[1] +
        ';font-size:11px;font-weight:600;padding:2px 8px;border-radius:8px;margin:2px 4px 2px 0;white-space:nowrap;">' +
        escapeHtml(lineName) + '</span>';
}

// 城际标签
function intercityTag(text) {
    return '<span style="display:inline-block;background:#3a4b9b;color:#fff;font-size:11px;font-weight:600;padding:2px 8px;border-radius:8px;margin:2px 4px 2px 0;white-space:nowrap;">🚄 ' + escapeHtml(text) + '</span>';
}

// 解析官方城际换乘详情，格式如: "0947(5) 广州莲花山 1009(5) [F0]"
// 含义: 09:47到达(5站台) 广州莲花山站 10:09发车(5站台)
function parseTransferDetail(str) {
    if (!str || str === '直达') return null;
    const m = String(str).match(/(\d{2})(\d{2})\((\d+)\)\s*([^\s\d][^\s]*?)\s*(\d{2})(\d{2})\((\d+)\)/);
    if (m) {
        return {
            arrive: m[1] + ':' + m[2],
            arrivePlatform: m[3],
            station: m[4],
            depart: m[5] + ':' + m[6],
            departPlatform: m[7]
        };
    }
    return null;
}

// 拆分城际组合车次段（如 "S4793 -> S4833" 一次换乘两列车、 "C4866 -> C4841 -> C4979" 两次换乘三列车）
// 依据 train_number 按 "->" 拆分列车，transfer_detail 按 "->" 拆分换乘点，逐趟还原起止与时间。
// 拆分成功返回 {legs: 子段数组, stops: 换乘点数组}；无法拆分返回 null。
function splitIntercitySegments(seg) {
    const det = seg.intercity_detail || {};
    const trainList = (det.train_number || '').split('->').map(function (t) { return t.trim(); }).filter(Boolean);
    if (trainList.length <= 1) return null;
    const stops = (det.transfer_detail || '').split('->').map(function (p) {
        return parseTransferDetail(p.trim());
    }).filter(Boolean);
    if (stops.length !== trainList.length - 1) return null; // 数量不匹配则保持原样

    const legs = [];
    trainList.forEach(function (tn, i) {
        legs.push({
            train: tn,
            from: i === 0 ? seg.from : stops[i - 1].station,
            to: i === trainList.length - 1 ? seg.to : stops[i].station,
            dep: i === 0 ? seg.departure : stops[i - 1].depart,
            arr: i === trainList.length - 1 ? seg.arrival : stops[i].arrive,
            depPlat: i === 0 ? det.origin_platform : stops[i - 1].departPlatform,
            arrPlat: i === trainList.length - 1 ? det.dest_platform : stops[i].arrivePlatform
        });
    });
    return { legs: legs, stops: stops };
}

// 渲染官方智能路线规划结果（地铁+城际混合方案，参考官方页面排版）
function renderPlanResults(plans, from, to, date, container, hasDirect) {
    if (!plans || plans.length === 0) return;

    // 与官方默认排序一致：到达最早优先（sortBy: 'arrival'）
    const sortedPlans = plans.slice().sort(function (a, b) {
        const aSegs = a.segments || [], bSegs = b.segments || [];
        const aArr = aSegs.length ? (aSegs[aSegs.length - 1].arrival || '99:99') : '99:99';
        const bArr = bSegs.length ? (bSegs[bSegs.length - 1].arrival || '99:99') : '99:99';
        if (aArr !== bArr) return aArr.localeCompare(bArr);
        // 同时段比总耗时
        return (a.total_time_min || 0) - (b.total_time_min || 0);
    });

    var html = '<div style="margin-top:' + (hasDirect ? '24' : '0') + 'px;">';
    html += '<div style="padding:8px 0 4px;font-size:14px;font-weight:600;color:var(--text-secondary);">' +
        getDateDisplay(date) + ' ' + displayStationName(from) + ' → ' + displayStationName(to) +
        ' 智能换乘方案（官方规划，共' + plans.length + '种）</div>';
    if (hasDirect) {
        html += '<div style="padding:2px 0 8px;font-size:12px;color:#999;">以下为官方地铁+城际智能规划方案，含候车时间，可与上方直达车次互为补充</div>';
    }

    sortedPlans.forEach(function (route, idx) {
        var segs = route.segments || [];
        // 总票价（城际 + 地铁分段合计）
        var totalFare = 0;
        segs.forEach(function (s) { totalFare += (s.intercity_yuan || s.fare_yuan || 0); });
        var firstDep = segs.length ? (segs[0].departure || '--:--') : '--:--';
        var firstFrom = segs.length ? (segs[0].from || '') : '';
        var lastArr = segs.length ? (segs[segs.length - 1].arrival || '--:--') : '--:--';
        var lastTo = segs.length ? (segs[segs.length - 1].to || '') : '';
        var isRec = idx === 0;

        html += '<div class="result-card" style="border-left:3px solid ' + (isRec ? 'var(--primary)' : 'var(--secondary)') + ';">';

        // 描述行
        html += '<div style="font-size:11px;' + (isRec ? 'color:var(--primary);' : 'color:#999;') + 'margin-bottom:8px;">' +
            (isRec ? '<span style="background:var(--primary);color:#fff;padding:1px 8px;border-radius:8px;font-weight:600;">推荐</span> ' : '') +
            escapeHtml(route.description || '') + '</div>';

        // 线路标签行（地铁各线彩色标签 + 城际标签）
        var lineTags = '';
        segs.forEach(function (s) {
            if (s.type === 'metro') {
                (s.metro_lines || []).forEach(function (l) { lineTags += metroLineTag(l.line_name); });
            } else if (s.type === 'intercity') {
                var det = s.intercity_detail || {};
                lineTags += intercityTag((det.train_number || '城际').replace(/->/g, '→'));
            }
        });
        if (lineTags) {
            html += '<div style="margin-bottom:10px;">' + lineTags + '</div>';
        }

        // 时间行（复用直达车次卡片样式）
        html += '<div class="time-info">' +
            '<div class="time-station">' +
            '<div class="time">' + firstDep + '</div>' +
            '<div class="station">' + displayStationName(firstFrom) + '</div>' +
            '</div>' +
            '<div class="time-duration">' +
            '<div class="duration">' + (route.total_time_hm || (route.total_time_min || '') + '分钟') + '</div>' +
            '<div class="train-line"></div>' +
            '</div>' +
            '<div class="time-station">' +
            '<div class="time">' + lastArr + '</div>' +
            '<div class="station">' + displayStationName(lastTo) + '</div>' +
            '</div>' +
            '</div>';

        // 换乘/票价信息行
        html += '<div style="display:flex;justify-content:center;gap:14px;font-size:12px;color:var(--text-light);margin-bottom:10px;">' +
            '<span>换乘 ' + (route.transfer_total || 0) + ' 次</span>' +
            (totalFare > 0 ? '<span style="color:#E65100;font-weight:600;">总票价 ¥' + totalFare + '</span>' : '') +
            '</div>';

        // 分段明细
        segs.forEach(function (s, i) {
            var segFare = (s.intercity_yuan || s.fare_yuan || 0);
            var tag;
            var transferNote = '';
            var subLegsHtml = '';
            if (s.type === 'intercity') {
                var det = s.intercity_detail || {};
                var split = splitIntercitySegments(s);
                if (split) {
                    // 组合车次（多趟车多次换乘）：逐趟拆成独立卡片
                    subLegsHtml = split.legs.map(function (leg, li) {
                        var legHtml = '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#F5F8FF;border-radius:8px;margin-bottom:3px;font-size:13px;flex-wrap:wrap;">' +
                            '<span style="display:flex;align-items:center;flex-wrap:wrap;flex:1;min-width:120px;">' + intercityTag(leg.train) + '</span>' +
                            '<span style="white-space:nowrap;">' + displayStationName(leg.from) + ' ' + (leg.dep || '') +
                            ' <span style="color:#1677ff;font-weight:600;">→</span> ' + displayStationName(leg.to) + ' ' + (leg.arr || '') + '</span>' +
                            (leg.arrPlat ? '<span style="font-size:10px;color:#3a4b9b;white-space:nowrap;">' + leg.arrPlat + '站台</span>' : '') +
                            '</div>';
                        if (li < split.legs.length - 1) {
                            var st = split.stops[li];
                            legHtml += '<div style="font-size:11px;color:#B26A00;margin:4px 0;padding:5px 10px;background:#FFF8E1;border-radius:6px;text-align:center;">' +
                                '🔄 <strong>' + escapeHtml(st.station) + '</strong> 站内换乘：' + st.arrive + ' 到达（' + st.arrivePlatform + '站台）→ ' + st.depart + ' 发车（' + st.departPlatform + '站台）' +
                                '</div>';
                        }
                        return legHtml;
                    }).join('');
                    if (segFare > 0) {
                        subLegsHtml += '<div style="font-size:11px;color:#999;text-align:right;padding:2px 4px 0;">该城际段合计 ¥' + segFare + '</div>';
                    }
                } else {
                    // 单趟车：原样展示
                    var trainNo = (det.train_number || '城际').replace(/->/g, '→');
                    tag = intercityTag(trainNo);
                    if (det.origin_platform) tag += '<span style="font-size:10px;color:#3a4b9b;margin-left:2px;">' + det.origin_platform + '站台</span>';
                }
            } else if (s.type === 'metro') {
                var lines = (s.metro_lines || []).map(function (l) { return l.line_name; });
                tag = lines.map(metroLineTag).join('');
                if (!tag) tag = '<span style="color:#1677ff;font-size:11px;">地铁</span>';
            } else {
                tag = '<span style="font-size:11px;color:#999;">' + (s.type === 'walk' ? '步行' : escapeHtml(s.type || '其他')) + '</span>';
            }

            if (tag) {
                html += '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:' + (s.type === 'intercity' ? '#F5F8FF' : (s.type === 'metro' ? '#F4F9FF' : '#F8F9FA')) + ';border-radius:8px;margin-bottom:3px;font-size:13px;flex-wrap:wrap;">' +
                    '<span style="display:flex;align-items:center;flex-wrap:wrap;flex:1;min-width:120px;">' + tag + '</span>' +
                    '<span style="text-align:right;white-space:nowrap;">' + displayStationName(s.from) + ' ' + (s.departure || '') +
                    ' <span style="color:#1677ff;font-weight:600;">→</span> ' + displayStationName(s.to) + ' ' + (s.arrival || '') + '</span>' +
                    (segFare > 0 ? '<span style="color:#E65100;font-size:12px;white-space:nowrap;">¥' + segFare + '</span>' : '') +
                    '</div>';
            }
            if (transferNote) html += transferNote;
            if (subLegsHtml) html += subLegsHtml;

            // 段间换乘提示
            if (i < segs.length - 1) {
                var via = s.to || '';
                var walk = '';
                var hub = METRO_HUBS[via];
                if (hub && hub.intercity && hub.intercity !== via) walk = '（换乘城际' + hub.intercity + '）';
                html += '<div style="font-size:11px;color:#E65100;margin:4px 0;text-align:center;">↓ 换乘 ' + displayStationName(via) + walk + ' ↓</div>';
            }
        });

        html += '<div style="font-size:11px;color:#999;margin-top:6px;padding-top:6px;border-top:1px dashed #eee;">数据来源：官方智能路线规划，含候车时间，票价仅供参考，请以车站公告为准</div>';
        html += '</div>';
    });

    html += '</div>';
    // 有直达结果时追加到直达列表下方；无直达时整体覆盖（替换 loading 文案）
    if (hasDirect) {
        container.innerHTML += html;
    } else {
        container.innerHTML = html;
    }
}

// 将 "HH:MM" 格式时间转为分钟数用于比较
function timeToMinutes(t) {
    if (!t || t === '--') return -1;
    const p = t.split(':');
    return parseInt(p[0]) * 60 + parseInt(p[1]);
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
        const fare = train.fareYuan > 0 ? '<span style="color:#E65100;">¥' + train.fareYuan + '</span>' : '';

        return '<div class="result-card" style="' + (isPast ? 'opacity:0.5;' : '') + '">' +
            '<div class="train-info">' +
            '<span class="train-number">' + (train.cc || train.trainNumber || '') + '</span>' +
            '<span class="train-type">' + (train.startStation === from ? '始发' : '过路') + ' · ' + (train.endStation === to ? '终到' : '过路') + '</span>' +
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
            (train.originPlatform || train.destPlatform ? '<span>' + (train.originPlatform || '?') + '站台 → ' + (train.destPlatform || '?') + '站台</span>' : '') +
            (fare ? '<span>' + fare + '</span>' : '') +
            '<span>' + (isPast ? '已过点' : '可乘坐') + '</span>' +
            '</div>' +
            '</div>';
    });

    var headerText = getDateDisplay(date) + ' ' + from + ' → ' + to + ' 共 ' + sorted.length + ' 个车次（实时数据）';
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
            '<td>' + (train.fareYuan > 0 ? '<span style="color:#E65100;">¥' + train.fareYuan + '</span>' : '-') + '</td>' +
            '<td><span style="color:#2E7D32;">正常</span></td>' +
            '</tr>';
    }).join('');
    // 已出发车次（灰色）
    if (departed.length > 0) {
        rows += '<tr style="background:#F5F5F5;"><td colspan="7" style="text-align:center;color:#999;font-size:12px;padding:10px;">— 以下车次已过点 —</td></tr>';
        rows += departed.map(function (train) {
            const depTime = getTrainTime(train, from);
            const arrTime = getTrainTime(train, to);
            return '<tr style="opacity:0.5;background:#FAFAFA;">' +
                '<td><strong>' + (train.cc || '') + '</strong></td>' +
                '<td>' + from + '</td>' +
                '<td>' + to + '</td>' +
                '<td>' + depTime + '</td>' +
                '<td>' + arrTime + '</td>' +
                '<td>' + (train.fareYuan > 0 ? '<span style="color:#E65100;">¥' + train.fareYuan + '</span>' : '-') + '</td>' +
                '<td><span style="color:#999;">已过点</span></td>' +
                '</tr>';
        }).join('');
    }

    results.innerHTML = '<div class="schedule-table-wrap" style="margin:0;">' +
        '<div style="padding:14px 16px;font-size:14px;font-weight:600;color:var(--text-primary);border-bottom:1px solid var(--border);">' +
        getDateDisplay(date) + ' ' + from + ' → ' + to + ' 共 ' + sorted.length + ' 个车次（实时数据）' +
        (departed.length > 0 ? '<br><span style="font-size:12px;font-weight:400;color:#999;">其中 ' + departed.length + ' 个车次已过点</span>' : '') +
        '</div>' +
        '<div style="overflow-x:auto;">' +
        '<table class="schedule-table">' +
        '<thead><tr><th>车次</th><th>出发站</th><th>到达站</th><th>出发时间</th><th>到达时间</th><th>票价</th><th>状态</th></tr></thead>' +
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
        showToast('提交失败：未检测到本地服务，请通过 node server.js 启动后访问');
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
        showToast('提交失败：未检测到本地服务，请通过 node server.js 启动后访问');
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
    { name: '棕色钱包', detail: '棕色真皮驾驶证夹，内含驾驶证、行驶证', line: '广肇城际', place: '肇庆站', date: '2026-07-26', status: '已认领' },
    { name: 'iPhone 14手机', detail: '深紫色iPhone 14，屏幕有裂纹，带透明手机壳', line: '广惠城际', place: '惠州北站', date: '2026-07-29', status: '待认领' },
    { name: '儿童水壶', detail: '粉色独角兽造型保温水壶，500ml容量', line: '广清城际', place: '花都站候车室', date: '2026-07-31', status: '待认领' },
    { name: '身份证', detail: '居民身份证，姓名已隐去，签发机关广州市公安局', line: '广州东环城际', place: '白云机场北站', date: '2026-07-25', status: '已认领' },
    { name: '移动电源', detail: '小米移动电源3，20000mAh，黑色，外观有明显使用痕迹', line: '穗深城际', place: '琶洲站', date: '2026-07-28', status: '待认领' },
    { name: '钥匙串', detail: '5把钥匙，配有灰色皮质钥匙扣和一个门禁卡套', line: '广肇城际', place: '佛山西站', date: '2026-07-27', status: '待认领' },
    { name: '眼镜盒', detail: '深蓝色硬质眼镜盒，内含一副金属框眼镜', line: '广惠城际', place: '惠州北站', date: '2026-07-30', status: '待认领' },
    { name: '购物袋', detail: '优衣格纹购物袋，内含衣物若干和一双运动鞋', line: '广清城际', place: '清城站站台', date: '2026-07-26', status: '待认领' },
    { name: 'Switch游戏机', detail: '红蓝款Switch主机，配Joy-Con手柄，有贴膜', line: '广州东环城际', place: '广州白云站安检处', date: '2026-07-29', status: '待认领' },
    { name: '护照', detail: '中国护照一本，有效期至2029年', line: '穗深城际', place: '深圳机场站', date: '2026-07-24', status: '已认领' },
    { name: '文件袋', detail: 'A4透明文件袋，内含合同文件和一张名片', line: '广肇城际', place: '肇庆站', date: '2026-07-31', status: '待认领' },
    { name: '无线鼠标', detail: '罗技M590无线静音鼠标，银灰色', line: '广惠城际', place: '小金口站', date: '2026-07-28', status: '待认领' },
    { name: '蓝牙耳机', detail: 'OPPO Enco X2耳机，白色充电盒，支持降噪', line: '广清城际', place: '花都站出站口', date: '2026-07-27', status: '待认领' },
    { name: '保温杯', detail: '黑色象印保温杯，500ml，底部有贴纸', line: '广州东环城际', place: '花城街站', date: '2026-07-30', status: '待认领' },
    { name: '会员卡袋', detail: '黑色皮质卡包，内含多张会员卡和积分卡', line: '穗深城际', place: '中堂站', date: '2026-07-26', status: '待认领' },
    { name: '数据线', detail: '苹果Lightning数据线，白色，约1.5米长', line: '广肇城际', place: '佛山西站候车室', date: '2026-07-25', status: '已认领' },
    { name: '相机SD卡', detail: 'SanDisk 64GB SD存储卡，用于数码相机', line: '广惠城际', place: '西湖东站', date: '2026-07-29', status: '待认领' },
    { name: '手环', detail: '小米手环8，黑色腕带，屏幕有划痕', line: '广清城际', place: '清城站安检机', date: '2026-07-24', status: '待认领' }
];

// 页面加载时自动展示失物招领数据
// 失物招领分页状态
let lostPage = 1;
let lostDataMode = 'official'; // official: 官方数据 | sample: 示例数据兜底

// 查询失物招领（优先官方数据，失败时回退示例数据）
async function searchLost() {
    const keyword = document.getElementById('lostKeyword').value.trim().toLowerCase();
    const line = document.getElementById('lostLine').value;
    const container = document.getElementById('lostList');

    container.innerHTML = '<div style="text-align:center;padding:30px;color:#999;"><div class="loading-spinner" style="margin:0 auto 12px;"></div><p>正在查询官方失物招领...</p></div>';

    try {
        // 官方系统按"物品/地点/页码"检索（POST 表单）
        const resp = await fetch('/api/lost-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'item=' + encodeURIComponent(keyword) +
                '&location=' + encodeURIComponent(line || '') +
                '&page=' + lostPage
        });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const html = await resp.text();
        const parsed = parseOfficialLost(html);
        if (parsed.items.length === 0 && !parsed.hasNext && lostPage === 1) {
            // 官方确实无匹配数据 → 示例数据兜底
            lostDataMode = 'sample';
            fallbackSearchLostSample(keyword, line, container);
            return;
        }
        lostDataMode = 'official';
        renderOfficialLostItems(parsed.items, parsed.hasNext, parsed.hasPrev, keyword, line, container);
    } catch (e) {
        // 官方服务不可用 → 示例数据兜底
        console.log('官方失物招领不可用: ' + e.message);
        lostDataMode = 'sample';
        fallbackSearchLostSample(keyword, line, container);
    }
}

// 翻页
function lostChangePage(page) {
    if (page < 1) return;
    lostPage = page;
    searchLost();
    document.getElementById('appContent').scrollTop = 0;
}

// 解析官方失物招领 HTML（服务端渲染，字段: 失物类别/物品描述/拾获地点/拾获时间/物品状态）
function parseOfficialLost(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const boxes = doc.querySelectorAll('.pickupItemBox');
    const items = [];
    boxes.forEach(function (box) {
        const rows = box.querySelectorAll('.pickupItemRow');
        const item = { name: '', detail: '', category: '', place: '', date: '', status: '', line: '' };
        rows.forEach(function (row) {
            const nameEl = row.querySelector('.pickupItemFieldName, .pickupItemFieldName2');
            const valEl = row.querySelector('.pickupItemFiledContent');
            if (!nameEl || !valEl) return;
            const field = (nameEl.textContent || '').replace(/[：:]/g, '').trim();
            const value = (valEl.textContent || '').trim();
            if (field.indexOf('物品描述') !== -1) item.detail = value;
            else if (field.indexOf('失物类别') !== -1) item.category = value;
            else if (field.indexOf('拾获地点') !== -1) item.place = value;
            else if (field.indexOf('拾获时间') !== -1) item.date = value;
            else if (field.indexOf('物品状态') !== -1) item.status = value;
        });
        if (item.detail || item.place) {
            // 列表标题取物品描述前 14 字，完整描述放在详情行
            item.name = item.detail.length > 14 ? item.detail.substring(0, 14) + '…' : item.detail;
            item.detail = (item.category ? '【' + item.category + '】' : '') + item.detail;
            items.push(item);
        }
    });
    const htmlStr = String(html);
    return {
        items: items,
        hasNext: htmlStr.indexOf('id="nextPage"') !== -1,
        hasPrev: lostPage > 1
    };
}

// 渲染官方失物数据
function renderOfficialLostItems(items, hasNext, hasPrev, keyword, line, container) {
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="empty-state">' +
            '<div class="empty-icon">' + (window.ICONS ? window.ICONS.search : '') + '</div>' +
            '<div class="empty-text">未找到匹配的遗失物品<br><span style="font-size:12px;color:#999;">请尝试其他关键词</span></div>' +
            '</div>';
        return;
    }

    const pendingCount = items.filter(function (i) { return (i.status || '').indexOf('待认领') !== -1 || !i.status; }).length;

    let html = '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px 12px;">' +
        '<span style="font-size:13px;font-weight:600;color:var(--text-secondary);">' +
        '官方失物招领 · 第' + lostPage + '页 · ' + items.length + ' 条' +
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
            '<span style="font-size:12px;color:var(--text-light);">' + escapeHtml(item.date) + ' | ' + escapeHtml(item.place) + '</span>' +
            '<span class="lost-status ' + statusClass + '">' + escapeHtml(status) + '</span>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');

    // 分页
    if (hasNext || hasPrev) {
        html += '<div style="display:flex;justify-content:center;gap:16px;padding:12px 0 4px;">' +
            (hasPrev ? '<button class="btn-primary" style="width:auto;padding:0 24px;height:40px;font-size:14px;" onclick="lostChangePage(' + (lostPage - 1) + ')">上一页</button>' : '') +
            (hasNext ? '<button class="btn-primary" style="width:auto;padding:0 24px;height:40px;font-size:14px;" onclick="lostChangePage(' + (lostPage + 1) + ')">下一页</button>' : '') +
            '</div>';
    }

    html += '<div style="font-size:11px;color:#999;padding:6px 4px;">数据来源：广州地铁官方失物招领系统（dzs.gzmtr.cn），认领请前往拾获站点联系工作人员</div>';

    container.innerHTML = html;
}

// 示例数据兜底（官方服务不可用时）
function fallbackSearchLostSample(keyword, line, container) {
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
        '示例数据 · 共 ' + items.length + ' 条记录' +
        (keyword || line ? '（筛选结果）' : '') +
        '<br><span style="font-size:11px;color:#999;font-weight:400;">官方失物招领服务暂不可用，以下为演示数据</span>' +
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
// 设施左侧线路筛选（空=全部）
let facilityLineFilter = '';
// 是否已初始化默认线路（首次进入自动选中第一条线路，避免一次渲染546张卡）
let facilityLineInitialized = false;

// 设施类型 -> 官方 findByType 查询参数
const FACILITY_TYPES = {
    'wc': '卫生间',
    'baby': '母婴室'
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
    facilityLineFilter = '';
    facilityLineInitialized = false;   // 切tab后重新默认选中第一条线路
    var tabWc = document.getElementById('tabFacilityWC');
    var tabBaby = document.getElementById('tabFacilityBaby');
    var tabBm = document.getElementById('tabFacilityBM');
    if (tabWc) tabWc.classList.toggle('active', mode === 'wc');
    if (tabBaby) tabBaby.classList.toggle('active', mode === 'baby');
    if (tabBm) tabBm.classList.toggle('active', mode === 'bm');

    // 加载对应的数据列表
    loadFacilityData();
}

// 加载设施数据（原生列表，替代官方慢速SPA iframe）
// 竞态保护：切 tab / 换线路会触发新请求，旧请求的响应必须作废，
// 否则后到的旧数据会覆盖新 tab 的内容（快速切换时尤其明显）
let facilityReqSeq = 0;
function beginFacilityReq() { return ++facilityReqSeq; }
function isFacilityReqCurrent(token) { return token === facilityReqSeq; }

function loadFacilityData() {
    var listEl = document.getElementById('facilityList');
    var linesEl = document.getElementById('facilityLines');
    if (!listEl) return;

    var token = beginFacilityReq();

    // 便民举措页面(gdcj.gzmtr.com)返回 X-Frame-Options: DENY，且内容为整页图片，
    // 通过后端代理取回 HTML 解析图片渲染。整宽显示，隐藏左侧线路栏。
    if (facilityTabMode === 'bm') {
        if (linesEl) linesEl.innerHTML = '';
        loadFacilityBM(token);
        return;
    }

    var type = FACILITY_TYPES[facilityTabMode];
    if (!type) return;

    // 显示loading
    listEl.innerHTML = '<div class="loading-state" style="padding:60px 24px;">' +
        '<div class="loading-spinner" style="margin:0 auto 12px;"></div><div class="loading-text">加载中...</div></div>';

    fetch('/api/facilities/query?type=' + encodeURIComponent(type))
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            if (!isFacilityReqCurrent(token)) return;   // 已切到别的 tab，丢弃过期响应
            var items = (data && data.businessObject) || [];
            if (!items.length) {
                listEl.innerHTML = '<div class="empty-state" style="padding:60px 24px;">' +
                    '<div class="empty-icon">' + (window.ICONS ? window.ICONS.alert : '') + '</div>' +
                    '<div class="empty-text">暂无' + type + '数据</div>' +
                    '</div>';
                return;
            }
            // 首次进入：默认选中第一条线路（城际在前），避免一次渲染全部卡片导致卡顿
            if (!facilityLineInitialized && !facilityLineFilter) {
                var first = firstFacilityLine(items);
                if (first) facilityLineFilter = first;
                facilityLineInitialized = true;
            }
            renderFacilityList(listEl, items, type);
        })
        .catch(function () {
            if (!isFacilityReqCurrent(token)) return;
            listEl.innerHTML = '<div class="empty-state" style="padding:60px 24px;">' +
                '<div class="empty-icon">' + (window.ICONS ? window.ICONS.alert : '') + '</div>' +
                '<div class="empty-text">' + type + '数据加载失败</div>' +
                '<div style="font-size:12px;color:var(--text-light);margin-top:8px;">请检查网络后重试</div>' +
                '</div>';
        });
}

// 取数据中第一条有效线路名（优先城际线路，用于默认选中）
function firstFacilityLine(items) {
    var fallback = '';
    for (var i = 0; i < items.length; i++) {
        var line = normalizeFacilityLine(items[i].lineCn);
        if (!line) continue;
        if (/城际$/.test(line)) return line;   // 城际线路优先
        if (!fallback) fallback = line;
    }
    return fallback;
}

// 中文数字线路名 -> 阿拉伯数字（一号线->1号线, 二十一号线->21号线）
function cnLineToNum(line) {
    var m = /^([一二三四五六七八九十]+)号线$/.exec(line);
    if (!m) return line;
    var map = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '十': '10', '十一': '11', '十二': '12', '十三': '13', '十四': '14', '十五': '15', '十六': '16', '十七': '17', '十八': '18', '十九': '19', '二十': '20', '二十一': '21', '二十二': '22' };
    return (map[m[1]] || m[1]) + '号线';
}

// 渲染设施列表：左侧线路栏 + 按线路分组
function renderFacilityList(container, items, type) {
    // 线路名归一化：合并重复线路（官方数据里有 三号线/三北线、十二号线/十二号线（二沙岛…）、
    // 十四号线/十四号线(知识城)、佛山地铁3号线/佛山地铁3号线(联和…)），并清理坏字符(\ufffd)
    var groups = {};
    var order = [];     // 规范名顺序
    items.forEach(function (it) {
        var line = normalizeFacilityLine(it.lineCn);
        if (!line) return;   // 过滤坏数据（乱码线路）
        if (!groups[line]) { groups[line] = []; order.push(line); }
        groups[line].push(it);
    });

    // 排序：城际线路在前，然后地铁/有轨，保持组内原顺序
    var rank = function (name) { return /城际$/.test(name) ? 0 : 1; };
    order.sort(function (a, b) {
        var ra = rank(a), rb = rank(b);
        if (ra !== rb) return ra - rb;
        return order.indexOf(a) - order.indexOf(b);
    });

    // 左侧线路栏（无「全部」，直接点线路）
    var lineHtml = '<div class="line-section-label">线路</div>';
    order.forEach(function (line) {
        var color = LINE_COLORS[line] || '#607D8B';
        var active = facilityLineFilter === line ? ' active' : '';
        lineHtml += '<div class="line-item' + active + '" data-facility-line="' + line + '" onclick="filterFacilityLine(this, \'' + line.replace(/'/g, "\\'") + '\')">' +
            '<span class="line-dot" style="background:' + color + ';"></span>' +
            '<span>' + cnLineToNum(line) + '</span>' +
            '</div>';
    });
    document.getElementById('facilityLines').innerHTML = lineHtml;

    // 右栏卡片自带线路归属：色条与站名色点由该变量驱动（见 style.css）
    document.getElementById('facilityList').style.setProperty(
        '--facility-line-color',
        facilityLineFilter ? (LINE_COLORS[facilityLineFilter] || '#607D8B') : '#003DA5'
    );

    var allBtn = facilityLineFilter
        ? '<span class="facility-all-btn" onclick="filterFacilityLine(this, \'\')">‹ 全部线路</span>'
        : '';
    container.innerHTML = '<div class="facility-header">' + type + '（共' + items.length + '处）' + allBtn + '</div>';

    if (facilityLineFilter) {
        // 单线路：只显示该线路的设施（按站点聚合）
        var list = groups[facilityLineFilter] || [];
        var color = LINE_COLORS[facilityLineFilter] || '#607D8B';
        var groupHtml = '<div class="facility-line-group" data-facility-group="' + facilityLineFilter + '" style="--facility-line-color:' + color + ';">' +
            '<div class="station-group-title">' +
            '<span class="line-dot" style="background:' + color + ';width:10px;height:10px;border-radius:50%;"></span>' +
            cnLineToNum(facilityLineFilter) + '（' + list.length + '处）</div>' +
            stationGroupedHtml(list) +
            '</div>';
        container.insertAdjacentHTML('beforeend', groupHtml);
        return;
    }

    // 全部：按线路分组，组内按站点聚合 —— 分批渲染避免卡顿
    var chunks = order.map(function (line) {
        var list = groups[line];
        var color = LINE_COLORS[line] || '#607D8B';
        return '<div class="facility-line-group" data-facility-group="' + line + '" style="--facility-line-color:' + color + ';">' +
            '<div class="station-group-title">' +
            '<span class="line-dot" style="background:' + color + ';width:10px;height:10px;border-radius:50%;"></span>' +
            cnLineToNum(line) + '（' + list.length + '处）</div>' +
            stationGroupedHtml(list) +
            '</div>';
    });

    // 每帧插入2个线路分组，避免一次性渲染546张卡片卡死主线程
    var idx = 0;
    (function appendChunk() {
        var end = Math.min(idx + 2, chunks.length);
        for (var i = idx; i < end; i++) {
            container.insertAdjacentHTML('beforeend', chunks[i]);
        }
        idx = end;
        if (idx < chunks.length) {
            requestAnimationFrame(appendChunk);
        }
    })();
}

// 按站点聚合：同一站点的多个设施合并为一张卡片
function stationGroupedHtml(list) {
    // 保持站点出现顺序
    var stationOrder = [];
    var byStation = {};
    list.forEach(function (it) {
        var st = cleanFacilityText(it.station);
        if (!st) st = '未知站点';
        if (!byStation[st]) { byStation[st] = []; stationOrder.push(st); }
        byStation[st].push(it);
    });
    return stationOrder.map(function (st) {
        return facilityItemHtml(st, byStation[st]);
    }).join('');
}

// 清洗文本中的坏字符（官方数据偶发的UTF-8截断）及不可见字符
function cleanFacilityText(s) {
    if (!s) return '';
    return String(s).replace(/\uFFFD/g, '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

// 线路名归一化：合并重复线路、清理坏字符、过滤坏数据
function normalizeFacilityLine(line) {
    line = cleanFacilityText(line);
    if (!line) return null;
    // 坏数据：正常线路名至少2个字（如 三北线/广佛线/APM），短于2字视为损坏
    if (line.length < 2) return null;
    // 正常线路名应含 线/城际/APM/有轨 等特征，否则视为乱码损坏（如「八号」）
    if (!/线|城际|APM|有轨|环$/.test(line)) return null;
    // 合并重复线路：去掉括号后缀（二沙岛/知识城/联和-佛山大学）
    line = line.replace(/（[^）]*）$/, '').replace(/\([^)]*\)$/, '');
    // 清理后再校验一次（去括号后仍应保留线路特征）
    if (!/线|城际|APM|有轨|环$/.test(line)) return null;
    // 三北线 -> 三号线（3号线北延段）
    if (line === '三北线') return '三号线';
    // 佛山地铁N号线 -> 佛山N号线 统一命名（去掉「地铁」二字即可）
    if (/^佛山地铁(\d+)号线$/.test(line)) return line.replace('地铁', '');
    return line;
}

// 设施卡片 HTML：一个站点一张卡，列出该站所有卫生间/母婴室位置
function facilityItemHtml(station, items) {
    var locsHtml = items.map(function (it) {
        var loc = cleanFacilityText(it.locationCN);
        var name = cleanFacilityText(it.nameCN);
        // 去重：同一站同一位置只显示一次（不同名称合并为标签）
        var typeTag = (name && name !== '卫生间' && name !== '母婴室') ? name : '';
        if (!loc) return '';
        var tagHtml = typeTag
            ? '<span class="facility-item-type">' + typeTag + '</span>'
            : '';
        return '<div class="facility-item-loc">' + tagHtml + loc + '</div>';
    }).filter(function (x) { return x; });

    // 去重完全相同的位置
    var seen = {};
    locsHtml = locsHtml.filter(function (x) {
        var key = x.replace(/<[^>]*>/g, '');
        if (seen[key]) return false;
        seen[key] = true;
        return true;
    });

    var badge = items.length > 1 ? '<span class="facility-item-count">' + items.length + '处</span>' : '';
    return '<div class="facility-item">' +
        '<div class="facility-item-main">' +
        '<span class="facility-item-station">' + station + '</span>' +
        badge +
        '</div>' +
        '<div class="facility-item-locs">' + locsHtml.join('') + '</div>' +
        '</div>';
}

// 设施左侧线路筛选（全部/单线）
function filterFacilityLine(el, line) {
    facilityLineFilter = line;
    // 左侧栏线路项：更新 active 高亮；header「全部」按钮无兄弟线路项则跳过
    if (el && el.parentNode) {
        var items = el.parentNode.querySelectorAll('.line-item');
        if (items.length) {
            for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
            if (el.classList && el.classList.contains('line-item')) el.classList.add('active');
        }
    }
    // 重新渲染右侧列表（保持当前数据）
    loadFacilityData();
}

// 便民举措：官方正文为一张超长图（原图约 1056x15000），手机宽度下小字不可读，
// 故提供全屏查看 + 点击放大（宽度超屏后横向滚动查看细节）。
function closeBmViewer() {
    var lb = document.getElementById('bmLightbox');
    if (lb) { lb.hidden = true; lb.classList.remove('zoomed'); }
    document.body.style.overflow = '';
}

function toggleBmZoom() {
    var lb = document.getElementById('bmLightbox');
    if (!lb || lb.hidden) return;
    lb.classList.toggle('zoomed');
    if (lb.classList.contains('zoomed')) lb.scrollLeft = 0;
}

function openBmViewer(src) {
    if (!src) return;
    var lb = document.getElementById('bmLightbox');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'bmLightbox';
        lb.className = 'bm-lightbox';
        lb.setAttribute('role', 'dialog');
        lb.setAttribute('aria-modal', 'true');
        lb.setAttribute('aria-label', '便民举措长图查看');
        lb.onclick = function (e) { if (e.target === lb) closeBmViewer(); };
        document.body.appendChild(lb);
    }
    lb.classList.remove('zoomed');
    lb.scrollTop = 0;
    lb.innerHTML =
        '<button class="bm-lightbox-close" aria-label="关闭" onclick="closeBmViewer()">✕</button>' +
        '<img src="' + src.replace(/"/g, '&quot;') + '" alt="便民举措全文" onclick="toggleBmZoom()">' +
        '<div class="bm-lightbox-tip">点击图片放大 / 缩小 · 双指可缩放 · 点右上角关闭</div>';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
}

// 加载便民举措内容（bm.htm 禁止 iframe，通过后端代理取回 HTML 解析图片渲染）
function loadFacilityBM(token) {
    var container = document.getElementById('facilityList');
    if (!container) return;

    container.innerHTML = '<div class="loading-state" style="padding:60px 24px;">' +
        '<div class="loading-spinner" style="margin:0 auto 12px;"></div><div class="loading-text">加载中...</div></div>';

    fetch('/api/facilities/bm')
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function (html) {
            if (token !== undefined && !isFacilityReqCurrent(token)) return;   // 已切走，丢弃过期响应
            // 解析 HTML，提取正文中的全部图片（官方可能分多张发布）
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var imgs = doc.querySelectorAll('#main-content img, #main-content p img');
            var srcs = [];
            Array.prototype.forEach.call(imgs, function (img) {
                var src = img.getAttribute('src') || '';
                if (!src) return;
                if (!/^https?:\/\//i.test(src)) {
                    // 相对路径补全为官方绝对地址
                    src = 'https://gdcj.gzmtr.com/wxMetro' + (src.charAt(0) === '/' ? '' : '/') + src.replace(/^\.\.\//, 'fwck/../');
                    if (src.indexOf('wxMetro') === -1) src = 'https://gdcj.gzmtr.com/wxMetro/' + src;
                }
                if (srcs.indexOf(src) === -1) srcs.push(src);
            });

            if (srcs.length) {
                var figures = srcs.map(function (src, i) {
                    // 每张图各自包一层容器：加载失败时只替换自己，不会清空整页
                    return '<div class="bm-figure-wrap">' +
                        '<img class="bm-figure" src="' + src.replace(/"/g, '&quot;') + '" alt="便民举措 ' + (i + 1) + '" ' +
                        'loading="lazy" onclick="openBmViewer(this.src)" ' +
                        'onerror="this.parentNode.innerHTML=\'<div class=empty-state style=padding:24px><div class=empty-text>图片加载失败</div><button class=btn-primary style=margin-top:16px; onclick=window.open(\\\'' + src + '\\\',\\\'_blank\\\')>在新窗口打开</button></div>\';">' +
                        '</div>';
                }).join('');

                container.innerHTML = '<div style="padding:16px;">' +
                    '<div style="font-size:15px;font-weight:600;color:var(--primary);margin-bottom:12px;">便民举措</div>' +
                    figures +
                    '<div class="bm-hint">' +
                    (window.ICONS && window.ICONS.info ? window.ICONS.info : '') +
                    '点击图片可全屏查看，再点图片放大细看</div>' +
                    '<div class="bm-note">本页面由官方「便民举措」内容自动获取展示，数据以官方发布为准。</div>' +
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
            if (token !== undefined && !isFacilityReqCurrent(token)) return;
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
window.scrollToStationLetter = scrollToStationLetter;
window.searchTrains = searchTrains;
window.switchTrainView = switchTrainView;
window.handleMapError = handleMapError;
window.showTicketDetail = showTicketDetail;
window.openApp = openApp;
window.submitService = submitService;
window.searchLost = searchLost;
window.lostChangePage = lostChangePage;
window.toggleLostRegister = toggleLostRegister;
window.submitLostReport = submitLostReport;
window.toggleInfo = toggleInfo;
window.switchServiceTab = switchServiceTab;
window.switchFacilityTab = switchFacilityTab;
window.filterFacilityLine = filterFacilityLine;
window.openBmViewer = openBmViewer;
window.closeBmViewer = closeBmViewer;
window.toggleBmZoom = toggleBmZoom;
