import { toast } from './toast.js';
// 广告弹窗管理模块
/*
用户点击提示按钮或翻牌按钮
    ↓
检查提示次数或翻牌次数
    ↓
次数用完 → 显示确认对话框
    ↓
用户确认 → adManager.show(rewardType)
    ↓
15秒倒计时 + 进度条动画
    ↓
倒计时结束 → 显示关闭按钮
    ↓
用户点击关闭 → closeAndReward()
    ↓
根据rewardType增加对应次数 + 触发事件
    ↓
UI自动更新显示
*/

export class AdManager {
    constructor(gameManager, memoryGameManager = null) {
        this.game = gameManager;
        this.memoryGame = memoryGameManager;
        this.killerGame = null; // 添加杀手数独游戏实例
        this.adTimer = null;
        this.adDuration = 15; // 广告时长（秒）
        this.currentRewardType = 'hint'; // 'hint' 或 'flip'
        
        this.initElements();
        this.bindEvents();
    }

    // 初始化DOM元素引用
    initElements() {
        this.overlay = document.getElementById('adOverlay');
        this.countdown = document.getElementById('adCountdown');
        this.progress = document.getElementById('adProgress');
        this.closeBtn = document.getElementById('closeAdBtn');
        this.closeEarlyBtn = document.getElementById('closeAdEarly');
    }

    // 绑定事件监听器
    bindEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeAndReward());
        }
        
        if (this.closeEarlyBtn) {
            this.closeEarlyBtn.addEventListener('click', () => this.closeEarly());
        }
    }

    // 检查是否可以观看广告（提示次数）
    canWatchAdForHint() {
        // 根据当前游戏模式检查对应的提示次数
        if (this.killerGame && window.app && window.app.currentMode === 'killer') {
            return this.killerGame.hintsLeft === 0;
        }
        return this.game.hintsLeft === 0;
    }

    // 检查是否可以观看广告（翻牌次数）
    canWatchAdForFlip() {
        return this.memoryGame && this.memoryGame.flipCardsLeft === 0;
    }

    // 显示广告弹窗
    show(rewardType = 'hint') {
        if (!this.overlay || !this.countdown || !this.progress || !this.closeBtn) {
            console.error('广告弹窗元素未找到');
            return;
        }
        
        // 保存奖励类型
        this.currentRewardType = rewardType;
        
        // 清除之前的倒计时器（如果存在）
        this.clearTimer();
        
        // 显示弹窗
        this.overlay.classList.remove('hidden');
        this.closeBtn.classList.add('hidden');
        
        // 重置倒计时
        let timeLeft = this.adDuration;
        this.countdown.textContent = timeLeft;
        this.progress.style.width = '0%';
        
        // 开始倒计时
        this.adTimer = setInterval(() => {
            timeLeft--;
            this.countdown.textContent = timeLeft;
            this.progress.style.width = `${((this.adDuration - timeLeft) / this.adDuration) * 100}%`;
            
            if (timeLeft <= 0) {
                this.clearTimer();
                // 显示关闭按钮
                this.closeBtn.classList.remove('hidden');
            }
        }, 1000);
    }

    // 关闭广告弹窗并给予奖励
    closeAndReward() {
        this.hide();
        
        // 根据奖励类型给予不同奖励
        if (this.currentRewardType === 'hint') {
            this.earnHintFromAd();
        } else if (this.currentRewardType === 'flip') {
            this.earnFlipFromAd();
        }
        
        // 触发自定义事件，通知UI更新
        this.dispatchUpdateEvent();
    }

    // 通过观看广告增加提示次数
    earnHintFromAd() {
        // 根据当前游戏模式增加对应的提示次数
        if (this.killerGame && window.app && window.app.currentMode === 'killer') {
            this.killerGame.hintsLeft++;
            
            // 更新提示显示
            const hintsElement = document.getElementById('hintsLeft');
            if (hintsElement) {
                hintsElement.textContent = this.killerGame.hintsLeft;
            }
        } else {
            this.game.hintsLeft++;
            this.game.adHintsEarned++;
            
            // 更新提示显示
            const hintsElement = document.getElementById('hintsLeft');
            if (hintsElement) {
                hintsElement.textContent = this.game.hintsLeft;
            }
        }
    }

    // 通过观看广告增加翻牌次数
    earnFlipFromAd() {
        if (!this.memoryGame) return;
        
        this.memoryGame.flipCardsLeft++;
        
        // 更新翻牌次数显示
        const flipCardsElement = document.getElementById('flipCardsLeft');
        if (flipCardsElement) {
            flipCardsElement.textContent = this.memoryGame.flipCardsLeft;
        }
    }

    // 提前关闭广告弹窗（不给予奖励）
    closeEarly() {
        this.hide();
        // 不增加提示次数，直接关闭
    }

    // 隐藏广告弹窗
    hide() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }
        this.clearTimer();
    }

    // 清除倒计时器
    clearTimer() {
        if (this.adTimer) {
            clearInterval(this.adTimer);
            this.adTimer = null;
        }
    }

    // 触发更新事件
    dispatchUpdateEvent() {
        const detail = {
            rewardType: this.currentRewardType,
            hintsLeft: this.game.hintsLeft
        };
        
        if (this.memoryGame) {
            detail.flipCardsLeft = this.memoryGame.flipCardsLeft;
        }
        
        if (this.killerGame) {
            detail.killerHintsLeft = this.killerGame.hintsLeft;
        }
        
        const event = new CustomEvent('adRewardEarned', { detail });
        document.dispatchEvent(event);
    }

    // 设置记忆游戏实例（用于动态切换游戏模式）
    setMemoryGame(memoryGame) {
        this.memoryGame = memoryGame;
    }

    // 设置杀手数独游戏实例
    setKillerGame(killerGame) {
        this.killerGame = killerGame;
    }

    // 销毁实例
    destroy() {
        this.clearTimer();
        
        // 移除事件监听器
        if (this.closeBtn) {
            this.closeBtn.removeEventListener('click', this.closeAndReward);
        }
        
        if (this.closeEarlyBtn) {
            this.closeEarlyBtn.removeEventListener('click', this.closeEarly);
        }
    }
}
