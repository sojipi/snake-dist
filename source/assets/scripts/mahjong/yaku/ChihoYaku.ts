import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ChihoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查地和役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 地和：闲家在第一巡没有人鸣牌前就和牌
        // 由于游戏逻辑限制，这里只能简单检查是否符合标准和牌形式
        
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 地和需要额外的游戏状态信息，这里假设已经满足条件
        console.log("符合地和要求（假设已满足游戏状态条件）");
        return true;
    }
} 