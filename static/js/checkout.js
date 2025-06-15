const qrScript = document.createElement("script");
qrScript.src = "https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
document.head.appendChild(qrScript);

document.addEventListener('DOMContentLoaded', () => {
  let cardFormInstance = null;

  // Redirecionamento para pagamento Pix (novo)
  const buyNowPixRedirect = document.getElementById('buy-now-pix');
  if (buyNowPixRedirect) {
    buyNowPixRedirect.addEventListener('click', () => {
      const nome = document.getElementById('nome').value;
      const email = document.getElementById('email').value;
      const celular = document.getElementById('celular').value;
      const valor = new URLSearchParams(window.location.search).get('valor');
      
      if (nome && email && celular && valor) {
        const params = new URLSearchParams({
          nome,
          email,
          celular,
          valor
        });
        window.location.href = `/pagamento-pix?${params.toString()}`;
      } else {
        alert('Preencha todos os dados pessoais antes de continuar.');
      }
    });
  }
  const urlParams = new URLSearchParams(window.location.search);
  let valor = urlParams.get('valor') || '167.00';
  valor = valor.replace('.', ',');

  const valorEl = document.getElementById('checkout-valor-dinamico');
  if (valorEl) valorEl.textContent = valor;

  // Preenche os dados pessoais se vierem da URL
  const nome = urlParams.get('nome');
  const email = urlParams.get('email');
  const celular = urlParams.get('celular');
  const cpf = urlParams.get('cpf');

  if (nome) document.getElementById('nome').value = nome;
  if (email) document.getElementById('email').value = email;
  if (celular) document.getElementById('celular').value = celular;
  if (cpf) document.getElementById('cpf').value = cpf;

  // Exibe o campo CPF se estiver preenchido
  const cpfInput = document.getElementById('cpf');
  if (cpf && cpfInput) {
    cpfInput.parentElement.style.display = 'block';
  }

  function limitarSomenteNumeros(campo) {
    if (campo) {
      campo.addEventListener('input', () => {
        campo.value = campo.value.replace(/\D/g, '');
      });
    }
  }

  function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf.charAt(10));
  }

  function validarCelular(celular) {
    celular = celular.replace(/\D/g, '');
    return celular.length === 11 && /^(\d{2})9\d{8}$/.test(celular);
  }

  limitarSomenteNumeros(document.getElementById('celular'));
  limitarSomenteNumeros(document.getElementById('cpf'));
  limitarSomenteNumeros(document.getElementById('cardNumber'));

  const container = document.getElementById('payment-response');
  const creditTab = document.getElementById('credit-form');
  const pixTab = document.getElementById('pix-instructions');

  if (!container || !creditTab || !pixTab) return;

  const continueBtn = document.getElementById('continue-button');
  if (continueBtn) {
    continueBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value.trim();
      const celular = document.getElementById('celular').value.trim();

      if (!nome) {
        document.getElementById('personal-error-message').innerText = "⚠️ O nome é obrigatório.";
        return;
      }

      if (!email) {
        document.getElementById('personal-error-message').innerText = "⚠️ O e-mail é obrigatório.";
        return;
      }

      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailValido) {
        document.getElementById('personal-error-message').innerText = "⚠️ O e-mail informado é inválido.";
        return;
      }

      if (!celular) {
        document.getElementById('personal-error-message').innerText = "⚠️ O número de celular é obrigatório.";
        return;
      }

      const celularValido = validarCelular(celular);
      if (!celularValido) {
        document.getElementById('personal-error-message').innerText = "⚠️ O número de celular deve conter 11 dígitos (DDD + número).";
        return;
      }

      const form = document.getElementById('checkout-form');
      const container = document.getElementById('payment-response');
      const creditTab = document.getElementById('credit-form');
      const pixTab = document.getElementById('pix-instructions');

      if (!form || !container || !creditTab || !pixTab) return;

      form.style.display = 'none';
      container.style.display = 'block';
      document.getElementById('personal-error-message').innerText = "";

      // Esconde título e descrição dos dados pessoais
      const dadosPessoaisTitle = document.querySelector('.form-section h3');
      const dadosPessoaisDesc = document.querySelector('.form-section p');
      if (dadosPessoaisTitle) dadosPessoaisTitle.style.display = 'none';
      if (dadosPessoaisDesc) dadosPessoaisDesc.style.display = 'none';

      const progressSteps = document.querySelectorAll('.progress-indicator .step');
      if (progressSteps.length >= 2) {
        progressSteps[0].classList.remove('active');
        progressSteps[1].classList.add('active');
      }

      creditTab.classList.add('active');
      pixTab.classList.remove('active');

      // Copia o email dos dados pessoais para o campo de email do cartão
      const emailCartao = document.querySelector('#form-checkout #emailCartao');
      if (emailCartao) {
        emailCartao.value = email;
      }
      setTimeout(() => {
        inicializarCardForm();
      }, 100); // Delay para garantir que o DOM aplicou o display:block
    });
  }

  // Botão Voltar
  const backBtns = document.querySelectorAll('.back-btn');
  backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('checkout-form');
      const container = document.getElementById('payment-response');
      const creditTab = document.getElementById('credit-form');
      const pixTab = document.getElementById('pix-instructions');

      if (!form || !container || !creditTab || !pixTab) return;

      form.style.display = 'flex';
      container.style.display = 'none';

      // Reset abas de pagamento
      creditTab.classList.remove('active');
      pixTab.classList.remove('active');

      const dadosPessoaisTitle = document.querySelector('.form-section h3');
      const dadosPessoaisDesc = document.querySelector('.form-section p');
      if (dadosPessoaisTitle) dadosPessoaisTitle.style.display = 'block';
      if (dadosPessoaisDesc) dadosPessoaisDesc.style.display = 'block';

      const steps = document.querySelectorAll('.progress-indicator .step');
      if (steps.length >= 2) {
        steps[0].classList.add('active');
        steps[1].classList.remove('active');
      }
    });
  });

  // Alternância entre abas de pagamento
  const btnPix = document.getElementById('btn-pix');
  const btnCredit = document.getElementById('btn-credit');
  const pixTabAlt = document.getElementById('pix-instructions');
  const creditTabAlt = document.getElementById('credit-form');

  if (!btnPix || !btnCredit || !pixTabAlt || !creditTabAlt) return;

  btnPix.addEventListener('click', () => {
    btnPix.classList.add('active');
    btnCredit.classList.remove('active');
    pixTabAlt.classList.add('active');
    pixTabAlt.style.display = 'block';
    creditTabAlt.classList.remove('active');
    creditTabAlt.style.display = 'none';
  });

  btnCredit.addEventListener('click', () => {
    btnCredit.classList.add('active');
    btnPix.classList.remove('active');
    creditTabAlt.classList.add('active');
    pixTabAlt.classList.remove('active');
  });

  // Integração Mercado Pago SDK para gerar token do cartão
  const mp = new MercadoPago('TEST-357704158044779-060820-b28a28ef266198a3bc2e58bb3901e63d-1854448148', {
    locale: 'pt-BR'
  });

  // Supondo que exista um botão para pagar com cartão, exemplo 'buy-now-credit'
  const buyNowCreditBtn = document.getElementById('buy-now-credit');
  if (buyNowCreditBtn) {
    buyNowCreditBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      // Validação visual de campos obrigatórios
      const camposObrigatorios = ['cardNumber', 'cardExpiration', 'securityCode', 'cardholderName', 'cpf', 'emailCartao'];
      let temErro = false;

      camposObrigatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && campo.value.trim() === '') {
          campo.classList.add('invalid');
          temErro = true;
        } else if (campo) {
          campo.classList.remove('invalid');
        }
      });

      if (temErro) {
        document.getElementById('status-message').innerText = "⚠️ Preencha todos os campos obrigatórios.";
        return;
      }

      try {
        // Mostra o spinner
        document.getElementById('spinner').style.display = 'block';
        document.getElementById('status-message').innerText = '';

        // Atualiza o valor do amount dinamicamente
        const valorAtual = document.getElementById('checkout-valor-dinamico').textContent.replace(',', '.');
        console.log("Valor atual:", valorAtual);
        
        // Atualiza o formulário com o novo valor
        await cardFormInstance.update({ amount: valorAtual });
        console.log("Formulário atualizado com novo valor");

        // Tenta gerar o token
        console.log("Iniciando geração do token...");
        const cardFormData = await cardFormInstance.getCardFormData();
        console.log("Dados do formulário:", cardFormData);

        if (!cardFormData || !cardFormData.token) {
          throw new Error('Não foi possível gerar o token do cartão. Verifique os dados informados.');
        }

        const token = cardFormData.token;
        console.log("Token gerado com sucesso");

        const cardNumberInput = document.getElementById('cardNumber');
        const cardNumber = cardNumberInput ? cardNumberInput.value.replace(/\s+/g, '') : '';
        const bin = cardNumber.substring(0, 6);

        const metodoResponse = await fetch(`/api/consultar-bandeira?bin=${bin}`);

        if (!metodoResponse.ok) {
          throw new Error('Erro ao consultar bandeira do cartão');
        }

        const metodo = await metodoResponse.json();
        console.log("Resposta da bandeira:", metodo);

        if (!metodo || typeof metodo !== 'object' || !Array.isArray(metodo.results) || metodo.results.length === 0) {
          document.getElementById('status-message').innerText = "⚠️ Não foi possível identificar a bandeira do cartão. Verifique os dados.";
          return;
        }

        const payment_method_id = metodo.results[0].id;

        const valorTexto = document.getElementById('checkout-valor-dinamico').textContent.replace(',', '.');
        const amount = parseFloat(valorTexto);

        const installmentsResponse = await fetch(`https://api.mercadopago.com/v1/payment_methods/installments?bin=${bin}&amount=${amount}`, {
          headers: {
            Authorization: "Bearer APP_USR-2264056354275269-060721-95ddc5061a11c6b7aeaed0537646a5ea-1854448148"
          }
        });
        const installmentsData = await installmentsResponse.json();

        if (!installmentsData || !Array.isArray(installmentsData) || installmentsData.length === 0) {
          throw new Error('Não foi possível calcular as parcelas.');
        }

        const installmentOptions = installmentsData[0].payer_costs || [];
        const installmentsSelect = document.getElementById('installments');
        installmentsSelect.innerHTML = '';
        installmentOptions.forEach(op => {
          const option = document.createElement('option');
          option.value = op.installments;
          option.textContent = `${op.installments}x de R$ ${op.installment_amount.toFixed(2)} (${op.recommended_message})`;
          installmentsSelect.appendChild(option);
        });

        const installments = parseInt(document.getElementById('installments').value);

        const emailInput = document.getElementById('email');
        const email = emailInput ? emailInput.value : '';

        const cpfInput = document.getElementById('cpf');
        const cpf = cpfInput ? cpfInput.value : '';

        if (!token || !email) {
          document.getElementById('status-message').innerText = "⚠️ Erro: token do cartão ou e-mail ausente.";
          return;
        }

        const pagamentoBody = {
          token,
          payment_method_id,
          email,
          amount,
          installments,
          cpf
        };

        const pagamentoResponse = await fetch("/criar-pagamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(pagamentoBody)
        });

        const resultado = await pagamentoResponse.json();
        console.log("Resultado do pagamento com cartão:", resultado);

        if (resultado && resultado.status === 'approved') {
          window.location.href = "/obrigado";
        } else {
          document.getElementById('status-message').innerText = "⚠️ Pagamento não aprovado. Verifique os dados.";
        }

        // Envia o pagamento_id para o backend
        const pagamento_id = resultado && resultado.id ? resultado.id : null;
        if (pagamento_id) {
          const resposta = await fetch('/verificar-pagamento', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pagamento_id })
          });

          const statusPagamento = await resposta.json();
          console.log("Status do pagamento:", statusPagamento);
        } else {
          console.warn("⚠️ pagamento_id ausente, verificação não enviada.");
        }

        // Aqui pode continuar a lógica do pagamento por cartão

      } catch (erro) {
        document.getElementById('status-message').innerText = `⚠️ Erro: ${erro.message}`;
      }
    });
  }

  // Bloco PIX Buy Now
  const buyNowPixBtn = document.getElementById('buy-now-pix');
  if (buyNowPixBtn) {
    buyNowPixBtn.addEventListener('click', async function () {
      const emailInput = document.getElementById('email');
      const email = emailInput ? emailInput.value.trim() : '';

      const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailValido) {
        document.getElementById('status-message').innerText = "⚠️ E-mail inválido.";
        return;
      }

      const celular = document.querySelector('input[name="celular"]').value;
      if (!validarCelular(celular)) {
        document.getElementById('status-message').innerText = "⚠️ Celular inválido. Use DDD + número com 11 dígitos.";
        return;
      }

      // Pega o valor exibido visualmente
      const valorTexto = document.getElementById('checkout-valor-dinamico').textContent.replace(',', '.');
      const amount = parseFloat(valorTexto);

      const body = {
        payment_method_id: "pix",
        email,
        amount
      };

      const response = await fetch("/criar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body)
      });

      const resultado = await response.json();
      const pixData = resultado.point_of_interaction?.transaction_data;

      if (pixData?.qr_code) {
        // Redireciona para a página do Pix com parâmetros
        const params = new URLSearchParams({
          codigo_pix: pixData.qr_code,
          valor: amount.toFixed(2),
          pagamento_id: resultado.id
        });
        window.location.href = `/pagamento-pix?${params.toString()}`;
      } else {
        document.getElementById('status-message').innerText = "Erro ao gerar QR Code.";
      }
    });
  }

  function inicializarCardForm() {
    if (cardFormInstance) return; // já inicializado
    cardFormInstance = mp.cardForm({
      amount: "167.00",
      autoMount: true,
      form: {
        id: 'form-checkout',
        cardholderName: { id: 'cardholderName', placeholder: 'Titular do cartão' },
        cardholderEmail: { id: 'emailCartao', placeholder: 'exemplo@email.com' },
        cardNumber: { id: 'cardNumber', placeholder: 'Número do cartão' },
        expirationDate: { id: 'cardExpiration', placeholder: 'MM/AA' },
        securityCode: { id: 'securityCode', placeholder: 'CVV' },
        installments: { id: 'installments', placeholder: 'Parcelas' },
        identificationType: { id: 'identificationType', placeholder: 'Tipo de documento' },
        identificationNumber: { id: 'cpf', placeholder: 'Documento' },
        issuer: { id: 'issuer', placeholder: 'Banco emissor' }
      },
      callbacks: {
        onFormMounted: error => {
          if (error) {
            console.error("Erro ao montar formulário:", error);
            return;
          }
          console.log("Formulário montado com sucesso");
        },
        onSubmit: event => {
          event.preventDefault();
          console.log("Formulário submetido");
        },
        onError: error => {
          console.error("Erro no formulário:", error);
          document.getElementById('status-message').innerText = `⚠️ Erro: ${error.message}`;
        }
      }
    });
  }
});