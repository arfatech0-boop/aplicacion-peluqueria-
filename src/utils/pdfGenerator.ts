import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, StoreInfo, Customer, CustomerTransaction, CustomerWithdrawal, Product } from '../types';

export const generateSaleInvoicePDF = (sale: Sale, storeInfo: StoreInfo) => {
  const doc = new jsPDF();

  const invType = sale.invoiceType || 'FACTURA_B';
  let letter = 'B';
  let codeNum = 'COD. 006';
  let title = 'FACTURA';

  if (invType === 'FACTURA_A') {
    letter = 'A';
    codeNum = 'COD. 001';
    title = 'FACTURA';
  } else if (invType === 'FACTURA_C') {
    letter = 'C';
    codeNum = 'COD. 011';
    title = 'FACTURA';
  } else if (invType === 'TICKET_X') {
    letter = 'X';
    codeNum = 'COD. 090';
    title = 'COMPROBANTE NO FISCAL';
  } else if (invType === 'REMITO') {
    letter = 'R';
    codeNum = 'COD. 091';
    title = 'REMITO DE ENTREGA';
  }

  // AFIP Top Letter Box in Header
  doc.setLineWidth(0.5);
  doc.rect(98, 10, 14, 14); // Letter Box
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(letter, 105, 20, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(codeNum, 105, 27, { align: 'center' });

  // Left Column - EMISOR
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(storeInfo.name.toUpperCase(), 14, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Razón Social: ${storeInfo.name}`, 14, 25);
  doc.text(`Domicilio Comercial: ${storeInfo.address || 'Av. Corrientes 1234'}`, 14, 30);
  doc.text(`Condición IVA: ${storeInfo.taxCondition || 'Responsable Inscripto'}`, 14, 35);
  doc.text(`Teléfono: ${storeInfo.phone || '011-4567-8900'}`, 14, 40);

  // Vertical Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(105, 29, 105, 45);

  // Right Column - COMPROBANTE
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 115, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Punto de Venta: 0001   Comp. Nro: ${sale.invoiceNumber.replace(/^FC-/, '')}`, 115, 25);
  doc.text(`Fecha de Emisión: ${new Date(sale.date).toLocaleDateString('es-AR')}`, 115, 30);
  doc.text(`CUIT Emisor: ${storeInfo.cuit || '30-71234567-8'}`, 115, 35);
  doc.text(`Ingresos Brutos: ${storeInfo.cuit || 'Exento / CUIT'}`, 115, 40);

  // Horizontal Line Divider
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(14, 46, 196, 46);

  // CLIENT BLOCK BOX
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 49, 182, 22, 'F');
  doc.rect(14, 49, 182, 22, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`CUIT / DNI Cliente: ${sale.customerCuitDni || 'Consumidor Final'}`, 18, 55);
  doc.text(`Nombre / Razón Social: ${sale.customerName || 'Consumidor Final'}`, 18, 61);
  doc.text(`Condición IVA Cliente: ${sale.customerTaxCondition || 'Consumidor Final'}`, 18, 67);

  doc.text(`Condición de Venta: ${formatPaymentMethod(sale.paymentMethod)}`, 115, 55);
  doc.text(`Fecha Vencimiento: ${new Date(sale.date).toLocaleDateString('es-AR')}`, 115, 61);
  if (sale.notes) {
    doc.text(`Observaciones: ${sale.notes}`, 115, 67);
  }

  // Calculate Table Items
  const isFacturaA = invType === 'FACTURA_A';

  const tableData = sale.items.map(item => {
    const unitP = isFacturaA ? (item.unitPrice / 1.21) : item.unitPrice;
    const subt = isFacturaA ? (item.subtotal / 1.21) : item.subtotal;
    return [
      item.code || '-',
      item.productName,
      item.quantity,
      'un',
      `$${unitP.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isFacturaA ? '21%' : '0%',
      `$${subt.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: 75,
    head: isFacturaA 
      ? [['Código', 'Producto / Descripción', 'Cant.', 'U.M.', 'Precio Neto', 'IVA', 'Subtotal Neto']]
      : [['Código', 'Producto / Descripción', 'Cant.', 'U.M.', 'Precio Unit.', 'Desc.', 'Subtotal']],
    body: tableData,
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Totals Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(120, finalY, 76, isFacturaA ? 38 : 30, 2, 2, 'F');

  if (isFacturaA) {
    const netoGravado = Math.round((sale.totalAmount / 1.21) * 100) / 100;
    const totalIva = Math.round((sale.totalAmount - netoGravado) * 100) / 100;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal Neto Gravado:`, 124, finalY + 8);
    doc.text(`$${netoGravado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 190, finalY + 8, { align: 'right' });

    doc.text(`IVA (21.00%):`, 124, finalY + 16);
    doc.text(`$${totalIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 190, finalY + 16, { align: 'right' });

    if (sale.discount > 0) {
      doc.text(`Descuento Aplicado:`, 124, finalY + 24);
      doc.text(`-$${sale.discount.toLocaleString('es-AR')}`, 190, finalY + 24, { align: 'right' });
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL FACTURADO:`, 124, finalY + 34);
    doc.text(`$${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 190, finalY + 34, { align: 'right' });
  } else {
    let currentY = finalY + 8;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal:`, 124, currentY);
    doc.text(`$${sale.subtotal.toLocaleString('es-AR')}`, 190, currentY, { align: 'right' });

    if (sale.discount > 0) {
      currentY += 6;
      doc.text(`Descuento:`, 124, currentY);
      doc.text(`-$${sale.discount.toLocaleString('es-AR')}`, 190, currentY, { align: 'right' });
    }

    if (sale.surcharge && sale.surcharge > 0) {
      currentY += 6;
      doc.text(`Recargo Tarjeta (${sale.cardBankName || 'Banco'}):`, 124, currentY);
      doc.text(`+$${sale.surcharge.toLocaleString('es-AR')}`, 190, currentY, { align: 'right' });
    }

    currentY += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL:`, 124, currentY);
    doc.text(`$${sale.totalAmount.toLocaleString('es-AR')}`, 190, currentY, { align: 'right' });
  }

  // AFIP Footer CAE & QR Box
  const footerY = 250;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, footerY - 5, 196, footerY - 5);

  // Simulated QR Code Frame
  doc.setFillColor(241, 245, 249);
  doc.rect(14, footerY, 25, 25, 'F');
  doc.rect(14, footerY, 25, 25, 'S');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('AFIP QR', 26.5, footerY + 13, { align: 'center' });

  // CAE Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const caeVal = sale.cae || `743${Math.floor(10000000000 + Math.random() * 90000000000)}`;
  const caeDue = sale.caeDueDate || new Date(Date.now() + 10 * 86400000).toLocaleDateString('es-AR');

  doc.text(`CAE N°: ${caeVal}`, 45, footerY + 8);
  doc.text(`Fecha de Vencimiento de CAE: ${caeDue}`, 45, footerY + 15);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Comprobante Autorizado por AFIP - Ley de Facturación Electrónica N° 27.440', 45, footerY + 22);
  doc.text(storeInfo.receiptHeaderMessage || '¡Gracias por su compra! Conserve este comprobante.', 105, 282, { align: 'center' });

  doc.save(`${title.replace(/\s+/g, '_')}_${sale.invoiceNumber}.pdf`);
};

export const generateThermalTicketPDF = (sale: Sale, storeInfo: StoreInfo) => {
  // Thermal Ticket PDF (80mm width = ~80pt, high height)
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200]
  });

  let y = 8;

  // Center Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(storeInfo.name.toUpperCase(), 40, y, { align: 'center' });
  y += 5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`CUIT: ${storeInfo.cuit}`, 40, y, { align: 'center' });
  y += 4;
  doc.text(storeInfo.address, 40, y, { align: 'center' });
  y += 4;
  doc.text(`Tel: ${storeInfo.phone}`, 40, y, { align: 'center' });
  y += 6;

  doc.setDrawColor(0, 0, 0);
  doc.line(5, y, 75, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`TICKET COMPROBANTE N°:`, 40, y, { align: 'center' });
  y += 4;
  doc.text(sale.invoiceNumber, 40, y, { align: 'center' });
  y += 5;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${new Date(sale.date).toLocaleString('es-AR')}`, 5, y);
  y += 4;
  doc.text(`Cliente: ${sale.customerName || 'Consumidor Final'}`, 5, y);
  y += 4;
  doc.text(`Pago: ${formatPaymentMethod(sale.paymentMethod)}`, 5, y);
  y += 5;

  doc.line(5, y, 75, y);
  y += 5;

  // Items
  sale.items.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.text(item.productName.slice(0, 28), 5, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.text(`${item.quantity} x $${item.unitPrice.toLocaleString('es-AR')}`, 5, y);
    doc.text(`$${item.subtotal.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
    y += 4.5;
  });

  doc.line(5, y, 75, y);
  y += 5;

  // Totals
  doc.setFontSize(8);
  if (sale.discount > 0) {
    doc.text(`Subtotal: $${sale.subtotal.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
    y += 4;
    doc.text(`Descuento: -$${sale.discount.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
    y += 4;
  }
  if (sale.surcharge && sale.surcharge > 0) {
    doc.text(`Recargo (${sale.cardBankName || 'Tarjeta'}): +$${sale.surcharge.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
    y += 4;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: $${sale.totalAmount.toLocaleString('es-AR')}`, 75, y, { align: 'right' });
  y += 8;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(storeInfo.receiptHeaderMessage || '¡Gracias por su compra!', 40, y, { align: 'center' });

  doc.save(`Ticket_Termico_${sale.invoiceNumber}.pdf`);
};

export const printThermalTicketDirect = (sale: Sale, storeInfo: StoreInfo) => {
  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const itemsHtml = sale.items.map(item => `
    <tr>
      <td style="text-align: left; padding: 2px 0;">${item.productName}</td>
      <td style="text-align: center; padding: 2px 0;">${item.quantity}</td>
      <td style="text-align: right; padding: 2px 0;">$${item.unitPrice.toLocaleString('es-AR')}</td>
      <td style="text-align: right; padding: 2px 0; font-weight: bold;">$${item.subtotal.toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ticket ${sale.invoiceNumber}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 0 auto; padding: 4mm 0; font-size: 11px; color: #000; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="text-center bold" style="font-size: 14px;">${storeInfo.name.toUpperCase()}</div>
        <div class="text-center" style="font-size: 10px;">CUIT: ${storeInfo.cuit || ''}</div>
        <div class="text-center" style="font-size: 10px;">${storeInfo.address || ''}</div>
        <div class="text-center" style="font-size: 10px;">Tel: ${storeInfo.phone || ''}</div>
        <div class="divider"></div>
        <div class="text-center bold">TICKET COMPROBANTE N° ${sale.invoiceNumber}</div>
        <div style="font-size: 10px; margin-top: 3px;">Fecha: ${new Date(sale.date).toLocaleString('es-AR')}</div>
        <div style="font-size: 10px;">Cliente: ${sale.customerName || 'Consumidor Final'}</div>
        <div style="font-size: 10px;">Forma de Pago: ${formatPaymentMethod(sale.paymentMethod)}</div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left;">Item</th>
              <th style="text-align: center;">Cant</th>
              <th style="text-align: right;">P.Unit</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="divider"></div>
        ${sale.discount > 0 ? `<div class="text-right">Subtotal: $${sale.subtotal.toLocaleString('es-AR')}</div><div class="text-right">Descuento: -$${sale.discount.toLocaleString('es-AR')}</div>` : ''}
        ${sale.surcharge && sale.surcharge > 0 ? `<div class="text-right">Recargo: +$${sale.surcharge.toLocaleString('es-AR')}</div>` : ''}
        <div class="text-right bold" style="font-size: 14px; margin-top: 4px;">TOTAL: $${sale.totalAmount.toLocaleString('es-AR')}</div>
        <div class="divider"></div>
        <div class="text-center" style="font-size: 9px; margin-top: 8px;">${storeInfo.receiptHeaderMessage || '¡Gracias por su compra!'}</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWin.document.close();
};



export const generateCustomerAccountStatementPDF = (
  customer: Customer,
  transactions: CustomerTransaction[],
  storeInfo: StoreInfo
) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(storeInfo.name.toUpperCase(), 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ESTADO DE CUENTA CORRIENTE', 14, 26);

  doc.setFontSize(10);
  doc.text(`Fecha Emisión: ${new Date().toLocaleDateString('es-AR')}`, 140, 18);
  doc.text(`Tel: ${storeInfo.phone}`, 140, 26);

  // Customer Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 32, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${customer.name}`, 20, 52);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`DNI / CUIT: ${customer.dniCuit || 'Sin registrar'}`, 20, 59);
  doc.text(`Tel: ${customer.phone || '-'} | Email: ${customer.email || '-'}`, 20, 66);

  doc.setFont('helvetica', 'bold');
  doc.text(`Límite Crédito: $${customer.creditLimit.toLocaleString('es-AR')}`, 130, 52);
  doc.setTextColor(customer.currentBalance > 0 ? 185 : 22, customer.currentBalance > 0 ? 28 : 101, customer.currentBalance > 0 ? 28 : 52);
  doc.setFontSize(12);
  doc.text(`SALDO ACTUAL: $${customer.currentBalance.toLocaleString('es-AR')}`, 130, 62);

  // Table
  const tableData = transactions.map(t => [
    new Date(t.date).toLocaleDateString('es-AR'),
    t.description,
    t.type === 'sale' ? 'Venta / Cargo' : (t.type === 'payment' ? 'Pago / Entrega' : 'Ajuste'),
    t.type === 'payment' ? `-$${t.amount.toLocaleString('es-AR')}` : `+$${t.amount.toLocaleString('es-AR')}`,
    `$${t.balanceAfter.toLocaleString('es-AR')}`
  ]);

  autoTable(doc, {
    startY: 80,
    head: [['Fecha', 'Concepto / Comprobante', 'Tipo', 'Monto', 'Saldo Restante']],
    body: tableData,
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  doc.save(`CuentaCorriente_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const generateWithdrawalReceiptPDF = (withdrawal: CustomerWithdrawal, storeInfo: StoreInfo) => {
  const doc = new jsPDF();

  doc.setFillColor(16, 185, 129); // emerald-600
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(storeInfo.name.toUpperCase(), 14, 18);
  doc.setFontSize(11);
  doc.text('REMITO DE RETIRO DE MERCADERÍA', 14, 27);

  doc.setFontSize(12);
  doc.text(`N°: ${withdrawal.withdrawalNumber}`, 140, 18);
  doc.setFontSize(9);
  doc.text(`Fecha: ${new Date(withdrawal.date).toLocaleString('es-AR')}`, 140, 27);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${withdrawal.customerName}`, 14, 46);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Estado: ${withdrawal.status === 'pending' ? 'PENDIENTE DE FACTURAR' : 'FACTURADO'}`, 14, 53);
  if (withdrawal.notes) {
    doc.text(`Notas: ${withdrawal.notes}`, 14, 59);
  }

  const tableData = withdrawal.items.map(item => [
    item.productCode || '-',
    item.productName,
    item.quantity,
    `$${item.unitPrice.toLocaleString('es-AR')}`,
    `$${item.totalPrice.toLocaleString('es-AR')}`
  ]);

  autoTable(doc, {
    startY: withdrawal.notes ? 65 : 60,
    head: [['Código', 'Producto Retirado', 'Cantidad', 'Valor Unit. (Estimado)', 'Total']],
    body: tableData,
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 3.5 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Retirado: $${withdrawal.totalAmount.toLocaleString('es-AR')}`, 140, finalY);

  // Signature Block
  doc.setDrawColor(148, 163, 184);
  doc.line(20, finalY + 40, 80, finalY + 40);
  doc.line(130, finalY + 40, 190, finalY + 40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma y Aclaración Cliente', 50, finalY + 46, { align: 'center' });
  doc.text('Entregado por / Firma Comercio', 160, finalY + 46, { align: 'center' });

  doc.save(`RemitoRetiro_${withdrawal.withdrawalNumber}.pdf`);
};

export const generateMonthlyReportPDF = (
  monthLabel: string,
  year: number,
  sales: Sale[],
  products: Product[],
  storeInfo: StoreInfo
) => {
  const doc = new jsPDF();

  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, 210, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(storeInfo.name.toUpperCase(), 14, 18);
  doc.setFontSize(11);
  doc.text(`REPORTES MENSUALES Y RENDIMIENTO - ${monthLabel.toUpperCase()} ${year}`, 14, 27);

  const completedSales = sales.filter(s => s.status === 'completed');
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);

  let totalCost = 0;
  const productSalesMap = new Map<string, { name: string; qty: number; revenue: number }>();

  completedSales.forEach(s => {
    s.items.forEach(item => {
      totalCost += (item.costPrice || 0) * item.quantity;
      const current = productSalesMap.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
      current.qty += item.quantity;
      current.revenue += item.subtotal;
      productSalesMap.set(item.productId, current);
    });
  });

  const grossProfit = totalRevenue - totalCost;

  // KPI boxes
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(14, 45, 55, 25, 2, 2, 'F');
  doc.roundedRect(77, 45, 55, 25, 2, 2, 'F');
  doc.roundedRect(140, 45, 56, 25, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Ventas Totales', 18, 52);
  doc.text('Costo Mercadería', 81, 52);
  doc.text('Ganancia Bruta Est.', 144, 52);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`$${totalRevenue.toLocaleString('es-AR')}`, 18, 62);
  doc.text(`$${totalCost.toLocaleString('es-AR')}`, 81, 62);
  doc.setTextColor(16, 185, 129);
  doc.text(`$${grossProfit.toLocaleString('es-AR')}`, 144, 62);

  // Top Products Table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RENDIMIENTO POR PRODUCTO (TOP VENTAS)', 14, 80);

  const sortedProducts = Array.from(productSalesMap.values()).sort((a, b) => b.revenue - a.revenue);
  const tableData = sortedProducts.map(p => [
    p.name,
    p.qty,
    `$${p.revenue.toLocaleString('es-AR')}`,
    totalRevenue > 0 ? `${((p.revenue / totalRevenue) * 100).toFixed(1)}%` : '0%'
  ]);

  autoTable(doc, {
    startY: 85,
    head: [['Producto', 'Cant. Vendida', 'Ingresos Generados', '% del Total']],
    body: tableData,
    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }
  });

  doc.save(`Reporte_Mensual_${monthLabel}_${year}.pdf`);
};

const formatPaymentMethod = (method: string) => {
  switch (method) {
    case 'cash': return 'Efectivo';
    case 'card': return 'Tarjeta';
    case 'transfer': return 'Transferencia';
    case 'cheque': return 'Cheque';
    case 'current_account': return 'Cuenta Corriente';
    default: return method;
  }
};
