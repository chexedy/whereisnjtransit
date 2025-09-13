mapboxgl.accessToken = 'pk.eyJ1IjoiYXlhYW43bSIsImEiOiJjbWZoZTA1c3IwYjg2MnNxMnB6Y3kwdHB6In0.bmb3F3SzeBHWPfmNitzl4w';

const map = new mapboxgl.Map({
    container: 'map', // container ID
    center: [-74.1, 40.75], // starting position [lng, lat]
    zoom: 10, // starting zoom
    minZoom: 8,
    style: "mapbox://styles/ayaan7m/cmfhdj6gw006i01qu2774d2nz",
});

fetch('./json/stations.json')
    .then(res => res.json())
    .then(data => {
        map.on('load', () => {
            // Load your custom image
            map.loadImage("../assets/icons/service/station.png", (error, image) => {
                if (error) throw error;

                // Add the image to the map style
                if (!map.hasImage('station-icon')) {
                    map.addImage('station-icon', image);
                }

                // Add GeoJSON source
                map.addSource('stations', {
                    type: 'geojson',
                    data: data.stations
                });

                // Add a symbol layer using the custom icon
                map.addLayer({
                    id: 'stations-layer',
                    type: 'symbol',
                    source: 'stations',
                    layout: {
                        'icon-image': 'station-icon',
                        'icon-size': 0.1, // adjust to make it bigger/smaller
                        'icon-allow-overlap': true,
                        'text-field': ['get', 'description'], // optional label
                        'text-offset': [0, 1.2],
                        'text-anchor': 'top'
                    }
                });

                // Add popup on click
                map.on('click', 'stations-layer', (e) => {
                    const props = e.features[0].properties;
                    new mapboxgl.Popup()
                        .setLngLat(e.lngLat)
                        .setHTML(`<h3>${props.title}</h3><p>${props.description}</p>`)
                        .addTo(map);
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