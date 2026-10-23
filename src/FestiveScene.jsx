import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import dinnerImage from './assets/business-christmas-dinner.webp';

gsap.registerPlugin(useGSAP);

const WINDOW_SNOW = Array.from({ length: 18 }, (_, index) => index);

export default function FestiveScene({ title, eventDate, clientMode }) {
  const sceneRef = useRef(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-kicker', { y: 14, opacity: 0, duration: 0.55 })
        .from('.hero-title', { y: 28, opacity: 0, duration: 0.85 }, '-=0.25')
        .from('.hero-date, .hero-client-note', { y: 14, opacity: 0, duration: 0.55, stagger: 0.1 }, '-=0.45')
        .from('.hero-rule', { scaleX: 0, duration: 0.75 }, '-=0.35')
        .from('.business-event-frame', { x: 34, scale: 0.97, opacity: 0, duration: 1.05 }, '-=0.8');

      gsap.to('.business-christmas-image', {
        scale: 1.075,
        duration: 16,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.candle-glow', {
        opacity: 0.78,
        scale: 1.04,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.fromTo('.photo-sheen',
        { xPercent: -125, opacity: 0 },
        { xPercent: 175, opacity: 0.38, duration: 7.5, repeat: -1, repeatDelay: 5.5, ease: 'power1.inOut' });
    });

    return () => media.revert();
  }, { scope: sceneRef });

  return (
    <header ref={sceneRef} className="hero-stage">
      <div className="hero-copy">
        <p className="hero-kicker">Private Christmas dinner</p>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-date">{eventDate}</p>
        <p className="hero-client-note">
          {clientMode
            ? 'An intimate evening for our property community.'
            : 'Festive dining with space for genuine conversation.'}
        </p>
        <div className="hero-rule" aria-hidden="true" />
      </div>

      <figure className="cinema-shell" data-testid="business-event-cinema">
        <div className="business-event-frame">
          <img
            className="business-christmas-image"
            src={dinnerImage}
            alt="Candlelit Christmas dinner for a small group of property professionals"
            width="1600"
            height="900"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          <div className="business-image-shade" aria-hidden="true" />
          <div className="candle-glow" aria-hidden="true" />
          <div className="photo-sheen" aria-hidden="true" />
          <div className="window-snow" aria-hidden="true">
            {WINDOW_SNOW.map((index) => <span key={index} style={{ '--i': index }} />)}
          </div>
        </div>
      </figure>
    </header>
  );
}
