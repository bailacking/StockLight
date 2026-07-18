#!/usr/bin/env python3
"""
启动本地HTTP服务，服务根目录指向 web/
绑定 0.0.0.0:8000，支持本机和局域网访问
"""
import http.server
import os
import socket
import sys

PORT = 8000
WEB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main():
    if not os.path.isdir(WEB_DIR):
        print(f"错误: web目录不存在 - {WEB_DIR}")
        sys.exit(1)

    os.chdir(WEB_DIR)

    local_ip = get_local_ip()
    print("=" * 50)
    print("  StockLight 行情服务已启动")
    print("=" * 50)
    print(f"  本机访问: http://127.0.0.1:{PORT}/")
    print(f"  局域网访问: http://{local_ip}:{PORT}/")
    print(f"  服务根目录: {WEB_DIR}")
    print("-" * 50)
    print("  按 Ctrl+C 停止服务")
    print("=" * 50)
    print()
    print("  Windows 防火墙可能拦截局域网访问，")
    print("  如手机无法访问请检查防火墙设置。")
    print()

    class CacheHandler(http.server.SimpleHTTPRequestHandler):
        def end_headers(self):
            path = self.path.split("?")[0]
            if path.endswith(".js") or path.endswith(".css"):
                self.send_header("Cache-Control", "public, max-age=86400")
            elif path.endswith(".json"):
                self.send_header("Cache-Control", "no-cache")
            elif path.endswith(".html"):
                self.send_header("Cache-Control", "no-cache")
            super().end_headers()

    handler = CacheHandler

    try:
        server = http.server.HTTPServer(("0.0.0.0", PORT), handler)
        server.serve_forever()
    except OSError as e:
        if e.errno == 10048:
            print(f"错误: 端口 {PORT} 已被占用，请关闭占用程序或更换端口")
            sys.exit(1)
        else:
            print(f"错误: {e}")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n服务已停止")
        server.server_close()


if __name__ == "__main__":
    main()
