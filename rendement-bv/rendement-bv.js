(function () {
  const $ = id => document.getElementById(id);
  const eur = v => (v < 0 ? '− ' : '') + '€ ' + Math.abs(Math.round(v)).toLocaleString('nl-NL');
  const pct = v => (Math.round(v * 100) / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 }) + '%';
  const state = { real: false, etfScen: 'mid', mkb: 'bf-3y', oblType: 'staat' };
  const ETF = { low: { r: 2, l: 'Slecht 2%' }, mid: { r: 7, l: 'Gemiddeld 7%' }, high: { r: 10, l: 'Goed 10%' } };
  const OBL = { staat: { r: 3.0, l: 'Staat 3,0%' }, bedrijf: { r: 3.5, l: 'Bedrijfs 3,5%' } };
  // Voorbeeldtarieven voor beleggers, oktober 2026
  const MKB = {
    'bf-flex': { r: 3.75, l: 'BridgeFund · flexibel · 3,75%' },
    'bf-1y': { r: 4.75, l: 'BridgeFund · 1 jaar · 4,75%' },
    'bf-3y': { r: 5.65, l: 'BridgeFund · 3 jaar · 5,65%' },
    'bf-5y': { r: 6.25, l: 'BridgeFund · 5 jaar · 6,25%' },
    'fl-6m': { r: 4.25, l: 'Floryn · 6 maanden · 4,25%' },
    'fl-1y': { r: 4.6, l: 'Floryn · 1 jaar · 4,60%' },
    'fl-3y': { r: 5.25, l: 'Floryn · 3 jaar · 5,25%' },
    'fl-5y': { r: 6.0, l: 'Floryn · 5 jaar · 6,00%' }
  };
  const opts = [
    { id: 'bank', name: 'Laten staan bij de huisbank', c: '--s-bank', rate: 1.25, risk: 'Zeer laag', liq: 'Direct opneembaar', dgs: 'Ja, tot € 100.000' },
    { id: 'spaar', name: 'Online spaarbank / deposito', c: '--s-spaar', rate: 3.0, risk: 'Laag', liq: 'Direct, of vast bij deposito', dgs: 'Ja, tot € 100.000 per bank' },
    { id: 'obl', name: 'Obligatieladder', c: '--s-obl', rate: 3.0, cost: 0.1, risk: 'Laag (staat) tot laag-middel', liq: 'Verkoopbaar, koers schommelt', dgs: 'Nee, wel gescheiden bewaring' },
    { id: 'mkb', name: 'MKB-leningen (platform)', c: '--s-mkb', rate: 5.65, loss: 0, risk: 'Middel (kredietrisico)', liq: 'Vast voor de looptijd', dgs: 'Nee' },
    { id: 'etf', name: 'Wereldwijde ETF (accumulerend)', c: '--s-etf', rate: 7, cost: 0.2, risk: 'Hoog op korte termijn', liq: 'Dagelijks verkoopbaar', dgs: 'Nee, wel gescheiden bewaring' },
    { id: 'vg', name: 'Beleggingswoning', c: '--s-vg', yield: 3.7, growth: 3, buy: 10, sell: 1.5, risk: 'Middel, geconcentreerd', liq: 'Maanden om te verkopen', dgs: 'Nee' }
  ];
  const O = id => opts.find(o => o.id === id);

  function inputs() {
    return {
      P: Math.max(0, +$('amt').value || 0),
      Y: Math.min(25, Math.max(1, Math.round(+$('yrs').value || 10))),
      tax: (+$('vpb').value) / 100,
      inf: (+$('infl').value || 0) / 100
    };
  }

  function series(o, I) {
    const out = [];
    if (o.id === 'etf') {
      const r = (o.rate - o.cost) / 100;
      for (let t = 0; t <= I.Y; t++) {
        const v = I.P * Math.pow(1 + r, t);
        const gain = Math.max(0, v - I.P);
        out.push({ net: v - gain * I.tax, tax: gain * I.tax });
      }
    } else if (o.id === 'vg') {
      const V0 = I.P / (1 + o.buy / 100);
      const cashR = O('spaar').rate / 100 * (1 - I.tax);
      let cash = 0;
      for (let t = 0; t <= I.Y; t++) {
        const V = V0 * Math.pow(1 + o.growth / 100, t);
        if (t > 0) {
          const rent = V0 * Math.pow(1 + o.growth / 100, t - 1) * o.yield / 100;
          cash = cash * (1 + cashR) + rent * (1 - I.tax);
        }
        const proceeds = V * (1 - o.sell / 100);
        const tax = (proceeds - I.P) * I.tax;
        out.push({ net: proceeds - tax + cash, tax });
      }
    } else {
      let bal = I.P;
      for (let t = 0; t <= I.Y; t++) {
        if (t > 0) {
          const r = (o.rate - (o.loss || 0) - (o.cost || 0)) / 100;
          bal = bal * (1 + r * (1 - I.tax));
        }
        out.push({ net: bal });
      }
    }
    return out.map((p, t) => ({ ...p, disp: state.real ? p.net / Math.pow(1 + I.inf, t) : p.net }));
  }

  const netYield = (o, I) => {
    const s = series(o, I);
    const end = s[s.length - 1].net;
    return end > 0 && I.P > 0 ? (Math.pow(end / I.P, 1 / I.Y) - 1) * 100 : 0;
  };
  const rateRow = (id, label, val, step) => `<div class="rate"><label for="${id}">${label}</label><input id="${id}" type="number" step="${step}" value="${val}"></div>`;

  function renderOpts(I) {
    $('yrsLbl').textContent = I.Y;
    $('opts').innerHTML = opts.map(o => {
      const s = series(o, I), end = s[s.length - 1], gain = end.net - I.P;
      let ctl = '', extra = '';
      if (o.id === 'etf') {
        ctl = `<span class="seg" role="group" aria-label="ETF-scenario">${Object.entries(ETF).map(([k, v]) => `<button type="button" data-etf="${k}" aria-pressed="${state.etfScen === k}">${v.l}</button>`).join('')}</span>`;
        extra = `<dt>Vpb bij verkoop</dt><dd>${eur(end.tax)}</dd>`;
      } else if (o.id === 'obl') {
        ctl = `<span class="seg" role="group" aria-label="Soort obligaties">${Object.entries(OBL).map(([k, v]) => `<button type="button" data-obl="${k}" aria-pressed="${state.oblType === k}">${v.l}</button>`).join('')}</span>` + rateRow('r-obl', 'Rente (% per jaar)', o.rate, 0.05);
        extra = `<dt>Netto rente jaar 1</dt><dd>${eur(I.P * (o.rate - o.cost) / 100 * (1 - I.tax))}</dd>`;
      } else if (o.id === 'mkb') {
        ctl = `<label for="mkbSel">Voorbeeldtarief<select id="mkbSel">${Object.entries(MKB).map(([k, v]) => `<option value="${k}" ${state.mkb === k ? 'selected' : ''}>${v.l}</option>`).join('')}</select></label>` + rateRow('loss', 'Verwacht verlies (% per jaar)', o.loss, 0.25);
        extra = `<dt>Netto rente jaar 1</dt><dd>${eur(I.P * (o.rate - o.loss) / 100 * (1 - I.tax))}</dd><dt>Minimale inleg</dt><dd>€ 100.000</dd>`;
      } else if (o.id === 'vg') {
        ctl = rateRow('vg-y', 'Netto huurrendement (%)', o.yield, 0.1) + rateRow('vg-g', 'Waardestijging (% per jaar)', o.growth, 0.25);
        extra = `<dt>Aankoopkosten</dt><dd>${eur(I.P - I.P / (1 + o.buy / 100))}</dd><dt>Netto huur jaar 1</dt><dd>${eur(I.P / (1 + o.buy / 100) * o.yield / 100 * (1 - I.tax))}</dd>`;
      } else {
        ctl = rateRow('r-' + o.id, 'Rente (% per jaar)', o.rate, 0.05);
        extra = `<dt>Netto rente jaar 1</dt><dd>${eur(I.P * o.rate / 100 * (1 - I.tax))}</dd>`;
      }
      return `<article class="opt" style="--c:var(${o.c})">
        <h3>${o.name}</h3>
        ${ctl}
        <div><div class="big">${eur(end.disp)}</div><div class="sub">${state.real ? 'in koopkracht van nu' : 'netto na Vpb'}${o.id === 'etf' || o.id === 'vg' ? ', bij verkoop' : ''}</div></div>
        <dl class="kv">
          <dt>Netto opbrengst</dt><dd>${eur(gain)}</dd>
          <dt>Netto rendement per jaar</dt><dd>${pct(netYield(o, I))}</dd>
          ${extra}
          <dt>Risico</dt><dd>${o.risk}</dd>
          <dt>Beschikbaar</dt><dd>${o.liq}</dd>
          <dt>Depositogarantie</dt><dd>${o.dgs}</dd>
        </dl>
      </article>`;
    }).join('');
    document.querySelectorAll('[data-etf]').forEach(b => b.onclick = () => { state.etfScen = b.dataset.etf; O('etf').rate = ETF[state.etfScen].r; render(); });
    document.querySelectorAll('[data-obl]').forEach(b => b.onclick = () => { state.oblType = b.dataset.obl; O('obl').rate = OBL[state.oblType].r; render(); });
    const bind = (id, fn) => { const el = $(id); if (el) el.onchange = () => { fn(+el.value || 0); render(); }; };
    const ms = $('mkbSel');
    if (ms) ms.onchange = () => { state.mkb = ms.value; O('mkb').rate = MKB[ms.value].r; render(); };
    bind('loss', v => O('mkb').loss = Math.max(0, v));
    bind('r-bank', v => O('bank').rate = v);
    bind('r-spaar', v => O('spaar').rate = v);
    bind('r-obl', v => O('obl').rate = v);
    bind('vg-y', v => O('vg').yield = v);
    bind('vg-g', v => O('vg').growth = v);
  }

  function niceStep(r) {
    const p = Math.pow(10, Math.floor(Math.log10(r)));
    const n = r / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function renderChart(I) {
    const W = 900, H = 360, L = 86, R = 20, T = 16, B = 36;
    const all = opts.map(o => series(o, I).map(p => p.disp));
    const flat = all.flat();
    let lo = Math.min(...flat), hi = Math.max(...flat);
    const step = niceStep((hi - lo) / 5 || 1);
    lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
    if (hi === lo) hi = lo + step;
    const x = t => L + (W - L - R) * t / I.Y, y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    let g = '';
    for (let v = lo; v <= hi + 1e-6; v += step) {
      g += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(23,36,75,0.12)" stroke-width="1"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${eur(v)}</text>`;
    }
    const xs = I.Y <= 12 ? 1 : Math.ceil(I.Y / 10);
    for (let t = 0; t <= I.Y; t += xs) g += `<text x="${x(t)}" y="${H - 12}" text-anchor="middle">${t === 0 ? 'start' : 'jr ' + t}</text>`;
    opts.forEach((o, i) => {
      const pts = all[i].map((v, t) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      g += `<polyline points="${pts}" fill="none" stroke="var(${o.c})" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${x(I.Y)}" cy="${y(all[i][all[i].length - 1])}" r="4" fill="var(${o.c})"/>`;
    });
    $('chart').innerHTML = g;
    $('legend').innerHTML = opts.map(o => `<span style="--c:var(${o.c})">${o.name}</span>`).join('');
  }

  function renderTable(I) {
    const S = opts.map(o => series(o, I));
    let h = `<thead><tr><th>Jaar</th>${opts.map(o => `<th><i style="--c:var(${o.c})"></i>${o.name.split(' (')[0]}</th>`).join('')}</tr></thead><tbody>`;
    for (let t = 0; t <= I.Y; t++) h += `<tr><td>${t === 0 ? 'Start' : t}</td>${S.map(s => `<td>${eur(s[t].disp)}</td>`).join('')}</tr>`;
    $('tbl').innerHTML = h + '</tbody>';
  }

  const buckets = [
    { id: 'a1', name: 'Huisbank: werkkapitaal', meta: 'Bank A · vrij opneembaar', bank: true, rateOf: 'bank', amt: 25000 },
    { id: 'a2', name: 'Online spaarbank: vrij opneembaar', meta: 'Bank B · buffer', bank: true, rateOf: 'spaar', amt: 50000 },
    { id: 'a3', name: 'Depositoladder 1–3 jaar', meta: 'Bank C · vervalt gespreid', bank: true, rateOf: 'spaar', amt: 25000 },
    { id: 'a4', name: 'Obligatieladder 2–7 jaar', meta: 'Broker · gescheiden bewaring', rateOf: 'obl', amt: 50000 },
    { id: 'a5', name: 'MKB-leningen', meta: 'Platform · geen depositogarantie', rateOf: 'mkb', amt: 0 },
    { id: 'a6', name: 'Wereldwijde ETF', meta: 'Broker · gescheiden bewaring', rateOf: 'etf', amt: 100000 },
    { id: 'a7', name: 'Beleggingswoning', meta: 'Hoge aankoopkosten · weinig liquide', rateOf: 'vg', amt: 0 }
  ];

  function renderAlloc(I) {
    const host = $('alloc');
    if (!host.dataset.built) {
      host.innerHTML = buckets.map(b => `<div class="arow"><div><div class="name">${b.name}</div><div class="meta">${b.meta}</div></div>
        <input id="${b.id}" type="number" step="5000" min="0" value="${b.amt}" aria-label="Bedrag ${b.name}">
        <div class="status" id="st-${b.id}"></div></div>`).join('');
      buckets.forEach(b => $(b.id).onchange = () => { b.amt = Math.max(0, +$(b.id).value || 0); render(); });
      host.dataset.built = '1';
    }
    const total = buckets.reduce((s, b) => s + b.amt, 0);
    let end = 0;
    buckets.forEach(b => {
      const o = O(b.rateOf), share = total ? b.amt / total : 0;
      const s = series(o, { ...I, P: b.amt });
      end += s[s.length - 1].net;
      let st = `<span class="num">${pct(share * 100)}</span>`;
      if (o.id === 'vg') st += ` · ${pct(o.yield)} huur + ${pct(o.growth)} groei`;
      else st += ` · ${pct(o.id === 'etf' ? o.rate - o.cost : o.rate - (o.loss || 0) - (o.cost || 0))} bruto`;
      if (b.bank) st += b.amt > 100000 ? ` <span class="chip warn">€ ${Math.round((b.amt - 100000) / 1000)}k boven de garantiegrens</span>` : ` <span class="chip ok">Volledig gedekt</span>`;
      if (b.rateOf === 'mkb' && share > 0.25) st += ` <span class="chip warn">Meer dan 25% in één categorie</span>`;
      if (b.rateOf === 'mkb' && b.amt > 0 && b.amt < 100000) st += ` <span class="chip">Platforms vragen vaak min. € 100.000</span>`;
      if (b.rateOf === 'vg' && b.amt > 0 && b.amt < 150000) st += ` <span class="chip warn">Zonder hypotheek weinig voor een woning</span>`;
      $('st-' + b.id).innerHTML = st;
    });
    const covered = buckets.filter(b => b.bank).reduce((s, b) => s + Math.min(b.amt, 100000), 0);
    const blended = total && end > 0 ? (Math.pow(end / total, 1 / I.Y) - 1) * 100 : 0;
    const diff = total !== I.P ? `<div class="tot"><div class="label">Verschil met bedrag bovenaan</div><div class="v">${eur(total - I.P)}</div></div>` : '';
    $('totals').innerHTML = `
      <div class="tot"><div class="label">Totaal verdeeld</div><div class="v">${eur(total)}</div></div>
      <div class="tot"><div class="label">Onder depositogarantie</div><div class="v">${eur(covered)}</div></div>
      <div class="tot"><div class="label">Netto rendement per jaar</div><div class="v">${pct(blended)}</div></div>
      <div class="tot"><div class="label">Na ${I.Y} jaar (netto)</div><div class="v">${eur(state.real ? end / Math.pow(1 + I.inf, I.Y) : end)}</div></div>${diff}`;
  }

  function render() { const I = inputs(); renderOpts(I); renderChart(I); renderTable(I); renderAlloc(I); }

  ['amt', 'yrs', 'vpb', 'infl'].forEach(id => $(id).addEventListener('change', render));
  $('v-nom').onclick = () => { state.real = false; $('v-nom').setAttribute('aria-pressed', 'true'); $('v-real').setAttribute('aria-pressed', 'false'); render(); };
  $('v-real').onclick = () => { state.real = true; $('v-real').setAttribute('aria-pressed', 'true'); $('v-nom').setAttribute('aria-pressed', 'false'); render(); };
  render();
})();
