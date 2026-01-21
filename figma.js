//state management

const elem = {
    elements: [],
    Selected: null
}

// Unique Id Creation for each element

let elemId = 0;

function createId(){
    elemId++
    return elemId;
}

// creation of Elements 

const canvas = document.querySelector('#canvas')
let toolbtn = document.querySelector('.toolbar-btn');

toolbtn.addEventListener('click',()=>{
    let rect = document.createElement('div');
    rect.className = 'box';
    canvas.appendChild(rect)
    removeElement(rect)
})







