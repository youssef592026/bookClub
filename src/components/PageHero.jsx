import { Stripes, Tilt } from './ui';

export default function PageHero({ title, sub, image, action }) {
  return (
    <header className="page-hero">
      <div className="wrap page-hero-in">
        <div className="ph-text">
          <Stripes />
          <h1>{title}</h1>
          {sub && <p className="muted">{sub}</p>}
          {action}
        </div>
        {image && <Tilt className="ph-img"><img src={image} alt="" /></Tilt>}
      </div>
    </header>
  );
}
