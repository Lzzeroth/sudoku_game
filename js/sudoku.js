// 数独核心算法模块

export class SudokuGenerator {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
    }

    // 生成完整的数独解
    generateSolution() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard();
        return JSON.parse(JSON.stringify(this.board));
    }

    // 填充棋盘
    fillBoard() {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    // 随机打乱数字顺序
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
        for (let x = 0; x < 9; x++) {
            if (this.board[row][x] === num) {
                return false;
            }
        }

        // 检查列
        for (let x = 0; x < 9; x++) {
            if (this.board[x][col] === num) {
                return false;
            }
        }

        // 检查3x3宫格
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
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
        const solution = this.generateSolution();
        const puzzle = JSON.parse(JSON.stringify(solution));
        
        // 根据难度确定要移除的数字数量
        const cellsToRemove = this.getCellsToRemove(difficulty);
        
        // 随机移除数字
        let removed = 0;
        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        this.shuffleArray(positions);
        
        for (let [row, col] of positions) {
            if (removed >= cellsToRemove) break;
            
            const backup = puzzle[row][col];
            puzzle[row][col] = 0;
            
            // 确保题目有唯一解
            const solver = new SudokuSolver();
            if (solver.hasUniqueSolution(JSON.parse(JSON.stringify(puzzle)))) {
                removed++;
            } else {
                puzzle[row][col] = backup;
            }
        }
        
        return { puzzle, solution };
    }

    // 根据难度获取要移除的格子数量
    getCellsToRemove(difficulty) {
        const ranges = {
            'easy': [36, 41],      // 40-45个数字 (移除36-41个)
            'medium': [46, 51],    // 30-35个数字 (移除46-51个)
            'hard': [51, 56],      // 25-30个数字 (移除51-56个)
            'expert': [56, 61]     // 20-25个数字 (移除56-61个)
        };
        
        const [min, max] = ranges[difficulty] || ranges['medium'];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

export class SudokuSolver {
    constructor() {
        this.board = null;
        this.solutionCount = 0;
    }

    // 求解数独
    solve(board) {
        this.board = JSON.parse(JSON.stringify(board));
        this.solutionCount = 0;
        this.solveHelper();
        return this.board;
    }

    // 求解辅助函数
    solveHelper() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(row, col, num)) {
                            this.board[row][col] = num;
                            
                            if (this.solveHelper()) {
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

    // 检查是否有唯一解
    hasUniqueSolution(board) {
        this.board = JSON.parse(JSON.stringify(board));
        this.solutionCount = 0;
        this.countSolutions();
        return this.solutionCount === 1;
    }

    // 计算解的数量
    countSolutions(limit = 2) {
        if (this.solutionCount >= limit) return;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(row, col, num)) {
                            this.board[row][col] = num;
                            this.countSolutions(limit);
                            this.board[row][col] = 0;
                            
                            if (this.solutionCount >= limit) return;
                        }
                    }
                    return;
                }
            }
        }
        this.solutionCount++;
    }

    // 检查数字是否有效
    isValid(row, col, num) {
        // 检查行
        for (let x = 0; x < 9; x++) {
            if (this.board[row][x] === num) {
                return false;
            }
        }

        // 检查列
        for (let x = 0; x < 9; x++) {
            if (this.board[x][col] === num) {
                return false;
            }
        }

        // 检查3x3宫格
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    // 获取某个格子的所有可能值
    getPossibleValues(board, row, col) {
        if (board[row][col] !== 0) return [];
        
        const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        // 排除行中已有的数字
        for (let x = 0; x < 9; x++) {
            possible.delete(board[row][x]);
        }
        
        // 排除列中已有的数字
        for (let x = 0; x < 9; x++) {
            possible.delete(board[x][col]);
        }
        
        // 排除宫格中已有的数字
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                possible.delete(board[startRow + i][startCol + j]);
            }
        }
        
        return Array.from(possible);
    }

    // 获取最佳提示位置（选择可能值最少的空格）
    getBestHintCell(board) {
        let minPossible = 10;
        let bestCell = null;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const possible = this.getPossibleValues(board, row, col);
                    if (possible.length > 0 && possible.length < minPossible) {
                        minPossible = possible.length;
                        bestCell = { row, col, value: possible[0] };
                    }
                }
            }
        }
        
        return bestCell;
    }
}

export class SudokuValidator {
    // 验证当前棋盘状态
    static validate(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const num = board[row][col];
                if (num !== 0) {
                    // 临时移除当前数字
                    board[row][col] = 0;
                    if (!this.isValidPlacement(board, row, col, num)) {
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
    static isValidPlacement(board, row, col, num) {
        // 检查行
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) {
                return false;
            }
        }

        // 检查列
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) {
                return false;
            }
        }

        // 检查3x3宫格
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    // 检查是否完成
    static isComplete(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    return false;
                }
            }
        }
        return this.validate(board);
    }

    // 获取冲突的格子
    static getConflicts(board, row, col) {
        const conflicts = [];
        const num = board[row][col];
        
        if (num === 0) return conflicts;

        // 检查行冲突
        for (let x = 0; x < 9; x++) {
            if (x !== col && board[row][x] === num) {
                conflicts.push({ row, col: x });
            }
        }

        // 检查列冲突
        for (let x = 0; x < 9; x++) {
            if (x !== row && board[x][col] === num) {
                conflicts.push({ row: x, col });
            }
        }

        // 检查宫格冲突
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
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