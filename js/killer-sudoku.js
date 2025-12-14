// 杀手数独模块
import { SudokuGenerator, SudokuValidator } from './sudoku.js';

export class KillerSudokuGenerator extends SudokuGenerator {
    // 生成杀手数独题目
    generatePuzzle(difficulty = 'medium') {
        const solution = this.generateSolution();
        const puzzle = JSON.parse(JSON.stringify(solution));
        
        // 先生成杀手数独区域（笼子）
        const cages = this.generateCages(solution, difficulty);
        
        // 根据难度确定要移除的数字数量
        const cellsToRemove = this.getCellsToRemove(difficulty);
        
        // 创建位置数组，并按优先级排序
        // 优先级1: 笼子内有重复数字的格子（必须移除）
        // 优先级2: 其他格子（随机移除）
        const priorityPositions = []; // 笼子内有重复的格子
        const normalPositions = [];   // 其他格子
        
        // 检查每个笼子内是否有重复数字
        cages.forEach(cage => {
            const valueCount = new Map();
            cage.cells.forEach(cell => {
                const value = solution[cell.row][cell.col];
                valueCount.set(value, (valueCount.get(value) || 0) + 1);
            });
            
            // 如果笼子内有重复数字，将重复的格子加入优先移除列表
            cage.cells.forEach(cell => {
                const value = solution[cell.row][cell.col];
                if (valueCount.get(value) > 1) {
                    priorityPositions.push([cell.row, cell.col]);
                }
            });
        });
        
        // 收集所有格子位置
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                // 如果不在优先列表中，加入普通列表
                if (!priorityPositions.some(([r, c]) => r === i && c === j)) {
                    normalPositions.push([i, j]);
                }
            }
        }
        
        // 打乱普通位置列表
        this.shuffleArray(normalPositions);
        
        // 合并位置列表：优先位置在前，普通位置在后
        const positions = [...priorityPositions, ...normalPositions];
        
        // 移除数字
        let removed = 0;
        for (let [row, col] of positions) {
            if (removed >= cellsToRemove) break;
            puzzle[row][col] = 0;
            removed++;
        }
        
        return { puzzle, solution, cages };
    }

    // 根据难度获取要移除的格子数量
    getCellsToRemove(difficulty) {
        const ranges = {
            'easy': [36, 41],      // 40-45个数字
            'medium': [46, 51],    // 30-35个数字
            'hard': [51, 56],      // 25-30个数字
            'expert': [56, 61]     // 20-25个数字
        };
        
        const [min, max] = ranges[difficulty] || ranges['medium'];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 生成杀手数独区域（笼子）
    generateCages(solution, difficulty) {
        const cages = [];
        const used = Array(9).fill(null).map(() => Array(9).fill(false));
        const cageMap = Array(9).fill(null).map(() => Array(9).fill(-1)); // 记录每个格子属于哪个笼子
        const colors = [
            'rgba(255, 182, 193, 0.3)', // 浅粉色
            'rgba(173, 216, 230, 0.3)', // 浅蓝色
            'rgba(144, 238, 144, 0.3)', // 浅绿色
            'rgba(255, 218, 185, 0.3)', // 浅橙色
            'rgba(221, 160, 221, 0.3)', // 浅紫色
            'rgba(255, 255, 224, 0.3)', // 浅黄色
            'rgba(176, 224, 230, 0.3)', // 浅青色
            'rgba(255, 192, 203, 0.3)', // 粉红色
            'rgba(216, 191, 216, 0.3)', // 淡紫色
            'rgba(255, 228, 196, 0.3)', // 浅杏色
        ];
        
        // 第一轮：随机生成笼子，每个笼子5-8个格子
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (used[row][col]) continue;
                
                // 随机决定笼子大小（5-8个格子）
                const cageSize = Math.floor(Math.random() * 4) + 5;
                const cage = this.growCage(row, col, cageSize, used, solution);
                
                // 只有当笼子大小达到要求时才添加
                if (cage.cells.length >= 5) {
                    const cageIndex = cages.length;
                    // 记录每个格子属于哪个笼子
                    cage.cells.forEach(cell => {
                        cageMap[cell.row][cell.col] = cageIndex;
                    });
                    cages.push(cage);
                } else {
                    // 如果笼子太小，将这些格子标记为未使用，稍后处理
                    cage.cells.forEach(cell => {
                        used[cell.row][cell.col] = false;
                    });
                }
            }
        }
        
        // 第二轮：处理所有剩余未分配的格子
        // 将每个剩余格子分配到最近的相邻笼子
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (!used[row][col]) {
                    // 找到相邻的笼子
                    const neighbors = this.getNeighbors(row, col);
                    let targetCageIndex = -1;
                    
                    // 优先选择相邻的笼子
                    for (const [nRow, nCol] of neighbors) {
                        const neighborCageIndex = cageMap[nRow][nCol];
                        if (neighborCageIndex !== -1) {
                            targetCageIndex = neighborCageIndex;
                            break;
                        }
                    }
                    
                    // 如果找到相邻笼子，加入该笼子
                    if (targetCageIndex !== -1) {
                        cages[targetCageIndex].cells.push({ 
                            row, 
                            col, 
                            value: solution[row][col] 
                        });
                        cageMap[row][col] = targetCageIndex;
                        used[row][col] = true;
                    } else {
                        // 如果没有相邻笼子，创建新笼子或加入最近的笼子
                        if (cages.length > 0) {
                            // 找到最近的笼子（通过距离计算）
                            let minDistance = Infinity;
                            let nearestCageIndex = 0;
                            
                            cages.forEach((cage, index) => {
                                cage.cells.forEach(cell => {
                                    const distance = Math.abs(cell.row - row) + Math.abs(cell.col - col);
                                    if (distance < minDistance) {
                                        minDistance = distance;
                                        nearestCageIndex = index;
                                    }
                                });
                            });
                            
                            cages[nearestCageIndex].cells.push({ 
                                row, 
                                col, 
                                value: solution[row][col] 
                            });
                            cageMap[row][col] = nearestCageIndex;
                            used[row][col] = true;
                        } else {
                            // 如果完全没有笼子，创建第一个笼子
                            const cage = {
                                cells: [{ row, col, value: solution[row][col] }],
                                target: 0,
                                operators: [],
                                formula: ''
                            };
                            cageMap[row][col] = 0;
                            cages.push(cage);
                            used[row][col] = true;
                        }
                    }
                }
            }
        }
        
        // 第三轮：为每个笼子分配颜色，确保相邻笼子颜色不同
        cages.forEach((cage, index) => {
            // 【关键修复】对每个笼子的cells数组进行排序
            // 排序规则：先按行排序，行相同则按列排序（从左到右，从上到下）
            cage.cells.sort((a, b) => {
                if (a.row !== b.row) {
                    return a.row - b.row;
                }
                return a.col - b.col;
            });
            
            const usedColors = new Set();
            
            // 检查相邻笼子的颜色
            cage.cells.forEach(cell => {
                const neighbors = this.getNeighbors(cell.row, cell.col);
                neighbors.forEach(([nRow, nCol]) => {
                    const neighborCageIndex = cageMap[nRow][nCol];
                    if (neighborCageIndex !== -1 && neighborCageIndex !== index && cages[neighborCageIndex].color) {
                        usedColors.add(cages[neighborCageIndex].color);
                    }
                });
            });
            
            // 选择一个未被相邻笼子使用的颜色
            let selectedColor = colors[0];
            for (const color of colors) {
                if (!usedColors.has(color)) {
                    selectedColor = color;
                    break;
                }
            }
            
            cage.color = selectedColor;
            
            // 计算笼子的目标值和运算符
            const { target, operators, formula } = this.calculateCageTarget(cage.cells, solution, difficulty);
            cage.target = target;
            cage.operators = operators;
            cage.formula = formula;
        });
        
        return cages;
    }
    
    // 获取相邻格子（上下左右）
    getNeighbors(row, col) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9) {
                neighbors.push([newRow, newCol]);
            }
        }
        
        return neighbors;
    }

    // 生长笼子（使用BFS算法）
    growCage(startRow, startCol, targetSize, used, solution) {
        const cage = {
            cells: [],
            target: 0,
            operators: [],
            formula: ''
        };
        
        const queue = [[startRow, startCol]];
        used[startRow][startCol] = true;
        cage.cells.push({ row: startRow, col: startCol, value: solution[startRow][startCol] });
        
        while (queue.length > 0 && cage.cells.length < targetSize) {
            const [row, col] = queue.shift();
            
            // 获取相邻的未使用格子
            const neighbors = this.getUnusedNeighbors(row, col, used);
            this.shuffleArray(neighbors);
            
            for (const [nRow, nCol] of neighbors) {
                if (cage.cells.length >= targetSize) break;
                
                used[nRow][nCol] = true;
                cage.cells.push({ row: nRow, col: nCol, value: solution[nRow][nCol] });
                queue.push([nRow, nCol]);
            }
        }
        
        return cage;
    }

    // 获取未使用的相邻格子
    getUnusedNeighbors(row, col, used) {
        const neighbors = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 9 && newCol >= 0 && newCol < 9 && !used[newRow][newCol]) {
                neighbors.push([newRow, newCol]);
            }
        }
        
        return neighbors;
    }

    // 计算笼子的目标值和运算符
    calculateCageTarget(cells, solution, difficulty) {
        const values = cells.map(cell => cell.value);
        
        switch (difficulty) {
            case 'easy':
                // 简单：只用加法
                return this.generateAdditionFormula(values, cells);
            case 'medium':
                // 中等：加减混合
                return this.generateAddSubFormula(values, cells);
            case 'hard':
                // 困难：加减乘混合
                return this.generateAddSubMulFormula(values, cells);
            case 'expert':
                // 专家：加减乘除混合
                return this.generateAllOperatorsFormula(values, cells);
            default:
                return this.generateAddSubFormula(values, cells);
        }
    }

    // 生成加法公式
    generateAdditionFormula(values, cells) {
        const target = values.reduce((sum, val) => sum + val, 0);
        const operators = Array(values.length - 1).fill('+');
        const formula = values.map((v, i) => i === 0 ? '□' : ` + □`).join('') + ` = ${target}`;
        return { target, operators, formula, cells };
    }

    // 生成加减混合公式
    generateAddSubFormula(values, cells) {
        const operators = [];
        let result = values[0];
        
        for (let i = 1; i < values.length; i++) {
            const op = Math.random() < 0.5 ? '+' : '-';
            operators.push(op);
            
            if (op === '+') {
                result += values[i];
            } else {
                result -= values[i];
            }
        }
        
        // 确保结果为正数
        if (result <= 0) {
            return this.generateAdditionFormula(values, cells);
        }
        
        const formula = values.map((v, i) => {
            if (i === 0) return '□';
            return ` ${operators[i - 1]} □`;
        }).join('') + ` = ${result}`;
        
        return { target: result, operators, formula, cells };
    }

    // 生成加减乘混合公式
    generateAddSubMulFormula(values, cells) {
        const operators = [];
        let result = values[0];
        
        for (let i = 1; i < values.length; i++) {
            const rand = Math.random();
            let op;
            
            if (rand < 0.4) {
                op = '+';
                result += values[i];
            } else if (rand < 0.7) {
                op = '-';
                result -= values[i];
            } else {
                op = '×';
                result *= values[i];
            }
            
            operators.push(op);
        }
        
        // 确保结果为正数且不太大
        if (result <= 0 || result > 1000) {
            return this.generateAddSubFormula(values, cells);
        }
        
        const formula = values.map((v, i) => {
            if (i === 0) return '□';
            return ` ${operators[i - 1]} □`;
        }).join('') + ` = ${result}`;
        
        return { target: result, operators, formula, cells };
    }

    // 生成加减乘除混合公式
    generateAllOperatorsFormula(values, cells) {
        const operators = [];
        let result = values[0];
        
        for (let i = 1; i < values.length; i++) {
            const rand = Math.random();
            let op;
            
            if (rand < 0.3) {
                op = '+';
                result += values[i];
            } else if (rand < 0.5) {
                op = '-';
                result -= values[i];
            } else if (rand < 0.75) {
                op = '×';
                result *= values[i];
            } else {
                // 除法需要确保能整除
                if (result % values[i] === 0) {
                    op = '÷';
                    result /= values[i];
                } else {
                    op = '+';
                    result += values[i];
                }
            }
            
            operators.push(op);
        }
        
        // 确保结果为正数且不太大
        if (result <= 0 || result > 1000 || !Number.isInteger(result)) {
            return this.generateAddSubMulFormula(values, cells);
        }
        
        const formula = values.map((v, i) => {
            if (i === 0) return '□';
            return ` ${operators[i - 1]} □`;
        }).join('') + ` = ${result}`;
        
        return { target: result, operators, formula, cells };
    }
}

export class KillerGameManager {
    constructor() {
        this.currentPuzzle = null;
        this.currentSolution = null;
        this.userBoard = null;
        this.fixedCells = null;
        this.cages = null; // 杀手数独区域
        this.difficulty = 'medium';
        this.timer = 0;
        this.timerInterval = null;
        this.isPaused = false;
        this.hintsLeft = 5;
        this.hintsUsed = 0;
        this.selectedCell = null;
        this.generator = new KillerSudokuGenerator();
        this.hoveredCage = null; // 当前悬停的笼子
    }

    // 开始新游戏
    startNewGame(difficulty = 'medium') {
        this.difficulty = difficulty;
        
        // 先停止旧的计时器
        this.stopTimer();
        
        // 生成新题目
        const { puzzle, solution, cages } = this.generator.generatePuzzle(difficulty);
        this.currentPuzzle = puzzle;
        this.currentSolution = solution;
        this.userBoard = JSON.parse(JSON.stringify(puzzle));
        this.cages = cages;
        
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
        this.hoveredCage = null;
        
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

    // 验证笼子内的等式运算
    validateCageFormula(row, col) {
        // 找到该格子所属的笼子
        const cage = this.cages.find(c => 
            c.cells.some(cell => cell.row === row && cell.col === col)
        );
        
        if (!cage) return { valid: true, message: '' };
        
        // 检查笼子内所有格子是否都已填入数字
        const allFilled = cage.cells.every(cell => 
            this.userBoard[cell.row][cell.col] !== 0
        );
        
        if (!allFilled) {
            // 如果笼子未填满，暂时认为有效
            return { valid: true, message: '' };
        }
        
        // 获取笼子内所有格子的值（按照cells数组的顺序）
        const values = cage.cells.map(cell => 
            this.userBoard[cell.row][cell.col]
        );
        
        // 计算等式结果（考虑运算符优先级：先乘除后加减）
        const result = this.evaluateExpression(values, cage.operators);
        
        // 验证结果是否与目标值相等
        const isValid = Math.abs(result - cage.target) < 0.0001; // 使用浮点数比较
        
        if (!isValid) {
            return {
                valid: false,
                message: `等式运算错误！当前结果为 ${result}，目标值为 ${cage.target}`
            };
        }
        
        return { valid: true, message: '' };
    }

    // 计算表达式（考虑运算符优先级：先乘除后加减）
    evaluateExpression(values, operators) {
        if (values.length === 0) return 0;
        if (values.length === 1) return values[0];
        
        // 创建操作数和运算符的副本
        const nums = [...values];
        const ops = [...operators];
        
        // 第一步：处理所有乘法和除法
        let i = 0;
        while (i < ops.length) {
            if (ops[i] === '×' || ops[i] === '÷') {
                // 计算当前运算
                let result;
                if (ops[i] === '×') {
                    result = nums[i] * nums[i + 1];
                } else {
                    result = nums[i] / nums[i + 1];
                }
                
                // 用结果替换两个操作数
                nums.splice(i, 2, result);
                // 移除当前运算符
                ops.splice(i, 1);
                // 不增加i，因为数组已经变短了
            } else {
                i++;
            }
        }
        
        // 第二步：处理所有加法和减法（从左到右）
        let result = nums[0];
        for (let j = 0; j < ops.length; j++) {
            if (ops[j] === '+') {
                result += nums[j + 1];
            } else if (ops[j] === '-') {
                result -= nums[j + 1];
            }
        }
        
        return result;
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
        
        // 找到可能值最少的空格子作为提示
        let minPossible = 10;
        let bestCell = null;
        let bestValue = null;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.userBoard[row][col] === 0) {
                    const possible = this.getPossibleValues(row, col);
                    if (possible.length > 0 && possible.length < minPossible) {
                        minPossible = possible.length;
                        bestCell = { row, col };
                        // 从可能值中选择与solution匹配的值，如果没有则选第一个
                        const solutionValue = this.currentSolution[row][col];
                        bestValue = possible.includes(solutionValue) ? solutionValue : possible[0];
                    }
                }
            }
        }
        
        if (bestCell && bestValue) {
            this.setCellValue(bestCell.row, bestCell.col, bestValue);
            this.hintsLeft--;
            this.hintsUsed++;
            
            // 更新提示显示
            const hintsElement = document.getElementById('hintsLeft');
            if (hintsElement) {
                hintsElement.textContent = this.hintsLeft;
            }
            
            return { row: bestCell.row, col: bestCell.col, value: bestValue };
        }
        
        return null;
    }
    
    // 获取某个格子的所有可能值
    getPossibleValues(row, col) {
        if (this.userBoard[row][col] !== 0) return [];
        
        const possible = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        // 排除行中已有的数字
        for (let x = 0; x < 9; x++) {
            possible.delete(this.userBoard[row][x]);
        }
        
        // 排除列中已有的数字
        for (let x = 0; x < 9; x++) {
            possible.delete(this.userBoard[x][col]);
        }
        
        // 排除宫格中已有的数字
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                possible.delete(this.userBoard[startRow + i][startCol + j]);
            }
        }
        
        // 排除笼子内已有的数字（杀手数独特有）
        const cage = this.getCageForCell(row, col);
        if (cage) {
            cage.cells.forEach(cell => {
                // 排除笼子内其他格子已有的数字
                if (cell.row !== row || cell.col !== col) {
                    possible.delete(this.userBoard[cell.row][cell.col]);
                }
            });
        }
        
        return Array.from(possible);
    }

    // 验证当前输入
    validateCell(row, col) {
        const value = this.userBoard[row][col];
        if (value === 0) return true;
        
        // 检查行列宫格冲突
        if (!SudokuValidator.isValidPlacement(this.userBoard, row, col, value)) {
            return false;
        }
        
        // 检查笼子内的冲突（杀手数独特有）
        const cage = this.getCageForCell(row, col);
        if (cage) {
            for (const cell of cage.cells) {
                // 如果笼子内其他格子有相同的值，返回false
                if ((cell.row !== row || cell.col !== col) && 
                    this.userBoard[cell.row][cell.col] === value) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // 获取冲突的格子
    getConflicts(row, col) {
        const conflicts = [];
        const value = this.userBoard[row][col];
        
        if (value === 0) return conflicts;

        // 1. 检查行冲突
        for (let x = 0; x < 9; x++) {
            if (x !== col && this.userBoard[row][x] === value) {
                conflicts.push({ row, col: x });
            }
        }

        // 2. 检查列冲突
        for (let x = 0; x < 9; x++) {
            if (x !== row && this.userBoard[x][col] === value) {
                conflicts.push({ row: x, col });
            }
        }

        // 3. 检查3x3宫格冲突
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const r = startRow + i;
                const c = startCol + j;
                if ((r !== row || c !== col) && this.userBoard[r][c] === value) {
                    conflicts.push({ row: r, col: c });
                }
            }
        }

        // 4. 检查笼子内的冲突（杀手数独特有）
        const cage = this.getCageForCell(row, col);
        if (cage) {
            cage.cells.forEach(cell => {
                // 如果笼子内其他格子有相同的值，标记为冲突
                if ((cell.row !== row || cell.col !== col) && 
                    this.userBoard[cell.row][cell.col] === value) {
                    conflicts.push({ row: cell.row, col: cell.col });
                }
            });
        }

        return conflicts;
    }

    // 获取格子所属的笼子
    getCageForCell(row, col) {
        return this.cages.find(cage => 
            cage.cells.some(cell => cell.row === row && cell.col === col)
        );
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
        this.hoveredCage = null;
        
        // 立即更新显示为00:00
        this.updateTimerDisplay();
        
        // 重新启动计时器
        this.startTimer();
    }

    // 游戏完成
    onGameComplete() {
        this.stopTimer();
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
}