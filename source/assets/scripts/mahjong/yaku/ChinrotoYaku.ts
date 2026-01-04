import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ChinrotoYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查清老头役...");
        
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
        
        // 清老头：所有牌都是数牌的老头牌（1和9）
        
        // 老头牌的ID
        const terminalTiles = [1, 9, 10, 18, 22, 30]; // 1饼、9饼、1条、9条、1万、9万
        
        for (const tile of tiles) {
            const num = tile.id || tile.num;
            
            // 检查是否为老头牌
            if (!terminalTiles.includes(num)) {
                console.log(`发现非老头牌: ${num}`);
                return false;
            }
        }
        
        console.log("所有牌都是幺九牌或字牌，符合清老头要求");
        return true;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 定义幺九牌和字牌
        const terminalTiles = [
            1, 9,           // 饼子1和9
            10, 18,         // 条子1和9
            22, 30          // 万子1和9
        ];
        const honorTiles = [
            19, 20, 21,     // 中发白
            31, 32, 33, 34  // 东南西北
        ];
        
        // 生成幺九牌（70%概率）
        const terminalCount = Math.floor(count * 0.7);
        for (let i = 0; i < terminalCount; i++) {
            const randomIndex = Math.floor(Math.random() * terminalTiles.length);
            numArr.push(terminalTiles[randomIndex]);
        }
        
        // 生成字牌（30%概率）
        const remainingCount = count - terminalCount;
        for (let i = 0; i < remainingCount; i++) {
            const randomIndex = Math.floor(Math.random() * honorTiles.length);
            numArr.push(honorTiles[randomIndex]);
        }
        
        return numArr;
    }
} 