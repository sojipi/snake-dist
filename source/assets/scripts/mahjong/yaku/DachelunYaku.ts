import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class DachelunYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查大车轮役...");
        
        // 如果手牌数量不是14张，无法和牌
        if (tiles.length !== 14) {
            console.log(`手牌数量不是14张，当前: ${tiles.length}张`);
            return false;
        }
        
        // 检查是否为七对子
        const result = this.checkChitoitsu(tiles);
        if (!result.valid) {
            console.log("不符合七对子形式");
            return false;
        }
        
        // 检查是否只包含筒子2-8
        const validNumbers = new Set([2, 3, 4, 5, 6, 7, 8]); // 筒子2-8
        
        // 遍历所有牌
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            const num = tile.num;
            
            // 获取牌的数字和花色
            let value, suit;
            
            // 根据编号判断花色和数字
            if (num >= 1 && num <= 9) {
                // 饼子
                value = num;
                suit = 0;
            } else if (num >= 10 && num <= 18) {
                // 条子
                value = num - 9;
                suit = 1;
            } else if (num >= 22 && num <= 30) {
                // 万子
                value = num - 21;
                suit = 2;
            } else {
                // 字牌，不符合大车轮
                console.log(`包含字牌: ${num}`);
                return false;
            }
            
            // 检查是否为饼子
            if (suit !== 0) {
                console.log(`包含非饼子牌: 数字${value}, 花色${suit}`);
                return false;
            }
            
            // 检查是否为2-8
            if (!validNumbers.has(value)) {
                console.log(`包含非2-8的饼子: ${value}`);
                return false;
            }
        }
        
        console.log("符合大车轮役");
        return true;
    }

    generateTiles(count: number): number[] {
        console.log("生成大车轮役牌型...");
        
        // 定义可用的饼子数字（2-8）
        const validNumbers = [2, 3, 4, 5, 6, 7, 8];
        
        // 生成七对子，每个数字生成4张牌（2对）
        const tiles: number[] = [];
        
        // 固定使用2-8饼作为七对子
        for (let i = 0; i < validNumbers.length; i++) {
            const num = validNumbers[i];
            // 饼子的编号是1-9，所以直接使用num
            const tileNum = num;
            
            // 每个数字生成4张牌
            for (let j = 0; j < 6; j++) {
                tiles.push(tileNum);
            }
        }
        
        // 补充剩余的牌
        const remainingCount = count - tiles.length;
        if (remainingCount > 0) {
            // 定义其他花色的牌
            const otherTiles = [
                // 条子 10-18
                ...Array.from({length: 9}, (_, i) => i + 10),
                // 万子 22-30
                ...Array.from({length: 9}, (_, i) => i + 22),
                // 字牌 19-34
                ...Array.from({length: 16}, (_, i) => i + 19)
            ];
            
            // 从其他花色中随机选择补充
            for (let i = 0; i < remainingCount; i++) {
                const randomIndex = Math.floor(Math.random() * otherTiles.length);
                tiles.push(otherTiles[randomIndex]);
            }
        }
        
        console.log(`生成大车轮役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }
} 