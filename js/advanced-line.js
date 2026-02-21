const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Sätt din nyckel här
const LINE_ID = "901"; // Linje 901

async function loadTrips() {
    const res = await fetch("data/trips-901.json");
    return await res.json();
}

// Dummy-funktion för realtidsbussar – ersätt med Trafiklab API
async function fetchRealtimeBuses() {
    // Exempel med två bussar
    return [
        { vehicleRef: "901-1", directionId: 1, lastStopId: "740022236", nextStopId: "740035993" },
        { vehicleRef: "901-2", directionId: 2, lastStopId: "740022299", nextStopId: "740075537" }
    ];
}

function drawLine(trip, container) {
    const height = 500;
    const step = height / (trip.calls.length - 1);

    trip.calls.forEach((stop, i) => {
        const stopDiv = document.createElement("div");
        stopDiv.className = "stop";
        stopDiv.style.top = `${i * step}px`;
        stopDiv.innerText = stop.stop.name;
        container.appendChild(stopDiv);
    });

    return step;
}

function placeBuses(trips, buses, container) {
    buses.forEach(bus => {
        const trip = bus.directionId === 1 
            ? trips.find(t => t.direction.includes("→ Karlstad"))
            : trips.find(t => t.direction.includes("→ Lövnäs"));

        if (!trip) return;
        const calls = trip.calls;
        const prevIndex = calls.findIndex(c => c.stop.id === bus.lastStopId);
        const nextIndex = calls.findIndex(c => c.stop.id === bus.nextStopId);
        const step = 500 / (calls.length - 1);

        const ratio = 0.5; // Buss mitt mellan hållplatser
        const pos = step * (prevIndex + ratio);

        const busDiv = document.createElement("div");
        busDiv.className = "bus " + (trip.direction.includes("→ Karlstad") ? "direction-up" : "direction-down");
        busDiv.style.top = `${pos}px`;
        container.appendChild(busDiv);
    });
}

async function renderLine() {
    const container = document.getElementById("line-container");
    container.innerHTML = '<div class="line" id="line"></div>';

    const trips = await loadTrips();
    const buses = await fetchRealtimeBuses();

    trips.forEach(trip => drawLine(trip, container));
    placeBuses(trips, buses, container);

    setTimeout(renderLine, 30000);
}

renderLine();
