# sudoku_game
数独游戏

## 启动游戏方式一：使用 Python
### 启动服务器
`python -m http.server 8919`

### 打开浏览器访问
`http://localhost:8919`

---

## 启动游戏方式二：打包成 exe
### 安装依赖
`pip install flask pyinstaller`

### 打包成 exe 执行文件
`pyinstaller --onefile --noconsole --add-data "index.html;." --add-data "js;js" --name "创意数独" --icon "app.ico" server.py`