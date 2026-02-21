const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Sätt din nyckel här
const LINE_ID = "901";

// Ladda statiska hållplatser
async function loadTrips() {
    const res = await fetch("data/trips-901.json");
    return await res.json();
}

// Hämta realtidsdata för linje 901
async function fetchRealtimeBuses() {
    const url = `https://api.trafiklab.se/v1/realtime/vehiclemonitoring?key=${API_KEY}&lineRef=${LINE_ID}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        // Transformera till array med lastStopId / nextStopId / directionId
        return data.vehiclePositions.map(v => ({
            vehicleRef: v.vehicleRef,
            directionId: v.directionId,
            lastStopId: v.lastStopId,
            nextStopId: v.nextStopId
        }));
    } catch(e) {
        console.error("Realtidsdata misslyckades", e);
        return [];
    }
}

// Rita hållplatser
function drawStops(trips, container) {
    const height = 500;
    const idsKarlstad = trips[0].calls.map(c => c.stop.id);
    const idsLövnas = trips[1].calls.map(c => c.stop.id);

    trips.forEach(trip => {
        trip.calls.forEach((stop, i) => {
            let side = "center";
            if (!idsKarlstad.includes(stop.stop.id)) side = "right";
            if (!idsLövnas.includes(stop.stop.id)) side = "left";

            const stopDiv = document.createElement("div");
            stopDiv.className = `stop ${side}`;
            stopDiv.style.top = `${i * (height / (trip.calls.length - 1))}px`;
            stopDiv.innerText = stop.stop.name;
            container.appendChild(stopDiv);
        });
    });
}

// Placera bussar
function placeBuses(trips, buses, container) {
    const height = 500;
    buses.forEach(bus => {
        const trip = bus.directionId === 1
            ? trips.find(t => t.direction.includes("→ Karlstad"))
            : trips.find(t => t.direction.includes("→ Lövnäs"));
        if (!trip) return;

        const calls = trip.calls;
        const prevIndex = calls.findIndex(c => c.stop.id === bus.lastStopId);
        const nextIndex = calls.findIndex(c => c.stop.id === bus.nextStopId);
        const step = height / (calls.length - 1);
        const pos = prevIndex === -1 || nextIndex === -1 ? 0 : step * (prevIndex + 0.5);

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
