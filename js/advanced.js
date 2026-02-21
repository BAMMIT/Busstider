const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Byt mot din nyckel

const options = [
    { name: "Alternativ 1 (byte)", start: "740074894", via: "740072181", direct: false },
    { name: "Alternativ 2 (direkt)", start: "740025756", via: null, direct: true }
];

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function buildRow(item) {
    const scheduled = formatTime(item.scheduled);
    const realtime = formatTime(item.realtime);
    const delay = item.delay;
    const canceled = item.canceled;

    let statusClass = "on-time";
    let timeText = realtime;

    if (canceled) {
        timeText = "Inställd";
    } else if (delay < 0) {
        statusClass = "early";
        timeText = `${realtime} (${Math.abs(delay)} min tidig)`;
    } else if (delay > 0) {
        statusClass = "late";
        timeText = `${realtime} (+${Math.round(delay/60)} min)`;
    }

    return `
        <div class="bus-item">
            <div>
                <div class="bus-line">Linje ${item.route.designation}</div>
                <div class="bus-direction">Mot ${item.route.direction}</div>
            </div>
            <div class="bus-time ${statusClass}">
                ${canceled ? `<span class="canceled">Inställd</span>` : timeText}
                <div style="font-size:12px;color:#888;font-weight:400;">
                    Tidtabell: ${scheduled}
                </div>
            </div>
        </div>
    `;
}

async function fetchStop(stopId) {
    const arrivals = await (await fetch(`https://realtime-api.trafiklab.se/v1/arrivals/${stopId}?key=${API_KEY}`)).json();
    const departures = await (await fetch(`https://realtime-api.trafiklab.se/v1/departures/${stopId}?key=${API_KEY}`)).json();
    return { stops: arrivals.stops, arrivals: arrivals.arrivals, departures: departures.departures };
}

async function loadData() {
    const container = document.getElementById("app");
    container.innerHTML = "";

    for (const opt of options) {
        try {
            const data = await fetchStop(opt.start);
            const stopName = data.stops[0]?.name || "Hållplats";

            let html = `<div class="stop-card"><div class="stop-header">${opt.name} – ${stopName}</div><div class="columns">`;

            // Ankomster vänster
            html += `<div><div class="column-title">Ankomster</div>`;
            data.arrivals.slice(0,6).forEach(item => html += buildRow(item));
            html += `</div>`;

            // Avgångar höger
            html += `<div><div class="column-title">Avgångar</div>`;
            data.departures.slice(0,6).forEach(item => html += buildRow(item));
            html += `</div>`;

            html += `</div></div>`;
            container.innerHTML += html;

        } catch {
            container.innerHTML += `<div class="stop-card">Kunde inte hämta ${opt.name}</div>`;
        }
    }

    container.innerHTML += `<div class="footer">Uppdateras automatiskt var 30:e sekund</div>`;
}

loadData();
setInterval(loadData, 30000);
