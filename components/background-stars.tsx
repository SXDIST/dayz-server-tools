"use client";

const ambientStars = [
  { left: "4%", top: "8%", size: 1.4, delay: "0s", duration: "4.4s" },
  { left: "9%", top: "28%", size: 1.8, delay: "1.2s", duration: "6.1s" },
  { left: "14%", top: "62%", size: 1.2, delay: "0.6s", duration: "5.7s" },
  { left: "18%", top: "14%", size: 2.6, delay: "2.1s", duration: "7.2s" },
  { left: "22%", top: "44%", size: 1.6, delay: "1.8s", duration: "4.8s" },
  { left: "27%", top: "82%", size: 2.2, delay: "0.4s", duration: "6.8s" },
  { left: "31%", top: "21%", size: 1.1, delay: "1.1s", duration: "5.5s" },
  { left: "35%", top: "55%", size: 1.9, delay: "2.6s", duration: "6.4s" },
  { left: "39%", top: "9%", size: 1.3, delay: "0.9s", duration: "4.9s" },
  { left: "42%", top: "72%", size: 2.4, delay: "1.5s", duration: "7.1s" },
  { left: "47%", top: "35%", size: 1.5, delay: "0.2s", duration: "5.8s" },
  { left: "51%", top: "18%", size: 2.1, delay: "2.3s", duration: "6.5s" },
  { left: "55%", top: "58%", size: 1.2, delay: "1.7s", duration: "4.6s" },
  { left: "59%", top: "84%", size: 2.8, delay: "0.7s", duration: "7.4s" },
  { left: "63%", top: "12%", size: 1.4, delay: "2.7s", duration: "5.1s" },
  { left: "67%", top: "41%", size: 1.7, delay: "0.5s", duration: "6.2s" },
  { left: "71%", top: "76%", size: 2.3, delay: "1.4s", duration: "6.9s" },
  { left: "76%", top: "24%", size: 1.3, delay: "2s", duration: "5.3s" },
  { left: "81%", top: "50%", size: 2, delay: "0.8s", duration: "6.6s" },
  { left: "86%", top: "16%", size: 1.1, delay: "1.9s", duration: "4.7s" },
  { left: "90%", top: "67%", size: 2.5, delay: "0.3s", duration: "7.3s" },
  { left: "95%", top: "30%", size: 1.6, delay: "2.4s", duration: "5.9s" },
];

const meteors = [
  { top: "0%", right: "40px", delay: "0s", duration: "3.2s" },
  { top: "0%", right: "320px", delay: "3.8s", duration: "4.1s" },
  { top: "120px", right: "0px", delay: "7.4s", duration: "3.6s" },
  { top: "0%", right: "760px", delay: "11.9s", duration: "4.4s" },
];

export function BackgroundStars() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {ambientStars.map((star) => (
        <span
          key={`${star.left}-${star.top}`}
          className="absolute rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.55)] animate-[star-pulse_var(--duration)_ease-in-out_infinite]"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
            ["--duration" as string]: star.duration,
          }}
        />
      ))}

      {meteors.map((meteor, index) => (
        <span
          key={`${meteor.top}-${meteor.right}-${index}`}
          className="shooting-star absolute"
          style={{
            top: meteor.top,
            right: meteor.right,
            animationDelay: meteor.delay,
            ["--duration" as string]: meteor.duration,
          }}
        />
      ))}
    </div>
  );
}
