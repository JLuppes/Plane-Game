"use strict";

import {
  engineInit,
  drawText,
  drawTile,
  tile,
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
} from "littlejsengine";

const playerFrame = 5;
const playerSize = 32;

// each tile in tiles.png has a 1 pixel border, which stops texture bleeding
// setTileDefaultPadding(1);

const G = {
  // Logical grid size (in tiles)
  width: 20,
  height: 30,
  // Size of one tile in screen pixels
  tileSize: 16,
  tiles: ["/ships.png"],
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
  if (Math.random() > .99){
    new Enemy(G);
  }
}

function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

function gameRender() {
  //clear screen with white rectangle
  drawRect(vec2(0), vec2(G.width, G.height), Color.white);

  // drawTile(
  //   vec2(0), // center of screen
  //   vec2(2), // size
  //   playerModel, // frame and tileSize
  // );
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects


  if(G.player.crashed  ){
    drawText('GAME OVER',
      vec2(0, 0),
      2,
      new Color(1,0,0),
      .5
    )
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
    let size = 1.5,
      frame = 5;
    super(cameraPos, vec2(size), tile(playerFrame, game.tileSize * 2));

    // edge of screen left/right
    this.minX = (game.width - 2) / -2;
    this.maxX = (game.width - 2) / 2;

    this.minY = (game.height - 2) / -2;
    this.maxY = (game.height - 2) / 2;

    // horizontal direction of player
    this.dir = 0;

    this.setCollision(true,true,false,false)
  }

  update() {
    super.update();
    if(this.crashed) return;

    // if (mouseWasPressed(0)||keyWasPressed('ArrowLeft') ){
    //   this.velocity.x = (this.velocity.x === 0)
    //   ? .1
    //   : this.velocity.x * -.25
    // }

    // // gradually increase x speed
    // if (this.velocity.x !== 0){
    //   this.velocity.x *=1.05
    // }

    // if(keyIsDown('ArrowLeft')){
    //   this.velocity.x -= .01
    // }
    // if(keyIsDown('ArrowRight')){
    //   this.velocity.x += .01
    // }

    if (
      keyIsDown("ArrowLeft") ||
      keyIsDown("ArrowRight") ||
      keyIsDown("ArrowUp") ||
      keyIsDown("ArrowDown")
    ) {
      this.velocity.x += 0.01 * keyDirection()["x"];
      this.velocity.y += 0.0075 * keyDirection()["y"];
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

  collideWithObject(o){
    if (this.crashed) return;
    G.speed=0;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.crashed = true;
  }
}


class Enemy extends EngineObject {
  constructor(game){
    let x = game.width/2;
    let y = (game.height/2) + 3;
    let pos = vec2(rand(-x, x), y)

    let frame = 8;
    super(pos, vec2(.5), tile(frame, game.tileSize*2))
    this.angle = 3.14
    this.game = game;

    this.setCollision(true, false, false, false)
    this.drawSize = vec2(2);
  }


  update(){
    super.update()
    this.pos.y -= this.game.speed;

    //remove object when past bottom of screen
    if(this.pos.y < this.game.heigh / -2){
      super.destroy()
    }
  }
}