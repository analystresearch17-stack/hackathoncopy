import { useState, useEffect } from 'react'

function calcParts(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now()
  if (diff <= 0) return null
  const totalSec = Math.floor(diff / 1000)
  const days    = Math.floor(totalSec / 86400)
  const hours   = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  return { days, hours, minutes }
}

export default function Countdown({ targetDate, label, expiredLabel }) {
  const [parts, setParts] = useState(() => calcParts(targetDate))

  useEffect(() => {
    const id = setInterval(() => {
      setParts(calcParts(targetDate))
    }, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return (
    <div className="countdown-wrap">
      <span className="countdown-label">{label}</span>
      {parts ? (
        <>
          <div className="countdown-unit">
            <span className="countdown-num">{String(parts.days).padStart(2, '0')}</span>
            <span className="countdown-seg">days</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-unit">
            <span className="countdown-num">{String(parts.hours).padStart(2, '0')}</span>
            <span className="countdown-seg">hrs</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-unit">
            <span className="countdown-num">{String(parts.minutes).padStart(2, '0')}</span>
            <span className="countdown-seg">min</span>
          </div>
        </>
      ) : (
        <span className="countdown-expired">
          {expiredLabel || 'Event has started'}
        </span>
      )}
    </div>
  )
}
