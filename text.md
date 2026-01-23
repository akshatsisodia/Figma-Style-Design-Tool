const canvas = document.querySelector("#canvas");
// theme toggle ------>>

const themeToggle = document.querySelector("#themeToggle");
const root = document.documentElement;

// Check for saved theme or default to light
const currentTheme = localStorage.getItem('theme') || 'light';

// Apply theme on load
root.classList.remove('dark', 'light');
root.classList.add(currentTheme);

// Toggle theme on button click

themeToggle.addEventListener("click", (e) => {
  if (root.classList.contains("dark")) {
    root.classList.remove("dark");
    root.classList.add("light");
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "Toggle Theme"; // or update button text
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "Toggle Theme"; // or update button text
  }
});
// state management - Source of Data

const elemState = {
  elements: [],
  selectedElementId: null,
  zIndexCounter: 1,
  draggingData: {
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
  },
  resizeData: {
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startXPos: 0,
    startYPos: 0,
  },
  rotationData: {
    isRotating: false,
    startAngle: 0,
    centerX: 0,
    centerY: 0,
    startRotation: 0,
  },
};

// Unique Id Creation for each element

let elemId = 0;

function createId() {
  elemId++;
  return elemId;
}

// saving Data in js

function createElementData(type) {
  const id = createId();
  const offset = 20;
  const index = elemState.elements.length;
  const elementData = {
    id,
    type,
    x: 100 + index * offset,
    y: 100 + index * offset,
    height: type === "text" ? 50 : 150,
    width: type === "text" ? 150 : 150,
    styles: {
      backgroundColor: type === "text" ? "transparent" : "gray",
      color: "black",
    },
    zIndex: elemState.zIndexCounter++,
    text: type === "text" ? "Text" : "",
    rotation: 0,
  };

  elemState.elements.push(elementData);
  createElementUI(elementData);
}

// creating Elements with DOM

function createElementUI(data) {
  const el = document.createElement("div");

  el.classList.add("editor-element");
  el.classList.add(data.type);
  el.dataset.id = data.id;
  el.style.left = `${data.x}px`;
  el.style.top = `${data.y}px`;
  el.style.height = `${data.height}px`;
  el.style.width = `${data.width}px`;
  el.style.zIndex = data.zIndex;

  if (data.type === "text") {
    el.innerText = data.text;
    el.addEventListener("dblclick", () => {
      el.contentEditable = true;
      el.focus();

      // ADD THIS - Automatically select all text

      setTimeout(() => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }, 0);
    });

    el.addEventListener("blur", () => {
      el.contentEditable = false;
      data.text = el.innerText;
    });
  }

  // Mousedown Event

  el.addEventListener("mousedown", (e) => {
    // rotation handle clicked
    if (e.target.classList.contains("rotation-handle")) {
      startRotation(e, data);
      return;
    }

    // if click on handle
    const handle = e.target.closest(".resize-handle");
    if (handle) {
      startResize(e, data, handle);
      return;
    }

    // if content is Editing that do nothing

    if (el.contentEditable === true) return;

    // otherwise Drag

    startDrag(e, data);
  });
  canvas.appendChild(el);
  singleSelection(data.id);
}

// adding Event Listeners to Toolbar Element Buttons

const addRect = document.querySelector("#add-rect");
const addText = document.querySelector("#add-text");

addRect.addEventListener("click", () => {
  createElementData("rectangle");
});

addText.addEventListener("click", () => {
  createElementData("text");
});

// Single Selecting of an Element

function singleSelection(id) {
  clearSelection();
  elemState.selectedElementId = id;
  const elem = canvas.querySelector(`[data-id="${id}"]`);
  if (elem) elem.classList.add("selected");
  addResizeHandle(elem);
  bringToFront(id);
  renderLayersPanel();
}

function clearSelection() {
  removeResizeHandle();
  const prev = canvas.querySelector(".editor-element.selected");
  if (prev) prev.classList.remove("selected");
  elemState.selectedElementId = null;
  renderLayersPanel();
}

canvas.addEventListener("click", (e) => {
  if (e.target === canvas) {
    clearSelection();
  }
});

// Bring the Selected Element in front (increasing zIndex)

function bringToFront(id) {
  const elem = elemState.elements.find((elem) => elem.id === id);
  if (!elem) return;
  elem.zIndex = elemState.zIndexCounter++;
  const domElem = canvas.querySelector(`[data-id="${id}"]`);
  if (!domElem) return;
  domElem.style.zIndex = elem.zIndex;
  renderLayersPanel();
}

// Making an Helper Function to get Selected Element for dragging

function getSelectedElement() {
  return elemState.elements.find((elem) => elem.id === elemState.selectedElementId);
}

// function for Start Dragging

// mousemove

document.addEventListener("mousemove", (e) => {
  // rotation has highest priority
  if (elemState.rotationData.isRotating) {
    handleRotationMove(e);
    return;
  }

  // checking resizing value first

  if (elemState.resizeData.isResizing) {
    handleResizeMove(e);
    return;
  }

  // checking dragging value

  if (elemState.draggingData.isDragging && elemState.selectedElementId) {
    handleDragMove(e);
    return;
  }
});

// function starting Drag

function startDrag(e, data) {
  e.preventDefault();
  e.stopPropagation();

  singleSelection(data.id);

  const canvasRect = canvas.getBoundingClientRect();
  elemState.draggingData.isDragging = true;
  elemState.draggingData.dragOffsetX = e.clientX - canvasRect.left - data.x;
  elemState.draggingData.dragOffsetY = e.clientY - canvasRect.top - data.y;
  bringToFront(data.id);
}

// continue Dragging an Element

function handleDragMove(e) {
  const elemData = getSelectedElement();
  if (!elemData) return;

  const canvasRect = canvas.getBoundingClientRect();

  let newX = e.clientX - canvasRect.left - elemState.draggingData.dragOffsetX;
  let newY = e.clientY - canvasRect.top - elemState.draggingData.dragOffsetY;

  // setting Canvas Boundry

  newX = Math.max(0, Math.min(newX, canvasRect.width - elemData.width));
  newY = Math.max(0, Math.min(newY, canvasRect.height - elemData.height));

  // updating state

  elemData.x = newX;
  elemData.y = newY;

  // updating DOM

  const domElem = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (!domElem) return;
  domElem.style.left = `${newX}px`;
  domElem.style.top = `${newY}px`;
}

// Mouseup stop Dragging and Resizing

document.addEventListener("mouseup", () => {
  elemState.draggingData.isDragging = false;
  elemState.resizeData.isResizing = false;
  elemState.rotationData.isRotating = false;
});

// Resize Handle function

function addResizeHandle(el) {
  const positions = ["nw", "ne", "sw", "se"];
  positions.forEach((pos) => {
    const div = document.createElement("div");
    div.className = `resize-handle ${pos}`;
    div.dataset.handle = pos;
    el.appendChild(div);
  });

  const rot = document.createElement("div");
  rot.className = "rotation-handle";
  rot.dataset.type = "rotate";
  el.appendChild(rot);
}

// Remove Resize Handle function

function removeResizeHandle() {
  const handle = canvas.querySelectorAll(".resize-handle");
  handle.forEach((h) => {
    h.remove();
  });

  // removing rotate handle
  const rotHandle = canvas.querySelectorAll(".rotation-handle");
  rotHandle.forEach((h) => {
    h.remove();
  });
}

// function for start resizing

function startResize(e, data, handle) {
  e.preventDefault();
  e.stopPropagation();

  singleSelection(data.id);

  elemState.resizeData.isResizing = true;
  elemState.resizeData.handle = handle.dataset.handle;
  elemState.resizeData.startX = e.clientX;
  elemState.resizeData.startY = e.clientY;
  elemState.resizeData.startHeight = data.height;
  elemState.resizeData.startWidth = data.width;
  elemState.resizeData.startXPos = data.x;
  elemState.resizeData.startYPos = data.y;
}

function handleResizeMove(e) {
  const elData = getSelectedElement();
  if (!elData) return;

  const rd = elemState.resizeData;
  const dx = e.clientX - rd.startX;
  const dy = e.clientY - rd.startY;

  let { width, height, x, y } = elData;

  if (rd.handle === "se") {
    width = rd.startWidth + dx;
    height = rd.startHeight + dy;
  } else if (rd.handle === "sw") {
    width = rd.startWidth - dx;
    height = rd.startHeight + dy;
    x = rd.startXPos + dx;
  } else if (rd.handle === "ne") {
    width = rd.startWidth + dx;
    height = rd.startHeight - dy;
    y = rd.startYPos + dy;
  } else if (rd.handle === "nw") {
    width = rd.startWidth - dx;
    height = rd.startHeight - dy;
    x = rd.startXPos + dx;
    y = rd.startYPos + dy;
  }

  // minimum size

  width = Math.max(30, width);
  height = Math.max(20, height);

  // update state

  elData.width = width;
  elData.height = height;
  elData.x = x;
  elData.y = y;

  // update DOM

  const domEl = canvas.querySelector(`[data-id="${elData.id}"]`);
  if (!domEl) return;

  domEl.style.width = width + "px";
  domEl.style.height = height + "px";
  domEl.style.left = x + "px";
  domEl.style.top = y + "px";
}

// start Rotation

function startRotation(e, data) {
  e.preventDefault();
  e.stopPropagation();

  singleSelection(data.id);

  const rect = canvas.querySelector(`[data-id="${data.id}"]`).getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  elemState.rotationData.isRotating = true;
  elemState.rotationData.centerX = centerX;
  elemState.rotationData.centerY = centerY;
  elemState.rotationData.startRotation = data.rotation;

  const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
  elemState.rotationData.startAngle = angle;
}

// handle Rotation Move

function handleRotationMove(e) {
  const elData = getSelectedElement();
  if (!elData) return;

  const rd = elemState.rotationData;

  const angle = Math.atan2(e.clientY - rd.centerY, e.clientX - rd.centerX);

  const delta = angle - rd.startAngle;
  const degree = rd.startRotation + (delta * 180) / Math.PI;

  elData.rotation = degree;

  const domEl = canvas.querySelector(`[data-id="${elData.id}"]`);
  domEl.style.transform = `rotate(${degree}deg)`;
}

// --------------------------->>>>>>

const layersList = document.querySelector("#layers-list");

function renderLayersPanel() {
  layersList.innerHTML = "";

  // higher zIndex = visually on top → show first
  const sorted = [...elemState.elements].sort((a, b) => b.zIndex - a.zIndex);

  sorted.forEach((el) => {
    const li = document.createElement("li");
    li.className = "layer-item";

    if (el.id === elemState.selectedElementId) {
      li.classList.add("active");
    }

    li.innerHTML = `
      <span>${el.type} ${el.id}</span>
      <div class="layer-actions">
        <button class="li-btn" id="up">Up</button>
        <button class="li-btn" id="down">Down</button>
      </div>
    `;

    // click layer → select element
    li.addEventListener("click", () => {
      singleSelection(el.id);
    });

    // move up
    li.querySelector("#up").addEventListener("click", (e) => {
      e.stopPropagation();
      moveLayerUp(el.id);
    });

    // move down
    li.querySelector("#down").addEventListener("click", (e) => {
      e.stopPropagation();
      moveLayerDown(el.id);
    });

    layersList.appendChild(li);
  });
}

// ----------------------------->>>>>

function moveLayerUp(id) {
  console.log("move layer up");
  const el = elemState.elements.find((e) => e.id === id);
  if (!el) return;

  el.zIndex = elemState.zIndexCounter++;

  const dom = canvas.querySelector(`[data-id="${id}"]`);
  dom.style.zIndex = el.zIndex;

  renderLayersPanel();
}

// --------- move Layer Down-------------------->>>>>

function moveLayerDown(id) {
  // 1. sort elements by zIndex (high → low)
  const sorted = [...elemState.elements].sort((a, b) => b.zIndex - a.zIndex);

  // 2. find index of selected element
  const index = sorted.findIndex((el) => el.id === id);

  // 3. if already at bottom, do nothing
  if (index === sorted.length - 1) return;

  // 4. swap zIndex with next lower element
  const current = sorted[index];
  const below = sorted[index + 1];

  [current.zIndex, below.zIndex] = [below.zIndex, current.zIndex];

  // 5. update DOM
  canvas.querySelector(`[data-id="${current.id}"]`).style.zIndex = current.zIndex;
  canvas.querySelector(`[data-id="${below.id}"]`).style.zIndex = below.zIndex;

  renderLayersPanel();
}
