from flask import Flask, send_from_directory
import webbrowser
import os
from threading import Timer

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

def open_browser():
    webbrowser.open('http://127.0.0.1:8919')

if __name__ == '__main__':
    Timer(1, open_browser).start()
    app.run(port=8919, debug=False)