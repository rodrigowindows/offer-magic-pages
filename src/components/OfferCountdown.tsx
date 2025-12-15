import { useState, useEffect } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface OfferCountdownProps {
  expirationDays?: number;
}

const OfferCountdown = ({ expirationDays = 7 }: OfferCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: expirationDays,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set expiration to midnight X days from now
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expirationDays);
    expirationDate.setHours(23, 59, 59, 999);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = expirationDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expirationDays]);

  const isUrgent = timeLeft.days <= 2;

  return (
    <div className={`rounded-xl p-4 border-2 ${isUrgent ? 'bg-destructive/10 border-destructive/30' : 'bg-warning/10 border-warning/30'}`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        {isUrgent ? (
          <AlertTriangle className="w-5 h-5 text-destructive" />
        ) : (
          <Clock className="w-5 h-5 text-warning" />
        )}
        <span className={`font-semibold ${isUrgent ? 'text-destructive' : 'text-warning'}`}>
          {isUrgent ? 'Offer Expiring Soon!' : 'Limited Time Offer'}
        </span>
      </div>
      
      <div className="flex justify-center gap-3">
        {[
          { value: timeLeft.days, label: 'Days' },
          { value: timeLeft.hours, label: 'Hrs' },
          { value: timeLeft.minutes, label: 'Min' },
          { value: timeLeft.seconds, label: 'Sec' }
        ].map((unit, index) => (
          <div key={index} className="text-center">
            <div className={`text-2xl md:text-3xl font-bold ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-xs text-muted-foreground uppercase">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OfferCountdown;
