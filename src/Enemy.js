import {
  EngineObject,
  vec2,
  tile,
  particleEffect,
  clamp,
  rand,
  Timer,
  LOG,
} from "littlejsengine";
import { G } from "./main";
import { Bullet } from "./Bullet";

export class Enemy extends EngineObject {
  constructor(game, enemyData = {}) {
    let x = game.system.width / 2;
    let y = game.system.height / 2 + 3;
    let pos = vec2(rand(-x, x), y);
    let vel = vec2(0);
    let name = enemyData.enemyName || "Enemy Plane";
    let size = enemyData.enemySize || 1;
    let startHealth = enemyData.startHealth || 2;
    let scoreValue = enemyData.scoreValue || 10;
    let chasePlayer = enemyData.chasePlayer || true;
    let chaseStyle = enemyData.chaseStyle || "chase";
    let shootPlayer = enemyData.shootPlayer || true;
    let shootStyle = enemyData.shootStyle || "straight";
    let handleSpeed = enemyData.handleSpeed || 1;
    let maxXSpeed = enemyData.maxXSpeed || 1;
    let shootPattern = enemyData.shootPattern || [0.2, 0.2, 2];
    let shootDamage = enemyData.shootDamage || 0.5;
    let crashDamage = enemyData.crashDamage || 1;
    let bulletSpeed = enemyData.bulletSpeed || 0.3;

    let frame = enemyData.frame || 8;
    let tileSheet = enemyData.tileSheet || "ships";
    super(
      pos,
      vec2(size * 0.5),
      tile(frame, game.system.tileSize * 2, G.system.tileSheets[tileSheet]),
    );
    this.angle = Math.PI;
    this.game = game;

    // edge of screen left/right
    this.minX = (game.system.width - 2) / -2;
    this.maxX = (game.system.width - 2) / 2;

    this.minY = (game.system.height - 2) / -2;
    this.maxY = (game.system.height + -100) / 2;

    this.name = name;
    this.setCollision(true, false, false, false);
    this.drawSize = vec2(2);
    this.velocity = vel;
    this.gameType = "enemy";
    this.health = startHealth;
    this.dead = false;
    this.scoreValue = scoreValue;
    this.chasePlayer = chasePlayer;
    this.shootPlayer = true;
    this.handleSpeed = handleSpeed;
    this.chaseStyle = chaseStyle;
    this.maxXSpeed = maxXSpeed * 0.1;
    this.shootTimer = new Timer(shootPattern[0]);
    this.shootCounter = 0;
    this.shootPattern = shootPattern;
    this.shootDamage = shootDamage;
    this.crashDamage = crashDamage;
    this.bulletSpeed = bulletSpeed;
    this.met = new Set();
    this.demoSpeed = -0.1;
  }

  update() {
    super.update();
    if (this.crashed || this.game.system.player.crashed) {
      this.velocity.x = 0;
      this.velocity.y = 0;
      return;
    }
    if (this.chasePlayer && this.chaseStyle == "chase") {
      let xDif = this.pos.x - G.system.player.pos.x;
      this.velocity.x += xDif * this.handleSpeed * -0.001;
      this.velocity.y = this.game.speed;
    } else {
      this.velocity.y = this.game.speed;
    }

    if (!this.game.system.gameStarted) {
      this.velocity.y = this.demoSpeed;
    }

    this.velocity.x = clamp(
      this.velocity.x,
      -1 * this.maxXSpeed,
      this.maxXSpeed,
    );

    this.pos.x += this.velocity.x;
    this.pos.y -= this.velocity.y;

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

    let shouldShoot = this.shootPlayer;

    if (shouldShoot) {
      if (this.shootTimer.elapsed()) {
        let newTime = this.shoot();
        this.shootTimer.set(newTime);
      }
    }

    //remove object when past bottom of screen
    if (this.pos.y < this.game.height / -2) {
      super.destroy();
    }
  }

  shoot() {
    particleEffect("muzzle", vec2(this.pos.x - 0.6, this.pos.y - 0.55), {
      scale: 0.3,
    });

    new Bullet(this.game, this, this.bulletSpeed, 1);

    let newWaitTime =
      this.shootPattern[this.shootCounter++ % this.shootPattern.length];
    return newWaitTime;
  }

  collideWithObject(o) {
    if (
      o.gameType == "bullet" &&
      (o.gameSource == "player" ||
        (o.gameSource == "enemy" && this.game.friendlyFire)) &&
      !this.met.has(o)
    ) {
      this.takeDamage(o.damage);
    }
    this.met.add(o);
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
