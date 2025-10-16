let twochar = {};
let line_database = {};
let stations = {};

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

const stationMap = {};

fetch("json/stations.json")
    .then(res => res.json())
    .then(data => {
        stations = data.stations;
        for (const feature of stations.features) {
            stationMap[feature.properties.description] = feature.geometry.coordinates;
        }
    });

function togglePanel(panel, newDiv) {
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
            const estimatedDep = new Date(new Date(obj.dep_time).getTime() + obj.sec_late);
            const dwellMs = (obj.dwell || 0) * 1000;

            if (!departureHistoryCache[obj.train_id]) {
                departureHistoryCache[obj.train_id] = {};
            }
            departureHistoryCache[obj.train_id].sec_late = obj.sec_late;

            var newDiv = document.getElementById("default").cloneNode(true);
            newDiv.id = obj.train_id;
            console.log(obj);
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
                let minutes;
                if (Math.abs(obj.sec_late) < 60) {
                    minutes = `${obj.sec_late}s`;
                } else {
                    minutes = `${Math.floor(obj.sec_late / 60)}m`;
                }

                const scheduled = new Date(obj.dep_time.replace(" ", "T"));
                const estimated = new Date(scheduled.getTime() + obj.sec_late * 1000);
                if (estimated.getTime() < new Date().getTime()) {
                    return;
                }

                const hours = estimated.getHours();
                const mins = estimated.getMinutes();

                inner2.querySelector("h1").innerHTML = formatTime(hours, mins);

                const diffMs = estimated - new Date();
                if (diffMs <= 60 * 1000 && diffMs > 0) {
                    inner2.querySelector("h3").style.color = "orange";
                    inner2.querySelector("h3").innerHTML = "All Aboard";
                } else if (obj.sec_late < 0) {
                    inner2.querySelector("h3").style.color = "green";
                    inner2.querySelector("h3").innerHTML = "Early " + minutes.substring(1);
                } else {
                    inner2.querySelector("h3").style.color = "red";
                    inner2.querySelector("h3").innerHTML = "Delayed " + minutes;
                }
            } else {
                const estimated = new Date(obj.dep_time.replace(" ", "T"));
                if (estimated.getTime() < new Date().getTime()) {
                    return;
                }

                const hours = estimated.getHours();
                const minutes = estimated.getMinutes();
                const diffMs = estimated - new Date();
                inner2.querySelector("h1").innerHTML = formatTime(hours, minutes);

                if (diffMs <= 60 * 1000 && diffMs > 0) {
                    inner2.querySelector("h3").style.color = "orange";
                    inner2.querySelector("h3").innerHTML = "All Aboard";
                } else {
                    inner2.querySelector("h3").style.color = "green";
                    inner2.querySelector("h3").innerHTML = "On Time";
                }
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

                togglePanel(infoPanel, newDiv);
            });

            document.getElementById("stationRoutes").appendChild(newDiv);
        });

        let totaldiv = 0;
        const stationRoutes = document.getElementById("stationRoutes");

        for (const node of stationRoutes.childNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "DIV") {
                totaldiv += 1;
            }
        }

        if (totaldiv <= 1) {
            document.getElementById("NoCurrentDepartures").style.display = "flex";
        }
    }
}

async function updateTrainHistory(infoPanel, id) {
    const url = `https://whereisnjtransit-api.ayaan7m.workers.dev/history?id=${encodeURIComponent(id)}`;
    const res = await fetch(url);
    const history = await res.json();

    const now = new Date();
    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const seenStops = new Set();
    const filtered = [];

    for (const stop of history) {
        const stopDate = new Date(stop.dep_time.replace(" ", "T") + "Z");

        if (stopDate < now || stopDate > sixHoursLater) continue;

        const key = `${stop.station_name}-${stopDate.getUTCHours()}-${stopDate.getUTCMinutes()}`;
        if (!seenStops.has(key)) {
            seenStops.add(key);
            filtered.push(stop);
        }
    }

    departureHistoryCache[id].history = filtered;
    const data = departureHistoryCache[id].history;

    const stationCol = infoPanel.querySelector(".station_col");
    const scheduledCol = infoPanel.querySelector(".scheduled_col");
    const statusCol = infoPanel.querySelector(".status_col");

    stationCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    scheduledCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    statusCol.querySelectorAll("h4").forEach(h4 => h4.remove());

    let trainReachedNext = false;

    for (const stop of data) {
        const secLate = departureHistoryCache[id].sec_late || 0;
        const stopTime = new Date(stop.dep_time.replace(" ", "T") + "Z");
        const scheduledTime = new Date(stop.dep_time.replace(" ", "T") + "Z");

        stopTime.setTime(stopTime.getTime() + (secLate * 1000));

        const stationName = stop.station_name;

        let statusText = "";
        let statusColor = "black";
        let stationColor = "black";

        if (stationName === document.getElementById("stationStatusName").innerHTML) {
            stationColor = "green";
        }

        const timeDiff = (stopTime - now) / 1000;

        if (timeDiff <= 119 && timeDiff >= 0) {
            statusText = "All Aboard";
            statusColor = "orange";
            trainReachedNext = true;
        } else if (stopTime < now) {
            statusText = "Departed";
            statusColor = "red";
        } else if (!trainReachedNext) {
            trainReachedNext = true;

            if (secLate > 0) {
                let delayStr = Math.abs(secLate) < 60
                    ? `${secLate}s`
                    : `${Math.floor(secLate / 60)}m`;

                statusText = `Delayed ${delayStr}`;
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
        station.style.color = stationColor;

        const hours = scheduledTime.getUTCHours();
        const minutes = scheduledTime.getUTCMinutes();

        schedule.innerHTML = formatTime(hours, minutes);
        status.innerHTML = statusText;
        status.style.color = statusColor;

        stationCol.appendChild(station);
        scheduledCol.appendChild(schedule);
        statusCol.appendChild(status);
    }
}


async function updateStationStatus(name) {
    document.getElementById("NoCurrentDepartures").style.display = "none";
    document.getElementById("NoCurrentDepartures").innerHTML = "No current departures. Contact me on GitHub if you think this is a mistake."
    document.getElementById("stationStatusName").textContent = name;

    const url = `https://whereisnjtransit-api.ayaan7m.workers.dev/departures?station=${encodeURIComponent(twochar[name])}&limit=15`;

    const routes = document.getElementById("stationRoutes");
    Array.from(routes.children).forEach(child => {
        if (child.id !== 'default' && child.id !== 'NoCurrentDepartures') {
            child.remove();
        }
    });

    try {
        const res = await fetch(url);
        const departures = await res.json();

        updateStation(departures);
    } catch (error) {
        console.error("Failed to fetch departures:", error);
        document.getElementById("NoCurrentDepartures").style.display = "flex";
        document.getElementById("NoCurrentDepartures").innerHTML = "Error loading departures";
    }

    station_open();
}

function getClosestPoint(longitude, latitude, geojson) {
    const point = turf.point([longitude, latitude]);
    let closestPoint = null;
    let minDistance = Infinity;

    console.log(geojson.features);
    for (const feature of geojson.features) {
        const snapped = turf.nearestPointOnLine(feature, point);
        const dist = turf.distance(point, snapped);
        if (dist < minDistance) {
            minDistance = dist;
            closestPoint = snapped;
        }
    }

    console.log("Closest point:", closestPoint.geometry.coordinates);
    console.log("Distance (km):", minDistance);
    return closestPoint;
}

const searchInput = document.getElementById("stationSearch");
const searchResults = document.getElementById("searchResults");
const resultEls = [
    document.getElementById("ResultOne"),
    document.getElementById("ResultTwo"),
    document.getElementById("ResultThree")
];

searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    if (!query) {
        searchResults.classList.remove("open");
        return;
    }

    const matches = Object.keys(stationMap)
        .filter(name => name.toLowerCase().includes(query))
        .slice(0, 3);

    resultEls.forEach((el, i) => {
        if (matches[i]) {
            el.textContent = matches[i];
            el.style.display = "block";
            el.onclick = () => {
                const coords = stationMap[matches[i]];
                console.log("Zoom to:", matches[i], coords);

                map.flyTo({ center: coords, zoom: 18, essential: true });

                if (window.innerWidth <= 1135) {
                    sidebar_open();
                }
            };
        } else {
            el.textContent = "";
            el.style.display = "none";
            el.onclick = null;
        }
    });

    if (matches.length > 0) {
        searchResults.classList.add("open");
    } else {
        searchResults.classList.remove("open");
    }
});