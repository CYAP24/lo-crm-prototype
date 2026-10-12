"""Static server for the CRM mock-ups.

Plain `python -m http.server` lets the browser cache files, which bites during
iteration: a version gets rewritten in place, the filename does not change, and
the browser keeps showing the previous design. This sends no-store on
everything so a refresh always reflects what is on disk.

    python serve.py          # port 8137
    python serve.py 9000     # any other port
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Keep the console readable: only report anything that is not a 200.
        if not str(args[1] if len(args) > 1 else "").startswith("2"):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8137
    handler = partial(NoCacheHandler, directory=".")
    with ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"CRM mock-ups on http://localhost:{port}/  (no-store; Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
