import { useState, useEffect } from 'react';

export default function Countdown({ targetDate, expiredLabel }) {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    const calc = () => setDiff(new Date(targetDate) - new Date());
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (diff <= 0) {
    return (
      <div className="countdown-container">
        <span className="countdown-expired">{expiredLabel || 'Ended'}</span>
      </div>
    );
  }

  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs  = Math.floor((diff % (1000 * 60)) / 1000);

  const units = days > 0
    ? [{ value: days, label: 'Days' }, { value: hours, label: 'Hrs' }, { value: mins, label: 'Min' }]
    : [{ value: hours, label: 'Hrs' }, { value: mins, label: 'Min' }, { value: secs, label: 'Sec' }];

  return (
    <div className="countdown-container">
      {units.map(u => (
        <div key={u.label} className="countdown-unit">
          <span className="countdown-number">{String(u.value).padStart(2, '0')}</span>
          <span className="countdown-label-unit">{u.label}</span>
        </div>
      ))}
    </div>
  );
}
