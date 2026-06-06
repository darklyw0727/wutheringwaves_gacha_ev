// ── 常數資料 ───────────────────────────────────────────────
const STD_5STAR = ['維里奈', '安可', '卡卡羅', '凌陽', '鑒心'];

const CYBERPUNK_MILESTONES = [
  { at: 20,  pulls: 2 },
  { at: 40,  pulls: 3 },
  { at: 80,  pulls: 5 },
  { at: 120, pulls: 5 },
  { at: 160, echo: 1  },
  { at: 200, pulls: 5 },
  { at: 280, pulls: 5 },
  { at: 360, pulls: 5 },
  { at: 420, echo: 1  },
];
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

// ── 多目標設定（角色／武器）──────────────────────────────
// type: 'character' 以「鏈」計；'weapon' 以「精煉 +N」計
// 角色最高 6 鏈，武器最高 +5 精煉
let upTargets = [{ type: 'character', currentChains: -1, targetChains: 0 }];

function maxLevelFor(type)  { return type === 'weapon' ? 5 : 6; }
function levelLabel(type, n) {
  if (n < 0) return '未擁有';
  return type === 'weapon' ? `+${n}` : `${n} 鏈`;
}

function buildCurrentOpts(sel, type, currentChains) {
  sel.innerHTML = '';
  // 當前持有：未擁有 ~ (最高等級-1)
  for (let c = -1; c < maxLevelFor(type); c++) {
    const o = document.createElement('option');
    o.value = c; o.textContent = levelLabel(type, c);
    if (c === currentChains) o.selected = true;
    sel.appendChild(o);
  }
}

function buildTargetChainsOpts(sel, type, currentChains, savedTarget) {
  sel.innerHTML = '';
  for (let c = Math.max(0, currentChains + 1); c <= maxLevelFor(type); c++) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = levelLabel(type, c);
    sel.appendChild(opt);
  }
  if (savedTarget !== undefined && savedTarget > currentChains && savedTarget <= maxLevelFor(type)) {
    sel.value = savedTarget;
  }
}

function renderUpTargets() {
  const container = document.getElementById('up-targets-list');
  container.innerHTML = '';
  upTargets.forEach((t, i) => {
    if (!t.type) t.type = 'character';
    const row = document.createElement('div');
    row.className = 'up-target-row';

    const label = document.createElement('span');
    label.className = 'up-target-label';
    label.textContent = `UP${i + 1}`;

    const typeSel = document.createElement('select');
    typeSel.className = 'up-target-select';
    [['character','角色'],['weapon','武器']].forEach(([v, l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      if (v === t.type) o.selected = true;
      typeSel.appendChild(o);
    });

    const curSel = document.createElement('select');
    curSel.className = 'up-target-select';
    buildCurrentOpts(curSel, t.type, t.currentChains);

    const arrow = document.createElement('span');
    arrow.className = 'up-target-arrow';
    arrow.textContent = '→ 目標';

    const tgtSel = document.createElement('select');
    tgtSel.className = 'up-target-select';
    buildTargetChainsOpts(tgtSel, t.type, t.currentChains, t.targetChains);

    upTargets[i].targetChains = parseInt(tgtSel.value);

    typeSel.addEventListener('change', () => {
      upTargets[i].type = typeSel.value;
      // 切換類型時，將超出新上限的等級夾回範圍
      const maxL = maxLevelFor(upTargets[i].type);
      if (upTargets[i].currentChains >= maxL) upTargets[i].currentChains = maxL - 1;
      buildCurrentOpts(curSel, upTargets[i].type, upTargets[i].currentChains);
      buildTargetChainsOpts(tgtSel, upTargets[i].type, upTargets[i].currentChains, upTargets[i].targetChains);
      upTargets[i].targetChains = parseInt(tgtSel.value);
      saveSettings();
    });

    curSel.addEventListener('change', () => {
      upTargets[i].currentChains = parseInt(curSel.value);
      buildTargetChainsOpts(tgtSel, upTargets[i].type, upTargets[i].currentChains, upTargets[i].targetChains);
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
    row.appendChild(typeSel);
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
  upTargets.push({ type: 'character', currentChains: -1, targetChains: 0 });
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
  // 角色池保底
  let pity5 = p.pity5;
  let pity4 = p.pity4;
  let g5up  = p.guaranteed5UP;
  let g4up  = p.guaranteed4UP;
  // 武器池保底（與角色池獨立）
  let wPity5 = p.wPity5;
  let wPity4 = p.wPity4;
  let wg4up  = p.wGuaranteed4UP;

  let corals            = p.initialCorals;
  let coralForEchoes    = 0;
  let echoCount         = 0;
  let totalCoralsEarned = 0;
  let totalPulls        = 0;
  let charPulls         = 0;  // 角色池（消耗浮金波紋）
  let weaponPulls       = 0;  // 武器池（消耗鑄潮波紋）
  const pullsPerTarget  = [];

  const std5      = [...p.std5Copies];
  const std4      = [...p.std4Copies];
  const up4Idx    = p.up4StarIndices;
  const nonUp4Idx = STD_4STAR.map((_, i) => i).filter(i => !up4Idx.includes(i));

  const autoEcho   = p.autoUseEchoes;
  const cyberpunk  = p.cyberpunkMode;
  const includeBonusRewards = p.cyberpunkMode && p.includeBonusRewards;

  // 聯動額外抽取獎勵追蹤（角色池與武器池共享同一里程碑計數）
  let milestoneTotalPulls    = 0;
  let milestoneIdx           = 0;
  let pendingMilestoneEchoes = 0;  // 待套用的回音頻段（僅角色 UP 可用）
  let pendingBonusPulls      = 0;  // 待使用的捕夢波紋（僅角色池可用）
  let bonusBannerPulls       = 0;
  let totalMilestoneEchoesUsed = 0;

  function getRate5(p5) {
    if (p5 <= 64) return 0.008;
    if (p5 <= 69) return 0.008 + (p5 - 64) * 0.04;
    if (p5 <= 74) return 0.008 + 5 * 0.04 + (p5 - 69) * 0.08;
    if (p5 <= 77) return 0.008 + 5 * 0.04 + 5 * 0.08 + (p5 - 74) * 0.10;
    return 1.0;
  }

  // 將已達成的里程碑獎勵收進待用池（不立即抽取）。
  // 角色池與武器池的抽數都會累進 milestoneTotalPulls，故兩者共用此函式。
  function bankMilestones() {
    if (!includeBonusRewards) return;
    while (milestoneIdx < CYBERPUNK_MILESTONES.length && milestoneTotalPulls >= CYBERPUNK_MILESTONES[milestoneIdx].at) {
      const m = CYBERPUNK_MILESTONES[milestoneIdx++];
      if (m.pulls) pendingBonusPulls += m.pulls;
      if (m.echo)  pendingMilestoneEchoes++;
    }
  }

  // ── 武器池抽取 ──────────────────────────────────────────
  // 5 星武器 100% 為 UP；達到目標精煉（拷貝數 = 目標 +N + 1）即完成。
  function simulateWeaponTarget(target) {
    let upCopies = target.startingUPCopies;
    const targetRefine = target.targetChains;
    let pullsThisTarget = 0;

    function isDone() {
      return upCopies - 1 >= targetRefine;  // upCopies-1 即目前精煉階級
    }

    function pull() {
      milestoneTotalPulls++;  // 武器抽數同樣累進聯動里程碑
      const r1 = Math.random();
      let rarity;
      const rate5 = getRate5(wPity5);
      const delta = rate5 - 0.008;
      const rate4 = Math.max(0, 0.06 - delta / 2);
      if (wPity4 >= 9) {
        rarity = r1 < rate5 ? 5 : 4;
      } else {
        if      (r1 < rate5)         rarity = 5;
        else if (r1 < rate5 + rate4) rarity = 4;
        else                         rarity = 3;
      }

      if      (rarity === 5) { wPity5 = 0; wPity4 = 0; }
      else if (rarity === 4) { wPity5++;   wPity4 = 0; }
      else                   { wPity5++;   wPity4++;   }

      const weaponCoral = cyberpunk ? 2 : 3;  // 連動為幻夢珊瑚
      if (rarity === 5) {
        // 100% UP 武器
        const w5 = cyberpunk ? 12 : 15;
        corals += w5; totalCoralsEarned += w5;
        upCopies++;
      } else if (rarity === 4) {
        let isUP4;
        if (wg4up) { isUP4 = true; wg4up = false; }
        else        { isUP4 = Math.random() < 0.5; if (!isUP4) wg4up = true; }

        if (isUP4) {
          // 4 星 UP 武器
          corals += weaponCoral; totalCoralsEarned += weaponCoral;
        } else {
          // 非 UP：12 名常駐 4 星角色 + 20 把 4 星武器，共 32 項均等
          const roll = Math.floor(Math.random() * 32);
          if (roll < 12) {
            const gained = coralFor4StarChar(std4[roll], cyberpunk);
            corals += gained; totalCoralsEarned += gained;
            std4[roll]++;
          } else {
            corals += weaponCoral; totalCoralsEarned += weaponCoral;
          }
        }
      }
    }

    const MAX = 30000;
    while (!isDone() && pullsThisTarget < MAX) {
      pull();
      pullsThisTarget++;
      bankMilestones();  // 武器抽數觸發的里程碑收進待用池（捕夢波紋／回音頻段僅角色池可用）
    }
    return pullsThisTarget;
  }

  // 逐一處理每個目標，共享 pity/corals/std 狀態
  for (const target of p.targets) {
    if (target.type === 'weapon') {
      const wp = simulateWeaponTarget(target);
      pullsPerTarget.push(wp);
      totalPulls   += wp;
      weaponPulls  += wp;
      continue;
    }
    let upCopies       = target.startingUPCopies;
    let milestoneEchoes = 0;  // 里程碑獎勵回音頻段（免費）
    let shopEchoes      = 0;  // 珊瑚兌換回音頻段
    const targetChains = target.targetChains;
    let pullsThisTarget = 0;

    function isDone() {
      return upCopies >= 1 && (upCopies - 1 + milestoneEchoes + shopEchoes) >= targetChains;
    }

    function pull() {
      milestoneTotalPulls++;
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

    // 處理聯動額外抽取獎勵里程碑：先把達成的里程碑收進待用池，
    // 再以累積的捕夢波紋進行免費抽取（含武器池抽數所觸發的里程碑）。
    function processMilestones() {
      if (!includeBonusRewards) return;
      bankMilestones();
      while (pendingBonusPulls > 0 && !isDone()) {
        pull(); // pull() 會遞增 milestoneTotalPulls
        pullsThisTarget++;
        bonusBannerPulls++;
        pendingBonusPulls--;
        bankMilestones(); // 免費抽取本身也可能觸發新里程碑
      }
    }

    // 將待用的里程碑回音頻段套用到當前目標（優先於珊瑚兌換）
    function applyMilestoneEchoes() {
      while (pendingMilestoneEchoes > 0 && upCopies >= 1 && (milestoneEchoes + shopEchoes) < 2) {
        milestoneEchoes++;
        pendingMilestoneEchoes--;
        totalMilestoneEchoesUsed++;
      }
    }

    function buyEchoes() {
      // 里程碑回音頻段優先，不需消耗珊瑚，無論 autoEcho 是否開啟都套用
      if (includeBonusRewards) applyMilestoneEchoes();
      if (!autoEcho || upCopies < 1 || (milestoneEchoes + shopEchoes) >= 2) return;
      while (corals >= 360 && (milestoneEchoes + shopEchoes) < 2) {
        corals -= 360; coralForEchoes += 360; shopEchoes++; echoCount++;
      }
    }

    function applyActions() {
      if (isDone()) return;
      buyEchoes();
    }

    applyActions();

    const MAX = 30000;
    while (!isDone() && pullsThisTarget < MAX) {
      pull();
      pullsThisTarget++;
      processMilestones();
      applyActions();
    }

    pullsPerTarget.push(pullsThisTarget);
    totalPulls += pullsThisTarget;
    charPulls  += pullsThisTarget;
  }

  return { pulls: totalPulls, charPulls, weaponPulls, coralForEchoes, echoCount, totalCoralsEarned, pullsPerTarget, bonusBannerPulls, milestoneEchoesUsed: totalMilestoneEchoesUsed };
}

function runSim(params, iters = 100000) {
  let sumPulls = 0, sumCharPulls = 0, sumWeaponPulls = 0, sumEchoes = 0, sumEchoCount = 0, sumEarned = 0, sumBonusPulls = 0, sumMilestoneEchoes = 0;
  const arr = new Int32Array(iters);
  const sumPerTarget = new Array(params.targets.length).fill(0);

  for (let i = 0; i < iters; i++) {
    const r = simulate(params);
    sumPulls      += r.pulls;
    sumCharPulls   += r.charPulls;
    sumWeaponPulls += r.weaponPulls;
    sumEchoes     += r.coralForEchoes;
    sumEchoCount  += r.echoCount;
    sumEarned     += r.totalCoralsEarned;
    sumBonusPulls     += r.bonusBannerPulls;
    sumMilestoneEchoes += r.milestoneEchoesUsed;
    arr[i]         = r.pulls;
    r.pullsPerTarget.forEach((p, ti) => { sumPerTarget[ti] += p; });
  }

  arr.sort();
  const pcts = {};
  for (let p = 10; p <= 90; p += 10) {
    pcts[`p${p}`] = arr[Math.floor(iters * p / 100)];
  }
  return {
    avg:             sumPulls      / iters,
    avgCharPulls:    sumCharPulls   / iters,
    avgWeaponPulls:  sumWeaponPulls / iters,
    avgEchoCorals:   sumEchoes     / iters,
    avgEchoCount:    sumEchoCount  / iters,
    avgEarnedCorals: sumEarned    / iters,
    avgBonusPulls:        sumBonusPulls     / iters,
    avgMilestoneEchoes:   sumMilestoneEchoes / iters,
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
    upTargets: upTargets.map(t => ({ type: t.type || 'character', currentChains: t.currentChains, targetChains: t.targetChains })),
    pity5: document.getElementById('pity5').value,
    pity4: document.getElementById('pity4').value,
    guaranteed5up: document.getElementById('guaranteed5up').checked,
    guaranteed4up: document.getElementById('guaranteed4up').checked,
    wpity5: document.getElementById('wpity5').value,
    wpity4: document.getElementById('wpity4').value,
    wguaranteed4up: document.getElementById('wguaranteed4up').checked,
    initialCorals: document.getElementById('initial-corals').value,
    initialAstrites: document.getElementById('initial-astrites').value,
    initialLustrousTides: document.getElementById('initial-lustrous-tides').value,
    initialForgingTides: document.getElementById('initial-forging-tides').value,
    moneyRate: document.getElementById('money-rate').value,
    autoEcho: document.getElementById('auto-echo').checked,
    cyberpunkMode: document.getElementById('cyberpunk-mode').checked,
    includeBonusRewards: document.getElementById('include-bonus-rewards').checked,
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
  if (data.wpity5 !== undefined) document.getElementById('wpity5').value = data.wpity5;
  if (data.wpity4 !== undefined) document.getElementById('wpity4').value = data.wpity4;
  if (data.wguaranteed4up !== undefined) document.getElementById('wguaranteed4up').checked = data.wguaranteed4up;
  if (data.initialCorals !== undefined) document.getElementById('initial-corals').value = data.initialCorals;
  if (data.initialAstrites !== undefined) document.getElementById('initial-astrites').value = data.initialAstrites;
  if (data.initialLustrousTides !== undefined) document.getElementById('initial-lustrous-tides').value = data.initialLustrousTides;
  if (data.initialForgingTides !== undefined) document.getElementById('initial-forging-tides').value = data.initialForgingTides;
  if (data.moneyRate !== undefined) document.getElementById('money-rate').value = data.moneyRate;
  if (data.autoEcho !== undefined) document.getElementById('auto-echo').checked = data.autoEcho;
  if (data.cyberpunkMode !== undefined) {
    document.getElementById('cyberpunk-mode').checked = data.cyberpunkMode;
    document.getElementById('bonus-rewards-section').style.display = data.cyberpunkMode ? '' : 'none';
  }
  if (data.includeBonusRewards !== undefined) {
    document.getElementById('include-bonus-rewards').checked = data.includeBonusRewards;
  }
}

// 在所有相關輸入加上自動儲存
document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('change', saveSettings);
});

// ── 電馭叛客連動額外獎勵區塊顯示控制 ──────────────────────
document.getElementById('cyberpunk-mode').addEventListener('change', function () {
  const bonusSection = document.getElementById('bonus-rewards-section');
  bonusSection.style.display = this.checked ? '' : 'none';
  if (!this.checked) {
    document.getElementById('include-bonus-rewards').checked = false;
  }
});

const autoEchoEl  = document.getElementById('auto-echo');

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
      const unit = t.type === 'weapon' ? '精煉階級' : '鏈數';
      document.getElementById('target-error').textContent = `UP${i + 1} 的目標${unit}必須高於當前${unit}。`;
      valid = false;
      break;
    }
  }

  if (!valid) return;

  const pity5        = Math.min(78, Math.max(0, parseInt(document.getElementById('pity5').value)    || 0));
  const pity4        = Math.min( 9, Math.max(0, parseInt(document.getElementById('pity4').value)    || 0));
  const wPity5       = Math.min(78, Math.max(0, parseInt(document.getElementById('wpity5').value)   || 0));
  const wPity4       = Math.min( 9, Math.max(0, parseInt(document.getElementById('wpity4').value)   || 0));
  const initCor      = Math.max(0, parseInt(document.getElementById('initial-corals').value)         || 0);
  const initAstrites = Math.max(0, parseInt(document.getElementById('initial-astrites').value)       || 0);
  const initLustrous = Math.max(0, parseInt(document.getElementById('initial-lustrous-tides').value) || 0);
  const initForging  = Math.max(0, parseInt(document.getElementById('initial-forging-tides').value)  || 0);
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
  const includeBonusRewards = document.getElementById('include-bonus-rewards').checked;
  const params = {
    pity5,
    pity4,
    guaranteed5UP:  document.getElementById('guaranteed5up').checked,
    guaranteed4UP:  document.getElementById('guaranteed4up').checked,
    wPity5,
    wPity4,
    wGuaranteed4UP: document.getElementById('wguaranteed4up').checked,
    targets:        upTargets.map(t => ({
      type:             t.type || 'character',
      startingUPCopies: t.currentChains + 1,
      targetChains:     t.targetChains,
    })),
    initialCorals:  initCor,
    autoUseEchoes:  autoEchoEl.checked,
    std5Copies,
    std4Copies,
    up4StarIndices: [...up4Selected],
    cyberpunkMode,
    includeBonusRewards,
  };

  const btn = document.getElementById('calculate-btn');
  btn.textContent = '計算中…';
  btn.disabled = true;
  document.getElementById('results').style.display = 'none';

  setTimeout(() => {
    const res = runSim(params, 100000);

    const avgEchoTimes = Math.round(res.avgEchoCount);
    const totalUsedAvg = Math.round(res.avgEchoCorals);
    const multiTarget  = upTargets.length > 1;

    document.getElementById('results-content').innerHTML = `
      <div class="result-hero">
        <div class="big">${Math.round(res.avg)}</div>
        <div class="unit">預期總抽數${multiTarget ? `（${upTargets.length} 個目標合計）` : ''}</div>
      </div>
      ${multiTarget ? `
      <h3>各目標預期抽數</h3>
      <div class="coral-table">
        ${res.avgPerTarget.map((avg, i) => {
          const tt = upTargets[i].type || 'character';
          const typeName = tt === 'weapon' ? '武器' : '角色';
          return `
        <div class="coral-row">
          <span class="coral-lbl">UP${i + 1} ${typeName}（${levelLabel(tt, upTargets[i].currentChains)} → ${levelLabel(tt, upTargets[i].targetChains)}）</span>
          <span class="coral-val">${Math.round(avg)} 抽</span>
        </div>`;
        }).join('')}
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
        <div class="coral-row">
          <span class="coral-lbl">兌換 5 星 UP 回音頻段（珊瑚購買）</span>
          <span class="coral-val">${Math.round(res.avgEchoCorals)} 個（約 ${avgEchoTimes} 次）</span>
        </div>
        ${res.avgMilestoneEchoes > 0 ? `
        <div class="coral-row">
          <span class="coral-lbl">里程碑獎勵回音頻段（免費）</span>
          <span class="coral-val">約 ${res.avgMilestoneEchoes.toFixed(2)} 次</span>
        </div>` : ''}
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
        const hasChar   = upTargets.some(t => (t.type || 'character') === 'character');
        const hasWeapon = upTargets.some(t => t.type === 'weapon');

        const avgBonusPulls = Math.round(res.avgBonusPulls || 0);
        // 角色池：扣除聯動里程碑免費抽後，需自行以浮金波紋抽取
        const charPaidPulls    = Math.max(0, Math.round(res.avgCharPulls) - avgBonusPulls);
        const needAfterLustrous = Math.max(0, charPaidPulls - initLustrous);
        // 武器池：以鑄潮波紋抽取
        const weaponPullsAvg   = Math.round(res.avgWeaponPulls);
        const needAfterForging = Math.max(0, weaponPullsAvg - initForging);

        // 達成目的預計還須抽數 = 角色池 + 武器池（扣除各自初始波紋後）
        const totalNeed = needAfterLustrous + needAfterForging;

        // 剩餘珊瑚可兌換的抽取資源數（每 8 珊瑚換 1 抽）
        const remainCorals = initCor + Math.round(res.avgEarnedCorals) - totalUsedAvg;
        const coralTides = Math.max(0, Math.floor(remainCorals / 8));
        const needAfterCoral = Math.max(0, totalNeed - coralTides);

        // 左欄：不使用珊瑚兌換抽取資源；右欄：使用珊瑚兌換抽取資源
        const remainAstrites  = Math.max(0, totalNeed      * 160 - initAstrites);
        const remainAstrites2 = Math.max(0, needAfterCoral * 160 - initAstrites);
        return `
      <h3>抽卡資源統計</h3>
      <div class="coral-table">
        ${avgBonusPulls > 0 ? `
        <div class="coral-row">
          <span class="coral-lbl">聯動額外獎勵捕夢波紋（里程碑獎勵）</span>
          <span class="coral-val">約 ${avgBonusPulls} 抽</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">扣除里程碑獎勵後實際需自行抽取（角色池）</span>
          <span class="coral-val">${charPaidPulls} 抽</span>
        </div>` : ''}
        ${hasChar ? `
        <div class="coral-row">
          <span class="coral-lbl">初始持有浮金波紋</span>
          <span class="coral-val">${initLustrous} 抽</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">扣除初始浮金波紋後預計還需</span>
          <span class="coral-val">${needAfterLustrous} 抽</span>
        </div>` : ''}
        ${hasWeapon ? `
        <div class="coral-row">
          <span class="coral-lbl">初始持有鑄潮波紋</span>
          <span class="coral-val">${initForging} 抽</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">扣除初始鑄潮波紋後預計還需</span>
          <span class="coral-val">${needAfterForging} 抽</span>
        </div>` : ''}
        <div class="coral-row total">
          <span class="coral-lbl">達成目的預計還須</span>
          <span class="coral-val total-val">${totalNeed} 抽（需 ${(totalNeed * 160).toLocaleString()} 星聲）</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">使用「剩餘珊瑚」可兌換抽取資源數</span>
          <span class="coral-val">${coralTides} 抽</span>
        </div>
        <div class="coral-row total">
          <span class="coral-lbl">扣除使用珊瑚兌換之抽取資源後預計還需</span>
          <span class="coral-val total-val">${needAfterCoral} 抽（需 ${(needAfterCoral * 160).toLocaleString()} 星聲）</span>
        </div>
        <div class="coral-row">
          <span class="coral-lbl">初始持有星聲</span>
          <span class="coral-val">${initAstrites.toLocaleString()} 個</span>
        </div>
        <div class="coral-row two-col col-head">
          <span class="coral-lbl"></span>
          <span class="col-title">不使用珊瑚兌換</span>
          <span class="col-title">使用珊瑚兌換</span>
        </div>
        <div class="coral-row total two-col">
          <span class="coral-lbl">扣除初始星聲後預計還需</span>
          <span class="coral-val total-val">${remainAstrites.toLocaleString()} 星聲</span>
          <span class="coral-val total-val">${remainAstrites2.toLocaleString()} 星聲</span>
        </div>
        ${remainAstrites > 0 ? `
        <div class="coral-row total two-col">
          <span class="coral-lbl">換算真錢約需（依設定匯率 1:${moneyRate.toFixed(2)}）</span>
          <span class="coral-val total-val">${Math.ceil(remainAstrites / moneyRate).toLocaleString()} 元</span>
          <span class="coral-val total-val">${Math.ceil(remainAstrites2 / moneyRate).toLocaleString()} 元</span>
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
