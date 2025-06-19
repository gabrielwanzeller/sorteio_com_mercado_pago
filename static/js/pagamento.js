document.addEventListener("DOMContentLoaded", () => {
  const dados = JSON.parse(sessionStorage.getItem("dadosCadastro"));

  if (!dados || !dados.quantidade) {
    alert("Dados de pagamento não encontrados. Volte e preencha o cadastro.");
    window.location.href = "/";
    return;
  }

  const valor = dados.quantidade * 0.99; // R$ 0,99 por bilhete

  fetch("/gerar-pix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor: valor * 100 }) // em centavos
  })
    .then(res => res.json())
    .then(data => {
      if (data.qr_code_base64) {
        document.getElementById("qrcodeImg").src = data.qr_code_base64.replace(/\s/g, '');
        document.getElementById("qrcodeTexto").innerText = data.qr_code;
      } else {
        alert("Erro ao gerar QR Code");
      }
    });
});

function copiarCodigo() {
  const texto = document.getElementById("qrcodeTexto").innerText;
  navigator.clipboard.writeText(texto).then(() => {
    alert("Código PIX copiado!");
  });
}