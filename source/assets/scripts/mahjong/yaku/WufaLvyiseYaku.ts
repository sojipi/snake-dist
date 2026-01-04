import Chess from "../../game/Chess";
import BaseYaku from "./BaseYaku";

export default class WufaLvyiseYaku extends BaseYaku {
    check(tiles: Chess[]): boolean {
        console.log("检查无发绿一色役...");
        
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
        
        // 无发绿一色：只包含条子23468，不包含发
        
        // 绿色牌的ID（条子23468）
        const greenTiles = [11, 12, 13, 15, 17]; // 条子2、3、4、6、8
        
        for (const tile of tiles) {
            const num = tile.num;
            
            // 检查是否为绿色牌
            if (!greenTiles.includes(num)) {
                console.log(`发现非绿色牌: ${num}`);
                return false;
            }
        }
        
        console.log("所有牌都是绿色牌（条子23468），符合无发绿一色要求");
        return true;
    }

    generateTiles(count: number): number[] {
        console.log("生成无发绿一色役牌型...");
        
        // 定义绿色牌（条子23468）
        const greenTiles = [11, 12, 13, 15, 17]; // 条子2、3、4、6、8
        
        // 定义其他牌
        const otherTiles = [];
        for (let i = 1; i <= 9; i++) {
            if (i !== 2 && i !== 3 && i !== 4 && i !== 6 && i !== 8) {
                otherTiles.push(i);      // 饼子1、5、7、9
                otherTiles.push(i + 9);  // 条子1、5、7、9
                otherTiles.push(i + 21); // 万子1-9
            }
        }
        
        // 生成牌型
        const tiles: number[] = [];
        
        // 生成绿色牌（70%的概率）
        for (let i = 0; i < count; i++) {
            if (Math.random() < 0.6) {
                const randomIndex = Math.floor(Math.random() * greenTiles.length);
                tiles.push(greenTiles[randomIndex]);
            } else {
                // 生成其他牌（30%的概率）
                const randomIndex = Math.floor(Math.random() * otherTiles.length);
                tiles.push(otherTiles[randomIndex]);
            }
        }
        
        console.log(`生成无发绿一色役牌型完成，共${tiles.length}张牌`);
        return tiles;
    }
} 