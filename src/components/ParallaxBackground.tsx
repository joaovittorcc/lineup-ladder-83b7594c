import { useEffect, useRef, useMemo } from 'react';

const ParallaxBackground = () => {
  const layerRef = useRef<HTMLDivElement>(null);
  const scrollOffset = useRef(0);
  const animOffset = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      scrollOffset.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let lastTime = performance.now();
    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      animOffset.current += dt * 4;
      if (layerRef.current) {
        layerRef.current.style.transform = `translateX(${animOffset.current % 300}px) translateY(${scrollOffset.current * 0.2}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const items = useMemo(() => {
    const seed = 42;
    const rng = (i: number) => {
      const x = Math.sin(seed + i * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    const texts = ['MIDNIGHT CLUB', '夜中', 'MDN', 'CLUB 夜中'];
    return Array.from({ length: 80 }, (_, i) => ({
      text: texts[Math.floor(rng(i * 3) * texts.length)],
      x: rng(i * 7 + 1) * 110 - 5,
      y: rng(i * 7 + 2) * 110 - 5,
      size: 11 + rng(i * 7 + 3) * 5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div
        ref={layerRef}
        className="absolute"
        style={{
          top: '-20%',
          left: '-20%',
          width: '150%',
          height: '150%',
        }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            className="absolute font-orbitron font-bold uppercase whitespace-nowrap select-none"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              fontSize: `${item.size}px`,
              color: '#0e0e0e',
              textShadow: '0 0 10px hsl(330 100% 49% / 0.03)',
              transform: 'rotate(-20deg)',
              letterSpacing: '0.4em',
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(330 100% 49% / 0.04) 0%, transparent 60%)',
        }}
      />
    </div>
  );
};

export default ParallaxBackground;
