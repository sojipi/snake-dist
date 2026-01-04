import { ENUM_MAHJONG_YAKU } from "../../Enum";
import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";
import ChantaYaku from "./ChantaYaku";
import TanyaoYaku from "./TanyaoYaku";
import ChitoitsuYaku from "./ChitoitsuYaku";
import PinfuYaku from "./PinfuYaku";
import IpekoYaku from "./IpekoYaku";
import ToitoiYaku from "./ToitoiYaku";
import SanshokuYaku from "./SanshokuYaku";
import IttsYaku from "./IttsYaku";
import HonitsuYaku from "./HonitsuYaku";
import ChiNitsuYaku from "./ChiNitsuYaku";
import RyanpekoYaku from "./RyanpekoYaku";
import TsuisoYaku from "./TsuisoYaku";
import ChinrotoYaku from "./ChinrotoYaku";
import YiseSantousuYaku from "./YiseSantousuYaku";
import YiseSisantousuYaku from "./YiseSisantousuYaku";
import HongKongYaku from "./HongKongYaku";
import HongyiDianYaku from "./HongyiDianYaku";
import HeiyiSeYaku from "./HeiyiSeYaku";
import DachelunYaku from "./DachelunYaku";
import ShisanbudaYaku from "./ShisanbudaYaku";
import DashulinYaku from "./DashulinYaku";
import DadalinYaku from "./DadalinYaku";
import BaiwanshiYaku from "./BaiwanshiYaku";
import DongbeiXinganxianYaku from "./DongbeiXinganxianYaku";
import JinmenqiaoYaku from "./JinmenqiaoYaku";
import WumenqiYaku from "./WumenqiYaku";
import SanseitsuYaku from "./SanseitsuYaku";
import SanankoYaku from "./SanankoYaku";
import SankantsuYaku from "./SankantsuYaku";
import SanliankeYaku from "./SanliankeYaku";
import SisanliankeYaku from "./SisanliankeYaku";
import JunchanYaku from "./JunchanYaku";
import HonrotoYaku from "./HonrotoYaku";
import ShosangenYaku from "./ShosangenYaku";
import DaisangenYaku from "./DaisangenYaku";
import KokushiYaku from "./KokushiYaku";
import KokushiShisanmianYaku from "./KokushiShisanmianYaku";
import SuankoYaku from "./SuankoYaku";
import SuankoDanqiYaku from "./SuankoDanqiYaku";
import SukantsuYaku from "./SukantsuYaku";
import TenhoYaku from "./TenhoYaku";
import ChihoYaku from "./ChihoYaku";
import DaisushiYaku from "./DaisushiYaku";
import ShosushiYaku from "./ShosushiYaku";
import RyuisoYaku from "./RyuisoYaku";
import DasixingYaku from "./DasixingYaku";
import WufaLvyiseYaku from "./WufaLvyiseYaku";
import ChurenpotoYaku from "./ChurenpotoYaku";
import ChurenpotoZhenzhengYaku from "./ChurenpotoZhenzhengYaku";
import YakuhaiYaku from "./YakuhaiYaku";
import SanshokuDoukouYaku from "./SanshokuDoukouYaku";
import TutorialYaku from "./TutorialYaku";

export default class YakuFactory {
    private static instance: YakuFactory;
    
    public static getInstance(): YakuFactory {
        if (!this.instance) {
            this.instance = new YakuFactory();
        }
        return this.instance;
    }
    
    public getYaku(yakuType: string): BaseYaku {
        switch (yakuType) {
            case ENUM_MAHJONG_YAKU.JIAOXUE:
                return new TutorialYaku();
            case ENUM_MAHJONG_YAKU.TANYAO:
                return new TanyaoYaku();
            case ENUM_MAHJONG_YAKU.PINFU:
                return new PinfuYaku();
            case ENUM_MAHJONG_YAKU.IPEKO:
                return new IpekoYaku();
            case ENUM_MAHJONG_YAKU.YAKUHAI:
                return new YakuhaiYaku();
            case ENUM_MAHJONG_YAKU.TOITOI:
                return new ToitoiYaku();
            case ENUM_MAHJONG_YAKU.CHITOITSU:
                return new ChitoitsuYaku();
            case ENUM_MAHJONG_YAKU.SANSHOKU:
                return new SanshokuYaku();
            case ENUM_MAHJONG_YAKU.ITTSU:
                return new IttsYaku();
            case ENUM_MAHJONG_YAKU.CHANTA:
                return new ChantaYaku();
            case ENUM_MAHJONG_YAKU.HONITSU:
                return new HonitsuYaku();
            case ENUM_MAHJONG_YAKU.CHINITSU:
                return new ChiNitsuYaku();
            case ENUM_MAHJONG_YAKU.RYANPEKO:
                return new RyanpekoYaku();
            case ENUM_MAHJONG_YAKU.TSUISO:
                return new TsuisoYaku();
            case ENUM_MAHJONG_YAKU.CHINROTO:
                return new ChinrotoYaku();
            case ENUM_MAHJONG_YAKU.SANSHOKU_KOKU:
                return new SanshokuDoukouYaku();
            case ENUM_MAHJONG_YAKU.YISE_SANTOUSU:
                return new YiseSantousuYaku();
            case ENUM_MAHJONG_YAKU.YISE_SISANTOUSU:
                return new YiseSisantousuYaku();
            case ENUM_MAHJONG_YAKU.HONGKONG:
                return new HongKongYaku();
            case ENUM_MAHJONG_YAKU.HONGYI_DIAN:
                return new HongyiDianYaku();
            case ENUM_MAHJONG_YAKU.HEIYI_SE:
                return new HeiyiSeYaku();
            case ENUM_MAHJONG_YAKU.DACHELUN:
                return new DachelunYaku();
            case ENUM_MAHJONG_YAKU.SHISANBUDA:
                return new ShisanbudaYaku();
            case ENUM_MAHJONG_YAKU.DASHULIN:
                return new DashulinYaku();
            case ENUM_MAHJONG_YAKU.DADALIN:
                return new DadalinYaku();
            case ENUM_MAHJONG_YAKU.BAIWANSHI:
                return new BaiwanshiYaku();
            case ENUM_MAHJONG_YAKU.DONGBEI_XINGANXIAN:
                return new DongbeiXinganxianYaku();
            case ENUM_MAHJONG_YAKU.JINMENQIAO:
                return new JinmenqiaoYaku();
            case ENUM_MAHJONG_YAKU.WUMENQI:
                return new WumenqiYaku();
            case ENUM_MAHJONG_YAKU.SANSEITSU:
                return new SanseitsuYaku();
            case ENUM_MAHJONG_YAKU.SANANKO:
                return new SanankoYaku();
            case ENUM_MAHJONG_YAKU.SANKANTSU:
                return new SankantsuYaku();
            case ENUM_MAHJONG_YAKU.SANLIANKE:
                return new SanliankeYaku();
            case ENUM_MAHJONG_YAKU.SISANLIANKE:
                return new SisanliankeYaku();
            case ENUM_MAHJONG_YAKU.JUNCHAN:
                return new JunchanYaku();
            case ENUM_MAHJONG_YAKU.HONROTO:
                return new HonrotoYaku();
            case ENUM_MAHJONG_YAKU.SHOSANGEN:
                return new ShosangenYaku();
            case ENUM_MAHJONG_YAKU.DAISANGEN:
                return new DaisangenYaku();
            case ENUM_MAHJONG_YAKU.KOKUSHI:
                return new KokushiYaku();
            case ENUM_MAHJONG_YAKU.KOKUSHI_SHISANMIAN:
                return new KokushiShisanmianYaku();
            case ENUM_MAHJONG_YAKU.SUANKO:
                return new SuankoYaku();
            case ENUM_MAHJONG_YAKU.SUANKO_DANQI:
                return new SuankoDanqiYaku();
            case ENUM_MAHJONG_YAKU.SUKANTSU:
                return new SukantsuYaku();
            case ENUM_MAHJONG_YAKU.TENHO:
                return new TenhoYaku();
            case ENUM_MAHJONG_YAKU.CHIHO:
                return new ChihoYaku();
            case ENUM_MAHJONG_YAKU.DAISUSHI:
                return new DaisushiYaku();
            case ENUM_MAHJONG_YAKU.SHOSUSHI:
                return new ShosushiYaku();
            case ENUM_MAHJONG_YAKU.RYUISO:
                return new RyuisoYaku();
            case ENUM_MAHJONG_YAKU.DASIXING:
                return new DasixingYaku();
            case ENUM_MAHJONG_YAKU.WUFA_LVYISE:
                return new WufaLvyiseYaku();
            case ENUM_MAHJONG_YAKU.CHURENPOTO:
                return new ChurenpotoYaku();
            case ENUM_MAHJONG_YAKU.CHURENPOTO_ZHENZHENG:
                return new ChurenpotoZhenzhengYaku();

            default:
                console.error(`未知的役种: ${yakuType}`);
                return null;
        }
    }
    
    public checkYaku(yakuType: string, tiles: Chess[]): boolean {
        const yaku = this.getYaku(yakuType);
        if (!yaku) {
            console.error(`未知的役种: ${yakuType}`);
            return false;
        }
        return yaku.check(tiles);
    }
} 