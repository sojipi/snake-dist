import { ENUM_MAHJONG_YAKU } from "../Enum";

export interface LevelData {
    name: string;
    xnums: number;
    ynums: number;
    pairs: number;
    targetYaku: ENUM_MAHJONG_YAKU;
    description: string;
    isTutorial?: boolean; // 是否为教学关卡
}

export const MAHJONG_LEVEL_DATA: LevelData[] = [
    {
        name: '教学关',
        xnums: 8,
        ynums: 6,
        pairs: 14,
        targetYaku: ENUM_MAHJONG_YAKU.JIAOXUE, // 教学关使用断幺九作为目标，但实际只要满足基本胡牌规则即可
        description: '教学关：学习基本操作和胡牌规则，收集14张牌组成标准和牌即可通关',
        isTutorial: true
    },
    {
        name: 'Stage1',
        xnums: 10,
        ynums: 8,
        pairs: 20,
        targetYaku: ENUM_MAHJONG_YAKU.TANYAO,
        description: '断幺九：不包含字牌和幺九牌（1和9）的和牌'
    },
    {
        name: 'Stage2',
        xnums: 10,
        ynums: 8,
        pairs: 20,
        targetYaku: ENUM_MAHJONG_YAKU.PINFU,
        description: '平和：由四组顺子和一对雀头组成，且没有役牌的雀头'
    },
    {
        name: 'Stage3',
        xnums: 10,
        ynums: 8,
        pairs: 20,
        targetYaku: ENUM_MAHJONG_YAKU.IPEKO,
        description: '一杯口：包含两组完全相同的顺子'
    },
    {
        name: 'Stage4',
        xnums: 10,
        ynums: 8,
        pairs: 25,
        targetYaku: ENUM_MAHJONG_YAKU.YAKUHAI,
        description: '役牌：包含风牌或三元牌的刻子'
    },
    {
        name: 'Stage5',
        xnums: 10,
        ynums: 8,
        pairs: 25,
        targetYaku: ENUM_MAHJONG_YAKU.TOITOI,
        description: '对对和：由四组刻子和一对雀头组成的和牌'
    },
    {
        name: 'Stage6',
        xnums: 10,
        ynums: 8,
        pairs: 30,
        targetYaku: ENUM_MAHJONG_YAKU.CHITOITSU,
        description: '七对子：由七对不同的牌组成的和牌'
    },
    {
        name: 'Stage7',
        xnums: 10,
        ynums: 8,
        pairs: 30,
        targetYaku: ENUM_MAHJONG_YAKU.HONROTO,
        description: '混老头：由幺九牌（1和9）和字牌组成的和牌'
    },
    {
        name: 'Stage8',
        xnums: 10,
        ynums: 8,
        pairs: 30,
        targetYaku: ENUM_MAHJONG_YAKU.SANSHOKU,
        description: '三色同顺：三种不同花色但数字相同的顺子'
    },
    {
        name: 'Stage9',
        xnums: 10,
        ynums: 8,
        pairs: 30,
        targetYaku: ENUM_MAHJONG_YAKU.SANSHOKU_KOKU,
        description: '三色同刻：三种不同花色但数字相同的刻子'
    },
    {
        name: 'Stage10',
        xnums: 10,
        ynums: 8,
        pairs: 35,
        targetYaku: ENUM_MAHJONG_YAKU.ITTSU,
        description: '一气通贯：由同一花色的123、456、789三组顺子组成'
    },
    {
        name: 'Stage11',
        xnums: 10,
        ynums: 8,
        pairs: 35,
        targetYaku: ENUM_MAHJONG_YAKU.SANSEITSU,
        description: '三色通贯：三种不同花色的123、456、789顺子'
    },
    {
        name: 'Stage12',
        xnums: 10,
        ynums: 8,
        pairs: 35,
        targetYaku: ENUM_MAHJONG_YAKU.SANANKO,
        description: '三暗刻：包含三组暗刻（自己摸到的刻子）'
    },
    {
        name: 'Stage13',
        xnums: 10,
        ynums: 8,
        pairs: 35,
        targetYaku: ENUM_MAHJONG_YAKU.HONITSU,
        description: '混一色：所有牌都是同一种花色，但可以包含字牌'
    },
    {
        name: 'Stage14',
        xnums: 10,
        ynums: 8,
        pairs: 40,
        targetYaku: ENUM_MAHJONG_YAKU.RYANPEKO,
        description: '两杯口：包含两组不同的一杯口（四组顺子两两相同）'
    },
    {
        name: 'Stage15',
        xnums: 10,
        ynums: 8,
        pairs: 40,
        targetYaku: ENUM_MAHJONG_YAKU.CHANTA,
        description: '混全带幺九：每组面子和雀头都必须包含幺九牌（1和9）或字牌'
    },
    {
        name: 'Stage16',
        xnums: 10,
        ynums: 8,
        pairs: 40,
        targetYaku: ENUM_MAHJONG_YAKU.JUNCHAN,
        description: '纯全带幺九：每组面子和雀头都必须包含幺九牌（1和9），不能有字牌'
    },
    {
        name: 'Stage17',
        xnums: 10,
        ynums: 8,
        pairs: 40,
        targetYaku: ENUM_MAHJONG_YAKU.SANLIANKE,
        description: '三连刻：同一花色三个连续数字的刻子'
    },
    {
        name: 'Stage18',
        xnums: 10,
        ynums: 8,
        pairs: 45,
        targetYaku: ENUM_MAHJONG_YAKU.CHINITSU,
        description: '清一色：所有牌都是同一种花色，不能包含字牌'
    },
    {
        name: 'Stage19',
        xnums: 10,
        ynums: 8,
        pairs: 45,
        targetYaku: ENUM_MAHJONG_YAKU.YISE_SANTOUSU,
        description: '一色三同顺：同一花色三组完全相同的顺子'
    },
    {
        name: 'Stage20',
        xnums: 10,
        ynums: 8,
        pairs: 45,
        targetYaku: ENUM_MAHJONG_YAKU.TSUISO,
        description: '字一色：所有牌都是字牌（风牌和三元牌）'
    },
    {   
        name: 'Stage21',
        xnums: 10,
        ynums: 8,
        pairs: 50,
        targetYaku: ENUM_MAHJONG_YAKU.CHINROTO,
        description: '清老头：所有牌都是幺九牌（1和9），不能包含字牌'
    },
    {   
        name: 'Stage22',
        xnums: 10,
        ynums: 8,
        pairs: 50,
        targetYaku: ENUM_MAHJONG_YAKU.SHOSANGEN,
        description: '小三元：包含两组三元牌的刻子和一对三元牌的雀头'
    },
    {   
        name: 'Stage23',
        xnums: 10,
        ynums: 8,
        pairs: 50,
        targetYaku: ENUM_MAHJONG_YAKU.HONGKONG,
        description: '红孔雀：只包含索子的1579，且必须包含中'
    },
    {   
        name: 'Stage24',
        xnums: 10,
        ynums: 8,
        pairs: 50,
        targetYaku: ENUM_MAHJONG_YAKU.SISANLIANKE,
        description: '四连刻：同一花色四个连续数字的刻子'
    },
    {   
        name: 'Stage25',
        xnums: 10,
        ynums: 8,
        pairs: 55,
        targetYaku: ENUM_MAHJONG_YAKU.DAISANGEN,
        description: '大三元：包含三组三元牌的刻子'
    },
    {   
        name: 'Stage26',
        xnums: 10,
        ynums: 8,
        pairs: 55,
        targetYaku: ENUM_MAHJONG_YAKU.SHOSUSHI,
        description: '小四喜：包含三组风牌的刻子和一对风牌的雀头'
    },
    {   
        name: 'Stage27',
        xnums: 10,
        ynums: 8,
        pairs: 55,
        targetYaku: ENUM_MAHJONG_YAKU.YISE_SISANTOUSU,
        description: '一色四同顺：同一花色四组完全相同的顺子'
    },
    {   
        name: 'Stage28',
        xnums: 10,
        ynums: 8,
        pairs: 60,
        targetYaku: ENUM_MAHJONG_YAKU.RYUISO,
        description: '绿一色：所有牌都由绿色牌组成（索子的2、3、4、6、8和发）'
    },
    {   
        name: 'Stage29',
        xnums: 10,
        ynums: 8,
        pairs: 60,
        targetYaku: ENUM_MAHJONG_YAKU.HEIYI_SE,
        description: '黑一色：只包含筒子的248，和东南西北'
    },
    {   
        name: 'Stage30',
        xnums: 10,
        ynums: 8,
        pairs: 60,
        targetYaku: ENUM_MAHJONG_YAKU.DAISUSHI,
        description: '大四喜：包含四组风牌的刻子'
    },
    {   
        name: 'Stage31',
        xnums: 10,
        ynums: 8,
        pairs: 65,
        targetYaku: ENUM_MAHJONG_YAKU.SUANKO,
        description: '四暗刻：包含四组暗刻（自己摸到的刻子）'
    },
    {   
        name: 'Stage32',
        xnums: 10,
        ynums: 8,
        pairs: 65,
        targetYaku: ENUM_MAHJONG_YAKU.DASHULIN,
        description: '大树林：万子2-8组成的七对子'
    },
    {   
        name: 'Stage33',
        xnums: 10,
        ynums: 8,
        pairs: 65,
        targetYaku: ENUM_MAHJONG_YAKU.DADALIN,
        description: '大竹林：条子2-8组成的七对子'
    },
    {   
        name: 'Stage34',
        xnums: 10,
        ynums: 8,
        pairs: 65,
        targetYaku: ENUM_MAHJONG_YAKU.DACHELUN,
        description: '大车轮：饼子2-8组成的七对子'
    },
    {   
        name: 'Stage35',
        xnums: 10,
        ynums: 8,
        pairs: 70,
        targetYaku: ENUM_MAHJONG_YAKU.BAIWANSHI,
        description: '百万石：由特定数值组成的和牌形式'
    },
    {   
        name: 'Stage36',
        xnums: 10,
        ynums: 8,
        pairs: 70,
        targetYaku: ENUM_MAHJONG_YAKU.WUMENQI,
        description: '五门齐：包含万、筒、索、风、三元五种牌的和牌'
    },
    {   
        name: 'Stage37',
        xnums: 10,
        ynums: 8,
        pairs: 70,
        targetYaku: ENUM_MAHJONG_YAKU.JINMENQIAO,
        description: '金门桥：包含同花色的123，345，567，789'
    },
    {   
        name: 'Stage38',
        xnums: 10,
        ynums: 8,
        pairs: 70,
        targetYaku: ENUM_MAHJONG_YAKU.DONGBEI_XINGANXIAN,
        description: '东北新干线：包含东、北、同花色牌的1-9'
    },
    {   
        name: 'Stage39',
        xnums: 10,
        ynums: 8,
        pairs: 75,
        targetYaku: ENUM_MAHJONG_YAKU.CHURENPOTO,
        description: '九莲宝灯：由同一种花色的1112345678999组成，再加上该花色的任意一张牌'
    },
    {   
        name: 'Stage40',
        xnums: 10,
        ynums: 8,
        pairs: 75,
        targetYaku: ENUM_MAHJONG_YAKU.KOKUSHI,
        description: '国士无双：由1和9的饼条万以及所有字牌各一张，再加上其中任意一张组成的和牌'
    },
    {   
        name: 'Stage41',
        xnums: 10,
        ynums: 8,
        pairs: 80,
        targetYaku: ENUM_MAHJONG_YAKU.DASIXING,
        description: '大七星：由七对字牌组成的特殊七对子'
    },
    {   
        name: 'Stage42',
        xnums: 10,
        ynums: 8,
        pairs: 80,
        targetYaku: ENUM_MAHJONG_YAKU.WUFA_LVYISE,
        description: '无发绿一色：只包含条子23468'
    },
    {   
        name: 'Stage43',
        xnums: 10,
        ynums: 8,
        pairs: 80,
        targetYaku: ENUM_MAHJONG_YAKU.SUANKO_DANQI,
        description: '四暗刻单骑：四暗刻和单骑听牌的特殊形式'
    },
    {   
        name: 'Stage44',
        xnums: 10,
        ynums: 8,
        pairs: 85,
        targetYaku: ENUM_MAHJONG_YAKU.KOKUSHI_SHISANMIAN,
        description: '国士无双十三面：国士无双的特殊形式，可以听13张不同的牌'
    },
    {   
        name: 'Stage45',
        xnums: 10,
        ynums: 8,
        pairs: 85,
        targetYaku: ENUM_MAHJONG_YAKU.CHURENPOTO_ZHENZHENG,
        description: '纯正九莲宝灯：九莲宝灯的特殊形式，可以听9张不同的牌'
    },
    {   
        name: 'Stage46',
        xnums: 10,
        ynums: 8,
        pairs: 90,
        targetYaku: ENUM_MAHJONG_YAKU.TENHO,
        description: '天和：庄家第一次摸牌就和牌'
    },
    // {   
    //     name: 'Stage47',
    //     xnums: 10,
    //     ynums: 8,
    //     pairs: 90,
    //     targetYaku: ENUM_MAHJONG_YAKU.CHIHO,
    //     description: '地和：闲家第一巡摸牌就和牌'
    // },
    {   
        name: 'Stage47',
        xnums: 10,
        ynums: 8,
        pairs: 90,
        targetYaku: ENUM_MAHJONG_YAKU.SHISANBUDA,
        description: '十三不搭：由不能组成任何面子的13张不同牌组成'
    }
]; 