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

// ── 目標鏈數選項（隨起始鏈數動態更新）────────────────────
const currentChainsEl = document.getElementById('current-chains');
const targetChainsEl  = document.getElementById('target-chains');

function updateTargetOpts() {
  const cur = parseInt(currentChainsEl.value); // -1 ~ 5
  const minTarget = cur + 1; // 0 ~ 6
  const prevVal = parseInt(targetChainsEl.value);
  targetChainsEl.innerHTML = '';
  for (let c = Math.max(0, minTarget); c <= 6; c++) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = `${c} 鏈`;
    targetChainsEl.appendChild(opt);
  }
  if (!isNaN(prevVal) && prevVal >= Math.max(0, minTarget)) {
    targetChainsEl.value = prevVal;
  }
}
currentChainsEl.addEventListener('change', updateTargetOpts);
updateTargetOpts();

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
function coralFor5Star(copies) {
  return copies < 7 ? 15 : 40;
}
function coralFor4StarChar(copies) {
  return copies < 7 ? 3 : 8;
}

function simulate(p) {
  let pity5 = p.pity5;
  let pity4 = p.pity4;
  let g5up  = p.guaranteed5UP;
  let g4up  = p.guaranteed4UP;

  let upCopies   = p.startingUPCopies; // 0=未擁有, 1=0鏈 …
  let shopEchoes = 0;
  let corals     = p.initialCorals;

  let coralForEchoes  = 0;
  let coralForPulls   = 0;
  let totalCoralsEarned = 0;
  let totalPulls      = 0;

  const std5 = [...p.std5Copies];
  const std4 = [...p.std4Copies];
  const up4Idx    = p.up4StarIndices;
  const nonUp4Idx = STD_4STAR
    .map((_, i) => i)
    .filter(i => !up4Idx.includes(i));

  const targetChains = p.targetChains;
  const autoEcho     = p.autoUseEchoes;
  const autoPull     = p.autoUsePulls;

  function isDone() {
    return upCopies >= 1 && (upCopies - 1 + shopEchoes) >= targetChains;
  }

  const echoFirst = p.coralPriority === 'echo';

  function buyEchoes() {
    if (!autoEcho || upCopies < 1 || shopEchoes >= 2) return;
    while (corals >= 360 && shopEchoes < 2) {
      corals         -= 360;
      coralForEchoes += 360;
      shopEchoes++;
    }
  }

  function buyOnePull() {
    if (!autoPull || corals < 8 || isDone()) return false;
    corals        -= 8;
    coralForPulls += 8;
    pull();
    return true;
  }

  function getRate5(p5) {
    if (p5 <= 64) return 0.008;
    if (p5 <= 69) return 0.008 + (p5 - 64) * 0.04;
    if (p5 <= 74) return 0.008 + 5 * 0.04 + (p5 - 69) * 0.08;
    if (p5 <= 77) return 0.008 + 5 * 0.04 + 5 * 0.08 + (p5 - 74) * 0.10;
    return 1.0;
  }

  function pull() {
    const r1 = Math.random();
    let rarity;
    const rate5 = getRate5(pity5);
    const delta  = rate5 - 0.008;
    const rate4  = Math.max(0, 0.06  - delta / 2);
    if (pity4 >= 9) {
      rarity = r1 < rate5 ? 5 : 4;
    } else {
      if      (r1 < rate5)         rarity = 5;
      else if (r1 < rate5 + rate4) rarity = 4;
      else                         rarity = 3;
    }

    if      (rarity === 5) { pity5 = 0; pity4 = 0; }
    else if (rarity === 4) { pity5++;   pity4 = 0; }
    else                   { pity5++;   pity4++;   }

    if (rarity === 5) {
      let isUP;
      if (g5up) { isUP = true; g5up = false; }
      else       { isUP = Math.random() < 0.5; if (!isUP) g5up = true; }

      if (isUP) {
        const gained = coralFor5Star(upCopies);
        corals += gained; totalCoralsEarned += gained;
        upCopies++;
      } else {
        const ci = Math.floor(Math.random() * 5);
        const gained = coralFor5Star(std5[ci]) + 30; // +30 非UP額外
        corals += gained; totalCoralsEarned += gained;
        std5[ci]++;
      }

    } else if (rarity === 4) {
      let isUP4;
      if (g4up) { isUP4 = true; g4up = false; }
      else       { isUP4 = Math.random() < 0.5; if (!isUP4) g4up = true; }

      if (isUP4) {
        const ci = up4Idx[Math.floor(Math.random() * up4Idx.length)];
        const gained = coralFor4StarChar(std4[ci]);
        corals += gained; totalCoralsEarned += gained;
        std4[ci]++;
      } else {
        // 29 個非 UP 內容：9 常駐角色 + 20 武器
        const roll = Math.floor(Math.random() * 29);
        if (roll < 9) {
          const ci = nonUp4Idx[roll];
          const gained = coralFor4StarChar(std4[ci]);
          corals += gained; totalCoralsEarned += gained;
          std4[ci]++;
        } else {
          corals += 3; totalCoralsEarned += 3; // 4 星武器
        }
      }
    }
    // 3 星武器：產生殘振珊瑚（不同幣種），不計入
  }

  function applyActions() {
    let changed = true;
    while (changed && !isDone()) {
      changed = false;
      if (echoFirst) {
        buyEchoes();
        if (isDone()) break;
        if (buyOnePull()) { totalPulls++; changed = true; }
      } else {
        if (buyOnePull()) { totalPulls++; changed = true; }
        buyEchoes();
      }
    }
  }

  applyActions();
  if (isDone()) return { pulls: 0, coralForEchoes, coralForPulls };

  const MAX = 30000;
  while (!isDone() && totalPulls < MAX) {
    pull();
    totalPulls++;
    applyActions();
  }

  return { pulls: totalPulls, coralForEchoes, coralForPulls, totalCoralsEarned };
}

function runSim(params, iters = 100000) {
  let sumPulls = 0, sumEchoes = 0, sumPullCoral = 0, sumEarned = 0;
  const arr = new Int32Array(iters);

  for (let i = 0; i < iters; i++) {
    const r   = simulate(params);
    sumPulls      += r.pulls;
    sumEchoes     += r.coralForEchoes;
    sumPullCoral  += r.coralForPulls;
    sumEarned     += r.totalCoralsEarned;
    arr[i]         = r.pulls;
  }

  arr.sort();
  const pcts = {};
  for (let p = 10; p <= 90; p += 10) {
    pcts[`p${p}`] = arr[Math.floor(iters * p / 100)];
  }
  return {
    avg:   sumPulls     / iters,
    avgEchoCorals:  sumEchoes    / iters,
    avgPullCorals:  sumPullCoral / iters,
    avgEarnedCorals: sumEarned   / iters,
    ...pcts,
  };
}

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

  const currentChains = parseInt(currentChainsEl.value);
  const targetChains  = parseInt(targetChainsEl.value);
  if (isNaN(targetChains) || targetChains <= currentChains) {
    document.getElementById('target-error').textContent = '目標鏈數必須高於當前鏈數。';
    valid = false;
  }

  if (!valid) return;

  const pity5          = Math.min(78, Math.max(0, parseInt(document.getElementById('pity5').value)   || 0));
  const pity4          = Math.min( 9, Math.max(0, parseInt(document.getElementById('pity4').value)   || 0));
  const initCor        = Math.max(0, parseInt(document.getElementById('initial-corals').value)        || 0);
  const initAstrites   = Math.max(0, parseInt(document.getElementById('initial-astrites').value)      || 0);
  const initLustrous   = Math.max(0, parseInt(document.getElementById('initial-lustrous-tides').value)|| 0);
  const initPulls      = Math.floor(initAstrites / 160) + initLustrous;

  const std5Copies = STD_5STAR.map((_, i) => {
    const v = parseInt(document.getElementById(`std5-${i}`).value);
    return v + 1; // -1(未擁有)→0, 0鏈→1, …
  });
  const std4Copies = STD_4STAR.map((_, i) => {
    const v = parseInt(document.getElementById(`std4-${i}`).value);
    return v + 1;
  });

  const params = {
    pity5,
    pity4,
    guaranteed5UP:    document.getElementById('guaranteed5up').checked,
    guaranteed4UP:    document.getElementById('guaranteed4up').checked,
    startingUPCopies: currentChains + 1,
    targetChains,
    initialCorals:    initCor,
    autoUseEchoes:    autoEchoEl.checked,
    autoUsePulls:     autoPullEl.checked,
    coralPriority:    document.querySelector('input[name="coral-priority"]:checked')?.value ?? 'echo',
    std5Copies,
    std4Copies,
    up4StarIndices:   [...up4Selected],
  };

  const btn = document.getElementById('calculate-btn');
  btn.textContent = '計算中…';
  btn.disabled = true;
  document.getElementById('results').style.display = 'none';

  setTimeout(() => {
    const res = runSim(params, 100000);

    const avgEchoTimes   = Math.round(res.avgEchoCorals / 360);
    const avgPullBuys    = Math.round(res.avgPullCorals  /   8);
    const totalUsedAvg   = Math.round(res.avgEchoCorals + res.avgPullCorals);

    document.getElementById('results-content').innerHTML = `
      <div class="result-hero">
        <div class="big">${Math.round(res.avg)}</div>
        <div class="unit">預期總抽數（含珊瑚兌換所得的抽數）</div>
      </div>
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
      </div>`;
      })()}
    `;

    document.getElementById('results').style.display = 'block';
    btn.textContent = '重新計算';
    btn.disabled = false;
    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 30);
});
