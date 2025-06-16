from flask import Flask, render_template, redirect, url_for, request, jsonify
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_default")


@app.route("/presell")
def presell():
    return render_template("page_presell/index.html")


@app.route("/obrigado")
def obrigado():
    return render_template("obrigado/index.html")


@app.route("/")
def home():
    return render_template("sorteio/index.html")


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
