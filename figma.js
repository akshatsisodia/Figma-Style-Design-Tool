const canvas = document.querySelector("#canvas");
//state management

const elemState = {
  elements: [],
  selectedElementId: null,
  zIndexCounter: 1,
  draggingData: {
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
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
    });

    el.addEventListener("blur", () => {
      el.contentEditable = false;
      data.text = el.innerText;
    });
  }

  el.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  el.addEventListener("mousedown", (e) => {
    if (el.contentEditable === true) return;

    e.preventDefault();
    e.stopPropagation();

    singleSelection(data.id);

    const canvasRect = canvas.getBoundingClientRect();
    elemState.draggingData.isDragging = true;
    elemState.draggingData.dragOffsetX = e.clientX - canvasRect.left - data.x;
    elemState.draggingData.dragOffsetY = e.clientY - canvasRect.top - data.y;
    bringToFront(data.id);
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
  bringToFront(id);
}

function clearSelection() {
  const prev = canvas.querySelector(".editor-element.selected");
  if (prev) prev.classList.remove("selected");
  elemState.selectedElementId = null;
}

canvas.addEventListener("click", (e) => {
  if (e.target === canvas) {
    console.log("Canvas clicked - clearing selection");
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
}

// Making an Helper Function to get Selected Element for dragging

function getSelectedElement() {
  return elemState.elements.find((elem) => elem.id === elemState.selectedElementId);
}

// mousemove

document.addEventListener("mousemove", (e) => {
  if (!elemState.selectedElementId || !elemState.draggingData.isDragging) return;

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
});

document.addEventListener("mouseup", () => {
  elemState.draggingData.isDragging = false;
});
