// ==============================
// KONFIG
// ==============================

const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Byt mot din nyckel
const LINE_NUMBER = "901";

const STOPS = [
  { id: "740010760", name: "Karlstad Busstationen" },
  { id: "740021275", name: "Karlstad Drottninggatan" },
  { id: "740022197", name: "Karlstad Residenstorget" },
  { id: "740057604", name: "Karlstad Stora Torget" }
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

    // Sortera på scheduledTime
    departures901.sort((a, b) =>
      new Date(a.scheduledTime) - new Date(b.scheduledTime)
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

      const scheduled = new Date(nextDeparture.scheduledTime).toLocaleTimeString("sv-SE", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const realtime = nextDeparture.estimatedTime
        ? new Date(nextDeparture.estimatedTime).toLocaleTimeString("sv-SE", {
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

// ==============================
// INIT
// ==============================

loadDepartures();
setInterval(loadDepartures, 30000);
