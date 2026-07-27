import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def find_empty_cell(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                return row, col
    return None

def count_solutions(board, limit=2):
    empty = find_empty_cell(board)
    if empty is None:
        return 1
    row, col = empty
    count = 0
    for num in range(1, SIZE + 1):
        if is_safe(board, row, col, num):
            board[row][col] = num
            count += count_solutions(board, limit)
            board[row][col] = EMPTY
            if count >= limit:
                return count
    return count

def remove_cells(board, clues):
    attempts = SIZE * SIZE - clues
    cells = [(r, c) for r in range(SIZE) for c in range(SIZE)]
    random.shuffle(cells)
    for row, col in cells:
        if attempts <= 0:
            break
        value = board[row][col]
        if value == EMPTY:
            continue
        board[row][col] = EMPTY
        if count_solutions(board, limit=2) != 1:
            board[row][col] = value
        else:
            attempts -= 1

def generate_puzzle(difficulty="Medium"):
    difficulty_settings = {"Easy": 40, "Medium": 30, "Hard": 20}
    clues = difficulty_settings.get(difficulty, 30)
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution

def is_valid_grid(grid):
    for row in grid:
        nums = [n for n in row if n != EMPTY]
        if len(nums) != len(set(nums)):
            return False
    for col in range(SIZE):
        nums = [grid[row][col] for row in range(SIZE) if grid[row][col] != EMPTY]
        if len(nums) != len(set(nums)):
            return False
    for box_row in range(0, SIZE, 3):
        for box_col in range(0, SIZE, 3):
            nums = []
            for r in range(box_row, box_row + 3):
                for c in range(box_col, box_col + 3):
                    if grid[r][c] != EMPTY:
                        nums.append(grid[r][c])
            if len(nums) != len(set(nums)):
                return False
    return True
