from sudoku_logic import is_valid_grid, generate_puzzle
from sudoku_logic import is_valid_grid

def test_valid_grid():
    grid = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
    ]
    assert is_valid_grid(grid) is True

def test_invalid_row():
    # Duplicate "1" in the first row
    grid = [[1,1,2,3,4,5,6,7,8]] + [[0]*9 for _ in range(8)]
    assert is_valid_grid(grid) is False

def test_invalid_column():
    # Duplicate "1" in the first column
    grid = [[1] + [0]*8 for _ in range(9)]
    grid[1][0] = 1  # duplicate in column
    assert is_valid_grid(grid) is False

def test_invalid_box():
    # Duplicate "5" inside the top-left 3x3 box
    grid = [[0]*9 for _ in range(9)]
    grid[0][0] = 5
    grid[1][1] = 5  # duplicate in same 3x3 box
    assert is_valid_grid(grid) is False
