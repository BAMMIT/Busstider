const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Sätt din nyckel här
const LINE_ID = "901"; // Linjen du vill följa

// Ladda statiska hållplatser
async function loadStops() {
    const resp = await fetch("data/trips-901.json");
    return await resp.json(); // Array med direction + calls
}

// Hämta realtidsdata för linjen
async function fetchRealtime() {
    try {
        const url = `https://api.trafiklab.se/v1/realtime/vehiclemonitoring?key=${API_KEY}&lineRef=${LINE_ID}`;
        const resp = await fetch(url);
        const data = await resp.json();
        // Returnera array med bussar: {vehicleRef, lat, lon, directionId, lastStopId, nextStopId}
        return data.vehiclePositions || [];
    } catch (e) {
        console.warn("Realtidsdata misslyckades:", e);
        return [];
    }
}

// Rita linje och hållplatser
function drawLine(stops, container) {
    container.innerHTML = "";
    const height = 500;
    const step = height / (stops.length - 1);

    stops.forEach((stop, i) => {
        const stopDiv = document.createElement("div");
        stopDiv.className = "stop";
        stopDiv.style.top = `${i * step}px`;
        stopDiv.innerText = stop.stop.name;
        container.appendChild(stopDiv);
    });

    return step;
}

// Placera bussar på linjen
function placeBuses(trips, step, buses, container) {
    buses.forEach(bus => {
        // Hitta rätt direction
        const trip = trips.find(t => bus.directionId === 1 ? t.direction.includes("→ Karlstad") : t.direction.includes("→ Lövnäs"));
        if (!trip) return;

        const calls = trip.calls;
        let prevIndex = calls.findIndex(c => c.stop.id === bus.lastStopId);
        let nextIndex = calls.findIndex(c => c.stop.id === bus.nextStopId);

        if (prevIndex === -1) prevIndex = 0;
        if (nextIndex === -1) nextIndex = calls.length - 1;

        const ratio = 0.5; // Vi kan approximera mitten mellan hållplatser
        const pos = step * (prevIndex + ratio);

        const busDiv = document.createElement("div");
        busDiv.className = "bus " + (trip.direction.includes("→ Karlstad") ? "direction-up" : "direction-down");
        busDiv.style.top = `${pos}px`;
        container.appendChild(busDiv);
    });
}

// Huvudfunktion
async function showLine() {
    const container = document.getElementById("line");
    const trips = await loadStops();
    const buses = await fetchRealtime();

    // Rita båda riktningar separat
    trips.forEach(trip => {
        const step = drawLine(trip.calls, container);
        placeBuses(trips, step, buses, container);
    });

    setTimeout(showLine, 30000); // Uppdatera var 30:e sekund
}

showLine();
