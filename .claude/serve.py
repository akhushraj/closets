# Local preview server that disables browser caching, so edited ES modules always reload.
import http.server, functools, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8742
root = sys.argv[2] if len(sys.argv) > 2 else "."
http.server.ThreadingHTTPServer(("", port), functools.partial(NoCache, directory=root)).serve_forever()
