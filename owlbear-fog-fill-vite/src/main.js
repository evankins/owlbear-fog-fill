import OBR, { buildCurve } from "@owlbear-rodeo/sdk";
import { imageToImageData } from './imageToImageData';
import { floodFillToPolygon as floodFillToPolygons } from './floodFillToPolygon';

const ID = "com.evankinsey.fog-fill";

// subscribe to scene changes to clear the local copy of scene?
let scene;
let imageData;

function createMode() {
  OBR.tool.createMode({
    id: `${ID}/tool`,
    icons: [
      {
        icon: "/add.svg",
        label: "Fog Fill",
        // Only show if fog tool is open
        filter: {
          activeTools: [`rodeo.owlbear.tool/fog`],
        },
      },
    ],
    async onToolClick(context, event) {
      // Get the position of the pointer
      const pointerPos = 
        {x: event.pointerPosition.x / 3, y: event.pointerPosition.y / 3}

      // Relate that position to a point on the map
      //    - Prompt user for map if not given
      //    - Image url expires shortly after given
      if (!scene)
      {
        scene = await OBR.assets.downloadScenes(false);
        imageData = await imageToImageData(scene[0].items[0].image.url);
      }
      console.log('scene --->', scene);
      console.log('imageData --->', imageData);
      

      const imageSize = {
        x: scene[0].items[0].image.width,
        y: scene[0].items[0].image.height
      };

      
      console.log('imageSize --->', imageSize);
      console.log('pointerPos --->', pointerPos);

      // Ignore if out of bounds
      //    - Either value is negative or larger than map size
      //    - Send message if ignored
      //    - My current observation is x/y is 3 times the size of 
      //      original map uploaded, what determines that?

      // Exit if invalid mouse position
      if (pointerPos.x > imageSize.x ||
          pointerPos.y > imageSize.y ||
          pointerPos.x < 0 ||
          pointerPos.y < 0
      )
      {
        console.log("Bad")
        return; // Early return, invalid mouse position
      }
        
      console.log("Good")

      // Run a fill algorithm that returns an array of points to 
      // create a polygon
      const polygons = floodFillToPolygons(imageData, pointerPos.x, pointerPos.y);
      console.log("Final polygons: ", polygons)
      
      // Create an owlbear rodeo fog polygon 

      // Place that fog onto the map
      for (let i = 0; i < polygons.length; i += 1) {
        console.log("Adding item", i);
        await OBR.scene.items.addItems(polygons.slice(i, i + 1));
        console.log("Waiting 1 second");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  });
}

async function getInfo() {
  console.log(await OBR.scene.local.getItems())
}

OBR.onReady(() => {
  createMode();
  getInfo();
});