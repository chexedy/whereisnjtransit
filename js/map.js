mapboxgl.accessToken = 'pk.eyJ1IjoiYXlhYW43bSIsImEiOiJjbWZoZDZrd3YwYXNyMnFxNjFoYzBrNWozIn0.59Ytrv3w2xPkUr3FYRxMbg';
const bounds = [
    [-76.58039, 38.80348],
    [-72.79608, 41.75203]
]

const map = new mapboxgl.Map({
    container: 'map',
    center: [-74.1, 40.75],
    style: "mapbox://styles/ayaan7m/cmfhdj6gw006i01qu2774d2nz",
    maxBounds: bounds
});

map.on('load', () => {
    map.fitBounds(bounds, { padding: 40, animate: false });

    const currentZoom = map.getZoom();
    map.setMinZoom(currentZoom);
});

fetch('./json/stations.json')
    .then(res => res.json())
    .then(data => {
        map.on('load', () => {
            map.loadImage("../assets/icons/service/station.png", (error, image) => {
                if (error) throw error;

                if (!map.hasImage('station-icon')) {
                    map.addImage('station-icon', image);
                }

                map.addSource('stations', {
                    type: 'geojson',
                    data: data.northeastcorridor
                });

                map.addLayer({
                    id: 'stations-layer',
                    type: 'symbol',
                    source: 'stations',
                    minzoom: 0,
                    maxzoom: 24,
                    layout: {
                        'icon-image': 'station-icon',
                        'icon-size': 0.175,
                        'icon-allow-overlap': true,
                        'text-field': ['get', 'description'],
                        'text-offset': [0, 1.2],
                        'text-anchor': 'top',
                    },
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
            });
        });
    });

fetch('./json/northeastcorridortrack.json')
    .then(res => res.json())
    .then(data => {
        map.on('load', () => {
            map.addSource('route', {
                type: 'geojson',
                data: data.northeastcorridortrack
            });

            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': 'rgb(239, 62, 66)',
                    'line-width': 8
                }
            });
        });
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