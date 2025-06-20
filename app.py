from datetime import datetime
from flask import Flask, render_template, redirect, url_for, request, jsonify
import os
from dotenv import load_dotenv
import requests
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_default")

PUSHINPAY_TOKEN = os.environ.get("PUSHINPAY_TOKEN", "SUA_CHAVE_AQUI")

PRECO_POR_BILHETE = float(os.environ.get("PRECO_POR_BILHETE", "0.99"))


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
        return jsonify({
            "qr_code": data["qr_code"],
            "qr_code_base64": data["qr_code_base64"]
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


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
