async function testLogin() {
  const password = "Kahu@2026Segura";
  console.log("Testando login com a senha:", password);
  
  try {
    const response = await fetch("http://localhost:3000/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    
    const data = await response.json();
    console.log("Status da resposta:", response.status);
    console.log("Dados da resposta:", data);
    
    if (response.ok && data.success) {
      console.log("LOGIN BEM-SUCEDIDO NO SERVIDOR LOCAL!");
    } else {
      console.log("FALHA NO LOGIN. Verifique se o servidor foi reiniciado com a nova senha.");
    }
  } catch (error) {
    console.error("Erro ao conectar ao servidor local:", error);
  }
}

testLogin();
