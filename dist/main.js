// ── 常數資料 ───────────────────────────────────────────────
const STD_5STAR = ['維里奈', '安可', '卡卡羅', '凌陽', '鑒心'];
const STD_4STAR = ['秧秧', '熾霞', '白芷', '丹瑾', '散華', '桃祈', '莫特斐', '秋水', '淵武', '燈燈', '釉瑚', '卜靈'];
const CHAINS_OPTS = [
  { value: '-1', label: '未擁有' },
  ...[0,1,2,3,4,5,6].map(c => ({ value: String(c), label: `${c} 鏈` }))
];

// ── 建立 UI ────────────────────────────────────────────────
function buildChainsSelect(id) {
  const sel = document.createElement('select');
  sel.id = id;
  CHAINS_OPTS.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  });
  return sel;
}

// 5 星常駐
const std5Grid = document.getElementById('std5-grid');
STD_5STAR.forEach((name, i) => {
  const card = document.createElement('div');
  card.className = 'char-card';
  const nameEl = document.createElement('div');
  nameEl.className = 'char-name';
  nameEl.textContent = name;
  card.appendChild(nameEl);
  card.appendChild(buildChainsSelect(`std5-${i}`));
  std5Grid.appendChild(card);
});

// 4 星 UP 選擇
const up4Selected = new Set();
const up4Grid = document.getElementById('up4-grid');
const up4CountEl = document.getElementById('up4-count');

STD_4STAR.forEach((name, i) => {
  const item = document.createElement('div');
  item.className = 'up4-item';
  item.textContent = name;
  item.dataset.idx = i;
  item.addEventListener('click', () => {
    if (item.classList.contains('up4-disabled')) return;
    if (up4Selected.has(i)) {
      up4Selected.delete(i);
      item.classList.remove('up4-selected');
    } else if (up4Selected.size < 3) {
      up4Selected.add(i);
      item.classList.add('up4-selected');
    }
    up4CountEl.textContent = up4Selected.size;
    up4Grid.querySelectorAll('.up4-item').forEach(el => {
      const idx = parseInt(el.dataset.idx);
      if (!up4Selected.has(idx) && up4Selected.size >= 3) {
        el.classList.add('up4-disabled');
      } else {
        el.classList.remove('up4-disabled');
      }
    });
    document.getElementById('up4-error').textContent = '';
    saveSettings();
  });
  up4Grid.appendChild(item);
});

// 4 星常駐
const std4Grid = document.getElementById('std4-grid');
STD_4STAR.forEach((name, i) => {
  const card = document.createElement('div');
  card.className = 'char-card';
  const nameEl = document.createElement('div');
  nameEl.className = 'char-name';
  nameEl.textContent = name;
  card.appendChild(nameEl);
  card.appendChild(buildChainsSelect(`std4-${i}`));
  std4Grid.appendChild(card);
});

// ── 多目標角色設定 ────────────────────────────────────────
let upTargets = [{ currentChains: -1, targetChains: 0 }];

function buildTargetChainsOpts(sel, currentChains, savedTarget) {
  sel.innerHTML = '';
  for (let c = Math.max(0, currentChains + 1); c <= 6; c++) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = `${c} 鏈`;
    sel.appendChild(opt);
  }
  if (savedTarget !== undefined && savedTarget > currentChains) {
    sel.value = savedTarget;
  }
}

function renderUpTargets() {
  const container = document.getElementById('up-targets-list');
  container.innerHTML = '';
  upTargets.forEach((t, i) => {
    const row = document.createElement('div');
    row.className = 'up-target-row';

    const label = document.createElement('span');
    label.className = 'up-target-label';
    label.textContent = `UP${i + 1}`;

    const curSel = document.createElement('select');
    curSel.className = 'up-target-select';
    [[-1,'未擁有'],[0,'0鏈'],[1,'1鏈'],[2,'2鏈'],[3,'3鏈'],[4,'4鏈'],[5,'5鏈']].forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      if (v === t.currentChains) o.selected = true;
      curSel.appendChild(o);
    });

    const arrow = document.createElement('span');
    arrow.className = 'up-target-arrow';
    arrow.textContent = '→ 目標';

    const tgtSel = document.createElement('select');
    tgtSel.className = 'up-target-select';
    buildTargetChainsOpts(tgtSel, t.currentChains, t.targetChains);

    upTargets[i].targetChains = parseInt(tgtSel.value);

    curSel.addEventListener('change', () => {
      upTargets[i].currentChains = parseInt(curSel.value);
      buildTargetChainsOpts(tgtSel, upTargets[i].currentChains, upTargets[i].targetChains);
      upTargets[i].targetChains = parseInt(tgtSel.value);
      saveSettings();
    });
    tgtSel.addEventListener('change', () => {
      upTargets[i].targetChains = parseInt(tgtSel.value);
      saveSettings();
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-target-btn';
    removeBtn.textContent = '✕ 移除';
    removeBtn.style.visibility = upTargets.length <= 1 ? 'hidden' : 'visible';
    removeBtn.addEventListener('click', () => {
      upTargets.splice(i, 1);
      renderUpTargets();
      saveSettings();
    });

    row.appendChild(label);
    row.appendChild(curSel);
    row.appendChild(arrow);
    row.appendChild(tgtSel);
    row.appendChild(removeBtn);
    container.appendChild(row);
  });

  // 只剩一個時隱藏移除按鈕
  const btns = container.querySelectorAll('.remove-target-btn');
  btns.forEach(b => { b.style.visibility = upTargets.length <= 1 ? 'hidden' : 'visible'; });
}

document.getElementById('add-target-btn').addEventListener('click', () => {
  upTargets.push({ currentChains: -1, targetChains: 0 });
  renderUpTargets();
  saveSettings();
});

renderUpTargets();

// ── 批次設定常駐角色鏈數 ──────────────────────────────────
function buildBulkSelect(id) {
  const sel = document.getElementById(id);
  CHAINS_OPTS.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    sel.appendChild(opt);
  });
}
buildBulkSelect('bulk5-chains');
buildBulkSelect('bulk4-chains');

document.getElementById('bulk5-btn').addEventListener('click', () => {
  const val = document.getElementById('bulk5-chains').value;
  STD_5STAR.forEach((_, i) => { document.getElementById(`std5-${i}`).value = val; });
});
document.getElementById('bulk4-btn').addEventListener('click', () => {
  const val = document.getElementById('bulk4-chains').value;
  STD_4STAR.forEach((_, i) => { document.getElementById(`std4-${i}`).value = val; });
});

// ── 模擬引擎 ──────────────────────────────────────────────
function coralFor5Star(copies, cyberpunk) {
  return cyberpunk ? (copies < 7 ? 12 : 30) : (copies < 7 ? 15 : 40);
}
function coralFor4StarChar(copies, cyberpunk) {
  return cyberpunk ? (copies < 7 ? 2 : 5) : (copies < 7 ? 3 : 8);
}

function simulate(p) {
  let pity5 = p.pity5;
  let pity4 = p.pity4;
  let g5up  = p.guaranteed5UP;
  let g4up  = p.guaranteed4UP;

  let corals            = p.initialCorals;
  let coralForEchoes    = 0;
  let coralForPulls     = 0;
  let totalCoralsEarned = 0;
  let totalPulls        = 0;
  const pullsPerTarget  = [];

  const std5      = [...p.std5Copies];
  const std4      = [...p.std4Copies];
  const up4Idx    = p.up4StarIndices;
  const nonUp4Idx = STD_4STAR.map((_, i) => i).filter(i => !up4Idx.includes(i));

  const autoEcho   = p.autoUseEchoes;
  const autoPull   = p.autoUsePulls;
  const echoFirst  = p.coralPriority === 'echo';
  const cyberpunk  = p.cyberpunkMode;

  function getRate5(p5) {
    if (p5 <= 64) return 0.008;
    if (p5 <= 69) return 0.008 + (p5 - 64) * 0.04;
    if (p5 <= 74) return 0.008 + 5 * 0.04 + (p5 - 69) * 0.08;
    if (p5 <= 77) return 0.008 + 5 * 0.04 + 5 * 0.08 + (p5 - 74) * 0.10;
    return 1.0;
  }

  // 逐一處理每個目標，共享 pity/corals/std 狀態
  for (const target of p.targets) {
    let upCopies   = target.startingUPCopies;
    let shopEchoes = 0;
    const targetChains = target.targetChains;
    let pullsThisTarget = 0;

    function isDone() {
      return upCopies >= 1 && (upCopies - 1 + shopEchoes) >= targetChains;
    }

    function pull() {
      const r1 = Math.random();
      let rarity;
      const rate5  = getRate5(pity5);
      const delta  = rate5 - 0.008;
      const rate4  = Math.max(0, 0.06 - delta / 2);
      if (pity4 >= 9) {
        rarity = r1 < rate5 ? 5 : 4;
      } else {
        if      (r1 < rate5)          rarity = 5;
        else if (r1 < rate5 + rate4)  rarity = 4;
        else                          rarity = 3;
      }

      if      (rarity === 5) { pity5 = 0; pity4 = 0; }
      else if (rarity === 4) { pity5++;   pity4 = 0; }
      else                   { pity5++;   pity4++;   }

      if (rarity === 5) {
        let isUP;
        if (g5up) { isUP = true; g5up = false; }
        else       { isUP = Math.random() < 0.5; if (!isUP) g5up = true; }

        if (isUP) {
          const gained = coralFor5Star(upCopies, cyberpunk);
          corals += gained; totalCoralsEarned += gained;
          upCopies++;
        } else {
          const ci = Math.floor(Math.random() * 5);
          const bonus = cyberpunk ? 25 : 30;
          const gained = coralFor5Star(std5[ci], cyberpunk) + bonus;
          corals += gained; totalCoralsEarned += gained;
          std5[ci]++;
        }
      } else if (rarity === 4) {
        let isUP4;
        if (g4up) { isUP4 = true; g4up = false; }
        else       { isUP4 = Math.random() < 0.5; if (!isUP4) g4up = true; }

        const weaponCoral = cyberpunk ? 2 : 3;
        if (isUP4) {
          const ci = up4Idx[Math.floor(Math.random() * up4Idx.length)];
          const gained = coralFor4StarChar(std4[ci], cyberpunk);
          corals += gained; totalCoralsEarned += gained;
          std4[ci]++;
        } else {
          const roll = Math.floor(Math.random() * 29);
          if (roll < 9) {
            const ci = nonUp4Idx[roll];
            const gained = coralFor4StarChar(std4[ci], cyberpunk);
            corals += gained; totalCoralsEarned += gained;
            std4[ci]++;
          } else {
            corals += weaponCoral; totalCoralsEarned += weaponCoral;
          }
        }
      }
    }

    function buyEchoes() {
      if (!autoEcho || upCopies < 1 || shopEchoes >= 2) return;
      while (corals >= 360 && shopEchoes < 2) {
        corals -= 360; coralForEchoes += 360; shopEchoes++;
      }
    }

    function buyOnePull() {
      if (!autoPull || corals < 8 || isDone()) return false;
      corals -= 8; coralForPulls += 8;
      pull();
      return true;
    }

    function applyActions() {
      let changed = true;
      while (changed && !isDone()) {
        changed = false;
        if (echoFirst) {
          buyEchoes();
          if (isDone()) break;
          if (buyOnePull()) { pullsThisTarget++; changed = true; }
        } else {
          if (buyOnePull()) { pullsThisTarget++; changed = true; }
          buyEchoes();
        }
      }
    }

    applyActions();

    const MAX = 30000;
    while (!isDone() && pullsThisTarget < MAX) {
      pull();
      pullsThisTarget++;
      applyActions();
    }

    pullsPerTarget.push(pullsThisTarget);
    totalPulls += pullsThisTarget;
  }

  return { pulls: totalPulls, coralForEchoes, coralForPulls, totalCoralsEarned, pullsPerTarget };
}

function runSim(params, iters = 100000) {
  let sumPulls = 0, sumEchoes = 0, sumPullCoral = 0, sumEarned = 0;
  const arr = new Int32Array(iters);
  const sumPerTarget = new Array(params.targets.length).fill(0);

  for (let i = 0; i < iters; i++) {
    const r = simulate(params);
    sumPulls     += r.pulls;
    sumEchoes    += r.coralForEchoes;
    sumPullCoral += r.coralForPulls;
    sumEarned    += r.totalCoralsEarned;
    arr[i]        = r.pulls;
    r.pullsPerTarget.forEach((p, ti) => { sumPerTarget[ti] += p; });
  }

  arr.sort();
  const pcts = {};
  for (let p = 10; p <= 90; p += 10) {
    pcts[`p${p}`] = arr[Math.floor(iters * p / 100)];
  }
  return {
    avg:             sumPulls     / iters,
    avgEchoCorals:   sumEchoes    / iters,
    avgPullCorals:   sumPullCoral / iters,
    avgEarnedCorals: sumEarned    / iters,
    avgPerTarget:    sumPerTarget.map(s => s / iters),
    ...pcts,
  };
}

// ── 設定持久化 ────────────────────────────────────────────
const STORAGE_KEY = 'wuwa_gacha_settings';

function saveSettings() {
  const data = {
    std5: STD_5STAR.map((_, i) => document.getElementById(`std5-${i}`).value),
    std4: STD_4STAR.map((_, i) => document.getElementById(`std4-${i}`).value),
    up4Selected: [...up4Selected],
    upTargets: upTargets.map(t => ({ currentChains: t.currentChains, targetChains: t.targetChains })),
    pity5: document.getElementById('pity5').value,
    pity4: document.getElementById('pity4').value,
    guaranteed5up: document.getElementById('guaranteed5up').checked,
    guaranteed4up: document.getElementById('guaranteed4up').checked,
    initialCorals: document.getElementById('initial-corals').value,
    initialAstrites: document.getElementById('initial-astrites').value,
    initialLustrousTides: document.getElementById('initial-lustrous-tides').value,
    moneyRate: document.getElementById('money-rate').value,
    autoEcho: document.getElementById('auto-echo').checked,
    autoPulls: document.getElementById('auto-pulls').checked,
    coralPriority: document.querySelector('input[name="coral-priority"]:checked')?.value ?? 'echo',
    cyberpunkMode: document.getElementById('cyberpunk-mode').checked,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadSettings() {
  let data;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return; }
  if (!data) return;

  if (data.std5) data.std5.forEach((v, i) => { const el = document.getElementById(`std5-${i}`); if (el) el.value = v; });
  if (data.std4) data.std4.forEach((v, i) => { const el = document.getElementById(`std4-${i}`); if (el) el.value = v; });

  if (data.up4Selected) {
    up4Selected.clear();
    data.up4Selected.forEach(i => up4Selected.add(i));
    up4Grid.querySelectorAll('.up4-item').forEach(el => {
      const idx = parseInt(el.dataset.idx);
      el.classList.toggle('up4-selected', up4Selected.has(idx));
      el.classList.toggle('up4-disabled', !up4Selected.has(idx) && up4Selected.size >= 3);
    });
    up4CountEl.textContent = up4Selected.size;
  }

  if (data.upTargets && data.upTargets.length > 0) {
    upTargets = data.upTargets;
    renderUpTargets();
  }

  if (data.pity5 !== undefined) document.getElementById('pity5').value = data.pity5;
  if (data.pity4 !== undefined) document.getElementById('pity4').value = data.pity4;
  if (data.guaranteed5up !== undefined) document.getElementById('guaranteed5up').checked = data.guaranteed5up;
  if (data.guaranteed4up !== undefined) document.getElementById('guaranteed4up').checked = data.guaranteed4up;
  if (data.initialCorals !== undefined) document.getElementById('initial-corals').value = data.initialCorals;
  if (data.initialAstrites !== undefined) document.getElementById('initial-astrites').value = data.initialAstrites;
  if (data.initialLustrousTides !== undefined) document.getElementById('initial-lustrous-tides').value = data.initialLustrousTides;
  if (data.moneyRate !== undefined) document.getElementById('money-rate').value = data.moneyRate;
  if (data.autoEcho !== undefined) document.getElementById('auto-echo').checked = data.autoEcho;
  if (data.autoPulls !== undefined) document.getElementById('auto-pulls').checked = data.autoPulls;
  if (data.coralPriority) {
    const el = document.querySelector(`input[name="coral-priority"][value="${data.coralPriority}"]`);
    if (el) el.checked = true;
  }
  if (data.cyberpunkMode !== undefined) {
    document.getElementById('cyberpunk-mode').checked = data.cyberpunkMode;
  }
}

// 在所有相關輸入加上自動儲存
document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('change', saveSettings);
});

// ── 優先順序顯示控制 ──────────────────────────────────────
const autoEchoEl  = document.getElementById('auto-echo');
const autoPullEl  = document.getElementById('auto-pulls');
const priorityGrp = document.getElementById('priority-group');

function updatePriorityGroup() {
  const both = autoEchoEl.checked && autoPullEl.checked;
  priorityGrp.classList.toggle('disabled', !both);
}
autoEchoEl.addEventListener('change', updatePriorityGroup);
autoPullEl.addEventListener('change', updatePriorityGroup);

// ── 計算按鈕 ──────────────────────────────────────────────
document.getElementById('calculate-btn').addEventListener('click', () => {
  let valid = true;
  document.getElementById('up4-error').textContent    = '';
  document.getElementById('target-error').textContent = '';

  if (up4Selected.size !== 3) {
    document.getElementById('up4-error').textContent = '請選擇恰好 3 名本期 4 星 UP 角色。';
    valid = false;
  }

  for (let i = 0; i < upTargets.length; i++) {
    const t = upTargets[i];
    if (isNaN(t.targetChains) || t.targetChains <= t.currentChains) {
      document.getElementById('target-error').textContent = `UP${i + 1} 的目標鏈數必須高於當前鏈數。`;
      valid = false;
      break;
    }
  }

  if (!valid) return;

  const pity5        = Math.min(78, Math.max(0, parseInt(document.getElementById('pity5').value)    || 0));
  const pity4        = Math.min( 9, Math.max(0, parseInt(document.getElementById('pity4').value)    || 0));
  const initCor      = Math.max(0, parseInt(document.getElementById('initial-corals').value)         || 0);
  const initAstrites = Math.max(0, parseInt(document.getElementById('initial-astrites').value)       || 0);
  const initLustrous = Math.max(0, parseInt(document.getElementById('initial-lustrous-tides').value) || 0);
  const moneyRate    = Math.max(0.01, parseFloat(document.getElementById('money-rate').value)        || 1.97);

  const std5Copies = STD_5STAR.map((_, i) => {
    const v = parseInt(document.getElementById(`std5-${i}`).value);
    return v + 1;
  });
  const std4Copies = STD_4STAR.map((_, i) => {
    const v = parseInt(document.getElementById(`std4-${i}`).value);
    return v + 1;
  });

  const cyberpunkMode = document.getElementById('cyberpunk-mode').checked;
  const params = {
    pity5,
    pity4,
    guaranteed5UP:  document.getElementById('guaranteed5up').checked,
    guaranteed4UP:  document.getElementById('guaranteed4up').checked,
    targets:        upTargets.map(t => ({
      startingUPCopies: t.currentChains + 1,
      targetChains:     t.targetChains,
    })),
    initialCorals:  initCor,
    autoUseEchoes:  autoEchoEl.checked,
    autoUsePulls:   autoPullEl.checked,
    coralPriority:  document.querySelector('input[name="coral-priority"]:checked')?.value ?? 'echo',
    std5Copies,
    std4Copies,
    up4StarIndices: [...up4Selected],
    cyberpunkMode,
  };

  const btn = document.getElementById('calculate-btn');
  btn.textContent = '計算中…';
  btn.disabled = true;
  document.getElementById('results').style.display = 'none';

  setTimeout(() => {
    const res = runSim(params, 100000);

    const avgEchoTimes = Math.round(res.avgEchoCorals / 360);
    const avgPullBuys  = Math.round(res.avgPullCorals  /   8);
    const totalUsedAvg = Math.round(res.avgEchoCorals + res.avgPullCorals);
    const multiTarget  = upTargets.length > 1;

    document.getElementById('results-content').innerHTML = `
      <div class="result-hero">
        <div class="big">${Math.round(res.avg)}</div>
        <div class="unit">預期總抽數${multiTarget ? `（${upTargets.length} 個目標合計，含珊瑚兌換所得的抽數）` : '（含珊瑚兌換所得的抽數）'}</div>
      </div>
      ${multiTarget ? `
      <h3>各目標預期抽數</h3>
      <div class="coral-table">
        ${res.avgPerTarget.map((avg, i) => `
        <div class="coral-row">
          <span class="coral-lbl">UP${i + 1}（${upTargets[i].currentChains === -1 ? '未擁有' : upTargets[i].currentChains + '鏈'} → ${upTargets[i].targetChains} 鏈）</span>
          <span class="coral-val">${Math.round(avg)} 抽</span>
        </div>`).join('')}
      </div>` : ''}
      <div class="pct-table">
        ${[10,20,30,40,50,60,70,80,90].map(p => `
        <div class="pct-row${p === 50 ? ' pct-mid' : ''}">
          <span class="pct-pct">${p}%</span>
          <div class="pct-bar-wrap"><div class="pct-bar" style="width:${p}%"></div></div>
          <span class="pct-pulls">${res[`p${p}`]} 抽</span>
        </div>`).join('')}
      </div>
      <h3>餘波珊瑚統計（期望值）</h3>
      <div class="coral-table">
        <div class="coral-row">
          <span class="coral-lbl">初始持有</span>
          <span class="coral-val">${initCor} 個</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">抽卡過程獲取</span>
          <span class="coral-val">${Math.round(res.avgEarnedCorals)} 個</span>
        </div>
        <div class="coral-row"">
          <span class="coral-lbl">兌換 5 星 UP 回音頻段</span>
          <span class="coral-val">${Math.round(res.avgEchoCorals)} 個（約 ${avgEchoTimes} 次）</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">兌換浮金波紋</span>
          <span class="coral-val">${Math.round(res.avgPullCorals)} 個（約 ${avgPullBuys} 抽）</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">總共使用珊瑚</span>
          <span class="coral-val">${totalUsedAvg} 個</span>
        </div>
        <div class="coral-row total">
          <span class="coral-lbl">剩餘珊瑚</span>
          <span class="coral-val total-val">${initCor + Math.round(res.avgEarnedCorals) - totalUsedAvg} 個</span>
        </div>
      </div>
      ${(() => {
        const avgPulls = Math.round(res.avg);
        const needAfterLustrous = Math.max(0, avgPulls - initLustrous);
        const astriteNeeded = needAfterLustrous * 160;
        const remainAstrites = Math.max(0, astriteNeeded - initAstrites);
        return `
      <h3>抽卡資源統計</h3>
      <div class="coral-table">
        <div class="coral-row">
          <span class="coral-lbl">初始持有浮金波紋</span>
          <span class="coral-val">${initLustrous} 抽</span>
        </div>
        <div class="coral-row total">
          <span class="coral-lbl">扣除初始浮金波紋後預計還需</span>
          <span class="coral-val total-val">${needAfterLustrous} 抽（需 ${astriteNeeded.toLocaleString()} 星聲）</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">初始持有星聲</span>
          <span class="coral-val">${initAstrites.toLocaleString()} 個</span>
        </div>
        <div class="coral-row total">
          <span class="coral-lbl">扣除初始星聲後預計還需</span>
          <span class="coral-val total-val">${remainAstrites.toLocaleString()} 星聲</span>
        </div>
        ${remainAstrites > 0 ? `
        <div class="coral-row total">
          <span class="coral-lbl">換算真錢約需（依設定匯率 1:${moneyRate.toFixed(2)}）</span>
          <span class="coral-val total-val">${Math.ceil(remainAstrites / moneyRate).toLocaleString()} 元</span>
        </div>` : ''}
      </div>`;
      })()}
    `;

    document.getElementById('results').style.display = 'block';
    btn.textContent = '重新計算';
    btn.disabled = false;
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 30);
});

// ── 載入已儲存的設定 ──────────────────────────────────────
loadSettings();
updatePriorityGroup();
