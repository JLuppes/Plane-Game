import {
  engineInit,
  drawText,
  drawTile,
  tile,
  time,
  vec2,
  setTileDefaultPadding,
  setCanvasFixedSize,
  cameraScale,
  drawRect,
  Color,
  setCameraScale,
  cameraPos,
  keyWasPressed,
  mouseWasPressed,
  Sound,
  setTileDefaultBleed,
  engineObjectsDestroy,
  particleEffectsLoad,
  ParticleEmitter,
  fetchJSON,
  engineAddLoad,
  Timer,
  mousePosScreen,
  randPick,
} from "littlejsengine";
import { Player } from "./Player";
import { PowerUp } from "./PowerUp";
import { Bullet } from "./Bullet";
import { Enemy } from "./Enemy";
import tilesURL from "./data/tiles/tiles.png";
import shipsURL from "./data/tiles/ships.png";
import inputURL from "./data/tiles/input.png";
import powerupsDefaultData from "./data/powerups/default.json";
import enemiesDefaultData from "./data/enemies/default.json";
import particleEffectsData from "./data/particles/particleEffects.json";

export const playerFrame = 5;
export const playerSize = 2.5;

const listOfPowerups = (
  await Promise.all([
    engineAddLoad(powerupsDefaultData),
    engineAddLoad(fetchJSON(`./customPowerups.json`)),
  ])
).flat();

const listOfEnemies = (
  await Promise.all([
    engineAddLoad(enemiesDefaultData),
    engineAddLoad(fetchJSON(`./customEnemies.json`)),
  ])
).flat();

export const G = {
  system: {
    // Logical grid size (in tiles)
    width: 20,
    height: 30,
    tileSize: 16,
    tileSheets: { ships: 0, general: 1, input: 2 },
    tiles: [shipsURL, tilesURL, inputURL],
    currentHeldPowerUp: {},
    currentActiveEffects: [],
    infoPopups: [],
    mouseEnabled: true,
    alternateMouseControl: true,
    showControls: true,
    respawnWaitTime: 2,
    logPulseTime: 1,
    logPulse: new Timer(1),
    playerFrame: 5,
    playerSize: 2.5,
    invincibleTimer: new Timer(),
    powerupTimer: new Timer(),
    cols: {
      white: new Color().setHex("#ffffff"),
      red: new Color().setHex("#ff0000"),
      sky: new Color().setHex("#cfe7f7"),
    },
    sfx: {
      fly: new Sound([0.25, 0.5, 40, 0.5, , 0.2, , 11, , , , , , 199]),
      hit: new Sound([
        2.1,
        ,
        156,
        0.01,
        0.01,
        0.3,
        2,
        0.6,
        ,
        ,
        ,
        ,
        ,
        1.3,
        ,
        0.2,
        0.14,
        0.45,
        0.01,
        ,
        150,
      ]),
    },
  },
  score: 0,
  startScore: 0,
  startHealth: 1,
  startLives: 2,
  livesDisplayMax: 3,
  startSpeed: 0.1,
  speedScoreFactor: 1,
  speedIncreaseFactor: 1,
  enemySpawnRate: 1,
  powerupSpawnRate: 1,
  slowdownFactor: 0.03,
  powerupCooldown: 2.0,
  playerLives: 1,
  playerDamage: 1,
  invincibleTime: 3,
  friendlyFire: false,
};

// called once after the engine starts up
function gameInit() {
  // setup the game
  G.score = G.startScore;
  G.playerHealth = G.startHealth;
  G.playerLives = G.startLives;

  G.system.invincibleTimer.set(0);
  G.system.powerupTimer.set(0);

  G.system.currentHeldPowerUp = {};

  // Compute the fixed canvas size in screen pixels
  const gameSize = vec2(
    G.system.width * G.system.tileSize,
    G.system.height * G.system.tileSize,
  );

  // Lock canva to an exact pixel size
  // Prevents browser scaling and keeps pixels crisp
  setCanvasFixedSize(gameSize);

  // Cache the logical grid size as a vector (in tiles, not pixels)
  G.size = vec2(G.system.width, G.system.height);

  // World space center point (origin-based)
  // Useful for camera position, spawning, etc.
  G.system.center = vec2(0);

  // Set camera scale so that
  // 1 world unit == 1 tile
  // (1x1 object renders as 16x16 pixels)
  // cameraScale = G.system.tileSize;
  setCameraScale(G.system.tileSize);

  engineObjectsDestroy();

  G.system.player = new Player(G);

  G.speed = G.startSpeed;

  setTileDefaultBleed(0.5);
}

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state

  G.score += G.speed * (G.speedScoreFactor / 5);

  G.speed += G.speed * (G.speedIncreaseFactor * 0.0005);

  // randomly generate enemies
  if (rand() > 1 - 0.006 * G.enemySpawnRate) {
    const selectedEnemy = randPick(listOfEnemies);
    console.log("Spawning enemy: " + selectedEnemy.enemyName);
    new Enemy(G, selectedEnemy);
  }

  // randomly generate powerups
  if (
    rand() > 1 - 0.005 * G.powerupSpawnRate &&
    G.system.powerupTimer.elapsed()
  ) {
    const powerUpChoice = randPick(listOfPowerups);
    new PowerUp(G, powerUpChoice);
    G.system.powerupTimer.set(G.powerupCooldown);
  }

  if (
    G.system.player.crashed &&
    time > G.system.player.crashed + G.system.respawnWaitTime &&
    (mouseWasPressed(0) || keyWasPressed("Space"))
  ) {
    gameInit();
  }

  if (G.system.currentActiveEffects.length > 0) {
    for (let thisEffect in G.system.currentActiveEffects) {
      const currentEffect = G.system.currentActiveEffects[thisEffect];
      if (!currentEffect.effectActive) {
        console.log(
          "Activating effect: " + G.system.currentActiveEffects[currentEffect],
        );
        currentEffect.effectActive = true;
        currentEffect.timer = new Timer(
          currentEffect.powerupData.duration
            ? currentEffect.powerupData.duration
            : 3,
        );
        currentEffect.startUp();
      }
    }

    const oldEffect = G.system.currentActiveEffects.filter((effect) =>
      effect.timer.elapsed(),
    );
    for (const thisOldeEffect in oldEffect) {
      oldEffect[thisOldeEffect].shutDown();
    }

    G.system.currentActiveEffects = G.system.currentActiveEffects.filter(
      (effect) => !effect.timer.elapsed(),
    );

    if (G.system.logPulse.elapsed()) {
      for (let thisEffect in G.system.currentActiveEffects) {
        console.log(
          "Active effect: " + G.system.currentActiveEffects[thisEffect].name,
        );
      }
      G.system.logPulse.set(G.system.logPulseTime);
    }
  }
}

function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

function gameRender() {
  //clear screen with white rectangle
  drawRect(G.system.center, G.size, G.system.cols.sky);
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects

  // Currently Held Powerup UI Display
  let powerupFrameStartPos = cameraPos.copy().add(vec2(7, -13));
  // Button Display
  if (G.system.showControls) {
    drawTile(
      vec2(powerupFrameStartPos.x, powerupFrameStartPos.y + 2),
      vec2(1.5),
      tile(87, G.system.tileSize, G.system.tileSheets["input"]),
    );
  }
  // Frame
  drawTile(
    powerupFrameStartPos,
    vec2(2.5),
    tile(27, G.system.tileSize, G.system.tileSheets["general"]),
  );
  // Current Powerup
  if (G.system.currentHeldPowerUp.tileData) {
    drawTile(
      powerupFrameStartPos,
      vec2(1.5),
      G.system.currentHeldPowerUp.tileData,
    );
  }

  // Score UI Display
  let score = Math.floor(G.score).toString().padStart(4, "0");
  let scoreStartPos = cameraPos.copy().add(vec2(-8, 13));
  score.split("").forEach((num, index) => {
    num = parseInt(num, 10);
    drawTile(
      scoreStartPos.add(vec2(index * 1.75, 0)),
      vec2(2.5),
      tile(
        19 + (num > 4 ? 7 + num : num),
        G.system.tileSize,
        G.system.tileSheets["general"],
      ),
    );
  });

  // Lives Display
  let lives = Math.floor(G.playerLives);
  let livesStartPos = cameraPos.copy().add(vec2(-8, -13));
  let livesDisplayMax = G.livesDisplayMax;
  if (lives <= livesDisplayMax) {
    for (let i = 0; i < lives; i++) {
      if (i <= 3) {
        drawTile(
          livesStartPos.add(vec2(i * 1.75, 0)),
          vec2(2.5),
          tile(
            G.system.player.currentFrame,
            G.system.tileSize * 2,
            G.system.tileSheets["ships"],
          ),
        );
      }
    }
  } else {
    let lives = Math.floor(G.playerLives).toString();
    drawTile(
      livesStartPos.add(vec2(0, 0)),
      vec2(2.5),
      tile(
        G.system.player.currentFrame,
        G.system.tileSize * 2,
        G.system.tileSheets["ships"],
      ),
    );
    lives.split("").forEach((num, index) => {
      num = parseInt(num, 10);
      drawTile(
        livesStartPos.add(vec2(index * 1.75 + 0.75 * 2.5, 0)),
        vec2(2),
        tile(
          19 + (num > 4 ? 7 + num : num),
          G.system.tileSize,
          G.system.tileSheets["general"],
        ),
      );
    });
  }

  // Game Over Screen
  if (G.system.player.crashed && Math.sin(time * 5) > 0) {
    drawText("GAME OVER", vec2(0, 0), 2, G.system.cols.red, 0.5);
  }

  // Controls Display
  if (G.system.showControls) {
    const mouseControlsStartPos = vec2(
      G.system.center.x + 9.25,
      G.system.center.y - 13,
    );
    drawTile(
      mouseControlsStartPos,
      vec2(1.5),
      tile(76, G.system.tileSize, G.system.tileSheets["input"]),
    );
    drawTile(
      mouseControlsStartPos.add(vec2(0, 2)),
      vec2(1.5),
      tile(161, G.system.tileSize, G.system.tileSheets["input"]),
    );
  }

  // Info popups
  G.system.infoPopups = G.system.infoPopups.filter(
    (popup) => !popup.displayTimer.elapsed(),
  );
  for (const thisPopup in G.system.infoPopups) {
    G.system.infoPopups[thisPopup].display();
  }
}

// fires up LittleJS with all necessary functions and tiles
await engineAddLoad(particleEffectsLoad("./particleEffects.json"));
engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  G.system.tiles,
);
