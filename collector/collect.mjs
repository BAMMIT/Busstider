// Samlar in avgångar/ankomster och sparar sista kända avvikelse per tur.
// Körs av GitHub Actions (se .github/workflows/collect.yml). Kräver Node 18+.
import fs from 'node:fs';
import path from 'node:path';

const KEY = process.env.TRAFIKLAB_KEY;
if (!KEY) { console.error('TRAFIKLAB_KEY saknas'); process.exit(1); }

const cfg = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url), 'utf8'));
const DIR = process.env.DATA_DIR || 'data';
const ITER = +(process.env.ITERATIONS || 9);      // antal hämtningar per körning
const GAP = +(process.env.INTERVAL_SEC || 60);    // sekunder mellan hämtningar
const KEEP = +(process.env.KEEP_DAYS || 60);      // dagar att spara
const [QFROM, QTO] = cfg.quietHours || [1, 4];    // pausa (svensk tid) så att kvoten sparas
const API = 'https://realtime-api.trafiklab.se/v1';

const hour = +new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Stockholm' }).format(new Date());
if (hour >= QFROM && hour < QTO) { console.log(`Tyst period (${QFROM}-${QTO}), hoppar över.`); process.exit(0); }

fs.mkdirSync(DIR, { recursive: true });
const days = {}, dirty = new Set();
const day = d => days[d] ??= (() => {
  const f = path.join(DIR, d + '.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
})();

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} för ${url.replace(KEY, '***')}`);
  return r.json();
}

function record(stop, list, kind) {
  for (const x of list) {
    if (cfg.busOnly !== false && x.route?.transport_mode !== 'BUS') continue;
    if (!x.is_realtime && !x.canceled) continue;       // utan realtid är avvikelsen okänd
    const d = x.scheduled.slice(0, 10);
    const k = [kind, x.trip.trip_id, x.trip.start_date, x.stop.id].join('|');
    day(d)[k] = {
      k: kind, l: x.route.designation || x.route.name || '?', s: x.stop.name,
      a: stop.id, an: stop.name, sc: x.scheduled, dl: x.delay,
      c: x.canceled ? 1 : 0, m: x.route.transport_mode
    };
    dirty.add(d);
  }
}

function save() {
  for (const d of dirty) fs.writeFileSync(path.join(DIR, d + '.json'), JSON.stringify(days[d]));
  dirty.clear();
  const limit = new Date(Date.now() - KEEP * 864e5).toISOString().slice(0, 10);
  const files = fs.readdirSync(DIR).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  for (const f of files) if (f.slice(0, 10) < limit) fs.unlinkSync(path.join(DIR, f));
  const keep = files.filter(f => f.slice(0, 10) >= limit).map(f => f.slice(0, 10));
  fs.writeFileSync(path.join(DIR, 'index.json'), JSON.stringify({ updated: new Date().toISOString(), days: keep }));
}

for (let i = 0; i < ITER; i++) {
  await Promise.all(cfg.stops.map(async stop => {
    try {
      const [dep, arr] = await Promise.all([
        get(`${API}/departures/${stop.id}?key=${KEY}`),
        get(`${API}/arrivals/${stop.id}?key=${KEY}`)
      ]);
      record(stop, dep.departures || [], 'd');
      record(stop, arr.arrivals || [], 'a');
    } catch (e) { console.error(stop.name, e.message); }
  }));
  save();
  console.log(`Hämtning ${i + 1}/${ITER} klar`);
  if (i < ITER - 1) await new Promise(r => setTimeout(r, GAP * 1000));
}
