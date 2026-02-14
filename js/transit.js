let twochar = {};
let line_database = {};
let stations = {};

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

stationMap["Secaucus"] = [-74.075821, 40.761188];
stationMap["Newark Broad"] = [-74.171943, 40.747621];
stationMap["Convent Stn"] = [-74.443435, 40.779038];
stationMap["Jersey Ave."] = [-74.467363, 40.476912];
stationMap["Princeton Jct."] = [-74.623753, 40.316316];
stationMap["Ramsey Rt 17"] = [-74.145485, 41.07513];
stationMap["Salisbury Mls"] = [-74.101871, 41.437073];
stationMap["Anderson St."] = [-74.043781, 40.894458];
stationMap["Matawan"] = [-74.223702, 40.420161];
stationMap["Mountain Ave"] = [-74.205306, 40.848715]
stationMap["Montclair Hts."] = [-74.2025, 40.857536];
stationMap["Radburn-Fl"] = [-74.121617, 40.939914];
stationMap["New Bridge Ldg"] = [-74.035044, 40.910856];
stationMap["MSU"] = [-74.197439, 40.869782];
stationMap["Berkeley Hts"] = [-74.442649, 40.682345];
stationMap["Watsessing Ave"] = [-74.198451, 40.782743];
stationMap["Highland Ave."] = [-74.243744, 40.766863];
stationMap["Broadway-Fl"] = [-74.115236, 40.922505];
stationMap["Mountain Stn"] = [-74.253024, 40.755365];
stationMap["Watchung Ave."] = [-74.206934, 40.829514];
stationMap["Upp. Montclair"] = [-74.209368, 40.842004];
stationMap["Mt. Arlington"] = [-74.632731, 40.89659];
stationMap["North Elizab."] = [-74.206165, 40.680265];

const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
    const [name, value] = cookie.split('=');
    acc[name] = value;
    return acc;
}, {});

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
                if (diffMs >= -30 * 1000 && diffMs <= 120 * 1000) {
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

                if (diffMs >= -30 * 1000 && diffMs <= 120 * 1000) {
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
                    await updateTrainHistory(infoPanel, obj.train_id, obj.sec_late);
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

async function updateTrainHistory(infoPanel, id, sec_late) {
    const now = new Date();
    const url = `https://whereisnjtransit-api.ayaan7m.workers.dev/history?id=${encodeURIComponent(id)}`;
    const res = await fetch(url);
    const history = await res.json();

    const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const seenStops = new Set();
    const data = [];

    for (const stop of history) {
        console.log(stop);
        const stopDate = new Date(stop.dep_time.replace(" ", "T") + "Z");

        if (stopDate > sixHoursLater) continue;

        const key = `${stop.station_name}-${stopDate.getUTCHours()}-${stopDate.getUTCMinutes()}`;
        if (!seenStops.has(key)) {
            seenStops.add(key);
            data.push(stop);
        }
    }

    const stationCol = infoPanel.querySelector(".station_col");
    const scheduledCol = infoPanel.querySelector(".scheduled_col");
    const statusCol = infoPanel.querySelector(".status_col");

    stationCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    scheduledCol.querySelectorAll("h4").forEach(h4 => h4.remove());
    statusCol.querySelectorAll("h4").forEach(h4 => h4.remove());

    let trainReachedNext = false;

    for (const stop of data) {
        const secLate = sec_late || 0;
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

        if (timeDiff <= 119 && timeDiff >= -60) {
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

        console.log("Fetched departures:", departures);
        updateStation(departures);
    } catch (error) {
        console.error("Failed to fetch departures:", error);
        document.getElementById("NoCurrentDepartures").style.display = "flex";
        document.getElementById("NoCurrentDepartures").innerHTML = "Error loading departures";
    }

    station_open();
}

async function getTrainPath(train, maxMinutes = 1.5) {
    const now = new Date();

    const res = await fetch(`https://whereisnjtransit-api.ayaan7m.workers.dev/history?id=${train.train_id}`);
    const history = await res.json();

    const steps = [];
    let elapsedTime = 0;

    let nextIndex = history.findIndex(h => h.station_name === train.next_stop);
    if (nextIndex <= 0) return [];

    if (train.current_stop === history[nextIndex - 1]?.station_name) {
        let dwellSec = train.dwell && train.dwell !== 0 ? train.dwell : 45;
        if (train.sec_late < 0) {
            dwellSec += Math.abs(train.sec_late);
        }
        steps.push({
            type: "dwell",
            duration: dwellSec,
            nextStation: null,
        });
        elapsedTime += dwellSec;
    }

    for (let i = nextIndex - 1; i < history.length - 1; i++) {
        const prevStop = history[i];
        const nextStop = history[i + 1];

        const prevTime = new Date(prevStop.dep_time + "Z");
        const nextTime = new Date(nextStop.dep_time + "Z");
        let travelSec = (nextTime - prevTime) / 1000;

        if (i === nextIndex - 1) {
            travelSec += train.sec_late;
        }

        if (elapsedTime >= maxMinutes * 60) break;

        steps.push({
            type: "travel",
            departureTime: prevTime.toISOString(),
            expectedArrival: new Date(prevTime.getTime() + travelSec * 1000).toISOString(),
            nextStation: stationMap[nextStop.station_name],
            prevStation: stationMap[prevStop.station_name]
        });

        console.log(prevStop.station_name + " " + train.train_id);

        elapsedTime += travelSec;

        if (elapsedTime < maxMinutes * 60) {
            let dwellSec = train.dwell && train.dwell !== 0 ? train.dwell : 45;
            if (train.sec_late < 0) {
                dwellSec += Math.abs(train.sec_late);
            }
            steps.push({
                type: "dwell",
                duration: dwellSec,
                nextStation: null,
                prevStation: stationMap[nextStop.station_name]
            });
            elapsedTime += dwellSec;
        }
    }

    return steps;
}

function findBestLine(featureCollection, prevStation, nextStation) {
    let bestLine = null;
    let minTotalDist = Infinity;

    for (const f of featureCollection.features) {
        const flattened = turf.flatten(f).features;
        for (const line of flattened) {
            const start = turf.nearestPointOnLine(line, turf.point(prevStation));
            const end = turf.nearestPointOnLine(line, turf.point(nextStation));
            const totalDist = turf.distance(turf.point(prevStation), start) + turf.distance(turf.point(nextStation), end);
            if (totalDist < minTotalDist) {
                minTotalDist = totalDist;
                bestLine = line;
            }
        }
    }
    return bestLine;
}

function travelBetweenPoints(train, path, featureCollection) {
    const departureTime = new Date(path[0].departureTime);
    const expectedArrival = new Date(path[0].expectedArrival);
    const totalTime = expectedArrival - departureTime;

    const prev = path[0].prevStation;
    const next = path[0].nextStation;

    const prevCoords = Array.isArray(prev) ? prev : [prev.lon ?? prev.lng, prev.lat];
    const nextCoords = Array.isArray(next) ? next : [next.lon ?? next.lng, next.lat];

    if (!Array.isArray(prevCoords) || !Array.isArray(nextCoords) ||
        prevCoords.length < 2 || nextCoords.length < 2 ||
        !Number.isFinite(prevCoords[0]) || !Number.isFinite(prevCoords[1]) ||
        !Number.isFinite(nextCoords[0]) || !Number.isFinite(nextCoords[1])) {
        console.warn(`Invalid station coordinates for train ${train.train_id}`, prev, next);
        return;
    }

    let line = findBestLine(featureCollection, prevCoords, nextCoords);
    if (!line) {
        console.warn(`No suitable line found for ${train.train_id}`);
        return;
    }

    let start = turf.nearestPointOnLine(line, turf.point(prevCoords), { units: 'kilometers' });
    let end = turf.nearestPointOnLine(line, turf.point(nextCoords), { units: 'kilometers' });

    let startDist = start.properties.location;
    let endDist = end.properties.location;

    if (startDist > endDist) {
        line = turf.lineString([...line.geometry.coordinates].reverse());
        start = turf.nearestPointOnLine(line, turf.point(prevCoords), { units: 'kilometers' });
        end = turf.nearestPointOnLine(line, turf.point(nextCoords), { units: 'kilometers' });
        startDist = start.properties.location;
        endDist = end.properties.location;
    }

    const sourceId = `${train.train_id}-source`;
    const layerId = `${train.train_id}-layer`;

    const src = map.getSource(sourceId);
    if (!src) {
        console.warn(`Missing source for ${train.train_id}, skipping animation`);
        return;
    }

    if (activeTrains.has(train.train_id)) {
        const old = activeTrains.get(train.train_id);
        if (old.animationId) cancelAnimationFrame(old.animationId);
    }

    function updatePosition() {
        const now = new Date();
        const elapsed = now - departureTime;
        let percent = elapsed / totalTime;
        percent = Math.max(0, Math.min(1, percent));

        const targetDist = startDist + percent * (endDist - startDist);
        const currentPoint = turf.along(line, targetDist, { units: 'kilometers' });

        const src = map.getSource(sourceId);
        if (src) src.setData(currentPoint);

        if (percent < 1) {
            const animId = requestAnimationFrame(updatePosition);
            activeTrains.set(train.train_id, {
                ...activeTrains.get(train.train_id),
                animationId: animId,
            });
        } else {
            console.log(`Train ${train.train_id} reached ${path[0].nextStation}`);
        }
    }

    updatePosition();
}

function dwellAtStation(train, path) {
    if (!path || path.length === 0) return;

    const sourceId = `${train.train_id}-source`;
    const layerId = `${train.train_id}-layer`;

    const prev = path[0].prevStation;
    const coords = Array.isArray(prev)
        ? prev
        : [prev.lon ?? prev.lng, prev.lat];

    if (!Array.isArray(coords) || coords.length < 2 ||
        !Number.isFinite(coords[0]) || !Number.isFinite(coords[1])) {
        console.warn(`Invalid dwell coordinates for ${train.train_id}`, prev);
        return;
    }

    const point = turf.point(coords);
    const src = map.getSource(sourceId);
    if (!src) {
        console.warn(`Missing source for ${train.train_id}, cannot dwell`);
        return;
    }

    map.moveLayer(layerId, 'stations-layer');
    console.log(`Train ${train.train_id} is dwelling for ${path[0].duration} seconds`);

    const old = activeTrains.get(train.train_id);
    if (old && old.dwellTimeout) clearTimeout(old.dwellTimeout);

    const dwellTimeout = setTimeout(() => {
        console.log(`Train ${train.train_id} finished dwelling`);
    }, path[0].duration * 1000);

    activeTrains.set(train.train_id, {
        ...activeTrains.get(train.train_id),
        dwellTimeout,
        animationId: null
    });
}


function animateTrain(train, path, line) {
    if (path.length === 0) return;

    if (path.length === 1) {
        if (path[0].type === "dwell") {
            dwellAtStation(train, path);
        } else {
            travelBetweenPoints(train, path, line);
        }
    } else {
        for (const step of path) {
            if (step.type === "dwell") {
                dwellAtStation(train, [step]);
            } else if (step.type === "travel") {
                travelBetweenPoints(train, [step], line);
            }
        }
    }
}

const activeTrains = new Map();

async function updateRealtimeTrains(darkTheme) {
    console.log("Updating realtime trains...");

    const res = await fetch("https://whereisnjtransit-api.ayaan7m.workers.dev/realtime");
    const data = await res.json();
    const newTrainIds = new Set(data.map(t => t.train_id));

    for (const [trainId, info] of activeTrains) {
        if (!newTrainIds.has(trainId)) {
            if (info.animationId) cancelAnimationFrame(info.animationId);
            if (info.dwellTimeout) clearTimeout(info.dwellTimeout);
            if (map.getLayer(info.layerId)) map.removeLayer(info.layerId);
            if (map.getSource(info.sourceId)) map.removeSource(info.sourceId);
            activeTrains.delete(trainId);

            const child = document.getElementById(trainId);
            if (child && child.id !== "default_train" && child.id !== "NoActiveTrains" && child.id !== "currentTrainSearch") {
                child.remove();
            }
        }
    }

    const trainList = document.getElementById("currentTrainsList");
    const noTrains = document.getElementById("NoActiveTrains");
    const search = document.getElementById("currentTrainSearch");

    for (const train of data) {
        if (!train.line) continue;

        const path = await getTrainPath(train, 5);
        if (!path || path.length === 0) continue;

        const res2 = await fetch(line_database[train.line].url);
        const lineData = await res2.json();

        const sourceId = `${train.train_id}-source`;
        const layerId = `${train.train_id}-layer`;

        if (activeTrains.has(train.train_id)) {
            const old = activeTrains.get(train.train_id);
            if (old.animationId) cancelAnimationFrame(old.animationId);
        }

        if (!map.getSource(sourceId)) {
            const startPoint = turf.point(path[0].prevStation);
            map.addSource(sourceId, { type: "geojson", data: startPoint });

            map.addLayer({
                id: layerId,
                source: sourceId,
                type: "symbol",
                layout: {
                    "icon-image": train.line,
                    "icon-size": 0.9,
                    "text-field": line_database[train.line].abbreviation + " " + train.train_id,
                    "text-offset": [0, 1.5],
                    "text-anchor": "top",
                    "text-size": 15,
                    "icon-allow-overlap": true,
                    "text-allow-overlap": true,
                    "text-font": ["Ubuntu Medium"],
                },
                paint: {
                    "text-color": darkTheme ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)",
                },
                minzoom: 8,
            });

            map.on("click", layerId, (e) => {
                new maplibregl.Popup()
                    .setLngLat(e.features[0].geometry.coordinates)
                    .setHTML(
                        `<strong>Train ${train.train_id}</strong><br>Next Stop: ${train.next_stop}`
                    )
                    .addTo(map);
            });

            map.on("mouseenter", layerId, () => (map.getCanvas().style.cursor = "pointer"));
            map.on("mouseleave", layerId, () => (map.getCanvas().style.cursor = ""));
        }

        map.moveLayer("stations-layer");

        activeTrains.set(train.train_id, {
            sourceId,
            layerId,
            animationId: null,
            dwellTimeout: null,
            line: line_database[train.line].id
        });

        if (!document.getElementById(train.train_id)) {
            const newDiv = document.getElementById("default_train").cloneNode(true);
            newDiv.id = train.train_id;
            newDiv.style.display = "flex";
            newDiv.querySelector("img").src = line_database[train.line].image;
            newDiv.querySelector("h3").innerHTML =
                `${line_database[train.line].abbreviation} ${train.train_id} to ${train.next_stop}`;
            trainList.appendChild(newDiv);

            newDiv.addEventListener("click", () => {
                console.log("Clicked train:", train.train_id);
                const src = map.getSource(sourceId);
                if (!src) return;

                console.log("Source data:", src);
                const data = src._data.geojson;

                if (!data) return;
                if (data && data.geometry && data.geometry.coordinates) {
                    console.log("Flying to:", data.geometry.coordinates);
                    map.flyTo({ center: data.geometry.coordinates, zoom: 18, essential: true });
                    current_trains_button();
                }
            });
        }

        if (path[0].type === "dwell") {
            dwellAtStation(train, path);
        } else if (path[0].type === "travel") {
            travelBetweenPoints(train, path, lineData[line_database[train.line].id]);
        }
    }

    if (activeTrains.size > 0) {
        noTrains.style.display = "none";
        search.style.display = "flex";
    } else {
        noTrains.style.display = "flex";
        search.style.display = "none";
    }

    console.log(`Active trains: ${activeTrains.size}`);
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

const trainSearchInput = document.getElementById("trainSearch");
const currentTrainsList = document.getElementById("currentTrainsList");

trainSearchInput.addEventListener("input", () => {
    const query = trainSearchInput.value.toLowerCase().trim();
    const trainDivs = Array.from(currentTrainsList.getElementsByClassName("current_train"));

    let anyVisible = false;

    trainDivs.forEach(div => {
        const trainIdText = div.id;

        if (trainIdText.toLowerCase().includes(query)) {
            div.style.display = "flex";
            anyVisible = true;
        } else {
            div.style.display = "none";
        }
    });

    const noTrainsEl = document.getElementById("NoActiveTrains");
    if (noTrainsEl) {
        noTrainsEl.style.display = anyVisible ? "none" : "flex";
    }
});
