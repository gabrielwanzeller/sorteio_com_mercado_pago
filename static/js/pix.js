// Este script carrega automaticamente o QR Code do Pix e verifica o status do pagamento periodicamente.
document.addEventListener('DOMContentLoaded', function () {
  const codigoPix = document.getElementById('codigo-pix').textContent;
  const pagamentoIdElem = document.getElementById('pagamento-id');
  const pagamentoId = pagamentoIdElem ? pagamentoIdElem.value : null;
  const valorPix = document.getElementById('valor-pix') ? document.getElementById('valor-pix').textContent : null;
  const qrCodeImg = document.getElementById('qrcode');
  const qrCodeContainer = document.getElementById('qrcode-render');

  // Verifica status do pagamento a cada 5 segundos
  if (pagamentoId) {
    setInterval(async () => {
      try {
        const response = await fetch('/verificar-pagamento?pagamento_id=' + encodeURIComponent(pagamentoId));
        const data = await response.json();
        if (data.status === 'aprovado') {
          window.location.href = '/obrigado';
        }
      } catch (err) {
        console.error('Erro ao verificar pagamento:', err);
      }
    }, 5000);
  }
});


function copiarCodigo() {
  const codigo = document.getElementById("codigo-pix").innerText;
  navigator.clipboard.writeText(codigo).then(() => {
    alert("Código Pix copiado!");
  });
}