const API_KEY = "d04e6df880fd4f33bd14a706425b0994";

// Hållplatser vi följer
const stopsToFollow = [
    { name: "901 från 740025756", stopId: "740025756" },
    { name: "901 från 740010760", stopId: "740010760" }
];

// Ladda statiska turer från trips-901.json
async function loadStaticTrips() {
    const resp = await fetch("data/trips-901.json");
    return await resp.json(); // Array av turer { trip_id, start_date, calls: [{stop:{id,name}, scheduledArrival}] }
}

// Formatera tid
function formatTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

// Bygg HTML för ett stopp
function buildStopHtml(label, stop) {
    if (!stop) return `<div class="bus-status">${label}: Inget</div>`;
    let delayText = stop.arrivalDelayMin ? `(${stop.arrivalDelayMin} min)` : "";
    return `<div class="bus-status ${stop.statusClass || ''}">${label}: <b>${stop.stop.name}</b> – Realtid: ${formatTime(stop.realtimeArrival || stop.scheduledArrival)} ${delayText}</div>`;
}

// Hitta föregående, nuvarande, nästa
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

// Hämta realtidsdata och matcha mot trip_id
async function applyRealtime(trip, stopId) {
    try {
        const url = `https://realtime-api.trafiklab.se/v1/arrivals/${stopId}?key=${API_KEY}`;
        const arrivalsData = await fetch(url).then(r => r.json());
        // Matcha trip_id
        const realtimeTrip = arrivalsData.arrivals.find(a => a.trip.trip_id === trip.trip_id);
        if (!realtimeTrip) return; // Ingen realtidsdata
        // Hitta aktuellt stopp i calls
        const call = trip.calls.find(c => c.stop.id === stopId);
        if (call) {
            call.realtimeArrival = realtimeTrip.realtime;
            call.arrivalDelayMin = Math.round((realtimeTrip.delay || 0)/60);
            call.statusClass = realtimeTrip.canceled ? "canceled" : (realtimeTrip.delay>0 ? "late" : (realtimeTrip.delay<0 ? "early":"on-time"));
        }
    } catch(e) {
        console.warn("Realtidsdata misslyckades", e);
    }
}

// Visa alla turer
async function showTrips() {
    const container = document.getElementById("app");
    container.innerHTML = "";

    const trips = await loadStaticTrips();

    for (const stopInfo of stopsToFollow) {
        // Hitta nästa tur baserat på statisk tidtabell
        const now = new Date();
        const nextTrip = trips.find(t => {
            const call = t.calls.find(c => c.stop.id === stopInfo.stopId);
            if (!call) return false;
            return new Date(call.scheduledArrival) > now;
        });

        if (!nextTrip) {
            container.innerHTML += `<div class="stop-card"><div class="stop-header">${stopInfo.name}</div>Ingen kommande tur idag</div>`;
            continue;
        }

        await applyRealtime(nextTrip, stopInfo.stopId);

        const { prev, current, next } = getPrevNextStop(nextTrip.calls, stopInfo.stopId);

        let html = `<div class="stop-card"><div class="stop-header">${stopInfo.name} (${nextTrip.trip_id})</div>`;
        html += buildStopHtml("Föregående stopp", prev);
        html += buildStopHtml("Nuvarande stopp", current);
        html += buildStopHtml("Nästa stopp", next);
        html += `</div>`;

        container.innerHTML += html;
    }

    container.innerHTML += `<div class="footer">Uppdateras automatiskt var 30:e sekund</div>`;
}

showTrips();
setInterval(showTrips, 30000);
