from datetime import datetime
import requests
from dotenv import load_dotenv
import os
from flask import Flask, render_template, redirect, url_for, request, jsonify
from flask_sqlalchemy import SQLAlchemy

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_default")

PUSHINPAY_TOKEN = os.environ.get("PUSHINPAY_TOKEN", "SUA_CHAVE_AQUI")

PRECO_POR_BILHETE = float(os.environ.get("PRECO_POR_BILHETE", "0.99"))

# Rota para consultar PIX na PushinPay


@app.route("/presell")
def presell():
    return render_template("page_presell/index.html")


@app.route("/obrigado")
def obrigado():
    return render_template("obrigado/index.html")


@app.route("/")
def home():
    return render_template("sorteio/index.html", preco_bilhete=PRECO_POR_BILHETE)


@app.route("/gerar-pix", methods=["POST"])
def gerar_pix():
    valor = request.json.get("valor")
    nome = request.json.get("nome")
    celular = request.json.get("celular")
    email = request.json.get("email")
    # substitua pelo seu link de webhook
    webhook_url = "https://seudominio.com/webhook"

    headers = {
        "Authorization": f"Bearer {PUSHINPAY_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "value": valor,
        "webhook_url": webhook_url
    }

    response = requests.post(
        "https://api.pushinpay.com.br/api/pix/cashIn", json=payload, headers=headers)

    if response.status_code == 200:
        data = response.json()
        print("Resposta da Pushin:", data)
        chave_pix = data.get("chave")

        nova_transacao = Transacao(
            chave=chave_pix,
            nome=nome,
            celular=celular,
            email=email,
            status="pendente"
        )
        db.session.add(nova_transacao)
        db.session.commit()

        return jsonify({
            "qr_code": data["qr_code"],
            "qr_code_base64": data["qr_code_base64"],
            "chave": chave_pix
        })
    else:
        return jsonify({"erro": "Falha ao gerar PIX"}), 400


@app.route("/pagamento")
def pagamento():
    # Simulação de dados vindos do formulário
    produto = request.args.get("produto", "Produto não informado")
    nome = request.args.get("nome", "Cliente Teste")
    quantidade = request.args.get("quantidade", 70)
    total = request.args.get("total", "10,50")
    data_hora = datetime.now().strftime("%d/%m/%Y às %Hh%M")

    return render_template(
        "sorteio/pagamento.html",
        produto=produto,
        nome=nome,
        quantidade=quantidade,
        total=total,
        data_hora=data_hora
    )


@app.route("/consultar-pix", methods=["POST"])
def consultar_pix():
    chave = request.json.get("chave")
    if not chave:
        return jsonify({"erro": "Chave não fornecida"}), 400

    url = "https://api.pushinpay.com.br/pix/consultar-pix"
    headers = {
        "x-api-key": PUSHINPAY_TOKEN,
        "Content-Type": "application/json"
    }

    response = requests.get(url, headers=headers, json={"chave": chave})

    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"erro": "Erro ao consultar PIX"}), response.status_code


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///transacoes.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)


class Transacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chave = db.Column(db.String(120), unique=True, nullable=False)
    nome = db.Column(db.String(100))
    celular = db.Column(db.String(20))
    email = db.Column(db.String(100))
    status = db.Column(db.String(20), default="pendente")


@app.route("/webhook", methods=["POST"])
def webhook():
    try:
        dados = request.json
        chave = dados.get("chave")
        status = dados.get("status")

        print("Webhook recebido:", dados)

        if not chave or not status:
            return jsonify({"erro": "Dados incompletos"}), 400

        transacao = Transacao.query.filter_by(chave=chave).first()
        if transacao:
            transacao.status = status
            db.session.commit()
            print(f"Transação {chave} atualizada para {status}")
            return jsonify({"ok": True})
        else:
            return jsonify({"erro": "Transação não encontrada"}), 404
    except Exception as e:
        print("Erro no processamento do webhook:", e)
        return jsonify({"erro": "Erro interno no servidor"}), 500


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
