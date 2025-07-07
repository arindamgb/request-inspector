from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from datetime import datetime
from zoneinfo import ZoneInfo
import os
from collections import deque
from dotenv import load_dotenv
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)
logger = logging.getLogger(__name__)


load_dotenv()  # Loads from .env
max_logs = int(os.getenv("MAX_REQUEST_LOGS", 10))
MAX_CLIENTS = int(os.getenv("MAX_CLIENTS", 3))
timezone = os.getenv("TIMEZONE", "UTC")
tz = ZoneInfo(timezone)

# Set up a global set to track connected clients
connected_clients = set()

requests_log = deque(maxlen=max_logs) # Global log buffer. keeps last 10 requests by default, 100 if not specified

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    if len(connected_clients) >= MAX_CLIENTS:
        logger.warning("❌ Too many clients connected — rejecting new connection.")
        return False  # Reject connection
    client_id = request.sid
    connected_clients.add(client_id)
    logger.info(f"Client connected: {client_id} | Total: {len(connected_clients)} | Max: {MAX_CLIENTS}")

@socketio.on('disconnect')
def handle_disconnect():
    client_id = request.sid
    connected_clients.discard(client_id)
    logger.info(f"Client disconnected: {client_id} | Total: {len(connected_clients)} | Max: {MAX_CLIENTS}")

#requests_log = []

@app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'])
@app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'])
def catch_all(path):
#     req_data = {
#         'timestamp': datetime.utcnow().isoformat(),
#         'method': request.method,
#         'path': request.path,
#         'headers': dict(request.headers),
#         'args': request.args.to_dict(),
#         'json': request.get_json(silent=True),
#         'form': request.form.to_dict(),
#         'data': request.data.decode('utf-8'),
#         'ip': request.remote_addr
#     }
    req_data = {
        #'timestamp': datetime.utcnow().isoformat(),
        'timestamp': datetime.now(tz).strftime("%d-%b-%Y %I:%M:%S %p"),
        'method': request.method,
        'scheme': request.scheme, # 'http' or 'https'
        'path': request.path,
        'full_url': request.url,
        'host': request.host, # HTTP/1.1 requires the Host header, but Flask handles cases where it’s missing by reconstructing it from the socket.
        'Host_header': request.headers.get('Host', '❌'),
        #'endpoint': request.endpoint, # In Flask, it returns the name of the view function that is handling the current request.
        'headers': dict(request.headers),
        'args': request.args.to_dict(),
        'json-data': request.get_json(silent=True),
        'form-data': request.form.to_dict(),
        'raw-data': request.data.decode('utf-8'),
        'cookies': request.cookies,
        'authorization': request.headers.get("Authorization"),
        #'content_type': request.content_type,
        #'content_length': request.content_length,
        #'user_agent': request.user_agent.string,
        #'is_secure': request.is_secure,
        'origin': request.headers.get('Origin', '❌'),
        'client-ip': request.remote_addr
    }

    logger.info(request.__dict__)
    logger.info(f"📥 Received {request.method} request on {request.path} from {request.remote_addr}")
    logger.info(f"🔍 Query Params: {request.args.to_dict()}")
    logger.info(f"🧾 Headers: {dict(request.headers)}")
    if request.is_json:
        logger.info(f"📦 JSON Payload: {request.get_json(silent=True)}")
    elif request.form:
        logger.info(f"📨 Form Data: {request.form.to_dict()}")
    elif request.data:
        logger.info(f"📄 Raw Body: {request.data.decode('utf-8')[:500]}")  # Limit large payloads


    requests_log.append(req_data)
    socketio.emit('new_request', req_data)
    return jsonify({'status': 'received'}), 200

@app.route('/requests', methods=['GET'])
def get_requests():
    logger.info(f"📤 /requests endpoint called from {request.remote_addr} — returning {len(requests_log)} entries")
    return jsonify(list(requests_log)[::-1])

if __name__ == '__main__':
    logger.info("🚀 Request Inspector is starting on http://localhost:5000")
    socketio.run(app, host="0.0.0.0", port=5000) # using Flask-SocketIO's internal server for WebSocket support
    