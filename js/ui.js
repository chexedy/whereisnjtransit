const database = {};
fetch("../json/line-database.json")
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

function updateStationStatus(map, name, lines) {
    console.log(lines);
    document.getElementById("stationStatusName").textContent = name;
    split_lines = lines.split(" ")

    const routeDivs = document.querySelectorAll(".station_routes > div");
    routeDivs.forEach(div => div.style.display = "none");

    split_lines.forEach((x, i) => {
        const data = database[x];
        if (!data) return;

        const div = routeDivs[i];
        const img = div.querySelector("img");
        const span = div.querySelector("span");

        img.src = data.image;
        span.textContent = data.name;

        div.style.display = "flex";
    })

    station_open();
}

window.addEventListener("resize", adjust_sidebar)