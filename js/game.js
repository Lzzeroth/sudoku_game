// 游戏状态管理模块
import { SudokuGenerator, SudokuSolver, SudokuValidator } from './sudoku.js';

export class GameManager {
    constructor() {
        this.currentPuzzle = null;
        this.currentSolution = null;
        this.userBoard = null;
        this.fixedCells = null;
        this.difficulty = 'medium';
        this.timer = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.hintsLeft = 5;
        this.hintsUsed = 0;
        this.selectedCell = null;
        this.gameMode = 'quick'; // 'quick' or 'level'
        this.currentLevel = 1;
        this.generator = new SudokuGenerator();
        this.solver = new SudokuSolver();
        this.adHintsEarned = 0; // 通过广告获得的提示次数
    }

    // 开始新游戏
    startNewGame(difficulty = 'medium', level = null) {
        this.difficulty = difficulty;
        this.currentLevel = level;
        
        // 先停止旧的计时器
        this.stopTimer();
        
        // 生成新题目
        const { puzzle, solution } = this.generator.generatePuzzle(difficulty);
        this.currentPuzzle = puzzle;
        this.currentSolution = solution;
        this.userBoard = JSON.parse(JSON.stringify(puzzle));
        
        // 记录固定格子
        this.fixedCells = Array(9).fill(null).map(() => Array(9).fill(false));
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (puzzle[i][j] !== 0) {
                    this.fixedCells[i][j] = true;
                }
            }
        }
        
        // 重置游戏状态
        this.timer = 0;
        this.hintsLeft = 5;
        this.hintsUsed = 0;
        this.isPaused = false;
        this.selectedCell = null;
        
        // 立即更新显示为00:00
        this.updateTimerDisplay();
        
        // 启动计时器
        this.startTimer();
    }

    // 启动计时器
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.timer++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    // 停止计时器
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // 更新计时器显示
    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = display;
        }
    }

    // 暂停游戏
    pauseGame() {
        this.isPaused = true;
    }

    // 继续游戏
    resumeGame() {
        this.isPaused = false;
    }

    // 重新开始
    restart() {
        // 先停止计时器
        this.stopTimer();
        
        this.userBoard = JSON.parse(JSON.stringify(this.currentPuzzle));
        this.timer = 0;
        this.hintsLeft = 5;
        this.hintsUsed = 0;
        this.selectedCell = null;
        this.isPaused = false;
        
        // 立即更新显示为00:00
        this.updateTimerDisplay();
        
        // 重新启动计时器
        this.startTimer();
    }

    // 设置格子的值
    setCellValue(row, col, value) {
        if (this.fixedCells[row][col]) {
            return false;
        }
        
        this.userBoard[row][col] = value;
        
        // 检查是否完成
        if (SudokuValidator.isComplete(this.userBoard)) {
            this.onGameComplete();
        }
        
        return true;
    }

    // 获取格子的值
    getCellValue(row, col) {
        return this.userBoard[row][col];
    }

    // 检查格子是否固定
    isCellFixed(row, col) {
        return this.fixedCells[row][col];
    }

    // 使用提示
    useHint() {
        if (this.hintsLeft <= 0) {
            return null;
        }
        
        // 获取最佳提示位置
        const hint = this.solver.getBestHintCell(this.userBoard);
        
        if (hint) {
            this.setCellValue(hint.row, hint.col, this.currentSolution[hint.row][hint.col]);
            this.hintsLeft--;
            this.hintsUsed++;
            
            // 更新提示显示
            const hintsElement = document.getElementById('hintsLeft');
            if (hintsElement) {
                hintsElement.textContent = this.hintsLeft;
            }
            
            return hint;
        }
        
        return null;
    }

    // 验证当前输入
    validateCell(row, col) {
        const value = this.userBoard[row][col];
        if (value === 0) return true;
        
        return SudokuValidator.isValidPlacement(this.userBoard, row, col, value);
    }

    // 获取冲突的格子
    getConflicts(row, col) {
        return SudokuValidator.getConflicts(this.userBoard, row, col);
    }

    // 游戏完成
    onGameComplete() {
        this.stopTimer();
        
        // 保存游戏记录
        this.saveGameRecord();
        
        // 如果是关卡模式，解锁下一关
        if (this.gameMode === 'level' && this.currentLevel) {
            this.unlockNextLevel();
        }
    }

    // 保存游戏记录
    saveGameRecord() {
        const record = {
            difficulty: this.difficulty,
            time: this.timer,
            hintsUsed: this.hintsUsed,
            date: new Date().toISOString(),
            mode: this.gameMode,
            level: this.currentLevel
        };
        
        // 从localStorage获取历史记录
        let history = [];
        try {
            const stored = localStorage.getItem('sudoku_history');
            if (stored) {
                history = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
        
        // 添加新记录
        history.unshift(record);
        
        // 只保留最近50条记录
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        // 保存到localStorage
        try {
            localStorage.setItem('sudoku_history', JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }

    // 解锁下一关
    unlockNextLevel() {
        try {
            const stored = localStorage.getItem('sudoku_unlocked_levels');
            let unlockedLevels = stored ? JSON.parse(stored) : [1];
            
            const nextLevel = this.currentLevel + 1;
            if (!unlockedLevels.includes(nextLevel) && nextLevel <= 50) {
                unlockedLevels.push(nextLevel);
                localStorage.setItem('sudoku_unlocked_levels', JSON.stringify(unlockedLevels));
            }
        } catch (e) {
            console.error('Failed to unlock level:', e);
        }
    }

    // 获取已解锁的关卡
    static getUnlockedLevels() {
        try {
            const stored = localStorage.getItem('sudoku_unlocked_levels');
            return stored ? JSON.parse(stored) : [1];
        } catch (e) {
            console.error('Failed to load unlocked levels:', e);
            return [1];
        }
    }

    // 获取历史记录
    static getHistory() {
        try {
            const stored = localStorage.getItem('sudoku_history');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            return [];
        }
    }

    // 获取用户设置
    static getSettings() {
        try {
            const stored = localStorage.getItem('sudoku_settings');
            return stored ? JSON.parse(stored) : {
                defaultDifficulty: 'medium',
                soundEnabled: true
            };
        } catch (e) {
            console.error('Failed to load settings:', e);
            return {
                defaultDifficulty: 'medium',
                soundEnabled: true
            };
        }
    }

    // 保存用户设置
    static saveSettings(settings) {
        try {
            localStorage.setItem('sudoku_settings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    // 格式化时间
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // 获取难度显示名称
    static getDifficultyName(difficulty) {
        const names = {
            'easy': '简单',
            'medium': '中等',
            'hard': '困难',
            'expert': '专家'
        };
        return names[difficulty] || '中等';
    }

    // 获取关卡难度
    static getLevelDifficulty(level) {
        if (level <= 10) return 'easy';
        if (level <= 25) return 'medium';
        if (level <= 40) return 'hard';
        return 'expert';
    }
}