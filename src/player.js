
export class Player {
  constructor(scene, x, y, physics) {
    this.scene = scene;
    this.physics = physics;

    this.body = {
      x,
      y,
      width: 20,
      height: 28
    };

    this.speed = 150;

    this.keys = scene.input.keyboard.addKeys({
      up: "W",
      down: "S",
      left: "A",
      right: "D",
      upArrow: "UP",
      downArrow: "DOWN",
      leftArrow: "LEFT",
      rightArrow: "RIGHT"
    });

    this.sprite = scene.add.rectangle(
      x,
      y,
      this.body.width,
      this.body.height,
      0x4da6ff
    );

    this.sprite.setDepth(10);
  }

  update(delta) {
    const dt = delta / 1000;

    let dx = 0;
    let dy = 0;

    if (this.keys.left.isDown || this.keys.leftArrow.isDown) dx--;
    if (this.keys.right.isDown || this.keys.rightArrow.isDown) dx++;
    if (this.keys.up.isDown || this.keys.upArrow.isDown) dy--;
    if (this.keys.down.isDown || this.keys.downArrow.isDown) dy++;

    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx = (dx / length) * this.speed * dt;
      dy = (dy / length) * this.speed * dt;
    }

    this.physics.moveBody(this.body, dx, dy);

    this.sprite.setPosition(
      this.body.x + this.body.width / 2,
      this.body.y + this.body.height / 2
    );
  }
}
