// A single-page PDF embedding the rendered ticket, preserving its exact layout.
export function buildImagePdf(jpeg, width, height) {
  const encoder = new TextEncoder();
  const parts = [],
    offsets = [0];
  let length = 0;
  const append = (value) => {
    const bytes = typeof value === "string" ? encoder.encode(value) : value;
    parts.push(bytes);
    length += bytes.length;
  };
  const pageWidth = 330,
    pageHeight = (pageWidth * height) / width;
  const object = (id, body) => {
    offsets[id] = length;
    append(`${id} 0 obj\n${body}\nendobj\n`);
  };
  append("%PDF-1.4\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  object(
    3,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight.toFixed(2)}] /Resources << /XObject << /Ticket 4 0 R >> >> /Contents 5 0 R >>`,
  );
  offsets[4] = length;
  append(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  );
  append(jpeg);
  append("\nendstream\nendobj\n");
  const content = `q\n${pageWidth} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Ticket Do\nQ\n`;
  object(
    5,
    `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}endstream`,
  );
  const xref = length;
  append("xref\n0 6\n0000000000 65535 f \n");
  for (let id = 1; id <= 5; id++)
    append(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  append(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: "application/pdf" });
}

export async function ticketPdf(png) {
  const url = URL.createObjectURL(png);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const jpeg = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PDF export failed")),
        "image/jpeg",
        0.96,
      ),
    );
    return buildImagePdf(
      new Uint8Array(await jpeg.arrayBuffer()),
      canvas.width,
      canvas.height,
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
