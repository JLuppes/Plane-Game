import { EngineObject, vec2, tile } from "littlejsengine";
import { G } from "./main";

export class Bullet extends EngineObject {
  constructor(game, source) {
    let x = game.system.width / 2;
    let y = game.system.height / 2 + 3;
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
