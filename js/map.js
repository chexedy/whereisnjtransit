mapboxgl.accessToken = 'pk.eyJ1IjoiYXlhYW43bSIsImEiOiJjbWZoZTA1c3IwYjg2MnNxMnB6Y3kwdHB6In0.bmb3F3SzeBHWPfmNitzl4w';

const map = new mapboxgl.Map({
    container: 'map', // container ID
	center: [-74.5, 40], // starting position [lng, lat]
	zoom: 9, // starting zoom
    minZoom: 8,
    style: "mapbox://styles/ayaan7m/cmfhdj6gw006i01qu2774d2nz",
});

stations = {
    "Secaucus Junction" : [-74.07575, 40.76131],
    "Newark Penn Station" : [-74.16413, 40.73438],
}

map.on("load", () => {
    for (const key in stations) {
        map.loadImage("../assets/icons/service/station.png"), (error, image) => {
            if (error) throw error;

            map.addImage(key, image);
            map.addSource(key + "source", {
                "type" : "geojson",
                "data" : {
                    "type" : "Feature",
                    "geometry" : {
                        "type" : "Point",
                        "coordinates" : stations[key],
                    }
                }
            })
        }    
    }
})