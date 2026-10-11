const STEPS = [
  ['PENDING_PAYMENT', 'Booked'],
  ['CONFIRMED', 'Paid'],
  ['APPROVED', 'Approved'],
  ['PICKED_UP', 'Picked up'],
  ['RETURNED', 'Returned'],
];

/** Progress through the rental life cycle. */
export default function BookingSteps({ status }) {
  if (status === 'CANCELLED') return null;
  const current = STEPS.findIndex(([s]) => s === status);
  return (
    <ol className="steps">
      {STEPS.map(([s, label], i) => (
        <li key={s} className={i < current || status === 'RETURNED' ? 'done' : i === current ? 'current' : ''}>
          <span className="dot" />{label}
        </li>
      ))}
    </ol>
  );
}
