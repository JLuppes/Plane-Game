import { vec2, Timer, drawText } from "littlejsengine";
import { G } from "./main";

export class InfoPopup {
  constructor(
    text,
    pos = vec2(0, 0),
    size = 1,
    duration = 2,
    color = G.system.cols.red,
    lineWidth = 0.2,
    followPlayer = false,
    displayType = "default",
  ) {
    this.text = text;
    this.pos = followPlayer ? G.system.player.pos : pos;
    this.size = size;
    this.duration = duration;
    this.color = color;
    this.lineWidth = lineWidth;
    this.followPlayer = followPlayer;
    this.displayType = displayType;
    this.currentSize = size;

    this.displayTimer = new Timer(duration);
  }

  display() {
    if (this.followPlayer) {
      this.pos = G.system.player.pos.copy();
    }
    if (this.displayType == "wave") {
      this.displayWave();
    } else {
      this.displayText();
    }
  }
  displayWave() {
    this.currentSize =
      this.size /
      1 /
      (1 + Math.abs(Math.sin(this.displayTimer.getPercent() * 6 + 2) + 1));
    this.displayText();
  }
  displayText() {
    drawText(this.text, this.pos, this.currentSize, this.color, this.lineWidth);
  }
}
