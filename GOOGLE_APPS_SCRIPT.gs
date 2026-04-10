/**
 * Google Apps Script para receber avaliações e feedbacks do KAHU Gerenciamento
 * 
 * Como usar:
 * 1. No Google Sheets, vá em Extensões > Apps Script
 * 2. Cole este código no editor
 * 3. Clique em "Implantar" > "Nova implantação"
 * 4. Tipo: "App da Web"
 * 5. Executar como: "Você"
 * 6. Quem tem acesso: "Qualquer pessoa" (necessário para o Netlify acessar)
 * 7. Copie a URL gerada e coloque no seu arquivo .env como VITE_GOOGLE_SCRIPT_URL
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const SPREADSHEET_ID = "1Wc5iiKk4_O-2aYqdGtizRhBpd34BXR5TlXnASsCxM9k";
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (data.action === "saveEvaluations") {
      const sheet = ss.getSheetByName("Avaliacoes_Brutas") || ss.insertSheet("Avaliacoes_Brutas");
      
      // Se a planilha for nova, adiciona cabeçalhos
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Avaliador", "Avaliado", "Critério", "Nota", "Data", "Horário"]);
      }
      
      data.evaluations.forEach(eval => {
        sheet.appendRow([
          eval.avaliador,
          eval.avaliado,
          eval.criterio,
          eval.nota,
          eval.data,
          eval.horario
        ]);
      });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "saveFeedback") {
      const sheet = ss.getSheetByName("Feedbacks") || ss.insertSheet("Feedbacks");
      
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Avaliador", "Avaliado", "Pontos Positivos", "Pontos de Melhoria", "Destaque", "Data", "Horário"]);
      }
      
      data.feedbacks.forEach(f => {
        sheet.appendRow([
          data.evaluator,
          f.employee,
          f.positivePoints,
          f.improvementPoints,
          f.recommendAsHighlight ? "Sim" : "Não",
          data.date,
          data.time
        ]);
      });
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === "getData") {
      const evalSheet = ss.getSheetByName("Avaliacoes_Brutas");
      const feedbackSheet = ss.getSheetByName("Feedbacks");
      
      const evaluations = [];
      if (evalSheet) {
        const values = evalSheet.getDataRange().getValues();
        if (values.length > 1) {
          for (let i = 1; i < values.length; i++) {
            evaluations.push({
              evaluator: values[i][0],
              employee: values[i][1],
              criterion: values[i][2],
              score: values[i][3],
              date: values[i][4],
              time: values[i][5]
            });
          }
        }
      }
      
      const feedbacks = [];
      if (feedbackSheet) {
        const values = feedbackSheet.getDataRange().getValues();
        if (values.length > 1) {
          for (let i = 1; i < values.length; i++) {
            feedbacks.push({
              evaluator: values[i][0],
              employee: values[i][1],
              positivePoints: values[i][2],
              improvementPoints: values[i][3],
              recommendAsHighlight: values[i][4] === "Sim",
              date: values[i][5],
              time: values[i][6]
            });
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, evaluations, feedbacks }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Ação inválida" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Habilita CORS
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
