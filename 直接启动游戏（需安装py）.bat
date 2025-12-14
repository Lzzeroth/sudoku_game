@echo off
start http://localhost:8919
python -m http.server 8919
pause