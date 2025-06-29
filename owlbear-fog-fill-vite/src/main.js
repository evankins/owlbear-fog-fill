import OBR, { buildWall, buildCurve } from "@owlbear-rodeo/sdk";

const ID = "com.evankinsey.fog-fill";

// subscribe to scene changes to clear the local copy of scene?
let scene;

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
      const pointerPos = event.pointerPosition;

      // Relate that position to a point on the map
      //    - Prompt user for map if not given
      //    - Image url expires shortly after given
      if (!scene)
      {
        scene = await OBR.assets.downloadScenes(false);
      }
      console.log('scene --->', scene);

      const imageSize = {
        x: scene[0].items[0].image.width * 3,
        y: scene[0].items[0].image.height * 3
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

      // Create an owlbear rodeo fog polygon 
      
      const fog = buildCurve()
      .points([
        { x: pointerPos.x, y: pointerPos.y },
        { x: 150, y: 0 },
        { x: 150, y: 150 },
      ])
      .tension(0)
      .layer("FOG")
      .build();

      // Place that fog onto the map
      OBR.scene.items.addItems([fog]);
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