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

export default function FestiveScene({ title, eventDate, clientMode }) {
  const sceneRef = useRef(null);
  const photoPlaneRef = useRef(null);

  useGSAP(() => {
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero-kicker', { y: 14, opacity: 0, duration: 0.55 })
        .from('.hero-title', { y: 28, opacity: 0, duration: 0.85 }, '-=0.25')
        .from('.hero-date, .hero-client-note', { y: 14, opacity: 0, duration: 0.55, stagger: 0.1 }, '-=0.45')
        .from('.hero-rule', { scaleX: 0, duration: 0.75 }, '-=0.35')
        .from('.business-event-frame', { x: 34, scale: 0.97, opacity: 0, duration: 1.05 }, '-=0.8');

      gsap.to('.photo-breathe', {
        scale: 1.045,
        duration: 13,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.guest-left', {
        xPercent: 0.5,
        rotation: 0.28,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.guest-centre', {
        xPercent: -0.32,
        yPercent: -0.5,
        rotation: -0.18,
        duration: 2.75,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.to('.guest-right', {
        xPercent: -0.42,
        yPercent: 0.32,
        rotation: 0.22,
        duration: 3.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      gsap.timeline({ repeat: -1, repeatDelay: 2.8 })
        .fromTo('.toast-glint',
          { scale: 0.35, opacity: 0, rotation: -18 },
          { scale: 1, opacity: 0.9, rotation: 6, duration: 0.45, ease: 'back.out(2)' })
        .to('.toast-glint', { scale: 1.5, opacity: 0, duration: 0.75, ease: 'power2.out' });

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

  const handlePointerMove = (event) => {
    if ((event.pointerType && event.pointerType !== 'mouse')
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = ((event.clientX - bounds.left) / bounds.width) - 0.5;
    const vertical = ((event.clientY - bounds.top) / bounds.height) - 0.5;
    gsap.to(photoPlaneRef.current, {
      x: horizontal * 8,
      y: vertical * 5,
      duration: 0.7,
      overwrite: 'auto',
      ease: 'power2.out',
    });
  };

  const handlePointerLeave = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.to(photoPlaneRef.current, {
      x: 0,
      y: 0,
      duration: 0.9,
      overwrite: 'auto',
      ease: 'power3.out',
    });
  };

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
        <div
          className="business-event-frame"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <div ref={photoPlaneRef} className="photo-depth">
            <div className="photo-breathe">
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
              <div className="guest-motion guest-left" aria-hidden="true">
                <img src={dinnerImage} alt="" />
              </div>
              <div className="guest-motion guest-centre" aria-hidden="true">
                <img src={dinnerImage} alt="" />
              </div>
              <div className="guest-motion guest-right" aria-hidden="true">
                <img src={dinnerImage} alt="" />
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
              <div className="toast-glint" aria-hidden="true"><span /></div>
            </div>
          </div>
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
