import OBR, { buildCurve } from "@owlbear-rodeo/sdk";
import { imageToImageData } from './imageToImageData';
import { floodFillToPolygon } from './floodFillToPolygon';

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
      const rings = floodFillToPolygon(imageData, pointerPos.x, pointerPos.y);
      console.log("Final rings: ", rings)
      
      // Create an owlbear rodeo fog polygon 
      let items = [];
      rings.map(ring => {
        // Ignore rings with size of 2
        if (ring.length <= 2) {
          return;
        }
        
        let fog = buildCurve()
        .points(
          ring
        )
        .tension(0)
        .layer("FOG")
        .scale({x: 3, y:3})
        .build();
        items.push(fog);
      });

      // Place that fog onto the map
      for (let i = 0; i < items.length; i += 2) {
        await OBR.scene.items.addItems(items.slice(i, i + 2)); // ✅ GOOD
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