const STATION_INFORMATION_URL = "http://gbfs.urbansharing.com/oslobysykkel.no/station_information.json";
const STATION_STATUS_URL = "http://gbfs.urbansharing.com/oslobysykkel.no/station_status.json";
const MAPBOX_ACCESS_TOKEN_TOKEN = "YOUR MAPBOX ACCESS TOKEN"; // Place your access token here

const success = position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    renderMap(latitude, longitude);
}

const error = () => {
    console.log('Unable to retrieve your location, using default coordinates');

    const latitude = '59.913868';
    const longitude = '10.752245';

    renderMap(latitude, longitude);
}

const renderMap = (latitude, longitude) => {
    let map = L.map('mapid').setView([latitude, longitude], 14);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: MAPBOX_ACCESS_TOKEN_TOKEN
    }).addTo(map);

    let osloCityBikeMap = new Map();

    getData(STATION_INFORMATION_URL)
        .then(stationInformation => {
            const stationInformationData = stationInformation.data.stations;
            stationInformationData.forEach(data => {
                osloCityBikeMap.set(data.station_id, new Map([["name", data.name], ["lat", data.lat], ["lon", data.lon]]));
            });

            getData(STATION_STATUS_URL)
                .then(stationStatus => {
                    let stationStatusData = stationStatus.data.stations;
                    stationStatusData.forEach(data => {
                        const stationData = osloCityBikeMap.get(data.station_id);
                        osloCityBikeMap.set(data.station_id,
                            new Map([
                                ...stationData,
                                ["numBikesAvailable", data.num_bikes_available],
                                ["numDocksAvailable", data.num_docks_available]
                            ])
                        );
                    });

                    renderMarkers(osloCityBikeMap, map);
                })
                .catch(() => console.log("Failed to fetch station status"))
        })
        .catch(err => console.log("Failed to fetch station information"));
};

const getData = async url => {
    let response = await fetch(url, {
        headers: { "Client-Identifier": "kapy-oslobikecity" }
    });
    let data = await response.json();
    return data;
};

const renderMarkers = (osloCityBikeMap, map) => {
    osloCityBikeMap.forEach(value => {
        const latitude = value.get("lat");
        const longitude = value.get("lon");
        L.marker([latitude, longitude], {
            icon: new L.DivIcon({
                html: value.get("numBikesAvailable"),
                className: value.get("numBikesAvailable") > 0 ? 'blueMarker' : 'greyMarker'
            })
        }).addTo(map)
            .bindPopup(
                `<div class="popup">
                    <div class="name">${value.get("name")}</div>
                    <div class="row">
                        <span><img src="icons/bike.png" /></span>
                        ${value.get("numBikesAvailable")} bikes
                    </div>
                    <div class="row">
                        <span><img src="icons/parking.png" /></span>
                        ${value.get("numDocksAvailable")} available spots
                    </div>
                </div>`
            );
    });
};

navigator.geolocation.getCurrentPosition(success, error);