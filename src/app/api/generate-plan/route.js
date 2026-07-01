import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/* ── Repara aspas duplas a meio de valores de texto no JSON ───────────────── */
function repairJsonQuotes(s) {
  let out = "";
  let inStr = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const prev = s[i - 1];
    if (ch === '"' && prev !== "\\") {
      if (!inStr) {
        inStr = true;
        out += ch;
        continue;
      }
      let j = i + 1;
      while (j < s.length && (s[j] === " " || s[j] === "\n" || s[j] === "\r" || s[j] === "\t")) j++;
      const next = s[j];
      if (next === ":" || next === "," || next === "}" || next === "]" || next === undefined) {
        inStr = false;
        out += ch;
        continue;
      } else {
        out += '\\"';
        continue;
      }
    }
    out += ch;
  }
  return out;
}

export async function POST(request) {
  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      system:
        "Responde EXCLUSIVAMENTE com JSON válido e completo. Zero texto extra, zero markdown, zero backticks. JSON 100% bem formado. REGRA CRÍTICA: nunca uses aspas duplas (\") dentro dos valores de texto — se precisares de citar algo, usa aspas simples (') ou parênteses. As aspas duplas só podem delimitar as chaves e os valores do JSON.",
      messages: [{ role: "user", content: prompt }],
    });

    let raw = message.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    let clean = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    if (!clean.endsWith("}")) {
      clean = clean.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, "");
      const op = (clean.match(/\[/g) || []).length - (clean.match(/\]/g) || []).length;
      const ob = (clean.match(/\{/g) || []).length - (clean.match(/\}/g) || []).length;
      for (let i = 0; i < op; i++) clean += "]";
      for (let i = 0; i < ob; i++) clean += "}";
    }

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      parsed = JSON.parse(repairJsonQuotes(clean));
    }

    return Response.json({ result: parsed });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 502 });
  }
}
