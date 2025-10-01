let database;
fetch("json/line-database.json")
    .then(response => response.json())
    .then(data => {
        database = data["line-database"];
    })
    .catch(err => console.error("Error loading line database:", err));

function welcome_button() {
    const screen = document.getElementById("welcomeScreen");
    screen.style.display = "none";
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