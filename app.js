const canvas = document.getElementById("arrowCanvas");
const ctx = canvas.getContext("2d");
const shapeSelect = document.getElementById("shape-select");
const colorPicker = document.getElementById("arrow-color");
const slider = document.getElementById("image-slider");

const imagePaths = [
  "/images/image 1.png",
  "/images/image 2.png",
  "/images/image 3.png",
  "/images/image 4.png",
];

const images = [];

let currentImageIndex = 0;

let loadedCount = 0;

imagePaths.forEach((src, index) => {
  const img = new Image();
  img.src = src;
  img.onload = () => {
    loadedCount++;
    if (loadedCount === imagePaths.length) {
      drawImage(0);
    }
  };
  images.push(img);
});

function drawImage(index) {
  currentImageIndex = index;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const img = images[index];
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// Slider change event
slider.addEventListener("input", (e) => {
  const value = parseInt(e.target.value, 10);
  if (images[value - 1]) {
    drawImage(value - 1);
  }
});

let visibleLabeledArrows = [];

const arrowsPerImage = new Map();
// a drag point whether head, tail
let draggingPoint = null;
// a drag for the whole body
let dragOffset = null;
let selectedArrow = null;
// Define how close the mouse needs to be to head/tail
const hitRadius = 10;
let mouseDownPos = null;
const moveThreshold = 5;

class Arrow {
  constructor(x1, y1, x2, y2, color = "blue") {
    this.tail = { x: x1, y: y1 };
    this.head = { x: x2, y: y2 };
    this.color = color;
  }

  draw(ctx) {
    const { x: x1, y: y1 } = this.tail;
    const { x: x2, y: y2 } = this.head;

    this.path = new Path2D();
    this.path.moveTo(x1, y1);
    this.path.lineTo(x2, y2);

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.stroke(this.path);

    drawArrowhead(ctx, x1, y1, x2, y2, this.color);

    drawControlPoint(ctx, x1, y1);
    drawControlPoint(ctx, x2, y2);
  }

  isNear(point, pos) {
    const dx = point.x - pos.x;
    const dy = point.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy) < hitRadius;
  }

  isOnLine(ctx, point) {
    if (!this.path) return false;
    ctx.lineWidth = 6;
    return ctx.isPointInStroke(this.path, point.x, point.y);
  }
}

class LabeledArrow extends Arrow {
  constructor(x1, y1, x2, y2, color) {
    super(x1, y1, x2, y2, color);
    this.label = "";
    this.input = this.createInput(x1, y1);
  }

  createInput(x, y) {
    const input = document.createElement("input");
    input.className = "arrow_label";
    input.type = "text";
    input.placeholder = "Enter text";
    input.style.display = "block";

    document.body.appendChild(input);

    input.addEventListener("blur", () => {
      const text = input.value.trim();
      if (text === "") {
        const arrows = getCurrentArrows();
        const index = arrows.indexOf(this);
        if (index !== -1) {
          arrows.splice(index, 1);
        }

        this.destroy();
        redraw();
      } else {
        this.label = text;
        this.input.remove();
        this.input = null;
        redraw();
      }
    });

    return input;
  }

  hide() {
    if (this.input) this.input.style.display = "none";
  }

  show() {
    if (this.input) {
      this.input.style.display = "block";
      this.updateInputPosition(); // ← fix is here
    }
  }

  updateInputPosition() {
    if (!this.input) return;
    const { x, y } = this.tail;
    this.input.style.left = `${canvas.offsetLeft + x + 10}px`;
    this.input.style.top = `${canvas.offsetTop + y - 20}px`;
  }

  draw(ctx) {
    super.draw(ctx);

    if (this.label) {
      const { x, y } = this.tail;

      ctx.font = "14px Arial";
      ctx.fillStyle = this.color;

      ctx.fillText(this.label, x + 10, y - 10);
    } else {
      this.updateInputPosition();
    }
  }

  destroy() {
    if (this.input) {
      this.input.remove();
    }
  }
}

function getCurrentArrows() {
  if (!arrowsPerImage.has(currentImageIndex)) {
    arrowsPerImage.set(currentImageIndex, []);
  }
  return arrowsPerImage.get(currentImageIndex);
}

function drawControlPoint(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}

function drawArrowhead(ctx, fromx, fromy, tox, toy, color = "blue") {
  const headlen = 10;
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
  ctx.fillStyle = color;
  ctx.fill();
}

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function drawImage(index) {
  for (let arrow of visibleLabeledArrows) {
    arrow.hide();
  }
  visibleLabeledArrows = [];

  currentImageIndex = index;
  redraw();

  for (let arrow of getCurrentArrows()) {
    if (arrow instanceof LabeledArrow) {
      arrow.show();
      visibleLabeledArrows.push(arrow);
    }
  }
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(images[currentImageIndex], 0, 0, canvas.width, canvas.height);

  for (let arrow of getCurrentArrows()) {
    arrow.draw(ctx);
  }
}

canvas.addEventListener("click", (e) => {
  if (shapeSelect.value === "") return;

  const pos = getMousePos(e);
  const color = colorPicker.value;
  const shape = shapeSelect.value;

  if (mouseDownPos && distance(mouseDownPos, pos) > moveThreshold) return;

  const arrows = getCurrentArrows();
  for (let arrow of arrows) {
    if (
      arrow.isNear(pos, arrow.head) ||
      arrow.isNear(pos, arrow.tail) ||
      arrow.isOnLine(ctx, pos)
    ) {
      return;
    }
  }

  let arrow;
  const offset = 100 / Math.sqrt(2);
  const tailX = pos.x - offset;
  const tailY = pos.y - offset;

  if (shape === "arrow") {
    arrow = new Arrow(tailX, tailY, pos.x, pos.y, color);
  } else if (shape === "arrow_text") {
    arrow = new LabeledArrow(tailX, tailY, pos.x, pos.y, color);
  }

  getCurrentArrows().push(arrow);
  redraw();
});

canvas.addEventListener("mousedown", (e) => {
  const pos = getMousePos(e);

  const arrows = getCurrentArrows();
  for (let arrow of arrows) {
    if (arrow.isNear(pos, arrow.head)) {
      draggingPoint = "head";
      selectedArrow = arrow;
      return;
    } else if (arrow.isNear(pos, arrow.tail)) {
      draggingPoint = "tail";
      selectedArrow = arrow;
      return;
    } else if (arrow.isOnLine(ctx, pos)) {
      draggingPoint = "body";
      selectedArrow = arrow;
      dragOffset = pos;
      return;
    }
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (!draggingPoint || !selectedArrow) return;

  const pos = getMousePos(e);

  if (draggingPoint === "head") {
    selectedArrow.head = { ...pos };
  } else if (draggingPoint === "tail") {
    selectedArrow.tail = { ...pos };
    if (selectedArrow instanceof LabeledArrow) {
      selectedArrow.updateInputPosition();
    }
  } else if (draggingPoint === "body") {
    const dx = pos.x - dragOffset.x;
    const dy = pos.y - dragOffset.y;

    selectedArrow.head.x += dx;
    selectedArrow.head.y += dy;
    selectedArrow.tail.x += dx;
    selectedArrow.tail.y += dy;

    if (selectedArrow instanceof LabeledArrow) {
      selectedArrow.updateInputPosition();
    }

    dragOffset = pos;
  }

  redraw();
});

canvas.addEventListener("mouseup", () => {
  draggingPoint = null;
  selectedArrow = null;
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const pos = getMousePos(e);

  const arrows = getCurrentArrows();
  for (let i = 0; i < arrows.length; i++) {
    const arrow = arrows[i];
    if (
      arrow.isNear(pos, arrow.head) ||
      arrow.isNear(pos, arrow.tail) ||
      arrow.isOnLine(ctx, pos)
    ) {
      if (arrow instanceof LabeledArrow) {
        arrow.destroy(); // remove the input
      }
      arrows.splice(i, 1);
      redraw();
      break;
    }
  }
});
