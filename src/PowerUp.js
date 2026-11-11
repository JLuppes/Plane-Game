import { EngineObject, vec2, tile, particleEffect } from "littlejsengine";
import { G } from "./main";
import { InfoPopup } from "./InfoPopup";

export class PowerUp extends EngineObject {
  constructor(game, powerupData) {
    let x = game.system.width / 2;
    let y = game.system.height / 2 + 3;
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

  startUp() {
    this.applyOverwrites();
    this.applyAdditions();
  }

  shutDown() {
    this.removeOverwrites();
    this.removeAdditions();
    this.destroy();
  }

  pickedUp() {
    console.log("Picked up Powerup: " + this.name);
    const powerupInfoPopup = new InfoPopup(this.powerupData.name, this.pos);
    powerupInfoPopup.displayType = "wave";
    G.infoPopups.push(powerupInfoPopup);
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
        if (key.includes("system")) {
          console.log(
            `System key ${key} found in powerup ${this.powerupData.name}!\nCancelling usage.`,
          );
          continue;
        }
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

  applyAdditions() {
    if (this.powerupData.gamePropertyAdditions) {
      for (let key in this.powerupData.gamePropertyAdditions) {
        if (key.includes("system")) {
          console.log(
            `System key ${key} found in powerup ${this.powerupData.name}!\nCancelling usage.`,
          );
          continue;
        }
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

  collideWithObject(o) {
    if (o.gameType == "player") {
      this.pickedUp();
    }
  }

  update() {
    super.update();
    this.pos.y -= this.speedFactor * G.speed;
  }
}
