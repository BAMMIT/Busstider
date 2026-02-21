const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Byt till din nyckel

// Buss 901, två turer
const trips = [
    { name: "901 från 740025756", trip_id: "175500000278576297", start_date: "2026-02-21", stopId: "740025756" },
    { name: "901 från 740010760", trip_id: "175500000277463594", start_date: "2026-02-21", stopId: "740010760" }
];

function formatTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

async function fetchTrip(trip) {
    const url = `https://realtime-api.trafiklab.se/v1/trips/${trip.trip_id}/${trip.start_date}?key=${API_KEY}`;
    const resp = await fetch(url);
    return await resp.json();
}

function getPrevNextStop(calls, currentStopId) {
    let prev = null, next = null, current = null;

    for (let i=0; i<calls.length; i++) {
        if (calls[i].stop.id === currentStopId) {
            current = calls[i];
            prev = i>0 ? calls[i-1] : null;
            next = i<calls.length-1 ? calls[i+1] : null;
            break;
        }
    }
    return { prev, current, next };
}

function buildStopHtml(label, stop) {
    if (!stop) return `<div class="bus-status">${label}: Inget</div>`;
    const delayMin = Math.round((stop.arrivalDelay || 0)/60);
    let delayText = "";
    let delayClass = "on-time";
    if (stop.arrivalCanceled === "True") { delayText = "Inställd"; delayClass="canceled"; }
    else if (delayMin > 0) { delayText = `+${delayMin} min`; delayClass="late"; }
    else if (delayMin < 0) { delayText = `${delayMin} min tidig`; delayClass="early"; }
    return `
        <div class="bus-status">
            ${label}: <b>${stop.stop.name}</b> – Realtid: ${formatTime(stop.realtimeArrival)} (${delayText})<br>
            Tidtabell: ${formatTime(stop.scheduledArrival)}
        </div>
    `;
}

async function showTrips() {
    const container = document.getElementById("app");
    container.innerHTML = "";

    for (const t of trips) {
        try {
            const data = await fetchTrip(t);
            const calls = data.calls || [];

            const { prev, current, next } = getPrevNextStop(calls, t.stopId);

            let html = `<div class="stop-card"><div class="stop-header">${t.name} (${data.route.designation})</div>`;
            html += buildStopHtml("Föregående stopp", prev);
            html += buildStopHtml("Nuvarande stopp", current);
            html += buildStopHtml("Nästa stopp", next);
            html += `</div>`;

            container.innerHTML += html;

        } catch (err) {
            container.innerHTML += `<div class="stop-card"><b>${t.name}</b> – Kunde inte hämta data (${err.message})</div>`;
        }
    }

    container.innerHTML += `<div class="footer">Uppdateras automatiskt var 30:e sekund</div>`;
}

showTrips();
setInterval(showTrips, 30000);
