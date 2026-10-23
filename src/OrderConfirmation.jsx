import { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatEventDate } from './menuData';

export default function OrderConfirmation({ confirmation, onNewOrder }) {
  const receiptRef = useRef(null);
  useEffect(() => {
    receiptRef.current?.focus({ preventScroll: true });
    receiptRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, []);

  const price = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }).format(confirmation.price);
  const hasSupplement = confirmation.dishes.some((dish) => /supplement/i.test(dish.description));

  return (
    <section ref={receiptRef} tabIndex={-1} aria-labelledby="order-confirmation-title" className="max-w-3xl mx-auto scroll-mt-6 rounded-2xl bg-white shadow-2xl border border-emerald-200 overflow-hidden focus:outline-none">
      <div className="bg-emerald-50 border-b border-emerald-200 p-6 md:p-8">
        <div className="flex items-center gap-3 text-emerald-800">
          <CheckCircle2 size={30} aria-hidden="true" className="shrink-0" />
          <h2 id="order-confirmation-title" className="text-2xl md:text-3xl font-black">Your order is confirmed</h2>
        </div>
        <p className="mt-3 text-emerald-900 break-words">Thank you, <strong>{confirmation.name}</strong>. Your meal selection has been saved.</p>
      </div>
      <div className="p-6 md:p-8">
        <p className="font-bold text-slate-900 break-words">{confirmation.menuTitle}</p>
        {confirmation.eventDate && <p className="mt-1 text-sm text-slate-500">{formatEventDate(confirmation.eventDate)}</p>}
        <dl className="divide-y divide-slate-200 mt-5">
          {confirmation.dishes.map((dish) => (
            <div key={dish.label} className="py-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-emerald-700">{dish.label}</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900 break-words">{dish.name}</dd>
              {dish.description && <dd className="mt-1 text-sm text-slate-600 break-words">{dish.description}</dd>}
              {dish.preference && <dd className="mt-2 text-sm font-bold text-emerald-800">Cooking preference: {dish.preference}</dd>}
            </div>
          ))}
        </dl>
        <div className="mt-4 rounded-xl bg-slate-950 text-white p-4 flex flex-wrap justify-between items-center gap-3">
          <span className="font-bold">{confirmation.courses} courses · Menu price</span>
          <strong className="text-2xl">{price}</strong>
        </div>
        {hasSupplement && <p className="mt-2 text-sm text-slate-600">Dish supplements listed above are additional to the menu price.</p>}
        <p className="mt-4 text-xs text-slate-500">Submitted: {confirmation.orderDate}</p>
        <p className="mt-5 text-sm text-slate-600">Need to change your selection? Contact the organiser rather than submitting the same order again.</p>
        <button type="button" onClick={onNewOrder} className="mt-5 w-full sm:w-auto px-5 py-3 rounded-xl border border-emerald-700 font-bold text-emerald-800 hover:bg-emerald-50">Place another order</button>
      </div>
    </section>
  );
}
