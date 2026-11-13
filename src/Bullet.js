import { EngineObject, vec2, tile } from "littlejsengine";
import { G } from "./main";

export class Bullet extends EngineObject {
  constructor(game, source, speed = 1, frame = 1, tileSheet = "general") {
    let x = game.system.width / 2;
    let y = game.system.height / 2 + 3;
    let sourcePos = source.pos.copy();
    let pos =
      source.gameType == "player"
        ? vec2(sourcePos.x, sourcePos.y + 0.2)
        : vec2(sourcePos.x, sourcePos.y - 0.2);
    let angle = source.angle;
    let bulletSpeed = speed;
    let bulletDamage =
      source.gameType == "player" ? G.playerDamage : source.shootDamage || 1;
    let bulletTileSheet = tileSheet;
    let bulletFrame = frame;
    super(
      pos,
      vec2(1.8),
      tile(frame, game.system.tileSize, G.system.tileSheets[bulletTileSheet]),
    );
    this.angle = angle;
    this.game = game;

    this.setCollision(true, true, false, false);
    this.drawSize = vec2(2).multiply(vec2(bulletDamage));
    this.speed = vec2(Math.sin(angle), Math.cos(angle));
    this.gameType = "bullet";
    this.gameSource = source.gameType;
    this.damage = bulletDamage;
    this.bulletSpeed = bulletSpeed;
  }

  collideWithObject(o) {
    // super.collideWithObject(o);

    const shouldDestroy =
      (this.gameSource == "enemy" && o.gameType == "player") ||
      (this.gameSource == "player" && o.gameType == "enemy") ||
      (this.gamesource == "enemy" &&
        o.gameType == "enemy" &&
        this.game.friendlyFire);
    if (shouldDestroy) {
      super.destroy();
    }
  }

  update() {
    super.update();

    this.pos.x += this.speed.x * this.bulletSpeed;
    this.pos.y += this.speed.y * this.bulletSpeed;
  }
}
