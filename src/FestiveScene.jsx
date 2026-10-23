import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import dinnerImage from './assets/business-christmas-dinner.webp';

gsap.registerPlugin(useGSAP);

const WINDOW_SNOW = Array.from({ length: 18 }, (_, index) => index);
const TABLE_FLAMES = [
  { x: 38, y: 51, delay: '-0.4s' },
  { x: 44, y: 49, delay: '-1.1s' },
  { x: 47, y: 49, delay: '-0.2s' },
  { x: 51, y: 50, delay: '-1.6s' },
  { x: 58, y: 49, delay: '-0.8s' },
];
const TREE_LIGHTS = [
  { x: 33, y: 6, colour: '#ffe7a4', duration: '1.8s', delay: '-0.4s' },
  { x: 30, y: 11, colour: '#f5c86e', duration: '2.4s', delay: '-1.7s' },
  { x: 36, y: 13, colour: '#fff2be', duration: '1.5s', delay: '-0.8s' },
  { x: 28, y: 18, colour: '#d95f4f', duration: '2.7s', delay: '-2.1s' },
  { x: 33, y: 18, colour: '#ffe095', duration: '1.7s', delay: '-1.2s' },
  { x: 39, y: 20, colour: '#fff1bd', duration: '2.2s', delay: '-0.2s' },
  { x: 27, y: 25, colour: '#ffdc82', duration: '1.4s', delay: '-0.9s' },
  { x: 31, y: 23, colour: '#fff0b2', duration: '2.6s', delay: '-1.8s' },
  { x: 36, y: 26, colour: '#cc5849', duration: '2.1s', delay: '-0.5s' },
  { x: 41, y: 25, colour: '#ffe8a6', duration: '1.6s', delay: '-1.3s' },
  { x: 25, y: 32, colour: '#f5c96f', duration: '2.3s', delay: '-0.1s' },
  { x: 30, y: 31, colour: '#fff2c4', duration: '1.7s', delay: '-1.5s' },
  { x: 34, y: 34, colour: '#ffda82', duration: '2.8s', delay: '-2.4s' },
  { x: 39, y: 31, colour: '#fff0b0', duration: '1.5s', delay: '-0.7s' },
  { x: 43, y: 35, colour: '#cf5c4b', duration: '2.4s', delay: '-1.9s' },
  { x: 24, y: 40, colour: '#ffe092', duration: '1.9s', delay: '-1.4s' },
  { x: 29, y: 38, colour: '#fff4c9', duration: '2.6s', delay: '-0.3s' },
  { x: 34, y: 42, colour: '#ce5948', duration: '1.6s', delay: '-1.1s' },
  { x: 38, y: 39, colour: '#ffe5a0', duration: '2.2s', delay: '-2s' },
  { x: 43, y: 42, colour: '#fff1b7', duration: '1.5s', delay: '-0.6s' },
  { x: 23, y: 48, colour: '#f3c368', duration: '2.5s', delay: '-1.6s' },
  { x: 28, y: 46, colour: '#fff0b5', duration: '1.7s', delay: '-0.4s' },
  { x: 33, y: 49, colour: '#d05b48', duration: '2.1s', delay: '-1.3s' },
  { x: 38, y: 47, colour: '#ffe094', duration: '1.5s', delay: '-0.9s' },
  { x: 44, y: 49, colour: '#fff3c3', duration: '2.7s', delay: '-2.2s' },
];

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
        .from('.business-event-frame', { opacity: 0, duration: 1.05 }, '-=0.8');

      gsap.to('.candle-glow', {
        opacity: 0.78,
        scale: 1.04,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

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
          <div className="christmas-tree-lights" aria-hidden="true">
            {TREE_LIGHTS.map((light, index) => (
              <span
                className="tree-light"
                key={`${light.x}-${light.y}`}
                style={{
                  '--x': `${light.x}%`,
                  '--y': `${light.y}%`,
                  '--colour': light.colour,
                  '--duration': light.duration,
                  '--delay': light.delay,
                  '--size': `${2.3 + (index % 3) * 0.55}px`,
                }}
              />
            ))}
          </div>
          <div className="table-flames" aria-hidden="true">
            {TABLE_FLAMES.map((flame) => (
              <span
                className="living-flame"
                key={`${flame.x}-${flame.y}`}
                style={{ '--x': `${flame.x}%`, '--y': `${flame.y}%`, '--delay': flame.delay }}
              />
            ))}
          </div>
          <div className="window-snow" aria-hidden="true">
            {WINDOW_SNOW.map((index) => <span key={index} style={{ '--i': index }} />)}
          </div>
        </div>
      </figure>
    </header>
  );
}
