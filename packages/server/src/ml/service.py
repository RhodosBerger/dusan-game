# packages/server/src/ml/service.py
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from combat_kmeans_balancer import train_and_predict_archetype

class MLRequestHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress request log outputs to keep test logs readable
        return

    def do_GET(self):
        if self.path == "/api/ml/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            payload = {"status": "ONLINE", "engine": "StdLib + Warm Weights"}
            self.wfile.write(json.dumps(payload).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/ml/combat/classify":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                history = payload.get("combat_history", [])
                
                # Perform prediction using warm-loaded model
                archetype = train_and_predict_archetype(history)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                res_payload = {"status": "SUCCESS", "dominant_archetype": archetype}
                self.wfile.write(json.dumps(res_payload).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))

        elif self.path == "/api/ml/math/resolve":
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                payload = json.loads(post_data.decode('utf-8'))
                voltage = float(payload.get("voltage", 0.0))
                current = float(payload.get("current", 0.0))
                resistance = float(payload.get("resistance", 1.0))
                entropy = float(payload.get("entropy", 0.0))
                player_health = float(payload.get("player_health", 15.0))
                npc_health = float(payload.get("npc_health", 15.0))

                from math_neural_resolver import resolver_instance
                result = resolver_instance.resolve(
                    voltage, current, resistance, entropy, player_health, npc_health
                )

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                res_payload = {"status": "SUCCESS", "result": result}
                self.wfile.write(json.dumps(res_payload).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

class ReusableHTTPServer(HTTPServer):
    allow_reuse_address = True

def run(port=8000):
    server_address = ('127.0.0.1', port)
    try:
        httpd = ReusableHTTPServer(server_address, MLRequestHandler)
    except OSError as e:
        if e.errno == 98:
            print(f"[ML SERVER] Port {port} is already in use. Service is likely already running.")
            return
        raise e
    print(f"[ML SERVER] Running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("[ML SERVER] Shutting down.")
        httpd.server_close()

if __name__ == "__main__":
    run()
