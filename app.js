const exprEl = document.getElementById("expr");
const resEl  = document.getElementById("res");
const keys   = document.querySelector(".keys");

let expr = "0";
let justEq = false;     // pressed '=' last
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

function put(token){
  // After '=', numbers start a new calc; operators continue from last answer
  if (justEq && /[0-9.(]/.test(token)) expr = "";
  if (justEq && /[+\-×÷^]/.test(token)) expr = String(lastAns);
  justEq = false;

  if (expr === "0" && /[0-9.(]/.test(token)) expr = "";
  expr += token;
  render();
}

function clearAll(){ expr="0"; justEq=false; lastAns=0; render(); }
function back(){ if(justEq) justEq=false; expr = expr.slice(0,-1) || "0"; render(); }

/* % on last number: 50+10% => 50+(10/100) */
function percent(){
  const m = /([0-9.]+)(?!.*[0-9.])/.exec(expr);
  if (!m) return;
  const last = m[1];
  expr = expr.slice(0,-last.length) + `(${last}/100)`;
  render();
}

function equals(){
  try{
    const v = evaluate(expr);
    if (v !== null && isFinite(v)){
      lastAns = v;
      resEl.textContent = fmt(v);  // keep expression visible
      justEq = true;
    }
  }catch{
    resEl.textContent = "Error";
  }
}

/* Evaluator (maps pretty symbols to JS; supports parentheses & % handled above) */
function evaluate(s){
  if(!s) return null;

  // pretty -> JS
  let js = s
    .replace(/×/g,"*")
    .replace(/÷/g,"/")
    .replace(/−/g,"-")
    .replace(/\^/g,"**");

  // allow only safe chars
  if(!/^[0-9+\-*/.()%\s^]*$/.test(js)) throw new Error("bad");

  const f = new Function(`return (${js});`);
  return f();
}

/* Events */
keys.addEventListener("click",(e)=>{
  const b = e.target.closest("button");
  if(!b) return;
  const ins = b.dataset.insert;
  const act = b.dataset.action;

  if (ins){ put(ins); return; }
  if (act === "clear"){ clearAll(); return; }
  if (act === "back"){ back(); return; }
  if (act === "percent"){ percent(); return; }
  if (act === "equals"){ equals(); return; }
});

/* Optional: keyboard support */
window.addEventListener("keydown",(e)=>{
  const k = e.key;
  if(/[0-9]/.test(k)) put(k);
  else if(k === ".") put(".");
  else if(k === "+") put("+");
  else if(k === "-") put("−");
  else if(k === "*") put("×");
  else if(k === "/") put("÷");
  else if(k === "(" || k === ")") put(k);
  else if(k === "%") percent();
  else if(k === "Backspace") back();
  else if(k === "Enter" || k === "=") equals();
});

render();
