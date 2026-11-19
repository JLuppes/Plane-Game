import {
  engineInit,
  drawText,
  drawTile,
  clamp,
  tile,
  time,
  vec2,
  setCanvasFixedSize,
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
  fetchJSON,
  engineAddLoad,
  Timer,
  rand,
  randWeighted,
} from "littlejsengine";
import { Player } from "./Player";
import { PowerUp } from "./PowerUp";
import { Enemy } from "./Enemy";
import generalSpritesURL from "./data/sprites/general.png";
import shipsSpritesURL from "./data/sprites/ships.png";
import inputSpritesURL from "./data/sprites/input.png";
import emojisSpritesURL from "./data/sprites/emojis.png";
import powerupsDefaultData from "./data/defaultPowerups.json";
import enemiesDefaultData from "./data/defaultEnemies.json";
import defaultGameInfo from "./data/defaultGameInfo.json";

export const G = {
  difficulty: 1,
  speedToDifficultyScale: 1,
  score: 0,
  startScore: 0,
  startHealth: 20,
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
  invincibleTimeDie: 3,
  invincibleTimeHit: 1,
  friendlyFire: false,
};

G.system = {
  active: false,
  // Logical grid size (in tiles)
  width: 20,
  height: 30,
  tileSize: 16,
  tileSheets: { ships: 0, general: 1, input: 2, emoji: 3, custom: 4 },
  tiles: [
    shipsSpritesURL,
    generalSpritesURL,
    inputSpritesURL,
    emojisSpritesURL,
    "./custom/customSprites.png",
  ],
  difficulty: 1,
  healthDisplayText: false,
  currentHeldPowerUp: {},
  currentActiveEffects: [],
  infoPopups: [],
  currentEnemies: [],
  currentPowerups: [],
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
  firstStart: true,
  speedDisplay: false,
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
};

let listOfPowerups = [];
let listOfEnemies = [];
let gameInfo = {};

await loadCustoms();

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

  setTileDefaultBleed(0.5);

  if (G.system.firstStart) {
    let startWaitTime = 3;
    G.system.readyTimer = new Timer(startWaitTime);
    G.system.startTime = time;
    G.system.gameStarted = false;
    G.speed = 0;
    G.system.demoEnemyTimer = new Timer(2);
    G.system.demoEnemyCounter = 0;
    G.system.demoEnemyList = [];
  }

  G.speed = G.startSpeed;
}

function startGame() {
  console.log("Starting game!");
  G.system.gameStarted = true;
  G.system.firstStart = false;
  G.system.active = true;
  gameInit();
}

function getWeights(listToGetWeights = []) {
  return listToGetWeights.map((e) => {
    let powerLevel = e.powerLevel
      ? e.powerLevel
      : e.priority
        ? 1 / (e.priority || 1)
        : 1;
    let numerator = Math.pow(powerLevel, G.system.difficulty);
    let denominator = Math.max(Math.pow(powerLevel, 4), 0.1);
    return numerator / denominator;
  });
}

function randomEnemy() {
  let enemyWeights = getWeights(listOfEnemies);
  const selectedEnemy = randWeighted(listOfEnemies, enemyWeights);
  console.log("Spawning enemy: " + selectedEnemy.enemyName);
  const newEnemy = new Enemy(G, selectedEnemy);
  G.system.currentEnemies.push(newEnemy);
  return newEnemy;
}

function launchDemoEnemy() {
  const newDemoEnemy = randomEnemy();
  let newX = G.system.width / 2;
  newDemoEnemy.pos.x = rand(-newX, newX);
  newDemoEnemy.pos.y = -16;
  newDemoEnemy.demoSpeed = rand(-0.08, -0.14);
  newDemoEnemy.shootPlayer = false;
  newDemoEnemy.setCollision(false, false, false, false);
  newDemoEnemy.angle = 0;
  newDemoEnemy.chasePlayer = false;
  G.system.demoEnemyList.push(newDemoEnemy);
  G.system.demoEnemyTimer.set(2);
}

function cleanUp(listOfEngineObjects, oldTime = 20, fleeTime = 10) {
  listOfEngineObjects = listOfEngineObjects.filter((e) => {
    if (e.fleeTime) {
      fleeTime = e.fleeTime;
      oldTime = fleeTime + 10;
    }
    if (time - e.spawnTime > fleeTime) {
      if (e.gameType == "enemy") {
        e.chaseStyle = "flee";
      }
    }
    if (time - e.spawnTime > oldTime) {
      e.destroy();
      return false;
    } else return true;
  });
  return listOfEngineObjects;
}

function gameUpdate() {
  // Handle debug inputs
  if (keyWasPressed("KeyI")) {
    G.system.speedDisplay = !G.system.speedDisplay;
  }

  if (!G.system.gameStarted) {
    if (G.system.demoEnemyTimer.elapsed()) {
      G.system.demoEnemyList = cleanUp(G.system.demoEnemyList);
      launchDemoEnemy();
    }

    if (G.system.readyTimer.elapsed()) {
      if (keyWasPressed("Space")) {
        G.system.mouseEnabled = false;
        G.system.alternateMouseControl = false;
        startGame();
      }
      if (mouseWasPressed(0)) {
        G.system.mouseEnabled = true;
        G.system.alternateMouseControl = true;
        startGame();
      }
    }
    return;
  }

  // called every frame at 60 frames per second
  // handle input and update the game state

  G.score += G.speed * (G.speedScoreFactor / 5);

  G.system.difficulty = G.speed * G.speedToDifficultyScale * G.difficulty * 10;

  G.speed += G.speed * (1 - G.speed / 1.5) * (G.speedIncreaseFactor * 0.0002);

  // randomly generate enemies
  if (rand() > 1 - 0.006 * G.enemySpawnRate) {
    G.system.currentEnemies = cleanUp(G.system.currentEnemies);
    randomEnemy();
  }

  // randomly generate powerups
  if (
    rand() > 1 - 0.005 * G.powerupSpawnRate &&
    G.system.powerupTimer.elapsed()
  ) {
    let powerupWeights = getWeights(listOfPowerups);

    const powerUpChoice = randWeighted(listOfPowerups, powerupWeights);
    G.system.currentPowerups.push(new PowerUp(G, powerUpChoice));
    G.system.powerupTimer.set(G.powerupCooldown);
    G.system.currentPowerups = cleanUp(G.system.currentPowerups);
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

  // Game Start Screen
  if (!G.system.gameStarted) {
    const gameTitle = gameInfo.gameName || "Plane Game";
    const titleSize = 3 / (gameTitle.length / 10);
    drawText(gameTitle, vec2(0, 4), titleSize, G.system.cols.red, 0.5);

    if (gameInfo.authorName) {
      const gameAuthor =
        "Customized By: \n\n" + (gameInfo.authorName || "Friendo Dunwoody");
      const authorSize = 3 / (gameAuthor.length / 10);
      drawText(gameAuthor, vec2(0, -1), authorSize, G.system.cols.red, 0.2);
    }

    if (G.system.readyTimer.elapsed() && Math.sin(time * 5) > 0)
      drawText("Click/Space to Start", vec2(0, -4), 1, G.system.cols.red, 0.5);
  }

  // Health Display
  const healthDisplayStartPos = vec2(-3.5, -12);
  const currentHealth = clamp(G.playerHealth, 0, G.playerHealth);
  const currentHealthRounded = Math.ceil(currentHealth);
  const maxHealth = G.startHealth;
  if (G.system.healthDisplayText) {
    drawText("Health:", healthDisplayStartPos, 1, G.system.cols.red, 0.5);
    const healthDisplayNums = `${currentHealth}/${maxHealth}`;
    drawText(healthDisplayNums, vec2(3, -12), 1, G.system.cols.red, 0.5);
  } else {
    if (currentHealthRounded <= 20) {
      for (let i = 0; i < currentHealthRounded; i++) {
        if (i < 10) {
          drawTile(
            healthDisplayStartPos.add(vec2(i * 0.75, -1)),
            vec2(1),
            tile(26, G.system.tileSize, G.system.tileSheets["general"]),
          );
        } else if (i < 20) {
          drawTile(
            healthDisplayStartPos.add(vec2((i - 10) * 0.75, -2)),
            vec2(1),
            tile(26, G.system.tileSize, G.system.tileSheets["general"]),
          );
        }
      }
    } else if (currentHealthRounded > 20) {
      drawTile(
        healthDisplayStartPos.add(vec2(2, -2)),
        vec2(1),
        tile(26, G.system.tileSize, G.system.tileSheets["general"]),
      );
      drawTile(
        healthDisplayStartPos.add(vec2(3, -2)),
        vec2(1),
        tile(10, G.system.tileSize, G.system.tileSheets["general"]),
      );
      currentHealth
        .toString()
        .split("")
        .forEach((num, index) => {
          num = num == "." ? num : parseInt(num, 10);
          drawTile(
            healthDisplayStartPos.add(vec2(index + 4, -2)),
            vec2(1),
            tile(
              num == "." ? 9 : 19 + (num > 4 ? 7 + num : num),
              G.system.tileSize,
              G.system.tileSheets["general"],
            ),
          );
        });
    }
  }

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

  if (G.system.speedDisplay) {
    // Speed Display
    let speedForDisplay = G.speed.toFixed(2);
    let speedStartPos = cameraPos.copy().add(vec2(6, 13));
    drawText(
      "Current Speed",
      speedStartPos.add(vec2(1.75, 1)),
      0.6,
      G.system.cols.red,
      0.5,
    );
    speedForDisplay.split("").forEach((num, index) => {
      num = num == "." ? num : parseInt(num, 10);
      drawTile(
        speedStartPos.add(vec2(index * 1, 0)),
        vec2(1),
        tile(
          num == "." ? 9 : 19 + (num > 4 ? 7 + num : num),
          G.system.tileSize,
          G.system.tileSheets["general"],
        ),
      );
    });

    // Difficulty Display
    let difficultyForDisplay = G.system.difficulty.toFixed(1);
    let difficultyStartPos = cameraPos.copy().add(vec2(6, 10));
    drawText(
      "Current Difficulty",
      difficultyStartPos.add(vec2(1.75, 1)),
      0.6,
      G.system.cols.red,
      0.5,
    );
    difficultyForDisplay.split("").forEach((num, index) => {
      num = num == "." ? num : parseInt(num, 10);
      drawTile(
        difficultyStartPos.add(vec2(index + 1, 0)),
        vec2(1),
        tile(
          num == "." ? 9 : 19 + (num > 4 ? 7 + num : num),
          G.system.tileSize,
          G.system.tileSheets["general"],
        ),
      );
    });
  }

  // Lives Display
  let lives = Math.floor(G.playerLives);
  let livesStartPos = cameraPos.copy().add(vec2(-8.5, -13));
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

  if (
    G.system.player.crashed &&
    time > G.system.player.crashed + G.system.respawnWaitTime &&
    Math.sin(time * 5) > 0
  ) {
    drawText(
      "Click/Space to Play Again",
      vec2(0, -4),
      1.0,
      G.system.cols.red,
      0.5,
    );
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
async function loadCustoms() {
  const customGameInfo = await fetchJSON(`./custom/customGameInfo.json`).catch(
    (e) => {
      console.error("Error loading custom game info!");
      return defaultGameInfo;
    },
  );
  gameInfo = customGameInfo[0];

  const customPowerups = fetchJSON(`./custom/customPowerups.json`).catch(
    (e) => {
      console.error("Error loading powerups!");
      return [];
    },
  );
  listOfPowerups = (
    await Promise.all([
      engineAddLoad(powerupsDefaultData),
      engineAddLoad(customPowerups),
    ])
  ).flat();

  const customEnemies = fetchJSON(`./custom/customEnemies.json`).catch((e) => {
    console.error("Error loading enemies!");
    return [];
  });
  listOfEnemies = (
    await Promise.all([
      engineAddLoad(enemiesDefaultData),
      engineAddLoad(customEnemies),
    ])
  ).flat();
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
