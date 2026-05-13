from functools import wraps
from flask import request, jsonify
from utils.jwt_handler import decode_token


def jwt_required(required_role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization")

            if not auth_header:
                return jsonify({"error": "Authorization header missing"}), 401

            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({"error": "Invalid authorization format"}), 401

            decoded = decode_token(token)
            if not decoded:
                return jsonify({"error": "Invalid or expired token"}), 401

            if required_role and decoded.get("role") != required_role:
                return jsonify({"error": "Forbidden"}), 403

            request.user = decoded
            return fn(*args, **kwargs)

        return wrapper

    return decorator

