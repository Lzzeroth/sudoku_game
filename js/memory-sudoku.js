// 记忆盲解数独模块
import { SudokuValidator } from './sudoku.js';

export class MemorySudokuGenerator {
    constructor() {
        this.board = null;
        this.size = 9;
    }

    // 生成完整的数独解（支持6x6和9x9）
    generateSolution(size = 9) {
        this.size = size;
        this.board = Array(size).fill(null).map(() => Array(size).fill(0));
        this.fillBoard();
        return JSON.parse(JSON.stringify(this.board));
    }

    // 填充棋盘
    fillBoard() {
        const numbers = Array.from({ length: this.size }, (_, i) => i + 1);
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    this.shuffleArray(numbers);
                    
                    for (let num of numbers) {
                        if (this.isValid(row, col, num)) {
                            this.board[row][col] = num;
                            
                            if (this.fillBoard()) {
                                return true;
                            }
                            
                            this.board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // 检查数字是否有效
    isValid(row, col, num) {
        // 检查行
        for (let x = 0; x < this.size; x++) {
            if (this.board[row][x] === num) {
                return false;
            }
        }

        // 检查列
        for (let x = 0; x < this.size; x++) {
            if (this.board[x][col] === num) {
                return false;
            }
        }

        // 检查宫格（6x6是2x3，9x9是3x3）
        const boxRowSize = this.size === 6 ? 2 : 3;
        const boxColSize = this.size === 6 ? 3 : 3;
        const startRow = Math.floor(row / boxRowSize) * boxRowSize;
        const startCol = Math.floor(col / boxColSize) * boxColSize;
        
        for (let i = 0; i < boxRowSize; i++) {
            for (let j = 0; j < boxColSize; j++) {
                if (this.board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    // 随机打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // 根据难度生成题目
    generatePuzzle(difficulty = 'medium') {
        const config = this.getDifficultyConfig(difficulty);
        const solution = this.generateSolution(config.size);
        const puzzle = JSON.parse(JSON.stringify(solution));
        
        // 随机移除数字
        let removed = 0;
        const totalCells = config.size * config.size;
        const cellsToRemove = totalCells - config.initialNumbers;
        
        const positions = [];
        for (let i = 0; i < config.size; i++) {
            for (let j = 0; j < config.size; j++) {
                positions.push([i, j]);
            }
        }
        this.shuffleArray(positions);
        
        for (let [row, col] of positions) {
            if (removed >= cellsToRemove) break;
            puzzle[row][col] = 0;
            removed++;
        }
        
        return { puzzle, solution, size: config.size };
    }

    // 获取难度配置
    getDifficultyConfig(difficulty) {
        const configs = {
            'easy': { size: 6, initialNumbers: this.randomInRange(10, 15) },
            'medium': { size: 6, initialNumbers: this.randomInRange(15, 20) },
            'hard': { size: 9, initialNumbers: this.randomInRange(25, 35) },
            'expert': { size: 9, initialNumbers: this.randomInRange(40, 50) }
        };
        return configs[difficulty] || configs['medium'];
    }

    // 生成范围内的随机数
    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

export class MemorySudokuValidator {
    // 验证当前棋盘状态（支持6x6和9x9）
    static validate(board, size) {
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const num = board[row][col];
                if (num !== 0) {
                    board[row][col] = 0;
                    if (!this.isValidPlacement(board, row, col, num, size)) {
                        board[row][col] = num;
                        return false;
                    }
                    board[row][col] = num;
                }
            }
        }
        return true;
    }

    // 检查特定位置的数字是否有效
    static isValidPlacement(board, row, col, num, size) {
        // 检查行
        for (let x = 0; x < size; x++) {
            if (board[row][x] === num) {
                return false;
            }
        }

        // 检查列
        for (let x = 0; x < size; x++) {
            if (board[x][col] === num) {
                return false;
            }
        }

        // 检查宫格
        const boxRowSize = size === 6 ? 2 : 3;
        const boxColSize = size === 6 ? 3 : 3;
        const startRow = Math.floor(row / boxRowSize) * boxRowSize;
        const startCol = Math.floor(col / boxColSize) * boxColSize;
        
        for (let i = 0; i < boxRowSize; i++) {
            for (let j = 0; j < boxColSize; j++) {
                if (board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    // 检查是否完成
    static isComplete(board, size) {
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        return this.validate(board, size);
    }

    // 获取冲突的格子
    static getConflicts(board, row, col, size) {
        const conflicts = [];
        const num = board[row][col];
        
        if (num === 0) return conflicts;

        // 检查行冲突
        for (let x = 0; x < size; x++) {
            if (x !== col && board[row][x] === num) {
                conflicts.push({ row, col: x });
            }
        }

        // 检查列冲突
        for (let x = 0; x < size; x++) {
            if (x !== row && board[x][col] === num) {
                conflicts.push({ row: x, col });
            }
        }

        // 检查宫格冲突
        const boxRowSize = size === 6 ? 2 : 3;
        const boxColSize = size === 6 ? 3 : 3;
        const startRow = Math.floor(row / boxRowSize) * boxRowSize;
        const startCol = Math.floor(col / boxColSize) * boxColSize;
        
        for (let i = 0; i < boxRowSize; i++) {
            for (let j = 0; j < boxColSize; j++) {
                const r = startRow + i;
                const c = startCol + j;
                if ((r !== row || c !== col) && board[r][c] === num) {
                    conflicts.push({ row: r, col: c });
                }
            }
        }

        return conflicts;
    }
}

export class MemoryGameManager {
    constructor() {
        this.currentPuzzle = null;
        this.currentSolution = null;
        this.userBoard = null;
        this.fixedCells = null;
        this.hiddenCells = null; // 记录哪些格子被隐藏
        this.difficulty = 'medium';
        this.size = 9;
        this.timer = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.selectedCell = null;
        this.flipCardsLeft = 3; // 翻牌次数
        this.memoryPhase = true; // 记忆阶段
        this.memoryTimer = 10; // 记忆时间（秒）
        this.memoryInterval = null;
        this.generator = new MemorySudokuGenerator();
        this.isFlipping = false; // 是否正在翻牌中
        this.lastFlippedCell = null; // 上次翻牌的格子
        this.lastFlipTime = null; // 上次翻牌的时间
    }

    // 开始新游戏
    startNewGame(difficulty = 'medium') {
        this.difficulty = difficulty;
        
        // 先停止所有计时器
        this.stopTimer();
        this.stopMemoryTimer();
        
        // 生成新题目
        const { puzzle, solution, size } = this.generator.generatePuzzle(difficulty);
        this.currentPuzzle = puzzle;
        this.currentSolution = solution;
        this.userBoard = JSON.parse(JSON.stringify(puzzle));
        this.size = size;
        
        // 记录固定格子和隐藏格子
        this.fixedCells = Array(size).fill(null).map(() => Array(size).fill(false));
        this.hiddenCells = Array(size).fill(null).map(() => Array(size).fill(false));
        
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (puzzle[i][j] !== 0) {
                    this.fixedCells[i][j] = true;
                    this.hiddenCells[i][j] = true; // 初始数字将被隐藏
                }
            }
        }
        
        // 重置游戏状态
        this.timer = 0;
        this.flipCardsLeft = 3;
        this.isPaused = false;
        this.selectedCell = null;
        this.memoryPhase = true;
        this.memoryTimer = 10;
        
        // 立即更新显示
        this.updateTimerDisplay();
        this.updateMemoryTimerDisplay();
        
        // 启动记忆倒计时
        this.startMemoryTimer();
    }

    // 启动记忆倒计时
    startMemoryTimer() {
        this.stopMemoryTimer();
        this.memoryInterval = setInterval(() => {
            if (!this.isPaused) {
                this.memoryTimer--;
                this.updateMemoryTimerDisplay();
                
                if (this.memoryTimer <= 0) {
                    this.endMemoryPhase();
                }
            }
        }, 1000);
    }

    // 停止记忆倒计时
    stopMemoryTimer() {
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
            this.memoryInterval = null;
        }
    }

    // 更新记忆倒计时显示
    updateMemoryTimerDisplay() {
        const element = document.getElementById('memoryTimer');
        if (element) {
            element.textContent = this.memoryTimer;
        }
    }

    // 结束记忆阶段
    endMemoryPhase() {
        this.stopMemoryTimer();
        this.memoryPhase = false;
        
        // 隐藏所有初始数字
        // 这个操作将在UI层处理
        
        // 启动游戏计时器
        this.startTimer();
        
        // 触发UI更新事件
        const event = new CustomEvent('memoryPhaseEnd');
        document.dispatchEvent(event);
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

    // 使用翻牌
    useFlipCard(row, col) {
        if (this.flipCardsLeft <= 0) {
            return false;
        }
        
        if (!this.fixedCells[row][col]) {
            return false;
        }
        
        this.flipCardsLeft--;
        return true;
    }

    // 设置格子的值
    setCellValue(row, col, value) {
        if (this.fixedCells[row][col]) {
            return false;
        }
        
        this.userBoard[row][col] = value;
        
        // 检查是否完成
        if (MemorySudokuValidator.isComplete(this.userBoard, this.size)) {
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

    // 检查格子是否隐藏
    isCellHidden(row, col) {
        return this.hiddenCells[row][col] && !this.memoryPhase;
    }

    // 验证当前输入
    validateCell(row, col) {
        const value = this.userBoard[row][col];
        if (value === 0) return true;
        
        return MemorySudokuValidator.isValidPlacement(this.userBoard, row, col, value, this.size);
    }

    // 获取冲突的格子
    getConflicts(row, col) {
        return MemorySudokuValidator.getConflicts(this.userBoard, row, col, this.size);
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
        // 先停止所有计时器
        this.stopTimer();
        this.stopMemoryTimer();
        
        this.userBoard = JSON.parse(JSON.stringify(this.currentPuzzle));
        this.timer = 0;
        this.flipCardsLeft = 3;
        this.selectedCell = null;
        this.memoryPhase = true;
        this.memoryTimer = 10;
        this.isPaused = false;
        this.isFlipping = false;
        this.lastFlippedCell = null;
        this.lastFlipTime = null;
        
        // 重置隐藏状态
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.fixedCells[i][j]) {
                    this.hiddenCells[i][j] = true;
                }
            }
        }
        
        // 立即更新显示
        this.updateTimerDisplay();
        this.updateMemoryTimerDisplay();
        
        // 重新启动记忆倒计时
        this.startMemoryTimer();
    }

    // 游戏完成
    onGameComplete() {
        this.stopTimer();
        this.stopMemoryTimer(); // 确保记忆倒计时也停止
        
        // 显示所有隐藏的格子进行验证
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                this.hiddenCells[i][j] = false;
            }
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
            'easy': '简单 (6x6)',
            'medium': '中等 (6x6)',
            'hard': '困难 (9x9)',
            'expert': '专家 (9x9)'
        };
        return names[difficulty] || '中等';
    }
}