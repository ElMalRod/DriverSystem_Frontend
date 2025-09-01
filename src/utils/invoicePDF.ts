import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface InvoiceData {
  id: number;
  code: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  pendingAmount: number;
  items: InvoiceItem[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export class InvoicePDFGenerator {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  async generateInvoicePDF(invoiceData: InvoiceData): Promise<void> {
    this.doc = new jsPDF();

    // Configurar fuente
    this.doc.setFont('helvetica');

    // Encabezado
    this.addHeader(invoiceData);

    // Información del cliente
    this.addCustomerInfo(invoiceData);

    // Detalles de la factura
    this.addInvoiceDetails(invoiceData);

    // Items de la factura
    this.addInvoiceItems(invoiceData.items);

    // Totales
    this.addTotals(invoiceData);

    // Pie de página
    this.addFooter();

    // Descargar el PDF
    const fileName = `Factura_${invoiceData.code}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }

  private addHeader(invoiceData: InvoiceData): void {
    // Logo/Título
    this.doc.setFontSize(24);
    this.doc.setTextColor(0, 123, 255); // Azul
    this.doc.text('DRIVE SYSTEM', 20, 30);

    // Subtítulo
    this.doc.setFontSize(12);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Sistema de Gestión de Vehículos', 20, 40);

    // Título de la factura
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('FACTURA', 150, 30);

    // Número de factura
    this.doc.setFontSize(12);
    this.doc.text(`N°: ${invoiceData.code}`, 150, 40);

    // Fecha
    const date = new Date(invoiceData.createdAt).toLocaleDateString('es-ES');
    this.doc.text(`Fecha: ${date}`, 150, 50);

    // Estado
    const statusText = invoiceData.status === 'PAID' ? 'PAGADA' : 'PENDIENTE';
    const statusColor = invoiceData.status === 'PAID' ? [0, 128, 0] : [255, 165, 0];
    this.doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    this.doc.text(`Estado: ${statusText}`, 150, 60);
  }

  private addCustomerInfo(invoiceData: InvoiceData): void {
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFontSize(14);
    this.doc.text('Información del Cliente', 20, 80);

    this.doc.setFontSize(10);
    let yPos = 90;

    if (invoiceData.customerName) {
      this.doc.text(`Nombre: ${invoiceData.customerName}`, 20, yPos);
      yPos += 10;
    }

    if (invoiceData.customerEmail) {
      this.doc.text(`Email: ${invoiceData.customerEmail}`, 20, yPos);
      yPos += 10;
    }

    if (invoiceData.customerPhone) {
      this.doc.text(`Teléfono: ${invoiceData.customerPhone}`, 20, yPos);
    }
  }

  private addInvoiceDetails(invoiceData: InvoiceData): void {
    this.doc.setFontSize(14);
    this.doc.text('Detalles de la Factura', 20, 130);

    this.doc.setFontSize(10);
    this.doc.text(`ID de Factura: ${invoiceData.id}`, 20, 145);
    this.doc.text(`Fecha de Creación: ${new Date(invoiceData.createdAt).toLocaleString('es-ES')}`, 20, 155);
    this.doc.text(`Estado: ${invoiceData.status}`, 20, 165);
  }

  private addInvoiceItems(items: InvoiceItem[]): void {
    this.doc.setFontSize(14);
    this.doc.text('Items', 20, 185);

    // Encabezados de tabla
    this.doc.setFontSize(10);
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(20, 190, 170, 10, 'F');

    this.doc.text('Descripción', 25, 197);
    this.doc.text('Cant.', 120, 197);
    this.doc.text('Precio', 140, 197);
    this.doc.text('Total', 165, 197);

    // Línea separadora
    this.doc.line(20, 200, 190, 200);

    let yPos = 210;
    items.forEach((item, index) => {
      // Fila alterna con color de fondo
      if (index % 2 === 0) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(20, yPos - 5, 170, 10, 'F');
      }

      this.doc.text(item.description.substring(0, 50), 25, yPos);
      this.doc.text(item.quantity.toString(), 125, yPos);
      this.doc.text(`$${item.price.toFixed(2)}`, 140, yPos);
      this.doc.text(`$${item.total.toFixed(2)}`, 165, yPos);

      yPos += 10;

      // Si la descripción es muy larga, agregar más líneas
      if (item.description.length > 50) {
        this.doc.text(item.description.substring(50, 100), 25, yPos);
        yPos += 10;
      }
    });
  }

  private addTotals(invoiceData: InvoiceData): void {
    const yPos = 250;

    // Línea separadora
    this.doc.line(20, yPos, 190, yPos);

    this.doc.setFontSize(12);
    this.doc.text('Total de la Factura:', 120, yPos + 15);
    this.doc.text(`$${invoiceData.totalAmount.toFixed(2)}`, 165, yPos + 15);

    if (invoiceData.pendingAmount > 0) {
      this.doc.text('Monto Pendiente:', 120, yPos + 25);
      this.doc.text(`$${invoiceData.pendingAmount.toFixed(2)}`, 165, yPos + 25);
    }
  }

  private addFooter(): void {
    const pageHeight = this.doc.internal.pageSize.height;

    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Gracias por su preferencia', 20, pageHeight - 30);
    this.doc.text('Drive System - Sistema de Gestión de Vehículos', 20, pageHeight - 20);
    this.doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, 20, pageHeight - 10);
  }

  // Método alternativo usando html2canvas para capturar elementos HTML
  async generateFromHTML(elementId: string, invoiceData: InvoiceData): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = `Factura_${invoiceData.code}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }
}

// Función de utilidad para descargar facturas
export const downloadInvoicePDF = async (invoiceData: InvoiceData): Promise<void> => {
  const generator = new InvoicePDFGenerator();
  await generator.generateInvoicePDF(invoiceData);
};

// Función para descargar desde un elemento HTML
export const downloadInvoiceFromHTML = async (elementId: string, invoiceData: InvoiceData): Promise<void> => {
  const generator = new InvoicePDFGenerator();
  await generator.generateFromHTML(elementId, invoiceData);
};
