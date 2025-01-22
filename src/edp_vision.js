import Origo from 'Origo';
import { HubConnectionBuilder } from "@microsoft/signalr";

const EdpVision = function EdpVision(options = {}) {
  const {
    user,
    organisation,
    clientName,
    path,
    serverAddress,
    realEstateLayer
  } = options;

  const userId = sessionStorage.getItem('oidc_user')
    ? JSON.parse(sessionStorage.getItem('oidc_user')).displayname
    : user;
  const query = "?user=" + userId + "&organisation=" + organisation + "&client=" + clientName + "&clientType=External";
  const url = serverAddress + path + query;
  // Delay helper
  const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

  // Connect with SignalR
  const connection = new HubConnectionBuilder()
    .withUrl(url)
    .withAutomaticReconnect()
    .build();

  // Handling of real estates 
  async function centerMapByRealEstate(realEstates) {
    const selectedItems = [];
    const wfsSource = window.origo.api().getLayer(realEstateLayer.layerName).getSource();
    const filterType = wfsSource.getOptions().filterType;
    const filter = `${filterType === 'qgis' ? '"objekt_id"' : 'objekt_id'} IN ('${realEstates.map((realEstate) => realEstate.uuid).join('\', \'')}')`;
    const features = await wfsSource.getFeaturesFromSource(null, filter, false);
    const selectionGroup = realEstateLayer.layerName;
    const selectionGroupTitle = window.origo.api().getLayer(realEstateLayer.layerName).get('title');
    features.forEach((feature) => {
      selectedItems.push(new Origo.SelectedItem(feature, window.origo.api().getLayer(realEstateLayer.layerName), window.origo.api().getMap(), selectionGroup, selectionGroupTitle))
    });
    window.origo.api().getSelectionManager().addItems(selectedItems);
    const feature = features[0];
    if (feature) {
      window.origo.api().zoomToExtent(feature.getGeometry());
    }
  };

  connection.on('HandleRealEstateIdentifiers', async function (realEstates) {
    centerMapByRealEstate(realEstates);
  });

  connection.on('HandleAskingForRealEstateIdentifiers', async function () {
    // TOAST Välj fastighet/fastigheter
    const getSelectedFeatures = window.origo.api().getSelectionManager().getUrval().get(realEstateLayer.layerName).getFeatures();
    const realEstateIdentifiers = getSelectedFeatures.map(f => ({
      Name: f.get(realEstateLayer.attributes.realEstateName),
      Municipality: f.get(realEstateLayer.attributes.municipality),
      Uuid: f.get(realEstateLayer.attributes.objectId)
    }));
    await delay(2000);
    connection.invoke('SendRealEstateIdentifiers', realEstateIdentifiers);
  });

  // Handling of coordinates
  function centerMapByCoordinate(northing, easting, zoom) {
    const view = window.origo.api().getMap().getView();
    view.setCenter([easting, northing]);
    view.setZoom(zoom);
  };

  connection.on('HandleCoordinates', function (coordinates) {
    centerMapByCoordinate(coordinates[0].northing, coordinates[0].easting, 15);
  });

  connection.on('HandleAskingForCoordinates', async function () {
    const mapCenter = window.origo.api().getMap().getView().getCenter();
    const n = mapCenter[1];
    const e = mapCenter[0];
    const srid = window.origo.api().getProjectionCode().replace('EPSG:', '');
    const coords = [{ Northing: n, Easting: e, SpatialReferenceSystemIdentifier: Number(srid) }];
    const el = document.getElementsByClassName('o-position-coords')[0];
    if (!el.classList.contains('o-active')) {
      await delay(2000);
      connection.invoke('SendCoordinates', coords.length ? coords : null);
    } else {
      alert('Aktivera hårkorset för att bestämma koordinaterna att hämta.');
      connection.invoke('SendCoordinates', null);
    }
  });

  // Handling of operation feedback
  connection.on('HandleOperationFeedback', async function (feedback) {
    console.log('Success', feedback);
  });

  // Start the Hub connection
  connection
    .start()
    .then(() => console.info(`Ansluten till ${serverAddress} som ${userId}@${organisation}`))
    .catch(err => console.error(`Misslyckades med att ansluta till ${serverAddress}.`, err));

};

export default EdpVision;
