import { EngineObject, vec2, tile, particleEffect, rand } from "littlejsengine";
import { G } from "./main";
import { InfoPopup } from "./InfoPopup";

export class PowerUp extends EngineObject {
  constructor(game, powerupData) {
    let x = game.system.width / 2;
    let y = game.system.height / 2 + 3;
    let pos = vec2(rand(-x, x), y);
    let frame = powerupData.frame || 0;
    let tileSize = powerupData.tileSize || game.system.tileSize;
    let pointValue = powerupData.pointValue || 100;
    let spriteSheet = powerupData.spriteSheet || "general";
    let displaySize = powerupData.size || 1;
    let tileData = tile(frame, tileSize, G.system.tileSheets[spriteSheet]);

    super(pos, vec2(0.8 * displaySize), tileData);

    this.displaySize = displaySize;
    this.game = game;
    this.setCollision(true, true, false, false);
    this.gameType = "powerUp";
    this.gameSource = "game";
    this.effectActive = false;

    this.powerupData = powerupData;
    this.tileData = tileData;
    this.tileSize = tileSize;
    this.name = powerupData.name ? powerupData.name : "Powerup";
    this.angle = powerupData.angle ? powerupData.angle : 0;
    this.drawSize = powerupData.drawSize ? vec2(powerupData.drawSize) : vec2(2);
    this.speedFactor = powerupData.speedFactor ? powerupData.speedFactor : 1;
    this.pointValue = pointValue;
  }

  startUp() {
    this.applyOverwrites();
    this.applyAdditions();
    this.applyMultipliers();
  }

  shutDown() {
    this.removeOverwrites();
    this.removeAdditions();
    this.removeMultipliers();
    this.destroy();
  }

  pickedUp() {
    console.log("Picked up Powerup: " + this.name);
    const powerupInfoPopup = new InfoPopup(this.powerupData.name, this.pos);
    powerupInfoPopup.displayType = "wave";
    G.system.infoPopups.push(powerupInfoPopup);
    particleEffect("magic", this.pos).emitTime = 0.1;
    G.score += this.pointValue;
    if (this.powerupData.autoUse) {
      this.usePowerup();
    } else {
      G.system.currentHeldPowerUp = this;
    }
    super.destroy();
  }

  usePowerup() {
    if (this.powerupData.duration > 0) {
      G.system.currentActiveEffects.push(this);
    } else {
      this.applyOverwrites();
      this.applyAdditions();
      this.applyMultipliers();
      super.destroy();
    }
    if (!this.powerupData.autoUse) {
      G.system.currentHeldPowerUp = {};
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
  applyMultipliers() {
    if (this.powerupData.gamePropertyMultipliers) {
      for (let key in this.powerupData.gamePropertyMultipliers) {
        if (key.includes("system")) {
          console.log(
            `System key ${key} found in powerup ${this.powerupData.name}!\nCancelling usage.`,
          );
          continue;
        }
        let keyData = this.powerupData.gamePropertyMultipliers[key];
        console.log(
          `Powerup "${this.name}" found multiplier x${keyData} for key "${key}": ${this.powerupData.gamePropertyMultipliers[key]}`,
        );
        if (G[key] != null) {
          G[key] = G[key] * keyData;
          console.log(
            `Game property "${key}" multiplied by ${keyData} to: ${G[key]}`,
          );
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
  removeMultipliers() {
    console.log("Removing multiplier:");
    if (this.powerupData.gamePropertyMultipliers) {
      for (let key in this.powerupData.gamePropertyMultipliers) {
        let keyData = this.powerupData.gamePropertyMultipliers[key];
        console.log(
          `Powerup "${this.name}" removing addition for key "${key}": ${this.powerupData.gamePropertyMultipliers[key]}`,
        );
        if (G[key] != null) {
          G[key] = G[key] / keyData;
          console.log(
            `Game property "${key}" multiplier removed, divided by ${keyData} to: ${G[key]}`,
          );
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
    if (!this.game.system.player.crashed) {
      this.pos.y -= this.speedFactor * G.speed;
    }
  }
}
