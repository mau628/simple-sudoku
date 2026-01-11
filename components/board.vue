<template>
  <section>
    <div class="control levels-picker">
      <span class="subtitle is-6 has-text-weight-bold">Level</span>
      <label class="radio" v-for="value in levels" :key="value.value">
        <input type="radio" name="level" :value="value.value" v-model="level" />
        <span v-html="value.label"></span>
      </label>
    </div>
    <div class="sdk-grid">
      <template v-for="(row, rowIndex) in result" :key="rowIndex">
        <div v-for="(cell, cellIndex) in row" :key="cellIndex" :class="[
          'sdk-cell',
          { 'is-fixed': cell.Visible, 'is-highlighted': cell.IsHighlighted }
        ]" @click="setNumber(cell)">
          <span>
            {{ cell.Value }}
          </span>
        </div>
      </template>
    </div>
    <div class="buttons buttons-picker">
      <button class="button" v-for="number in buttons" :key="number.Value" :class="{ 'is-primary': number.Selected }"
        @click="toggleNumber(number)">
        <span v-html="`${number.Label}`"></span>
        <span v-if="number.Remaining > 0" class="notification-badge">
          {{ number.Remaining }}
        </span>
      </button>
    </div>
  </section>
</template>
<script lang="ts" setup>
type Cell = {
  Value?: number;
  CellIndex: number;
  Visible: boolean;
  IsHighlighted: boolean;
};
type ButtonPicker = {
  Value: number;
  Selected: boolean;
  Remaining: number;
  Label: string;
};
const levels = ref([
  { label: '1', value: 2 },
  { label: '2', value: 3 },
  { label: '3', value: 4 },
  { label: '4', value: 5 },
  { label: '5', value: 6 },
]);
const levelStorageKey = 'sdk-level';
const localLevel = parseInt(localStorage.getItem(levelStorageKey) || '2');
const level = ref(levels.value[localLevel].value);
const result = ref<Cell[][]>([]);
const buttons = ref<ButtonPicker[]>(
  Array.from({ length: 9 }, (_, i) => ({
    Value: i + 1,
    Selected: false,
    Remaining: 0,
    Label: `&#x${(0x0030 + i + 1).toString(16)};`
  })).concat({ Value: -1, Selected: false, Remaining: 0, Label: '&#x274C;' })
);

const isGridValid = (boardGrid: number[][] | Cell[][]): boolean => {
  const isNumberArray = typeof boardGrid[0]?.[0] === 'number'
  for (let col = 0; col < 9; col++) {
    let uniqueItems = new Set<number>();//(boardGrid.map(row => row[col]));
    if (isNumberArray) {
      uniqueItems = new Set<number>(boardGrid.map(row => (row as number[])[col]));
    }
    else {
      uniqueItems = new Set<number>(boardGrid.map(row => (row as Cell[])[col].Value as number));
    }
    if ([...uniqueItems].filter(item => item !== undefined).length !== 9) {
      return false
    }
  }
  for (let row = 0; row < 9; row++) {
    //const uniqueItems = new Set(boardGrid[row].map(cell => cell));
    let uniqueItems = new Set<number>();
    if (isNumberArray) {
      uniqueItems = new Set<number>((boardGrid[row] as number[]));
    }
    else {
      uniqueItems = new Set<number>((boardGrid[row] as Cell[]).map(cell => cell.Value as number));
    }
    if (uniqueItems.size !== 9) {
      return false
    }
  }
  return true;
}

const generateGrid = (): number[][] => {
  let boardGrid = Array.from({ length: 9 }, () => Array(9).fill(0));
  let counter = 0;

  const shuffleArray = (array: number[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const isInCurrentCuadrant = (row: number, col: number, value: number) => {
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;

    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if (row === r && col === c) {
          continue;
        }
        if (boardGrid[r] && boardGrid[r][c] === value) {
          return true;
        }
      }
    }
    return false;
  };

  const fillGrid = () => {
    boardGrid = [];
    for (let row = 0; row < 9; row++) {
      let rowValues = new Set<number>();
      let sourceNumbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (let col = 0; col < 9; col++) {
        let colValues = new Set(boardGrid.map(r => r[col]));
        let limit = 10;
        let valueToAdd = sourceNumbers.pop() as number;
        while ((rowValues.has(valueToAdd) || colValues.has(valueToAdd) || isInCurrentCuadrant(row, col, valueToAdd)) && limit > 0) {
          sourceNumbers.unshift(valueToAdd);
          valueToAdd = sourceNumbers.pop() as number;
          limit--;
        }

        rowValues.add(valueToAdd);
      }

      boardGrid.push([...rowValues]);
    }
  }

  const isValid = () => {
    let hasErrors = !isGridValid(boardGrid);
    if (hasErrors) {
      return false;
    }

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        hasErrors = isInCurrentCuadrant(row, col, boardGrid[row][col]);
        if (hasErrors) {
          return false;
        }
      }
    }
    return true;
  }

  /*const hideCells = () => {
    boardGrid.forEach(row => {
      const indicesToHide = new Set<number>();
      while (indicesToHide.size < level.value) {
        const randomIndex = Math.floor(Math.random() * 9);
        indicesToHide.add(randomIndex);
        row[randomIndex] = undefined;
      }
    });
  }*/

  const hideCells = () => {
    const cellsToHide = level.value * 9;
    const hiddenCells = new Set<number>();
    do {
      const index = Math.floor(Math.random() * 81);
      hiddenCells.add(index);
    } while (hiddenCells.size < cellsToHide)
    
    let cellIndex =0;
    boardGrid.forEach(row => {
      row.forEach(col => {
        if(hiddenCells.has(cellIndex)) {
          boardGrid[row][col] = undefined;
        }
        cellIndex++;
      });
    });
  }

  do {
    fillGrid();
    counter++;
  } while (!isValid());
  hideCells();
  console.log(`Grid generated after ${counter} attempts`);

  return boardGrid;
}

const getGrid = () => {
  result.value = generateGrid().map((row) => row.map<Cell>((cell, cellIndex) => ({
    Value: cell,
    CellIndex: cellIndex,
    Visible: cell !== undefined,
    IsHighlighted: false,
  })));
}

const toggleNumber = (number: ButtonPicker) => {
  // Reset all buttons and cells in single pass
  buttons.value.forEach(num => {
    num.Selected = (num === number && !number.Selected);
    num.Remaining = 0;
  });

  if (!number.Selected) {
    // Just deselected - clear highlights
    result.value.forEach(row => row.forEach(cell => cell.IsHighlighted = false));
    return;
  }

  // Single pass to highlight and count
  let numberCounter = 0;
  for (const row of result.value) {
    for (const cell of row) {
      const isSameNumber = cell.Value === number.Value && number.Value > 0;
      cell.IsHighlighted = isSameNumber || (number.Value < 0 && !cell.Visible && cell.Value !== undefined);
      if (isSameNumber) numberCounter++;
    }
  }

  if (number.Value > 0) {
    number.Remaining = 9 - numberCounter;
  }
}

const setNumber = (cell: Cell) => {
  if (cell.Visible) {
    return;
  }
  const selectedNumber = buttons.value.find(num => num.Selected);
  if (selectedNumber) {
    if (selectedNumber.Value < 0) {
      cell.Value = undefined;
      cell.IsHighlighted = false;
      return;
    }
    cell.Value = selectedNumber.Value;
    selectedNumber.Remaining--;
    cell.IsHighlighted = true;

    const allFilled = result.value.every(row => row.every(cell => cell.Value !== undefined));
    if (allFilled && isGridValid(result.value)) {
      nextTick().then(() => {
        setTimeout(() => {
          alert('Congratulations! You have completed the puzzle correctly.');
          getGrid();
        }, 100);
      });
    }
  }
}

watch(level, () => {
  getGrid();
  localStorage.setItem(levelStorageKey, levels.value.findIndex(lvl => lvl.value === level.value).toString());
});

getGrid();

</script>
<style lang="scss" scoped>
// Variables
$col-size: min(3em, 10vw);
$cell-size: $col-size;
$quadrant-border: 4px solid $text;
$cell-border: 1px solid $text;

// Level picker section
.levels-picker {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5em;
}

.radio {
  margin-right: 0.7em;

  span {
    margin-left: 0.2em;
  }
}

// Sudoku grid
.sdk-grid {
  margin: 1em 0;
  grid-template-columns: repeat(9, $cell-size);
  display: grid;
  gap: 0;
  max-width: 100%;
  width: fit-content;
}

.sdk-cell {
  align-items: center;
  align-content: center;
  justify-content: center;
  text-align: center;
  z-index: 1;
  border: $cell-border;
  aspect-ratio: 1;
  min-width: 0;
  padding: 0;
  margin: 0;

  // Thicker borders for 3x3 quadrants
  &:nth-child(9n+3),
  &:nth-child(9n+6) {
    border-right: $quadrant-border;
  }

  &:nth-child(n+19):nth-child(-n+27),
  &:nth-child(n+46):nth-child(-n+54) {
    border-bottom: $quadrant-border;
  }

  span {
    font-size: clamp(1rem, 4vw, 1.5rem);
  }
}

// Cell states
.is-fixed {
  background-color: rgba($text, 0.2);
}

.is-highlighted {
  background-color: rgba($link, 0.3);
}

// Hover effects for rows and columns
@for $i from 0 through 8 {

  .sdk-grid:has([data-row="#{$i}"]:hover) [data-row="#{$i}"],
  .sdk-grid:has([data-col="#{$i}"]:hover) [data-col="#{$i}"] {
    background-color: rgba($primary, 0.15);
  }
}

// Number picker buttons
.buttons-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3em, 1fr));
  max-width: 100%;
  gap: 0.5em;
  margin: 0 auto;
  justify-items: center;
  width: fit-content;

  @media (min-width: 768px) {
    grid-template-columns: repeat(5, auto);
    gap: 1em;
  }
}

.button {
  width: 100%;
  min-width: 3em;
  max-width: 5em;
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: $danger;
  color: white;
  border-radius: 50%;
  font-size: 0.75em;
  font-weight: bold;
}
</style>
