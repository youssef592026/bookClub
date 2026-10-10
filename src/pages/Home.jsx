import { Link } from 'react-router-dom';
import { useStore } from '../lib/store';
import { BookCard, MoreLink } from '../components/Cards';
import HeroBook from '../components/HeroBook';
import { Avatar, Empty, Reveal, SectionHead, Stripes, Tilt } from '../components/ui';
import { fmtDate, fmtTime, levelFor, num } from '../lib/utils';

export default function Home() {
  const { data, upcoming, currentCategory, leaderboard, content: c, user, userPoints } = useStore();
  const s = data.settings;
  const next = upcoming[0];
  const roundBooks = data.books.filter((b) => b.categoryId === s.currentCategoryId).slice(0, 4);
  const latest = data.quotes.filter((q) => q.status === 'approved').slice(0, 2);
  const top = leaderboard.slice(0, 3);
  const steps = [[c.step1Title, c.step1Text], [c.step2Title, c.step2Text], [c.step3Title, c.step3Text]];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div className="hero-text">
            <p className="hero-kicker">{c.heroKicker}</p>
            <h1>{s.tagline}</h1>
            <p className="hero-lead">{c.heroLead}</p>
            <div className="btn-row">
              <Link to="/join" className="btn btn-gold">{c.heroBtn1}</Link>
              <Link to="/events" className="btn btn-ghost">{c.heroBtn2}</Link>
              {user ? <div className="home-points"><span>رصيدك الحالي</span><strong>{num(userPoints)} نقطة</strong></div> : <Link to="/login" className="btn btn-ghost home-login">تسجيل الدخول</Link>}
            </div>
          </div>
          <HeroBook image={c.heroCover} title={s.clubName} />
        </div>
        {next && (
          <div className="wrap">
            <div className="next-bar">
              <div>
                <span className="small">اللقاء القادم</span>
                <strong>{next.title}</strong>
              </div>
              <div className="small">{fmtDate(next.date)}، الساعة {fmtTime(next.time)}</div>
              <Link to="/events" className="btn btn-gold btn-sm">التفاصيل</Link>
            </div>
          </div>
        )}
      </section>

      <section className="section">
        <div className="wrap about-grid">
          {c.aboutImage && <Reveal><Tilt className="frame"><img src={c.aboutImage} alt="" /></Tilt></Reveal>}
          <Reveal delay={120}>
            <Stripes />
            <h2 className="h2">{c.aboutTitle}</h2>
            <p className="lead">{s.about}</p>
            <p className="muted">{s.goal}</p>
          </Reveal>
        </div>
      </section>

      <section className="section section-tint">
        <div className="wrap">
          <SectionHead title={c.howTitle} />
          <div className="road">
            <svg className="road-svg" viewBox="0 0 900 120" preserveAspectRatio="none" aria-hidden="true">
              <path d="M 890 95 C 830 95 800 60 750 60 C 650 0 550 120 450 60 S 250 0 150 60 C 100 60 70 95 10 95" />
            </svg>
            <ol className="steps">
              {steps.map(([t, d], i) => (
                <li key={i}>
                  <span className="step-n">{num(i + 1)}</span>
                  <h3>{t}</h3>
                  <p className="muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {currentCategory && (
        <section className="section">
          <div className="wrap">
            <Reveal>
              <div className="round-head">
                {currentCategory.image && <Tilt className="frame small"><img src={currentCategory.image} alt="" /></Tilt>}
                <div className="grow">
                  <Stripes />
                  <h2 className="h2">{c.roundTitle}: {currentCategory.name}</h2>
                  <p className="muted">{currentCategory.description}</p>
                </div>
                <MoreLink to="/books">كل الكتب</MoreLink>
              </div>
            </Reveal>
            {roundBooks.length ? (
              <div className="grid books-grid">{roundBooks.map((b, i) => <Reveal key={b.id} delay={i * 90}><BookCard book={b} /></Reveal>)}</div>
            ) : <Empty>لسه ما حدش اختار كتابه في الجولة دي. كن أول واحد!</Empty>}
          </div>
        </section>
      )}

      <section className="section section-tint">
        <div className="wrap two-col">
          <Reveal>
            <SectionHead title={c.boardTitle} action={<MoreLink to="/quotes">اللوحة كاملة</MoreLink>}>{c.boardSub}</SectionHead>
            <ol className="board">
              {top.map((m, i) => (
                <li key={m.id}>
                  <span className="rank">{num(i + 1)}</span>
                  <Avatar member={m} />
                  <span className="grow"><strong>{m.name}</strong><small className="muted">{levelFor(m.points).name}</small></span>
                  <span className="pts">{num(m.points)} نقطة</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={120}>
            <SectionHead title={c.latestTitle} action={<MoreLink to="/quotes">المزيد</MoreLink>} />
            {latest.length ? latest.map((q) => (
              <figure className="quote" key={q.id}>
                <blockquote>{q.text}</blockquote>
                <figcaption>{q.authorName}{q.bookTitle ? `، عن ${q.bookTitle}` : ''}</figcaption>
              </figure>
            )) : <Empty>ما فيش مراجعات منشورة لسه.</Empty>}
          </Reveal>
        </div>
      </section>

      <section className="cta">
        <div className="wrap cta-in">
          <div className="cta-text">
            <h2>{c.ctaTitle}</h2>
            <p>{c.ctaText}</p>
            <div className="btn-row">
              <a className="btn btn-gold" href={s.links.whatsapp} target="_blank" rel="noreferrer">واتساب</a>
              <a className="btn btn-ghost" href={s.links.telegram} target="_blank" rel="noreferrer">تيليجرام</a>
              <a className="btn btn-ghost" href={s.links.facebook} target="_blank" rel="noreferrer">فيسبوك</a>
            </div>
          </div>
          {c.ctaImage && <Tilt className="frame cta-img"><img src={c.ctaImage} alt="" loading="lazy" /></Tilt>}
        </div>
      </section>
    </>
  );
}
