import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const STARS = [
  [72, 76, 2.2], [126, 48, 1.5], [184, 91, 1.8], [236, 55, 1.2],
  [304, 88, 2], [365, 42, 1.4], [421, 104, 1.8], [482, 58, 1.3],
  [536, 98, 2.1], [592, 49, 1.5], [642, 80, 1.9], [686, 44, 1.2],
];

function Reindeer({ x }) {
  return (
    <g className="scene-reindeer" transform={`translate(${x} 0)`}>
      <ellipse cx="0" cy="0" rx="30" ry="15" fill="#29160f" />
      <path d="M20 -7 L37 -27 L49 -25 L41 -10" fill="#29160f" />
      <circle cx="48" cy="-28" r="11" fill="#3c2117" />
      <circle cx="55" cy="-31" r="2.5" fill="#f7d774" />
      <path d="M43 -39 L38 -52 M43 -39 L51 -51 M38 -49 L32 -55 M50 -48 L57 -55" fill="none" stroke="#d7b27c" strokeWidth="3" strokeLinecap="round" />
      <path d="M-19 10 L-24 35 M7 11 L13 35 M-24 35 L-31 40 M13 35 L20 40" fill="none" stroke="#29160f" strokeWidth="5" strokeLinecap="round" />
      <path d="M-28 -1 L-41 -13" fill="none" stroke="#29160f" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

function Snowman() {
  return (
    <g className="scene-snowman" transform="translate(600 302)">
      <circle cx="0" cy="45" r="34" fill="#f8fafc" />
      <circle cx="0" cy="-2" r="25" fill="#fff" />
      <path d="M-24 -23 H24 L17 -36 H-17 Z" fill="#172033" />
      <rect x="-17" y="-52" width="34" height="21" rx="3" fill="#172033" />
      <circle cx="-8" cy="-7" r="2.8" fill="#172033" />
      <circle cx="8" cy="-7" r="2.8" fill="#172033" />
      <path d="M0 -1 L19 4 L0 8 Z" fill="#ea7b2b" />
      <path d="M-9 12 Q0 17 10 11" fill="none" stroke="#172033" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="0" cy="35" r="3" fill="#172033" />
      <circle cx="0" cy="49" r="3" fill="#172033" />
      <path d="M-29 24 L-54 4 M29 24 L51 1" fill="none" stroke="#6b3f24" strokeWidth="4" strokeLinecap="round" />
      <path d="M-20 15 Q0 24 21 14" fill="none" stroke="#b42338" strokeWidth="7" strokeLinecap="round" />
    </g>
  );
}

function SleighFlight() {
  return (
    <g className="sleigh-flight" transform="translate(-250 165)">
      <path d="M-7 -5 H105" stroke="#d9b26f" strokeWidth="2" opacity="0.8" />
      <Reindeer x="-88" />
      <Reindeer x="-170" />
      <g transform="translate(85 -7)">
        <path d="M0 8 H104 Q122 8 128 -7 Q129 29 104 31 H21 Q7 30 0 8 Z" fill="#a91f35" />
        <path d="M15 34 Q69 53 126 27" fill="none" stroke="#e8c27c" strokeWidth="5" strokeLinecap="round" />
        <path d="M30 13 Q35 -29 65 -32 Q87 -32 96 8" fill="#c32942" />
        <circle cx="61" cy="-43" r="14" fill="#f1c3a2" />
        <path d="M46 -52 Q66 -74 84 -48 L73 -45 Q59 -57 46 -52 Z" fill="#c32942" />
        <circle cx="85" cy="-49" r="5" fill="#fff" />
        <path d="M49 -35 Q62 -19 76 -35" fill="#fff" />
      </g>
    </g>
  );
}

export default function FestiveScene({ title, eventDate, clientMode }) {
  const sceneRef = useRef(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-kicker', { y: 18, opacity: 0, duration: 0.65 })
        .from('.hero-title', { y: 34, opacity: 0, duration: 0.9 }, '-=0.35')
        .from('.hero-date, .hero-client-note', { y: 18, opacity: 0, duration: 0.65, stagger: 0.12 }, '-=0.5')
        .from('.cinema-shell', { x: 42, scale: 0.92, opacity: 0, duration: 1.1 }, '-=0.9');

      gsap.fromTo('.sleigh-flight',
        { x: -180, y: 50, rotate: -2 },
        { x: 1080, y: -52, rotate: 2, duration: 13, repeat: -1, repeatDelay: 3, ease: 'none' });

      gsap.to('.scene-reindeer', {
        y: -7,
        rotate: -2,
        duration: 0.55,
        repeat: -1,
        yoyo: true,
        stagger: 0.1,
        ease: 'sine.inOut',
      });

      gsap.to('.scene-snowman', {
        rotate: 2.5,
        y: -5,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        transformOrigin: '50% 100%',
        ease: 'sine.inOut',
      });

      gsap.to('.scene-star', {
        opacity: 0.18,
        duration: 1.25,
        repeat: -1,
        yoyo: true,
        stagger: { each: 0.16, from: 'center' },
        ease: 'sine.inOut',
      });

      gsap.to('.cabin-window', {
        opacity: 0.62,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.fromTo('.cinema-frame',
        { scale: 0.86, opacity: 0.5 },
        {
          scale: 1,
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sceneRef.current,
            start: 'top 92%',
            end: 'top 38%',
            scrub: 1,
          },
        });

      gsap.to('.forest-back', {
        xPercent: -4,
        ease: 'none',
        scrollTrigger: {
          trigger: sceneRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      gsap.to('.forest-front', {
        xPercent: -8,
        ease: 'none',
        scrollTrigger: {
          trigger: sceneRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });
    });

    return () => media.revert();
  }, { scope: sceneRef });

  return (
    <header ref={sceneRef} className="hero-stage">
      <div className="hero-copy">
        <p className="hero-kicker">Festive dining</p>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-date">{eventDate}</p>
        {clientMode && <p className="hero-client-note">A private menu prepared for your celebration</p>}
      </div>

      <div className="cinema-shell" data-testid="festive-cinema" aria-hidden="true">
        <div className="cinema-frame">
          <svg viewBox="0 0 720 420" role="presentation">
            <defs>
              <linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#08152b" />
                <stop offset="0.58" stopColor="#18334a" />
                <stop offset="1" stopColor="#486064" />
              </linearGradient>
              <radialGradient id="moon-glow">
                <stop offset="0" stopColor="#fff9d9" stopOpacity="0.95" />
                <stop offset="0.38" stopColor="#f4d997" stopOpacity="0.26" />
                <stop offset="1" stopColor="#f4d997" stopOpacity="0" />
              </radialGradient>
              <filter id="soft-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
              <clipPath id="scene-clip">
                <rect width="720" height="420" rx="34" />
              </clipPath>
            </defs>

            <g clipPath="url(#scene-clip)">
              <rect width="720" height="420" fill="url(#night-sky)" />
              <circle className="moon-halo" cx="575" cy="92" r="92" fill="url(#moon-glow)" filter="url(#soft-glow)" />
              <circle cx="575" cy="92" r="39" fill="#fff4c6" />

              {STARS.map(([cx, cy, radius], index) => (
                <circle className="scene-star" key={`${cx}-${cy}`} cx={cx} cy={cy} r={radius} fill="#fff9e3" opacity={0.55 + ((index % 3) * 0.15)} />
              ))}

              <g className="forest-back" fill="#152b35" opacity="0.82">
                <path d="M-30 301 L35 175 L100 301 Z M45 301 L118 150 L191 301 Z M142 301 L212 184 L282 301 Z M228 301 L306 137 L384 301 Z M342 301 L414 177 L486 301 Z M446 301 L526 145 L606 301 Z M568 301 L642 180 L716 301 Z M650 301 L731 140 L812 301 Z" />
              </g>

              <path d="M0 286 Q105 242 220 280 T452 267 T720 275 V420 H0 Z" fill="#dce8e6" />
              <path d="M0 329 Q110 289 231 323 T469 308 T720 318 V420 H0 Z" fill="#f7faf7" />

              <g transform="translate(96 250)">
                <rect x="0" y="26" width="112" height="82" rx="3" fill="#5f2b2f" />
                <path d="M-13 31 L56 -17 L125 31 Z" fill="#391c27" />
                <rect x="70" y="-1" width="17" height="35" fill="#33202a" />
                <rect className="cabin-window" x="18" y="50" width="28" height="30" rx="2" fill="#ffd276" />
                <rect className="cabin-window" x="66" y="50" width="28" height="30" rx="2" fill="#ffd276" />
                <path d="M56 108 V71 H77 V108" fill="#2b1a20" />
                <path d="M-8 31 Q56 6 120 31" fill="none" stroke="#f8fbf8" strokeWidth="10" strokeLinecap="round" />
              </g>

              <SleighFlight />
              <Snowman />

              <g className="forest-front" fill="#0a2529">
                <path d="M-45 430 L23 235 L91 430 Z M36 430 L105 268 L174 430 Z M634 430 L689 258 L744 430 Z M680 430 L752 221 L824 430 Z" />
              </g>
              <path d="M0 391 Q152 353 309 386 T720 374 V420 H0 Z" fill="#fff" />
            </g>
          </svg>
          <div className="cinema-grain" />
          <div className="cinema-vignette" />
        </div>

        <div className="hero-marquee">
          <div className="hero-marquee-track">
            <span>Gather well&nbsp;&nbsp;—&nbsp;&nbsp;Dine slowly&nbsp;&nbsp;—&nbsp;&nbsp;Celebrate together&nbsp;&nbsp;—&nbsp;&nbsp;</span>
            <span aria-hidden="true">Gather well&nbsp;&nbsp;—&nbsp;&nbsp;Dine slowly&nbsp;&nbsp;—&nbsp;&nbsp;Celebrate together&nbsp;&nbsp;—&nbsp;&nbsp;</span>
          </div>
        </div>
      </div>
    </header>
  );
}
