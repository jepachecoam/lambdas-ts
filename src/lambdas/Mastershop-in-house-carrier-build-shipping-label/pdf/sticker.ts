import bwipjs from "bwip-js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { Envs, ShippingLabelData } from "../types";

// 8cm x 10cm converted to points (1 cm = 28.35 points)
const LABEL_WIDTH = 226.8; // 8cm
const LABEL_HEIGHT = 283.5; // 10cm
const MARGIN = 6;

const formatCurrency = (value: number): string => {
  return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP`;
};

const generateBarcode = async (text: string): Promise<Uint8Array> => {
  return bwipjs.toBuffer({
    bcid: "code128",
    text: text,
    scale: 1.5,
    height: 8,
    includetext: false,
    backgroundcolor: "ffffff",
    paddingwidth: 3,
    paddingheight: 3
  });
};

export async function generateStickerShippingLabelPDF(
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
    borderWidth: 0.5
  });

  const sectionWidth = LABEL_WIDTH - 2 * MARGIN;
  let currentY = LABEL_HEIGHT - MARGIN;

  // Top section - Company logo and Barcode (side by side)
  const topSectionHeight = 40;
  currentY -= topSectionHeight;

  // Company logo section (left half)
  page.drawRectangle({
    x: MARGIN,
    y: currentY,
    width: sectionWidth / 2,
    height: topSectionHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  // Company logo from URL
  const logoResponse = await fetch(
    `${process.env[`${Envs.URL_CDN}`]}/mensajeria_propia_logo.png`
  );
  const logoBuffer = await logoResponse.arrayBuffer();
  const logoImage = await pdfDoc.embedPng(logoBuffer);

  page.drawImage(logoImage, {
    x: MARGIN + 2,
    y: currentY + 6,
    width: 75,
    height: 28
  });

  // Barcode section (right half)
  page.drawRectangle({
    x: MARGIN + sectionWidth / 2,
    y: currentY,
    width: sectionWidth / 2,
    height: topSectionHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  const barcodeBuffer = await generateBarcode(data.carrierTrackingCode);
  const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);

  page.drawImage(barcodeImage, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 8,
    width: 70,
    height: 24
  });

  // Guide number and Date section (side by side)
  const guideDateHeight = 20;
  currentY -= guideDateHeight;

  // Guide number (left half)
  page.drawRectangle({
    x: MARGIN,
    y: currentY,
    width: sectionWidth / 2,
    height: guideDateHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  page.drawText(`Guía N°: ${data.carrierTrackingCode}`, {
    x: MARGIN + 3,
    y: currentY + 6,
    size: 5.5,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Date (right half)
  page.drawRectangle({
    x: MARGIN + sectionWidth / 2,
    y: currentY,
    width: sectionWidth / 2,
    height: guideDateHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  page.drawText(`Fecha de pedido: ${data.date}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 6,
    size: 5.5,
    font,
    color: rgb(0, 0, 0)
  });

  // Sender and Recipient sections (side by side)
  const contactSectionHeight = 65;
  currentY -= contactSectionHeight;

  // Sender section (left half)
  page.drawRectangle({
    x: MARGIN,
    y: currentY,
    width: sectionWidth / 2,
    height: contactSectionHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  page.drawText("Remitente:", {
    x: MARGIN + 3,
    y: currentY + 52,
    size: 5.5,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Nombre: ${data.from.fullName.substring(0, 18)}`, {
    x: MARGIN + 3,
    y: currentY + 42,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Tel: ${data.from.phone || "N/A"}`, {
    x: MARGIN + 3,
    y: currentY + 33,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Ciudad: ${data.from.city.substring(0, 15)}`, {
    x: MARGIN + 3,
    y: currentY + 24,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Dirección: ${data.from.address.substring(0, 18)}`, {
    x: MARGIN + 3,
    y: currentY + 15,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(
    `${data.from.address.length > 18 ? data.from.address.substring(18, 36) : ""}`,
    {
      x: MARGIN + 3,
      y: currentY + 6,
      size: 4.5,
      font,
      color: rgb(0, 0, 0)
    }
  );

  // Recipient section (right half)
  page.drawRectangle({
    x: MARGIN + sectionWidth / 2,
    y: currentY,
    width: sectionWidth / 2,
    height: contactSectionHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  page.drawText("Destinatario:", {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 52,
    size: 5.5,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Nombre: ${data.to.fullName.substring(0, 18)}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 42,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Tel: ${data.to.phone || "N/A"}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 33,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Ciudad: ${data.to.city.substring(0, 15)}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 24,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Dirección: ${data.to.address.substring(0, 18)}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 15,
    size: 4.5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(
    `${data.to.address.length > 18 ? data.to.address.substring(18, 36) : ""}`,
    {
      x: MARGIN + sectionWidth / 2 + 3,
      y: currentY + 6,
      size: 4.5,
      font,
      color: rgb(0, 0, 0)
    }
  );

  // Products section
  const productsSectionHeight = 55;
  currentY -= productsSectionHeight;

  page.drawRectangle({
    x: MARGIN,
    y: currentY,
    width: sectionWidth,
    height: productsSectionHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  page.drawText("Contenido / Productos:", {
    x: MARGIN + 3,
    y: currentY + 32,
    size: 5.5,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Split description into multiple lines if needed
  const maxCharsPerLine = 45;
  const lines = [];
  let remainingText = data.description;

  while (remainingText.length > 0 && lines.length < 3) {
    if (remainingText.length <= maxCharsPerLine) {
      lines.push(remainingText);
      break;
    }
    const cutIndex = remainingText.lastIndexOf(" ", maxCharsPerLine);
    const lineEnd = cutIndex > 0 ? cutIndex : maxCharsPerLine;
    lines.push(remainingText.substring(0, lineEnd));
    remainingText = remainingText.substring(lineEnd).trim();
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: MARGIN + 3,
      y: currentY + 22 - index * 8,
      size: 5,
      font,
      color: rgb(0, 0, 0)
    });
  });

  // Cash on delivery section
  const cashSectionHeight = 30;
  currentY -= cashSectionHeight;

  page.drawRectangle({
    x: MARGIN,
    y: currentY,
    width: sectionWidth,
    height: cashSectionHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  page.drawText("Valor a Cobrar:", {
    x: MARGIN + 3,
    y: currentY + 12,
    size: 5.5,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(formatCurrency(data.amount), {
    x: MARGIN + sectionWidth - 75,
    y: currentY + 10,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Signature section - much larger space
  const signatureSectionHeight = currentY - MARGIN;
  currentY = MARGIN;

  page.drawRectangle({
    x: MARGIN,
    y: currentY,
    width: sectionWidth,
    height: signatureSectionHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5
  });

  page.drawText("Firma Recibido", {
    x: MARGIN + sectionWidth / 2 - 20,
    y: currentY + 8,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
