import { ENUM_MAHJONG_YAKU } from "../Enum";

export default class YakuNameUtil {
    private static yakuNames = {
        [ENUM_MAHJONG_YAKU.RIICHI]: '立直',
        [ENUM_MAHJONG_YAKU.TANYAO]: '断幺九',
        [ENUM_MAHJONG_YAKU.PINFU]: '平和',
        [ENUM_MAHJONG_YAKU.IPEKO]: '一杯口',
        [ENUM_MAHJONG_YAKU.HAITEI]: '海底摸月',
        [ENUM_MAHJONG_YAKU.RINSHAN]: '岭上开花',
        [ENUM_MAHJONG_YAKU.CHANKAN]: '枪杠',
        [ENUM_MAHJONG_YAKU.TSUMO]: '自摸',
        [ENUM_MAHJONG_YAKU.YAKUHAI]: '役牌',
        [ENUM_MAHJONG_YAKU.SANSHOKU]: '三色同顺',
        [ENUM_MAHJONG_YAKU.SANSHOKU_KOKU]: '三色同刻',
        [ENUM_MAHJONG_YAKU.YISE_SANTOUSU]: '一色三同顺',
        [ENUM_MAHJONG_YAKU.YISE_SISANTOUSU]: '一色四同顺',
        [ENUM_MAHJONG_YAKU.HONGKONG]: '红孔雀',
        [ENUM_MAHJONG_YAKU.HONGYI_DIAN]: '红一点',
        [ENUM_MAHJONG_YAKU.HEIYI_SE]: '黑一色',
        [ENUM_MAHJONG_YAKU.DACHELUN]: '大车轮',
        [ENUM_MAHJONG_YAKU.SHISANBUDA]: '十三不搭',
        [ENUM_MAHJONG_YAKU.DASHULIN]: '大树林',
        [ENUM_MAHJONG_YAKU.DADALIN]: '大竹林',
        [ENUM_MAHJONG_YAKU.BAIWANSHI]: '百万石',
        [ENUM_MAHJONG_YAKU.DONGBEI_XINGANXIAN]: '东北新干线',
        [ENUM_MAHJONG_YAKU.JINMENQIAO]: '金门桥',
        [ENUM_MAHJONG_YAKU.WUMENQI]: '五门齐',
        [ENUM_MAHJONG_YAKU.ITTSU]: '一气通贯',
        [ENUM_MAHJONG_YAKU.SANSEITSU]: '三色通贯',
        [ENUM_MAHJONG_YAKU.TOITOI]: '对对和',
        [ENUM_MAHJONG_YAKU.SANANKO]: '三暗刻',
        [ENUM_MAHJONG_YAKU.SANKANTSU]: '三杠子',
        [ENUM_MAHJONG_YAKU.SANLIANKE]: '三连刻',
        [ENUM_MAHJONG_YAKU.SISANLIANKE]: '四连刻',
        [ENUM_MAHJONG_YAKU.CHANTA]: '混全带幺九',
        [ENUM_MAHJONG_YAKU.JUNCHAN]: '纯全带幺九',
        [ENUM_MAHJONG_YAKU.HONROTO]: '混老头',
        [ENUM_MAHJONG_YAKU.SHOSANGEN]: '小三元',
        [ENUM_MAHJONG_YAKU.HONITSU]: '混一色',
        [ENUM_MAHJONG_YAKU.CHINITSU]: '清一色',
        [ENUM_MAHJONG_YAKU.RYANPEKO]: '两杯口',
        [ENUM_MAHJONG_YAKU.CHITOITSU]: '七对子',
        [ENUM_MAHJONG_YAKU.DAISANGEN]: '大三元',
        [ENUM_MAHJONG_YAKU.KOKUSHI]: '国士无双',
        [ENUM_MAHJONG_YAKU.KOKUSHI_SHISANMIAN]: '国士无双十三面',
        [ENUM_MAHJONG_YAKU.SUANKO]: '四暗刻',
        [ENUM_MAHJONG_YAKU.SUANKO_DANQI]: '四暗刻单骑',
        [ENUM_MAHJONG_YAKU.SUKANTSU]: '四杠子',
        [ENUM_MAHJONG_YAKU.TENHO]: '天和',
        [ENUM_MAHJONG_YAKU.CHIHO]: '地和',
        [ENUM_MAHJONG_YAKU.DAISUSHI]: '大四喜',
        [ENUM_MAHJONG_YAKU.SHOSUSHI]: '小四喜',
        [ENUM_MAHJONG_YAKU.TSUISO]: '字一色',
        [ENUM_MAHJONG_YAKU.RYUISO]: '绿一色',
        [ENUM_MAHJONG_YAKU.DASIXING]: '大七星',
        [ENUM_MAHJONG_YAKU.WUFA_LVYISE]: '无发绿一色',
        [ENUM_MAHJONG_YAKU.CHINROTO]: '清老头',
        [ENUM_MAHJONG_YAKU.CHURENPOTO]: '九莲宝灯',
        [ENUM_MAHJONG_YAKU.CHURENPOTO_ZHENZHENG]: '纯正九莲宝灯'
    };

    /**
     * 获取役种的中文显示名称
     * @param yaku 役种枚举值
     * @returns 役种的中文名称
     */
    public static getDisplayName(yaku: ENUM_MAHJONG_YAKU): string {
        return this.yakuNames[yaku] || yaku;
    }
} 