import { _decorator, Component, Node, UITransform, Canvas } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UILayoutManager')
export class UILayoutManager extends Component {
    private canvas: Node = null!;
    
    public initialize(canvas: Node) {
        this.canvas = canvas;
        this.setupCanvasForUI();
        this.setupControlLayerElements();
    }
    
    private setupCanvasForUI() {
        const canvasComponent = this.canvas.getComponent(Canvas);
        if (canvasComponent) {
            canvasComponent.alignCanvasWithScreen = true;
            
            const mainCamera = this.node.scene?.getChildByName('Main Camera');
            if (mainCamera) {
                const cameraComponent = mainCamera.getComponent('Camera');
                if (cameraComponent) {
                    canvasComponent.cameraComponent = cameraComponent as any;
                }
            }
        }
    }
    
    private setupControlLayerElements() {
        this.setupHandCardAreaLayer();
        this.setupDirectionButtonsPosition();
    }
    
    private setupHandCardAreaLayer() {
        const handCardArea = this.findNodeByName(this.canvas, 'HandCardArea');
        if (handCardArea) {
            this.setNodeAndChildrenToLayer(handCardArea, 524288);
        }
    }
    
    private setupDirectionButtonsPosition() {
        const directionButtons = this.findNodeByName(this.canvas, 'DirectionButtons');
        if (directionButtons) {
            const canvasTransform = this.canvas.getComponent(UITransform);
            if (canvasTransform) {
                const canvasSize = canvasTransform.contentSize;
                const fixedX = -canvasSize.width / 2 + 10;
                const fixedY = -canvasSize.height / 2 + 10;
                
                directionButtons.setPosition(fixedX, fixedY, 0);
                this.setNodeAndChildrenToLayer(directionButtons, 524288);
                
                const directionTransform = directionButtons.getComponent(UITransform);
                if (directionTransform) {
                    directionTransform.setAnchorPoint(0, 0);
                }
            }
        }
    }
    
    public maintainDirectionButtonsPosition() {
        const directionButtons = this.findNodeByName(this.canvas, 'DirectionButtons');
        if (directionButtons) {
            const canvasTransform = this.canvas.getComponent(UITransform);
            if (canvasTransform) {
                const canvasSize = canvasTransform.contentSize;
                const fixedX = -canvasSize.width / 2 + 10;
                const fixedY = -canvasSize.height / 2 + 10;
                
                const currentPos = directionButtons.position;
                if (Math.abs(currentPos.x - fixedX) > 1 || Math.abs(currentPos.y - fixedY) > 1) {
                    directionButtons.setPosition(fixedX, fixedY, 0);
                }
            }
        }
    }
    
    private setNodeAndChildrenToLayer(node: Node, layer: number) {
        node.layer = layer;
        for (const child of node.children) {
            this.setNodeAndChildrenToLayer(child, layer);
        }
    }
    
    private findNodeByName(parent: Node, name: string): Node | null {
        if (parent.name === name) {
            return parent;
        }
        
        for (const child of parent.children) {
            const found = this.findNodeByName(child, name);
            if (found) {
                return found;
            }
        }
        
        return null;
    }
} 