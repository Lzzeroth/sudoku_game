// Toast 提示组件
// 用于替代 alert，提供更友好的用户体验

export class ToastManager {
  constructor() {
    this.container = null;
    this.queue = [];
    this.isShowing = false;
    this.init();
  }

  // 初始化 Toast 容器
  init() {
    // 检查是否已存在容器
    this.container = document.getElementById('toastContainer');
    
    if (!this.container) {
      // 创建容器
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
      
      // 添加样式
      this.addStyles();
    }
  }

  // 添加样式
  addStyles() {
    const styleId = 'toastStyles';
    
    // 检查样式是否已存在
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        pointer-events: none;
      }

      .toast {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        margin-bottom: 12px;
        min-width: 280px;
        max-width: 500px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 15px;
        line-height: 1.5;
        backdrop-filter: blur(10px);
      }

      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .toast.hide {
        opacity: 0;
        transform: translateY(-20px);
      }

      .toast-icon {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .toast-content {
        flex: 1;
        font-weight: 500;
      }

      .toast-close {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border: none;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: background 0.2s;
        padding: 0;
        line-height: 1;
      }

      .toast-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .toast.success {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .toast.info {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      .toast.warning {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      .toast.error {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }

      @media (max-width: 640px) {
        .toast-container {
          left: 12px;
          right: 12px;
          transform: none;
        }

        .toast {
          min-width: auto;
          max-width: none;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  // 显示 Toast
  show(message, options = {}) {
    const {
      type = 'success', // 'success', 'info', 'warning', 'error'
      duration = 3000, // 持续时间（毫秒），0 表示不自动关闭
      closable = true, // 是否显示关闭按钮
      icon = null // 自定义图标
    } = options;

    // 创建 Toast 元素
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // 图标映射
    const iconMap = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    
    const toastIcon = icon || iconMap[type] || iconMap.success;
    
    // 构建 Toast 内容
    toast.innerHTML = `
      <div class="toast-icon">${toastIcon}</div>
      <div class="toast-content">${message}</div>
      ${closable ? '<button class="toast-close" aria-label="关闭">×</button>' : ''}
    `;
    
    // 添加到容器
    this.container.appendChild(toast);
    
    // 触发动画
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // 绑定关闭按钮事件
    if (closable) {
      const closeBtn = toast.querySelector('.toast-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.hide(toast);
        });
      }
    }
    
    // 自动关闭
    if (duration > 0) {
      setTimeout(() => {
        this.hide(toast);
      }, duration);
    }
    
    return toast;
  }

  // 隐藏 Toast
  hide(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // 便捷方法：成功提示
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  // 便捷方法：信息提示
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }

  // 便捷方法：警告提示
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  // 便捷方法：错误提示
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' });
  }

  // 清除所有 Toast
  clearAll() {
    const toasts = this.container.querySelectorAll('.toast');
    toasts.forEach(toast => this.hide(toast));
  }
}

// 创建全局单例
let toastInstance = null;

export function getToastManager() {
  if (!toastInstance) {
    toastInstance = new ToastManager();
  }
  return toastInstance;
}

// 便捷的全局方法
export const toast = {
  show: (message, options) => getToastManager().show(message, options),
  success: (message, options) => getToastManager().success(message, options),
  info: (message, options) => getToastManager().info(message, options),
  warning: (message, options) => getToastManager().warning(message, options),
  error: (message, options) => getToastManager().error(message, options),
  clearAll: () => getToastManager().clearAll()
};
