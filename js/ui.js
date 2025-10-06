let database;
fetch("json/line-database.json")
    .then(response => response.json())
    .then(data => {
        database = data["line-database"];
    })
    .catch(err => console.error("Error loading line database:", err));

function welcome_button() {
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("welcomeOverlay").style.display = "none";
}

function about_button() {
    station_close();
    document.getElementById("settingsScreen").style.display = "none";

    const screen = document.getElementById("aboutScreen");
    if (screen.style.display === "flex") {
        screen.style.display = "none";
    } else {
        screen.style.display = "flex";

        if (window.innerWidth <= 1135) {
            sidebar_open();
        }
    }
}

function settings_button() {
    station_close();
    document.getElementById("aboutScreen").style.display = "none";

    const screen = document.getElementById("settingsScreen");
    if (screen.style.display === "flex") {
        screen.style.display = "none";
    } else {
        screen.style.display = "flex";

        if (window.innerWidth <= 1135) {
            sidebar_open();
        }
    }
}

let militaryTime = false;

const settingsConfig = {
    darkToggle: {
        type: "toggle",
        default: false,
        onChange: (value) => {
            document.cookie = `darkTheme=${value}; max-age=31536000`;
            document.location.reload();
        }
    },
    stationsToggle: {
        type: "toggle",
        default: false,
        onChange: (value) => {
            map.setLayoutProperty('stations-layer', 'visibility', value ? 'none' : 'visible');
            document.cookie = `hideStations=${value}; max-age=31536000`;
        }
    },
    tracksToggle: {
        type: "toggle",
        default: false,
        onChange: (value) => {
            const lineLayers = ["meadowlands", "northeastcorridortrack", "northjerseycoasttrack", "pascackvalleytrack", "morrisessextrack", "mainbergentrack", "montclairboontontrack", "raritanvalleytrack", "atlanticcitytrack"];

            lineLayers.forEach(id => {
                if (map.getLayer(id)) {
                    map.setLayoutProperty(id, 'visibility', value ? 'none' : 'visible');
                }
            });

            document.cookie = `hideTracks=${value}; max-age=31536000`;
        }
    },
    timeToggle: {
        type: "toggle",
        default: false,
        onChange: (value) => {
            militaryTime = value;
            document.cookie = `militaryTime=${militaryTime}; max-age=31536000`;
        }
    }
};

for (const [id, config] of Object.entries(settingsConfig)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.checked = config.default;
    el.addEventListener('change', e => config.onChange(e.target.checked));
}

function setTheme(theme) {
    const spriteURL = `https://protomaps.github.io/basemaps-assets/sprites/v4/${theme}`;
    const newLayers = basemaps.layers("protomaps", basemaps.namedFlavor(theme), { lang: "en" });

    const style = map.getStyle();
    style.sprite = spriteURL;
    style.layers = newLayers;
    map.setStyle(style);
}


function station_open() {
    const screen = document.getElementById("stationStatus");
    screen.style.display = "flex";
    screen.style.left = "50%";
    screen.style.top = "50%";
    screen.style.transform = "translate(-50%, -50%)";
}

function station_close() {
    const screen = document.getElementById("stationStatus");
    screen.style.display = "none";
}

function sidebar_open() {
    const sidebar = document.getElementById("mainSidebar");
    const opener = document.querySelector(".sidebar_opener");
    const gap = 1;

    if (opener.style.left === "1vw" || opener.style.left === "") {
        sidebar.style.display = "block";
        const sidebarWidthPx = sidebar.getBoundingClientRect().width;
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / 100;
        const sidebarWidthVw = sidebarWidthPx / vw;
        opener.style.left = `${sidebarWidthVw + gap}vw`;

        if (screen.width <= 1135) {
            station_close();
        }
    } else {
        sidebar.style.display = "none";
        opener.style.left = "1vw";
    }
}

function adjust_sidebar() {
    const sidebar = document.getElementById("mainSidebar");
    const opener = document.querySelector(".sidebar_opener");
    const gap = 1;

    if (screen.width <= 1135) {
        sidebar.style.display = "block";
        const sidebarWidthPx = sidebar.getBoundingClientRect().width;
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) / 100;
        const sidebarWidthVw = sidebarWidthPx / vw;
        opener.style.left = `${sidebarWidthVw + gap}vw`;
    } else {
        sidebar.style.display = "none";
        opener.style.left = "1vw";
    }
}

window.addEventListener("resize", adjust_sidebar)

const stationStatus = document.getElementById("stationStatus");
const dragHandle = document.querySelector(".draggable_station_status");

let offsetX = 0, offsetY = 0, isDragging = false;

dragHandle.addEventListener("mousedown", startDrag);
dragHandle.addEventListener("touchstart", startDrag, { passive: false });

function startDrag(e) {
    e.preventDefault();
    isDragging = true;

    const rect = stationStatus.getBoundingClientRect();
    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchmove", onDrag, { passive: false });
    document.addEventListener("touchend", stopDrag);
}

function onDrag(e) {
    if (!isDragging) return;

    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    stationStatus.style.left = (clientX - offsetX) + "px";
    stationStatus.style.top = (clientY - offsetY) + "px";
    stationStatus.style.transform = "none";
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
    document.removeEventListener("touchmove", onDrag);
    document.removeEventListener("touchend", stopDrag);
}

function formatTime(hours, minutes) {
    let hh, mm, estimatedStr;

    mm = String(minutes).padStart(2, "0");

    if (militaryTime) {
        hh = String(hours).padStart(2, "0");
        estimatedStr = `${hh}:${mm}`;
    } else {
        const ampm = hours >= 12 ? "PM" : "AM";
        hh = String(((hours + 11) % 12) + 1).padStart(2, "0");
        estimatedStr = `${hh}:${mm} ${ampm}`;
    }

    return estimatedStr;
}

const timeToggle = document.getElementById('timeToggle');
const timeDisplay = document.getElementById('timeDisplay');

timeToggle.checked = militaryTime;
timeToggle.addEventListener('change', (e) => {
    militaryTime = e.target.checked;
    settingsConfig.timeToggle.onChange(militaryTime);
});

setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    timeDisplay.textContent = formatTime(hours, minutes);
}, 1000);