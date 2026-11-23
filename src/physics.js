
export class PhysicsSystem {
  constructor() {
    this.colliders = [];
  }

  addCollider(x, y, width, height, type = "solid") {
    this.colliders.push({ x, y, width, height, type });
  }

  clearColliders() {
    this.colliders = [];
  }

  overlaps(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  moveBody(body, dx, dy) {
    const nextX = { ...body, x: body.x + dx };

    if (!this.colliders.some(c => this.overlaps(nextX, c))) {
      body.x += dx;
    }

    const nextY = { ...body, y: body.y + dy };

    if (!this.colliders.some(c => this.overlaps(nextY, c))) {
      body.y += dy;
    }

    return body;
  }
}
