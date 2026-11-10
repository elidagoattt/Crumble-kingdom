"""Crumble Kingdom web server.

Serves the game in client/ and tells the game which replacement art files exist in client/assets/.
Uses only the Python standard library, so there is nothing to install.
"""
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent / 'client'
ASSETS = ROOT / 'assets'
ART_TYPES = {'.png', '.webp', '.jpg', '.jpeg', '.svg', '.mp3'}


def art_files():
    if not ASSETS.is_dir():
        return []
    return sorted(p.name for p in ASSETS.iterdir() if p.is_file() and p.suffix.lower() in ART_TYPES)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path == '/api/art':
            return self.send_json({'files': art_files()})
        if path == '/healthz':
            return self.send_json({'ok': True})
        return super().do_GET()

    def send_json(self, data):
        body = json.dumps(data).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # Code and art change with each update, so browsers should always check for the newest copy.
        if 'Cache-Control' not in self._headers_buffer_text():
            self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def _headers_buffer_text(self):
        return b''.join(getattr(self, '_headers_buffer', [])).decode('latin-1')

    def log_message(self, fmt, *args):
        if os.environ.get('PQ_LOG'):
            super().log_message(fmt, *args)


def main():
    port = int(os.environ.get('PORT', '8080'))
    server = ThreadingHTTPServer(('0.0.0.0', port), Handler)
    print(f'Crumble Kingdom running on port {port}', flush=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
