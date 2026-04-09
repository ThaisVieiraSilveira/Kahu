async function testConnection() {
  const url = "https://script.google.com/macros/s/AKfycbziQd8428QWyTkhMUtZO7t3PM-X7YZCq1wroRmHXZWoCxNB9-NgHI-WdrfBJ-Ir6MTW/exec";
  const payload = {
    action: "saveEvaluations",
    evaluations: [
      {
        avaliador: "TESTE_IA",
        avaliado: "TESTE_BOT",
        criterio: "CONEXAO_SISTEMA",
        nota: 10,
        data: new Date().toISOString().split('T')[0],
        horario: new Date().toLocaleTimeString()
      }
    ]
  };

  console.log("Enviando teste para:", url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    console.log("Resposta do Google Script:", text);
    
    if (text.includes("success")) {
      console.log("TESTE BEM-SUCEDIDO! A conexão está funcionando.");
    } else {
      console.log("O script respondeu, mas não retornou 'success'. Verifique o código no Google Apps Script.");
    }
  } catch (error) {
    console.error("ERRO NA CONEXAO:", error);
  }
}

testConnection();
