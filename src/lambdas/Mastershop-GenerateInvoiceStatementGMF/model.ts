import Dao from "./dao";
import { generateGMFCertificationPDF } from "./pdfGenerator";

class Model {
  private dao: Dao;
  constructor(environment: string) {
    this.dao = new Dao(environment);
  }

  async getGmfStatement({
    idInvoice
  }: {
    idInvoice: number;
  }): Promise<Buffer | null> {
    const [invoice, invoiceDetails]: any = await Promise.all([
      this.dao.getInvoice({ idInvoice }),
      this.dao.getInvoiceDetail({ idInvoice })
    ]);

    if (!invoice || !invoiceDetails || !invoiceDetails.length) {
      return null;
    }

    const pdfData = {
      idDocument: `${idInvoice}`,
      emissionDate: new Date(invoice.createdAt),
      clientName: invoice.name,
      documentNumber: `${invoice.documentType}-${invoice.documentNumber}`,
      invoiceDetails: invoiceDetails.map((detail: any) => ({
        detail: detail.detail,
        value: detail.value,
        createdAt: detail.createdAt
      })),
      total4xMil: invoice.totalValue
    };

    return generateGMFCertificationPDF(pdfData);
  }

  async getStream(bucket: string, key: string) {
    return this.dao.getStream(bucket, key);
  }

  async putObject(bucket: string, key: string, body: any) {
    return this.dao.putObject(bucket, key, body);
  }
}

export default Model;
