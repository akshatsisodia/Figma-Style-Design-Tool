# Figma-Style Design Tool (DOM Only)

A lightweight visual design editor inspired by Figma, built entirely using **HTML, CSS, and vanilla JavaScript**.  
No canvas, no SVG, no frameworks — everything is handled through direct DOM manipulation.

This project focuses on understanding how real design tools work under the hood: selection logic, dragging, resizing, layers, state management, and persistence.

---

## 🎯 Project Goal

The goal of this project is to build a basic design editor that allows users to visually create and manipulate elements on a canvas using standard web technologies.

The emphasis is **not** on performance optimizations or advanced rendering, but on:
- Clean DOM manipulation
- Accurate mouse and keyboard event handling
- Proper state management
- Clear separation of logic

(As defined in the project brief) :contentReference[oaicite:0]{index=0}

---

## 🧩 Features

### 1. Element Creation
- Supports two element types:
  - Rectangle
  - Text box
- Each element:
  - Is a simple `<div>` in the DOM
  - Has a unique ID
  - Appears with a default size and position
  - Stores metadata like type, position, size, styles

---

### 2. Single Element Selection
- Only **one element** can be selected at a time
- Clicking an element:
  - Selects it
  - Shows a visible outline
  - Displays four resize handles
- Clicking on empty canvas:
  - Deselects the element
  - Hides selection UI
- Selection state is centrally managed so all tools stay in sync

---

### 3. Dragging, Resizing & Rotation

**Dragging**
- Elements can be dragged using the mouse
- Movement is calculated using mouse events
- Dragging is restricted within canvas boundaries

**Resizing**
- Allowed only from the four corner handles
- Width and height update in real time
- Minimum size constraints prevent invalid dimensions

**Rotation**
- Basic rotation using CSS `transform`
- Event-based logic (no physics engines)
- Rotation state persists on save/load

---

### 4. Layers Panel
- Displays all elements as a vertical list
- Clicking a layer selects the element on the canvas
- Supports:
  - Move Up (bring forward)
  - Move Down (send backward)
- Layer order updates:
  - Visually (z-index)
  - Internally (state array)

---

### 5. Properties Panel
Allows editing properties of the selected element:
- Width
- Height
- Background color
- Text content (for text elements only)

Changes update the element **instantly**, and the panel refreshes automatically when selection changes.

---

### 6. Keyboard Interactions
- `Delete` → removes selected element
- Arrow keys → move element by 5px
- Keyboard movement respects canvas boundaries
- Shortcuts work only when an element is selected

---

### 7. Save & Load (Persistence)
- Layout is saved to `localStorage`
- Data is stored as an array of objects containing:
  - id, type
  - position
  - size
  - styles
  - layer order
- On page refresh:
  - Canvas is restored automatically
  - All elements reappear exactly as before

---

### 8. Export Functionality
Supports exporting the current design as:
- **JSON** → raw layout data
- **HTML** → basic HTML structure with inline styles

Exports are not production-ready but accurately represent the canvas state.

---

## 🛠 Tech Stack

- HTML
- CSS
- Vanilla JavaScript (ES6)
- DOM APIs
- localStorage

---

## 📌 Notes

- No external libraries or frameworks were used
- No `<canvas>` or SVG rendering
- Code is written with clarity and readability in mind
- Logic is kept explicit rather than abstracted unnecessarily

---

## 🚀 Deployment

- This project is deployed using Vercel.
- Since the project is built with plain HTML, CSS, and JavaScript, it works seamlessly as a static site on Vercel.

Live URL:
[(https://design-by-code.vercel.app/)]
---


