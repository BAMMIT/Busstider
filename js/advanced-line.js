const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Sätt din nyckel här
const LINE_ID = "901";

async function loadTrips() {
    const res = await fetch("data/trips-901.json");
    return await res.json();
}

// Realtidsdata från Trafiklab
async function fetchRealtimeBuses() {
    const url = `https://realtime-api.trafiklab.se/v1/vehiclepositions?key=${API_KEY}&lineRef=${LINE_ID}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        // Transformera till buss-objekt: vehicleRef, directionId, lastStopId, nextStopId
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
        const ratio = 0.5;
        const pos = (prevIndex >= 0 && nextIndex >= 0) ? step * (prevIndex + ratio) : 0;

        const busDiv = document.createElement("div");
        busDiv.className = bus.directionId === 1 ? "bus bus-left" : "bus bus-right";
        busDiv.style.top = `${pos}px`;
        busDiv.innerHTML = bus.directionId === 1 ? "↑" : "↓";
        container.appendChild(busDiv);
    });
}

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
