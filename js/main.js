// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZWI4YmI1My01ZTdiLTQ1YjMtYTQzMy1lMTFiNjU5ZTU3ZmYiLCJpZCI6MjY2MDM4LCJpYXQiOjE3MzU3MDU5NjR9.pPZu5A7x8SkeYKAvo7zlC1L30yEf7yyISFmCZ8adwk8";

const viewer = new Cesium.Viewer("cesiumContainer");
let tileset;

try {
  tileset = await Cesium.Cesium3DTileset.fromIonAssetId(3465352);
  viewer.scene.primitives.add(tileset);
  await viewer.zoomTo(tileset);

  const extras = tileset.asset.extras;
  if (
    Cesium.defined(extras) &&
    Cesium.defined(extras.ion) &&
    Cesium.defined(extras.ion.defaultStyle)
  ) {
    tileset.style = new Cesium.Cesium3DTileStyle(extras.ion.defaultStyle);
  }
} catch (error) {
  console.log(error);
}

let selected = {
  feature: undefined,
  originalColor: new Cesium.Color(),
};

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

// CLICK — Green + InfoBox
handler.setInputAction(function (click) {
  const pickedFeature = viewer.scene.pick(click.position);

  // Unselect previous
  if (Cesium.defined(selected.feature)) {
    selected.feature.color = selected.originalColor;
    selected.feature = undefined;
  }

  // Select new
  if (
    Cesium.defined(pickedFeature) &&
    pickedFeature instanceof Cesium.Cesium3DTileFeature
  ) {
    selected.feature = pickedFeature;
    selected.originalColor = Cesium.Color.clone(
      pickedFeature.color,
      new Cesium.Color()
    );
    pickedFeature.color = Cesium.Color.GREEN.withAlpha(0.7);

    showInfoBox(pickedFeature);
  } else {
    hideInfoBox();
  }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// InfoBox function
function showInfoBox(feature) {
  const infoBox = document.getElementById("infoBox");
  infoBox.innerHTML = "";
  infoBox.classList.remove("hidden");

  const props = feature.getPropertyNames();
  props.forEach((prop) => {
    const value = feature.getProperty(prop);
    const div = document.createElement("div");
    div.innerHTML = `<strong>${prop}</strong>: ${value}`;
    infoBox.appendChild(div);
  });
}

function hideInfoBox() {
  const infoBox = document.getElementById("infoBox");
  infoBox.innerHTML = "";
  infoBox.classList.add("hidden");
}

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  console.log(`Searching for: ${query}`);

  if (!query || query.length < 2) {
    searchResults.classList.add("hidden");
    searchResults.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(
      `http://localhost:3000/api/search?q=${encodeURIComponent(query)}`
    );

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const results = await res.json();
    console.log("Search results:", results);

    searchResults.innerHTML = "";

    if (results.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No results found";
      searchResults.appendChild(li);
    } else {
      results.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${item.name || "Unnamed"} (${item.uid || "No ID"})`;
        li.onclick = () => handleSearchSelection(item.model_id);
        searchResults.appendChild(li);
      });
    }

    searchResults.classList.remove("hidden");
  } catch (error) {
    console.error("Search failed:", error);
    searchResults.innerHTML = `<li class="error">Search unavailable</li>`;
    searchResults.classList.remove("hidden");
  }
});

async function handleSearchSelection(modelId) {
  searchInput.value = "";
  searchResults.classList.add("hidden");

  // Find the 3D model with this model_id
  const tileset = viewer.scene.primitives._primitives.find(
    (p) => p instanceof Cesium.Cesium3DTileset
  );

  const content = tileset._root.content;
  let found = false;

  tileset.tileVisible.addEventListener((tile) => {
    for (let i = 0; i < tile.content.featuresLength; i++) {
      const feature = tile.content.getFeature(i);
      if (feature.getProperty("model_id") === modelId) {
        highlightFeature(feature);
        found = true;
        break;
      }
    }
  });

  viewer.scene.requestRender(); // Force redraw

  // Optionally fetch and show infoBox immediately
  const feature = await findFeatureByModelId(modelId);
  if (feature) showInfoBox(feature);
}

// Helper function: manually search model
async function findFeatureByModelId(modelId) {
  const tileset = viewer.scene.primitives._primitives.find(
    (p) => p instanceof Cesium.Cesium3DTileset
  );
  let foundFeature = null;

  await tileset.readyPromise;

  tileset.tileVisible.addEventListener((tile) => {
    for (let i = 0; i < tile.content.featuresLength; i++) {
      const feature = tile.content.getFeature(i);
      if (feature.getProperty("model_id") === modelId) {
        foundFeature = feature;
        break;
      }
    }
  });

  viewer.scene.requestRender();
  return foundFeature;
}
