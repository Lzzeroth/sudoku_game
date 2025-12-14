// 动态背景动画模块

export class BackgroundAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 150;
        this.connectionDistance = 180;
        this.mouse = { x: null, y: null, radius: 100 }; // 鼠标交互范围
        
        this.resize();
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.resize());
        
        // 添加鼠标移动事件监听
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        // 鼠标离开画布时重置
        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    // 调整画布大小
    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // 窗口大小改变时重新初始化粒子位置
        if (this.particles.length > 0) {
            this.init();
        }
    }

    // 初始化粒子 - 均匀分布在整个画布
    init() {
        this.particles = [];
        const cols = Math.ceil(Math.sqrt(this.particleCount * (this.canvas.width / this.canvas.height)));
        const rows = Math.ceil(this.particleCount / cols);
        const cellWidth = this.canvas.width / cols;
        const cellHeight = this.canvas.height / rows;
        
        for (let i = 0; i < this.particleCount; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            // 在每个网格单元内随机位置，确保分布均匀
            const x = col * cellWidth + Math.random() * cellWidth;
            const y = row * cellHeight + Math.random() * cellHeight;
            
            this.particles.push(new Particle(this.canvas.width, this.canvas.height, x, y));
        }
    }

    // 动画循环
    animate() {
        if (!this.ctx || !this.canvas) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 更新和绘制粒子
        this.particles.forEach(particle => {
            particle.update(this.canvas.width, this.canvas.height, this.mouse);
            particle.draw(this.ctx);
        });
        
        // 绘制连接线
        this.drawConnections();
        
        requestAnimationFrame(() => this.animate());
    }

    // 绘制粒子之间的连接线
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    const opacity = (1 - distance / this.connectionDistance) * 0.5;
                    this.ctx.strokeStyle = `rgba(45, 55, 85, ${opacity})`;
                    this.ctx.lineWidth = 1.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

class Particle {
    constructor(canvasWidth, canvasHeight, x, y) {
        // 使用传入的坐标，确保均匀分布
        this.x = x;
        this.y = y;
        // 不再记录初始位置，让粒子自由飘动
        // 随机初始速度
        this.vx = (Math.random() - 0.5) * 1.2;
        this.vy = (Math.random() - 0.5) * 1.2;
        this.radius = Math.random() * 2.5 + 1.5;
        
        const colors = [
            `rgba(45, 55, 85, ${Math.random() * 0.4 + 0.6})`,
            `rgba(55, 45, 85, ${Math.random() * 0.4 + 0.6})`,
            `rgba(35, 45, 75, ${Math.random() * 0.4 + 0.6})`,
            `rgba(50, 50, 80, ${Math.random() * 0.4 + 0.6})`,
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    // 更新粒子位置
    update(canvasWidth, canvasHeight, mouse) {
        // 鼠标交互效果
        if (mouse.x !== null && mouse.y !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 在鼠标范围内的粒子会被排斥
            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force * 1.0;
                this.vy += Math.sin(angle) * force * 1.0;
            }
        }
        
        // 移除回弹力，让粒子自由飘动
        // 只保留轻微的阻尼，防止速度无限增长
        this.vx *= 0.995;
        this.vy *= 0.995;
        
        // 确保粒子保持最小速度，不会完全静止
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const minSpeed = 0.3;
        if (speed < minSpeed && speed > 0) {
            const scale = minSpeed / speed;
            this.vx *= scale;
            this.vy *= scale;
        }
        
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 边界检测 - 反弹并保持运动
        if (this.x <= 0 || this.x >= canvasWidth) {
            this.vx = -this.vx * 0.8; // 反弹时保留80%的速度
            this.x = this.x <= 0 ? 0 : canvasWidth;
        }
        if (this.y <= 0 || this.y >= canvasHeight) {
            this.vy = -this.vy * 0.8;
            this.y = this.y <= 0 ? 0 : canvasHeight;
        }
    }

    // 绘制粒子
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}