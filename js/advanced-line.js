/*********************************************************
 *  Linje 901 – Advanced Line (Frontend only)
 *  Realtid via Trafiklab JSON
 *********************************************************/

const API_KEY = "d04e6df880fd4f33bd14a706425b0994";
const ROUTE_NUMBER = "901";

/* ===========================
   STOPP-LISTA
=========================== */

const calls = [
  { stop: { id: "740010760", name: "Karlstad Busstationen", direction: "SU" } },
  { stop: { id: "740021275", name: "Karlstad Drottninggatan", direction: "U" } },
  { stop: { id: "740022197", name: "Karlstad Residenstorget", direction: "B" } },
  { stop: { id: "740057604", name: "Karlstad Stora Torget", direction: "B" } },
  { stop: { id: "740022299", name: "Södra Kyrkogatan", direction: "B" } },
  { stop: { id: "740023258", name: "Inre Hamn", direction: "B" } },
  { stop: { id: "740075537", name: "Packhusallén", direction: "B" } },
  { stop: { id: "740022244", name: "Nolgård", direction: "B" } },
  { stop: { id: "740072181", name: "Jonsol Bytespunkt", direction: "B" } },
  { stop: { id: "740036018", name: "Hammar", direction: "B" } },
  { stop: { id: "740036019", name: "Hammarlunden", direction: "B" } },
  { stop: { id: "740035993", name: "Hallersrudsvägen", direction: "B" } },
  { stop: { id: "740022236", name: "Lövnäs Hammarö", direction: "R" } },
  { stop: { id: "740025756", name: "Bryggerivägen", direction: "SR" } }
];


/* ===========================
   BYGG RIKTNINGAR
=========================== */

function buildDirections() {

    const outbound = calls
        .filter(c => ["SU", "U", "B", "SR"].includes(c.stop.direction))
        .map(c => c.stop.id);

    const inbound = [...calls]
        .reverse()
        .filter(c => ["SR", "R", "B", "SU"].includes(c.stop.direction))
        .map(c => c.stop.id);

    return { outbound, inbound };
}


/* ===========================
   RITA HÅLLPLATSER
=========================== */

function renderStops() {

    const container = document.getElementById("line-container");
    const total = calls.length;

    calls.forEach((call, index) => {

        const percent = (index / (total - 1)) * 100;

        const stopEl = document.createElement("div");
        stopEl.classList.add("stop");
        stopEl.classList.add("main");
        stopEl.style.top = percent + "%";
        stopEl.textContent = call.stop.name;

        container.appendChild(stopEl);
    });
}


/* ===========================
   HÄMTA REALTIME
=========================== */

async function fetchRealtime(stopId) {

    const res = await fetch(
        `https://realtime-api.trafiklab.se/v1/departures/${stopId}?key=${API_KEY}`
    );

    return await res.json();
}


/* ===========================
   RITA BUSS
=========================== */

function drawBus(index, totalStops, side) {

    const percent = (index / (totalStops - 1)) * 100;

    const bus = document.createElement("div");
    bus.classList.add("bus");

    if (side === "left") {
        bus.classList.add("bus-left");
    } else {
        bus.classList.add("bus-right");
    }

    bus.style.top = percent + "%";

    document.getElementById("line-container").appendChild(bus);
}


/* ===========================
   LADDA FORDON
=========================== */

async function loadVehicles() {

    const { outbound, inbound } = buildDirections();

    // Ta bort gamla bussar
    document.querySelectorAll(".bus").forEach(b => b.remove());

    for (const call of calls) {

        try {

            const data = await fetchRealtime(call.stop.id);

            data.departures
                .filter(d => d.route.designation === ROUTE_NUMBER)
                .slice(0, 1)
                .forEach(dep => {

                    const stopId = call.stop.id;

                    const outIndex = outbound.indexOf(stopId);
                    const inIndex = inbound.indexOf(stopId);

                    if (outIndex !== -1) {
                        drawBus(outIndex, outbound.length, "left");
                    }

                    if (inIndex !== -1) {
                        drawBus(inIndex, inbound.length, "right");
                    }

                });

        } catch (err) {
            console.error("Fel vid hämtning av stopp", call.stop.id);
        }
    }
}


/* ===========================
   INIT
=========================== */

renderStops();
loadVehicles();
setInterval(loadVehicles, 60000);
