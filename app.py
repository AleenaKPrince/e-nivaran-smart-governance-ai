from flask import Flask, jsonify
from flask_cors import CORS

from routes.auth import auth_bp
from routes.citizen_auth import citizen_auth_bp
from routes.complaints import complaints_bp
from routes.staff import staff_bp
from routes.chatbot import chatbot_bp
from routes.admin import admin_bp


app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_bp, url_prefix="/api")
app.register_blueprint(citizen_auth_bp, url_prefix="/api/auth/citizen")
app.register_blueprint(complaints_bp, url_prefix="/api")
app.register_blueprint(staff_bp, url_prefix="/api")
app.register_blueprint(chatbot_bp, url_prefix="/api")
app.register_blueprint(admin_bp, url_prefix="/api")


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "success",
        "message": "AI Governance Backend is running"
    })


if __name__ == "__main__":
    app.run(debug=True)
