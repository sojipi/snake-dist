import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class SukantsuYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查四杠子役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 检查是否符合标准和牌形式
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 四杠子：四组杠子和一对雀头
        // 简化处理：由于我们没有杠子的信息，这里假设所有四张相同的牌都是杠子
        
        // 统计每种牌的数量
        const countMap = {};
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            countMap[num] = (countMap[num] || 0) + 1;
        }
        
        // 计算杠子数量
        let kangCount = 0;
        
        for (const num in countMap) {
            if (countMap[num] === 4) {
                kangCount++;
            }
        }
        
        // 四杠子：四组杠子
        if (kangCount === 4) {
            console.log("符合四杠子要求");
            return true;
        }
        
        console.log(`不符合四杠子要求，杠子数: ${kangCount}`);
        return false;
    }
} 