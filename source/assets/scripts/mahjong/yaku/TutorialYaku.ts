import Chess from "../../game/Chess";
import BaseYaku, { StandardFormResult } from "./BaseYaku";

/**
 * 教学关卡使用的胡牌检查类
 * 继承自BaseYaku，用于检查基本胡牌规则（标准形式或七对子）
 */
export default class TutorialYaku extends BaseYaku {
    // 教学关卡不使用特定役种检查
    check(tiles: Chess[]): boolean {
        // 检查标准形式（4面子+1雀头）
        const standardFormResult = this.checkStandardForm(tiles);
        if (standardFormResult.valid) {
            console.log("TutorialYaku: 满足标准和牌形式");
            return true;
        }
        
        // 检查七对子
        const chitoitsuResult = this.checkChitoitsu(tiles);
        if (chitoitsuResult.valid) {
            console.log("TutorialYaku: 满足七对子形式");
            return true;
        }
        
        console.log("TutorialYaku: 不满足任何基本胡牌形式");
        return false;
    }
    
    // 教学关卡不需要生成特定役种的牌型
    generateTiles(count: number): number[] {
        return [];
    }
    
    // 公开方法，供外部调用检查标准形式
    public checkStandardFormPublic(tiles: Chess[]): StandardFormResult {
        return this.checkStandardForm(tiles);
    }
    
    // 公开方法，供外部调用检查七对子
    public checkChitoitsuPublic(tiles: Chess[]): { valid: boolean } {
        return this.checkChitoitsu(tiles);
    }
}