const exprEl = document.getElementById("expr");
const resEl  = document.getElementById("res");
const keys   = document.querySelector(".keys");

let expr = "0";
let justEq = false;     // last key was '='
let lastAns = 0;

function render(){
  exprEl.textContent = expr || "0";
  try{
    const v = evaluate(expr);
    resEl.textContent = (v !== null && Number.isFinite(v)) ? fmt(v) : "";
  }catch{
    resEl.textContent = "";
  }
}

function fmt(n){
  const v = Number(n);
  return Math.abs(v) < 1e-12 ? "0"
    : String(+v.toPrecision(12)).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
}

function insertToken(t){
  // After '=', digits/.( start new expr; operators continue from last result
  if (justEq && /[0-9.(√]/.test(t)) expr = "";
  if (justEq && /[+\-×÷^]/.test(t)) expr = String(lastAns);
  justEq = false;

  if (expr === "0" && /[0-9.(]/.test(t)) expr = "";
  expr += t;
  render();
}

function clearAll(){ expr="0"; justEq=false; lastAns=0; render(); }
function backspace(){ if(justEq) justEq=false; expr = expr.slice(0,-1) || "0"; render(); }

/* +/- : toggle sign of last number */
function negate(){
  const m = /(-?\d*\.?\d+)(?!.*\d)/.exec(expr);
  if (!m) return;
  const num = m[1];
  const start = expr.slice(0, -num.length);
  expr = start + (num.startsWith("-") ? num.slice(1) : "-" + num);
  render();
}

/* % : simple B -> (B/100). Want A+B% semantics? I can swap it. */
function percent(){
  const m = /([0-9.]+)(?!.*[0-9.])/.exec(expr);
  if (!m) return;
  const last = m[1];
  expr = expr.slice(0, -last.length) + `(${last}/100)`;
  render();
}

/* 1/x, x^2, √x — use last answer after '=' or wrap current expr */
function invx(){
  if (justEq){ expr = `1/(${lastAns})`; justEq=false; }
  else { expr = `1/(${expr})`; }
  render();
}
function square(){
  if (justEq){ expr = `(${lastAns})^2`; justEq=false; }
  else { expr = /[0-9)]$/.test(expr) ? expr + "^2" : `(${expr})^2`; }
  render();
}
function sqrtAct(){
  if (justEq){ expr = `√(${lastAns})`; justEq=false; }
  else { expr += "√("; }
  render();
}

/* Smart "()" — inserts '(' or ')' depending on balance/context */
function brackets(){
  const opens = (expr.match(/\(/g) || []).length;
  const closes = (expr.match(/\)/g) || []).length;
  const last = expr.slice(-1);
  const shouldClose = opens > closes && /[0-9.)]/.test(last);
  insertToken(shouldClose ? ")" : "(");
}

function equals(){
  try{
    const v = evaluate(expr);
    if (v !== null && isFinite(v)){
      lastAns = v;
      resEl.textContent = fmt(v); // keep expression visible
      justEq = true;
    }
  }catch{
    resEl.textContent = "Error";
  }
}

/* Core evaluator: supports × ÷ −, √, ^ */
function evaluate(s){
  if (!s) return null;

  let js = s
    .replace(/×/g,"*")
    .replace(/÷/g,"/")
    .replace(/−/g,"-")
    .replace(/√/g,"Math.sqrt")
    .replace(/\^/g,"**");

  // safety: only numbers/ops/parentheses/Math allowed
  if (!/^[0-9+\-*/.()%\s^A-Za-z_.]*$/.test(js)) throw new Error("bad");
  const f = new Function("Math", `return (${js});`);
  return f(Math);
}

/* events */
keys.addEventListener("click",(e)=>{
  const b = e.target.closest("button");
  if (!b) return;
  const ins = b.dataset.insert;
  const act = b.dataset.action;

  if (ins){ insertToken(ins); return; }

  switch(act){
    case "clear":   clearAll(); break;   // AC
    case "back":    backspace(); break;
    case "negate":  negate(); break;
    case "percent": percent(); break;
    case "invx":    invx(); break;
    case "square":  square(); break;
    case "sqrt":    sqrtAct(); break;
    case "brackets":brackets(); break;
    case "equals":  equals(); break;
  }
});

/* keyboard (optional) */
window.addEventListener("keydown",(e)=>{
  const k = e.key;
  if(/[0-9]/.test(k)) insertToken(k);
  else if(k === ".") insertToken(".");
  else if(k === "+") insertToken("+");
  else if(k === "-") insertToken("−");
  else if(k === "*") insertToken("×");
  else if(k === "/") insertToken("÷");
  else if(k === "(" || k === ")") insertToken(k);
  else if(k === "%") percent();
  else if(k === "Backspace") backspace();
  else if(k === "Enter" || k === "=") equals();
});

render();
