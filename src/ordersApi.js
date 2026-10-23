export async function saveOrder(row) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ row }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.saved !== true) {
    throw new Error(result?.error || 'Your order was not confirmed. Please contact the organiser before submitting again.');
  }
}
