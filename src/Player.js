import {
  EngineObject,
  cameraPos,
  vec2,
  time,
  mousePos,
  setCursor,
  keyWasPressed,
  keyIsDown,
  particleEffect,
  mouseInWindow,
  keyDirection,
  mouseIsDown,
  drawTile,
  tile,
} from "littlejsengine";
import { G } from "./main";
import { Bullet } from "./Bullet";

export class Player extends EngineObject {
  constructor(game) {
    let size = G.system.playerSize,
      frame = G.system.playerFrame;
    super(cameraPos, vec2(size));

    // edge of screen left/right
    this.minX = (game.system.width - 2) / -2;
    this.maxX = (game.system.width - 2) / 2;

    this.minY = (game.system.height - 2) / -2;
    this.maxY = (game.system.height - 2) / 2;

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
    if (G.system.alternateMouseControl) setCursor("none");

    if (keyWasPressed("KeyM")) {
      if (G.system.mouseEnabled && G.system.alternateMouseControl) {
        G.system.mouseEnabled = true;
        G.system.alternateMouseControl = false;
        setCursor("crosshair");
      } else if (G.system.mouseEnabled && !G.system.alternateMouseControl) {
        setCursor("none");
        G.system.mouseEnabled = false;
        G.system.alternateMouseControl = false;
      } else {
        setCursor("default");
        G.system.mouseEnabled = true;
        G.system.alternateMouseControl = true;
      }
    }
    if (
      keyIsDown("ArrowLeft") ||
      keyIsDown("ArrowRight") ||
      keyIsDown("ArrowUp") ||
      keyIsDown("ArrowDown")
    ) {
      particleEffect("dust", vec2(this.pos.x, this.pos.y - 0.9));
      G.system.sfx.fly.play(this.pos);
    }

    if (
      !G.system.alternateMouseControl &&
      G.system.mouseEnabled &&
      mouseInWindow
    ) {
      const mouseBuffer = 1.5;
      if (mousePos.distance(this.pos) > mouseBuffer) {
        this.velocity.x += 0.01 * mouseDir.x;
        this.velocity.y += 0.0075 * mouseDir.y;
      }
    }

    if (
      G.system.alternateMouseControl &&
      G.system.mouseEnabled &&
      mouseInWindow
    ) {
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
      if (G.system.currentHeldPowerUp.usePowerup) {
        G.system.currentHeldPowerUp.usePowerup();
      }
    }
  }

  bullets = [];

  shoot() {
    if (time - this.lastShot > this.reloadTime) {
      LOG("Pew!");

      this.bullets.push(new Bullet(G, this));

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
      if (G.system.player.crashed) {
        // pause
      }
      t.pos.y -= G.speed;
      return t.pos.y >= -G.system.height / 2 - 3;
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
    if (G.system.invincibleTimer.elapsed()) {
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
      G.system.invincibleTimer.set(G.invincibleTime);
    }
  }

  die() {
    G.speed = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.crashed = time;
    particleEffect("explosion", this.pos);
    this.frame = this.frame + 12;
    G.system.sfx.hit.play(this.pos);
  }

  drawShip() {
    drawTile(
      this.pos,
      this.size,
      tile(
        this.currentFrame,
        G.system.tileSize * 2,
        G.system.tileSheets["ships"],
      ),
      undefined,
      this.angle,
    );
  }

  render() {
    if (G.system.invincibleTimer.elapsed() || Math.sin(time * 24) > 0) {
      this.drawShip();
    }
  }
}
