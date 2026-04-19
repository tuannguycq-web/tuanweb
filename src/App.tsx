import { useState, useEffect, useRef } from "react";

/* =============================================
   TYPES
============================================= */
type StepType = "normal" | "formula" | "highlight" | "result" | "error" | "warning";

interface Step {
  label: string;
  content: string;
  type: StepType;
}

interface Solution {
  steps: Step[];
  result: "two_roots" | "one_root" | "no_root" | "linear" | "identity" | "no_solution";
}

/* =============================================
   UTILITY FUNCTIONS
============================================= */
function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return parseFloat(n.toFixed(6)).toString();
}

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  return b === 0 ? a : gcd(b, a % b);
}

function formatFraction(numerator: number, denominator: number): string {
  if (denominator === 0) return "∞";
  const result = numerator / denominator;
  if (Number.isInteger(result)) return result.toString();
  const numR = Math.round(numerator * 1e9);
  const denR = Math.round(denominator * 1e9);
  const g = gcd(Math.abs(numR), Math.abs(denR));
  let sNum = numR / g;
  let sDen = denR / g;
  if (sDen === 1) return sNum.toString();
  if (sDen === -1) return (-sNum).toString();
  const finalNum = sDen < 0 ? -sNum : sNum;
  const finalDen = Math.abs(sDen);
  return `${finalNum}/${finalDen}`;
}

function formatCoeff(coeff: number, variable: string, isFirst = false): string {
  if (coeff === 0) return "";
  if (variable === "") return coeff > 0 ? `+${coeff}` : `${coeff}`;
  let str = "";
  if (coeff === 1) str = variable;
  else if (coeff === -1) str = `-${variable}`;
  else str = `${coeff}${variable}`;
  if (!isFirst && coeff > 0) str = `+${str}`;
  return str;
}

function formatConst(c: number): string {
  if (c === 0) return "";
  return c > 0 ? `+${c}` : `${c}`;
}

function buildEquationDisplay(a: number, b: number, c: number): string {
  let eq = "";
  if (a === 1) eq += "x²";
  else if (a === -1) eq += "-x²";
  else if (a !== 0) eq += `${a}x²`;
  if (b === 1) eq += (eq ? " + " : "") + "x";
  else if (b === -1) eq += (eq ? " - " : "-") + "x";
  else if (b > 0) eq += (eq ? " + " : "") + `${b}x`;
  else if (b < 0) eq += (eq ? " - " : "") + `${Math.abs(b)}x`;
  if (c > 0) eq += (eq ? " + " : "") + `${c}`;
  else if (c < 0) eq += (eq ? " - " : "") + `${Math.abs(c)}`;
  if (!eq) eq = "0";
  return eq + " = 0";
}

/* =============================================
   SOLVER
============================================= */
function solve(a: number, b: number, c: number): Solution {
  const steps: Step[] = [];

  steps.push({
    label: "📋 Phương trình đã cho",
    content: `${formatCoeff(a, "x²", true)} ${formatCoeff(b, "x")} ${formatConst(c)} = 0`,
    type: "formula",
  });

  if (a === 0) {
    steps.push({
      label: "⚠️ Kiểm tra hệ số",
      content: "Hệ số a = 0 → Đây KHÔNG phải phương trình bậc hai!",
      type: "warning",
    });

    if (b === 0) {
      if (c === 0) {
        steps.push({ label: "📌 Phân tích", content: "a = 0, b = 0, c = 0 → Phương trình trở thành: 0 = 0", type: "normal" });
        steps.push({ label: "✅ Kết luận", content: "Phương trình nghiệm đúng với mọi x ∈ ℝ (phương trình vô số nghiệm).", type: "result" });
        return { steps, result: "identity" };
      } else {
        steps.push({ label: "📌 Phân tích", content: `a = 0, b = 0, c = ${c} → Phương trình trở thành: ${c} = 0`, type: "normal" });
        steps.push({ label: "❌ Kết luận", content: `Phương trình vô nghiệm (mâu thuẫn: ${c} ≠ 0).`, type: "error" });
        return { steps, result: "no_solution" };
      }
    } else {
      steps.push({
        label: "📌 Phương trình bậc nhất",
        content: `a = 0 → Phương trình trở thành: ${formatCoeff(b, "x", true)} ${formatConst(c)} = 0`,
        type: "formula",
      });
      steps.push({ label: "🔢 Chuyển vế", content: `${formatCoeff(b, "x", true)} = ${-c}`, type: "normal" });
      const x = -c / b;
      steps.push({ label: "📐 Tính x", content: `x = ${-c} ÷ ${b} = ${formatFraction(-c, b)} = ${formatNumber(x)}`, type: "normal" });
      steps.push({ label: "✅ Kết luận", content: `Phương trình có nghiệm duy nhất: x = ${formatNumber(x)}`, type: "result" });
      return { steps, result: "linear" };
    }
  }

  steps.push({ label: "✅ Xác nhận bậc phương trình", content: `a = ${a} ≠ 0 → Đây là phương trình bậc hai.`, type: "normal" });
  steps.push({ label: "🔢 Xác định các hệ số", content: `a = ${a}   |   b = ${b}   |   c = ${c}`, type: "highlight" });

  const delta = b * b - 4 * a * c;
  steps.push({ label: "📐 Công thức tính Δ (Delta)", content: "Δ = b² − 4ac", type: "formula" });
  steps.push({ label: "🧮 Thay số vào Δ", content: `Δ = (${b})² − 4 × (${a}) × (${c})`, type: "normal" });
  steps.push({ label: "🧮 Tính toán từng phần", content: `Δ = ${b * b} − (${4 * a * c})`, type: "normal" });
  steps.push({ label: "🧮 Kết quả Δ", content: `Δ = ${formatNumber(delta)}`, type: "highlight" });

  if (delta < 0) {
    steps.push({ label: "🔍 Xét dấu Δ", content: `Δ = ${formatNumber(delta)} < 0`, type: "error" });
    steps.push({ label: "❌ Kết luận", content: "Vì Δ < 0, phương trình VÔ NGHIỆM trong tập số thực ℝ.", type: "error" });
    return { steps, result: "no_root" };
  }

  if (delta === 0) {
    steps.push({ label: "🔍 Xét dấu Δ", content: "Δ = 0 → Phương trình có nghiệm kép.", type: "highlight" });
    steps.push({ label: "📐 Công thức nghiệm kép", content: "x₁ = x₂ = −b / (2a)", type: "formula" });
    steps.push({ label: "🧮 Thay số", content: `x₁ = x₂ = −(${b}) / (2 × ${a}) = ${-b} / ${2 * a}`, type: "normal" });
    const x0 = -b / (2 * a);
    steps.push({ label: "✅ Nghiệm kép", content: `x₁ = x₂ = ${formatFraction(-b, 2 * a)} = ${formatNumber(x0)}`, type: "result" });
    const check = a * x0 * x0 + b * x0 + c;
    steps.push({
      label: "🔎 Kiểm tra (thế nghiệm vào PT)",
      content: `Thế x = ${formatNumber(x0)}: ${a}×(${formatNumber(x0)})² + ${b}×${formatNumber(x0)} + ${c} = ${formatNumber(check)} ✓`,
      type: "normal",
    });
    return { steps, result: "one_root" };
  }

  const sqrtDelta = Math.sqrt(delta);
  steps.push({ label: "🔍 Xét dấu Δ", content: `Δ = ${formatNumber(delta)} > 0 → Phương trình có hai nghiệm phân biệt.`, type: "highlight" });
  steps.push({ label: "📐 Tính √Δ", content: `√Δ = √${formatNumber(delta)} = ${formatNumber(sqrtDelta)}`, type: "formula" });
  steps.push({ label: "📐 Công thức nghiệm", content: "x₁ = (−b − √Δ) / (2a)     x₂ = (−b + √Δ) / (2a)", type: "formula" });

  steps.push({ label: "🧮 Tính x₁", content: `x₁ = (−(${b}) − ${formatNumber(sqrtDelta)}) / (2 × ${a})`, type: "normal" });
  steps.push({ label: "🧮 Tính x₁ (tiếp)", content: `x₁ = (${-b} − ${formatNumber(sqrtDelta)}) / ${2 * a} = ${formatNumber(-b - sqrtDelta)} / ${2 * a}`, type: "normal" });
  const x1 = (-b - sqrtDelta) / (2 * a);
  steps.push({ label: "✅ Kết quả x₁", content: `x₁ = ${formatNumber(x1)}`, type: "result" });

  steps.push({ label: "🧮 Tính x₂", content: `x₂ = (−(${b}) + ${formatNumber(sqrtDelta)}) / (2 × ${a})`, type: "normal" });
  steps.push({ label: "🧮 Tính x₂ (tiếp)", content: `x₂ = (${-b} + ${formatNumber(sqrtDelta)}) / ${2 * a} = ${formatNumber(-b + sqrtDelta)} / ${2 * a}`, type: "normal" });
  const x2 = (-b + sqrtDelta) / (2 * a);
  steps.push({ label: "✅ Kết quả x₂", content: `x₂ = ${formatNumber(x2)}`, type: "result" });

  const sum = x1 + x2;
  const product = x1 * x2;
  const expSum = -b / a;
  const expProd = c / a;
  steps.push({ label: "🔎 Kiểm tra theo định lý Viète", content: "x₁ + x₂ = −b/a     |     x₁ × x₂ = c/a", type: "formula" });
  steps.push({
    label: "🧮 Kiểm tra tổng nghiệm",
    content: `x₁ + x₂ = ${formatNumber(x1)} + ${formatNumber(x2)} = ${formatNumber(sum)}   ←→   −b/a = −(${b})/${a} = ${formatNumber(expSum)}   ✓`,
    type: "normal",
  });
  steps.push({
    label: "🧮 Kiểm tra tích nghiệm",
    content: `x₁ × x₂ = ${formatNumber(x1)} × ${formatNumber(x2)} = ${formatNumber(product)}   ←→   c/a = ${c}/${a} = ${formatNumber(expProd)}   ✓`,
    type: "normal",
  });

  return { steps, result: "two_roots" };
}

/* =============================================
   BADGE CONFIG
============================================= */
const BADGE_MAP: Record<string, { text: string; gradient: string }> = {
  two_roots:   { text: "Hai nghiệm phân biệt",    gradient: "linear-gradient(135deg,#10b981,#0d9488)" },
  one_root:    { text: "Nghiệm kép",              gradient: "linear-gradient(135deg,#3b82f6,#6366f1)" },
  no_root:     { text: "Vô nghiệm (Δ < 0)",       gradient: "linear-gradient(135deg,#ef4444,#e11d48)" },
  linear:      { text: "Phương trình bậc nhất",   gradient: "linear-gradient(135deg,#f59e0b,#ea580c)" },
  identity:    { text: "Vô số nghiệm",            gradient: "linear-gradient(135deg,#a855f7,#7c3aed)" },
  no_solution: { text: "Vô nghiệm",               gradient: "linear-gradient(135deg,#ef4444,#e11d48)" },
};

/* =============================================
   STEP CARD STYLES
============================================= */
const stepStyles: Record<StepType, { card: string; label: string; content: string }> = {
  normal: {
    card: "background:rgba(30,41,59,0.55);border:1px solid rgba(255,255,255,0.08)",
    label: "color:#94a3b8",
    content: "color:#cbd5e1",
  },
  formula: {
    card: "background:rgba(30,27,75,0.55);border:1px solid rgba(168,85,247,0.3)",
    label: "color:#c084fc",
    content: "color:#ddd6fe",
  },
  highlight: {
    card: "background:linear-gradient(135deg,rgba(49,46,129,0.5),rgba(88,28,135,0.4));border:1px solid rgba(99,102,241,0.5)",
    label: "color:#a5b4fc",
    content: "color:#c7d2fe;font-weight:600",
  },
  result: {
    card: "background:linear-gradient(135deg,rgba(6,78,59,0.55),rgba(13,148,136,0.4));border:1px solid rgba(16,185,129,0.55);box-shadow:0 4px 20px rgba(16,185,129,0.14)",
    label: "color:#6ee7b7",
    content: "color:#a7f3d0;font-weight:700;font-size:1.08rem",
  },
  error: {
    card: "background:linear-gradient(135deg,rgba(127,29,29,0.55),rgba(159,18,57,0.4));border:1px solid rgba(239,68,68,0.5)",
    label: "color:#fca5a5",
    content: "color:#fecaca;font-weight:600",
  },
  warning: {
    card: "background:linear-gradient(135deg,rgba(120,53,15,0.55),rgba(124,45,18,0.4));border:1px solid rgba(245,158,11,0.5)",
    label: "color:#fcd34d",
    content: "color:#fde68a;font-weight:600",
  },
};

/* =============================================
   STEP CARD COMPONENT
============================================= */
function StepCard({ step, index }: { step: Step; index: number }) {
  const s = stepStyles[step.type];
  return (
    <div
      style={{
        ...Object.fromEntries(
          s.card.split(";").filter(Boolean).map((p) => {
            const [k, ...v] = p.split(":");
            return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(":").trim()];
          })
        ),
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        animation: `fadeSlide 0.35s ease ${index * 45}ms both`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 24, height: 24,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.7rem",
          fontFamily: "monospace",
          color: "#64748b",
          marginTop: 2,
        }}
      >
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, ...parseInlineStyle(s.label) }}>
          {step.label}
        </div>
        <div style={{ fontFamily: "Courier New, monospace", fontSize: "0.95rem", wordBreak: "break-word", lineHeight: 1.55, ...parseInlineStyle(s.content) }}>
          {step.content}
        </div>
      </div>
    </div>
  );
}

function parseInlineStyle(str: string): Record<string, string> {
  return Object.fromEntries(
    str.split(";").filter(Boolean).map((p) => {
      const [k, ...v] = p.split(":");
      return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.join(":").trim()];
    })
  );
}

/* =============================================
   EXAMPLE DATA
============================================= */
const EXAMPLES = [
  { a: 1,  b: -5, c: 6,   label: "x² − 5x + 6 = 0",    desc: "2 nghiệm phân biệt" },
  { a: 1,  b:  2, c: 1,   label: "x² + 2x + 1 = 0",    desc: "Nghiệm kép" },
  { a: 1,  b:  0, c: 4,   label: "x² + 4 = 0",          desc: "Vô nghiệm (Δ < 0)" },
  { a: 2,  b: -4, c: 2,   label: "2x² − 4x + 2 = 0",   desc: "Nghiệm kép" },
  { a: 0,  b:  3, c: -9,  label: "3x − 9 = 0",          desc: "Phương trình bậc nhất" },
  { a: 1,  b: -3, c: -10, label: "x² − 3x − 10 = 0",   desc: "2 nghiệm phân biệt" },
];

/* =============================================
   MAIN APP
============================================= */
export default function App() {
  const [aVal, setAVal] = useState("");
  const [bVal, setBVal] = useState("");
  const [cVal, setCVal] = useState("");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const solutionRef = useRef<HTMLDivElement>(null);

  const a = parseFloat(aVal), b = parseFloat(bVal), c = parseFloat(cVal);
  const hasPreview = aVal !== "" && bVal !== "" && cVal !== "" && !isNaN(a) && !isNaN(b) && !isNaN(c);

  function handleSolve() {
    if (aVal === "" || bVal === "" || cVal === "") {
      setErrorMsg("⚠️ Vui lòng nhập đầy đủ các hệ số a, b và c!");
      setSolution(null);
      return;
    }
    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      setErrorMsg("⚠️ Các hệ số phải là số hợp lệ!");
      setSolution(null);
      return;
    }
    setErrorMsg("");
    setSolution(solve(a, b, c));
    setTimeout(() => solutionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleReset() {
    setAVal(""); setBVal(""); setCVal("");
    setErrorMsg(""); setSolution(null);
  }

  function loadExample(ex: (typeof EXAMPLES)[0]) {
    setAVal(String(ex.a)); setBVal(String(ex.b)); setCVal(String(ex.c));
    setErrorMsg("");
    const sol = solve(ex.a, ex.b, ex.c);
    setSolution(sol);
    setTimeout(() => solutionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Enter") handleSolve(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const badge = solution ? BADGE_MAP[solution.result] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
          min-height: 100vh;
          color: #e2e8f0;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #4338ca; border-radius: 3px; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        .btn-solve:hover { filter: brightness(1.12); transform: scale(1.02); }
        .btn-solve:active { transform: scale(0.97); }
        .btn-reset:hover { background: rgba(71,85,105,0.85) !important; transform: scale(1.02); }
        .btn-reset:active { transform: scale(0.97); }
        .ex-btn:hover { background: rgba(51,65,85,0.75) !important; border-color: rgba(99,102,241,0.5) !important; transform: scale(1.02); }
        .input-a:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.22) !important; }
        .input-b:focus { border-color: #a855f7 !important; box-shadow: 0 0 0 3px rgba(168,85,247,0.22) !important; }
        .input-c:focus { border-color: #ec4899 !important; box-shadow: 0 0 0 3px rgba(236,72,153,0.22) !important; }
      `}</style>

      {/* HEADER */}
      <header style={{ position: "relative", overflow: "hidden", padding: "48px 16px 40px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(99,102,241,0.15),rgba(168,85,247,0.15),rgba(236,72,153,0.15))" }} />
        <div style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 80, height: 80, borderRadius: 20,
            background: "linear-gradient(135deg,#6366f1,#a855f7)",
            boxShadow: "0 20px 40px rgba(99,102,241,0.4)",
            fontSize: 36, marginBottom: 20,
          }}>🧮</div>
          <h1 style={{
            fontSize: "clamp(1.8rem,5vw,3rem)", fontWeight: 900, letterSpacing: "-0.03em",
            background: "linear-gradient(90deg,#a5b4fc,#c084fc,#f9a8d4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", marginBottom: 10,
          }}>Giải Phương Trình Bậc Hai</h1>
          <p style={{ fontFamily: "Courier New,monospace", fontSize: "1.2rem", color: "#94a3b8" }}>ax² + bx + c = 0</p>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: 6 }}>Hiển thị đầy đủ các bước giải chi tiết</p>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* INPUT CARD */}
        <div style={{
          background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24,
          padding: 32, boxShadow: "0 25px 50px rgba(0,0,0,0.4)", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontWeight: 600, color: "#cbd5e1" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✏️</div>
            Nhập các hệ số
          </div>

          {/* Preview */}
          {hasPreview && (
            <div style={{ textAlign: "center", marginBottom: 24, animation: "popIn 0.25s ease" }}>
              <div style={{ display: "inline-block", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 16, padding: "10px 28px" }}>
                <span style={{ fontFamily: "Courier New,monospace", fontSize: "1.3rem", fontWeight: 700, color: "#a5b4fc" }}>
                  {buildEquationDisplay(a, b, c)}
                </span>
              </div>
            </div>
          )}

          {/* Input grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { id: "a", val: aVal, set: setAVal, color: "#818cf8", badge: "ax²", cls: "input-a" },
              { id: "b", val: bVal, set: setBVal, color: "#c084fc", badge: "bx",  cls: "input-b" },
              { id: "c", val: cVal, set: setCVal, color: "#f472b6", badge: "c",   cls: "input-c" },
            ].map((inp) => (
              <div key={inp.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "#94a3b8" }}>
                  Hệ số <span style={{ color: inp.color, fontWeight: 700, fontSize: "1rem" }}>{inp.id}</span>
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    type="number"
                    value={inp.val}
                    onChange={(e) => inp.set(e.target.value)}
                    placeholder={`Nhập ${inp.id}`}
                    className={inp.cls}
                    style={{
                      width: "100%", background: "rgba(30,41,59,0.7)",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
                      padding: "14px 12px", textAlign: "center", color: "#fff",
                      fontFamily: "Courier New,monospace", fontSize: "1.1rem",
                      outline: "none", transition: "border-color 0.2s,box-shadow 0.2s",
                    }}
                  />
                  <span style={{
                    position: "absolute", top: -9, right: 10,
                    fontSize: "0.68rem", color: "#64748b",
                    background: "#0f172a", padding: "0 4px", borderRadius: 4,
                  }}>{inp.badge}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {errorMsg && (
            <div style={{
              marginBottom: 14, padding: "12px 16px",
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem", textAlign: "center",
            }}>{errorMsg}</div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn-solve"
              onClick={handleSolve}
              style={{
                flex: 1, background: "linear-gradient(135deg,#6366f1,#a855f7)",
                color: "#fff", fontWeight: 700, fontSize: "1.05rem",
                border: "none", borderRadius: 14, padding: "16px 24px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "transform 0.15s,box-shadow 0.15s,filter 0.15s",
                boxShadow: "0 8px 24px rgba(99,102,241,0.32)",
              }}
            >⚡ Giải Phương Trình</button>
            <button
              className="btn-reset"
              onClick={handleReset}
              style={{
                background: "rgba(51,65,85,0.7)", color: "#cbd5e1",
                fontWeight: 600, fontSize: "1rem",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
                padding: "16px 20px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                transition: "background 0.15s,transform 0.15s",
              }}
            >🔄 Làm lại</button>
          </div>
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#475569", marginTop: 10 }}>
            Nhấn <strong>Enter</strong> để giải nhanh
          </p>
        </div>

        {/* SOLUTION */}
        <div ref={solutionRef}>
          {solution && (
            <div>
              {/* Badge */}
              {badge && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <div style={{
                    display: "inline-block", fontWeight: 700, fontSize: "0.875rem",
                    padding: "8px 24px", borderRadius: 999, color: "#fff",
                    background: badge.gradient, boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                    animation: "popIn 0.3s ease",
                  }}>📊 Kết quả: {badge.text}</div>
                </div>
              )}

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 14px" }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#818cf8" }}>Các bước giải</span>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)" }} />
              </div>

              {/* Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {solution.steps.map((step, i) => (
                  <StepCard key={i} step={step} index={i} />
                ))}
              </div>

              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#475569", padding: "16px 0 4px" }}>
                ✨ Giải xong — Nhập hệ số mới để giải phương trình khác
              </p>
            </div>
          )}
        </div>

        {/* EXAMPLES */}
        {!solution && (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, padding: 24,
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              💡 Ví dụ nhanh
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className="ex-btn"
                  onClick={() => loadExample(ex)}
                  style={{
                    textAlign: "left", background: "rgba(30,41,59,0.55)",
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
                    padding: 12, cursor: "pointer", transition: "background 0.15s,border-color 0.15s,transform 0.15s",
                  }}
                >
                  <div style={{ fontFamily: "Courier New,monospace", fontSize: "0.75rem", color: "#a5b4fc", marginBottom: 4 }}>{ex.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{ex.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

      </main>
    </>
  );
}
