const bounds = [
    [-76.58039, 38.80348],
    [-72.79608, 41.75203]
]

const map = new maplibregl.Map({
    container: 'map',
    center: [-74.1, 40.75],
    style: "https://tiles.openfreemap.org/styles/positron",
    maxBounds: bounds
});

async function addTrackLines() {
    const res = await fetch('json/line-database.json');
    const data = await res.json();

    for (const key in data["line-database"]) {
        const line = data["line-database"][key];

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
                'line-offset': ['get', 'offset']
            },
            "minzoom": 10
        });
    }
}

async function addStations() {
    const res = await fetch('json/stations.json');
    const data = await res.json();

    const stationimage = await map.loadImage('https://upload.wikimedia.org/wikipedia/commons/7/7c/201408_cat.png');

    if (!map.hasImage('station-icon')) {
        map.addImage('station-icon', stationimage);

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
            'icon-size': 1,
            'icon-allow-overlap': true,
            'text-field': ['get', 'description'],
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-size': 20,
        }
    });

    map.on('click', 'stations-layer', (e) => {
        const feature = e.features[0];
        const { description, lines } = feature.properties;
        updateStationStatus(map, description, lines);
    });

    map.on('mouseenter', 'stations-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'stations-layer', () => {
        map.getCanvas().style.cursor = '';
    });
}

const disabledLayers = new Set();

function toggleLayerVisibility(layer) {
    const route = document.getElementById(layer);

    if (disabledLayers.has(layer)) {
        disabledLayers.delete(layer);
        map.setLayoutProperty(layer, "visibility", "visible")
        route.style.background = "white";
    } else {
        disabledLayers.add(layer);

        map.setLayoutProperty(layer, "visibility", "none")
        route.style.background = "lightgrey";
    }
}

async function loadMapLayers() {
    await addStations();
    await addTrackLines();
}

map.on('style.load', () => {
    map.fitBounds(bounds, { padding: 40, animate: false });

    const currentZoom = map.getZoom();
    map.setMinZoom(currentZoom);

    loadMapLayers();
});

document.getElementById("locationButton").addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { longitude, latitude } = pos.coords;
            map.flyTo({ center: [longitude, latitude], zoom: 14, essential: true });
        },
        (err) => console.error(err),
        { enableHighAccuracy: false, timeout: 6000 }
    );
})