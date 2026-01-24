// The Main Play Area - Canvas Selected
const canvas = document.querySelector("#canvas");

// Load saved layout on page load
document.addEventListener("DOMContentLoaded", () => {
  loadLayout();
});

// Auto-save layout whenever state changes
function autoSave() {
  saveLayout();
}

// Save layout to localStorage

function saveLayout() {
  const layout = elemState.elements.map((el) => ({
    id: el.id,
    type: el.type,
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    styles: el.styles,
    text: el.text,
    rotation: el.rotation,
    zIndex: el.zIndex,
  }));

  localStorage.setItem("canvasLayout", JSON.stringify(layout));
  localStorage.setItem("zIndexCounter", elemState.zIndexCounter);
  localStorage.setItem("elemIdCounter", elemId);
}

// Load layout from localStorage
function loadLayout() {
  const savedLayout = localStorage.getItem("canvasLayout");
  const savedZIndex = localStorage.getItem("zIndexCounter");
  const savedElemId = localStorage.getItem("elemIdCounter");


  if (savedLayout) {
    const layout = JSON.parse(savedLayout);

    // Restore counters
    if (savedZIndex) elemState.zIndexCounter = parseInt(savedZIndex);
    if (savedElemId) elemId = parseInt(savedElemId);

    // Recreate all elements
    layout.forEach((elementData) => {
      elemState.elements.push(elementData);
      createElementUI(elementData);
    });

    // Clear selection after loading
    clearSelection();
  }
}

// theme toggle ------>>

const themeToggle = document.querySelector("#themeToggle");
const root = document.documentElement;

// Check for saved theme or default to light
const currentTheme = localStorage.getItem("theme") || "light";

// Apply theme on load
root.classList.remove("dark", "light");
root.classList.add(currentTheme);

// Toggle theme on button click

themeToggle.addEventListener("click", (e) => {
  if (root.classList.contains("dark")) {
    root.classList.remove("dark");
    root.classList.add("light");
    localStorage.setItem("theme", "light");
    themeToggle.textContent = "Toggle Theme";
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
    themeToggle.textContent = "Toggle Theme";
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

// flag for update properties panel

let needsPropertiesUpdate = false;

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
    x: 400 + index * offset,
    y: 200 + index * offset,
    height: type === "text" ? 50 : 150,
    width: type === "text" ? 150 : 150,
    styles: {
      backgroundColor: type === "text" ? "transparent" : "gray",
      color: "black",
      borderRadius: 0,
      fontSize: 16,
    },
    zIndex: elemState.zIndexCounter++,
    text: type === "text" ? "Text" : "",
    rotation: 0,
  };

  elemState.elements.push(elementData);
  createElementUI(elementData);
  saveLayout();
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
  el.style.transform = `rotate(${data.rotation || 0}deg)`;

  if (data.type === "rectangle") {
    el.style.borderRadius = data.styles.borderRadius + "px";
  }
  if (data.type === "text") {
    el.style.fontSize = data.styles.fontSize + "px";
  }

  if (data.type === "text") {
    el.innerText = data.text;
    el.addEventListener("dblclick", () => {
      el.contentEditable = true;
      el.focus();

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
      autoSave();
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

    if (el.contentEditable === "true") return;

    // otherwise Drag

    startDrag(e, data);
  });
  canvas.appendChild(el);
  singleSelection(data.id);
}

// adding Event Listeners to Toolbar Element Buttons

// Buttons to create Elements on the Canvas ------->>

const addRect = document.querySelector("#add-rect");
const addText = document.querySelector("#add-text");
const jsonDownloadBtn = document.querySelector("#json-btn");
const htmlDownloadBtn = document.querySelector("#html-btn");

addRect.addEventListener("click", () => {
  createElementData("rectangle");
});

addText.addEventListener("click", () => {
  createElementData("text");
});

jsonDownloadBtn.addEventListener("click", () => {
  exportInJSON();
});

htmlDownloadBtn.addEventListener("click", () => {
  exportAsHTML();
});

// Keyboard keys to create Elements on the Canvas ----->>

document.addEventListener("keydown", (e) => {
  // ignore typing inside input / textarea
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
    return;
  }

  if (e.key === "r" || e.key === "R") {
    createElementData("rectangle");
  }

  if (e.key === "t" || e.key === "T") {
    createElementData("text");
  }
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
  updatePropertiesPanel();
}

function clearSelection() {
  removeResizeHandle();
  const prev = canvas.querySelector(".editor-element.selected");
  if (prev) prev.classList.remove("selected");
  elemState.selectedElementId = null;
  renderLayersPanel();
  updatePropertiesPanel();
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

  // setting Canvas Boundary - constrain position
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

  needsPropertiesUpdate = true;
  updatePropertiesPanel();
}

// Mouseup stop Dragging and Resizing

document.addEventListener("mouseup", () => {
  const wasDragging = elemState.draggingData.isDragging;
  const wasResizing = elemState.resizeData.isResizing;
  const wasRotating = elemState.rotationData.isRotating;

  elemState.draggingData.isDragging = false;
  elemState.resizeData.isResizing = false;
  elemState.rotationData.isRotating = false;

  // Save after any transformation

  if (wasDragging || wasResizing || wasRotating) {
    autoSave();
  }
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

  // Get canvas dimensions for boundary checking
  const canvasRect = canvas.getBoundingClientRect();

  if (rd.handle === "se") {
    width = rd.startWidth + dx;
    height = rd.startHeight + dy;
    // Constrain to canvas
    width = Math.min(width, canvasRect.width - x);
    height = Math.min(height, canvasRect.height - y);
  } else if (rd.handle === "sw") {
    width = rd.startWidth - dx;
    height = rd.startHeight + dy;
    x = rd.startXPos + dx;
    // Constrain to canvas
    if (x < 0) {
      width = rd.startWidth + rd.startXPos;
      x = 0;
    }
    height = Math.min(height, canvasRect.height - y);
  } else if (rd.handle === "ne") {
    width = rd.startWidth + dx;
    height = rd.startHeight - dy;
    y = rd.startYPos + dy;
    // Constrain to canvas
    width = Math.min(width, canvasRect.width - x);
    if (y < 0) {
      height = rd.startHeight + rd.startYPos;
      y = 0;
    }
  } else if (rd.handle === "nw") {
    width = rd.startWidth - dx;
    height = rd.startHeight - dy;
    x = rd.startXPos + dx;
    y = rd.startYPos + dy;
    // Constrain to canvas
    if (x < 0) {
      width = rd.startWidth + rd.startXPos;
      x = 0;
    }
    if (y < 0) {
      height = rd.startHeight + rd.startYPos;
      y = 0;
    }
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

  needsPropertiesUpdate = true;
  updatePropertiesPanel();
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

  needsPropertiesUpdate = true;
  updatePropertiesPanel();
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
      <span>${el.type}</span>
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
  const el = elemState.elements.find((e) => e.id === id);
  if (!el) return;

  el.zIndex = elemState.zIndexCounter++;

  const dom = canvas.querySelector(`[data-id="${id}"]`);
  dom.style.zIndex = el.zIndex;

  renderLayersPanel();
}

function updatePropertiesPanel() {
  const noSelection = document.querySelector("#no-selection");
  const commonLayout = document.querySelector("#common-layout");
  const rectLayout = document.querySelector("#rect-layout");
  const textLayout = document.querySelector("#text-layout");

  // Get all inputs from common layout
  const commonInputs = document.querySelectorAll("#common-layout .prop-row input");
  const xInput = commonInputs[0];
  const yInput = commonInputs[1];
  const widthInput = commonInputs[2];
  const heightInput = commonInputs[3];
  const rotationInput = commonInputs[4];

  // Rectangle inputs
  const rectColorInput = document.querySelector("#rect-color");
  const rectColorValue = document.querySelector("#rect-layout .color-value");
  const rectRadiusInput = document.querySelector("#rect-radius");

  // Text inputs
  const textFontSizeInput = document.querySelector("#text-fontsize");

  const textColorInput = document.querySelector("#text-color");
  const textColorValue = document.querySelector("#text-layout .color-value");

  if (!elemState.selectedElementId) {
    // No selection - show no-selection message
    noSelection.classList.remove("hidden");
    commonLayout.classList.add("hidden");
    rectLayout.classList.add("hidden");
    textLayout.classList.add("hidden");
    return;
  }

  const elemData = getSelectedElement();

  if (!elemData) return;

  // Hide no-selection and always show common properties
  noSelection.classList.add("hidden");
  commonLayout.classList.remove("hidden");

  // Update common properties
  xInput.value = Math.round(elemData.x);
  yInput.value = Math.round(elemData.y);
  widthInput.value = Math.round(elemData.width);
  heightInput.value = Math.round(elemData.height);
  rotationInput.value = Math.round(elemData.rotation || 0);

  // Show type-specific properties
  if (elemData.type === "rectangle") {
    rectLayout.classList.remove("hidden");
    textLayout.classList.add("hidden");
    rectColorInput.value = elemData.styles.backgroundColor;
    rectColorValue.textContent = elemData.styles.backgroundColor.toUpperCase();
    rectRadiusInput.value = elemData.styles.borderRadius;
  } else if (elemData.type === "text") {
    rectLayout.classList.add("hidden");
    textLayout.classList.remove("hidden");
    textFontSizeInput.value = elemData.styles.fontSize;
    textColorInput.value = elemData.styles.color;
    textColorValue.textContent = elemData.styles.color.toUpperCase();
  }
}

// Properties Panel Event Listeners - Common Properties

const commonInputs = document.querySelectorAll("#common-layout .prop-row input");

// X Position
commonInputs[0].addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData) return;
  elemData.x = parseInt(e.target.value) || 0;
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.left = elemData.x + "px";
});

// Y Position
commonInputs[1].addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData) return;
  elemData.y = parseInt(e.target.value) || 0;
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.top = elemData.y + "px";
});

// Width
commonInputs[2].addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData) return;
  elemData.width = Math.max(30, parseInt(e.target.value) || 30);
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.width = elemData.width + "px";
});

// Height
commonInputs[3].addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData) return;
  elemData.height = Math.max(20, parseInt(e.target.value) || 20);
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.height = elemData.height + "px";
});

// Rotation -
commonInputs[4].addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData) return;
  elemData.rotation = parseInt(e.target.value) || 0;
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.transform = `rotate(${elemData.rotation}deg)`;
  updatePropertiesPanel();
});

// Rectangle Properties

document.querySelector("#rect-color").addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData || elemData.type !== "rectangle") return;
  elemData.styles.backgroundColor = e.target.value;
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.backgroundColor = e.target.value;

  // Update color value display
  const colorValue = document.querySelector("#rect-layout .color-value");
  if (colorValue) colorValue.textContent = e.target.value.toUpperCase();
});

document.querySelector("#rect-radius").addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData || elemData.type !== "rectangle") return;
  elemData.styles.borderRadius = parseInt(e.target.value) || 0;
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.borderRadius = elemData.styles.borderRadius + "px";
});

// Text Properties

document.querySelector("#text-fontsize").addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData || elemData.type !== "text") return;
  elemData.styles.fontSize = Math.max(8, parseInt(e.target.value) || 16);
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.fontSize = elemData.styles.fontSize + "px";
});

document.querySelector("#text-color").addEventListener("input", (e) => {
  const elemData = getSelectedElement();
  if (!elemData || elemData.type !== "text") return;
  elemData.styles.color = e.target.value;
  const domEl = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domEl) domEl.style.color = e.target.value;

  // Update color value display
  const colorValue = document.querySelector("#text-layout .color-value");
  if (colorValue) colorValue.textContent = e.target.value.toUpperCase();
});

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

// --------- Keyboard Controls -------------------->>>>>

document.addEventListener("keydown", (e) => {
  // if an element is selected

  if (!elemState.selectedElementId) return;

  // Don't handle when editing text

  const selectedDomElem = canvas.querySelector(`[data-id="${elemState.selectedElementId}"]`);
  if (selectedDomElem && selectedDomElem.contentEditable === "true") {
    return;
  }

  const elemData = getSelectedElement();
  if (!elemData) return;

  // Prevent default behavior for arrow keys and delete

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Delete", "Backspace"].includes(e.key)) {
    e.preventDefault();
  }

  // Handle Delete key

  if (e.key === "Delete" || e.key === "Backspace") {
    deleteSelectedElement();
    return;
  }

  // Handle Arrow keys - move by 5px (or 10px with Shift)

  const canvasRect = canvas.getBoundingClientRect();
  const moveAmount = e.shiftKey ? 10 : 5;
  let newX = elemData.x;
  let newY = elemData.y;

  // Arrow keys movement

  if (e.key === "ArrowLeft") {
    newX = elemData.x - moveAmount;
  } else if (e.key === "ArrowRight") {
    newX = elemData.x + moveAmount;
  } else if (e.key === "ArrowUp") {
    newY = elemData.y - moveAmount;
  } else if (e.key === "ArrowDown") {
    newY = elemData.y + moveAmount;
  } else {
    return; // If not an arrow key, do nothing
  }

  // Respect canvas boundaries
  newX = Math.max(0, Math.min(newX, canvasRect.width - elemData.width));
  newY = Math.max(0, Math.min(newY, canvasRect.height - elemData.height));

  // Update state
  elemData.x = newX;
  elemData.y = newY;

  // Update DOM
  const domElem = canvas.querySelector(`[data-id="${elemData.id}"]`);
  if (domElem) {
    domElem.style.left = `${newX}px`;
    domElem.style.top = `${newY}px`;
  }

  // Update properties panel
  updatePropertiesPanel();
});

// Function to delete selected element ------------>>

function deleteSelectedElement() {
  if (!elemState.selectedElementId) return;

  const id = elemState.selectedElementId;

  // Remove from DOM
  const domElem = canvas.querySelector(`[data-id="${id}"]`);
  if (domElem) {
    domElem.remove();
  }

  // Remove from state
  elemState.elements = elemState.elements.filter((el) => el.id !== id);

  // Clear selection
  elemState.selectedElementId = null;

  // Update UI
  renderLayersPanel();
  updatePropertiesPanel();

  // save updated layout
  autoSave();
}

// functions for exporting data in JSON file --------->>

function exportInJSON() {
  const exportData = {
    canvas: {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    },
    elements: elemState.elements,
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.json";
  a.click();

  URL.revokeObjectURL(url);
}

// functions for converting element data in HTML Structure --------->>

function elementToHTML(el) {
  const commonStyle = `
    position: absolute;
    left: ${el.x}px;
    top: ${el.y}px;
    width: ${el.width}px;
    height: ${el.height}px;
    transform: rotate(${el.rotation || 0}deg);
    z-index: ${el.zIndex};
  `;

  if (el.type === "rectangle") {
    return `
      <div style="
        ${commonStyle}
        background: ${el.styles?.backgroundColor || "#ccc"};
      "></div>
    `;
  }

  if (el.type === "text") {
    return `
      <div style="
        ${commonStyle}
        color: ${el.styles?.color || "#000"};
        font-size: ${el.styles?.fontSize || 16}px;
        font-family: Arial, sans-serif;
      ">
        ${el.text || ""}
      </div>
    `;
  }

  return "";
}

// functions for converting element data in HTML Structure --------->>

function exportAsHTML() {
  const elementsHTML = elemState.elements.map(elementToHTML).join("\n");

  const htmlString = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Exported Design</title>
</head>
<body>
  <div style="
    position: relative;
    width: ${canvas.clientWidth}px;
    height: ${canvas.clientHeight}px;
    border: 1px solid #ccc;
  ">
    ${elementsHTML}
  </div>
</body>
</html>
`;

  const blob = new Blob([htmlString], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "design.html";
  a.click();

  URL.revokeObjectURL(url);
}

// --------- Real-time Properties Panel Update Loop

function updateLoop() {
  if (needsPropertiesUpdate) {
    updatePropertiesPanel();
    needsPropertiesUpdate = false;
  }
  requestAnimationFrame(updateLoop);
}

// Start the loop
updateLoop();
