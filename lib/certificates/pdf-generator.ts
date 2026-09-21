import { PDFDocument, rgb, StandardFonts, RGB } from "pdf-lib";
import QRCode from "qrcode";
import { getTemplateById, TemplateRecord } from "../templates/default-templates";
import { getTemplateByIdStore } from "../templates/store";

export interface CertificatePdfData {
  certificateId: string;
  recipientName: string;
  courseName: string;
  eventName?: string;
  issueDate: string;
  duration?: string;
  templateId?: string;
  issuerName?: string;
  verificationUrl?: string;
}

function hexToRgb(hexStr?: string, defaultColor: RGB = rgb(0.1, 0.1, 0.1)): RGB {
  if (!hexStr) return defaultColor;
  let clean = hexStr.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16) / 255.0;
    const g = parseInt(clean.substring(2, 4), 16) / 255.0;
    const b = parseInt(clean.substring(4, 6), 16) / 255.0;
    return rgb(
      isNaN(r) ? 0 : r,
      isNaN(g) ? 0 : g,
      isNaN(b) ? 0 : b
    );
  }
  return defaultColor;
}

function interpolate(text: string, context: Record<string, string>): string {
  if (!text) return "";
  return text.replace(/\{\{\s*([a-zA-Z0-9_\-]+)\s*\}\}/g, (match, key) => {
    return context[key] !== undefined ? context[key] : match;
  });
}

export async function generateCertificatePdf(data: CertificatePdfData): Promise<Uint8Array> {
  let template: TemplateRecord | undefined;
  if (data.templateId) {
    template = await getTemplateByIdStore(data.templateId);
  }
  if (!template) {
    template = getTemplateById(data.templateId);
  }
  const design = template.designJson || {
    width: 842,
    height: 595,
    backgroundColor: "#FFFFFF",
    accentColor: "#D4AF37",
    border: { style: "double", color: "#0B192C", width: 2, inset: 20 },
    elements: []
  };

  const pageWidth = design.width || 842;
  const pageHeight = design.height || 595;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Standard fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const verificationUrl = data.verificationUrl || `http://localhost:3000/verify/${data.certificateId}`;

  // 1. Generate Crisp QR Code PNG
  const qrPngBuffer = await QRCode.toBuffer(verificationUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 300,
    color: {
      dark: "#000000",
      light: "#FFFFFF"
    }
  });
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);

  // 2. Draw Background
  const bgColor = hexToRgb(design.backgroundColor, rgb(1, 1, 1));
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: bgColor,
  });

  // 2b. Draw Custom Background Image if present
  if ((design as any).backgroundImage) {
    try {
      const bgData = (design as any).backgroundImage as string;
      let imgBuffer: Uint8Array | null = null;
      let isPng = true;
      if (bgData.startsWith("http://") || bgData.startsWith("https://")) {
        const resp = await fetch(bgData);
        const arrayBuf = await resp.arrayBuffer();
        imgBuffer = new Uint8Array(arrayBuf);
        isPng = bgData.toLowerCase().includes(".png") || bgData.toLowerCase().includes("png");
      } else if (bgData.startsWith("data:image/png;base64,")) {
        const base64Str = bgData.replace(/^data:image\/png;base64,/, "");
        imgBuffer = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
        isPng = true;
      } else if (bgData.startsWith("data:image/jpeg;base64,") || bgData.startsWith("data:image/jpg;base64,")) {
        const base64Str = bgData.replace(/^data:image\/jpe?g;base64,/, "");
        imgBuffer = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
        isPng = false;
      }

      if (imgBuffer) {
        const bgImg = isPng ? await pdfDoc.embedPng(imgBuffer) : await pdfDoc.embedJpg(imgBuffer);
        page.drawImage(bgImg, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }
    } catch (err) {
      console.error("Failed to render background image in PDF:", err);
    }
  }

  // 3. Draw Borders
  const border = design.border;
  if (border && border.style !== "none") {
    const borderColor = hexToRgb(border.color, rgb(0.1, 0.1, 0.2));
    const inset = border.inset || 20;
    const bWidth = border.width || 2;

    if (border.style === "double") {
      // Outer rect
      page.drawRectangle({
        x: inset,
        y: inset,
        width: pageWidth - (2 * inset),
        height: pageHeight - (2 * inset),
        borderColor: borderColor,
        borderWidth: bWidth,
      });

      // Inner accent rect
      const accentColor = hexToRgb(design.accentColor, rgb(0.85, 0.65, 0.15));
      const innerInset = inset + 6;
      page.drawRectangle({
        x: innerInset,
        y: innerInset,
        width: pageWidth - (2 * innerInset),
        height: pageHeight - (2 * innerInset),
        borderColor: accentColor,
        borderWidth: 1,
      });
    } else {
      page.drawRectangle({
        x: inset,
        y: inset,
        width: pageWidth - (2 * inset),
        height: pageHeight - (2 * inset),
        borderColor: borderColor,
        borderWidth: bWidth,
      });
    }
  }

  // Placeholder mapping context
  const context: Record<string, string> = {
    name: data.recipientName,
    recipient_name: data.recipientName,
    course: data.courseName,
    program: data.courseName,
    event: data.eventName || data.courseName,
    date: data.issueDate,
    duration: data.duration || "20 Hours",
    certificate_id: data.certificateId,
    verification_url: verificationUrl,
    issuer: data.issuerName || "Rudvay Tech"
  };

  let hasDrawnQr = false;

  // 4. Render Template Elements
  if (design.elements && design.elements.length > 0) {
    for (const elem of design.elements) {
      if (elem.visibility === false) continue;

      // Coordinate mapping: canvas (0,0) top-left -> PDF (0,0) bottom-left
      const elemX = elem.x;
      const elemY = pageHeight - elem.y - elem.height;
      const opacity = elem.opacity !== undefined ? elem.opacity : 1;

      if (elem.type === "TEXT") {
        const textContent = interpolate(elem.content || "", context);
        if (!textContent) continue;

        const textColor = hexToRgb(elem.textColor, rgb(0.1, 0.1, 0.1));
        const fontSize = elem.fontSize || 14;

        let font = fontHelvetica;
        if (elem.fontWeight === "bold" || (elem.fontFamily && elem.fontFamily.toLowerCase().includes("bold"))) {
          font = fontHelveticaBold;
        } else if (elem.fontWeight === "italic") {
          font = fontHelveticaOblique;
        }
        if (elem.fontFamily && (elem.fontFamily.toLowerCase().includes("times") || elem.fontFamily.toLowerCase().includes("serif"))) {
          font = fontTimesBold;
        }

        const textWidth = font.widthOfTextAtSize(textContent, fontSize);
        let drawX = elemX;
        if (elem.alignment === "center") {
          drawX = elemX + ((elem.width - textWidth) / 2);
        } else if (elem.alignment === "right") {
          drawX = elemX + elem.width - textWidth;
        }

        // Align vertically within element box
        const drawY = elemY + ((elem.height - fontSize) / 2) + 2;

        page.drawText(textContent, {
          x: Math.max(0, drawX),
          y: Math.max(0, drawY),
          size: fontSize,
          font: font,
          color: textColor,
          opacity: opacity,
        });
      } else if (elem.type === "LINE") {
        const strokeColor = hexToRgb(elem.textColor || design.accentColor, rgb(0.85, 0.65, 0.15));
        const lineWidth = elem.strokeWidth || 2;
        const midY = elemY + (elem.height / 2);

        page.drawLine({
          start: { x: elemX, y: midY },
          end: { x: elemX + elem.width, y: midY },
          thickness: lineWidth,
          color: strokeColor,
          opacity: opacity,
        });
      } else if (elem.type === "RECTANGLE") {
        const fillColor = elem.textColor ? hexToRgb(elem.textColor) : undefined;
        page.drawRectangle({
          x: elemX,
          y: elemY,
          width: elem.width,
          height: elem.height,
          color: fillColor,
          opacity: opacity,
        });
      } else if (elem.type === "QR") {
        page.drawImage(qrImage, {
          x: elemX,
          y: elemY,
          width: elem.width,
          height: elem.height,
          opacity: opacity,
        });
        hasDrawnQr = true;
      } else if ((elem as any).type === "IMAGE" && elem.content) {
        try {
          const imgData = elem.content;
          let imgBuffer: Uint8Array | null = null;
          let isPng = true;
          if (imgData.startsWith("http://") || imgData.startsWith("https://")) {
            const resp = await fetch(imgData);
            const arrayBuf = await resp.arrayBuffer();
            imgBuffer = new Uint8Array(arrayBuf);
            isPng = imgData.toLowerCase().includes(".png") || imgData.toLowerCase().includes("png");
          } else if (imgData.startsWith("data:image/png;base64,")) {
            const base64Str = imgData.replace(/^data:image\/png;base64,/, "");
            imgBuffer = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
            isPng = true;
          } else if (imgData.startsWith("data:image/jpeg;base64,") || imgData.startsWith("data:image/jpg;base64,")) {
            const base64Str = imgData.replace(/^data:image\/jpe?g;base64,/, "");
            imgBuffer = Uint8Array.from(atob(base64Str), c => c.charCodeAt(0));
            isPng = false;
          }
          if (imgBuffer) {
            const elemImg = isPng ? await pdfDoc.embedPng(imgBuffer) : await pdfDoc.embedJpg(imgBuffer);
            page.drawImage(elemImg, {
              x: elemX,
              y: elemY,
              width: elem.width,
              height: elem.height,
              opacity: opacity,
            });
          }
        } catch (err) {
          console.error("Failed to render element image in PDF:", err);
        }
      }
    }
  }

  // Fallback: If template didn't have a dedicated QR element, draw a professional QR code badge
  if (!hasDrawnQr) {
    const qrSize = 85;
    const qrX = pageWidth - 120;
    const qrY = 50;

    page.drawRectangle({
      x: qrX - 4,
      y: qrY - 4,
      width: qrSize + 8,
      height: qrSize + 8,
      color: rgb(1, 1, 1),
      borderColor: hexToRgb(design.accentColor, rgb(0.2, 0.7, 0.9)),
      borderWidth: 1,
    });

    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrSize,
      height: qrSize,
    });

    const qrLabel = "SCAN TO VERIFY";
    const qrLabelWidth = fontHelveticaBold.widthOfTextAtSize(qrLabel, 7);
    page.drawText(qrLabel, {
      x: qrX + ((qrSize - qrLabelWidth) / 2),
      y: qrY - 12,
      size: 7,
      font: fontHelveticaBold,
      color: hexToRgb(design.accentColor, rgb(0.2, 0.7, 0.9)),
    });
  }

  return await pdfDoc.save();
}
