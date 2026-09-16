import { jsPDF } from "jspdf";
export function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}
export function displayDate(value) {
  const date = parseDate(value);
  return date
    ? new Intl.DateTimeFormat("en-CA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date)
    : "";
}
export function displayMonth(value) {
  const date = parseDate(`${value}-01`);
  return date
    ? new Intl.DateTimeFormat("en-CA", {
        month: "long",
        year: "numeric",
      }).format(date)
    : "";
}
export function validateRecord(record, now = new Date()) {
  const errors = {};
  if (!record.name.trim() || record.name.length > 100)
    errors.name = "Enter your name (up to 100 characters).";
  if (!record.confirmed)
    errors.confirmed =
      "Confirm you received Abrysvo during this pregnancy before saving.";
  const date = parseDate(record.date);
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );
  if (
    !record.unsure &&
    (!date || date > endOfToday || date.getFullYear() < 2023)
  )
    errors.date =
      "Enter a valid vaccination date from 2023 to today, or select unsure.";
  const delivery = parseDate(`${record.delivery}-01`);
  if (
    !delivery ||
    delivery.getFullYear() < 2023 ||
    delivery.getFullYear() > 2100
  )
    errors.delivery = "Choose the expected delivery month and year.";
  if (record.location.length > 140)
    errors.location = "Use up to 140 characters for the location.";
  return errors;
}
// Browser canvas supports international names using device fonts. PNG and PDF
// use identical artwork, with no remote PDF service or stored form data.
export function createRecordCanvas(record) {
  if (Object.keys(validateRecord(record)).length)
    throw new Error("Incomplete record");
  const canvas = document.createElement("canvas");
  canvas.width = 1440;
  canvas.height = 2400;
  const ctx = canvas.getContext("2d");
  ctx.scale(2, 2);
  const width = 720,
    margin = 48;
  const font = (size, weight = 400) => {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
  };
  const text = (value, x, top, size = 16, colour = "#193f3b", weight = 400) => {
    font(size, weight);
    ctx.fillStyle = colour;
    ctx.fillText(value, x, top);
  };
  const wrap = (value, top, size, colour, weight = 400, maxWidth = 624) => {
    font(size, weight);
    let line = "",
      baseline = top;
    for (const word of value.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) {
        text(line, margin, baseline, size, colour, weight);
        baseline += size * 1.4;
        line = "";
      }
      for (const char of word) {
        if (ctx.measureText(line + char).width > maxWidth) {
          text(line, margin, baseline, size, colour, weight);
          baseline += size * 1.4;
          line = "";
        }
        line += char;
      }
    }
    if (line) text(line, margin, baseline, size, colour, weight);
    return baseline + size * 1.4;
  };
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, 1200);
  ctx.fillStyle = "#eaf4ef";
  ctx.fillRect(0, 0, width, 225);
  text("MY RSV VACCINE RECORD", margin, 48, 13, "#30665d", 700);
  text("Maternal RSV", margin, 105, 35, "#193f3b", 700);
  text("vaccination record", margin, 150, 35, "#193f3b", 700);
  text(
    "PATIENT-ENTERED RECORD · NOT INDEPENDENTLY VERIFIED",
    margin,
    195,
    12,
    "#30665d",
    700,
  );
  text("PATIENT NAME", margin, 266, 12, "#627772", 700);
  let y = wrap(record.name.trim(), 303, 27, "#193f3b", 700) + 28;
  text("VACCINATION DATE", margin, y, 12, "#627772", 700);
  y = wrap(
    record.unsure ? "Date unsure" : displayDate(record.date),
    y + 40,
    30,
    "#193f3b",
    700,
  );
  text("Abrysvo (RSVpreF) · received during this pregnancy", margin, y + 9, 17);
  y += 55;
  if (record.unsure)
    y =
      wrap(
        "Exact date needs clarification with the vaccination provider.",
        y,
        14,
        "#627772",
      ) + 18;
  text("EXPECTED DELIVERY", margin, y, 12, "#627772", 700);
  y = wrap(displayMonth(record.delivery), y + 30, 20, "#193f3b", 600) + 27;
  text("VACCINATION LOCATION", margin, y, 12, "#627772", 700);
  y =
    wrap(record.location.trim() || "Not provided", y + 30, 20, "#193f3b", 600) +
    28;
  ctx.strokeStyle = "#dce8e1";
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  y =
    wrap(
      "Entered by the patient. Not proof of vaccination or a treatment recommendation. Your care team will review this alongside your vaccination history.",
      y + 30,
      15,
      "#627772",
    ) + 20;
  text("My RSV vaccine record", margin, y, 12, "#627772");
  text("Personal copy", width - margin - 83, y, 12, "#627772");
  const trimmed = document.createElement("canvas");
  trimmed.width = canvas.width;
  trimmed.height = Math.ceil((y + 40) * 2);
  trimmed.getContext("2d").drawImage(canvas, 0, 0);
  return trimmed;
}
export async function downloadRecord(record, format) {
  const canvas = createRecordCanvas(record);
  let blob;
  if (format === "pdf") {
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const ratio = canvas.height / canvas.width,
      width = Math.min(180, 267 / ratio);
    pdf.addImage(canvas, "PNG", (210 - width) / 2, 15, width, width * ratio);
    pdf.setProperties({
      title: "Maternal RSV vaccination record",
      subject: "Patient-entered personal record",
      creator: "My RSV vaccine record",
    });
    blob = pdf.output("blob");
  } else {
    blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("Image generation failed")),
        "image/png",
      ),
    );
  }
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `my-rsv-vaccine-record.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
