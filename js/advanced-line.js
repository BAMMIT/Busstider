const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Sätt din nyckel här
const LINE_ID = "901";
const HEIGHT = 600; // pixel på linjen

// Ladda statiska hållplatser
async function loadTrips() {
    const res = await fetch("data/trips-901.json");
    return await res.json();
}

// Hämta livebussar från Trafiklab
async function fetchRealtimeBuses() {
    const url = `https://realtime-api.trafiklab.se/v1/vehiclepositions?key=${API_KEY}&lineRef=${LINE_ID}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        return data.vehicles.map(v => ({
            vehicleRef: v.vehicleRef,
            directionId: v.directionId,
            lastStopId: v.lastStopId,
            nextStopId: v.nextStopId
        }));
    } catch(e) {
        console.error("Misslyckades hämta realtidsdata", e);
        return [];
    }
}

// Rita hållplatser med utskott för ensidiga stopp
function drawStops(trips, container) {
    const mainTrip = trips[0]; // Lövnäs → Karlstad som huvudlinje
    const otherTrip = trips[1]; // Karlstad → Lövnäs

    const step = HEIGHT / (mainTrip.calls.length - 1);

    mainTrip.calls.forEach((stop, i) => {
        // Placera stopp på huvudlinje
        const stopDiv = document.createElement("div");
        stopDiv.className = "stop center";
        stopDiv.style.top = `${i * step}px`;
        stopDiv.innerText = stop.stop.name;
        container.appendChild(stopDiv);

        // Kolla om samma stopp finns i andra riktningen
        const existsOther = otherTrip.calls.find(c => c.stop.id === stop.stop.id);
        if (!existsOther) return;

        // Inget nytt streck behövs, text finns redan
    });

    // Lägg till stopp från andra riktningen som inte finns på huvudlinjen
    otherTrip.calls.forEach((stop, i) => {
        const existsMain = mainTrip.calls.find(c => c.stop.id === stop.stop.id);
        if (existsMain) return; // redan på linjen

        const index = Math.floor(step * i); // ungefärlig position
        // Rita streck
        const streck = document.createElement("div");
        streck.className = "streck";
        streck.style.top = `${index}px`;
        streck.style.left = "140px";
        container.appendChild(streck);

        // Text på höger sida
        const stopDiv = document.createElement("div");
        stopDiv.className = "stop right";
        stopDiv.style.top = `${index - 8}px`;
        stopDiv.innerText = stop.stop.name;
        container.appendChild(stopDiv);
    });
}

// Placera bussar på linjen
function placeBuses(trips, buses, container) {
    const mainTrip = trips[0];
    const step = HEIGHT / (mainTrip.calls.length - 1);

    buses.forEach(bus => {
        const trip = bus.directionId === 1
            ? trips[0] // mot Karlstad
            : trips[1]; // mot Lövnäs

        const calls = trip.calls;
        const prevIndex = calls.findIndex(c => c.stop.id === bus.lastStopId);
        const nextIndex = calls.findIndex(c => c.stop.id === bus.nextStopId);
        const pos = (prevIndex >= 0 && nextIndex >= 0)
            ? step * (prevIndex + 0.5) // mellan två hållplatser
            : 0;

        const busDiv = document.createElement("div");
        busDiv.className = bus.directionId === 1 ? "bus bus-left" : "bus bus-right";
        busDiv.style.top = `${pos}px`;
        busDiv.innerHTML = bus.directionId === 1 ? "↑" : "↓";
        container.appendChild(busDiv);
    });
}

// Render-loop
async function renderLine() {
    const container = document.getElementById("line-container");
    container.innerHTML = '<div class="line" id="line"></div>';

    const trips = await loadTrips();
    drawStops(trips, container);

    const buses = await fetchRealtimeBuses();
    placeBuses(trips, buses, container);

    setTimeout(renderLine, 30000);
}

renderLine();
