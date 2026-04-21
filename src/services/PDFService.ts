
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export const PDFService = {
  generatePMO: (type: string, data: any, tag: string) => {
    const doc = new jsPDF();
    const dateStr = new Date(data.timestamp || new Date()).toLocaleDateString('pt-BR');
    
    // --- OFFICIAL HEADER ---
    doc.setFillColor(0, 51, 102); // Alupar Blue
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    
    // Alupar Logo Representation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("ALUPAR", 15, 20);
    doc.setFontSize(8);
    doc.text("TRANSMISSÃO DE ENERGIA", 15, 25);
    
    doc.setFontSize(14);
    doc.text("RELATÓRIO DE MANUTENÇÃO PREVENTIVA", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`TIPO DE EQUIPAMENTO: ${type.toUpperCase()}`, 105, 28, { align: "center" });
    
    doc.setFontSize(8);
    doc.text(`SGI-MOD-042 REV.02`, 175, 15);
    doc.text(`PÁGINA 1/2`, 175, 20);

    // --- TABLE 1: SESSION INFO (Mimic Real Form) ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    let currY = 45;
    
    const drawGridRow = (y: number, labels: string[], values: any[], widths: number[]) => {
      let x = 10;
      labels.forEach((label, i) => {
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, widths[i], 5, 'F');
        doc.rect(x, y, widths[i], 14);
        doc.setFont("helvetica", "bold");
        doc.text(label.toUpperCase(), x + 2, y + 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(String(values[i] || "---"), x + 2, y + 10);
        doc.setFontSize(7);
        x += widths[i];
      });
    };

    drawGridRow(currY, 
      ["Subestação", "N° Ordem de Serviço", "N° SGI / ODO", "Data da Execução", "Status"], 
      ["SE - RIO NOVO DO SUL", data.header_os || "4500098231", data.header_sgi || "OD-2026-042", dateStr, "CONCLUÍDO"], 
      [60, 40, 35, 30, 25]
    );
    currY += 14;
    drawGridRow(currY, 
      ["Local do Equipamento", "Código / TAG", "Equipe Responsável", "Supervisor Responsável"], 
      ["PÁTIO DE 230KV", tag, data.teamId ? `EQUIPE 0${data.teamId}` : "N/A", "ENG. RESPONSÁVEL"], 
      [60, 40, 45, 45]
    );

    // --- SECTION: DADOS TÉCNICOS ---
    currY += 20;
    doc.setFillColor(0, 51, 102);
    doc.rect(10, currY, 190, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("1.0 - DADOS DE PLACA E INFORMAÇÕES TÉCNICAS", 105, currY + 4.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
    currY += 7;

    const techFields = Object.entries(data)
      .filter(([key]) => key.startsWith('tech_'))
      .map(([key, value]) => [key.replace('tech_', '').replace(/_/g, ' ').toUpperCase(), String(value)]);
    
    if (techFields.length > 0) {
      (doc as any).autoTable({
        startY: currY,
        body: techFields,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineWidth: 0.1 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [250, 250, 250], width: 60 } },
        margin: { left: 10, right: 10 }
      });
      currY = (doc as any).lastAutoTable.finalY + 8;
    } else {
      currY += 5;
    }

    // --- SECTION: ATIVIDADES / INSPEÇÃO ---
    doc.setFillColor(0, 51, 102);
    doc.rect(10, currY, 190, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text("2.0 - ATIVIDADES DE INSPEÇÃO E TESTES", 105, currY + 4.5, { align: "center" });
    doc.setTextColor(0, 0, 0);
    currY += 7;

    const activities = Object.entries(data)
      .filter(([key]) => key.startsWith('v_') || key.startsWith('a_') || key.startsWith('s_') || key.startsWith('c_'))
      .map(([key, value], idx) => {
        let status = value === 'C' ? 'CONFORME' : value === 'NC' ? 'NÃO CONFORME' : value === 'NA' ? 'NÃO SE APLICA' : String(value);
        return [idx + 1, key.replace(/^[v|a|s|c]_/, '').replace(/_/g, ' ').toUpperCase(), status];
      });

    (doc as any).autoTable({
      startY: currY,
      head: [["ITEM", "DESCRIÇÃO DA ATIVIDADE / PONTO DE INSPEÇÃO", "RESULTADO"]],
      body: activities,
      headStyles: { fillColor: [80, 80, 80], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, lineWidth: 0.1 },
      columnStyles: { 0: { width: 15 }, 2: { width: 40, halign: 'center' } },
      margin: { left: 10, right: 10 }
    });
    currY = (doc as any).lastAutoTable.finalY + 10;

    // --- SECTION: EQUIPAMENTOS UTILIZADOS ---
    doc.setFont("helvetica", "bold");
    doc.text("EQUIPAMENTOS UTILIZADOS", 10, currY);
    currY += 4;
    const eqData = [
      [data.eq_instr_1 || "---", data.eq_mod_1 || "---", data.eq_ser_1 || "---"],
      [data.eq_instr_2 || "---", data.eq_mod_2 || "---", data.eq_ser_2 || "---"]
    ];
    (doc as any).autoTable({
      startY: currY,
      head: [["Instrumento", "Modelo", "N° de Série"]],
      body: eqData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [150, 150, 150] }
    });
    currY = (doc as any).lastAutoTable.finalY + 10;

    // --- SECTION: OBSERVAÇÕES ---
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES", 10, currY);
    currY += 4;
    doc.rect(10, currY, 190, 20);
    doc.setFont("helvetica", "normal");
    doc.text(data.observacoes || "Nenhuma observação técnica adicional.", 13, currY + 6, { maxWidth: 180 });
    currY += 30;

    // --- PHOTO EVIDENCE ---
    if (data.photo) {
      doc.addPage();
      doc.setFillColor(0, 51, 102);
      doc.rect(0, 0, 210, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("REGISTRO FOTOGRÁFICO DE CAMPO", 105, 13, { align: "center" });
      
      try {
        doc.addImage(data.photo, 'JPEG', 15, 30, 180, 120);
      } catch (e) {
        console.error("Error adding image to PDF", e);
      }
      currY = 160; // Reset Y for signatures if they were on this page
    }

    // --- SIGNATURES ---
    const sigW = 55;
    const sigX1 = 15;
    const sigX2 = 77;
    const sigX3 = 140;
    
    doc.line(sigX1, currY + 15, sigX1 + sigW, currY + 15);
    doc.text("LÍDER DA EQUIPE", sigX1 + sigW/2, currY + 19, { align: "center" });
    
    doc.line(sigX2, currY + 15, sigX2 + sigW, currY + 15);
    doc.text("SUPERVISOR", sigX2 + sigW/2, currY + 19, { align: "center" });
    
    doc.line(sigX3, currY + 15, sigX3 + sigW, currY + 15);
    doc.text("COORDENADOR", sigX3 + sigW/2, currY + 19, { align: "center" });

    doc.save(`${type}_${tag}.pdf`);
  },

  generateSafetyAlertReport: (alert: any) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("ALERTA DE SEGURANÇA", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Gravidade: ${alert.severity}`, 20, 40);
    doc.text(`Equipamento: ${alert.equipmentTag}`, 20, 50);
    doc.text(`Relatado por: ${alert.reporterName}`, 20, 60);
    doc.text(`Data: ${new Date(alert.timestamp).toLocaleString()}`, 20, 70);
    
    doc.setFontSize(10);
    doc.text("Descrição:", 20, 85);
    doc.text(alert.description, 20, 95, { maxWidth: 170 });

    if (alert.photo) {
        doc.addPage();
        doc.text("Registro Fotográfico:", 20, 20);
        doc.addImage(alert.photo, 'JPEG', 20, 30, 170, 120);
    }

    doc.save(`Alerta_${alert.equipmentTag}.pdf`);
  }
};
