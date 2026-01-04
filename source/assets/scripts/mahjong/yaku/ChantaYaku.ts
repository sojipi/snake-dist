import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class ChantaYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查混全带幺九役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 检查是否符合标准和牌形式（4组面子+1对雀头）
        const result = this.checkStandardForm(tiles);
        if (!result.valid) {
            console.log("不符合标准和牌形式");
            return false;
        }
        
        // 检查每个面子和雀头是否都包含幺九牌（1、9）或字牌（31-34）
        for (const set of result.sets) {
            // 检查这个面子是否包含幺九牌或字牌
            const hasTerminalOrHonor = set.some(tile => this.isTerminalOrHonor(tile));
            
            if (!hasTerminalOrHonor) {
                console.log(`面子 ${set} 不包含幺九牌或字牌`);
                return false;
            }
        }
        
        // 检查雀头是否包含幺九牌或字牌
        const hasTerminalOrHonorInPair = result.pair.some(tile => this.isTerminalOrHonor(tile));
        
        if (!hasTerminalOrHonorInPair) {
            console.log(`雀头 ${result.pair} 不包含幺九牌或字牌`);
            return false;
        }
        
        // 检查是否全部都是幺九牌和字牌（如果是，那就是混老头而不是混全带幺九）
        const allTerminalOrHonor = tiles.every(tile => this.isTerminalOrHonor(tile.num));
        
        if (allTerminalOrHonor) {
            console.log("所有牌都是幺九牌或字牌，这是混老头而不是混全带幺九");
            return false;
        }
        
        console.log("符合混全带幺九役的要求");
        return true;
    }
    
    generateTiles(count: number): number[] {
        const numArr: number[] = [];
        
        // 混全带幺九需要每个面子都包含幺九牌或字牌，但不能全部都是幺九牌和字牌
        const terminalTiles = [
            1, 9,      // 饼子的1和9
            10, 18,    // 条子的1和9
            22, 30     // 万子的1和9
        ];
        
        const honorTiles = [31, 32, 33, 34, 19, 20, 21];  // 字牌
        
        const middleTiles = [
            2, 3, 4, 5, 6, 7, 8,           // 饼子的2-8
            11, 12, 13, 14, 15, 16, 17,     // 条子的2-8
            23, 24, 25, 26, 27, 28, 29      // 万子的2-8
        ];
        
        // 首先确保有一对字牌
        const pairHonor = honorTiles[Math.floor(Math.random() * honorTiles.length)];
        numArr.push(pairHonor, pairHonor);
        
        // 生成一个包含幺九牌或字牌的面子
        const firstSet = [];
        // 70%概率使用字牌，30%概率使用幺九牌
        if (Math.random() < 0.7) {
            const honor = honorTiles[Math.floor(Math.random() * honorTiles.length)];
            firstSet.push(honor, honor, honor);
        } else {
            const terminal = terminalTiles[Math.floor(Math.random() * terminalTiles.length)];
            firstSet.push(terminal, terminal, terminal);
        }
        numArr.push(...firstSet);
        
        // 生成其他面子，确保每个面子都包含幺九牌或字牌
        for (let i = 0; i < 3; i++) {
            const set = [];
            // 50%概率使用字牌，50%概率使用幺九牌
            if (Math.random() < 0.5) {
                const honor = honorTiles[Math.floor(Math.random() * honorTiles.length)];
                set.push(honor, honor, honor);
            } else {
                const terminal = terminalTiles[Math.floor(Math.random() * terminalTiles.length)];
                set.push(terminal, terminal, terminal);
            }
            numArr.push(...set);
        }
        
        // 生成其他牌（确保不全是幺九牌和字牌）
        const remainingCount = count - numArr.length;
        for (let i = 0; i < remainingCount; i++) {
            // 70%的概率生成中间数字的牌，30%的概率生成幺九牌或字牌
            if (Math.random() < 0.7) {
                const randomIndex = Math.floor(Math.random() * middleTiles.length);
                numArr.push(middleTiles[randomIndex]);
            } else {
                // 在幺九牌和字牌中随机选择
                const allTerminalAndHonor = [...terminalTiles, ...honorTiles];
                const randomIndex = Math.floor(Math.random() * allTerminalAndHonor.length);
                numArr.push(allTerminalAndHonor[randomIndex]);
            }
        }
        
        return numArr;
    }
}