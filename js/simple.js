const API_KEY = "d04e6df880fd4f33bd14a706425b0994"; // Byt mot din nyckel

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
    const hasRealtime = !!item.realtime;
    const realtime = hasRealtime ? formatTime(item.realtime) : null;
    const delaySeconds = item.delay ?? null;
    const canceled = item.canceled;

    let statusClass = "static";   // svart som default
    let timeText = scheduled;     // visa tidtabellstid om inget annat finns

    if (canceled) {
        statusClass = "canceled";
        timeText = "Inställd";
    } 
    else if (hasRealtime && delaySeconds !== null) {
        if (delaySeconds > 0) {
            statusClass = "late";
            timeText = `${realtime} (+${Math.round(delaySeconds/60)} min)`;
        } else {
            statusClass = "on-time";
            timeText = realtime;
        }
    }

    return 
       <div class="bus-item"> 
           <div> 
               <div class="bus-line">Linje ${item.route.designation}</div> 
               <div class="bus-direction">Mot ${item.route.direction}</div>    
           </div> 
               <div class="bus-time ${statusClass}"> ${timeText} </div>
               <div class="scheduled-time"> Tidtabell: ${scheduled} </div> 
           </div>
    ;
}

async function fetchStop(stopId) {
    const endpoint = `https://realtime-api.trafiklab.se/v1/arrivals/${stopId}?key=${API_KEY}`;
    const arrivals = await (await fetch(endpoint)).json();
    const departures = await (await fetch(`https://realtime-api.trafiklab.se/v1/departures/${stopId}?key=${API_KEY}`)).json();
    return { stops: arrivals.stops, arrivals: arrivals.arrivals, departures: departures.departures };
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

            html += `<div class="column-title">Ankomster</div>`;
            data.arrivals.slice(0,6).forEach(item => html += buildRow(item));

            html += `<div class="column-title">Avgångar</div>`;
            data.departures.slice(0,6).forEach(item => html += buildRow(item));

            html += `</div>`;
            container.innerHTML += html;

        } catch {
            container.innerHTML += `<div class="stop-card">Kunde inte hämta hållplats ${stop}</div>`;
        }
    }

    container.innerHTML += `<div class="footer">Uppdateras automatiskt var 30:e sekund</div>`;
}

loadData();
setInterval(loadData, 60000);
