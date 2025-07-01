const canvas = document.getElementById("arrowCanvas");
const ctx = canvas.getContext("2d");
const shapeSelect = document.getElementById("shape-select");

let arrows = [];
// a drag point whether head, tail
let draggingPoint = null;
let selectedArrow = null;
// Define how close the mouse needs to be to head/tail
const hitRadius = 10;

let img = new Image();
img.src = "/image.png";
img.onload = () => {
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

class Arrow {
  constructor(x1, y1, x2, y2) {
    this.tail = { x: x1, y: y1 };
    this.head = { x: x2, y: y2 };
  }

  draw(ctx) {
    const { x: x1, y: y1 } = this.tail;
    const { x: x2, y: y2 } = this.head;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.stroke();

    drawArrowhead(ctx, x1, y1, x2, y2);

    drawControlPoint(ctx, x1, y1);
    drawControlPoint(ctx, x2, y2);
  }

  isNear(point, pos) {
    const dx = point.x - pos.x;
    const dy = point.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) < hitRadius;
  }
}

function drawControlPoint(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}

function drawArrowhead(ctx, fromx, fromy, tox, toy) {
  const headlen = 15;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(
    tox - headlen * Math.cos(angle - Math.PI / 6),
    toy - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    tox - headlen * Math.cos(angle + Math.PI / 6),
    toy - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.lineTo(tox, toy);
  ctx.fillStyle = "blue";
  ctx.fill();
}

canvas.addEventListener("click", (e) => {
  if (shapeSelect.value !== "arrow") return;

  const pos = getMousePos(e);

  for (let arrow of arrows) {
    if (arrow.isNear(pos, arrow.head) || arrow.isNear(pos, arrow.tail)) {
      return;
    }
  }

  const arrow = new Arrow(pos.x, pos.y, pos.x + 100, pos.y);
  arrows.push(arrow);
  redraw();
});

canvas.addEventListener("mousedown", (e) => {
  const pos = getMousePos(e);

  for (let arrow of arrows) {
    if (arrow.isNear(pos, arrow.head)) {
      draggingPoint = "head";
      selectedArrow = arrow;
      return;
    } else if (arrow.isNear(pos, arrow.tail)) {
      draggingPoint = "tail";
      selectedArrow = arrow;
      return;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!draggingPoint || !selectedArrow) return;

  const pos = getMousePos(e);
  if (draggingPoint === "head") {
    selectedArrow.head.x = pos.x;
    selectedArrow.head.y = pos.y;
  } else {
    selectedArrow.tail.x = pos.x;
    selectedArrow.tail.y = pos.y;
  }

  redraw();
});

canvas.addEventListener("mouseup", () => {
  draggingPoint = null;
  selectedArrow = null;
});

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  for (let arrow of arrows) {
    arrow.draw(ctx);
  }
}
