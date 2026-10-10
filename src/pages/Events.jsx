import { useStore } from '../lib/store';
import { DateBadge, EventCard } from '../components/Cards';
import PageHero from '../components/PageHero';
import { Empty, Reveal, Tilt } from '../components/ui';
import { downloadFile, eventToICS, fmtDate, fmtTime } from '../lib/utils';

export default function Events() {
  const { upcoming, past, catById, data, content: c } = useStore();
  return (
    <>
      <PageHero title={c.eventsTitle} sub={c.eventsSub} image={c.eventsBannerImage} />
      <section className="section">
        <div className="wrap">
          <h3 className="sub">القادمة</h3>
          {upcoming.length ? (
            <div className="stack">
              {upcoming.map((ev) => (
                <Reveal key={ev.id}>
                  <div className="event-full">
                    <EventCard ev={ev} />
                    <div className="event-extra small">
                      <span>{fmtDate(ev.date)}، {fmtTime(ev.time)}</span>
                      {ev.mode === 'أونلاين' && ev.link && <a className="btn btn-sm btn-navy" href={ev.link} target="_blank" rel="noreferrer">رابط الحضور</a>}
                      <button className="btn btn-sm btn-line" onClick={() => downloadFile(`${ev.title}.ics`, eventToICS(ev, data.settings.clubName), 'text/calendar')}>أضف للتقويم</button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : <Empty>ما فيش لقاءات قادمة حاليًا. تابع قنواتنا وهنعلن عن الموعد الجاي.</Empty>}

          <h3 className="sub" style={{ marginTop: 40 }}>لقاءات سابقة</h3>
          {past.length ? (
            <div className="stack">
              {past.map((ev) => (
                <Reveal key={ev.id}>
                  <article className="event-card past">
                    <DateBadge date={ev.date} />
                    <div className="event-main">
                      <h3>{ev.title}</h3>
                      <p className="muted small">{catById[ev.categoryId]?.name}</p>
                      {ev.notes && <p>{ev.notes}</p>}
                    </div>
                    {ev.image && <Tilt className="event-thumb small" max={10}><img src={ev.image} alt="" loading="lazy" /></Tilt>}
                  </article>
                </Reveal>
              ))}
            </div>
          ) : <Empty>لسه ما فيش لقاءات سابقة.</Empty>}
        </div>
      </section>
    </>
  );
}
