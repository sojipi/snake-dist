import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class BaiwanshiYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查百万石役...");
        
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

        // 检查是否全是万子
        for (const tile of tiles) {
            if (tile.num < 22 || tile.num > 30) {
                console.log(`发现非万子牌: ${tile.num}`);
                return false;
            }
        }

        // 计算数牌之和
        let sum = 0;
        for (const tile of tiles) {
            const value = tile.num - 21; // 转换为1-9的值
            sum += value;
        }

        if (sum < 100) {
            console.log(`数牌之和不足100，当前: ${sum}`);
            return false;
        }

        console.log("符合百万石役");
        return true;
    }

    generateTiles(count: number): number[] {
        console.log("生成百万石役牌型...");
        
        // 定义万子的数字（1-9）
        const validNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // 生成牌型，确保数牌之和大于等于100
        const tiles: number[] = [];
        let sum = 0;
        
        // 首先生成一些高数值的牌，确保和数足够大
        const highNumbers = [7, 8, 9];
        for (let i = 0; i < 24; i++) {
            const num = highNumbers[Math.floor(Math.random() * highNumbers.length)];
            const tileNum = num + 21; // 转换为万子编号
            tiles.push(tileNum);
            sum += num;
        }
        
        // 继续生成剩余的牌，确保和数大于等于100
        while (tiles.length < count) {
            // 如果和数已经足够，有30%的概率生成其他花色的牌
            if (sum >= 100 && Math.random() < 0.3) {
                // 定义其他花色的牌
                const otherTiles = [
                    // 饼子 1-9
                    ...Array.from({length: 9}, (_, i) => i + 1),
                    // 条子 10-18
                    ...Array.from({length: 9}, (_, i) => i + 10),
                    // 字牌 19-34
                    ...Array.from({length: 16}, (_, i) => i + 19)
                ];
                
                // 随机选择一个其他花色的牌
                const randomIndex = Math.floor(Math.random() * otherTiles.length);
                tiles.push(otherTiles[randomIndex]);
            } else {
                // 生成万子
                const num = validNumbers[Math.floor(Math.random() * validNumbers.length)];
                const tileNum = num + 21; // 转换为万子编号
                
                // 如果当前和数小于100，优先选择高数值的牌
                if (sum < 100) {
                    if (num >= 4) {
                        tiles.push(tileNum);
                        sum += num;
                    }
                } else {
                    // 和数已经足够，可以随机选择
                    tiles.push(tileNum);
                    sum += num;
                }
            }
        }
        
        console.log(`生成百万石役牌型完成，共${tiles.length}张牌，数牌之和: ${sum}`);
        return tiles;
    }

    private checkBasicHu(tiles: Chess[]): boolean {
        // 检查是否有雀头
        const countMap = new Map<number, number>();
        for (const tile of tiles) {
            countMap.set(tile.num, (countMap.get(tile.num) || 0) + 1);
        }
        
        let hasPair = false;
        for (const count of countMap.values()) {
            if (count >= 2) {
                hasPair = true;
                break;
            }
        }
        
        if (!hasPair) {
            console.log("没有雀头");
            return false;
        }
        
        return true;
    }
} 