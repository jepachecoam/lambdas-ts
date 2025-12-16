import bwipjs from "bwip-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import dto from "../dto";
import { Envs, ShippingLabelData } from "../types";

const LABEL_WIDTH = 612;
const LABEL_HEIGHT = 400;
const MARGIN = 10;

const formatCurrency = (value: number): string => {
  return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP`;
};

const generateBarcode = async (text: string): Promise<Uint8Array> => {
  return bwipjs.toBuffer({
    bcid: "code128",
    text: text,
    scale: 2,
    height: 15,
    includetext: false,
    backgroundcolor: "ffffff",
    paddingwidth: 5,
    paddingheight: 5
  });
};

export async function generateStandarShippingLabelPDF(
  data: ShippingLabelData
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([LABEL_WIDTH, LABEL_HEIGHT]);

  // Main container border
  page.drawRectangle({
    x: MARGIN,
    y: MARGIN,
    width: LABEL_WIDTH - 2 * MARGIN,
    height: LABEL_HEIGHT - 2 * MARGIN,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2
  });

  // Top row - Company logo, Guide number, Order date
  const topRowHeight = 80;
  const topY = LABEL_HEIGHT - MARGIN - topRowHeight;

  // Company section (left)
  page.drawRectangle({
    x: MARGIN,
    y: topY,
    width: 200,
    height: topRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  // Company logo from URL
  const logoResponse = await fetch(
    `${process.env[`${Envs.URL_CDN}`]}/in_house_carrier.png`
  );
  const logoBuffer = await logoResponse.arrayBuffer();
  const logoImage = await pdfDoc.embedPng(logoBuffer);

  page.drawImage(logoImage, {
    x: MARGIN + 10,
    y: topY + 20,
    width: 40,
    height: 40
  });

  // Business name next to logo
  const businessNameLines = dto.splitString(data.businessName, 20);
  businessNameLines.forEach((line, index) => {
    page.drawText(line, {
      x: MARGIN + 60,
      y: topY + 37 - index * 12,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0)
    });
  });

  // Guide number section (center)
  page.drawRectangle({
    x: MARGIN + 200,
    y: topY,
    width: 200,
    height: topRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  page.drawText(`Guía N°: ${data.carrierTrackingCode}`, {
    x: MARGIN + 220,
    y: topY + 40,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Order date section (right)
  page.drawRectangle({
    x: MARGIN + 400,
    y: topY,
    width: LABEL_WIDTH - MARGIN - 400 - MARGIN,
    height: topRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  page.drawText(`Fecha de pedido: ${data.date}`, {
    x: MARGIN + 420,
    y: topY + 40,
    size: 10,
    font,
    color: rgb(0, 0, 0)
  });

  // Middle row - Sender and Recipient info + Barcode
  const middleRowHeight = 120;
  const middleY = topY - middleRowHeight;

  // Sender section (left)
  page.drawRectangle({
    x: MARGIN,
    y: middleY,
    width: 200,
    height: middleRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  page.drawText("Remitente:", {
    x: MARGIN + 10,
    y: middleY + 100,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Nombre: ${data.from.fullName}`, {
    x: MARGIN + 10,
    y: middleY + 85,
    size: 9,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Tel: ${data.from.phone}`, {
    x: MARGIN + 10,
    y: middleY + 70,
    size: 9,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Ciudad: ${data.from.city}`, {
    x: MARGIN + 10,
    y: middleY + 55,
    size: 9,
    font,
    color: rgb(0, 0, 0)
  });

  const fromAddressLines = dto.splitString(data.from.address, 40);
  fromAddressLines.forEach((line, index) => {
    page.drawText(`${index === 0 ? "Dirección: " : ""}${line}`, {
      x: MARGIN + 10,
      y: middleY + 40 - index * 12,
      size: 8,
      font,
      color: rgb(0, 0, 0)
    });
  });

  // Recipient section (center)
  page.drawRectangle({
    x: MARGIN + 200,
    y: middleY,
    width: 200,
    height: middleRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  page.drawText("Destinatario:", {
    x: MARGIN + 210,
    y: middleY + 100,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Nombre: ${data.to.fullName}`, {
    x: MARGIN + 210,
    y: middleY + 85,
    size: 9,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Tel: ${data.to.phone}`, {
    x: MARGIN + 210,
    y: middleY + 70,
    size: 9,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Ciudad: ${data.to.city}`, {
    x: MARGIN + 210,
    y: middleY + 55,
    size: 9,
    font,
    color: rgb(0, 0, 0)
  });

  const toAddressLines = dto.splitString(data.to.address, 40);
  toAddressLines.forEach((line, index) => {
    page.drawText(`${index === 0 ? "Dirección: " : ""}${line}`, {
      x: MARGIN + 210,
      y: middleY + 40 - index * 12,
      size: 8,
      font,
      color: rgb(0, 0, 0)
    });
  });

  // Barcode section (right)
  page.drawRectangle({
    x: MARGIN + 400,
    y: middleY,
    width: LABEL_WIDTH - MARGIN - 400 - MARGIN,
    height: middleRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  const barcodeBuffer = await generateBarcode(data.carrierTrackingCode);
  const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);

  page.drawImage(barcodeImage, {
    x: MARGIN + 420,
    y: middleY + 35,
    width: 150,
    height: 50
  });

  // Bottom row - Products and Cash on Delivery + Signature
  const bottomRowHeight =
    LABEL_HEIGHT - 2 * MARGIN - topRowHeight - middleRowHeight;
  const bottomY = MARGIN;

  // Products section (left)
  page.drawRectangle({
    x: MARGIN,
    y: bottomY,
    width: 400,
    height: bottomRowHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  const labelText = "Contenido / Productos:";
  const labelWidth = fontBold.widthOfTextAtSize(labelText, 10);
  const labelCenteredX = MARGIN + (400 - labelWidth) / 2;

  page.drawText(labelText, {
    x: labelCenteredX,
    y: bottomY + bottomRowHeight - 30,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  const maxChars = 60;
  const displayText =
    data.description.length > maxChars
      ? data.description.substring(0, maxChars) + "..."
      : data.description;
  const sectionWidth = 400;
  const textWidth = font.widthOfTextAtSize(displayText, 10);
  const centeredX = MARGIN + (sectionWidth - textWidth) / 2;

  page.drawText(displayText, {
    x: centeredX,
    y: bottomY + bottomRowHeight / 2,
    size: 10,
    font,
    color: rgb(0, 0, 0)
  });

  // Cash on delivery and signature section (right)
  const rightSectionWidth = LABEL_WIDTH - MARGIN - 400 - MARGIN;
  const halfHeight = bottomRowHeight / 2;

  // Top half - Valor a Cobrar
  page.drawRectangle({
    x: MARGIN + 400,
    y: bottomY + halfHeight,
    width: rightSectionWidth,
    height: halfHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  // Bottom half - Firma
  page.drawRectangle({
    x: MARGIN + 400,
    y: bottomY,
    width: rightSectionWidth,
    height: halfHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  // Valor a Cobrar - centrado horizontal y vertical
  const valorText = "Valor a Cobrar:";
  const valorWidth = fontBold.widthOfTextAtSize(valorText, 10);
  const valorX = MARGIN + 400 + (rightSectionWidth - valorWidth) / 2;

  const amountText = formatCurrency(data.amount);
  const amountWidth = fontBold.widthOfTextAtSize(amountText, 14);
  const amountX = MARGIN + 400 + (rightSectionWidth - amountWidth) / 2;

  page.drawText(valorText, {
    x: valorX,
    y: bottomY + halfHeight + halfHeight / 2 + 10,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(amountText, {
    x: amountX,
    y: bottomY + halfHeight + halfHeight / 2 - 10,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Firma - centrado horizontal y vertical
  const firmaText = "Firma Recibido";
  const firmaWidth = fontBold.widthOfTextAtSize(firmaText, 10);
  const firmaX = MARGIN + 400 + (rightSectionWidth - firmaWidth) / 2;

  page.drawText(firmaText, {
    x: firmaX,
    y: bottomY + 10,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
