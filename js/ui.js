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