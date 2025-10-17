import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface InvoiceDetailItem {
  detail: string;
  value: number;
  createdAt: Date;
}

interface GMFCertificationData {
  idDocument: string;
  emissionDate: Date;
  clientName: string;
  documentNumber: string;
  invoiceDetails: InvoiceDetailItem[];
  total4xMil: number;
}

const LETTER_WIDTH = 612;
const LETTER_HEIGHT = 792;
const MARGIN_LEFT = 50;
const MARGIN_RIGHT = 50;
const MARGIN_TOP = 50;
const MARGIN_BOTTOM = 50;
const FIRST_PAGE_MAX_ROWS = 10;
const OTHER_PAGES_MAX_ROWS = 20;

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export async function generateGMFCertificationPDF(
  data: GMFCertificationData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let currentPage = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  let yPosition = LETTER_HEIGHT - MARGIN_TOP;
  let rowCount = 0;
  let isFirstPage = true;

  const drawHeader = () => {
    yPosition = LETTER_HEIGHT - MARGIN_TOP;

    const companyName = "PRIVILEGE TEAM S.A.S.";
    const companyNameWidth = fontBold.widthOfTextAtSize(companyName, 14);
    currentPage.drawText(companyName, {
      x: (LETTER_WIDTH - companyNameWidth) / 2,
      y: yPosition,
      size: 14,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;

    const nit = "NIT 901.320.851-2";
    const nitWidth = font.widthOfTextAtSize(nit, 11);
    currentPage.drawText(nit, {
      x: (LETTER_WIDTH - nitWidth) / 2,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 18;

    const address = "Calle 33A 71 10";
    const addressWidth = font.widthOfTextAtSize(address, 11);
    currentPage.drawText(address, {
      x: (LETTER_WIDTH - addressWidth) / 2,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 18;

    const city = "Medellín - Colombia";
    const cityWidth = font.widthOfTextAtSize(city, 11);
    currentPage.drawText(city, {
      x: (LETTER_WIDTH - cityWidth) / 2,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 18;

    const email = "admin@master.la";
    const emailWidth = font.widthOfTextAtSize(email, 11);
    currentPage.drawText(email, {
      x: (LETTER_WIDTH - emailWidth) / 2,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 40;

    const titleText = "CERTIFICACIÓN DE REEMBOLSO DE GRAVAMEN AL MOVIMIENTO";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 12);
    currentPage.drawText(titleText, {
      x: (LETTER_WIDTH - titleWidth) / 2,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    yPosition -= 18;

    const subtitleText = "FINANCIERO";
    const subtitleWidth = fontBold.widthOfTextAtSize(subtitleText, 12);
    currentPage.drawText(subtitleText, {
      x: (LETTER_WIDTH - subtitleWidth) / 2,
      y: yPosition,
      size: 12,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    yPosition -= 40;

    currentPage.drawText(`Nro de Documento: ${data.idDocument}`, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;

    currentPage.drawText(`Fecha de emisión: ${formatDate(data.emissionDate)}`, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 40;

    currentPage.drawText("Señores:", {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 20;

    currentPage.drawText(data.clientName, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 18;

    currentPage.drawText(data.documentNumber, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 11,
      font,
      color: rgb(0, 0, 0)
    });
    yPosition -= 40;
  };

  const drawTableHeader = () => {
    const tableY = yPosition;
    const col1X = MARGIN_LEFT;
    const col1Width = 100;
    const col2X = col1X + col1Width;
    const col3X = MARGIN_LEFT + 400;
    const col3Width =
      LETTER_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - col3X + MARGIN_LEFT;
    const col2Width = col3X - col2X;

    currentPage.drawRectangle({
      x: col1X,
      y: tableY - 20,
      width: LETTER_WIDTH - MARGIN_LEFT - MARGIN_RIGHT,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    currentPage.drawLine({
      start: { x: col2X, y: tableY - 20 },
      end: { x: col2X, y: tableY + 5 },
      color: rgb(0, 0, 0),
      thickness: 1
    });

    currentPage.drawLine({
      start: { x: col3X, y: tableY - 20 },
      end: { x: col3X, y: tableY + 5 },
      color: rgb(0, 0, 0),
      thickness: 1
    });

    const fechaText = "FECHA";
    const fechaWidth = fontBold.widthOfTextAtSize(fechaText, 10);
    currentPage.drawText(fechaText, {
      x: col1X + (col1Width - fechaWidth) / 2,
      y: tableY - 12,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    const detalleText = "DETALLE";
    const detalleWidth = fontBold.widthOfTextAtSize(detalleText, 10);
    currentPage.drawText(detalleText, {
      x: col2X + (col2Width - detalleWidth) / 2,
      y: tableY - 12,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    const xmilText = "4XMIL";
    const xmilWidth = fontBold.widthOfTextAtSize(xmilText, 10);
    currentPage.drawText(xmilText, {
      x: col3X + (col3Width - xmilWidth) / 2,
      y: tableY - 12,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0)
    });

    yPosition -= 25;
  };

  const drawTableRow = (item: InvoiceDetailItem) => {
    const rowY = yPosition;
    const col1X = MARGIN_LEFT;
    const col1Width = 100;
    const col2X = col1X + col1Width;
    const col3X = MARGIN_LEFT + 400;
    const col3Width =
      LETTER_WIDTH - MARGIN_LEFT - MARGIN_RIGHT - col3X + MARGIN_LEFT;

    currentPage.drawRectangle({
      x: col1X,
      y: rowY - 20,
      width: LETTER_WIDTH - MARGIN_LEFT - MARGIN_RIGHT,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });

    currentPage.drawLine({
      start: { x: col2X, y: rowY - 20 },
      end: { x: col2X, y: rowY + 5 },
      color: rgb(0, 0, 0),
      thickness: 1
    });

    currentPage.drawLine({
      start: { x: col3X, y: rowY - 20 },
      end: { x: col3X, y: rowY + 5 },
      color: rgb(0, 0, 0),
      thickness: 1
    });

    const dateText = formatDate(new Date(item.createdAt));
    const dateWidth = font.widthOfTextAtSize(dateText, 9);
    currentPage.drawText(dateText, {
      x: col1X + (col1Width - dateWidth) / 2,
      y: rowY - 12,
      size: 9,
      font,
      color: rgb(0, 0, 0)
    });

    const col2Width = col3X - col2X - 20;
    let detailText = item.detail;
    let detailWidth = font.widthOfTextAtSize(detailText, 9);

    if (detailWidth > col2Width) {
      while (detailWidth > col2Width && detailText.length > 0) {
        detailText = detailText.substring(0, detailText.length - 1);
        detailWidth = font.widthOfTextAtSize(detailText + "...", 9);
      }
      detailText += "...";
    }

    currentPage.drawText(detailText, {
      x: col2X + 10,
      y: rowY - 12,
      size: 9,
      font,
      color: rgb(0, 0, 0)
    });

    const valueText = formatCurrency(item.value);
    const valueWidth = font.widthOfTextAtSize(valueText, 9);
    currentPage.drawText(valueText, {
      x: col3X + (col3Width - valueWidth) / 2,
      y: rowY - 12,
      size: 9,
      font,
      color: rgb(0, 0, 0)
    });

    yPosition -= 25;
  };

  const drawTotal = () => {
    yPosition -= 20;
    currentPage.drawText(`TOTAL 4XMIL: ${formatCurrency(data.total4xMil)}`, {
      x: MARGIN_LEFT,
      y: yPosition,
      size: 11,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
    yPosition -= 30;
  };

  const drawLegalText = () => {
    const legalText =
      "De conformidad con lo establecido en el artículo 771-2 del Estatuto Tributario, el artículo 1.6.1.4.6 del Decreto 1625 de 2016 y la Resolución DIAN 000165 de 2023, el presente documento constituye soporte idóneo para la procedencia de los costos y deducciones en el impuesto de renta.";
    const maxWidth = LETTER_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    const words = legalText.split(" ");
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const testLine = line + word + " ";
      const testWidth = font.widthOfTextAtSize(testLine, 10);

      if (testWidth > maxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }

    if (line.trim() !== "") {
      lines.push(line.trim());
    }

    lines.forEach((textLine, index) => {
      const isLastLine = index === lines.length - 1;

      if (isLastLine) {
        currentPage.drawText(textLine, {
          x: MARGIN_LEFT,
          y: yPosition,
          size: 10,
          font,
          color: rgb(0, 0, 0)
        });
      } else {
        const lineWords = textLine.split(" ");
        const textWidth = font.widthOfTextAtSize(textLine, 10);
        const spacesCount = lineWords.length - 1;
        const extraSpace =
          spacesCount > 0 ? (maxWidth - textWidth) / spacesCount : 0;

        let xPos = MARGIN_LEFT;
        lineWords.forEach((word) => {
          currentPage.drawText(word, {
            x: xPos,
            y: yPosition,
            size: 10,
            font,
            color: rgb(0, 0, 0)
          });
          const wordWidth = font.widthOfTextAtSize(word, 10);
          const spaceWidth = font.widthOfTextAtSize(" ", 10);
          xPos += wordWidth + spaceWidth + extraSpace;
        });
      }

      yPosition -= 15;
    });
  };

  drawHeader();
  drawTableHeader();

  for (let i = 0; i < data.invoiceDetails.length; i++) {
    const maxRows = isFirstPage ? FIRST_PAGE_MAX_ROWS : OTHER_PAGES_MAX_ROWS;

    if (rowCount >= maxRows) {
      currentPage = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
      yPosition = LETTER_HEIGHT - MARGIN_TOP;
      drawTableHeader();
      rowCount = 0;
      isFirstPage = false;
    }

    drawTableRow(data.invoiceDetails[i]);
    rowCount++;
  }

  if (yPosition < MARGIN_BOTTOM + 100) {
    currentPage = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
    yPosition = LETTER_HEIGHT - MARGIN_TOP;
  }

  drawTotal();
  drawLegalText();

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
