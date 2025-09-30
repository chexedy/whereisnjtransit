let twochar = {};
let line_database = {};
let stations = {};

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

const stationMap = {};

fetch("json/stations.json")
    .then(res => res.json())
    .then(data => {
        stations = data.stations;
        for (const feature of stations.features) {
            stationMap[feature.properties.description] = feature;
        }
        console.log(stationMap);
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

                togglePanel(infoPanel, newDiv);
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
        const secLate = departureHistoryCache[id]?.sec_late ?? 0;
        const stopTime = new Date(stop.dep_time.replace(" ", "T"));
        stopTime.setTime(stopTime.getTime() + secLate * 1000);
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

function getClosestPoint(longitude, latitude, geojson) {
    const point = turf.point([longitude, latitude]);
    let closestPoint = null;
    let minDistance = Infinity;

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

function buildTrip(history, secLate) {
    console.log(history);
    return history.map(stop => ({
        station: stop.station_name,
        coords: stationMap[stop.station_name].geometry.coordinates,
        dep_time: new Date(new Date(stop.dep_time).getTime() + secLate * 1000)
    }));
}

function animateSegment(marker, line, start, end, dwell = 45000) {
    const startTime = start.dep_time.getTime();
    const endTime = end.dep_time.getTime();
    const duration = endTime - startTime;

    function frame() {
        const now = Date.now();

        if (now >= endTime) {
            marker.setLngLat(end.coords);

            // Dwell 45
            setTimeout(() => {
                animateNextSegment(marker, tripGlobal, end);
            }, dwell);
            return;
        }

        const progress = (now - startTime) / duration;
        const traveled = turf.length(line) * progress;
        const point = turf.along(line, traveled, { units: "miles" });
        marker.setLngLat(point.geometry.coordinates);

        requestAnimationFrame(frame);
    }

    frame();
}

function animateNextSegment(marker, fullTrip, currentStop) {
    const idx = fullTrip.findIndex(s => s.station === currentStop.station);
    if (idx >= 0 && idx < fullTrip.length - 1) {
        const start = fullTrip[idx];
        const end = fullTrip[idx + 1];

        const lineSegment = turf.lineSlice(
            turf.point(start.coords),
            turf.point(end.coords),
            fullRouteGeoJSON[start.line]
        );

        animateSegment(marker, lineSegment, start, end);
    }
}

async function addLiveTrains() { // REMOVE SECAUCUS IN STATIONS
    const url = "https://whereisnjtransit-schedule.ayaan7m.workers.dev/realtime";
    const res = await fetch(url);
    const data = await res.json();

    console.log(data.length + " trains are currently running");
    for (const train of data) {
        if (train.line === "Northeast Corridor Line") {
            console.log(train);
            const resLine = await fetch(line_database[train.line].url);
            const lineData = await resLine.json();
            const geojson = lineData[line_database[train.line].id];

            const point = getClosestPoint(train.longitude, train.latitude, geojson);
            const station_point = stationMap[train.next_stop].geometry.coordinates;

            const url2 = `https://whereisnjtransit-schedule.ayaan7m.workers.dev/history?id=${encodeURIComponent(train.train_id)}`
            const res2 = await fetch(url2);
            const history = await res2.json();

            const trip = buildTrip(history, train.sec_late);
            departureHistoryCache[train.train_id] = { history: history };

            const markerEl = document.createElement("div");
            markerEl.innerHTML = `<img src="${line_database[train.line].icon}" style="width:28px;height:28px;">`;
            const marker = new mapboxgl.Marker({ element: markerEl })
                .setLngLat(point.geometry.coordinates)
                .addTo(map);

            const idx = trip.findIndex(s => s.station === train.next_stop);
            if (idx > 0) {
                const prev = trip[idx - 1];
                const next = trip[idx];

                const lineSegment = turf.lineSlice(
                    turf.point(point.geometry.coordinates),
                    turf.point(next.coords),
                    geojson
                );

                animateSegment(
                    marker,
                    lineSegment,
                    { ...prev, coords: point.geometry.coordinates, dep_time: new Date() },
                    next,
                    trip,
                    train.line
                );
            }
        }
    }
}

function msUntilNext5Min() {
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
    const delay = msUntilNext5Min();

    setTimeout(() => {
        reset5Mins();
        addLiveTrains();

        setInterval(() => {
            reset5Mins();
            addLiveTrains();
        }, 5 * 60 * 1000);
    }, delay);
}

function reset5Mins() {
    departureCache.length = 0;
    departureHistoryCache.length = 0;
    console.log("Caches cleared at", new Date().toLocaleTimeString());
}

addLiveTrains()
scheduleTask();