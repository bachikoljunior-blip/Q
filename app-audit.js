async function readFile(file, kind) {
  const text = await file.text();
  const parsed = parseDelimited(text);

  if (kind === 'report') {
    state.report = parsed;
    reportState.textContent = `${file.name} · ${parsed.rows.length.toLocaleString('ja-JP')}行 · ${delimiterLabel(parsed.delimiter)}`;
    reportDrop.classList.add('ready');
    track('report-loaded');
  } else {
    state.costs = parsed;
    costState.textContent = `${file.name} · ${parsed.rows.length.toLocaleString('ja-JP')}行 · ${delimiterLabel(parsed.delimiter)}`;
    costDrop.classList.add('ready');
    track('cost-loaded');
  }

  if (state.report && state.costs) populateMappings();
}

function handleFileInput(input, kind) {
  const file = input.files?.[0];
  if (!file) return;
  readFile(file, kind).catch(error => {
    const target = kind === 'report' ? reportState : costState;
    target.textContent = `読込失敗: ${error.message}`;
    showToast('ファイルを読み取れませんでした');
  });
}

function wireDropZone(element, kind) {
  ['dragenter', 'dragover'].forEach(type => {
    element.addEventListener(type, event => {
      event.preventDefault();
      element.classList.add('drag');
    });
  });
  ['dragleave', 'drop'].forEach(type => {
    element.addEventListener(type, event => {
      event.preventDefault();
      element.classList.remove('drag');
    });
  });
  element.addEventListener('drop', event => {
    const file = event.dataTransfer?.files?.[0];
    if (file) readFile(file, kind).catch(error => showToast(error.message));
  });
}

function getMappings() {
  return Object.fromEntries(mappingIds.map(id => [id, document.getElementById(id).value]));
}

function validateMappings(m) {
  if (!m.mapReportKey || !m.mapCostKey || !m.mapCostValue) {
    return '照合キーと原価列を指定してください。';
  }
  if (!m.mapAmountTotal && !m.mapAmountPerUnit) {
    return '補てんの合計金額または1個あたり金額を指定してください。';
  }
  if (!m.mapCashQty && !m.mapTotalQty) {
    return '現金補てん数量または補てん数量合計を指定してください。';
  }
  return '';
}

function classifyReason(reason, amountTotal, originalId) {
  const value = String(reason ?? '').normalize('NFKC').toUpperCase().replace(/[\s-]+/g, '_');

  if (amountTotal < 0 || originalId || /REVERS|取消|逆仕訳|取り消/.test(value)) {
    return { type: 'reversal', label: '取消・逆仕訳', costBased: false };
  }

  const postOrder = /OUTBOUND|CUSTOMER|RETURN|REFUND|ORDER|BUYER|購入者|返品|返金/.test(value);
  const preOrderPlace = /WAREHOUSE|FULFILLMENT|FC_|INBOUND|倉庫|受領/.test(value);
  const lossOrDamage = /LOST|DAMAGED|MISSING|紛失|破損/.test(value);

  if (preOrderPlace && lossOrDamage && !postOrder) {
    return { type: 'cost', label: '原価基準候補', costBased: true };
  }

  if (postOrder) {
    return { type: 'review', label: '注文後・要確認', costBased: false };
  }

  return { type: 'review', label: '理由を要確認', costBased: false };
}

function costDefinitionWarning(note) {
  const value = String(note ?? '').normalize('NFKC').toLowerCase();
  return /(送料|運賃|関税|保管|広告|手数料|shipping|freight|customs|handling|landed)/.test(value);
}

function daysBetween(start, end) {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / 86400000);
}

function auditData() {
  const m = getMappings();
  const error = validateMappings(m);
  if (error) {
    mappingError.textContent = error;
    mappingError.hidden = false;
    return;
  }
  mappingError.hidden = true;

  const threshold = Math.max(0.5, Math.min(1, Number(document.getElementById('thresholdInput').value || 90) / 100));
  const costIndex = new Map();

  state.costs.rows.forEach(row => {
    const key = normalizeKey(row[m.mapCostKey]);
    const cost = parseNumber(row[m.mapCostValue]);
    if (!key || !Number.isFinite(cost) || cost < 0) return;
    costIndex.set(key, {
      cost,
      note: m.mapCostNote ? row[m.mapCostNote] : '',
      rowNumber: row.__rowNumber
    });
  });

  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const records = [];

  state.report.rows.forEach(row => {
    const keyRaw = row[m.mapReportKey];
    const key = normalizeKey(keyRaw);
    if (!key) return;

    const date = m.mapDate ? parseDate(row[m.mapDate]) : null;
    const reimbursementId = m.mapReimbursementId ? String(row[m.mapReimbursementId] ?? '').trim() : '';
    const reason = m.mapReason ? String(row[m.mapReason] ?? '').trim() : '';
    const originalId = m.mapOriginalId ? String(row[m.mapOriginalId] ?? '').trim() : '';

    const cashQtyRaw = m.mapCashQty ? parseNumber(row[m.mapCashQty]) : NaN;
    const totalQtyRaw = m.mapTotalQty ? parseNumber(row[m.mapTotalQty]) : NaN;
    const inventoryQtyRaw = m.mapInventoryQty ? parseNumber(row[m.mapInventoryQty]) : NaN;

    const cashQty = Number.isFinite(cashQtyRaw) ? Math.max(0, cashQtyRaw) :
      (Number.isFinite(totalQtyRaw) ? Math.max(0, totalQtyRaw) : 1);
    const totalQty = Number.isFinite(totalQtyRaw) ? Math.max(0, totalQtyRaw) : cashQty;
    const inventoryQty = Number.isFinite(inventoryQtyRaw) ? Math.max(0, inventoryQtyRaw) : 0;

    let amountTotal = m.mapAmountTotal ? parseNumber(row[m.mapAmountTotal]) : NaN;
    let amountPerUnit = m.mapAmountPerUnit ? parseNumber(row[m.mapAmountPerUnit]) : NaN;

    if (!Number.isFinite(amountTotal) && Number.isFinite(amountPerUnit)) {
      amountTotal = amountPerUnit * (cashQty || totalQty || 1);
    }
    if (!Number.isFinite(amountPerUnit) && Number.isFinite(amountTotal) && cashQty > 0) {
      amountPerUnit = amountTotal / cashQty;
    }

    if (!Number.isFinite(amountTotal)) return;

    const classInfo = classifyReason(reason, amountTotal, originalId);
    const costEntry = costIndex.get(key);
    const expected = costEntry && cashQty > 0 ? costEntry.cost * cashQty : NaN;
    const shortfall = classInfo.costBased && Number.isFinite(expected) ?
      Math.max(0, expected * threshold - amountTotal) : 0;
    const fullGap = classInfo.costBased && Number.isFinite(expected) ?
      Math.max(0, expected - amountTotal) : 0;

    const ageDays = date ? daysBetween(date, todayUtc) : null;
    const daysLeft = ageDays === null ? null : 60 - ageDays;

    const flags = [];
    let bucket = 'ok';
    let severity = 0;

    if (classInfo.type === 'reversal') {
      flags.push('取消・逆仕訳の可能性');
      bucket = 'reversal';
      severity = Math.max(severity, 1);
    } else if (classInfo.costBased && !costEntry) {
      flags.push('照合できる仕入原価がない');
      bucket = 'missing';
      severity = Math.max(severity, daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 ? 4 : 2);
    } else if (classInfo.costBased && shortfall > 0) {
      flags.push(`補てん額が原価基準の${Math.round(threshold * 100)}%未満`);
      bucket = 'high';
      severity = Math.max(severity, daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 ? 5 : 4);
    } else if (!classInfo.costBased) {
      flags.push(classInfo.label);
      bucket = 'review';
      severity = Math.max(severity, 1);
    }

    if (date && daysLeft !== null) {
      if (daysLeft < 0) {
        flags.push('再評価60日を超過の可能性');
      } else if (daysLeft <= 14) {
        flags.push(`期限まで約${daysLeft}日`);
        severity = Math.max(severity, 4);
        if (bucket === 'ok') bucket = 'high';
      }
    } else if (!date) {
      flags.push('承認日を確認できない');
      if (bucket === 'ok') bucket = 'review';
    }

    if (costEntry && costDefinitionWarning(costEntry.note)) {
      flags.push('原価メモに送料等を含む可能性');
      severity = Math.max(severity, 2);
      if (bucket === 'ok') bucket = 'review';
    }

    if (inventoryQty > 0 && cashQty === 0) {
      flags.push('現金ではなく在庫補てん');
      if (bucket === 'ok') bucket = 'review';
    }

    records.push({
      rowNumber: row.__rowNumber,
      key: keyRaw,
      normalizedKey: key,
      date,
      reimbursementId,
      reason,
      originalId,
      cashQty,
      inventoryQty,
      totalQty,
      amountTotal,
      amountPerUnit,
      cost: costEntry?.cost ?? NaN,
      costNote: costEntry?.note ?? '',
      expected,
      shortfall,
      fullGap,
      ageDays,
      daysLeft,
      classInfo,
      flags,
      bucket,
      severity
    });
  });

  const groups = new Map();
  records.forEach(record => {
    if (!record.classInfo.costBased || !Number.isFinite(record.amountPerUnit) || record.amountPerUnit <= 0) return;
    const groupKey = `${record.normalizedKey}::${normalizeHeader(record.reason)}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(record);
  });

  groups.forEach(group => {
    if (group.length < 2) return;
    const amounts = group.map(record => record.amountPerUnit).filter(value => value > 0);
    if (amounts.length < 2) return;
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (min > 0 && max / min > 1.25) {
      group.forEach(record => {
        record.flags.push(`同一SKU・理由で評価額が${(max / min).toFixed(2)}倍ばらつく`);
        record.severity = Math.max(record.severity, 3);
        if (record.bucket === 'ok') record.bucket = 'review';
      });
    }
  });

  state.audited = records.sort((a, b) =>
    b.severity - a.severity ||
    (Number.isFinite(b.shortfall) ? b.shortfall : 0) - (Number.isFinite(a.shortfall) ? a.shortfall : 0)
  );

  buildClaimPack();
  renderResults();
  track('audit-run');
  if (state.audited.some(record => record.shortfall > 0)) track('shortfall-found');
  if (state.audited.some(record => record.daysLeft !== null && record.daysLeft >= 0 && record.daysLeft <= 14)) track('deadline-found');
}
