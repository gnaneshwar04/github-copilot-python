from flask import Flask, render_template, request, jsonify
from sudoku_logic import generate_puzzle, is_valid_grid, SIZE

app = Flask(__name__)

CURRENT = {
    'puzzle': None,
    'solution': None
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/new')
def new_game():
    # Use difficulty string instead of raw clues
    difficulty = request.args.get('difficulty', 'Medium')
    puzzle, solution = generate_puzzle(difficulty)
    CURRENT['puzzle'] = puzzle
    CURRENT['solution'] = solution
    return jsonify({'puzzle': puzzle})

@app.route('/check', methods=['POST'])
def check_solution():
    data = request.json
    board = data.get('board')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400

    incorrect = []
    for i in range(SIZE):
        for j in range(SIZE):
            if board[i][j] != solution[i][j]:
                incorrect.append([i, j])
    return jsonify({'incorrect': incorrect})

@app.route('/hint', methods=['POST'])
def hint():
    data = request.json
    row, col = data.get('row'), data.get('col')
    solution = CURRENT.get('solution')
    if solution is None:
        return jsonify({'error': 'No game in progress'}), 400
    return jsonify({'value': solution[row][col]})

if __name__ == '__main__':
    app.run(debug=True)
