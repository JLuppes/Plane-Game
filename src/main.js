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
} from "littlejsengine";

const playerFrame = 5;
const playerSize = 2.5;

// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
// setTileDefaultPadding(1);

const G = {
  // Logical grid size (in tiles)
  width: 20,
  height: 30,
  // Size of one tile in screen pixels
  tileSize: 16,
  tiles: ["/ships.png"],
  cols: {
    white: new Color().setHex("#ffffff"),
    red: new Color().setHex("#ff0000"),
    sky: new Color().setHex("#cfe7f7"),
  },
};

// called once after the engine starts up
function gameInit() {
  // setup the game

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

  G.player = new Player(G);

  G.speed = 0.1;
}

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state

  // randomly generate enemies
  if (Math.random() > 0.99) {
    new Enemy(G);
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

  if (G.player.crashed && Math.sin(time * 5) > 0) {
    drawText("GAME OVER", vec2(0, 0), 2, G.cols.red, 0.5);
  }
}

// fires up LittleJS with all necessary functions and tiles
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

    // horizontal direction of player
    this.dir = 0;

    this.frame = frame;
    this.setCollision(true, true, false, false);
  }

  update() {
    super.update();
    this.currentFrame = this.frame;
    // this.currentFrame = (Math.sin(time * 7) > 0) ? this.frame : this.frame+1;

    if (this.crashed) return;

    if (
      keyIsDown("ArrowLeft") ||
      keyIsDown("ArrowRight") ||
      keyIsDown("ArrowUp") ||
      keyIsDown("ArrowDown")
    ) {
      particleEffect("dust", vec2(this.pos.x, this.pos.y - 0.9));
      this.velocity.x += 0.01 * keyDirection()["x"];
      this.velocity.y += 0.0075 * keyDirection()["y"];
    }

    if (keyWasPressed("KeyR")) {
      console.log("R pressed!");
      this.currentFrame++;
    }

    // clamp  speed
    this.velocity.x = clamp(this.velocity.x, -0.35, 0.35);
    this.velocity.y = clamp(this.velocity.y, -0.35, 0.35);

    this.angle = this.velocity.x;

    // // change direction if player about to go off screen
    // if (this.pos.x <= this.minX || this.pos.x >= this.maxX){
    //   this.velocity.x *= -1
    // }

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
  }

  collideWithObject(o) {
    if (this.crashed) return;
    G.speed = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.crashed = true;
    particleEffect("explosion", this.pos);
    this.frame = this.frame + 12;
  }

  render() {
    drawTile(
      this.pos,
      this.size,
      tile(this.currentFrame, G.tileSize * 2),
      undefined,
      this.angle,
    );
  }
}

class Enemy extends EngineObject {
  constructor(game) {
    let x = game.width / 2;
    let y = game.height / 2 + 3;
    let pos = vec2(rand(-x, x), y);

    let frame = 8;
    super(pos, vec2(0.5), tile(frame, game.tileSize * 2));
    this.angle = Math.PI;
    this.game = game;

    this.setCollision(true, false, false, false);
    this.drawSize = vec2(2);
  }

  update() {
    super.update();
    this.pos.y -= this.game.speed;

    //remove object when past bottom of screen
    if (this.pos.y < this.game.heigh / -2) {
      super.destroy();
    }
  }
}
