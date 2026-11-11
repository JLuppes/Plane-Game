import { EngineObject, vec2, tile, particleEffect } from "littlejsengine";
import { G } from "./main";

export class Enemy extends EngineObject {
  constructor(game) {
    let x = game.system.width / 2;
    let y = game.system.height / 2 + 3;
    let pos = vec2(rand(-x, x), y);
    let startHealth = 2;
    let scoreValue = 10;

    let frame = 8;
    super(
      pos,
      vec2(0.5),
      tile(frame, game.system.tileSize * 2, G.system.tileSheets["ships"]),
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
      G.system.player.gainScore(this.scoreValue);
    }
  }

  explode() {
    LOG("Enemy Exploded: " + this);
    particleEffect("explosion", this.pos.copy());
    super.destroy();
  }
}
