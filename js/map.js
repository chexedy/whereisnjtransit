mapboxgl.accessToken = "pk.eyJ1IjoiYXlhYW43bSIsImEiOiJjbWZoZDZrd3YwYXNyMnFxNjFoYzBrNWozIn0.59Ytrv3w2xPkUr3FYRxMbg";
let map;

async function mapCheck() {
    try {
        const res = await fetch("https://whereisnjtransit-other.ayaan7m.workers.dev/track-map-load")

        if (!res.ok) {
            const data = await res.json();
            document.body.innerHTML = `
      <div style="text-align:center;padding:50px;font-size:1.5rem;color:red;">
        ${data.message}<br>
        I apologize, but the site will be unaccessible until the next month. Unfortunately, Mapbox (the software I use to host the maps) has a limit of 50,000 requests a month. It is pretty expensive for me to go over this limit, thus I have to shutdown the site until the next month starts. Sorry about that!
      </div>`;
            return;
        }

        initMap();
    } catch (err) {
        console.error("Error contacting Worker:", err);
        document.body.innerHTML = `
      <div style="text-align:center;padding:50px;font-size:1.5rem;color:red;">
        ⚠️ Could not check Mapbox usage, please try again later.<br>
        Contact me on GitHub (@chexedy) if the error persists for a while. 
      </div>`;
    }
}

async function addTrackLines() {
    const res = await fetch('json/line-database.json');
    const data = await res.json();

    for (const key in data["line-database"]) {
        const line = data["line-database"][key];

        if (line.name == "Bergen County Line" || line.name == "Gladstone Branch") {
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
                'line-offset': ['get', 'offset']
            },
            "minzoom": 10
        });
    }
}

async function addStations() {
    console.log("Starting");
    const res = await fetch('json/stations.json');
    const data = await res.json();
    console.log("res loaded");

    // const img = await map.loadImage("assets/icons/service/station.png");
    // console.log("Loaded image");

    // if (!map.hasImage("station-icon")) {
    //     map.addImage("station-icon", img);
    // }

    // if (!map.getSource("stations")) {
    //     map.addSource("stations", {
    //         type: "geojson",
    //         data: data.stations // or data object
    //     });
    // }

    // console.log("Added source");

    // if (!map.getLayer("stations-layer")) {
    //     map.addLayer({
    //         id: "stations-layer",
    //         type: "symbol",
    //         source: "stations",
    //         layout: {
    //             "icon-image": "station-icon",
    //             "icon-size": 0.25,
    //             "icon-allow-overlap": true,
    //             "text-field": ["get", "description"],
    //             "text-offset": [0, 1.5],
    //             "text-anchor": "top"
    //         }
    //     });
    // }

    // console.log("Added layer");

    // map.on('click', 'stations-layer', (e) => {
    //     const feature = e.features[0];
    //     const { description } = feature.properties;
    //     updateStationStatus(map, description);
    // });

    // map.on('mouseenter', 'stations-layer', () => {
    //     map.getCanvas().style.cursor = 'pointer';
    // });

    // map.on('mouseleave', 'stations-layer', () => {
    //     map.getCanvas().style.cursor = '';
    // });

    // console.log(map.hasImage("station-icon"));

    map.loadImage("assets/icons/service/station.png", (error, image) => {
        if (error) {
            console.log(error);
        }
        console.log("Image loaded");

        if (!map.hasImage('station-icon')) {
            map.addImage('station-icon', image);
        }

        map.addSource('stations', {
            type: 'geojson',
            data: data.stations
        });

        console.log("Added source");

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
                'symbol-sort-key': ['get', 'sortKey']
            },
        });

        map.on('click', 'stations-layer', (e) => {
            const feature = e.features[0];
            const { description } = feature.properties;
            updateStationStatus(description);
        });

        map.on('mouseenter', 'stations-layer', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'stations-layer', () => {
            map.getCanvas().style.cursor = '';
        });
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
    await addTrackLines();
    console.log("Added track lines");
    await addStations();
    console.log("Loaded map layers done");
}

function initMap() {
    const bounds = [
        [-76.58039, 38.80348],
        [-72.79608, 41.75203]
    ]

    map = new mapboxgl.Map({
        container: 'map',
        center: [-74.1, 40.75],
        style: "mapbox://styles/ayaan7m/cmfhdj6gw006i01qu2774d2nz", // 'https://tiles.openfreemap.org/styles/bright',
        maxBounds: bounds
    });

    map.on('style.load', async () => {
        map.fitBounds(bounds, { padding: 40, animate: false });

        const currentZoom = map.getZoom();
        map.setMinZoom(currentZoom);

        loadMapLayers(map);
    });

    map.on('error', function (e) {
        console.log('Map Error:', e.error);
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
}

mapCheck();