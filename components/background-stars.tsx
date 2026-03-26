"use client";

const STARS = [
  { top: "8%", left: "14%", size: 2, delay: "0.3s", duration: "3.8s" },
  { top: "16%", left: "38%", size: 1.5, delay: "1.1s", duration: "4.6s" },
  { top: "12%", left: "71%", size: 2.5, delay: "0.8s", duration: "5.1s" },
  { top: "23%", left: "84%", size: 1.5, delay: "1.9s", duration: "4.2s" },
  { top: "31%", left: "27%", size: 2, delay: "2.4s", duration: "4.9s" },
  { top: "44%", left: "52%", size: 1.5, delay: "0.6s", duration: "5.4s" },
  { top: "55%", left: "12%", size: 2.5, delay: "1.7s", duration: "4.4s" },
  { top: "61%", left: "74%", size: 2, delay: "2.1s", duration: "5.7s" },
  { top: "73%", left: "41%", size: 1.5, delay: "0.9s", duration: "4.8s" },
  { top: "82%", left: "89%", size: 2, delay: "2.8s", duration: "4.1s" },
  { top: "88%", left: "22%", size: 2.5, delay: "1.4s", duration: "5.2s" },
];

const METEORS = [
  { top: "14%", left: "68%", delay: "0.8s", duration: "6.8s" },
  { top: "29%", left: "83%", delay: "3.2s", duration: "7.4s" },
  { top: "71%", left: "24%", delay: "5.3s", duration: "7.1s" },
];

export function BackgroundStars() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_28%),linear-gradient(180deg,#09111d_0%,#0d1524_100%)]" />

      {STARS.map((star, index) => (
        <span
          key={`star-${index}`}
          className="absolute rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.35)] animate-[star-pulse_var(--star-duration)_ease-in-out_infinite]"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
            ["--star-duration" as string]: star.duration,
          }}
        />
      ))}

      {METEORS.map((meteor, index) => (
        <span
          key={`meteor-${index}`}
          className="shooting-star"
          style={{
            top: meteor.top,
            left: meteor.left,
            animationDelay: meteor.delay,
            animationDuration: meteor.duration,
          }}
        />
      ))}
    </div>
  );
}
