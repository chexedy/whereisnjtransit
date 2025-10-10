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
let useLocalTimezone = false;

const settingsConfig = {
    darkToggle: {
        type: "toggle",
        default: false,
        onChange: (value) => {
            document.cookie = `darkTheme=${value}; max-age=31536000`;
            document.location.reload();
        }
    },
    timeToggle: {
        type: "toggle",
        default: false,
        onChange: (value) => {
            militaryTime = value;
            document.cookie = `militaryTime=${militaryTime}; max-age=31536000`;
        }
    },
    timezoneToggle: {
        type: "toggle",
        default: false,
        onChange: (value) => {
            useLocalTimezone = value;
            document.cookie = `useLocalTimezone=${useLocalTimezone}; max-age=31536000`;

            if (value) {
                document.getElementById("timezoneDisplay").textContent = "Current Timezone: " + Intl.DateTimeFormat().resolvedOptions().timeZone;
            } else {
                document.getElementById("timezoneDisplay").textContent = "Current Timezone: America/New_York";
            }
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
            const lineLayers = ["meadowlands", "northeastcorridortrack", "northjerseycoasttrack", "pascackvalleytrack", "morristowntrack", "maintrack", "bergentrack", "gladstonetrack", "montclairboontontrack", "raritanvalleytrack", "atlanticcitytrack"];

            lineLayers.forEach(id => {
                toggleLayerVisibility(id, !value);
            });

            document.cookie = `hideTracks=${value}; max-age=31536000`;
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
    document.getElementById("settingsScreen").style.display = "none";
    document.getElementById("aboutScreen").style.display = "none";

    if (screen.width <= 1135) {
        document.getElementById("mainSidebar").style.display = "none";
        document.querySelector(".sidebar_opener").style.left = "1vw";
    }
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

        document.getElementById("settingsScreen").style.display = "none";
        document.getElementById("aboutScreen").style.display = "none";
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

function formatTime(hours, minutes, targetTZ = "America/New_York") {
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes, 0));

    const options = {
        hour12: !militaryTime,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: useLocalTimezone ? undefined : targetTZ
    };

    return date.toLocaleTimeString("en-US", options);
}

const timeToggle = document.getElementById('timeToggle');
const timeDisplay = document.getElementById('timeDisplay');

setInterval(() => {
    const now = new Date();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();

    timeDisplay.textContent = "Current Time: " + formatTime(hours, minutes);
}, 1000);