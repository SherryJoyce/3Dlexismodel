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
  console.error("Error loading tileset:", error);
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

  if (!feature || !(feature instanceof Cesium.Cesium3DTileFeature)) {
    infoBox.innerHTML = "<div>No valid feature selected</div>";
    return;
  }

  try {
    const props = feature.getPropertyNames();
    if (!props || props.length === 0) {
      // Fallback: Use feature._properties if getPropertyNames() is unavailable
      const fallbackProps = feature._properties || {};
      if (Object.keys(fallbackProps).length === 0) {
        infoBox.innerHTML = "<div>No properties found.</div>";
        return;
      }

      for (const [prop, value] of Object.entries(fallbackProps)) {
        const div = document.createElement("div");
        div.innerHTML = `<strong>${prop}</strong>: ${value}`;
        infoBox.appendChild(div);
      }
    } else {
      props.forEach((prop) => {
        const value = feature.getProperty(prop);
        const div = document.createElement("div");
        div.innerHTML = `<strong>${prop}</strong>: ${value}`;
        infoBox.appendChild(div);
      });
    }
  } catch (error) {
    //infoBox.innerHTML = `<div>Error: ${error.message}</div>`;
    console.error("Error in showInfoBox:", error);
  }
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
        li.textContent = `${item.party_name || "Unnamed"} — ID Number: ${
          item.id_number || "N/A"
        }, Model ID: ${item.model_id || "N/A"}`;
        li.onclick = () => handleSearchSelection(item.id_number); // Pass id_number
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

async function handleSearchSelection(idNumber) {
  searchInput.value = "";
  searchResults.classList.add("hidden");

  const tileset = viewer.scene.primitives._primitives.find(
    (p) => p instanceof Cesium.Cesium3DTileset
  );

  if (!tileset) {
    console.error("Tileset not found");
    return;
  }

  let foundFeature = null;

  // Traverse tiles to find the matching feature
  tileset.tileVisible.addEventListener((tile) => {
    for (let i = 0; i < tile.content.featuresLength; i++) {
      const feature = tile.content.getFeature(i);
      const featureIdNumber = feature.getProperty("id_number");

      if (featureIdNumber === idNumber) {
        console.log("Found matching feature:", feature);
        highlightFeature(feature);
        viewer.flyTo(feature, {
          offset: new Cesium.HeadingPitchRange(0, -0.5, 10),
        });
        showInfoBox(feature);
        foundFeature = feature;
        break;
      }
    }
  });

  viewer.scene.requestRender();

  if (foundFeature) {
    highlightFeature(foundFeature);
    viewer.flyTo(foundFeature, {
      offset: new Cesium.HeadingPitchRange(0, -0.5, 10),
    });
    showInfoBox(foundFeature);
  } else {
    console.warn(`No feature found for id_number: ${idNumber}`);
  }
}

function highlightFeature(feature) {
  if (!feature) return;

  if (Cesium.defined(selected.feature)) {
    selected.feature.color = selected.originalColor;
  }

  selected.feature = feature;
  selected.originalColor = Cesium.Color.clone(
    feature.color,
    new Cesium.Color()
  );
  feature.color = Cesium.Color.RED.withAlpha(0.7);
}
