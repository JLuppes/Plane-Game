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
  EngineObject,
  cameraPos,
  keyWasPressed,
  mouseWasPressed,
  keyDirection,
  keyIsDown,
  particleEffect,
  Sound,
  setTileDefaultBleed,
  engineObjectsDestroy,
  particleEffectsLoad,
  ParticleEmitter,
  fetchJSON,
  engineAddLoad,
  Timer,
  setCursor,
  mouseIsDown,
  mousePos,
  mousePosScreen,
  mouseInWindow,
} from "littlejsengine";

const playerFrame = 5;
const playerSize = 2.5;

const listOfPowerups = (
  await Promise.all(
    ["default"].map((n) =>
      engineAddLoad(fetchJSON(`./data/powerups/${n}.json`)),
    ),
  )
).flat();
// setTileDefaultPadding(1);

const G = {
  score: 0,
  // Logical grid size (in tiles)
  width: 20,
  height: 30,
  // Size of one tile in screen pixels
  tileSize: 16,
  tileSheets: { ships: 0, general: 1, input: 2 },
  tiles: ["/ships.png", "/tiles.png", "/input.png"],
  slowdownFactor: 0.03,
  powerupCooldown: 2.0,
  currentHeldPowerUp: {},
  currentActiveEffects: [],
  playerLives: 1,
  playerDamage: 1,
  invincibleTime: 3,
  mouseEnabled: true,
  alternateMouseControl: true,
  showControls: true,
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

// Particles: https://killedbyapixel.github.io/LittleJS/examples/particles/
// Sounds: https://killedbyapixel.github.io/ZzFX/

// called once after the engine starts up
function gameInit() {
  // setup the game
  G.score = 0;
  G.playerHealth = 1;
  G.playerLives = 2;

  G.invincibleTimer = new Timer(0);

  G.powerupTimer = new Timer(G.powerupCooldown);
  G.currentHeldPowerUp = {};

  // Compute the fixed canvas size in screen pixels
  const gameSize = vec2(G.width * G.tileSize, G.height * G.tileSize);

  // Lock canva to an exact pixel size
  // Prevents browser scaling and keeps pixels crisp
  setCanvasFixedSize(gameSize);

  // Cache the logical grid size as a vector (in tiles, not pixels)
  G.size = vec2(G.width, G.height);

  // World space center point (origin-based)
  // Useful for camera position, spawning, etc.
  G.center = vec2(0);

  // Set camera scale so that
  // 1 world unit == 1 tile
  // (1x1 object renders as 16x16 pixels)
  // cameraScale = G.tileSize;
  setCameraScale(G.tileSize);

  engineObjectsDestroy();

  G.player = new Player(G);

  G.speed = 0.1;

  setTileDefaultBleed(0.5);
}

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state

  G.score += G.speed / 5;

  G.speed += G.speed * 0.0001;

  // randomly generate enemies
  if (Math.random() > 0.99) {
    new Enemy(G);
  }

  // randomly generate powerups
  if (Math.random() > 0.9 && G.powerupTimer.elapsed()) {
    const powerUpChoice = Math.floor(Math.random() * listOfPowerups.length);
    new PowerUp(G, listOfPowerups[powerUpChoice]);
    G.powerupTimer.set(G.powerupCooldown);
  }

  if (
    G.player.crashed &&
    time > G.player.crashed + 2 &&
    (mouseWasPressed(0) || keyWasPressed("Space"))
  ) {
    gameInit();
  }

  if (G.currentActiveEffects.length > 0) {
    for (let thisEffect in G.currentActiveEffects) {
      const currentEffect = G.currentActiveEffects[thisEffect];
      if (!currentEffect.effectActive) {
        console.log(
          "Activating effect: " + G.currentActiveEffects[currentEffect],
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

    const oldEffect = G.currentActiveEffects.filter((effect) =>
      effect.timer.elapsed(),
    );
    for (const thisOldeEffect in oldEffect) {
      oldEffect[thisOldeEffect].shutDown();
    }

    G.currentActiveEffects = G.currentActiveEffects.filter(
      (effect) => !effect.timer.elapsed(),
    );

    console.log(
      "Remaining effects: " +
        (G.currentActiveEffects.length > 0 ? G.currentActiveEffects : "None"),
    );

    for (let thisEffect in G.currentActiveEffects) {
      console.log("Active effect: " + G.currentActiveEffects[thisEffect].name);
      console.log(G.currentActiveEffects[thisEffect]);
    }
  }
}

function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

function gameRender() {
  //clear screen with white rectangle
  drawRect(G.center, G.size, G.cols.sky);
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects

  // Currently Held Powerup UI Display
  let powerupFrameStartPos = cameraPos.copy().add(vec2(7, -13));
  // Button Display
  if (G.showControls) {
    drawTile(
      vec2(powerupFrameStartPos.x, powerupFrameStartPos.y + 2),
      vec2(1.5),
      tile(87, G.tileSize, G.tileSheets["input"]),
    );
  }
  // Frame
  drawTile(
    powerupFrameStartPos,
    vec2(2.5),
    tile(27, G.tileSize, G.tileSheets["general"]),
  );
  // Current Powerup
  if (G.currentHeldPowerUp.tileData) {
    drawTile(powerupFrameStartPos, vec2(1.5), G.currentHeldPowerUp.tileData);
  }

  // Score UI Display
  let score = Math.floor(G.score).toString().padStart(4, "0");
  let scoreStartPos = cameraPos.copy().add(vec2(-8, 13));
  score.split("").forEach((num, index) => {
    num = parseInt(num, 10);
    drawTile(
      scoreStartPos.add(vec2(index * 1.75, 0)),
      vec2(2.5),
      tile(19 + (num > 4 ? 7 + num : num), G.tileSize, G.tileSheets["general"]),
    );
  });

  // Lives Display
  let lives = Math.floor(G.playerLives);
  let livesStartPos = cameraPos.copy().add(vec2(-8, -13));
  for (let i = 0; i < lives; i++) {
    drawTile(
      livesStartPos.add(vec2(i * 1.75, 0)),
      vec2(2.5),
      tile(G.player.currentFrame, G.tileSize * 2, G.tileSheets["ships"]),
    );
  }

  // Game Over Screen
  if (G.player.crashed && Math.sin(time * 5) > 0) {
    drawText("GAME OVER", vec2(0, 0), 2, G.cols.red, 0.5);
  }
}

// fires up LittleJS with all necessary functions and tiles

await engineAddLoad(particleEffectsLoad("particleEffects.json"));
engineInit(
  gameInit,
  gameUpdate,
  gameUpdatePost,
  gameRender,
  gameRenderPost,
  G.tiles,
);

class Player extends EngineObject {
  constructor(game) {
    let size = playerSize,
      frame = playerFrame;
    super(cameraPos, vec2(size));

    // edge of screen left/right
    this.minX = (game.width - 2) / -2;
    this.maxX = (game.width - 2) / 2;

    this.minY = (game.height - 2) / -2;
    this.maxY = (game.height - 2) / 2;

    this.frame = frame;
    this.setCollision(true, true, false, false);

    this.trail = [];
    this.muzzles = [];
    this.smoke = [];

    this.frameOptions = [9, 10, 11, 8];
    this.skinNumber = 0;
    this.currentFrame = this.frameOptions[0];

    this.reloadTime = 0.2;
    this.lastShot = time;
    this.gameType = "player";
  }

  handleInput() {
    let mouseDir = vec2(
      mousePos.x - this.pos.x,
      mousePos.y - this.pos.y,
    ).normalize();
    if (G.alternateMouseControl) setCursor("none");

    if (keyWasPressed("KeyM")) {
      if (G.mouseEnabled && G.alternateMouseControl) {
        G.mouseEnabled = true;
        G.alternateMouseControl = false;
        setCursor("crosshair");
      } else if (G.mouseEnabled && !G.alternateMouseControl) {
        setCursor("none");
        G.mouseEnabled = false;
        G.alternateMouseControl = false;
      } else {
        setCursor("default");
        G.mouseEnabled = true;
        G.alternateMouseControl = true;
      }
    }
    if (
      keyIsDown("ArrowLeft") ||
      keyIsDown("ArrowRight") ||
      keyIsDown("ArrowUp") ||
      keyIsDown("ArrowDown")
    ) {
      particleEffect("dust", vec2(this.pos.x, this.pos.y - 0.9));
      G.sfx.fly.play(this.pos);
    }

    if (!G.alternateMouseControl && G.mouseEnabled && mouseInWindow) {
      const mouseBuffer = 1.5;
      if (mousePos.distance(this.pos) > mouseBuffer) {
        this.velocity.x += 0.01 * mouseDir.x;
        this.velocity.y += 0.0075 * mouseDir.y;
      }
    }

    if (G.alternateMouseControl && G.mouseEnabled && mouseInWindow) {
      this.pos = mousePos;
    }

    this.velocity.x += 0.01 * keyDirection()["x"];
    this.velocity.y += 0.0075 * keyDirection()["y"];

    if (keyWasPressed("KeyR")) {
      this.changeSkin();
    }

    if (keyIsDown("Space") || mouseIsDown(0)) {
      this.shoot();
    }

    if (keyWasPressed("KeyE")) {
      if (G.currentHeldPowerUp.usePowerup) {
        G.currentHeldPowerUp.usePowerup();
      }
    }
  }

  bullets = [];

  shoot() {
    if (time - this.lastShot > this.reloadTime) {
      LOG("Pew!");

      this.bullets.push(createBullet(this));

      particleEffect("muzzle", vec2(this.pos.x - 0.6, this.pos.y + 0.55), {
        scale: 0.3,
      });
      particleEffect("muzzle", vec2(this.pos.x + 0.6, this.pos.y + 0.55), {
        scale: 0.3,
      });
      this.lastShot = time;
    }
  }

  changeSkin(newSkin) {
    this.skinNumber = ++this.skinNumber % this.frameOptions.length;
    this.currentFrame = this.frameOptions[this.skinNumber];
    LOG("Skin number now: " + this.skinNumber);
  }

  gainScore(amount) {
    G.score += amount;
  }

  update() {
    super.update();

    if (this.crashed) return;

    this.handleInput();

    // gradual slowdown
    this.velocity.x = this.velocity.x / (1 + G.slowdownFactor);
    this.velocity.y = this.velocity.y / (1 + G.slowdownFactor);

    // clamp  speed
    this.velocity.x = clamp(this.velocity.x, -0.35, 0.35);
    this.velocity.y = clamp(this.velocity.y, -0.35, 0.35);

    // update player angle to match horizontal speed
    this.angle = this.velocity.x;

    // change direction if player about to go off screen

    if (this.pos.x <= this.minX || this.pos.x >= this.maxX) {
      this.velocity.x = 0;
    }
    if (this.pos.y <= this.minY || this.pos.y >= this.maxY) {
      this.velocity.y = 0;
    }

    if (this.pos.x <= this.minX) {
      this.pos.x += 0.01;
    }

    if (this.pos.x >= this.maxX) {
      this.pos.x -= 0.01;
    }
    if (this.pos.y <= this.minY) {
      this.pos.y += 0.01;
    }

    if (this.pos.y >= this.maxY) {
      this.pos.y -= 0.01;
    }

    this.trail.push(particleEffect("wave", this.pos.copy()));
    this.trail = this.trail.filter((t) => {
      if (G.player.crashed) {
        // pause
      }
      t.pos.y -= G.speed;
      return t.pos.y >= -G.height / 2 - 3;
    });
  }

  collideWithObject(o) {
    LOG("Player collided with: ");
    LOG(o);

    if (this.crashed) return;
    if (o.gameType == "enemy") {
      this.takeHit(1);
    }
  }
  takeHit(damageAmount = 1) {
    if (G.invincibleTimer.elapsed()) {
      G.playerHealth -= damageAmount;
      if (G.playerHealth <= 0) {
        this.loseLife();
      }
      particleEffect("sparks", this.pos).emitTime = 0.1;
    }
  }

  loseLife() {
    G.playerLives--;
    particleEffect("explosion", this.pos).emitTime = 0.1;
    if (G.playerLives < 0) {
      this.die();
    } else {
      G.invincibleTimer.set(G.invincibleTime);
    }
  }

  die() {
    G.speed = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.crashed = time;
    particleEffect("explosion", this.pos);
    this.frame = this.frame + 12;
    G.sfx.hit.play(this.pos);
  }

  drawShip() {
    drawTile(
      this.pos,
      this.size,
      tile(this.currentFrame, G.tileSize * 2, G.tileSheets["ships"]),
      undefined,
      this.angle,
    );
  }

  render() {
    if (G.invincibleTimer.elapsed() || Math.sin(time * 24) > 0) {
      this.drawShip();
    }
  }
}

function createBullet(source) {
  return new Bullet(G, source);
}

class Enemy extends EngineObject {
  constructor(game) {
    let x = game.width / 2;
    let y = game.height / 2 + 3;
    let pos = vec2(rand(-x, x), y);
    let startHealth = 2;
    let scoreValue = 10;

    let frame = 8;
    super(
      pos,
      vec2(0.5),
      tile(frame, game.tileSize * 2, G.tileSheets["ships"]),
    );
    this.angle = Math.PI;
    this.game = game;

    this.setCollision(true, false, false, false);
    this.drawSize = vec2(2);
    this.gameType = "enemy";
    this.health = startHealth;
    this.dead = false;
    this.scoreValue = scoreValue;
  }

  update() {
    super.update();
    this.pos.y -= this.game.speed;

    if (this.crashed) return;

    //remove object when past bottom of screen
    if (this.pos.y < this.game.heigh / -2) {
      super.destroy();
    }
  }
  collideWithObject(o) {
    if (o.gameType == "bullet" && o.gameSource == "player") {
      this.takeDamage(o.damage);
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    particleEffect("sparks", this.pos).emitTime = 0.1;
    if (this.health <= 0) {
      this.dead = true;
      this.explode();
      G.player.gainScore(this.scoreValue);
    }
  }

  explode() {
    LOG("Enemy Exploded: " + this);
    particleEffect("explosion", this.pos.copy());
    super.destroy();
  }
}

class Bullet extends EngineObject {
  constructor(game, source) {
    let x = game.width / 2;
    let y = game.height / 2 + 3;
    let sourcePos = source.pos.copy();
    let pos = vec2(sourcePos.x, sourcePos.y + 0.2);
    let angle = source.angle;
    let bulletSpeed = 1;
    let bulletDamage = G.playerDamage;

    let frame = 1;
    super(pos, vec2(1.8), tile(frame, game.tileSize, G.tileSheets["general"]));
    this.angle = Math.PI;
    this.game = game;

    this.setCollision(true, true, false, false);
    this.drawSize = vec2(2).multiply(vec2(bulletDamage));
    this.speed = vec2(Math.sin(angle), Math.cos(angle));
    this.gameType = "bullet";
    this.gameSource = "player";
    this.damage = bulletDamage;
  }

  collideWithObject(o) {
    super.collideWithObject(o);

    if (o.gameType == "enemy") {
      super.destroy();
    }
  }

  update() {
    super.update();

    this.pos.x += this.speed.x;
    this.pos.y += this.speed.y;
  }
}

class PowerUp extends EngineObject {
  constructor(game, powerupData) {
    let x = game.width / 2;
    let y = game.height / 2 + 3;
    let pos = vec2(rand(-x, x), y);
    let frame = powerupData.frame ? powerupData.frame : 24;
    let defaultPointValue = 100;
    let spriteSheet = powerupData.spriteSheet
      ? powerupData.spriteSheet
      : "general";
    let tileData = tile(frame, game.tileSize, G.tileSheets[spriteSheet]);

    super(pos, vec2(0.8), tileData);

    this.game = game;
    this.setCollision(true, true, false, false);
    this.gameType = "powerUp";
    this.gameSource = "game";
    this.effectActive = false;

    this.powerupData = powerupData;
    this.tileData = tileData;
    this.name = powerupData.name ? powerupData.name : "Powerup";
    this.angle = powerupData.angle ? powerupData.angle : 0;
    this.drawSize = powerupData.drawSize ? vec2(powerupData.drawSize) : vec2(2);
    this.speedFactor = powerupData.speedFactor ? powerupData.speedFactor : 1;
    this.pointValue = powerupData.pointValue
      ? powerupData.pointValue
      : defaultPointValue;
  }

  collideWithObject(o) {
    if (o.gameType == "player") {
      this.pickedUp();
    }
  }

  pickedUp() {
    console.log("Picked up Powerup: " + this.name);
    particleEffect("magic", this.pos).emitTime = 0.1;
    G.score += this.pointValue;
    if (this.powerupData.autoUse) {
      this.usePowerup();
    } else {
      G.currentHeldPowerUp = this;
    }
    super.destroy();
  }

  usePowerup() {
    if (this.powerupData.duration > 0) {
      G.currentActiveEffects.push(this);
    } else {
      this.applyOverwrites();
      this.applyAdditions();
      super.destroy();
    }
    if (!this.powerupData.autoUse) {
      G.currentHeldPowerUp = {};
    }
  }

  applyOverwrites() {
    if (this.powerupData.gamePropertyOverwrites) {
      for (let key in this.powerupData.gamePropertyOverwrites) {
        let keyDataOriginal = G[key];
        this.powerupData.gamePropertyOverwrites[key + "-original"] =
          keyDataOriginal;
        let keyData = this.powerupData.gamePropertyOverwrites[key];
        console.log(
          `Powerup "${this.name}" found overwrite for key "${key}": ${keyData}`,
        );
        if (G[key] != null) {
          G[key] = keyData;
          console.log(`Game property "${key}" set to: ${G[key]}`);
        } else {
          console.log("No key found with name: " + key);
        }
      }
    }
  }

  startUp() {
    this.applyOverwrites();
    this.applyAdditions();
  }

  shutDown() {
    this.removeOverwrites();
    this.removeAdditions();
    this.destroy();
  }

  removeOverwrites() {
    const overwrites = this.powerupData.gamePropertyOverwrites;
    console.log("Removing overwrites:");
    console.log(overwrites);
    if (overwrites) {
      for (let key in overwrites) {
        if (overwrites[key + "-original"]) {
          console.log("IF");
          G[key] = overwrites[key + "-original"];
          delete G[key + "-original"];
          console.log(`Game property "${key}" set to: ${G[key]}`);
        } else {
          console.log("ELSE");
          console.log("Original value not found for key: " + key);
        }
      }
    }
  }

  removeAdditions() {
    console.log("Removing addition:");
    if (this.powerupData.gamePropertyAdditions) {
      for (let key in this.powerupData.gamePropertyAdditions) {
        let keyData = this.powerupData.gamePropertyAdditions[key];
        console.log(
          `Powerup "${this.name}" removing addition for key "${key}": ${this.powerupData.gamePropertyAdditions[key]}`,
        );
        if (G[key] != null) {
          G[key] = G[key] - keyData;
          console.log(`Game property "${key}" set to: ${G[key]}`);
        } else {
          console.log("No key found with name: " + key);
        }
      }
    }
  }

  applyAdditions() {
    if (this.powerupData.gamePropertyAdditions) {
      for (let key in this.powerupData.gamePropertyAdditions) {
        let keyData = this.powerupData.gamePropertyAdditions[key];
        console.log(
          `Powerup "${this.name}" found addition for key "${key}": ${this.powerupData.gamePropertyAdditions[key]}`,
        );
        if (G[key] != null) {
          G[key] = G[key] + keyData;
          console.log(`Game property "${key}" set to: ${G[key]}`);
        } else {
          console.log("No key found with name: " + key);
        }
      }
    }
  }

  update() {
    super.update();
    this.pos.y -= this.speedFactor * G.speed;
  }
}
