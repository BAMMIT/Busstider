const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Sätt din nyckel här
const LINE_ID = "901"; // Linje 901

async function loadTrips() {
    const res = await fetch("data/trips-901.json");
    return await res.json();
}

// Dummy realtidsdata – ersätt med Trafiklab API i produktion
async function fetchRealtimeBuses() {
    return [
        { vehicleRef: "901-1", directionId: 1, lastStopId: "740022236", nextStopId: "740035993" },
        { vehicleRef: "901-2", directionId: 2, lastStopId: "740022299", nextStopId: "740075537" }
    ];
}

function drawStops(trip, container, indexMap) {
    const height = 500;
    const step = height / Math.max(...trip.calls.map((_, i) => i));
    
    trip.calls.forEach((stop, i) => {
        // Avgör position: vänster, center, höger
        let side = "center"; 
        if (!indexMap.other.includes(stop.stop.id)) side = trip.direction.includes("→ Karlstad") ? "left" : "right";

        const stopDiv = document.createElement("div");
        stopDiv.className = `stop ${side}`;
        stopDiv.style.top = `${i * step}px`;
        stopDiv.innerText = stop.stop.name;
        container.appendChild(stopDiv);
    });

    return step;
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
        const ratio = 0.5; // mellan hållplatser
        const pos = step * (prevIndex + ratio);

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

    // Skapa index-map för att avgöra utskott
    const idsKarlstad = trips[0].calls.map(c => c.stop.id);
    const idsLövnas = trips[1].calls.map(c => c.stop.id);

    const step = 500 / Math.max(idsKarlstad.length, idsLövnas.length);
    trips.forEach(trip => drawStops(trip, container, {other: trip.direction.includes("→ Karlstad") ? idsLövnas : idsKarlstad}));

    const buses = await fetchRealtimeBuses();
    placeBuses(trips, buses, container);

    setTimeout(renderLine, 30000);
}

renderLine();
