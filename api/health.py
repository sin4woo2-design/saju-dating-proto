from http.server import BaseHTTPRequestHandler

from vercel_provider_runtime import handle_health_request, handle_method_not_allowed, handle_options_request


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        handle_health_request(self)

    def do_OPTIONS(self):
        handle_options_request(self)

    def do_POST(self):
        handle_method_not_allowed(self, "GET, OPTIONS")

    def log_message(self, format, *args):  # noqa: A003
        return
