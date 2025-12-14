// 模态弹窗管理模块

export class ModalManager {
  constructor() {
    this.overlay = null;
    this.modal = null;
    this.title = null;
    this.message = null;
    this.confirmBtn = null;
    this.cancelBtn = null;
    this.resolveCallback = null;
    
    this.init();
  }

  // 初始化模态弹窗
  init() {
    this.overlay = document.getElementById('customModalOverlay');
    this.modal = document.getElementById('customModal');
    this.title = document.getElementById('modalTitle');
    this.message = document.getElementById('modalMessage');
    this.confirmBtn = document.getElementById('modalConfirmBtn');
    this.cancelBtn = document.getElementById('modalCancelBtn');
    
    if (!this.overlay || !this.modal) {
      console.error('模态弹窗元素未找到');
      return;
    }
    
    this.bindEvents();
  }

  // 绑定事件
  bindEvents() {
    // 确认按钮
    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => {
        this.close(true);
      });
    }
    
    // 取消按钮
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => {
        this.close(false);
      });
    }
    
    // 点击遮罩层关闭
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close(false);
        }
      });
    }
    
    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('hidden')) {
        this.close(false);
      }
    });
  }

  // 显示模态弹窗
  show(options = {}) {
    return new Promise((resolve) => {
      this.resolveCallback = resolve;
      
      const {
        title = '提示',
        message = '',
        confirmText = '确定',
        cancelText = '取消',
        type = 'confirm' // 'confirm' 或 'alert'
      } = options;
      
      // 设置内容
      if (this.title) {
        this.title.textContent = title;
      }
      
      if (this.message) {
        this.message.textContent = message;
      }
      
      if (this.confirmBtn) {
        this.confirmBtn.textContent = confirmText;
      }
      
      if (this.cancelBtn) {
        this.cancelBtn.textContent = cancelText;
        // 如果是 alert 类型，隐藏取消按钮
        if (type === 'alert') {
          this.cancelBtn.classList.add('hidden');
        } else {
          this.cancelBtn.classList.remove('hidden');
        }
      }
      
      // 显示模态弹窗
      if (this.overlay) {
        this.overlay.classList.remove('hidden');
        // 添加动画
        setTimeout(() => {
          this.overlay.classList.add('modal-show');
        }, 10);
      }
    });
  }

  // 关闭模态弹窗
  close(result) {
    if (this.overlay) {
      this.overlay.classList.remove('modal-show');
      
      setTimeout(() => {
        this.overlay.classList.add('hidden');
        
        // 调用回调
        if (this.resolveCallback) {
          this.resolveCallback(result);
          this.resolveCallback = null;
        }
      }, 300); // 等待动画完成
    }
  }

  // 便捷方法：确认对话框
  confirm(message, options = {}) {
    return this.show({
      message,
      type: 'confirm',
      ...options
    });
  }

  // 便捷方法：警告对话框
  alert(message, options = {}) {
    return this.show({
      message,
      type: 'alert',
      confirmText: '知道了',
      ...options
    });
  }

  // 便捷方法：广告确认对话框
  adConfirm(rewardType) {
    const messages = {
      hint: '提示已用完！是否观看15秒广告获得1次提示机会？',
      flip: '翻牌次数已用完！是否观看15秒广告获得1次翻牌机会？'
    };
    
    return this.show({
      title: '获取奖励',
      message: messages[rewardType] || messages.hint,
      confirmText: '观看广告',
      cancelText: '取消',
      type: 'confirm'
    });
  }

  // 便捷方法：重新开始确认
  restartConfirm() {
    return this.show({
      title: '重新开始',
      message: '确定要重新开始吗？当前进度将会丢失。',
      confirmText: '重新开始',
      cancelText: '取消',
      type: 'confirm'
    });
  }

  // 便捷方法：新游戏确认
  newGameConfirm() {
    return this.show({
      title: '开始新游戏',
      message: '确定要开始新游戏吗？当前进度将会丢失。',
      confirmText: '开始新游戏',
      cancelText: '取消',
      type: 'confirm'
    });
  }
}

// 创建全局单例
let modalInstance = null;

export function getModalManager() {
  if (!modalInstance) {
    modalInstance = new ModalManager();
  }
  return modalInstance;
}
