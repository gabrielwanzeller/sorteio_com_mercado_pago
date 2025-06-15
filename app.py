from flask import Flask, render_template, redirect, url_for, request, jsonify, session
from pagamentos import mercadopago as mp
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev_key_default")


@app.route("/verificar-pagamento", methods=["POST"])
def verificar_pagamento():
    try:
        data = request.get_json()
        pagamento_id = data.get("pagamento_id")

        if not pagamento_id:
            return jsonify({"status": "erro", "mensagem": "ID do pagamento não fornecido."}), 400

        pagamento = mp.sdk.payment().get(pagamento_id)

        if pagamento.get("status") == 201:
            resposta = pagamento["response"]
            status_pagamento = resposta.get("status")
            if status_pagamento == "approved":
                return jsonify({"status": "approved"})
            elif status_pagamento == "in_process":
                return jsonify({"status": "in_process", "mensagem": "Pagamento em análise."}), 202
            elif status_pagamento == "rejected":
                motivo = resposta.get("status_detail", "rejected")
                return jsonify({"status": "rejected", "mensagem": f"Pagamento recusado: {motivo}"}), 402
            else:
                return jsonify({"status": status_pagamento, "mensagem": "Status desconhecido."}), 400
        else:
            return jsonify(pagamento.get("response", {"error": "Erro ao processar pagamento."})), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"status": "erro", "mensagem": str(e)}), 500


@app.route("/presell")
def presell():
    return render_template("page_presell/index.html")


@app.route("/criar-pagamento", methods=["POST"])
def criar_pagamento():
    try:
        data = request.get_json()
        print("Dados recebidos:", data)

        token = data.get("token")
        payment_method_id = data.get("payment_method_id")
        email = data.get("email")
        amount = float(data.get("amount", 0))
        installments = int(data.get("installments", 1))
        cpf = data.get("cpf", "")

        if not payment_method_id or not email or amount <= 0:
            return jsonify({"error": "Dados incompletos para o pagamento."}), 400

        if not token:
            return jsonify({"error": "Token do cartão não fornecido."}), 400

        pagamento_data = {
            "transaction_amount": amount,
            "token": token,
            "description": "Compra com cartão",
            "installments": installments,
            "payment_method_id": payment_method_id,
            "payer": {
                "email": email,
                "identification": {
                    "type": "CPF",
                    "number": cpf
                }
            }
        }

        print("Dados do pagamento:", pagamento_data)
        pagamento = mp.sdk.payment().create(pagamento_data)
        print("Resposta do Mercado Pago:", pagamento)
        
        if pagamento.get("status") == 201:
            resposta = pagamento["response"]
            return jsonify(resposta)
        else:
            erro = pagamento.get("response", {}).get("message", "Erro ao processar pagamento.")
            return jsonify({"error": erro}), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/obrigado")
def obrigado():
    return render_template("obrigado/index.html")


@app.route("/")
def home():
    return render_template("sorteio/index.html")


@app.route("/checkout")
def checkout():
    return render_template("checkout/index.html")


# Nova rota para gerar pagamento Pix
@app.route("/gerar-pix")
def gerar_pix():
    amount = 29.70
    email = "gabrielgentilwanzeller@gmail.com"

    pagamento_data = {
        "transaction_amount": amount,
        "payment_method_id": "pix",
        "payer": {
            "email": email
        },
        "description": "Pagamento via Pix",
        "notification_url": "https://meusite.com/notificacoes"
    }

    pagamento = mp.sdk.payment().create(pagamento_data)
    print("Resposta do Mercado Pago:", pagamento)

    if pagamento.get("status") == 201:
        resposta = pagamento["response"]
        session['codigo_pix'] = resposta['point_of_interaction']['transaction_data']['qr_code']
        session['valor'] = str(amount)
        return render_template("checkout/pix/pix.html", codigo_pix=session['codigo_pix'], valor=session['valor'])
    else:
        return "Erro ao gerar pagamento", 400

# Nova rota para pagamento via Pix


@app.route("/pagamento-pix")
def pagamento_pix():
    codigo_pix = session.get("codigo_pix")
    valor = session.get("valor")

    if codigo_pix and valor:
        return render_template("checkout/pix/pix.html", codigo_pix=codigo_pix, valor=valor)
    else:
        return "Acesso não autorizado", 403


# Nova rota para consultar bandeira do cartão pelo BIN
@app.route("/api/consultar-bandeira")
def consultar_bandeira():
    bin = request.args.get('bin')
    if not bin:
        return jsonify({'erro': 'BIN ausente'}), 400

    headers = {
        "Authorization": f"Bearer {os.environ.get('MP_ACCESS_TOKEN')}"
    }

    import requests
    r = requests.get(
        f"https://api.mercadopago.com/v1/payment_methods/search?bin={bin}", headers=headers)
    return jsonify(r.json()), r.status_code


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
