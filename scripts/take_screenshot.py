#!/usr/bin/env python3
"""
Captura una captura de pantalla de la build de frontend con Playwright para inspección visual.
Sirve frontend/dist mediante un servidor HTTP local para garantizar la carga de módulos ES y assets.
"""
import sys
import os
import time
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def capture(output_path, viewport_width=1280, viewport_height=720):
    dist_dir = os.path.abspath('frontend/dist')
    if not os.path.isdir(dist_dir):
        print(f"Error: {dist_dir} does not exist. Run 'bun run build' first.")
        sys.exit(1)

    port = find_free_port()
    
    class SilentHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=dist_dir, **kwargs)
        def log_message(self, format, *args):
            pass

    httpd = HTTPServer(('127.0.0.1', port), SilentHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    url = f'http://127.0.0.1:{port}/index.html'
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': viewport_width, 'height': viewport_height})
            page.goto(url)
            # Esperar a que la imagen de fondo y los sprites se hayan cargado
            page.wait_for_selector('.scene-background')
            page.wait_for_selector('#twinber-actor')
            page.wait_for_timeout(1500)
            page.screenshot(path=output_path)
            browser.close()
        print(f'Screenshot saved to {output_path}')
    finally:
        httpd.shutdown()

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'screenshot_demo.png'
    capture(out)

