"use client";

import { jsPDF } from "jspdf";

interface PickupReceiptPayload {
  receiptId: string;
  ngoName: string;
  restaurantName: string;
  pickupTime: Date | null;
  donation: {
    foodName: string;
    quantity: string;
    address: string;
    description: string;
  };
}

function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return value.toLocaleDateString();
}

function formatTime(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizeForFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to encode QR image."));
      }
    };
    reader.onerror = () => reject(new Error("Unable to read QR image."));
    reader.readAsDataURL(blob);
  });
}

async function createQrCodeDataUrl(receiptId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        receiptId,
      )}`,
    );

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

function drawLogo(document: jsPDF, x: number, y: number): void {
  document.setFillColor(14, 165, 233);
  document.roundedRect(x, y, 28, 28, 6, 6, "F");
  document.setFont("helvetica", "bold");
  document.setFontSize(12);
  document.setTextColor(255, 255, 255);
  document.text("FB", x + 6.8, y + 18.2);
}

function drawInfoPair(
  document: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
): void {
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(107, 114, 128);
  document.text(label, x, y);

  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.setTextColor(17, 24, 39);
  document.text(value, x, y + 14);
}

export async function downloadPickupReceiptPdf(payload: PickupReceiptPayload): Promise<void> {
  const document = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const padding = 40;
  const contentWidth = pageWidth - padding * 2;
  let y = padding;

  document.setTextColor(17, 24, 39);
  drawLogo(document, padding, y);

  document.setFont("helvetica", "bold");
  document.setFontSize(17);
  document.text("FoodBridge", padding + 38, y + 13);
  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(107, 114, 128);
  document.text("Sustainable Food Redistribution Platform", padding + 38, y + 27);

  document.setFont("helvetica", "bold");
  document.setFontSize(18);
  document.setTextColor(17, 24, 39);
  document.text("FOOD DONATION PICKUP RECEIPT", pageWidth / 2, y + 52, {
    align: "center",
  });

  y += 74;

  drawInfoPair(document, "FoodBridge", "Sustainable Food Redistribution Platform", padding, y);
  drawInfoPair(document, "Receipt ID", payload.receiptId, pageWidth - padding - 180, y);

  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(107, 114, 128);
  document.text("Generated Date", pageWidth - padding - 180, y + 30);
  document.setFont("helvetica", "normal");
  document.setFontSize(11);
  document.setTextColor(17, 24, 39);
  document.text(new Date().toLocaleString(), pageWidth - padding - 180, y + 44);

  y += 60;
  document.setDrawColor(229, 231, 235);
  document.setLineWidth(1);
  document.line(padding, y, pageWidth - padding, y);

  y += 22;
  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.setTextColor(17, 24, 39);
  document.text("Pickup Parties", padding, y);

  y += 10;
  const partiesCardY = y;
  const partiesCardHeight = 86;
  document.setFillColor(249, 250, 251);
  document.setDrawColor(229, 231, 235);
  document.roundedRect(padding, partiesCardY, contentWidth, partiesCardHeight, 8, 8, "FD");

  const leftColumnX = padding + 16;
  const rightColumnX = padding + contentWidth / 2 + 10;

  drawInfoPair(document, "NGO Name", payload.ngoName, leftColumnX, partiesCardY + 22);
  drawInfoPair(
    document,
    "Restaurant Name",
    payload.restaurantName,
    leftColumnX,
    partiesCardY + 52,
  );

  drawInfoPair(document, "Pickup Date", formatDate(payload.pickupTime), rightColumnX, partiesCardY + 22);
  drawInfoPair(document, "Pickup Time", formatTime(payload.pickupTime), rightColumnX, partiesCardY + 52);

  y = partiesCardY + partiesCardHeight + 20;

  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.setTextColor(107, 114, 128);
  document.text("Pickup Status", padding, y);
  document.setFillColor(220, 252, 231);
  document.setDrawColor(187, 247, 208);
  document.roundedRect(padding + 82, y - 11, 76, 18, 6, 6, "FD");
  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(22, 101, 52);
  document.text("Completed", padding + 92, y + 1);

  y += 28;
  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.setTextColor(17, 24, 39);
  document.text("Donation Details", padding, y);

  y += 10;
  const tableX = padding;
  const tableWidth = contentWidth;
  const keyColumnWidth = 150;

  const detailRows = [
    { key: "Food Name", value: payload.donation.foodName },
    { key: "Quantity", value: payload.donation.quantity },
    { key: "Pickup Address", value: payload.donation.address },
    { key: "Description", value: payload.donation.description },
  ];

  for (const row of detailRows) {
    const valueLines = document.splitTextToSize(row.value || "-", tableWidth - keyColumnWidth - 24);
    const rowHeight = Math.max(30, valueLines.length * 12 + 12);

    document.setFillColor(255, 255, 255);
    document.setDrawColor(229, 231, 235);
    document.rect(tableX, y, tableWidth, rowHeight, "FD");
    document.line(tableX + keyColumnWidth, y, tableX + keyColumnWidth, y + rowHeight);

    document.setFont("helvetica", "bold");
    document.setFontSize(10.5);
    document.setTextColor(17, 24, 39);
    document.text(row.key, tableX + 10, y + 19);

    document.setFont("helvetica", "normal");
    document.setFontSize(10.5);
    document.setTextColor(17, 24, 39);
    document.text(valueLines, tableX + keyColumnWidth + 10, y + 19);

    y += rowHeight;
  }

  y += 18;
  document.setFillColor(249, 250, 251);
  document.setDrawColor(229, 231, 235);
  const statementHeight = 56;
  document.roundedRect(padding, y, contentWidth, statementHeight, 8, 8, "FD");
  document.setFont("helvetica", "normal");
  document.setFontSize(10.5);
  document.setTextColor(107, 114, 128);
  const statementLines = document.splitTextToSize(
    "This document certifies that the food donation was successfully collected by the NGO partner through the FoodBridge platform.",
    contentWidth - 24,
  );
  document.text(statementLines, padding + 12, y + 22);

  y += statementHeight + 24;
  document.setFont("helvetica", "bold");
  document.setFontSize(11);
  document.setTextColor(17, 24, 39);
  document.text("Authorized Signatures", padding, y);

  y += 28;
  const signatureLineWidth = 180;
  document.setDrawColor(107, 114, 128);
  document.setLineWidth(0.8);
  document.line(padding, y, padding + signatureLineWidth, y);
  document.line(
    pageWidth - padding - signatureLineWidth,
    y,
    pageWidth - padding,
    y,
  );

  document.setFont("helvetica", "normal");
  document.setFontSize(10);
  document.setTextColor(107, 114, 128);
  document.text("Restaurant Signature", padding, y + 14);
  document.text("NGO Signature", pageWidth - padding - signatureLineWidth, y + 14);

  const qrSize = 82;
  const qrX = pageWidth - padding - qrSize;
  const qrY = pageHeight - padding - qrSize - 24;
  const qrDataUrl = await createQrCodeDataUrl(payload.receiptId);

  if (qrDataUrl) {
    document.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    document.setFont("helvetica", "normal");
    document.setFontSize(8.5);
    document.setTextColor(107, 114, 128);
    document.text("Scan for Receipt ID", qrX, qrY + qrSize + 11);
  } else {
    document.setDrawColor(229, 231, 235);
    document.rect(qrX, qrY, qrSize, qrSize);
    document.setFont("helvetica", "bold");
    document.setFontSize(8);
    document.setTextColor(107, 114, 128);
    document.text("QR", qrX + 32, qrY + 42);
    document.setFont("helvetica", "normal");
    document.text("ID: " + payload.receiptId.slice(0, 12), qrX - 8, qrY + qrSize + 11);
  }

  document.setFont("helvetica", "normal");
  document.setFontSize(9.5);
  document.setTextColor(107, 114, 128);
  document.text("Generated by FoodBridge Platform", padding, pageHeight - padding + 8);

  const safeId = sanitizeForFileName(payload.receiptId);
  document.save(`foodbridge-pickup-receipt-${safeId}.pdf`);
}
