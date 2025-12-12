import { createCanvas } from "canvas";
import JsBarcode from "jsbarcode";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import { Envs, ShippingLabelData } from "../types";

// 8cm x 10cm converted to points (1 cm = 28.35 points)
const LABEL_WIDTH = 226.8; // 8cm
const LABEL_HEIGHT = 283.5; // 10cm
const MARGIN = 8;

const formatCurrency = (value: number): string => {
  return `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} COP`;
};

const generateBarcode = async (text: string): Promise<Uint8Array> => {
  const canvas = createCanvas(200, 60);
  JsBarcode(canvas, text, {
    format: "CODE128",
    width: 1.5,
    height: 40,
    displayValue: false,
    margin: 3
  });
  return canvas.toBuffer();
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
  const topSectionHeight = 50;
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
    y: currentY + 8,
    width: 90,
    height: 34
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
    y: currentY + 10,
    width: 80,
    height: 30
  });

  // Guide number and Date section (side by side)
  const guideDateHeight = 25;
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
    y: currentY + 8,
    size: 6,
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

  page.drawText(`Fecha: ${data.date}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 8,
    size: 6,
    font,
    color: rgb(0, 0, 0)
  });

  // Sender and Recipient sections (side by side)
  const contactSectionHeight = 80;
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
    y: currentY + 65,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Nombre: ${data.from.fullName.substring(0, 15)}`, {
    x: MARGIN + 3,
    y: currentY + 55,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Tel: ${data.from.phone}`, {
    x: MARGIN + 3,
    y: currentY + 45,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Ciudad: ${data.from.city.substring(0, 12)}`, {
    x: MARGIN + 3,
    y: currentY + 35,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Dir: ${data.from.address.substring(0, 15)}`, {
    x: MARGIN + 3,
    y: currentY + 25,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

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
    y: currentY + 65,
    size: 6,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Nombre: ${data.to.fullName.substring(0, 15)}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 55,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Tel: ${data.to.phone}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 45,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Ciudad: ${data.to.city.substring(0, 12)}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 35,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

  page.drawText(`Dir: ${data.to.address.substring(0, 15)}`, {
    x: MARGIN + sectionWidth / 2 + 3,
    y: currentY + 25,
    size: 5,
    font,
    color: rgb(0, 0, 0)
  });

  // Products section
  const productsSectionHeight = 60;
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
    x: MARGIN + 5,
    y: currentY + 45,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  const maxChars = 30;
  const displayText =
    data.description.length > maxChars
      ? data.description.substring(0, maxChars) + "..."
      : data.description;

  page.drawText(displayText, {
    x: MARGIN + 5,
    y: currentY + 25,
    size: 7,
    font,
    color: rgb(0, 0, 0)
  });

  // Cash on delivery section
  const cashSectionHeight = 35;
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
    x: MARGIN + 5,
    y: currentY + 20,
    size: 7,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  page.drawText(formatCurrency(data.amount), {
    x: MARGIN + sectionWidth - 80,
    y: currentY + 8,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  // Signature section
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
    x: MARGIN + sectionWidth / 2 - 25,
    y: currentY + signatureSectionHeight / 2,
    size: 8,
    font: fontBold,
    color: rgb(0, 0, 0)
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
