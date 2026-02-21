// Vi tar bort API_KEY här helt
// Widgeten hämtar nu via proxy (kommer snart)

// Stopp hämtas från URL: ?stop=740025756,740074894
function getParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        stops: (params.get("stop") || "").split(",")
    };
}

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

// Hämta data via proxy
async function fetchStop(stopId) {
    const proxyUrl = `https://billowing-paper-c04c.mr-joakim-bang.workers.dev/`;
    const response = await fetch(proxyUrl);
    return response.json();
}

async function loadData() {
    const { stops } = getParams();
    const container = document.getElementById("app");
    container.innerHTML = "";

    for (const stop of stops) {
        if (!stop) continue;

        try {
            const data = await fetchStop(stop);

            const stopName = data.stops[0]?.name || "Hållplats";

            let html = `<div class="stop-card"><div class="stop-header">Ankomster & Avgångar – ${stopName}</div>`;

            // Ankomster
            html += `<div class="column-title">Ankomster</div>`;
            data.arrivals.slice(0, 6).forEach(item => html += buildRow(item));

            // Avgångar
            html += `<div class="column-title">Avgångar</div>`;
            data.departures.slice(0, 6).forEach(item => html += buildRow(item));

            html += `</div>`;
            container.innerHTML += html;

        } catch {
            container.innerHTML += `<div class="stop-card">Kunde inte hämta hållplats ${stop}</div>`;
        }
    }

    container.innerHTML += `<div class="footer">Uppdateras automatiskt var 30:e sekund</div>`;
}

loadData();
setInterval(loadData, 30000);
