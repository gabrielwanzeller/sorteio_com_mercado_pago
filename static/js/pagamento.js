document.addEventListener("DOMContentLoaded", () => {
  const valor = parseFloat(document.body.dataset.valor.replace(',', '.')); // R$ 0,99 por bilhete

  fetch("/gerar-pix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor: valor * 100 }) // em centavos
  })
    .then(res => res.json())
    .then(data => {
      if (data.qr_code_base64) {
        document.getElementById("qrcodeImg").src = data.qr_code_base64.replace(/\s/g, '');
        document.getElementById("qrcodeTexto").value = data.qr_code;
      } else {
        alert("Erro ao gerar QR Code");
      }
    });

  iniciarContador(600); // 10 minutos em segundos
});

function copiarCodigo() {
  const texto = document.getElementById("qrcodeTexto").value;
  navigator.clipboard.writeText(texto).then(() => {
    alert("Código PIX copiado!");
  });
}

function iniciarContador(segundos) {
  const contador = document.getElementById("contador");

  const intervalo = setInterval(() => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    contador.innerText = `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;

    if (segundos <= 0) {
      clearInterval(intervalo);
      contador.innerText = "Expirado";
      alert("O tempo expirou! Por favor, refaça a compra.");
      window.location.href = "/";
    }

    segundos--;
  }, 1000);
}