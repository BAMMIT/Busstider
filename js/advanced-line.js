/*********************************************************
 *  Linje 901 – Advanced Line (Frontend only)
 *  Realtid via Trafiklab JSON
 *********************************************************/

const API_KEY = "d04e6df880fd4f33bd14a706425b0994";
// ================================
// KONFIGURATION
// ================================

const LINE_NUMBER = "901";

// Din hållplatslista
const CALLS = [
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

// Realtids-API (JSON-version via Trafiklab proxy)
const REALTIME_URL = "https://api.trafiklab.se/samtrafiken/gtfs-rt/vehiclepositions.json?key=${API_KEY}";

// ================================
// BYGG LINJEN
// ================================

function buildLine(direction = "outbound") {
  const container = document.getElementById("line");
  container.innerHTML = "";

  let stops;

  if (direction === "outbound") {
    stops = CALLS.filter(s =>
      s.direction === "SU" ||
      s.direction === "U" ||
      s.direction === "B" ||
      s.direction === "SR"
    );
  } else {
    stops = CALLS
      .slice()
      .reverse()
      .filter(s =>
        s.direction === "SU" ||
        s.direction === "R" ||
        s.direction === "B" ||
        s.direction === "SR"
      );
  }

  stops.forEach((stop, index) => {
    const stopDiv = document.createElement("div");
    stopDiv.className = "stop";
    stopDiv.dataset.stopId = stop.id;

    stopDiv.innerHTML = `
      <div class="stop-dot"></div>
      <div class="stop-name">${stop.name}</div>
    `;

    container.appendChild(stopDiv);
  });

  return stops;
}

// ================================
// HÄMTA REALTID
// ================================

async function fetchRealtime() {
  try {
    const response = await fetch(REALTIME_URL);
    const data = await response.json();

    const vehicles = data.entity
      .map(e => e.vehicle)
      .filter(v =>
        v.trip?.routeId === LINE_NUMBER
      );

    return vehicles;

  } catch (error) {
    console.error("Realtime error:", error);
    return [];
  }
}

// ================================
// POSITIONERA BUSS MELLAN STOPP
// ================================

function placeVehicleBetweenStops(stops, vehicle) {

  if (!vehicle.stopId) return;

  const currentIndex = stops.findIndex(s => s.id === vehicle.stopId);
  if (currentIndex === -1 || currentIndex === stops.length - 1) return;

  const container = document.getElementById("line");

  // Ta bort gammal buss
  const oldBus = document.querySelector(".vehicle");
  if (oldBus) oldBus.remove();

  const nextIndex = currentIndex + 1;

  const currentStopEl = container.children[currentIndex];
  const nextStopEl = container.children[nextIndex];

  const bus = document.createElement("div");
  bus.className = "vehicle";
  bus.innerText = "🚌";

  // Placera mitt emellan
  const topPosition =
    currentStopEl.offsetTop +
    (nextStopEl.offsetTop - currentStopEl.offsetTop) / 2;

  bus.style.top = `${topPosition}px`;

  container.appendChild(bus);
}

// ================================
// INIT
// ================================

async function init() {
  const stops = buildLine("outbound");

  const vehicles = await fetchRealtime();

  if (vehicles.length > 0) {
    placeVehicleBetweenStops(stops, vehicles[0]);
  }
}

init();

// Uppdatera var 60:e sekund
setInterval(init, 60000);
