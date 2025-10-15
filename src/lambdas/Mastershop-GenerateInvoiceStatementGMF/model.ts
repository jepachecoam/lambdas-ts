import { PDFDocument, rgb } from "pdf-lib";

import Dao from "./dao";
import { CustomerDeduplicationEnvs } from "./types";

class Model {
  private dao: Dao;
  private environment: string;
  private envs: CustomerDeduplicationEnvs;

  constructor(environment: string, envs: CustomerDeduplicationEnvs) {
    this.dao = new Dao(environment);
    this.envs = envs;
    this.environment = environment;
  }

  async processCustomer(): Promise<Buffer> {
    const result = await this.dao.getAllActiveCustomers();

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { height } = page.getSize();

    page.drawText("Invoice Statement GMF", {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0)
    });

    let yPosition = height - 100;

    if (result && result.length > 0) {
      result.forEach((customer: any, index: number) => {
        const text = `${JSON.stringify(customer)} id ${index + 1}`;
        page.drawText(text, {
          x: 50,
          y: yPosition,
          size: 12,
          color: rgb(0, 0, 0)
        });
        yPosition -= 20;

        if (yPosition < 50) {
          const newPage = pdfDoc.addPage([595, 842]);
          yPosition = newPage.getSize().height - 50;
        }
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

export default Model;
