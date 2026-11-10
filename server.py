"""Crumble Kingdom — browser test web service."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?", 1)[0] == "/health":
            payload = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "10000"))
    print(f"Crumble Kingdom Test running on {port}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
