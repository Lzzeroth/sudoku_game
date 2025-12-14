// UI渲染模块
import { GameManager } from './game.js';
import { getModalManager } from './modal.js';
import { toast } from './toast.js';

export class UIManager {
    constructor(app) {
        this.app = app;
        this.game = app.game;
        this.boardElement = document.getElementById('sudokuBoard');
        this.numberPadElement = document.getElementById('numberPad');
        this.modal = getModalManager(); // 初始化模态弹窗管理器
    }

    // 渲染数独棋盘
    renderBoard() {
        if (!this.boardElement) return;
        
        this.boardElement.innerHTML = '';
        
        // 创建9x9网格
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 基础样式 - 使用flex和aspect-ratio确保正方形且自适应
                const baseClasses = 'flex items-center justify-center text-sm sm:text-base md:text-2xl font-bold cursor-pointer transition-all duration-200';
                const bgColor = 'bg-white hover:bg-blue-50 active:bg-blue-100';
                
                // 优化的边框样式 - 移动端使用更细的边框
                let borderClasses = '';
                
                // 顶部边框：第一行或每个大宫格的第一行用粗边框
                if (row === 0) {
                    borderClasses += ' border-t-[3px] sm:border-t-4 border-t-slate-900';
                } else if (row % 3 === 0) {
                    borderClasses += ' border-t-2 sm:border-t-[3px] border-t-slate-800';
                } else {
                    borderClasses += ' border-t border-t-slate-400';
                }
                
                // 左边框：第一列或每个大宫格的第一列用粗边框
                if (col === 0) {
                    borderClasses += ' border-l-[3px] sm:border-l-4 border-l-slate-900';
                } else if (col % 3 === 0) {
                    borderClasses += ' border-l-2 sm:border-l-[3px] border-l-slate-800';
                } else {
                    borderClasses += ' border-l border-l-slate-400';
                }
                
                // 底部边框：最后一行用粗边框
                if (row === 8) {
                    borderClasses += ' border-b-[3px] sm:border-b-4 border-b-slate-900';
                }
                
                // 右边框：最后一列用粗边框
                if (col === 8) {
                    borderClasses += ' border-r-[3px] sm:border-r-4 border-r-slate-900';
                }
                
                cell.className += ` ${baseClasses} ${bgColor} ${borderClasses}`;
                
                // 设置单元格内容
                const value = this.game.getCellValue(row, col);
                if (value !== 0) {
                    cell.textContent = value;
                    if (this.game.isCellFixed(row, col)) {
                        cell.classList.add('cell-fixed');
                    } else {
                        cell.classList.add('cell-user');
                    }
                }
                
                // 添加点击事件
                cell.addEventListener('click', () => this.onCellClick(row, col));
                
                this.boardElement.appendChild(cell);
            }
        }
        
        // 设置棋盘为9x9网格，添加阴影和圆角，确保不溢出
        this.boardElement.className = 'grid grid-cols-9 gap-0 shadow-2xl rounded-lg overflow-hidden w-full mx-auto';
    }

    // 渲染数字输入面板
    renderNumberPad(maxNumber = 9) {
        if (!this.numberPadElement) return;
        
        this.numberPadElement.innerHTML = '';
        
        for (let num = 1; num <= maxNumber; num++) {
            const button = document.createElement('button');
            button.textContent = num;
            button.className = 'bg-white hover:bg-blue-500 hover:text-white text-slate-700 font-bold py-3 px-4 rounded-lg shadow-md transform transition-all hover:scale-110 active:scale-95';
            button.addEventListener('click', () => this.onNumberClick(num));
            this.numberPadElement.appendChild(button);
        }
        
        // 根据数字数量调整网格布局
        if (maxNumber === 6) {
            this.numberPadElement.className = 'grid grid-cols-3 gap-2 sm:gap-3';
        } else {
            this.numberPadElement.className = 'grid grid-cols-3 gap-2 sm:gap-3';
        }
    }

    // 单元格点击事件
    onCellClick(row, col) {
        // 杀手数独模式
        if (this.app.currentMode === 'killer') {
            const killerGame = this.app.killerGame;
            if (killerGame.isPaused) return;
            if (killerGame.isCellFixed(row, col)) return;
            
            killerGame.selectedCell = { row, col };
            this.highlightCell(row, col);
            return;
        }
        
        // 经典模式
        if (this.game.isPaused) return;
        if (this.game.isCellFixed(row, col)) return;
        
        this.game.selectedCell = { row, col };
        this.highlightCell(row, col);
    }

    // 数字按钮点击事件
    onNumberClick(num) {
        // 记忆盲解模式
        if (this.app.currentMode === 'memory') {
            const memoryGame = this.app.memoryGame;
            if (memoryGame.isPaused) return;
            if (!memoryGame.selectedCell) return;
            
            // 验证数字是否在有效范围内
            if (num > memoryGame.size) return;
            
            const { row, col } = memoryGame.selectedCell;
            memoryGame.setCellValue(row, col, num);
            this.updateMemoryCell(row, col, memoryGame);
            this.checkMemoryConflicts(memoryGame);
            return;
        }
        
        // 杀手数独模式
        if (this.app.currentMode === 'killer') {
            const killerGame = this.app.killerGame;
            if (killerGame.isPaused) return;
            if (!killerGame.selectedCell) return;
            
            const { row, col } = killerGame.selectedCell;
            killerGame.setCellValue(row, col, num);
            this.updateKillerCell(row, col, killerGame);
            this.checkKillerConflicts(killerGame);
            
            // 验证笼子内的等式运算
            const validation = killerGame.validateCageFormula(row, col);
            if (!validation.valid) {
                toast.error(validation.message, { duration: 4000 });
            }
            
            return;
        }
        
        // 经典模式
        if (this.game.isPaused) return;
        if (!this.game.selectedCell) return;
        
        const { row, col } = this.game.selectedCell;
        this.game.setCellValue(row, col, num);
        this.updateCell(row, col);
        this.checkConflicts();
    }

    // 高亮显示选中的单元格
    highlightCell(row, col, size = 9) {
        // 清除之前的高亮
        const allCells = this.boardElement.querySelectorAll('.sudoku-cell');
        allCells.forEach(cell => {
            cell.classList.remove('cell-highlight', 'cell-same-number', 'flow-blue');
        });
        
        // 高亮当前选中的格子
        const selectedCell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (selectedCell) {
            selectedCell.classList.add('flow-blue');
        }
        
        // 杀手数独模式：只高亮选中的单元格，不高亮同行、同列、同宫格
        if (this.app.currentMode === 'killer') {
            return;
        }
        
        // 根据当前模式获取值
        let currentValue = 0;
        if (this.app.currentMode === 'memory') {
            currentValue = this.app.memoryGame.getCellValue(row, col);
        } else if (this.app.currentMode === 'math') {
            currentValue = this.app.mathGame.getCellValue(row, col);
        } else {
            currentValue = this.game.getCellValue(row, col);
        }
        
        // 高亮同行、同列、同宫格
        for (let i = 0; i < size; i++) {
            // 同行
            const rowCell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${i}"]`);
            if (rowCell && i !== col) {
                rowCell.classList.add('cell-highlight');
            }
            
            // 同列
            const colCell = this.boardElement.querySelector(`[data-row="${i}"][data-col="${col}"]`);
            if (colCell && i !== row) {
                colCell.classList.add('cell-highlight');
            }
        }
        
        // 同宫格（根据棋盘大小确定宫格尺寸）
        const boxRowSize = size === 6 ? 2 : 3;
        const boxColSize = size === 6 ? 3 : 3;
        const startRow = Math.floor(row / boxRowSize) * boxRowSize;
        const startCol = Math.floor(col / boxColSize) * boxColSize;
        
        for (let i = 0; i < boxRowSize; i++) {
            for (let j = 0; j < boxColSize; j++) {
                const r = startRow + i;
                const c = startCol + j;
                if (r !== row || c !== col) {
                    const cell = this.boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                    if (cell) {
                        cell.classList.add('cell-highlight');
                    }
                }
            }
        }
        
        // 高亮相同数字
        if (currentValue !== 0) {
            allCells.forEach(cell => {
                if (cell.textContent === String(currentValue)) {
                    cell.classList.add('cell-same-number');
                }
            });
        }
    }

    // 更新单个单元格
    updateCell(row, col) {
        const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        const value = this.game.getCellValue(row, col);
        cell.textContent = value !== 0 ? value : '';
        
        if (value !== 0 && !this.game.isCellFixed(row, col)) {
            cell.classList.add('cell-user');
        } else {
            cell.classList.remove('cell-user');
        }
    }

    // 检查冲突
    checkConflicts() {
        // 清除所有错误标记
        const allCells = this.boardElement.querySelectorAll('.sudoku-cell');
        allCells.forEach(cell => {
            cell.classList.remove('cell-error');
        });
        
        // 根据当前模式选择游戏实例
        let currentGame;
        if (this.app.currentMode === 'memory') {
            // 记忆模式使用特殊的冲突检查
            this.checkMemoryConflicts(this.app.memoryGame);
            return;
        } else if (this.app.currentMode === 'killer') {
            // 杀手数独模式使用特殊的冲突检查
            this.checkKillerConflicts(this.app.killerGame);
            return;
        } else if (this.app.currentMode === 'math') {
            currentGame = this.app.mathGame;
        } else {
            currentGame = this.game;
        }
        
        // 检查每个格子的冲突
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = currentGame.getCellValue(row, col);
                if (value !== 0) {
                    const conflicts = currentGame.getConflicts(row, col);
                    if (conflicts.length > 0) {
                        const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.add('cell-error');
                        }
                        
                        conflicts.forEach(conflict => {
                            const conflictCell = this.boardElement.querySelector(`[data-row="${conflict.row}"][data-col="${conflict.col}"]`);
                            if (conflictCell) {
                                conflictCell.classList.add('cell-error');
                            }
                        });
                    }
                }
            }
        }
    }
    
    // 检查杀手数独冲突
    checkKillerConflicts(killerGame) {
        // 清除所有错误标记
        const allCells = this.boardElement.querySelectorAll('.sudoku-cell');
        allCells.forEach(cell => {
            cell.classList.remove('cell-error');
        });
        
        // 检查每个格子的冲突
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = killerGame.getCellValue(row, col);
                if (value !== 0) {
                    const conflicts = killerGame.getConflicts(row, col);
                    if (conflicts.length > 0) {
                        const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.add('cell-error');
                        }
                        
                        conflicts.forEach(conflict => {
                            const conflictCell = this.boardElement.querySelector(`[data-row="${conflict.row}"][data-col="${conflict.col}"]`);
                            if (conflictCell) {
                                conflictCell.classList.add('cell-error');
                            }
                        });
                    }
                }
            }
        }
    }

    // 擦除选中格子的值
    eraseSelectedCell() {
        // 杀手数独模式
        if (this.app.currentMode === 'killer') {
            const killerGame = this.app.killerGame;
            if (!killerGame.selectedCell) return;
            
            const { row, col } = killerGame.selectedCell;
            if (killerGame.isCellFixed(row, col)) return;
            
            killerGame.setCellValue(row, col, 0);
            this.updateKillerCell(row, col, killerGame);
            this.checkKillerConflicts(killerGame);
            return;
        }
        
        // 经典模式
        if (!this.game.selectedCell) return;
        
        const { row, col } = this.game.selectedCell;
        if (this.game.isCellFixed(row, col)) return;
        
        this.game.setCellValue(row, col, 0);
        this.updateCell(row, col);
        this.checkConflicts();
    }

    // 显示提示
    showHint() {
        let hint = null;
        
        // 杀手数独模式
        if (this.app.currentMode === 'killer') {
            hint = this.app.killerGame.useHint();
            if (hint) {
                this.updateKillerCell(hint.row, hint.col, this.app.killerGame);
                this.checkKillerConflicts(this.app.killerGame);
                // 更新提示次数显示
                this.updateKillerGameInfo(this.app.killerGame);
            }
        } else {
            // 经典模式
            hint = this.game.useHint();
            if (hint) {
                this.updateCell(hint.row, hint.col);
                this.checkConflicts();
                // 更新提示次数显示
                this.updateGameInfo();
            }
        }
        
        if (hint) {
            // 高亮提示的格子
            const cell = this.boardElement.querySelector(`[data-row="${hint.row}"][data-col="${hint.col}"]`);
            if (cell) {
                cell.classList.add('flow-green');
                setTimeout(() => {
                    cell.classList.remove('flow-green');
                }, 1000);
            }
        }
    }

    // 显示完成动画
    showCompleteAnimation() {
        const overlay = document.getElementById('completeOverlay');
        const finalTime = document.getElementById('finalTime');
        const hintsUsed = document.getElementById('hintsUsed');
        const nextLevelBtn = document.getElementById('nextLevelBtn');
        
        if (overlay && finalTime && hintsUsed) {
            if (this.app.currentMode === 'memory') {
                finalTime.textContent = this.app.memoryGame.constructor.formatTime(this.app.memoryGame.timer);
                hintsUsed.textContent = `翻牌剩余: ${this.app.memoryGame.flipCardsLeft} 次`;
            } else if (this.app.currentMode === 'math') {
                finalTime.textContent = this.app.mathGame.constructor.formatTime(this.app.mathGame.timer);
                hintsUsed.textContent = `正确率: ${this.app.mathGame.getAccuracy()}%`;
            } else {
                finalTime.textContent = GameManager.formatTime(this.game.timer);
                hintsUsed.textContent = `使用提示: ${this.game.hintsUsed} 次`;
            }
            
            // 根据游戏模式设置按钮文本
            if (nextLevelBtn) {
                // 只有在经典模式的关卡模式下才显示"下一关"
                if (this.app.currentMode === 'classic' && this.game.gameMode === 'level' && this.game.currentLevel) {
                    nextLevelBtn.textContent = '下一关';
                } else {
                    // 其他所有情况（快速游戏、创意模式等）都显示"新游戏"
                    nextLevelBtn.textContent = '新游戏';
                }
            }
            
            overlay.classList.remove('hidden');
            
            // 创建庆祝动画
            this.createConfetti();
        }
    }

    // 创建庆祝动画
    createConfetti() {
        const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        const overlay = document.getElementById('completeOverlay');
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti fixed w-3 h-3 rounded-full';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.top = Math.random() * 100 + '%';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                overlay.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 1000);
            }, i * 20);
        }
    }

    // 渲染关卡列表
    renderLevelGrid() {
        const levelGrid = document.getElementById('levelGrid');
        if (!levelGrid) return;
        
        levelGrid.innerHTML = '';
        const unlockedLevels = GameManager.getUnlockedLevels();
        const history = GameManager.getHistory();
        
        // 统计已完成的关卡
        const completedLevels = new Set();
        history.forEach(record => {
            if (record.mode === 'level' && record.level) {
                completedLevels.add(record.level);
            }
        });
        
        // 更新进度信息
        this.updateLevelProgress(completedLevels.size, unlockedLevels.length);
        
        for (let level = 1; level <= 50; level++) {
            const isUnlocked = unlockedLevels.includes(level);
            const isCompleted = completedLevels.has(level);
            const difficulty = GameManager.getLevelDifficulty(level);
            
            // 创建关卡卡片 - 响应式尺寸
            const card = document.createElement('div');
            card.className = `level-card ${!isUnlocked ? 'locked' : ''} bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden transform transition-all flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]`;
            
            // 获取该关卡的最佳成绩
            const levelRecords = history.filter(r => r.mode === 'level' && r.level === level);
            const bestTime = levelRecords.length > 0 
                ? Math.min(...levelRecords.map(r => r.time))
                : null;
            const bestHints = levelRecords.length > 0
                ? Math.min(...levelRecords.map(r => r.hintsUsed))
                : null;
            
            // 计算星级（基于时间和提示使用）
            let stars = 0;
            if (isCompleted && bestTime !== null) {
                // 根据难度和时间计算星级
                const timeThresholds = {
                    'easy': [180, 300, 600],      // 3分钟, 5分钟, 10分钟
                    'medium': [300, 480, 900],    // 5分钟, 8分钟, 15分钟
                    'hard': [480, 720, 1200],     // 8分钟, 12分钟, 20分钟
                    'expert': [600, 900, 1800]    // 10分钟, 15分钟, 30分钟
                };
                
                const thresholds = timeThresholds[difficulty];
                if (bestTime <= thresholds[0] && bestHints === 0) stars = 3;
                else if (bestTime <= thresholds[1] && bestHints <= 2) stars = 2;
                else if (bestTime <= thresholds[2]) stars = 1;
            }
            
            // 难度颜色
            let difficultyColor = 'bg-slate-300';
            let difficultyGradient = 'from-slate-400 to-slate-500';
            if (isUnlocked) {
                if (difficulty === 'easy') {
                    difficultyColor = 'bg-green-500';
                    difficultyGradient = 'from-green-500 to-green-600';
                } else if (difficulty === 'medium') {
                    difficultyColor = 'bg-yellow-500';
                    difficultyGradient = 'from-yellow-500 to-yellow-600';
                } else if (difficulty === 'hard') {
                    difficultyColor = 'bg-orange-500';
                    difficultyGradient = 'from-orange-500 to-orange-600';
                } else {
                    difficultyColor = 'bg-red-500';
                    difficultyGradient = 'from-red-500 to-red-600';
                }
            }
            
            card.innerHTML = `
                <div class="relative">
                    <!-- 解锁/锁定徽章 -->
                    ${isUnlocked 
                        ? (isCompleted 
                            ? '<div class="unlock-badge">✓</div>' 
                            : '<div class="unlock-badge">🔓</div>')
                        : '<div class="lock-badge">🔒</div>'
                    }
                    
                    <!-- 关卡缩略图 -->
                    <div class="level-thumbnail ${difficultyColor} p-4 sm:p-5 md:p-6 relative overflow-hidden">
                        <!-- 装饰性网格背景 -->
                        <div class="absolute inset-0 opacity-20">
                            <svg class="w-full h-full" viewBox="0 0 90 90">
                                ${this.generateSudokuGridSVG()}
                            </svg>
                        </div>
                        
                        <!-- 关卡号 -->
                        <div class="relative text-center">
                            <div class="text-3xl sm:text-4xl font-black text-white mb-1 sm:mb-2">${level}</div>
                            <div class="text-[10px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider">
                                ${difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : difficulty === 'hard' ? '困难' : '专家'}
                            </div>
                        </div>
                    </div>
                    
                    <!-- 关卡信息 -->
                    <div class="p-2.5 sm:p-3 md:p-4">
                        <!-- 星级显示 -->
                        <div class="flex justify-center gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                            ${[1, 2, 3].map(i => `
                                <svg class="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${i <= stars ? 'text-yellow-400 star-filled' : 'text-slate-300'}" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                            `).join('')}
                        </div>
                        
                        <!-- 最佳成绩 -->
                        ${isCompleted && bestTime !== null ? `
                            <div class="text-center space-y-0.5 sm:space-y-1">
                                <div class="text-[10px] sm:text-xs text-slate-500">最佳成绩</div>
                                <div class="text-xs sm:text-sm font-bold text-blue-600">⏱️ ${GameManager.formatTime(bestTime)}</div>
                                <div class="text-[10px] sm:text-xs text-slate-500">💡 ${bestHints} 次</div>
                            </div>
                        ` : (isUnlocked ? `
                            <div class="text-center">
                                <div class="text-xs sm:text-sm font-semibold text-slate-600">未完成</div>
                                <div class="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">开始挑战</div>
                            </div>
                        ` : `
                            <div class="text-center">
                                <div class="text-xs sm:text-sm font-semibold text-slate-400">未解锁</div>
                                <div class="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">完成前置</div>
                            </div>
                        `)}
                    </div>
                    
                    <!-- 点击遮罩 -->
                    ${isUnlocked ? `
                        <div class="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 hover:from-black/10 hover:to-black/5 active:from-black/15 active:to-black/10 transition-all cursor-pointer"></div>
                    ` : ''}
                </div>
            `;
            
            if (isUnlocked) {
                card.addEventListener('click', () => this.onLevelClick(level));
            }
            
            levelGrid.appendChild(card);
        }
        
        // 设置滚动按钮事件
        this.setupScrollButtons();
    }
    
    // 生成数独网格SVG
    generateSudokuGridSVG() {
        let svg = '';
        for (let i = 0; i <= 9; i++) {
            const strokeWidth = i % 3 === 0 ? 2 : 0.5;
            svg += `<line x1="${i * 10}" y1="0" x2="${i * 10}" y2="90" stroke="white" stroke-width="${strokeWidth}"/>`;
            svg += `<line x1="0" y1="${i * 10}" x2="90" y2="${i * 10}" stroke="white" stroke-width="${strokeWidth}"/>`;
        }
        return svg;
    }
    
    // 更新关卡进度信息
    updateLevelProgress(completed, unlocked) {
        const completedElement = document.getElementById('completedLevels');
        const unlockedElement = document.getElementById('unlockedLevels');
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        
        if (completedElement) completedElement.textContent = completed;
        if (unlockedElement) unlockedElement.textContent = unlocked;
        
        const percent = Math.round((completed / 50) * 100);
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
    }
    
    // 设置滚动按钮
    setupScrollButtons() {
        const container = document.getElementById('levelContainer');
        const scrollLeft = document.getElementById('scrollLeft');
        const scrollRight = document.getElementById('scrollRight');
        
        if (!container || !scrollLeft || !scrollRight) return;
        
        const updateButtons = () => {
            const isAtStart = container.scrollLeft <= 0;
            const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
            
            scrollLeft.disabled = isAtStart;
            scrollRight.disabled = isAtEnd;
        };
        
        // 根据屏幕宽度计算滚动距离
        const getScrollDistance = () => {
            const width = window.innerWidth;
            if (width < 640) return 200; // 移动端
            if (width < 1024) return 300; // 平板
            return 400; // 桌面端
        };
        
        scrollLeft.addEventListener('click', () => {
            container.scrollBy({ left: -getScrollDistance(), behavior: 'smooth' });
            setTimeout(updateButtons, 300);
        });
        
        scrollRight.addEventListener('click', () => {
            container.scrollBy({ left: getScrollDistance(), behavior: 'smooth' });
            setTimeout(updateButtons, 300);
        });
        
        container.addEventListener('scroll', updateButtons);
        
        // 添加触摸滚动支持
        let touchStartX = 0;
        let scrollStartX = 0;
        
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            scrollStartX = container.scrollLeft;
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            const touchX = e.touches[0].clientX;
            const diff = touchStartX - touchX;
            container.scrollLeft = scrollStartX + diff;
        }, { passive: true });
        
        container.addEventListener('touchend', () => {
            updateButtons();
        }, { passive: true });
        
        updateButtons();
        
        // 窗口大小改变时更新按钮状态
        window.addEventListener('resize', updateButtons);
    }

    // 关卡点击事件
    onLevelClick(level) {
        const difficulty = GameManager.getLevelDifficulty(level);
        this.game.gameMode = 'level';
        this.game.startNewGame(difficulty, level);
        this.showScreen('gameScreen');
        this.renderBoard();
        this.renderNumberPad();
        this.updateGameInfo();
    }

    // 渲染历史记录
    renderHistory() {
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        const history = GameManager.getHistory();
        
        if (history.length === 0) {
            historyList.innerHTML = '<p class="text-center text-slate-500">暂无游戏记录</p>';
            return;
        }
        
        history.forEach(record => {
            const item = document.createElement('div');
            item.className = 'bg-slate-100 p-4 rounded-lg shadow-md';
            
            const date = new Date(record.date);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            
            const modeStr = record.mode === 'level' ? `关卡 ${record.level}` : '快速游戏';
            
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-bold text-slate-700">${modeStr} - ${GameManager.getDifficultyName(record.difficulty)}</p>
                        <p class="text-sm text-slate-500">${dateStr}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-blue-600">${GameManager.formatTime(record.time)}</p>
                        <p class="text-sm text-slate-500">提示: ${record.hintsUsed}次</p>
                    </div>
                </div>
            `;
            
            historyList.appendChild(item);
        });
    }

    // 显示指定界面
    showScreen(screenId) {
        const screens = ['mainMenu', 'difficultyMenu', 'levelMenu', 'gameScreen', 'historyScreen', 
                        'creativeModeMenu', 'memoryDifficultyMenu', 'killerDifficultyMenu'];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === screenId) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        });
    }

    // 更新游戏信息
    updateGameInfo() {
        const difficultyElement = document.getElementById('currentDifficulty');
        const hintsElement = document.getElementById('hintsLeft');
        
        if (difficultyElement) {
            difficultyElement.textContent = GameManager.getDifficultyName(this.game.difficulty);
        }
        
        if (hintsElement) {
            hintsElement.textContent = this.game.hintsLeft;
        }
    }

    // 渲染记忆盲解棋盘
    renderMemoryBoard(memoryGame) {
        if (!this.boardElement) return;
        
        this.boardElement.innerHTML = '';
        const size = memoryGame.size;
        
        // 创建棋盘网格
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const baseClasses = 'flex items-center justify-center text-sm sm:text-base md:text-2xl font-bold cursor-pointer transition-all duration-200';
                const bgColor = 'bg-white hover:bg-blue-50 active:bg-blue-100';
                
                let borderClasses = '';
                const boxRowSize = size === 6 ? 2 : 3;
                const boxColSize = size === 6 ? 3 : 3;
                
                // 顶部边框
                if (row === 0) {
                    borderClasses += ' border-t-[3px] sm:border-t-4 border-t-slate-900';
                } else if (row % boxRowSize === 0) {
                    borderClasses += ' border-t-2 sm:border-t-[3px] border-t-slate-800';
                } else {
                    borderClasses += ' border-t border-t-slate-400';
                }
                
                // 左边框
                if (col === 0) {
                    borderClasses += ' border-l-[3px] sm:border-l-4 border-l-slate-900';
                } else if (col % boxColSize === 0) {
                    borderClasses += ' border-l-2 sm:border-l-[3px] border-l-slate-800';
                } else {
                    borderClasses += ' border-l border-l-slate-400';
                }
                
                // 底部边框
                if (row === size - 1) {
                    borderClasses += ' border-b-[3px] sm:border-b-4 border-b-slate-900';
                }
                
                // 右边框
                if (col === size - 1) {
                    borderClasses += ' border-r-[3px] sm:border-r-4 border-r-slate-900';
                }
                
                cell.className += ` ${baseClasses} ${bgColor} ${borderClasses}`;
                
                // 设置单元格内容
                const value = memoryGame.getCellValue(row, col);
                const isHidden = memoryGame.isCellHidden(row, col);
                
                if (value !== 0 && !isHidden) {
                    cell.textContent = value;
                    if (memoryGame.isCellFixed(row, col)) {
                        cell.classList.add('cell-fixed');
                    } else {
                        cell.classList.add('cell-user');
                    }
                } else if (isHidden) {
                    // 隐藏的格子显示为问号
                    cell.textContent = '?';
                    cell.classList.add('text-slate-400', 'cell-hidden');
                }
                
                // 添加点击事件
                cell.addEventListener('click', () => this.onMemoryCellClick(row, col, memoryGame));
                
                this.boardElement.appendChild(cell);
            }
        }
        
        // 设置棋盘网格
        this.boardElement.className = `grid grid-cols-${size} gap-0 shadow-2xl rounded-lg overflow-hidden w-full mx-auto`;
    }

    // 记忆盲解格子点击事件
    async onMemoryCellClick(row, col, memoryGame) {
        if (memoryGame.isPaused) return;
        
        // 如果还在记忆阶段，禁止操作棋盘
        if (memoryGame.memoryPhase) return;
        
        // 如果是隐藏的初始格子，使用翻牌功能
        if (memoryGame.isCellHidden(row, col) && memoryGame.isCellFixed(row, col)) {
            // 检查是否正在翻牌中（防抖）
            if (memoryGame.isFlipping) return;
            
            // 检查是否是同一个格子在2秒内重复点击
            const cellKey = `${row}-${col}`;
            const now = Date.now();
            if (memoryGame.lastFlippedCell === cellKey && 
                memoryGame.lastFlipTime && 
                now - memoryGame.lastFlipTime < 2000) {
                // 2秒内重复点击同一格子，直接显示不扣除次数
                const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    const value = memoryGame.currentPuzzle[row][col];
                    cell.textContent = value;
                    cell.classList.remove('text-slate-400');
                    cell.classList.add('cell-fixed', 'flow-green');
                    
                    memoryGame.isFlipping = true;
                    setTimeout(() => {
                        cell.textContent = '?';
                        cell.classList.add('text-slate-400');
                        cell.classList.remove('cell-fixed', 'flow-green');
                        memoryGame.isFlipping = false;
                    }, 1000);
                }
                return;
            }
            
            if (memoryGame.useFlipCard(row, col)) {
                // 记录翻牌信息
                memoryGame.lastFlippedCell = cellKey;
                memoryGame.lastFlipTime = now;
                memoryGame.isFlipping = true;
                
                // 短暂显示1秒
                const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    const value = memoryGame.currentPuzzle[row][col];
                    cell.textContent = value;
                    cell.classList.remove('text-slate-400');
                    cell.classList.add('cell-fixed', 'flow-green');
                    
                    setTimeout(() => {
                        cell.textContent = '?';
                        cell.classList.add('text-slate-400');
                        cell.classList.remove('cell-fixed', 'flow-green');
                        memoryGame.isFlipping = false;
                    }, 1000);
                }
                
                // 更新翻牌次数显示
                this.updateMemoryGameInfo(memoryGame);
            } else {
                // 翻牌次数用完，提示观看广告
                const result = await this.modal.adConfirm('flip');
                if (result) {
                    // 调用广告管理器
                    if (this.app.adManager) {
                        this.app.adManager.show('flip');
                    }
                }
            }
            return;
        }
        
        if (memoryGame.isCellFixed(row, col)) return;
        
        memoryGame.selectedCell = { row, col };
        this.highlightCell(row, col, memoryGame.size);
    }

    // 更新记忆盲解游戏信息
    updateMemoryGameInfo(memoryGame) {
        const difficultyElement = document.getElementById('currentDifficulty');
        const memoryTimerElement = document.getElementById('memoryTimer');
        const flipCardsElement = document.getElementById('flipCardsLeft');
        
        if (difficultyElement) {
            difficultyElement.textContent = memoryGame.constructor.getDifficultyName(memoryGame.difficulty);
        }
        
        if (memoryTimerElement) {
            memoryTimerElement.textContent = memoryGame.memoryTimer;
        }
        
        if (flipCardsElement) {
            flipCardsElement.textContent = memoryGame.flipCardsLeft;
        }
    }

    // 渲染杀手数独棋盘
    renderKillerBoard(killerGame) {
        if (!this.boardElement) return;
        
        this.boardElement.innerHTML = '';
        
        // 创建9x9网格
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'sudoku-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 获取当前格子所属的笼子
                const cage = killerGame.getCageForCell(row, col);
                
                const baseClasses = 'relative flex items-center justify-center text-sm sm:text-base md:text-2xl font-bold cursor-pointer transition-all duration-200';
                const bgColor = 'hover:bg-blue-50 active:bg-blue-100';
                
                // 设置笼子背景色
                if (cage) {
                    cell.style.backgroundColor = cage.color;
                } else {
                    cell.style.backgroundColor = 'white';
                }
                
                let borderClasses = '';
                
                // 顶部边框
                if (row === 0) {
                    borderClasses += ' border-t-[3px] sm:border-t-4 border-t-slate-900';
                } else if (row % 3 === 0) {
                    borderClasses += ' border-t-2 sm:border-t-[3px] border-t-slate-800';
                } else {
                    borderClasses += ' border-t border-t-slate-400';
                }
                
                // 左边框
                if (col === 0) {
                    borderClasses += ' border-l-[3px] sm:border-l-4 border-l-slate-900';
                } else if (col % 3 === 0) {
                    borderClasses += ' border-l-2 sm:border-l-[3px] border-l-slate-800';
                } else {
                    borderClasses += ' border-l border-l-slate-400';
                }
                
                // 底部边框
                if (row === 8) {
                    borderClasses += ' border-b-[3px] sm:border-b-4 border-b-slate-900';
                }
                
                // 右边框
                if (col === 8) {
                    borderClasses += ' border-r-[3px] sm:border-r-4 border-r-slate-900';
                }
                
                cell.className += ` ${baseClasses} ${bgColor} ${borderClasses}`;
                
                // 如果是笼子的第一个格子（左上角），显示目标值
                if (cage && cage.cells && cage.cells.length > 0 && cage.cells[0] && cage.cells[0].row === row && cage.cells[0].col === col) {
                    const targetLabel = document.createElement('span');
                    targetLabel.className = 'absolute top-0 left-0 text-[8px] sm:text-[10px] font-bold text-slate-700 px-0.5';
                    targetLabel.textContent = cage.target;
                    targetLabel.style.cursor = 'help';
                    
                    // 添加鼠标悬停事件显示公式
                    targetLabel.addEventListener('mouseenter', () => {
                        this.showCageFormula(cage);
                    });
                    targetLabel.addEventListener('mouseleave', () => {
                        this.hideCageFormula();
                    });
                    
                    cell.appendChild(targetLabel);
                }
                
                // 设置单元格内容
                const value = killerGame.getCellValue(row, col);
                if (value !== 0) {
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = value;
                    cell.appendChild(valueSpan);
                    
                    if (killerGame.isCellFixed(row, col)) {
                        cell.classList.add('cell-fixed');
                    } else {
                        cell.classList.add('cell-user');
                    }
                }
                
                // 添加点击事件
                cell.addEventListener('click', () => this.onCellClick(row, col));
                
                this.boardElement.appendChild(cell);
            }
        }
        
        // 设置棋盘为9x9网格
        this.boardElement.className = 'grid grid-cols-9 gap-0 shadow-2xl rounded-lg overflow-hidden w-full mx-auto';
    }

    // 显示笼子公式
    showCageFormula(cage) {
        // 创建或更新公式提示框
        let tooltip = document.getElementById('cageFormulaTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'cageFormulaTooltip';
            tooltip.className = 'fixed bg-slate-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50';
            document.body.appendChild(tooltip);
        }
        
        // 根据当前棋盘状态生成动态公式
        const dynamicFormula = this.generateDynamicFormula(cage);
        tooltip.textContent = dynamicFormula;
        tooltip.classList.remove('hidden');
        
        // 定位到鼠标位置
        document.addEventListener('mousemove', this.updateTooltipPosition);
    }
    
    // 根据当前棋盘状态生成动态公式
    generateDynamicFormula(cage) {
        if (!cage || !cage.cells || !cage.operators) {
            return cage.formula;
        }
        
        // 获取当前游戏实例
        const killerGame = this.app.killerGame;
        if (!killerGame || !killerGame.currentPuzzle) {
            return cage.formula;
        }
        
        // 构建公式，将初始化数字显示出来
        let formulaParts = [];
        
        cage.cells.forEach((cell, index) => {
            // 检查该格子在puzzle中是否有初始值
            const puzzleValue = killerGame.currentPuzzle[cell.row][cell.col];
            
            if (index === 0) {
                // 第一个元素
                formulaParts.push(puzzleValue !== 0 ? puzzleValue.toString() : '□');
            } else {
                // 后续元素，添加运算符
                const operator = cage.operators[index - 1] || '+';
                const value = puzzleValue !== 0 ? puzzleValue.toString() : '□';
                formulaParts.push(` ${operator} ${value}`);
            }
        });
        
        return formulaParts.join('') + ` = ${cage.target}`;
    }

    // 隐藏笼子公式
    hideCageFormula() {
        const tooltip = document.getElementById('cageFormulaTooltip');
        if (tooltip) {
            tooltip.classList.add('hidden');
        }
        document.removeEventListener('mousemove', this.updateTooltipPosition);
    }

    // 更新提示框位置
    updateTooltipPosition(e) {
        const tooltip = document.getElementById('cageFormulaTooltip');
        if (tooltip) {
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
        }
    }

    // 更新杀手数独游戏信息
    updateKillerGameInfo(killerGame) {
        const difficultyElement = document.getElementById('currentDifficulty');
        const hintsElement = document.getElementById('hintsLeft');
        
        if (difficultyElement) {
            difficultyElement.textContent = killerGame.constructor.getDifficultyName(killerGame.difficulty);
        }
        
        if (hintsElement) {
            hintsElement.textContent = killerGame.hintsLeft;
        }
    }

    // 更新杀手数独单个单元格
    updateKillerCell(row, col, killerGame) {
        const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        const value = killerGame.getCellValue(row, col);
        
        // 清空单元格内容（保留目标值标签）
        const targetLabel = cell.querySelector('span.absolute');
        cell.innerHTML = '';
        if (targetLabel) {
            cell.appendChild(targetLabel);
        }
        
        // 添加数字
        if (value !== 0) {
            const valueSpan = document.createElement('span');
            valueSpan.textContent = value;
            cell.appendChild(valueSpan);
            
            if (!killerGame.isCellFixed(row, col)) {
                cell.classList.add('cell-user');
            }
        } else {
            cell.classList.remove('cell-user');
        }
    }

    // 更新记忆模式单个单元格
    updateMemoryCell(row, col, memoryGame) {
        const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        const value = memoryGame.getCellValue(row, col);
        const isHidden = memoryGame.isCellHidden(row, col);
        
        if (value !== 0 && !isHidden) {
            cell.textContent = value;
            cell.classList.remove('text-slate-400', 'cell-hidden');
            if (!memoryGame.isCellFixed(row, col)) {
                cell.classList.add('cell-user');
            }
        } else if (isHidden) {
            cell.textContent = '?';
            cell.classList.add('text-slate-400', 'cell-hidden');
        } else {
            cell.textContent = '';
            cell.classList.remove('cell-user', 'text-slate-400', 'cell-hidden');
        }
    }

    // 检查记忆模式冲突
    checkMemoryConflicts(memoryGame) {
        // 清除所有错误标记
        const allCells = this.boardElement.querySelectorAll('.sudoku-cell');
        allCells.forEach(cell => {
            cell.classList.remove('cell-error');
        });
        
        // 检查每个格子的冲突
        const size = memoryGame.size;
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                const value = memoryGame.getCellValue(row, col);
                if (value !== 0) {
                    const conflicts = memoryGame.getConflicts(row, col);
                    if (conflicts.length > 0) {
                        const cell = this.boardElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                        if (cell) {
                            cell.classList.add('cell-error');
                        }
                        
                        conflicts.forEach(conflict => {
                            const conflictCell = this.boardElement.querySelector(`[data-row="${conflict.row}"][data-col="${conflict.col}"]`);
                            if (conflictCell) {
                                conflictCell.classList.add('cell-error');
                            }
                        });
                    }
                }
            }
        }
    }
}
