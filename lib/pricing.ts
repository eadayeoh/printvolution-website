/**
 * Safe evaluator for legacy `price_formula` strings.
 *
 * Legacy formulas look like: `qty*(24-Math.min(10,qty-1))` or `qty*(50+qty*0.5)`.
 * We parse them into an AST and evaluate only against whitelisted variables
 * and Math helpers — no `eval()` or `new Function()`.
 *
 * Grammar:
 *   expr      := term (('+' | '-') term)*
 *   term      := factor (('*' | '/') factor)*
 *   factor    := unary | '(' expr ')' | call | number | variable
 *   unary     := ('-' | '+') factor
 *   call      := 'Math.min' '(' args ')' | 'Math.max' '(' args ')'
 *   args      := expr (',' expr)*
 *   number    := digits ('.' digits)?
 *   variable  := 'qty' | 'base'
 */

type Token =
  | { type: 'num'; value: number }
  | { type: 'var'; name: string }
  | { type: 'call'; fn: 'min' | 'max' | 'ceil' | 'floor' | 'round' }
  | { type: 'op'; value: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'comma' };

// Variables allowed inside a price_formula. `qty` and `base` are the
// legacy core; `width`, `height`, `length`, `depth`, `diameter`,
// `eyelets`, `pages` let dimensional / count-based pricing reference
// the values of `number`-type configurator steps. If a future product
// needs a new variable, add its slug here and ensure the product-page
// evaluator passes it in the ctx.
const VARS = new Set([
  'qty',
  'base',
  'width',
  'height',
  'length',
  'depth',
  'diameter',
  'radius',
  'eyelets',
  'pages',
  'area',
  'sides',
]);

function tokenize(src: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n') { i++; continue; }
    if (c === '(') { out.push({ type: 'lparen' }); i++; continue; }
    if (c === ')') { out.push({ type: 'rparen' }); i++; continue; }
    if (c === ',') { out.push({ type: 'comma' }); i++; continue; }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      out.push({ type: 'op', value: c }); i++; continue;
    }
    if (/[0-9]/.test(c) || c === '.') {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const num = parseFloat(src.slice(i, j));
      if (isNaN(num)) throw new Error(`Bad number at ${i}`);
      out.push({ type: 'num', value: num });
      i = j; continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z0-9_.]/.test(src[j])) j++;
      const ident = src.slice(i, j);
      if (ident === 'Math.min' || ident === 'min') {
        out.push({ type: 'call', fn: 'min' });
      } else if (ident === 'Math.max' || ident === 'max') {
        out.push({ type: 'call', fn: 'max' });
      } else if (ident === 'Math.ceil' || ident === 'ceil') {
        out.push({ type: 'call', fn: 'ceil' });
      } else if (ident === 'Math.floor' || ident === 'floor') {
        out.push({ type: 'call', fn: 'floor' });
      } else if (ident === 'Math.round' || ident === 'round') {
        out.push({ type: 'call', fn: 'round' });
      } else if (VARS.has(ident)) {
        out.push({ type: 'var', name: ident });
      } else {
        throw new Error(`Unknown identifier: ${ident}`);
      }
      i = j; continue;
    }
    throw new Error(`Unexpected char '${c}' at ${i}`);
  }
  return out;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private consume(): Token | undefined { return this.tokens[this.pos++]; }

  parse(): (ctx: Record<string, number>) => number {
    const expr = this.parseExpr();
    if (this.pos !== this.tokens.length) throw new Error('Trailing tokens');
    return expr;
  }

  private parseExpr(): (ctx: Record<string, number>) => number {
    let left = this.parseTerm();
    while (true) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '+' || t.value === '-')) {
        this.consume();
        const right = this.parseTerm();
        const op = t.value;
        const prev = left;
        left = (ctx) => (op === '+' ? prev(ctx) + right(ctx) : prev(ctx) - right(ctx));
      } else break;
    }
    return left;
  }

  private parseTerm(): (ctx: Record<string, number>) => number {
    let left = this.parseFactor();
    while (true) {
      const t = this.peek();
      if (t?.type === 'op' && (t.value === '*' || t.value === '/')) {
        this.consume();
        const right = this.parseFactor();
        const op = t.value;
        const prev = left;
        left = (ctx) => (op === '*' ? prev(ctx) * right(ctx) : prev(ctx) / right(ctx));
      } else break;
    }
    return left;
  }

  private parseFactor(): (ctx: Record<string, number>) => number {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end');

    if (t.type === 'op' && (t.value === '+' || t.value === '-')) {
      this.consume();
      const rhs = this.parseFactor();
      return t.value === '-' ? (ctx) => -rhs(ctx) : rhs;
    }
    if (t.type === 'lparen') {
      this.consume();
      const inner = this.parseExpr();
      const close = this.consume();
      if (close?.type !== 'rparen') throw new Error('Expected )');
      return inner;
    }
    if (t.type === 'num') {
      this.consume();
      const v = t.value;
      return () => v;
    }
    if (t.type === 'var') {
      this.consume();
      const name = t.name;
      return (ctx) => ctx[name] ?? 0;
    }
    if (t.type === 'call') {
      this.consume();
      const lp = this.consume();
      if (lp?.type !== 'lparen') throw new Error('Expected (');
      const args: Array<(ctx: Record<string, number>) => number> = [];
      args.push(this.parseExpr());
      while (this.peek()?.type === 'comma') {
        this.consume();
        args.push(this.parseExpr());
      }
      const rp = this.consume();
      if (rp?.type !== 'rparen') throw new Error('Expected )');
      const fn = t.fn;
      return (ctx) => {
        const vals = args.map((a) => a(ctx));
        if (fn === 'min') return Math.min(...vals);
        if (fn === 'max') return Math.max(...vals);
        if (fn === 'ceil')  return Math.ceil(vals[0]);
        if (fn === 'floor') return Math.floor(vals[0]);
        if (fn === 'round') return Math.round(vals[0]);
        return vals[0];
      };
    }
    throw new Error(`Unexpected token at ${this.pos}`);
  }
}

/**
 * Compile a formula string to a function. Throws on invalid input.
 *
 * @example
 *   const f = compile('qty*(24-Math.min(10,qty-1))');
 *   f({ qty: 5 })  // 95
 */
export function compile(formula: string): (ctx: Record<string, number>) => number {
  const tokens = tokenize(formula);
  const parser = new Parser(tokens);
  return parser.parse();
}

/** Evaluate with automatic fallback. Returns 0 for any error. */
export function evaluateFormula(formula: string | null | undefined, ctx: Record<string, number>): number {
  if (!formula) return 0;
  try {
    return compile(formula)(ctx);
  } catch {
    return 0;
  }
}
