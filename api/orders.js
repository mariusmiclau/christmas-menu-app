import { sendJson } from './_adminAuth.js';

const SHEET_ID = '1tNpDNx3LRTXE6nWUIaX1FZ1p8hcLJYodAf9zCSxQtMw';
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-LKCNLy4V590ESImLF0PQ5T0UF7onFsh1kdjHuZTKjf129hjE76LhnYVqNo1KVBKySg/exec';

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  const row = request.body?.row;
  if (!Array.isArray(row) || row.length !== 9
    || ![2, 3].includes(row[1])
    || row.some((value, index) => index !== 1 && (typeof value !== 'string' || value.length > 500))
    || ![0, 3, 6, 7, 8].every((index) => row[index].trim())) {
    return sendJson(response, 400, { error: 'Please check your name and menu selections.' });
  }

  try {
    const upstream = await fetch(process.env.ORDERS_SCRIPT_URL || SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Names are user input: store formula-like strings as text in Sheets.
      body: JSON.stringify({
        sheetId: SHEET_ID,
        sheetName: 'Orders',
        values: [row.map((value) => typeof value === 'string' && /^[=+@-]/.test(value.trimStart()) ? `'${value}` : value)],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!upstream.ok) {
      return sendJson(response, 502, { error: 'Google did not confirm your order. Please contact the organiser before submitting again.' });
    }
    const result = await upstream.json();
    if (result?.status !== 'success') {
      return sendJson(response, 502, { error: 'Google could not save your order. Please contact the organiser.' });
    }
    return sendJson(response, 200, { saved: true });
  } catch {
    // A timeout can occur after an append; never retry automatically.
    return sendJson(response, 502, { error: 'We could not confirm whether your order was saved. Please ask the organiser to check before submitting again.' });
  }
}
