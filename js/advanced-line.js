/*********************************************************
 *  Linje 901 – Advanced Line (Frontend only)
 *  Realtid via Trafiklab JSON
 *********************************************************/

const API_KEY = "d04e6df880fd4f33bd14a706425b0994";
const LINE_NUMBER = "901";

const STOPS = [
  { id: "740010760", name: "Karlstad Busstationen", direction: "SU" },
  { id: "740021275", name: "Karlstad Drottninggatan", direction: "U" },
  { id: "740022197", name: "Karlstad Residenstorget", direction: "B" },
  { id: "740057604", name: "Karlstad Stora Torget", direction: "B" },
  { id: "740022299", name: "Södra Kyrkogatan", direction: "B" },
  { id: "740023258", name: "Inre Hamn", direction: "B" },
  { id: "740075537", name: "Packhusallén", direction: "B" },
  { id: "740022244", name: "Nolgård", direction: "B" },
  { id: "740072181", name: "Jonsol Bytespunkt", direction: "B" },
  { id: "740036018", name: "Hammar", direction: "B" },
  { id: "740036019", name: "Hammarlunden", direction: "B" },
  { id: "740035993", name: "Hallersrudsvägen", direction: "B" },
  { id: "740022236", name: "Lövnäs Hammarö", direction: "R" },
  { id: "740025756", name: "Bryggerivägen", direction: "SR" }
];

// =====================================
// BYGG LINJEN
// =====================================

function buildLine() {
  const container = document.getElementById("line");
  container.innerHTML = "";

  STOPS.forEach(stop => {
    const el = document.createElement("div");
    el.className = "stop";
    el.dataset.id = stop.id;

    el.innerHTML = `
      <div class="stop-dot"></div>
      <div class="stop-name">${stop.name}</div>
    `;

    container.appendChild(el);
  });
}

// =====================================
// HÄMTA DEPARTURES FÖR FÖRSTA STOPPET
// =====================================

async function fetchDepartures(stopId) {

  const url = `https://realtime-api.trafiklab.se/v1/departures?originId=${stopId}&key=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  return data.departures
    .filter(d => d.line?.number === LINE_NUMBER)
    .sort((a, b) => new Date(a.time) - new Date(b.time));
}

// =====================================
// RÄKNA POSITION
// =====================================

function calculateProgress(departureTime, arrivalTime) {

  const now = new Date().getTime();
  const dep = new Date(departureTime).getTime();
  const arr = new Date(arrivalTime).getTime();

  const total = arr - dep;
  const passed = now - dep;

  let percent = passed / total;

  if (percent < 0) percent = 0;
  if (percent > 1) percent = 1;

  return percent;
}

// =====================================
// PLACERA BUSS
// =====================================

function placeVehicle(progress, fromIndex) {

  const container = document.getElementById("line");

  const old = document.querySelector(".vehicle");
  if (old) old.remove();

  const fromStop = container.children[fromIndex];
  const toStop = container.children[fromIndex + 1];

  if (!fromStop || !toStop) return;

  const start = fromStop.offsetTop;
  const end = toStop.offsetTop;

  const position = start + (end - start) * progress;

  const bus = document.createElement("div");
  bus.className = "vehicle";
  bus.innerText = "🚌";
  bus.style.top = `${position}px`;

  container.appendChild(bus);
}

// =====================================
// INIT
// =====================================

async function init() {

  buildLine();

  // Vi börjar från första stoppet
  const firstStop = STOPS[0];

  const departures = await fetchDepartures(firstStop.id);

  if (departures.length === 0) return;

  const nextDeparture = departures[0];

  // Här behöver du arrivalTime till nästa stopp
  // Antingen från samma objekt eller via arrivals-endpoint

  const departureTime = nextDeparture.time;
  const arrivalTime = nextDeparture.arrivalTime; // om API skickar detta

  if (!arrivalTime) return;

  const progress = calculateProgress(departureTime, arrivalTime);

  placeVehicle(progress, 0);
}
// Uppdatera var 60:e sekund
setInterval(init, 60000);
