import mercadopago
from dotenv import load_dotenv
from pathlib import Path
import os
import requests

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")


# OBS: Função não está sendo usada no momento porque usamos o SDK do Mercado Pago direto no app.py
# Serve como fallback para processar pagamento via requisição manual com requests, se necessário
# def processar_pagamento(token, valor, email, metodo_pagamento, parcelas):
#     url = "https://api.mercadopago.com/v1/payments"
#     headers = {
#         "Authorization": f"Bearer {ACCESS_TOKEN}",
#         "Content-Type": "application/json"
#     }
#
#     body = {
#         "token": token,
#         "transaction_amount": float(valor),
#         "payment_method_id": metodo_pagamento,
#         "installments": int(parcelas),
#         "payer": {
#             "email": email
#         }
#     }
#
#     response = requests.post(url, json=body, headers=headers)
#     data = response.json()
#     print("🔍 RESPOSTA DO PAGAMENTO:", data)
#
#     if response.status_code == 201:
#         return data
#     else:
#         raise Exception(f"❌ Erro ao processar pagamento: {data}")


# OBS: Essa função serve para gerar link de pagamento (Checkout Padrão)
# Não está sendo usada no momento pois o fluxo atual é via Checkout Transparente
# def criar_preferencia(quantidade, valor, nome=None, email=None):
#     url = "https://api.mercadopago.com/checkout/preferences"
#     headers = {
#         "Authorization": f"Bearer {ACCESS_TOKEN}",
#         "Content-Type": "application/json"
#     }
#
#     body = {
#         "items": [
#             {
#                 "title": f"{quantidade} bilhetes do sorteio",
#                 "quantity": 1,
#                 "currency_id": "BRL",
#                 "unit_price": valor
#             }
#         ],
#         "back_urls": {
#             "success": "https://5c68-201-41-75-11.ngrok-free.app/obrigado",
#             "failure": "https://5c68-201-41-75-11.ngrok-free.app/",
#             "pending": "https://5c68-201-41-75-11.ngrok-free.app/"
#         },
#         "auto_return": "approved"
#     }
#
#     response = requests.post(url, json=body, headers=headers)
#     data = response.json()
#     print("🔍 RESPOSTA DO MERCADO PAGO:", data)
#
#     if "init_point" in data:
#         return data["init_point"]
#     else:
#         raise Exception(
#             f"❌ init_point não encontrado. Resposta da API: {data}")


print("Token carregado:", ACCESS_TOKEN)

# Expor o SDK do Mercado Pago para uso externo

sdk = mercadopago.SDK(ACCESS_TOKEN)
