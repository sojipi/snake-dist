import { Node } from 'cc';

/**
 * 目标提供者接口，用于解决AI系统的循环依赖问题
 */
export interface ITargetProvider {
    /**
     * 获取所有可用的麻将牌节点
     */
    getAllTileNodes(): Node[];
    
    /**
     * 获取玩家蛇头节点
     */
    getPlayerSnakeHead(): Node | null;
    
    /**
     * 获取所有AI角色节点
     */
    getAllAICharacters(): Node[];
}

/**
 * 获取目标提供者实例的函数类型
 */
export type GetTargetProvider = () => ITargetProvider | null;
