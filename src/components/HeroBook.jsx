import { useRef } from 'react';

/** كتاب ثلاثي الأبعاد (CSS 3D) بيتمايل لوحده ويتحرك مع الماوس */
export default function HeroBook({ image, title }) {
  const ref = useRef(null);
  const move = (e) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--px', `${(((e.clientX - r.left) / r.width - 0.5) * 24).toFixed(1)}deg`);
    ref.current.style.setProperty('--py', `${(((e.clientY - r.top) / r.height - 0.5) * -16).toFixed(1)}deg`);
  };
  const reset = () => { ref.current?.style.setProperty('--px', '0deg'); ref.current?.style.setProperty('--py', '0deg'); };
  return (
    <div className="hb-scene" ref={ref} onPointerMove={move} onPointerLeave={reset} role="img" aria-label={`كتاب ${title}`}>
      <div className="hb-glow" />
      <div className="hb-pointer">
        <div className="hb-book">
          <div className="hb-face hb-front">{image ? <img src={image} alt="" /> : <strong>{title}</strong>}</div>
          <div className="hb-face hb-back" />
          <div className="hb-face hb-spine"><span>{title}</span></div>
          <div className="hb-face hb-pages-l" />
          <div className="hb-face hb-pages-t" />
          <div className="hb-face hb-pages-b" />
        </div>
      </div>
      <div className="hb-shadow" />
    </div>
  );
}
