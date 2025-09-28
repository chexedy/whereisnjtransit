let twochar = {};
let line_database = {};

const departureCache = {};
const departureHistoryCache = {};

fetch("json/2char.json")
    .then(res => res.json())
    .then(data => {
        twochar = data;
    });

fetch("json/line-database.json")
    .then(res => res.json())
    .then(data => {
        line_database = data["line-database"];
    });

function togglePanel(panel) {
    if (panel.classList.contains("open")) {
        panel.style.height = panel.scrollHeight + "px";
        requestAnimationFrame(() => {
            panel.style.height = "0px";
        });
        panel.classList.remove("open");
    } else {
        panel.style.height = "auto";
        const height = panel.scrollHeight + "px";
        panel.style.height = "0px";
        requestAnimationFrame(() => {
            panel.style.height = height;
        });
        panel.classList.add("open");

        panel.addEventListener("transitionend", () => {
            if (panel.classList.contains("open")) {
                panel.style.height = "auto";
            }
        }, { once: true });
    }
}


function updateStation(departures) {
    if (departures.length == 0) {
        document.getElementById("NoCurrentDepartures").style.display = "flex";
    } else {
        departures.forEach(obj => {
            if (new Date(new Date(obj.dep_time).getTime() + (obj.sec_late ? obj.sec_late * 1000 : 0)) <= new Date()) {
                console.log("Train already departed..");
                return;
            }

            departureHistoryCache[obj.train_id] = { sec_late: obj.sec_late };

            var newDiv = document.getElementById("default").cloneNode(true);
            newDiv.id = obj.train_id;
            newDiv.querySelector("img").src = line_database[obj.line].image;

            var inner = newDiv.querySelector("#station_route_inner");
            inner.id = obj.train_id + "." + inner.id;

            var inner1 = inner.querySelector("#station_route_inner1");
            inner1.id = obj.train_id + "." + inner.id;
            inner1.querySelector("h1").innerHTML = obj.destination;
            inner1.querySelector("h3").innerHTML = line_database[obj.line].abbreviation + " " + obj.train_id;

            var inner2 = inner.querySelector("#station_route_inner2");
            inner2.id = obj.train_id + "." + inner.id;

            if (obj.sec_late) {
                const minutes = Math.floor(obj.sec_late / 60) + "m";
                const scheduled = new Date(obj.dep_time.replace(" ", "T"));
                const estimated = new Date(scheduled.getTime() + obj.sec_late * 1000);

                const hh = String(estimated.getHours()).padStart(2, "0");
                const mm = String(estimated.getMinutes()).padStart(2, "0");
                const estimatedStr = `${hh}:${mm}`;

                inner2.querySelector("h1").innerHTML = estimatedStr;

                if (obj.sec_late < 0) {
                    inner2.querySelector("h3").style.color = "green";
                    inner2.querySelector("h3").innerHTML = "Early " + minutes.substring(1);
                } else {
                    inner2.querySelector("h3").style.color = "red";
                    inner2.querySelector("h3").innerHTML = "Delayed " + minutes;
                }
            } else {
                const estimated = new Date(obj.dep_time.replace(" ", "T"));

                const hh = String(estimated.getHours()).padStart(2, "0");
                const mm = String(estimated.getMinutes()).padStart(2, "0");
                const estimatedStr = `${hh}:${mm}`;

                inner2.querySelector("h1").innerHTML = estimatedStr;
                inner2.querySelector("h3").style.color = "green";
                inner2.querySelector("h3").innerHTML = "On Time";
            }

            const infoPanel = newDiv.querySelector(".station_info");
            newDiv.style.display = "flex";

            newDiv.addEventListener("click", async () => {
                const infoPanel = newDiv.querySelector(".station_info");

                document.querySelectorAll(".station_info").forEach(panel => {
                    if (panel !== infoPanel && panel.classList.contains("open")) {
                        togglePanel(panel);
                    }
                });

                if (!infoPanel.classList.contains("open")) {
                    await updateTrainHistory(infoPanel, obj.train_id);
                }

                togglePanel(infoPanel);
            });

            document.getElementById("stationRoutes").appendChild(newDiv);
        });
    }
}

async function updateTrainHistory(infoPanel, id) {
    if (!departureHistoryCache[id]?.history) {
        const url = `https://whereisnjtransit-schedule.ayaan7m.workers.dev/history?id=${encodeURIComponent(id)}`
        const res = await fetch(url);
        const history = await res.json();

        departureHistoryCache[id].history = history;
        console.log("Got data from fetch");
    } else {
        console.log("Used cache");
    }

    const data = departureHistoryCache[id].history;
    console.log(data);

    const stationCol = infoPanel.querySelector(".station_col");
    const scheduledCol = infoPanel.querySelector(".scheduled_col");
    const statusCol = infoPanel.querySelector(".status_col");

    stationCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    scheduledCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    statusCol.querySelectorAll("h4").forEach(h4 => h4.remove());

    const now = new Date();
    let trainReachedNext = false;

    for (const stop of data) {
        const stopTime = new Date(stop.dep_time.replace(" ", "T"));
        const stationName = stop.station_name;

        let statusText = "";
        let statusColor = "black";
        let stationColor = "black";

        if (stationName === document.getElementById("stationStatusName").innerHTML) {
            stationColor = "green";
        }

        const timeDiff = (stopTime.getTime() - now.getTime()) / 1000

        if (timeDiff <= 119 && timeDiff >= 0) {
            statusText = "All Aboard";
            statusColor = "green";
            trainReachedNext = true;
        } else if (stopTime.getTime() < now.getTime()) {
            statusText = "Departed";
            statusColor = "red";
        } else if (!trainReachedNext) {
            trainReachedNext = true;

            const secLate = departureHistoryCache[id]?.sec_late ?? 0;
            if (secLate > 0) {
                statusText = `Delayed ${Math.floor(secLate / 60)}m`;
                statusColor = "red";
            } else {
                statusText = "On Time";
                statusColor = "green";
            }
        } else {
            statusText = " ";
            statusColor = "black";
        }

        const station = document.createElement("h4");
        const schedule = document.createElement("h4");
        const status = document.createElement("h4");

        station.innerHTML = stationName;
        station.style.color = stationColor; // gold for current station
        schedule.innerHTML = `${String(stopTime.getHours()).padStart(2, '0')}:${String(stopTime.getMinutes()).padStart(2, '0')}`;
        status.innerHTML = statusText;
        status.style.color = statusColor;

        stationCol.appendChild(station);
        scheduledCol.appendChild(schedule);
        statusCol.appendChild(status);
    }
}

async function updateStationStatus(map, name) {
    document.getElementById("NoCurrentDepartures").style.display = "none";
    document.getElementById("NoCurrentDepartures").innerHTML = "No current departures. Contact me on GitHub if you think this is a mistake."
    document.getElementById("stationStatusName").textContent = name;

    const url = `https://whereisnjtransit-schedule.ayaan7m.workers.dev/departures?station=${encodeURIComponent(twochar[name])}&limit=15`;

    const routes = document.getElementById("stationRoutes");
    Array.from(routes.children).forEach(child => {
        if (child.id !== 'default' && child.id !== 'NoCurrentDepartures') {
            child.remove();
        }
    });

    if (departureCache[twochar[name]]) {
        updateStation(departureCache[twochar[name]])
        console.log("Used cache");
    } else {
        try {
            const res = await fetch(url);
            const departures = await res.json();

            updateStation(departures);

            departureCache[twochar[name]] = departures;
            console.log(departures);
            console.log("Used fetch")
        } catch (error) {
            console.error("Failed to fetch departures:", error);
            document.getElementById("NoCurrentDepartures").style.display = "flex";
            document.getElementById("NoCurrentDepartures").innerHTML = "Error loading departures";
        }
    }

    station_open();
}

function msUntilNext10Min() {
    const now = new Date();
    const estNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );

    const minutes = estNow.getMinutes();
    const next = Math.ceil(minutes / 10) * 10;

    estNow.setMinutes(next, 0, 0);
    return estNow.getTime() - Date.now();
}

function scheduleTask() {
    const delay = msUntilNext10Min();

    setTimeout(() => {
        reset10Mins();
        setInterval(reset10Mins(), 10 * 60 * 1000);
    }, delay);
}

function reset10Mins() {
    departureCache.length = 0;
    departureHistoryCache.length = 0;
}

scheduleTask();