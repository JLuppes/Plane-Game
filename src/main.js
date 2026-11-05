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
} from "littlejsengine";

const playerFrame = 5;
const playerSize = 2.5;

// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
// setTileDefaultPadding(1);

const G = {
  score: 0,
  // Logical grid size (in tiles)
  width: 20,
  height: 30,
  // Size of one tile in screen pixels
  tileSize: 16,
  tiles: ["/ships.png", "/tiles.png"],
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

  let score = Math.floor(G.score).toString().padStart(4, "0");

  let startPos = cameraPos.copy().add(vec2(-3, -13));
  score.split("").forEach((num, index) => {
    num = parseInt(num, 10);
    drawTile(
      startPos.add(vec2(index * 1.75, 0)),
      vec2(2.5),
      tile(19 + (num > 4 ? 7 + num : num), G.tileSize, 1),
    );
  });

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

    this.trail = [];
    this.trailCol = new Color(1, 1, 1, 0.25);
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
      G.sfx.fly.play(this.pos);
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

    this.trail.push({ pos: this.pos.copy(), angle: this.angle });
    this.trail = this.trail.filter((t) => {
      t.pos.y -= G.speed;
      return t.pos.y >= -G.height / 2;
    });
  }

  collideWithObject(o) {
    if (this.crashed) return;
    G.speed = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.crashed = true;
    particleEffect("explosion", this.pos);
    this.frame = this.frame + 12;
    G.sfx.hit.play(this.pos);
  }

  render() {
    this.trail.forEach((t) => {
      drawTile(t.pos, vec2(2), tile(6, G.tileSize), this.trailCol, t.angle);
    });
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
