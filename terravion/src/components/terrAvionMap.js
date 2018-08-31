import * as React from "react";
import { Map, TileLayer, Polygon, LayersControl } from "react-leaflet"

export default class TerrAvionMap extends React.Component {

    constructor() {
        super();
        this.state = {
            lat: 51.505,
            lng: -0.09,
            zoom: 15,
            userBlocks: [],
            blockId: "48ed28ca-d272-4d1f-bfe0-cb95b61eecbc",
            userId: "5bad4dfa-7262-4a0a-b1e5-da30793cec65",
            accessToken: "2e68cee0-b2fd-4ef5-97f6-8e44afb09ffa",
            layerTypes: [
                { name: "NC", value: "product=NC" },
                { name: "CIR", value: "product=CIR" },
                { name: "NDVI", value: "product=NDVI&colorMap=GRANULAR" },
                { name: "TIRS", value: "product=TIRS&colorMap=T" },
                { name: "ZONE", value: "product=ZONE&colorMap=GRANULAR" }
            ],
            layers: [],
            currentBlock: {},
            mapOptions: {
                date: "",
                layer: "product=NC"
            }

        }
    };
    getUserBlocks = () => {
        fetch(`https://api2.terravion.com/userBlocks/getUserBlocksForMap?userId=${this.state.userId}&access_token=${this.state.accessToken}`)
            .then(res => res.json())
            .then((res) => {
                let currentBlock = res.find(block => block.blockId === this.state.blockId);
                let lat = (currentBlock.fieldTLLat + currentBlock.fieldBRLat) / 2;
                let lng = (currentBlock.fieldTLLng + currentBlock.fieldBRLng) / 2;
                this.setState({ userBlocks: res, currentBlock: currentBlock, lat: lat, lng: lng })
            },
                (error) => {
                    console.warn(error)
                })
    }
    getBlockLayers = () => {
        fetch(`https://api2.terravion.com/layers/getLayersFromBlockId?blockId=${this.state.blockId}&access_token=${this.state.accessToken}`)
            .then(res => res.json())
            .then((res) => {
                this.setState({ layers: res, mapOptions: { ...this.state.mapOptions, date: res[0].layerDateEpoch } })
            },
                (error) => {
                    console.warn(error)
                })
    }
    componentDidMount() {
        this.getBlockLayers();
        this.getUserBlocks();
    }
    onChangeDate = (date) => {
        this.setState({ mapOptions: { ...this.state.mapOptions, date: date } })
    }
    onChangeLayer = (layer) => {
        this.setState({ mapOptions: { ...this.state.mapOptions, layer: layer } })
    }
    renderLayer = () => {
        let geo = JSON.parse(this.state.currentBlock.geom);
        geo.coordinates[0].map(coord => coord.reverse());
        switch (geo.type) {
            case "Polygon":
                return (
                    <React.Fragment>
                        <Polygon
                            positions={geo.coordinates[0]}
                        />

                    </React.Fragment >
                )
            default:
                return "";
        }
    }
    convertDate = (date) => {
        console.log(date)
        return `${new Date(date * 1000).toDateString()}`;
    }
    render() {
        var position = [this.state.lat, this.state.lng];
        return (
            <React.Fragment>
                <div className="form-group row">
                    <div className="col">
                        <label htmlFor="productType">Product Type</label>
                        <select className="form-control" id="productType" onChange={(e) => this.onChangeLayer(e.target.value)}>
                            {this.state.layerTypes.map((opt, idx) =>
                                <option value={opt.value} key={idx}>{opt.name}</option>
                            )}
                        </select>
                    </div>
                    <div className="col">
                        <label htmlFor="date">Date</label>
                        <select className="form-control" id="date" onChange={(e) => this.onChangeDate(e.target.value)}>
                            {this.state.layers.map((layer, idx) =>
                                <option value={layer.layerDateEpoch} key={idx}>{this.convertDate(layer.layerDateEpoch)}</option>
                            )}
                        </select>
                    </div>
                </div>
                <Map center={position} zoom={this.state.zoom}>
                    {/* <TileLayer
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url='http://{s}.tile.osm.org/{z}/{x}/{y}.png'
                    /> */}
                    <LayersControl>
                        <LayersControl.BaseLayer name="mapbox" checked={true}>
                            <TileLayer
                                url="https://api.tiles.mapbox.com/v2/cgwright.ca5740e5/{z}/{x}/{y}.jpg"
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.Overlay name="overlay" checked={true}>
                            <TileLayer
                                url={`https://api2.terravion.com/users/${this.state.userId}/{z}/{x}/{y}.png?epochStart=0&epochEnd=${this.state.mapOptions.date}&access_token=${this.state.accessToken}&${this.state.mapOptions.layer}`}
                                attribution="TerrAvion"
                                maxZoom="19"
                                tms={true}
                                checked={true}
                            //https://api2.terravion.com/users/5bad4dfa-7262-4a0a-b1e5-da30793cec65/15/5290/20191.png?epochStart=1456200627&epochEnd=1456632627&access_token=2e68cee0-b2fd-4ef5-97f6-8e44afb09ffa&product=NC
                            />
                        </LayersControl.Overlay>
                    </LayersControl>
                    {/* <Marker position={position}>
                        <Popup>
                            A pretty CSS3 popup. <br /> Easily customizable.
                    </Popup>
                    </Marker>
                    {this.state.currentBlock.geom && this.renderLayer()} */}

                </Map>
            </React.Fragment>
        )
    };
};