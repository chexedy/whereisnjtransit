let map;

let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

async function addTrackLines() {
    const res = await fetch('json/line-database.json');
    const data = await res.json();

    for (const key in data["line-database"]) {
        const line = data["line-database"][key];

        if (line.name == "Bergen County Line") {
            continue;
        }

        const res2 = await fetch(line.url);
        const lineData = await res2.json();

        map.addSource(line.id, {
            type: 'geojson',
            data: lineData[line.id]
        });

        map.addLayer({
            'id': line.id,
            'type': 'line',
            'source': line.id,
            'layout': {
                'line-join': 'round',
                'line-cap': 'round',
                "visibility": "visible"
            },
            'paint': {
                'line-color': line.color,
                'line-width': 8,
            },
            "minzoom": 8
        });
    }
}

async function addStations() {
    const res = await fetch('json/stations.json');
    const data = await res.json();

    try {
        const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = "/assets/service/station.svg";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
        });

        if (!map.hasImage('station-icon')) {
            map.addImage('station-icon', image);
        }

        map.addSource('stations', {
            type: 'geojson',
            data: data.stations
        });

        map.addLayer({
            id: 'stations-layer',
            type: 'symbol',
            source: 'stations',
            layout: {
                'icon-image': 'station-icon',
                'icon-size': 0.175,
                'icon-allow-overlap': false,
                'text-field': ['get', 'description'],
                'text-offset': [0, 1.5],
                'text-anchor': 'top',
                'text-size': 15,
                'text-allow-overlap': false,
                'text-font': ['Ubuntu Medium'],
                'symbol-sort-key': ['get', 'sortKey']
            },
            paint: {
                'text-color': 'rgb(0, 0, 0)',
            },
            filter: ['all']
        });

        map.on('click', 'stations-layer', (e) => {
            const feature = e.features[0];
            updateStationStatus(feature.properties.description);
        });

        map.on('mouseenter', 'stations-layer', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'stations-layer', () => {
            map.getCanvas().style.cursor = '';
        });

    } catch (err) {
        console.error("Failed to load station icon:", err);
    }
}

const enabledLayers = new Set();

function toggleLayerVisibility(layer) {
    const route = document.getElementById(layer);
    const isEnabled = enabledLayers.has(layer);

    if (layer === "all") {
        enabledLayers.clear();

        document.querySelectorAll(".sidebar_route_button").forEach(btn => {
            const id = btn.id;
            if (id == 'showall') return;

            map.setLayoutProperty(id, "visibility", "visible");
            btn.style.background = "white";
        });

        if (map.getLayer("stations-layer")) {
            map.setFilter("stations-layer", ["all"]);
        }

        currentTrainLayers.forEach(obj => {
            const layerId = obj.train_id + "-layer";
            if (map.getLayer(layerId)) {
                map.setLayoutProperty(layerId, "visibility", "visible");
            }
        })
        return;
    }

    if (enabledLayers.size === 0 && !isEnabled) {
        document.querySelectorAll(".sidebar_route_button").forEach(btn => {
            const id = btn.id;
            if (id == 'showall') return;

            map.setLayoutProperty(id, "visibility", id === layer ? "visible" : "none");
            const button = document.getElementById(id);

            if (id === layer) {
                enabledLayers.add(id);
                button.style.background = "lightgrey";
            } else {
                enabledLayers.delete(id);
                button.style.background = "white";
            }
        });
    } else {
        if (isEnabled) {
            enabledLayers.delete(layer);
            map.setLayoutProperty(layer, "visibility", "none");
            route.style.background = "white";
        } else {
            enabledLayers.add(layer);
            map.setLayoutProperty(layer, "visibility", "visible");
            route.style.background = "lightgrey";
        }
    }

    if (map.getLayer("stations-layer")) {
        if (enabledLayers.size === 0) {
            map.setFilter("stations-layer", ["all"]);
        } else {
            const filter = ["any", ...Array.from(enabledLayers).map(id => ["in", id, ["get", "lines"]])];
            map.setFilter("stations-layer", filter);
        }
    }

    if (typeof currentTrainLayers !== "undefined") {
        currentTrainLayers.forEach(obj => {
            const layerId = `${obj.train_id}-layer`;
            if (!map.getLayer(layerId)) return;

            if (enabledLayers.has(obj.line)) {
                map.setLayoutProperty(layerId, "visibility", "visible");
            } else {
                map.setLayoutProperty(layerId, "visibility", "none");
            }
        })
    }
}

async function loadMapLayers() {
    await addTrackLines();
    await addStations();
}


async function initMap() {
    const bounds = [
        [-76.58039, 38.80348],
        [-72.79608, 41.75203]
    ];

    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
        const [name, value] = cookie.split('=');
        acc[name] = value;
        return acc;
    }, {});

    let map_style = {
        "version": 8,
        "text-font": ["Ubuntu Regular", "Ubuntu Medium", "Ubuntu Bold", "Ubuntu Light"],
        "glyphs": "https://map.whereisnjtransit.com/glyphs/{fontstack}/{range}.pbf",
        "sprite": "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
        "sources": {
            "protomaps": {
                "type": "vector",
                "url": "pmtiles://https://map.whereisnjtransit.com/whereisnjtransit.pmtiles",
            }
        },
        "layers": basemaps.layers("protomaps", basemaps.namedFlavor("light"), { lang: "en" })
    }

    if (cookies.darkTheme === 'true') {
        console.log(document.getElementById('darkToggle').checked);
        map_style.sprite = `https://protomaps.github.io/basemaps-assets/sprites/v4/dark`;
        map_style.layers = basemaps.layers("protomaps", basemaps.namedFlavor("dark"), { lang: "en" });
        document.querySelector(':root').style.setProperty('--primary-color', 'darkgrey');
    }

    map = new maplibregl.Map({
        container: 'map',
        center: [-74.1, 40.75],
        style: map_style,
        maxBounds: bounds
    });

    map.on('load', async () => {
        map.fitBounds(bounds, { padding: 40, animate: false });
        await loadMapLayers(map);

        if (cookies.darkTheme === 'true') {
            document.getElementById('darkToggle').checked = true;[]
            map.setPaintProperty('stations-layer', 'text-color', 'rgb(255, 255, 255)');
        }

        if (cookies.militaryTime === 'true') {
            militaryTime = true;
            document.getElementById('timeToggle').checked = true;
        }

        if (cookies.useLocalTimezone === 'true') {
            useLocalTimezone = true;
            document.getElementById('timezoneToggle').checked = true;
        }

        for (const [key, value] of Object.entries(line_database)) {
            const image = await new Promise((resolve, reject) => {
                const img = new Image();
                img.src = value.image;
                img.onload = () => resolve(img);
                img.onerror = (e) => reject(e);
            });

            console.log("Adding image for line:", key, image);
            if (!map.hasImage(key)) {
                map.addImage(key, image);
            }
        }

        await updateRealtimeTrains();
        const button = document.getElementById("welcomeButton");
        button.disabled = false;
        button.querySelector("span").textContent = "Close";
        setInterval(updateRealtimeTrains, 60000);
    });

    map.on('error', function (e) {
        console.log('Map Error:', e.error);
    });

    document.getElementById("locationButton").addEventListener("click", () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { longitude, latitude } = pos.coords;
                map.flyTo({ center: [longitude, latitude], zoom: 18, essential: true });
            },
            (err) => console.error(err),
            { enableHighAccuracy: false, timeout: 6000 }
        );
    })
}

initMap();