export function initSeatZoom(canvas) {
  const viewport = canvas.parentElement;
  const space = document.createElement("div");
  space.style.position = "relative";
  canvas.before(space);
  space.append(canvas);
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.boxSizing = "border-box";
  canvas.style.transformOrigin = "top left";
  let scale = 1;
  let drag = null,
    dragged = false;
  const pointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || scale <= 1)
      return;
    dragged = false;
    drag = { x: event.clientX, left: viewport.scrollLeft, id: event.pointerId };
  };
  const pointerMove = (event) => {
    if (!drag) return;
    const distance = event.clientX - drag.x;
    if (Math.abs(distance) > 5) {
      dragged = true;
      viewport.setPointerCapture(drag.id);
      viewport.classList.add("is-panning");
    }
    if (dragged) viewport.scrollLeft = drag.left - distance;
  };
  const pointerUp = () => {
    drag = null;
    viewport.classList.remove("is-panning");
  };
  const suppressDragClick = (event) => {
    if (dragged) {
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    }
  };
  viewport.addEventListener("pointerdown", pointerDown);
  viewport.addEventListener("pointermove", pointerMove);
  viewport.addEventListener("pointerup", pointerUp);
  viewport.addEventListener("pointercancel", pointerUp);
  viewport.addEventListener("click", suppressDragClick, true);
  function layout() {
    const width = Math.max(1, viewport.clientWidth - 4);
    canvas.style.width = `${width}px`;
    canvas.style.transform = `scale(${scale})`;
    space.style.width = `${width * scale}px`;
    space.style.height = `${canvas.offsetHeight * scale}px`;
    if (scale <= 1) viewport.scrollLeft = 0;
  }
  const observer = new ResizeObserver(layout);
  observer.observe(viewport);
  layout();
  return {
    setScale(value) {
      const previous = scale;
      scale = Math.max(0.75, Math.min(1.75, value));
      viewport.classList.toggle("is-zoomed", scale > 1);
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      layout();
      viewport.scrollLeft =
        (center * scale) / previous - viewport.clientWidth / 2;
      return scale;
    },
    destroy() {
      observer.disconnect();
      viewport.removeEventListener("pointerdown", pointerDown);
      viewport.removeEventListener("pointermove", pointerMove);
      viewport.removeEventListener("pointerup", pointerUp);
      viewport.removeEventListener("pointercancel", pointerUp);
      viewport.removeEventListener("click", suppressDragClick, true);
    },
  };
}
