// grid
const GRID_SIZE = 4;
const CELL_SIZE = 20;
const CELL_GAP = 2;

export default class Grid {
    #cells
    constructor(gridElement) {
      gridElement.style.setProperty("--grid-size",GRID_SIZE);
      gridElement.style.setProperty("--cell-size",`${CELL_SIZE}vmin`);
      gridElement.style.setProperty("--cell-gap",`${CELL_GAP}vmin`);
      this.#cells =  createCellElements(gridElement).map((cellElement,index) => {
        return new Cell(cellElement,index % GRID_SIZE,Math.floor(index / GRID_SIZE));
      }) 
    }
    get cells() {
        return this.#cells;
    }
    get cellsByRow() {
        return this.#cells.reduce((cellGrid,cell) => {
           cellGrid[cell.y] = cellGrid[cell.y] || [];
           cellGrid[cell.y][cell.x] = cell;
           return cellGrid;
        },[])
    }
    get cellsByColumn() {
        return this.#cells.reduce((cellGrid,cell) => {
           cellGrid[cell.x] = cellGrid[cell.x] || [];
           cellGrid[cell.x][cell.y] = cell;
           return cellGrid;
        },[])
    }
    get #emptyCells() {
        return this.#cells.filter(cell => cell.tile == null);
    }
    randomEmptyCell() {
      const randomIndex = Math.floor(Math.random() * this.#emptyCells.length);
      return this.#emptyCells[randomIndex];
    }
}

class Cell {
    #cellElement
    #x
    #y
    #tile
    #mergeTile
    constructor(cellElement,x,y) {
        this.#cellElement = cellElement;
        this.#x = x;
        this.#y = y;
    }
    get x() {
        return this.#x
    }
    get y() {
        return this.#y
    }
    get tile() {
        return this.#tile;
    }
    set tile(value) {
     this.#tile = value;
     if (value == null) return;
     this.#tile.x = this.#x;
     this.#tile.y = this.#y;
    }
    
    get mergeTile() {
        return this.#mergeTile
    }
    set mergeTile(value) {
      this.#mergeTile = value;
      if(value == null) return
      this.#mergeTile.x = this.#x;
      this.#mergeTile.y = this.#y;
    }
    canAccept(tile) {
      return  this.tile == null || (this.mergeTile == null && this.tile.value === tile.value)
    }
    mergeTiles() {
        if(this.tile == null || this.mergeTile == null) return;
        this.tile.value = this.#tile.value + this.mergeTile.value;
        this.mergeTile.remove();
        this.mergeTile = null;
    }
}

function createCellElements(gridElement) {
    const cells = [];
    for(let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cells.push("cell");
        gridElement.append(cell);
    }
    return cells;
}
 
// grid

// tile
class Tile  {
    #tileElement
    #x
    #y
    #value
    constructor(tileContainer,value = Math.random() > .5 ? 2 : 4) {
     this.#tileElement = document.createElement("div");
     this.#tileElement.classList.add("tile");
     tileContainer.append(this.#tileElement);
     this.value = value;
    }
    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = value;
        this.#tileElement.textContent = value;
        const power = Math.log2(value); // (for example value = 8, 2*2*2,power is 3, because we use three 2)
        const backgroundLightness = 100 - power * 9;
        this.#tileElement.style.setProperty("--background-lightness",`${backgroundLightness}%`);
        this.#tileElement.style.setProperty("--text-lightness",`${backgroundLightness <= 50 ? 90 : 10}%`)
    }
    set x(value) {
      this.#x = value;
      this.#tileElement.style.setProperty("--x",value);
    }
    set y(value) {
        this.#y = value;
        this.#tileElement.style.setProperty("--y",value);
      }
      remove() {
        this.#tileElement.remove();
      }
      waitForTransition(animation = false) {
        return new Promise(resolve => {
            this.#tileElement.addEventListener(animation ? "animationend" : "transitionend",resolve,{once: true})
        })
      }
}

// tile



const gameBoard = document.getElementById("game-board");

const grid = new Grid(gameBoard);

grid.randomEmptyCell().tile = new Tile(gameBoard);
grid.randomEmptyCell().tile = new Tile(gameBoard);

// handleUserInput
function setupInput() {
    window.addEventListener("keydown",handleInput,{once: true});
}

async function handleInput(e) {
    switch(e.keyCode) {
        case 87:
         if(!canMoveUp()) {
            setupInput();
            return;
         }
          await  moveUp();
          break;
        case 81:
            if(!canMoveLeft()) {
                setupInput();
                return;
             }
          await   moveUpLeft();
          break;
        case 69:
            if(!canMoveRight()) {
                setupInput();
                return;
             }
            await  moveUpRight();
            break;
        case 83:
            if(!canMoveDown()) {
                setupInput();
                return;
             }
            await  moveDown();
            break;
        default: 
            setupInput();
            return;
    }
    grid.cells.forEach(cell => cell.mergeTiles());
    const newTile = new Tile(gameBoard);
    grid.randomEmptyCell().tile = newTile;
    if(!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        newTile.waitForTransition(true).then(() => {
            alert("You lost! :)")
        })
        return;
    }
    setupInput();
}

setupInput();

 function moveUp() {
   return slideTails(grid.cellsByColumn);
 }

 function moveDown() {
    return slideTails(grid.cellsByColumn.map(column => [...column].reverse()));
  }
  
  function moveUpRight() {
    return slideTails(grid.cellsByRow.map(row => [...row].reverse()));
  }
  function moveUpLeft() {
    return slideTails(grid.cellsByRow);
  }
 function slideTails(cells) {
    return Promise.all(
    cells.flatMap(group => {
        const promises = [];
        for(let i = 1; i < group.length; i++) {
            const cell = group[i];
            if(cell.tile == null) continue
            let lastValidCell;
           for(let j = i - 1; j >= 0; j--) {
            const moveToCell = group[j];
           if(!moveToCell.canAccept(cell.tile)) break; 
            lastValidCell = moveToCell;
           }
           if(lastValidCell != null) {
            promises.push(cell.tile.waitForTransition())
              if(lastValidCell.tile != null) {
                lastValidCell.mergeTile = cell.tile;
              } else {
                lastValidCell.tile = cell.tile;
              }
              cell.tile = null;
           }
        }
        return promises;
    }));
 }

 function canMoveUp() {
    return canMove(grid.cellsByColumn)
 }
 function canMoveDown() {
    return canMove(grid.cellsByColumn.map(column => [...column].reverse()))
 }
 function canMoveLeft() {
    return canMove(grid.cellsByRow)
 }
 function canMoveRight() {
    return canMove(grid.cellsByRow.map(row => [...row].reverse()))
 }
 function canMove(cells) {
return cells.some(group => {
    return group.some((cell,index) => {
        if(index === 0) return false
        if(cell.tile == null) return false
        const moveToCell = group[index - 1];
        return moveToCell.canAccept(cell.tile)
    })
})
 }
// handleUserInput

