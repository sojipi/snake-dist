import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class JunchanYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查纯全带幺九役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 获取所有可能的和牌形式
        const results = this.checkAllStandardForms(tiles);
        if (results.length === 0) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 遍历所有可能的和牌形式
        for (const result of results) {
            // 创建不包含雀头的牌组
            const remainingTiles = tiles.filter((_, index) => 
                index !== result.pairIndex && index !== result.pairIndex + 1);
            
            // 检查是否有字牌
            for (const tile of tiles) {
                const num = tile.num;
                if (this.isHonor(num)) {
                    console.log("发现字牌，不符合纯全带幺九要求");
                    return false;
                }
            }
            
            // 检查雀头是否为幺九牌
            const pairTile1 = tiles[result.pairIndex];
            const pairTile2 = tiles[result.pairIndex + 1];
            const pairNum1 = pairTile1.num;
            
            if (!this.isTerminal(pairNum1)) {
                console.log(`雀头不是幺九牌: ${pairNum1}`);
                continue;
            }
            
            // 检查每组面子是否包含幺九牌
            let allMentsuContainTerminal = true;
            
            // 遍历所有面子
            for (const set of result.sets) {
                // 检查这个面子是否包含幺九牌
                let containsTerminal = false;
                for (const tileNum of set) {
                    if (this.isTerminal(tileNum)) {
                        containsTerminal = true;
                        break;
                    }
                }
                
                if (!containsTerminal) {
                    allMentsuContainTerminal = false;
                    break;
                }
            }
            
            if (allMentsuContainTerminal) {
                console.log("符合纯全带幺九要求");
                return true;
            }
        }
        
        console.log("未找到符合纯全带幺九要求的和牌形式");
        return false;
    }


    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 纯全带幺九需要每个面子都包含幺九牌（1、9），且不能包含字牌
        const terminalTiles = [
            1, 9,      // 饼子的1和9
            10, 18,    // 条子的1和9
            22, 30     // 万子的1和9
        ];
        
        const middleTiles = [
            2, 3, 4, 5, 6, 7, 8,           // 饼子的2-8
            11, 12, 13, 14, 15, 16, 17,     // 条子的2-8
            23, 24, 25, 26, 27, 28, 29      // 万子的2-8
        ];
        
        // 首先确保有一对幺九牌作为雀头
        const pairTerminal = terminalTiles[Math.floor(Math.random() * terminalTiles.length)];
        numArr.push(pairTerminal, pairTerminal);
        
        // 生成四个面子，每个面子都包含幺九牌
        for (let i = 0; i < 4; i++) {
            const set = [];
            // 随机选择一个幺九牌
            const terminal = terminalTiles[Math.floor(Math.random() * terminalTiles.length)];
            set.push(terminal);
            
            // 添加两个中间数字的牌
            const middle1 = middleTiles[Math.floor(Math.random() * middleTiles.length)];
            const middle2 = middleTiles[Math.floor(Math.random() * middleTiles.length)];
            set.push(middle1, middle2);
            
            numArr.push(...set);
        }
        
        // 生成其他牌（确保不全是幺九牌）
        const remainingCount = count - numArr.length;
        for (let i = 0; i < remainingCount; i++) {
            // 70%的概率生成中间数字的牌，30%的概率生成幺九牌
            if (Math.random() < 0.7) {
                const randomIndex = Math.floor(Math.random() * middleTiles.length);
                numArr.push(middleTiles[randomIndex]);
            } else {
                const randomIndex = Math.floor(Math.random() * terminalTiles.length);
                numArr.push(terminalTiles[randomIndex]);
            }
        }
        
        return numArr;
    }
}