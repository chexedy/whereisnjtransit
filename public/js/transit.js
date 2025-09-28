let twochar = {};
let line_database = {};
const departureCache = {};

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

function updateStation(departures) {
    if (departures.length == 0) {
        document.getElementById("NoCurrentDepartures").style.display = "flex";
    } else {
        departures.forEach(obj => {
            if (new Date(new Date(obj.dep_time).getTime() + (obj.sec_late ? obj.sec_late * 1000 : 0)) <= new Date()) {
                console.log("Train already departed..");
                return;
            }

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
                    inner2.querySelector("h3").innerHTML = "Status: Early " + minutes.substring(1);
                } else {
                    inner2.querySelector("h3").innerHTML = "Status: Delayed " + minutes;
                }
            } else {
                const estimated = new Date(obj.dep_time.replace(" ", "T"));

                const hh = String(estimated.getHours()).padStart(2, "0");
                const mm = String(estimated.getMinutes()).padStart(2, "0");
                const estimatedStr = `${hh}:${mm}`;

                inner2.querySelector("h1").innerHTML = estimatedStr;
                inner2.querySelector("h3").innerHTML = "Status: On Time";
            }

            newDiv.style.display = "flex";
            document.getElementById("stationRoutes").appendChild(newDiv);
        });
    }
}

async function updateStationStatus(map, name) {
    document.getElementById("NoCurrentDepartures").style.display = "none";
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
            document.getElementById("stationDepartures").textContent = "Error loading departures";
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
}

scheduleTask();