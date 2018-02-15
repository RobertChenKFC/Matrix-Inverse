let num;
let submit;
let tableInput;
let calculate;
let resultMatrix;

let rows;
let cols;

function setup() {
    num = select('#num');

    submit = select('#submit');
    submit.mousePressed(numChanged);

    tableInput = select('#tableInput');

    const canvas = select('#defaultCanvas0');
    if(canvas) canvas.remove(); // here too?

    calculate = select('#calculate');
    calculate.mousePressed(calcMatrix);

    MathJax.Hub.queue.Push(() => {
		resultMatrix = MathJax.Hub.getAllJax('resultMatrix')[0];
	});
}

function numChanged() {
    rows = Number(num.value());
    cols = rows;
    
    const tableInputElem = document.getElementById('tableInput');
    while (tableInputElem.firstChild) tableInputElem.removeChild(tableInputElem.firstChild);

    const canvas = select('#defaultCanvas0');
    if(canvas) canvas.remove(); // strange!

    for(let i = 0; i < rows; i++) {
        const tableRow = createElement('tr');
        tableRow.parent(tableInput);
        for(let j = 0; j < cols; j++) {
            const elem = createElement('td');
            elem.parent(tableRow);

            const elemInput = createInput();
            elemInput.parent(elem);
            elemInput.id(toId(i, j));
        }
    }
}

let matrix;
let matArr;
let prevMat;
function calcMatrix() {
    // Get matrix
    matrix = [];
    for(let i = 0; i < rows; i++) {
        matrix[i] = [];
        for(let j = 0; j < cols; j++) {
            const elem = select('#' + toId(i, j));
            matrix[i][j] = new Frac(Number(elem.value()));
        }
    }

    // Add identity matrix at the back
    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < cols; j++) 
            matrix[i][cols + j] = new Frac(i == j);
    }

    console.table(matrix);

    matArr = [toLatex(matrix)];
    prevMat = '';
    for(let bi = 0; bi < rows; bi++) {
        // Move to first non-zero row
        let bj = bi;
        while(matrix[bi][bj].q === 0 && bi < rows - 1) bi++;
        const base = matrix[bi][bj].copy();

        if(base.q !== 0) {
            // Swap to match identity matrix
            if(bi !== bj) {
                const t = matrix[bi];
                matrix[bi] = matrix[bj];
                matrix[bj] = t;

                let cur = toLatex(matrix);
                if(cur !== prevMat) {
                    prevMat = toLatex(matrix);
                    matArr.push('\\xrightarrow{r_' + (bi + 1).toString() + ' \\leftrightarrow r_' +
                        (bj + 1).toString() + '}' + cur);
                }

                bi = bj;
            }

            // Divide so that first element is 1
            if(base.q !== base.p) {
                for(let j = 0; j < cols * 2; j++) matrix[bi][j].div(base);

                let cur = toLatex(matrix);
                if(cur !== prevMat) {
                    prevMat = toLatex(matrix);
                    matArr.push('\\xrightarrow{r_' + (bi + 1).toString() + ' \\div ' + 
                        base.toBracLatex() + '}' + cur);
                }
            }


            // Add to other rows
            let rowOperations = [];
            for(let i = 0; i < rows; i++) {
                if(i !== bi) {
                    const ratio = matrix[i][bj].copy();
                    if(ratio.q !== 0) {
                        for(let j = 0; j < cols * 2; j++) matrix[i][j].sub(Frac.mult(matrix[bi][j], ratio));

                        let s = 'r_' + (i + 1).toString() + ' - ';
                        s += ratio.toCoeffLatex().toString() + 'r_' + (bi + 1).toString(); // strange bug
                        rowOperations.push(s);
                    }
                }
            }

            let cur = toLatex(matrix);
            if(cur !== prevMat) {
                prevMat = toLatex(matrix);
                matArr.push('\\xrightarrow{\\substack{' + rowOperations.join(' \\\\') + '}}' + cur);
            }
        }
    }

    for(let i = 0; i < matArr.length; i++) if(i % 3 === 2) matArr[i] += '\\\\';
    MathJax.Hub.queue.Push(["Text", resultMatrix, matArr.join('')]);	
    console.log(matArr.join());
}

function toId(i, j) {
    return i.toString() + ' ' + j.toString();
}

function toLatex(m) {
    let latex = '\\left[\\begin{array}{';
    for(let i = 0; i < rows; i++) latex += 'c';
    latex += '|'
    for(let i = 0; i < rows; i++) latex += 'c';
    latex += '}';

    for(let i = 0; i < rows; i++) {
        for(let j = 0; j < cols * 2; j++) {
            latex += m[i][j].toLatex();

            if(j !== cols * 2 - 1) latex += '&';
        }
        if(i !== rows - 1) latex += '\\\\';
    }

    latex += '\\end{array}\\right]';

    return latex;
}