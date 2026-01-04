import { AudioClip, Prefab, SpriteFrame } from "cc";

// 模式
export enum ENUM_GAME_MODE {
  SCORE = 'score',
  LEVEL = 'level',
  MAHJONG = 'mahjong'  // 新增日麻模式
}

// 状态
export enum ENUM_GAME_STATUS {
  UNRUNING = 'UNRUNING',
  RUNING = 'RUNING'
}

// 音效
export enum ENUM_AUDIO_CLIP {
  BGM = 'bgm',
  CLICK = 'click',
  TOUCH = 'touch',
  CLERE = 'clear',
  LOSE = 'lose',
  WIN = 'win',
  COLLECT = 'collect',
  MOVE = 'move',
  SHUFFLE = 'shuffle',
  BONUS = 'bonus'
}

// ui层
export enum ENUM_UI_TYPE {
  MENU = 'MenuLayer',
  MAIN = 'MainLayer',
  SETTING = 'SettingLayer',
  EXIT = 'ExitLayer',
  OVER = 'OverLayer',
  MORE = 'MoreLayer',
  RANK = 'RankLayer',
  EXIT_LEVEL = 'ExitLevelLayer',
  MAIN_LEVEL = 'MainLevelLayer',
  MAIN_MAHJONG = 'MainMahjongLayer',  // 新增日麻UI层
  WIN = 'WinLayer',
  LOSE = 'LoseLayer',
  MAHJONG_LEVEL_SELECT = 'MahjongLevelSelectLayer' // 日麻模式选关页面
}

// 日麻役种
export enum ENUM_MAHJONG_YAKU {
  JIAOXUE = 'jiaoxue', //教学
  RIICHI = 'riichi',           // 立直
  TANYAO = 'tanyao',           // 断幺九
  PINFU = 'pinfu',             // 平和
  IPEKO = 'ipeko',             // 一杯口
  HAITEI = 'haitei',           // 海底摸月
  RINSHAN = 'rinshan',         // 岭上开花
  CHANKAN = 'chankan',         // 枪杠
  TSUMO = 'tsumo',             // 自摸
  YAKUHAI = 'yakuhai',         // 役牌
  SANSHOKU = 'sanshoku',       // 三色同顺
  SANSHOKU_KOKU = 'sanshoku_koku', // 三色同刻
  YISE_SANTOUSU = 'yise_santousu', // 一色三同顺
  YISE_SISANTOUSU = 'yise_sisantousu', // 一色四同顺
  HONGKONG = 'hongkong',         // 红孔雀
  HONGYI_DIAN = 'hongyi_dian',   // 红一点
  HEIYI_SE = 'heiyi_se',   // 黑一色
  DACHELUN = 'dachelun',       // 大车轮
  SHISANBUDA = 'shisanbudan',   // 十三不搭
  DASHULIN = 'dashulin',       // 大树邻
  DADALIN = 'dadalin',       // 大竹林
  BAIWANSHI = 'baiwanshi',   // 百万石
  DONGBEI_XINGANXIAN = 'dongbei_xinganxian',   // 东北新干线
  JINMENQIAO = 'jinmenqiao',   // 金门桥
  WUMENQI = 'wumenqi',         // 五门齐
  ITTSU = 'ittsu',             // 一气通贯
  SANSEITSU = 'sanseitsu',     // 三色通贯
  TOITOI = 'toitoi',           // 对对和
  SANANKO = 'sananko',         // 三暗刻
  SANKANTSU = 'sankantsu',     // 三杠子
  SANLIANKE = 'sanlianko',     // 三连刻
  SISANLIANKE = 'sisanlianko', // 四连刻
  CHANTA = 'chanta',           // 混全带幺九
  JUNCHAN = 'junchan',         // 纯全带幺九
  HONROTO = 'honroto',         // 混老头
  SHOSANGEN = 'shosangen',     // 小三元
  HONITSU = 'honitsu',         // 混一色
  CHINITSU = 'chinitsu',       // 清一色
  RYANPEKO = 'ryanpeko',       // 两杯口
  CHITOITSU = 'chitoitsu',     // 七对子
  DAISANGEN = 'daisangen',     // 大三元
  KOKUSHI = 'kokushi',         // 国士无双
  KOKUSHI_SHISANMIAN = 'kokushi_shisanmian', // 国士无双十三面
  SUANKO = 'suanko',           // 四暗刻
  SUANKO_DANQI = 'suanko_danqi', // 四暗刻单骑
  SUKANTSU = 'sukantsu',       // 四杠子
  TENHO = 'tenho',             // 天和
  CHIHO = 'chiho',             // 地和
  DAISUSHI = 'daisushi',       // 大四喜
  SHOSUSHI = 'shosushi',       // 小四喜
  TSUISO = 'tsuiso',           // 字一色
  RYUISO = 'ryuiso',           // 绿一色
  DASIXING = 'dasixing',       // 大七星
  WUFA_LVYISE = 'wufa_lvyise', // 无发绿一色
  CHINROTO = 'chinroto',       // 清老头
  CHURENPOTO = 'churenpoto',   // 九莲宝灯
  CHURENPOTO_ZHENZHENG = 'churenpoto_zhengzheng' // 纯正九莲宝灯
}

// 事件
export enum ENUM_GAME_EVENT {
  HAND_UPDATED = 'hand_updated',  // 手牌更新事件
  DISCARD_TILE = 'discard_tile',   // 弃牌事件
  GAME_START = 'game_start',
  GAME_OVER = 'game_over',
  GAME_PAUSE = 'game_pause',
  GAME_RESUME = 'game_resume',
  GAME_RESTART = 'game_restart',
  GAME_EXIT = 'game_exit',
  GAME_NEXT = 'game_next',
  GAME_PREV = 'game_prev',
  GAME_LEVEL_COMPLETE = 'game_level_complete',
  GAME_LEVEL_FAIL = 'game_level_fail',
  GAME_SCORE_CHANGE = 'game_score_change',
  GAME_LIFE_CHANGE = 'game_life_change',
  GAME_TIME_CHANGE = 'game_time_change',
  GAME_POWER_CHANGE = 'game_power_change',
  GAME_KEYS_CHANGE = 'game_keys_change',
  GAME_COMBO_CHANGE = 'game_combo_change',
  GAME_COMBO_END = 'game_combo_end',
  GAME_COMBO_TIME_CHANGE = 'game_combo_time_change',
  GAME_COMBO_TIME_END = 'game_combo_time_end',
  GAME_COMBO_TIME_START = 'game_combo_time_start',
  GAME_COMBO_TIME_PAUSE = 'game_combo_time_pause',
  GAME_COMBO_TIME_RESUME = 'game_combo_time_resume',
  GAME_COMBO_TIME_RESET = 'game_combo_time_reset',
  GAME_COMBO_TIME_ADD = 'game_combo_time_add',
  GAME_COMBO_TIME_SUB = 'game_combo_time_sub',
  GAME_COMBO_TIME_SET = 'game_combo_time_set',
  GAME_COMBO_TIME_GET = 'game_combo_time_get',
  GAME_COMBO_TIME_CLEAR = 'game_combo_time_clear',
  NO_MATCHES_AVAILABLE = 'no_matches_available',
  SHUFFLE_COMPLETE = 'shuffle_complete' // 添加洗牌完成事件
}

// 资源
export const ENUM_RESOURCE_TYPE = ([
  { content: AudioClip, path: 'audio', type: 'audio', ratio: 0.4 },
  { content: Prefab, path: 'prefab', type: 'prefab', ratio: 0.3 },
  { content: SpriteFrame, path: 'sprite', type: 'sprite', ratio: 0.3 },
  // {content: cc.JsonAsset, path: 'json', type: 'json', ratio: 0.1},
])