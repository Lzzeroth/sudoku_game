// 主入口文件
import { GameManager } from './game.js';
import { UIManager } from './ui.js';
import { BackgroundAnimation } from './background.js';
import { AdManager } from './ad-manager.js';
import { MemoryGameManager } from './memory-sudoku.js';
import { KillerGameManager } from './killer-sudoku.js';
import { getModalManager } from './modal.js';
import { toast } from './toast.js';

class SudokuApp {
    constructor() {
        this.game = new GameManager();
        this.memoryGame = new MemoryGameManager();
        this.killerGame = new KillerGameManager();
        this.ui = new UIManager(this);
        this.adManager = new AdManager(this.game, this.memoryGame);
        this.adManager.setKillerGame(this.killerGame); // 设置杀手数独游戏实例
        this.background = null;
        this.currentMode = 'classic'; // 'classic', 'memory', 'killer'
        this.modal = getModalManager(); // 初始化模态弹窗管理器
        
        // 将app实例挂载到window，供adManager使用
        window.app = this;
        
        this.init();
    }

    init() {
        // 初始化背景动画
        this.background = new BackgroundAnimation('backgroundCanvas');
        
        // 显示主菜单
        this.ui.showScreen('mainMenu');
        
        // 绑定事件监听器
        this.bindEvents();
        
        // 添加键盘支持
        this.addKeyboardSupport();
    }

    bindEvents() {
        // 主菜单按钮
        const quickGameBtn = document.getElementById('quickGameBtn');
        const levelModeBtn = document.getElementById('levelModeBtn');
        const historyBtn = document.getElementById('historyBtn');
        
        if (quickGameBtn) {
            quickGameBtn.addEventListener('click', () => {
                this.ui.showScreen('difficultyMenu');
            });
        }
        
        if (levelModeBtn) {
            levelModeBtn.addEventListener('click', () => {
                this.ui.renderLevelGrid();
                this.ui.showScreen('levelMenu');
            });
        }
        
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                this.ui.renderHistory();
                this.ui.showScreen('historyScreen');
            });
        }
        
        // 创意模式按钮
        const creativeModeBtn = document.getElementById('creativeModeBtn');
        if (creativeModeBtn) {
            creativeModeBtn.addEventListener('click', () => {
                this.ui.showScreen('creativeModeMenu');
            });
        }
        
        // 记忆盲解按钮
        const memoryModeBtn = document.getElementById('memoryModeBtn');
        if (memoryModeBtn) {
            memoryModeBtn.addEventListener('click', () => {
                this.ui.showScreen('memoryDifficultyMenu');
            });
        }
        
        // 杀手数独按钮
        const killerModeBtn = document.getElementById('killerModeBtn');
        if (killerModeBtn) {
            killerModeBtn.addEventListener('click', () => {
                this.ui.showScreen('killerDifficultyMenu');
            });
        }
        
        // 游戏说明按钮
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelp();
            });
        }
        
        // 难度选择按钮
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                this.startQuickGame(difficulty);
            });
        });
        
        // 记忆盲解难度选择按钮
        const memoryDifficultyBtns = document.querySelectorAll('.memory-difficulty-btn');
        memoryDifficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.memoryDifficulty;
                this.startMemoryGame(difficulty);
            });
        });
        
        // 杀手数独难度选择按钮
        const killerDifficultyBtns = document.querySelectorAll('.killer-difficulty-btn');
        killerDifficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.killerDifficulty;
                this.startKillerGame(difficulty);
            });
        });
        
        // 返回按钮
        const backFromDifficulty = document.getElementById('backFromDifficulty');
        const backFromLevels = document.getElementById('backFromLevels');
        const backFromHistory = document.getElementById('backFromHistory');
        const backFromCreativeMode = document.getElementById('backFromCreativeMode');
        const backFromMemoryDifficulty = document.getElementById('backFromMemoryDifficulty');
        const backFromKillerDifficulty = document.getElementById('backFromKillerDifficulty');
        const backToMenu = document.getElementById('backToMenu');
        const backToMenuFromComplete = document.getElementById('backToMenuFromComplete');
        
        if (backFromDifficulty) {
            backFromDifficulty.addEventListener('click', () => {
                this.ui.showScreen('mainMenu');
            });
        }
        
        if (backFromLevels) {
            backFromLevels.addEventListener('click', () => {
                this.ui.showScreen('mainMenu');
            });
        }
        
        if (backFromHistory) {
            backFromHistory.addEventListener('click', () => {
                this.ui.showScreen('mainMenu');
            });
        }
        
        if (backFromCreativeMode) {
            backFromCreativeMode.addEventListener('click', () => {
                this.ui.showScreen('mainMenu');
            });
        }
        
        if (backFromMemoryDifficulty) {
            backFromMemoryDifficulty.addEventListener('click', () => {
                this.ui.showScreen('creativeModeMenu');
            });
        }
        
        if (backFromKillerDifficulty) {
            backFromKillerDifficulty.addEventListener('click', () => {
                this.ui.showScreen('creativeModeMenu');
            });
        }
        
        // 关闭游戏说明
        const closeHelp = document.getElementById('closeHelp');
        if (closeHelp) {
            closeHelp.addEventListener('click', () => {
                this.hideHelp();
            });
        }
        
        if (backToMenu) {
            backToMenu.addEventListener('click', () => {
                // 根据当前模式停止对应的计时器
                if (this.currentMode === 'memory') {
                    this.memoryGame.stopTimer();
                    this.memoryGame.stopMemoryTimer();
                } else if (this.currentMode === 'killer') {
                    this.killerGame.stopTimer();
                } else {
                    this.game.stopTimer();
                }
                this.ui.showScreen('mainMenu');
            });
        }
        
        if (backToMenuFromComplete) {
            backToMenuFromComplete.addEventListener('click', () => {
                // 根据当前模式停止对应的计时器
                if (this.currentMode === 'memory') {
                    this.memoryGame.stopTimer();
                    this.memoryGame.stopMemoryTimer();
                } else if (this.currentMode === 'killer') {
                    this.killerGame.stopTimer();
                } else {
                    this.game.stopTimer();
                }
                this.hideCompleteOverlay();
                this.ui.showScreen('mainMenu');
            });
        }
        
        // 游戏控制按钮
        const hintBtn = document.getElementById('hintBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');
        const newGameBtn = document.getElementById('newGameBtn');
        const eraseBtn = document.getElementById('eraseBtn');
        
        if (hintBtn) {
            hintBtn.addEventListener('click', async () => {
                // 如果提示用完，显示广告弹窗
                if (this.adManager.canWatchAdForHint()) {
                    const result = await this.modal.adConfirm('hint');
                    if (result) {
                        this.adManager.show('hint');
                    }
                } else {
                    this.ui.showHint();
                }
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pauseGame();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', async () => {
                const result = await this.modal.restartConfirm();
                if (result) {
                    this.restartGame();
                }
            });
        }
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', async () => {
                const result = await this.modal.newGameConfirm();
                if (result) {
                    if (this.currentMode === 'memory') {
                        this.startMemoryGame(this.memoryGame.difficulty);
                    } else if (this.currentMode === 'killer') {
                        this.startKillerGame(this.killerGame.difficulty);
                    } else {
                        this.startQuickGame(this.game.difficulty);
                    }
                }
            });
        }
        
        if (eraseBtn) {
            eraseBtn.addEventListener('click', () => {
                if (this.currentMode === 'memory') {
                    this.eraseMemoryCell();
                } else {
                    this.ui.eraseSelectedCell();
                }
            });
        }
        
        // 监听广告奖励事件，更新UI
        document.addEventListener('adRewardEarned', (e) => {
            const { rewardType } = e.detail;
            
            if (rewardType === 'hint') {
                // 根据当前游戏模式更新对应的UI
                if (this.currentMode === 'killer') {
                    this.ui.updateKillerGameInfo(this.killerGame);
                } else {
                    this.ui.updateGameInfo();
                }
            } else if (rewardType === 'flip') {
                this.ui.updateMemoryGameInfo(this.memoryGame);
            }
        });
        
        // 监听记忆阶段结束事件
        document.addEventListener('memoryPhaseEnd', () => {
            this.ui.renderMemoryBoard(this.memoryGame);
            this.ui.updateMemoryGameInfo(this.memoryGame);
        });
        
        // 暂停和完成遮罩按钮
        const resumeBtn = document.getElementById('resumeBtn');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.resumeGame();
            });
        }
        
        if (nextLevelBtn) {
            nextLevelBtn.addEventListener('click', () => {
                this.nextLevel();
            });
        }
        
        // 重写游戏完成回调
        const originalOnComplete = this.game.onGameComplete.bind(this.game);
        this.game.onGameComplete = () => {
            originalOnComplete();
            this.ui.showCompleteAnimation();
        };
        
        // 记忆盲解游戏完成回调
        const originalMemoryOnComplete = this.memoryGame.onGameComplete.bind(this.memoryGame);
        this.memoryGame.onGameComplete = () => {
            originalMemoryOnComplete();
            this.ui.showCompleteAnimation();
        };
        
        // 杀手数独游戏完成回调
        const originalKillerOnComplete = this.killerGame.onGameComplete.bind(this.killerGame);
        this.killerGame.onGameComplete = () => {
            originalKillerOnComplete();
            this.ui.showCompleteAnimation();
        };
    }

    // 添加键盘支持
    addKeyboardSupport() {
        document.addEventListener('keydown', (e) => {
            // 根据当前模式获取正确的游戏实例
            let currentGame = this.game;
            if (this.currentMode === 'memory') {
                currentGame = this.memoryGame;
            } else if (this.currentMode === 'killer') {
                currentGame = this.killerGame;
            }
            
            if (currentGame.isPaused) return;
            if (!currentGame.selectedCell) return;
            
            const key = e.key;
            
            // 数字键1-9
            if (key >= '1' && key <= '9') {
                const num = parseInt(key);
                this.ui.onNumberClick(num);
            }
            
            // 删除键或退格键
            if (key === 'Delete' || key === 'Backspace') {
                e.preventDefault();
                if (this.currentMode === 'memory') {
                    this.eraseMemoryCell();
                } else {
                    this.ui.eraseSelectedCell();
                }
            }
            
            // 方向键移动选择
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                e.preventDefault();
                this.moveSelection(key);
            }
        });
    }

    // 移动选择
    moveSelection(direction) {
        // 根据当前模式获取正确的游戏实例和棋盘大小
        let currentGame = this.game;
        let maxSize = 8; // 9x9棋盘的最大索引
        
        if (this.currentMode === 'memory') {
            currentGame = this.memoryGame;
            maxSize = currentGame.size - 1;
        } else if (this.currentMode === 'killer') {
            currentGame = this.killerGame;
        }
        
        if (!currentGame.selectedCell) return;
        
        let { row, col } = currentGame.selectedCell;
        
        switch (direction) {
            case 'ArrowUp':
                row = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                row = Math.min(maxSize, row + 1);
                break;
            case 'ArrowLeft':
                col = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                col = Math.min(maxSize, col + 1);
                break;
        }
        
        // 根据模式调用不同的点击处理
        if (this.currentMode === 'memory') {
            this.ui.onMemoryCellClick(row, col, this.memoryGame);
        } else {
            this.ui.onCellClick(row, col);
        }
    }

    // 开始快速游戏
    startQuickGame(difficulty) {
        this.currentMode = 'classic';
        this.game.gameMode = 'quick';
        this.game.startNewGame(difficulty);
        this.ui.showScreen('gameScreen');
        this.ui.renderBoard();
        this.ui.renderNumberPad();
        this.ui.updateGameInfo();
        
        // 隐藏创意模式的UI元素
        this.hideCreativeModeUI();
    }

    // 开始记忆盲解游戏
    startMemoryGame(difficulty) {
        this.currentMode = 'memory';
        this.memoryGame.startNewGame(difficulty);
        this.ui.showScreen('gameScreen');
        this.ui.renderMemoryBoard(this.memoryGame);
        this.ui.renderNumberPad(this.memoryGame.size); // 根据棋盘大小渲染数字键盘
        this.ui.updateMemoryGameInfo(this.memoryGame);
        
        // 显示记忆模式的UI元素
        this.showMemoryModeUI();
    }

    // 开始杀手数独游戏
    startKillerGame(difficulty) {
        this.currentMode = 'killer';
        this.killerGame.startNewGame(difficulty);
        this.ui.showScreen('gameScreen');
        this.ui.renderKillerBoard(this.killerGame);
        this.ui.renderNumberPad();
        this.ui.updateKillerGameInfo(this.killerGame);
        
        // 隐藏创意模式的UI元素
        this.hideCreativeModeUI();
    }

    // 显示记忆模式UI
    showMemoryModeUI() {
        const memoryTimerDisplay = document.getElementById('memoryTimerDisplay');
        const flipCardsDisplay = document.getElementById('flipCardsDisplay');
        const hintsDisplay = document.getElementById('hintsDisplay');
        const hintBtn = document.getElementById('hintBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (memoryTimerDisplay) memoryTimerDisplay.classList.remove('hidden');
        if (flipCardsDisplay) flipCardsDisplay.classList.remove('hidden');
        if (hintsDisplay) hintsDisplay.classList.add('hidden');
        
        // 隐藏提示和重新开始按钮
        if (hintBtn) hintBtn.classList.add('hidden');
        if (restartBtn) restartBtn.classList.add('hidden');
    }

    // 隐藏创意模式UI
    hideCreativeModeUI() {
        const memoryTimerDisplay = document.getElementById('memoryTimerDisplay');
        const flipCardsDisplay = document.getElementById('flipCardsDisplay');
        const hintsDisplay = document.getElementById('hintsDisplay');
        const hintBtn = document.getElementById('hintBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (memoryTimerDisplay) memoryTimerDisplay.classList.add('hidden');
        if (flipCardsDisplay) flipCardsDisplay.classList.add('hidden');
        if (hintsDisplay) hintsDisplay.classList.remove('hidden');
        
        // 显示提示和重新开始按钮
        if (hintBtn) hintBtn.classList.remove('hidden');
        if (restartBtn) restartBtn.classList.remove('hidden');
    }

    // 暂停游戏
    pauseGame() {
        if (this.currentMode === 'memory') {
            this.memoryGame.pauseGame();
        } else if (this.currentMode === 'killer') {
            this.killerGame.pauseGame();
        } else {
            this.game.pauseGame();
        }
        
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    // 继续游戏
    resumeGame() {
        if (this.currentMode === 'memory') {
            this.memoryGame.resumeGame();
        } else if (this.currentMode === 'killer') {
            this.killerGame.resumeGame();
        } else {
            this.game.resumeGame();
        }
        
        const overlay = document.getElementById('pauseOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // 重新开始游戏
    restartGame() {
        // 隐藏暂停遮罩层（如果显示的话）
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay) {
            pauseOverlay.classList.add('hidden');
        }
        
        if (this.currentMode === 'memory') {
            this.memoryGame.restart();
            this.ui.renderMemoryBoard(this.memoryGame);
            this.ui.updateMemoryGameInfo(this.memoryGame);
        } else if (this.currentMode === 'killer') {
            this.killerGame.restart();
            this.ui.renderKillerBoard(this.killerGame);
            this.ui.updateKillerGameInfo(this.killerGame);
        } else {
            this.game.restart();
            this.ui.renderBoard();
            this.ui.updateGameInfo();
        }
    }

    // 下一关/新游戏
    nextLevel() {
        this.hideCompleteOverlay();
        
        // 关卡模式：进入下一关
        if (this.game.gameMode === 'level' && this.game.currentLevel) {
            const nextLevel = this.game.currentLevel + 1;
            if (nextLevel <= 50) {
                this.ui.onLevelClick(nextLevel);
            } else {
                // 完成所有关卡，确保停止计时器
                this.game.stopTimer();
                toast.success('🎉 恭喜你完成了所有关卡！', { duration: 4000 });
                this.ui.showScreen('mainMenu');
            }
        } 
        // 创意模式：开始新游戏
        else if (this.currentMode === 'memory') {
            this.startMemoryGame(this.memoryGame.difficulty);
        } 
        else if (this.currentMode === 'killer') {
            this.startKillerGame(this.killerGame.difficulty);
        } 
        // 快速游戏模式：开始新游戏
        else {
            this.startQuickGame(this.game.difficulty);
        }
    }

    // 隐藏完成遮罩
    hideCompleteOverlay() {
        const overlay = document.getElementById('completeOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // 显示游戏说明
    showHelp() {
        const overlay = document.getElementById('helpOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    // 隐藏游戏说明
    hideHelp() {
        const overlay = document.getElementById('helpOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // 擦除记忆模式选中格子
    eraseMemoryCell() {
        if (!this.memoryGame.selectedCell) return;
        
        const { row, col } = this.memoryGame.selectedCell;
        if (this.memoryGame.isCellFixed(row, col)) return;
        
        this.memoryGame.setCellValue(row, col, 0);
        this.ui.updateMemoryCell(row, col, this.memoryGame);
        this.ui.checkMemoryConflicts(this.memoryGame);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new SudokuApp();
});