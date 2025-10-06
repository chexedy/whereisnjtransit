let map;

let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

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
            "minzoom": 9
        });
    }
}

async function addStations() {
    console.log("Starting");

    const res = await fetch('json/stations.json');
    const data = await res.json();
    console.log("res loaded");

    try {
        const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.src = "/assets/icons/service/station.png";
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
            }
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


async function initMap() {
    const bounds = [
        [-76.58039, 38.80348],
        [-72.79608, 41.75203]
    ];

    map = new maplibregl.Map({
        container: 'map',
        center: [-74.1, 40.75],
        style: {
            "version": 8,
            "text-font": ["Ubuntu Regular", "Ubuntu Medium", "Ubuntu Bold", "Ubuntu Light"],
            "glyphs": "https://pub-6390dca654504cda814dfa4276e5fcac.r2.dev/glyphs/{fontstack}/{range}.pbf",
            "sprite": "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
            "sources": {
                "protomaps": {
                    "type": "vector",
                    "url": "pmtiles://https://pub-6390dca654504cda814dfa4276e5fcac.r2.dev/whereisnjtransit.pmtiles",
                }
            },
            "layers": basemaps.layers("protomaps", basemaps.namedFlavor("light"), { lang: "en" })
        },
        maxBounds: bounds
    });

    map.on('load', async () => {
        const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
            const [name, value] = cookie.split('=');
            acc[name] = value;
            return acc;
        }, {});

        if (cookies.darkTheme === 'true') {
            document.getElementById('darkToggle').checked = true;
            const style = map.getStyle();
            style.sprite = `https://protomaps.github.io/basemaps-assets/sprites/v4/dark`;
            style.layers = basemaps.layers("protomaps", basemaps.namedFlavor("dark"), { lang: "en" });
            map.setStyle(style);
        }

        map.fitBounds(bounds, { padding: 40, animate: false });
        await loadMapLayers(map);

        if (cookies.darkTheme === 'true') {
            map.setPaintProperty('stations-layer', 'text-color', 'rgb(255, 255, 255)');
        }

        if (cookies.hideStations === 'true' && map.getLayer('stations-layer')) {
            map.setLayoutProperty('stations-layer', 'visibility', 'none');
            document.getElementById('stationsToggle').checked = true;
        }

        if (cookies.hideTracks === 'true') {
            const lineLayers = ["meadowlands", "northeastcorridortrack", "northjerseycoasttrack", "pascackvalleytrack", "morrisessextrack", "mainbergentrack", "montclairboontontrack", "raritanvalleytrack", "atlanticcitytrack"];

            lineLayers.forEach(id => {
                if (map.getLayer(id)) {
                    map.setLayoutProperty(id, 'visibility', 'none');
                }
            });

            document.getElementById('tracksToggle').checked = true;
        }

        if (cookies.militaryTime === 'true') {
            militaryTime = true;
            document.getElementById('timeToggle').checked = true;
        }
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