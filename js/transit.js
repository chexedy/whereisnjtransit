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
    const url = `https://whereisnjtransit-api.ayaan7m.workers.dev/history?id=${encodeURIComponent(id)}`
    const res = await fetch(url);
    const history = await res.json();

    const today = new Date().toISOString().split("T")[0];
    const filtered = history.filter(stop => stop.dep_time.startsWith(today)); /// FIX THIS LOGIC

    departureHistoryCache[id].history = filtered;
    const data = departureHistoryCache[id].history;

    const stationCol = infoPanel.querySelector(".station_col");
    const scheduledCol = infoPanel.querySelector(".scheduled_col");
    const statusCol = infoPanel.querySelector(".status_col");

    stationCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    scheduledCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    statusCol.querySelectorAll("h4").forEach(h4 => h4.remove());

    const now = new Date();
    let trainReachedNext = false;
    console.log(data);

    for (const stop of data) {
        const secLate = departureHistoryCache[id].sec_late || 0;
        const stopTime = new Date(stop.dep_time.replace(" ", "T") + "Z");
        const scheduledTime = new Date(stop.dep_time.replace(" ", "T") + "Z");;
        stopTime.setTime(stopTime.getTime() + (secLate * 1000));

        const stationName = stop.station_name;

        let statusText = "";
        let statusColor = "black";
        let stationColor = "black";

        if (stationName === document.getElementById("stationStatusName").innerHTML) {
            stationColor = "green";
        }

        const timeDiff = (stopTime - now) / 1000

        if (timeDiff <= 119 && timeDiff >= 0) {
            statusText = "All Aboard";
            statusColor = "orange";
            trainReachedNext = true;
        } else if (stopTime.getTime() < now.getTime()) {
            statusText = "Departed";
            statusColor = "red";
        } else if (!trainReachedNext) {
            trainReachedNext = true;

            if (secLate > 0) {
                let delayStr;
                if (Math.abs(secLate) < 60) {
                    delayStr = `${secLate}s`;
                } else {
                    delayStr = `${Math.floor(secLate / 60)}m`;
                }

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

        console.log(hours, minutes);
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

async function getTrainPath(train, maxMinutes = 5) {
    const now = new Date();

    if (!departureHistoryCache[train.train_id]) {
        const res = await fetch(`https://whereisnjtransit-api.ayaan7m.workers.dev/history?id=${train.train_id}`);
        const data = await res.json();

        departureHistoryCache[train.train_id] = {};
        departureHistoryCache[train.train_id].history = data;
        departureHistoryCache[train.train_id].sec_late = train.sec_late;
        console.log(departureHistoryCache);
    }

    const history = departureHistoryCache[train.train_id].history;

    const steps = [];
    let elapsedTime = 0;

    let nextIndex = history.findIndex(h => h.station_name === train.next_stop);
    if (nextIndex <= 0) return [];

    for (let i = nextIndex - 1; i < history.length - 1; i++) {
        const prevStop = history[i];
        const nextStop = history[i + 1];

        const prevTime = new Date(prevStop.dep_time);
        const nextTime = new Date(nextStop.dep_time);
        let travelSec = (nextTime - prevTime) / 1000;

        if (i === nextIndex - 1) {
            travelSec += train.sec_late;
        }

        if (elapsedTime >= maxMinutes * 60) break;

        steps.push({
            type: "travel",
            expectedArrival: new Date(prevTime.getTime() + travelSec * 1000).toISOString(),
            nextStation: stationMap[nextStop.station_name]
        });

        elapsedTime += travelSec;

        if (elapsedTime < maxMinutes * 60) {
            let dwellSec = 45;
            if (train.sec_late < 0) {
                dwellSec += Math.abs(train.sec_late);
            }
            steps.push({
                type: "dwell",
                duration: dwellSec,
                nextStation: null
            });
            elapsedTime += dwellSec;
        }
    }

    return steps;
}

async function animateTrain(train, routeLine, steps) {
    const source = map.getSource(`train-${train.train_id}`);
    if (!source) return;

    let currentStep = 0;
    let distanceTraveled = 0;

    while (currentStep < steps.length) {
        const step = steps[currentStep];

        if (step.type === "travel") {
            const nextCoord = step.nextStation;
            const segmentDistance = turf.length(routeLine, { units: "kilometers" });
            const totalDuration = new Date(step.expectedArrival) - Date.now(); // ms

            const startTime = performance.now();
            while (performance.now() - startTime < totalDuration) {
                const t = (performance.now() - startTime) / totalDuration;
                const along = turf.along(routeLine, segmentDistance * t, { units: "kilometers" });
                const coord = along.geometry.coordinates;

                // Optional: get bearing to rotate icon
                const bearing = turf.bearing(
                    turf.along(routeLine, Math.max(0, segmentDistance * t - 0.01), { units: "kilometers" }),
                    along
                );

                source.setData({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: coord },
                    properties: { bearing }
                });

                await new Promise(r => setTimeout(r, 1000 / 30)); // 30 FPS
            }

            currentStep++;
        }

        else if (step.type === "dwell") {
            await new Promise(r => setTimeout(r, step.duration * 1000));
            currentStep++;
        }
    }
}


async function addLiveTrains() {
    const layers = map.getStyle().layers;
    for (const layer of layers) {
        if (layer.id.startsWith("train-")) {
            if (map.getLayer(layer.id)) map.removeLayer(layer.id);
            if (map.getSource(layer.id)) map.removeSource(layer.id);
        }
    }

    const res = await fetch("https://whereisnjtransit-api.ayaan7m.workers.dev/realtime");
    const data = await res.json();

    for (const train of data) {
        if (train.line == "Northeast Corridor Line") {
            const res2 = await fetch(line_database[train.line].url);
            const data2 = await res2.json();
            const line = data2[line_database[train.line].id];

            const path = await getTrainPath(train);
            console.log(train.train_id, path);
            console.log(line);

            map.addSource(`train-${train.train_id}`, {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: [train.longitude, train.latitude] },
                    properties: {}
                }
            });

            map.addLayer({
                id: `train-${train.train_id}`,
                type: "symbol",
                source: `train-${train.train_id}`,
                layout: {
                    "icon-image": train.line,
                    "icon-size": 1,
                    "icon-rotate": ["get", "bearing"],
                    'icon-allow-overlap': true,
                },
                "minzoom": 9
            });

            animateTrain(train, line, path);
        }
    }
}

function minutesUntilNext5Min() {
    const now = new Date();
    const estNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );

    const minutes = estNow.getMinutes();
    const next = Math.ceil(minutes / 5) * 5;

    if (next === 60) {
        estNow.setHours(estNow.getHours() + 1);
        estNow.setMinutes(0, 0, 0);
    } else {
        estNow.setMinutes(next, 0, 0);
    }

    return estNow.getTime() - Date.now();
}

function scheduleTask() {
    const delay = minutesUntilNext5Min();

    setTimeout(() => {
        // addLiveTrains();

        setInterval(() => {
            // addLiveTrains();
        }, 5 * 60 * 1000);
    }, delay);
}

map.on('style.load', async () => {
    // scheduleTask()
    console.log(line_database);

    for (const [key, value] of Object.entries(line_database)) {
        const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = value.image;
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });

        if (!map.hasImage(key)) {
            map.addImage(key, image);
        }
    }

    // addLiveTrains()
});

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