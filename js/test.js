// ==============================
// KONFIG
// ==============================

const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Byt mot din nyckel
const LINE_NUMBER = "901";

const STOPS = [
  { id: "740010760", name: "Karlstad Busstationen", direction: "SU" },
  { id: "740023258", name: "Inre Hamn", direction: "B" },
  { id: "740072181", name: "Jonsol Bytespunkt", direction: "B" },
  { id: "740025756", name: "Bryggerivägen", direction: "SR" }
];

// ==============================
// HÄMTA DEPARTURES
// ==============================

async function fetchDepartures(stop) {
  try {
    const url = `https://realtime-api.trafiklab.se/v1/departures/${stop.id}?&key=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.departures) return null;

    // Filtrera linje 901
    const departures901 = data.departures.filter(d =>
      d.route?.designation === LINE_NUMBER
    );

    if (departures901.length === 0) return null;

    // Sortera på scheduled
    departures901.sort((a, b) =>
      new Date(a.scheduled) - new Date(b.scheduled)
    );

    return departures901[0]; // nästa avgång

  } catch (error) {
    console.error("Fel vid hämtning:", error);
    return null;
  }
}

// ==============================
// VISA I DOM
// ==============================

async function loadDepartures() {

const container = document.getElementById("departures");

if (!container) {
  console.error("Element #departures finns inte i HTML!");
  return;
}
  
//  const container = document.getElementById("departures");
  container.innerHTML = "";

  for (const stop of STOPS) {

    const nextDeparture = await fetchDepartures(stop);

    const row = document.createElement("div");
    row.className = "departure-row";

    if (!nextDeparture) {
      row.innerHTML = `
        <strong>${stop.name}</strong><br>
        Ingen avgång för 901
      `;
    } else {

      const scheduled = new Date(nextDeparture.scheduled).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const realtime = nextDeparture.realtime
        ? new Date(nextDeparture.realtime).toLocaleTimeString("sv-SE", {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "—";

      row.innerHTML = `
        <strong>${stop.name}</strong><br>
        Tidtabell: ${scheduled} <br>
        Realtid: ${realtime}
      `;
    }

    container.appendChild(row);
  }
}
function buildRow(item) {
    const scheduled = formatTime(item.scheduled);
    const hasRealtime = !!item.realtime;
    const realtime = hasRealtime ? formatTime(item.realtime) : null;
    const delaySeconds = item.delay ?? null;
    const canceled = item.canceled;

    let statusClass = "static";
    let timeText = scheduled;

    if (canceled) {
        statusClass = "canceled";
        timeText = "Inställd";
    } else if (hasRealtime && delaySeconds !== null) {
        if (delaySeconds > 0) {
            statusClass = "late";
            timeText = `${realtime} (+${Math.round(delaySeconds/60)} min)`;
        } else {
            statusClass = "on-time";
            timeText = realtime;
        }
    }

    return `
        <div class="bus-item">
            <div>
                <div class="bus-line">Linje ${item.route.designation}</div>
                <div class="bus-direction">Mot ${item.route.direction}</div>
            </div>
            <div class="bus-time ${statusClass}">
                ${timeText}
                <div class="scheduled-time">Tidtabell: ${scheduled}</div>
            </div>
        </div>
    `;
}

async function loadData() {
    const { stops } = getParams();
    const container = document.getElementById("app");
    container.innerHTML = "";

    for (const stop of stops) {
        if (!stop) continue;

        try {
            const data = await fetchStop(stop);
            const stopName = data.stops[0]?.name || "Hållplats";

            // Dela upp avgångar per riktning
            const towardsKarlstad = data.departures.filter(d => d.route.destination.name.includes("Karlstad"));
            const towardsHammaro = data.departures.filter(d => !d.route.destination.name.includes("Karlstad"));

            let html = `<div class="stop-card"><div class="stop-header">Ankomster & Avgångar – ${stopName}</div>`;
            html += `<div class="columns">`;

            // Kolumn Karlstad
            html += `<div class="column"><div class="column-title">Mot Karlstad</div>`;
            towardsKarlstad.slice(0,6).forEach(item => html += buildRow(item));
            html += `</div>`;

            // Kolumn Bryggerivägen/Hammarö
            html += `<div class="column"><div class="column-title">Mot Bryggerivägen/Hammarö</div>`;
            towardsHammaro.slice(0,6).forEach(item => html += buildRow(item));
            html += `</div>`;

            html += `</div></div>`;
            container.innerHTML += html;

        } catch {
            container.innerHTML += `<div class="stop-card">Kunde inte hämta hållplats ${stop}</div>`;
        }
    }

    container.innerHTML += `<div class="footer">Uppdateras automatiskt var 60:e sekund</div>`;
}
// ==============================
// INIT
// ==============================

loadDepartures();
setInterval(loadDepartures, 30000);
