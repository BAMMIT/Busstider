//const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Byt till din nyckel

// Buss 901, två turer
//const trips = [
//    { name: "901 från 740025756", trip_id: "175500000278576297", start_date: "2026-02-21", stopId: "740025756" },
//    { name: "901 från 740010760", trip_id: "175500000277463594", start_date: "2026-02-21", stopId: "740010760" }
//];

const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Byt mot din nyckel

// Hållplatser att följa
const stopsToFollow = [
    { name: "901 från 740025756", stopId: "740025756" },
    { name: "901 från 740010760", stopId: "740010760" }
];

function formatTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

// Bygger HTML för ett stopp
function buildStopHtml(label, stop) {
    if (!stop) return `<div class="bus-status">${label}: Inget</div>`;
    const delayMin = Math.round((stop.arrivalDelay || 0)/60);
    let delayText = "";
    let delayClass = "on-time";
    if (stop.arrivalCanceled === "True") { delayText = "Inställd"; delayClass="canceled"; }
    else if (delayMin > 0) { delayText = `+${delayMin} min`; delayClass="late"; }
    else if (delayMin < 0) { delayText = `${Math.abs(delayMin)} min tidig`; delayClass="early"; }
    return `
        <div class="bus-status ${delayClass}">
            ${label}: <b>${stop.stop.name}</b> – Realtid: ${formatTime(stop.realtimeArrival)} (${delayText})<br>
            Tidtabell: ${formatTime(stop.scheduledArrival)}
        </div>
    `;
}

// Hämta första aktiva trip_id för en hållplats
async function getCurrentTripId(stopId) {
    const arrivalsData = await fetch(`https://realtime-api.trafiklab.se/v1/arrivals/${stopId}?key=${API_KEY}`)
        .then(r => r.json());
    // Hämta första busslinje 901 som inte är inställd
    const trip = arrivalsData.arrivals.find(a => a.route.designation === "901" && !a.canceled);
    if (!trip) return null;
    return { tripId: trip.trip.trip_id, startDate: trip.trip.start_date };
}

// Hämta Trips API
async function fetchTrip(tripId, startDate) {
    const url = `https://realtime-api.trafiklab.se/v1/trips/${tripId}/${startDate}?key=${API_KEY}`;
    const resp = await fetch(url);
    return await resp.json();
}

// Hitta föregående, nuvarande och nästa stopp
function getPrevNextStop(calls, currentStopId) {
    let prev = null, current = null, next = null;
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

// Huvudfunktion
async function showTrips() {
    const container = document.getElementById("app");
    container.innerHTML = "";

    for (const stopInfo of stopsToFollow) {
        try {
            const tripRef = await getCurrentTripId(stopInfo.stopId);
            if (!tripRef) {
                container.innerHTML += `<div class="stop-card"><div class="stop-header">${stopInfo.name}</div>Kunde inte hitta aktuell tur</div>`;
                continue;
            }

            const tripData = await fetchTrip(tripRef.tripId, tripRef.startDate);
            const { prev, current, next } = getPrevNextStop(tripData.calls, stopInfo.stopId);

            let html = `<div class="stop-card"><div class="stop-header">${stopInfo.name} (${tripData.route.designation})</div>`;
            html += buildStopHtml("Föregående stopp", prev);
            html += buildStopHtml("Nuvarande stopp", current);
            html += buildStopHtml("Nästa stopp", next);
            html += `</div>`;

            container.innerHTML += html;

        } catch (err) {
            container.innerHTML += `<div class="stop-card"><b>${stopInfo.name}</b> – Kunde inte hämta data (${err.message})</div>`;
        }
    }

    container.innerHTML += `<div class="footer">Uppdateras automatiskt var 30:e sekund</div>`;
}

showTrips();
setInterval(showTrips, 30000);
