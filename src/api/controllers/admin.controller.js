const adminService = require('../../services/admin.service');

function evaluateExpression(formula) {
    if (typeof formula === 'number' && Number.isFinite(formula)) {
        return formula;
    }
    if (typeof formula !== 'string') {
        throw new Error('Invalid formula');
    }
    if (!/^[0-9+\-*/%().\s]+$/.test(formula)) {
        throw new Error('Invalid characters in formula');
    }

    const tokens = [];
    let i = 0;
    while (i < formula.length) {
        const ch = formula[i];
        if (/\s/.test(ch)) {
            i++;
            continue;
        }
        if (/[0-9.]/.test(ch)) {
            let numStr = '';
            let dotCount = 0;
            while (i < formula.length && /[0-9.]/.test(formula[i])) {
                if (formula[i] === '.') dotCount++;
                numStr += formula[i];
                i++;
            }
            if (dotCount > 1 || numStr === '.') throw new Error('Invalid number');
            const num = Number(numStr);
            if (isNaN(num)) throw new Error('Invalid number');
            tokens.push(num);
            continue;
        }
        if (ch === '*' && formula[i + 1] === '*') {
            tokens.push('**');
            i += 2;
            continue;
        }
        if ('+-*/%()'.includes(ch)) {
            tokens.push(ch);
            i++;
            continue;
        }
        throw new Error('Invalid token');
    }

    let pos = 0;
    function peek() {
        return tokens[pos];
    }
    function consume(expected) {
        if (expected && tokens[pos] !== expected) {
            throw new Error(`Expected ${expected}`);
        }
        return tokens[pos++];
    }

    function parseExpression() {
        let val = parseTerm();
        while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
            const op = consume();
            const right = parseTerm();
            if (op === '+') val += right;
            else val -= right;
        }
        return val;
    }

    function parseTerm() {
        let val = parsePower();
        while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/' || tokens[pos] === '%')) {
            const op = consume();
            const right = parsePower();
            if (op === '*') val *= right;
            else if (op === '/') {
                if (right === 0) throw new Error('Division by zero');
                val /= right;
            } else if (op === '%') {
                if (right === 0) throw new Error('Modulo by zero');
                val %= right;
            }
        }
        return val;
    }

    function parsePower() {
        let val = parseFactor();
        if (pos < tokens.length && tokens[pos] === '**') {
            consume();
            const right = parsePower();
            val = Math.pow(val, right);
        }
        return val;
    }

    function parseFactor() {
        const token = peek();
        if (token === '+') {
            consume('+');
            return parseFactor();
        }
        if (token === '-') {
            consume('-');
            return -parseFactor();
        }
        if (token === '(') {
            consume('(');
            const val = parseExpression();
            consume(')');
            return val;
        }
        if (typeof token === 'number') {
            return consume();
        }
        throw new Error('Unexpected token');
    }

    if (tokens.length === 0) throw new Error('Empty formula');
    const result = parseExpression();
    if (pos < tokens.length) {
        throw new Error('Unexpected extra input');
    }
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid calculation result');
    }
    return result;
}

exports.checkShippingStatus = (req, res) => {
    adminService.pingProvider(req.body.providerIP, req.body.options, out => res.send(out));
};

exports.previewDynamicPricing = (req, res) => {
    try {
        res.json({ price: evaluateExpression(req.body.formula) });
    } catch (e) {
        res.status(400).send("Evaluation Failed");
    }
};
