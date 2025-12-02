import { jsPDF } from 'jspdf';

export interface PurchaseOrderPDFData {
    folio: string;
    descripcion: string;
    monto: number;
    fecha: string;
    fechaMinPago?: string;
    fechaMaxPago?: string;
    autoriza: string;
    comentarios?: string;
    supplier?: { nombre: string };
    project?: { name: string };
    createdBy?: { firstName: string; lastName: string };
    approvedBy?: { firstName: string; lastName: string };
    approvedAt?: string;
    includesVAT?: boolean;
}

export function generatePurchaseOrderPDF(data: PurchaseOrderPDFData) {
    const {
        folio,
        descripcion,
        monto,
        fecha,
        fechaMinPago,
        fechaMaxPago,
        autoriza,
        comentarios,
    } = data;

    // Format dates
    function formatearFecha(valor?: string) {
        if (!valor) return '__/__/____';
        try {
            // Handle ISO date strings (YYYY-MM-DD)
            let dateObj: Date;
            if (valor.includes('T')) {
                // Full ISO timestamp
                dateObj = new Date(valor);
            } else {
                // Date only (YYYY-MM-DD) - add T00:00:00 to avoid timezone issues
                dateObj = new Date(valor + 'T00:00:00');
            }

            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return '__/__/____';
            }

            const opciones: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
            return dateObj.toLocaleDateString('es-MX', opciones);
        } catch (error) {
            console.error('Error formatting date:', valor, error);
            return '__/__/____';
        }
    }

    const fechaLegible = formatearFecha(fecha) || '__/__/____';
    const fechaMinLegible = formatearFecha(fechaMinPago) || '__/__/____';
    const fechaMaxLegible = formatearFecha(fechaMaxPago) || '__/__/____';

    // Calculate amounts
    const montoNumero = parseFloat(monto.toString()) || 0;
    let subtotal: number;
    let ivaNumero: number;
    let totalNumero: number;

    if (data.includesVAT) {
        // If amount includes VAT, we need to separate it
        totalNumero = montoNumero;
        subtotal = montoNumero / 1.16;
        ivaNumero = montoNumero - subtotal;
    } else {
        // If amount does NOT include VAT, don't add it - the amount IS the total
        subtotal = montoNumero;
        ivaNumero = 0;
        totalNumero = montoNumero;
    }

    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    });

    const subtotalMXN = formatter.format(subtotal);
    const ivaMXN = formatter.format(ivaNumero);
    const totalMXN = formatter.format(totalNumero);

    const doc = new jsPDF({
        unit: 'mm',
        format: 'letter',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const contentWidth = pageWidth - marginX * 2;

    // ===== WATERMARK =====
    doc.setTextColor(245, 245, 245);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);

    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    doc.text('RUN SOLUTIONS', centerX, centerY - 22, {
        align: 'center',
        angle: 35,
    });

    doc.text('GRUPO NEARLINK 360', centerX, centerY + 28, {
        align: 'center',
        angle: 35,
    });

    // Reset color
    doc.setTextColor(0, 0, 0);

    // ===== HEADER =====
    doc.setFillColor(200, 0, 0);
    doc.rect(0, 0, pageWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ORDEN DE AUTORIZACIÓN Y COMPRA', pageWidth / 2, 9, {
        align: 'center',
    });

    doc.setFontSize(9);
    doc.text('RUN SOLUTIONS | GRUPO NEARLINK 360', pageWidth / 2, 16, {
        align: 'center',
    });

    // Logo placeholder (will be added if image exists)
    // const logoWidth = 42;
    // const logoHeight = 14;
    // const logoX = pageWidth - marginX - logoWidth;
    // const logoY = 3;
    // doc.addImage('/logos_run_nearlink.png', 'PNG', logoX, logoY, logoWidth, logoHeight);

    // Intro text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 26;
    doc.text('Documento interno de autorización y compra.', marginX, y);
    y += 8;

    // ===== MAIN DATA BLOCK =====
    const metaBoxY = y;
    const metaBoxHeight = 32;
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.rect(marginX, metaBoxY, contentWidth, metaBoxHeight);

    doc.setFontSize(10);
    y = metaBoxY + 7;

    const col2X = marginX + contentWidth / 2;

    // Line 1: Folio and creation date
    doc.setFont('helvetica', 'bold');
    doc.text('Folio:', marginX + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(folio || '________', marginX + 20, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha creación OC:', col2X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaLegible, col2X + 35, y);

    // Line 2: Requester
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Solicitante / Quien autoriza:', marginX + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(autoriza || '______________________', marginX + 55, y);

    // Line 3: Amount
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Monto autorizado (MXN):', marginX + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(totalMXN, marginX + 65, y);

    // Line 4: Payment dates
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Fecha mínima de pago:', marginX + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaMinLegible, marginX + 45, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha máxima de pago:', col2X, y);
    doc.setFont('helvetica', 'normal');
    doc.text(fechaMaxLegible, col2X + 45, y);

    // Dates legend
    y = metaBoxY + metaBoxHeight + 5;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const fechasLegend =
        'Las fechas proporcionadas son aproximadas y siempre se recomienda considerar la fecha máxima de pago.';
    const fechasLines = doc.splitTextToSize(fechasLegend, contentWidth);
    doc.text(fechasLines, marginX, y);

    // ===== DESCRIPTION SECTION =====
    y += 8;
    const descHeaderY = y;

    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(200);
    doc.rect(marginX, descHeaderY, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('DESCRIPCIÓN / CONCEPTO', marginX + 2, descHeaderY + 5);

    const descBoxY = descHeaderY + 7;
    const descBoxHeight = 40;
    doc.setDrawColor(200);
    doc.rect(marginX, descBoxY, contentWidth, descBoxHeight);

    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(descripcion || 'Sin descripción', contentWidth - 6);
    doc.text(descLines, marginX + 3, descBoxY + 7);

    // ===== COMMENTS SECTION =====
    y = descBoxY + descBoxHeight + 8;
    const comHeaderY = y;

    doc.setFillColor(240, 240, 240);
    doc.rect(marginX, comHeaderY, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text('COMENTARIOS / NOTAS ADICIONALES', marginX + 2, comHeaderY + 5);

    const comBoxY = comHeaderY + 7;
    const comBoxHeight = 35;
    doc.setDrawColor(200);
    doc.rect(marginX, comBoxY, contentWidth, comBoxHeight);

    doc.setFont('helvetica', 'normal');
    const comLines = doc.splitTextToSize(comentarios || 'Sin comentarios', contentWidth - 6);
    doc.text(comLines, marginX + 3, comBoxY + 7);

    // ===== AMOUNTS SUMMARY =====
    y = comBoxY + comBoxHeight + 8;
    const resumenHeaderY = y;

    doc.setFillColor(240, 240, 240);
    doc.rect(marginX, resumenHeaderY, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('RESUMEN DE MONTOS', marginX + 2, resumenHeaderY + 5);

    const resumenBoxY = resumenHeaderY + 7;
    const resumenBoxHeight = 18;
    doc.setDrawColor(200);
    doc.rect(marginX, resumenBoxY, contentWidth, resumenBoxHeight);

    doc.setFont('helvetica', 'normal');
    const labelX = marginX + 3;
    const valueX = marginX + contentWidth - 3;
    let ry = resumenBoxY + 6;

    doc.text('Subtotal:', labelX, ry);
    doc.text(subtotalMXN, valueX, ry, { align: 'right' });

    ry += 5;
    doc.text('IVA 16%:', labelX, ry);
    doc.text(ivaMXN, valueX, ry, { align: 'right' });

    ry += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('Total:', labelX, ry);
    doc.text(totalMXN, valueX, ry, { align: 'right' });

    // ===== TRACEABILITY SECTION =====
    y = resumenBoxY + resumenBoxHeight + 8;
    const trazaHeaderY = y;

    doc.setFillColor(240, 240, 240);
    doc.rect(marginX, trazaHeaderY, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('TRAZABILIDAD', marginX + 2, trazaHeaderY + 5);

    const trazaBoxY = trazaHeaderY + 7;
    let trazaBoxHeight = 12; // Base height

    // Calculate height based on content
    if (data.createdBy) trazaBoxHeight += 6;
    if (data.approvedBy) trazaBoxHeight += 6;

    doc.setDrawColor(200);
    doc.rect(marginX, trazaBoxY, contentWidth, trazaBoxHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let ty = trazaBoxY + 6;

    // Created by
    if (data.createdBy) {
        doc.setFont('helvetica', 'bold');
        doc.text('Creado por:', marginX + 3, ty);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.createdBy.firstName} ${data.createdBy.lastName} `, marginX + 30, ty);

        doc.setFont('helvetica', 'bold');
        doc.text('Fecha:', col2X, ty);
        doc.setFont('helvetica', 'normal');
        doc.text(fechaLegible, col2X + 15, ty);
        ty += 6;
    }

    // Approved by
    if (data.approvedBy) {
        doc.setFont('helvetica', 'bold');
        doc.text('Aprobado por:', marginX + 3, ty);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.approvedBy.firstName} ${data.approvedBy.lastName} `, marginX + 30, ty);

        if (data.approvedAt) {
            doc.setFont('helvetica', 'bold');
            doc.text('Fecha:', col2X, ty);
            doc.setFont('helvetica', 'normal');
            doc.text(formatearFecha(data.approvedAt), col2X + 15, ty);
        }
        ty += 6;
    }

    // ===== SIGNATURE SECTION =====
    // Ensure signature doesn't get cut off - if too low, add new page
    let firmaY = trazaBoxY + trazaBoxHeight + 15;
    if (firmaY > 200) {
        doc.addPage();
        firmaY = 30;
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(centerX - 35, firmaY, centerX + 35, firmaY);

    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.text('Dirección General', centerX, firmaY - 1, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('AUTORIZA', centerX, firmaY + 6, { align: 'center' });
    doc.text('DIRECCIÓN GENERAL', centerX, firmaY + 12, { align: 'center' });

    // ===== CONFIDENTIALITY LEGEND =====
    const legendBoxY = firmaY + 25;
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220);
    doc.rect(marginX, legendBoxY, contentWidth, 20, 'F');

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    const legendText =
        'ESTE ES UN DOCUMENTO CONFIDENCIAL Y DE USO INTERNO DE GRUPO NEARLINK 360 Y RUN SOLUTIONS. ' +
        'Es válido, tanto interna como externamente, como orden de compra y como soporte para la emisión de facturas y demás comprobantes fiscales relacionados. ' +
        'La aceptación y/o ejecución de esta orden de compra formaliza la relación comercial con RUN Solutions y Grupo Nearlink 360 y se rige por los contratos, acuerdos marco y términos y condiciones comerciales vigentes entre las partes.';
    const legendLines = doc.splitTextToSize(legendText, contentWidth - 6);
    doc.text(legendLines, marginX + 3, legendBoxY + 7);

    doc.text(
        'Documento generado electrónicamente para fines de control interno.',
        pageWidth / 2,
        legendBoxY + 28,
        { align: 'center' }
    );

    // Save the PDF
    const nombreArchivo = `Orden_Autorizacion_Compra_${folio || fecha || 'sin_datos'}.pdf`;
    doc.save(nombreArchivo);
}
