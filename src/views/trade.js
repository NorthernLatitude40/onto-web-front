// ==UserScript==
// @name         后台上架自动比价与一键填价助手(全字典配置版)
// @namespace    http://tampermonkey.net/
// @version      7.3
// @description  支持预查ID获取准确cid/baseid、固定核心大类探针、属性复选框/最大最小值筛选比价、一键/批量填价、接口精准提取商品ID与条件传参matchname、完整控制台日志
// @match        *://*.game7power.com/*
// @match        *://game7power.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @connect      www.aoeah.com
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // --- 0. 默认配置与字典声明 ---
    const DEFAULT_CONFIG = {
        apiEndpoint: 'https://xxx',
        gameSort: 'D4',
        serverName: 'D4 SC Season',
        batchDelay: 600,
        beatPriceAmount: 1,
        pageSize: 30,
        suggestFormula: 'price / 3.35'
    };

    const DEFAULT_AFFIX_KEYWORDS = {
        'Maximum Life': { key: 'maximum_life', value: 'Maximum Life' },
        'Willpower': { key: 'willpower', value: 'Willpower' },
        'Strength': { key: 'strength', value: 'Strength' },
        'Dexterity': { key: 'dexterity', value: 'Dexterity' },
        'Intelligence': { key: 'intelligence', value: 'Intelligence' },
        'Weapon Damage': { key: 'weapon_damage', value: 'Weapon Damage' },
        'x Critical Strike Damage Multiplier': { key: 'crit_damage_mult', value: 'x Critical Strike Damage Multiplier' },
        'Critical Strike Damage': { key: 'crit_damage', value: 'Critical Strike Damage' },
        'Critical Strike Chance': { key: 'crit_chance', value: 'Critical Strike Chance' },
        'Overpower Damage': { key: 'overpower_damage', value: 'Overpower Damage' },
        'Vulnerable Damage': { key: 'vulnerable_damage', value: 'Vulnerable Damage' },
        'Attack Speed': { key: 'attack_speed', value: 'Attack Speed' },
        'Cooldown Reduction': { key: 'cooldown_reduction', value: "Bul-Kathos' Pride: Ancient Skill Cooldown Reduction" },
        'Resource Cost Reduction': { key: 'resource_cost_reduction', value: 'Resource Cost Reduction' },
        'Up a chance Become Berserking': { key: 'up_a_chance_become_berserking', value: "Berserker's Crucible:Lucky Hit: Up a  chance Become Berserking" },
        'Armor': { key: 'armor', value: 'Armor' },
        'Damage Reduction': { key: 'damage_reduction', value: "Berserker's Crucible: Damage Reduction while Berserking" },
        'All Resistances': { key: 'all_resistances', value: 'All Resistances' },
        'Fire Resistance': { key: 'fire_resistance', value: 'Fire Resistance' },
        'Cold Resistance': { key: 'cold_resistance', value: 'Cold Resistance' },
        'Lightning Resistance': { key: 'lightning_resistance', value: 'Lightning Resistance' },
        'Poison Resistance': { key: 'poison_resistance', value: 'Poison Resistance' },
        'Shadow Resistance': { key: 'shadow_resistance', value: 'Shadow Resistance' }
    };

    const DEFAULT_TMETHOD_MAP = {
        'Rare Items': '600',
        'Unique Items': '601',
        'Unique (Full Affixes)': '20',
        'Legendary': '500'
    };

    function getConfig() {
        return {
            apiEndpoint: GM_getValue('cfg_apiEndpoint', DEFAULT_CONFIG.apiEndpoint),
            gameSort: GM_getValue('cfg_gameSort', DEFAULT_CONFIG.gameSort),
            serverName: GM_getValue('cfg_serverName', DEFAULT_CONFIG.serverName),
            batchDelay: parseInt(GM_getValue('cfg_batchDelay', DEFAULT_CONFIG.batchDelay), 10),
            beatPriceAmount: parseFloat(GM_getValue('cfg_beatPriceAmount', DEFAULT_CONFIG.beatPriceAmount)),
            pageSize: GM_getValue('cfg_pageSize', DEFAULT_CONFIG.pageSize),
            suggestFormula: GM_getValue('cfg_suggestFormula', DEFAULT_CONFIG.suggestFormula)
        };
    }

    function getTmethodMap() {
        const raw = GM_getValue('cfg_tmethodMap', null);
        if (!raw) return DEFAULT_TMETHOD_MAP;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            return DEFAULT_TMETHOD_MAP;
        }
    }

    function getAffixKeywords() {
        const raw = GM_getValue('cfg_affixKeywords', null);
        if (!raw) return DEFAULT_AFFIX_KEYWORDS;
        try {
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch (e) {
            return DEFAULT_AFFIX_KEYWORDS;
        }
    }

    function resetAllConfigsToDefault() {
        GM_deleteValue('cfg_apiEndpoint');
        GM_deleteValue('cfg_gameSort');
        GM_deleteValue('cfg_serverName');
        GM_deleteValue('cfg_batchDelay');
        GM_deleteValue('cfg_beatPriceAmount');
        GM_deleteValue('cfg_pageSize');
        GM_deleteValue('cfg_suggestFormula');
        GM_deleteValue('cfg_tmethodMap');
        GM_deleteValue('cfg_tmethod2Map');
        GM_deleteValue('cfg_affixKeywords');
    }

    let currentMinPrice = 0;
    let checkedIndex = 0;
    let isCollapsed = false;
    let lastRenderedInfoId = null;

    // 从接口返回的 item 中提取 ID
    function extractIdFromApiItem(item) {
        if (!item) return null;
        if (item.token) {
            const match = String(item.token).match(/\[ID:(\d+)\]/i);
            if (match) return match[1];
        }
        if (Array.isArray(item.name)) {
            for (const n of item.name) {
                const match = String(n).match(/\[ID:(\d+)\]/i) || String(n).match(/^(\d+)$/);
                if (match) return match[1];
            }
        } else if (typeof item.name === 'string') {
            const match = item.name.match(/\[ID:(\d+)\]/i);
            if (match) return match[1];
        }
        const imgStr = item.img || item.tip || '';
        const imgMatch = imgStr.match(/(\d+)\.(png|jpg|jpeg)/i);
        if (imgMatch) return imgMatch[1];

        return item.id || item.goods_id || null;
    }

    function matchAffixName(rawText) {
        const cleanText = rawText.replace(/^[\s\*\u2605\u2733\+\d\,\.\%]+/, '').trim();
        const keywords = getAffixKeywords();

        for (const keyword in keywords) {
            if (cleanText.includes(keyword)) {
                const item = keywords[keyword];
                return typeof item === 'string' ? item : item.value;
            }
        }
        return cleanText;
    }

    function extractValueFromText(text) {
        const match = text.match(/[\+\-]?\d+(\.\d+)?/);
        return match ? match[0] : '';
    }

    function parseTrInfo(tr) {
        if (!tr) return null;

        const nameCell = tr.querySelector('td:nth-child(3)');
        if (!nameCell) return null;

        const text = nameCell.innerText || '';
        const m = text.match(/^(.+?)\s*\[ID:(\d+)\]/m);
        if (!m) return null;

        const name = m[1].trim();
        const id = m[2];

        const slotCell = tr.querySelector('td:nth-child(4)');
        const slotName = slotCell ? slotCell.innerText.trim() : '';

        const tmethodMap = getTmethodMap();
        let tmethod = '600';
        if (name.includes('Unique')) {
            tmethod = tmethodMap['Unique Items'] || '601';
        } else if (tmethodMap[name]) {
            tmethod = tmethodMap[name];
        }

        const affixEls = tr.querySelectorAll('span[class*="affix_"], .ps-2 div');
        const attrs = [];

        affixEls.forEach(el => {
            const attrText = el.innerText.trim();
            if (!attrText) return;

            const isGreater = (el.classList.contains('affix_1') || el.querySelector('.affix_1')) ? '1' : '';
            const finalAffixName = matchAffixName(attrText);
            const val = extractValueFromText(attrText);

            if (finalAffixName && !attrs.some(a => a.name === finalAffixName)) {
                attrs.push({
                    name: finalAffixName,
                    rawText: attrText,
                    m: val,
                    m2: '',
                    isGreater: isGreater
                });
            }
        });

        return { tr, name, id, slotName, tmethod, attrs };
    }

    function getTargetRows() {
        const checkedBoxs = Array.from(document.querySelectorAll('tbody tr input[type="checkbox"]:checked'));
        const checkedTrs = checkedBoxs.map(cb => cb.closest('tr')).filter(tr => tr && parseTrInfo(tr));

        if (checkedTrs.length > 0) {
            return { rows: checkedTrs, isCheckedMode: true };
        }

        const allTrs = Array.from(document.querySelectorAll('tbody tr')).filter(tr => parseTrInfo(tr));
        return { rows: allTrs, isCheckedMode: false };
    }

    function getCurrentActiveTr() {
        const { rows } = getTargetRows();
        if (rows.length === 0) return null;
        if (checkedIndex >= rows.length) checkedIndex = rows.length - 1;
        if (checkedIndex < 0) checkedIndex = 0;
        return rows[checkedIndex];
    }

    function highlightCurrentRow(tr) {
        if (!tr) return;
        document.querySelectorAll('tbody tr').forEach(r => r.style.outline = '');
        tr.style.outline = '2px solid #2563eb';
        tr.style.outlineOffset = '-2px';
        tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function getSelectedAttrsFromUI(allAttrs) {
        const items = document.querySelectorAll('#php-attr-list .php-attr-item-row');
        if (items.length === 0) return allAttrs;

        const result = [];
        items.forEach((row) => {
            const cb = row.querySelector('.php-attr-cb');
            if (cb && cb.checked) {
                const idx = parseInt(cb.value, 10);
                const originalAttr = allAttrs[idx];
                if (originalAttr) {
                    const mVal = row.querySelector('.php-attr-min')?.value.trim() || '';
                    const m2Val = row.querySelector('.php-attr-max')?.value.trim() || '';
                    result.push({
                        ...originalAttr,
                        m: mVal,
                        m2: m2Val
                    });
                }
            }
        });
        return result;
    }

    function sendPostRequest(url, params) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                data: params.toString(),
                onload: function (response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve(data);
                    } catch (e) {
                        reject('解析 JSON 失败');
                    }
                },
                onerror: function (err) {
                    console.error('[比价助手] 网络请求失败:', err);
                    reject('网络请求失败');
                }
            });
        });
    }

    async function probeItemClassification(info, cfg) {
        const tmethodMap = getTmethodMap();
        const configuredIds = Object.values(tmethodMap).map(v => String(v));
        const candidateTmethods = Array.from(new Set([
            info.tmethod,
            ...configuredIds,
            '600', '601', '20', '500'
        ])).slice(0, 4);

        const probeTasks = candidateTmethods.map(async (tmethod) => {
            const params = new URLSearchParams({
                gamesort: cfg.gameSort,
                type: 'Items',
                servername: cfg.serverName,
                tmethod: tmethod,
                tmethod2: '',
                searchname: info.id,
                pagesize: '30',
                page: '1',
                ajaxtime: performance.now().toString()
            });

            try {
                const data = await sendPostRequest(cfg.apiEndpoint, params);
                const items = data.items || [];
                const matchedItem = items.find(i =>
                    (i.token || '').includes(`[ID:${info.id}]`) ||
                    (i.name || '').includes(info.id)
                );

                if (matchedItem) {
                    return {
                        matched: true,
                        cid: matchedItem.cid !== undefined && matchedItem.cid !== null ? String(matchedItem.cid) : '',
                        baseid: matchedItem.baseid !== undefined && matchedItem.baseid !== null ? String(matchedItem.baseid) : tmethod,
                        lastDeal: matchedItem.price || null,
                        lastDealId: extractIdFromApiItem(matchedItem)
                    };
                }
            } catch (e) {}
            return { matched: false };
        });

        const results = await Promise.all(probeTasks);
        const hit = results.find(r => r.matched);

        if (hit) {
            console.log(`[比价助手 Step 1 探针命中] ID:${info.id} => baseid:${hit.baseid}, cid:${hit.cid}`);
            return {
                fetchedCid: hit.cid,
                fetchedBaseid: hit.baseid,
                step1LastDeal: hit.lastDeal,
                step1LastDealId: hit.lastDealId
            };
        }

        console.warn(`[比价助手 探针未命中] ID:${info.id}，使用默认降级`);
        return {
            fetchedCid: '',
            fetchedBaseid: info.tmethod || '600',
            step1LastDeal: null,
            step1LastDealId: null
        };
    }

    async function fetchPriceForInfo(info, overrideAttrs = null) {
        if (!info) throw '无商品数据';

        const cfg = getConfig();
        const { fetchedCid, fetchedBaseid, step1LastDeal, step1LastDealId } = await probeItemClassification(info, cfg);

        const matchCb = document.getElementById('php-matchname-cb');
        const useMatchName = matchCb ? matchCb.checked : false;

        const step2Params = new URLSearchParams({
            gamesort: cfg.gameSort,
            type: 'Items',
            servername: cfg.serverName,
            tmethod: fetchedBaseid,
            tmethod2: fetchedCid,
            searchname: '',
            pagesize: cfg.pageSize,
            page: '1',
            ajaxtime: performance.now().toString()
        });

        // 仅在勾选时传入 matchname 參數
        if (useMatchName && info.name) {
            step2Params.append('matchname', info.name);
            console.log('[比价助手] 已勾选名称，附加 matchname 参数:', info.name);
        }

        const targetAttrs = overrideAttrs !== null ? overrideAttrs : info.attrs;
        targetAttrs.forEach((attrObj, i) => {
            step2Params.append(`attr[${i}][a]`, attrObj.name);
            step2Params.append(`attr[${i}][m]`, attrObj.m || '');
            step2Params.append(`attr[${i}][m2]`, attrObj.m2 || '');
            if (attrObj.isGreater) {
                step2Params.append(`attr[${i}][g]`, attrObj.isGreater);
            }
        });

        console.log(`[比价助手 Step 2 比价列表] ID:${info.id}`, Object.fromEntries(step2Params.entries()));
        const step2Data = await sendPostRequest(cfg.apiEndpoint, step2Params);
        const step2Items = step2Data.items || [];

        let minPrice = 0;
        let minPriceId = null;

        if (step2Items.length > 0) {
            let cheapestItem = null;
            let minP = Infinity;
            step2Items.forEach(i => {
                const p = parseFloat(i.price);
                if (!isNaN(p) && p > 0 && p < minP) {
                    minP = p;
                    cheapestItem = i;
                }
            });
            if (cheapestItem) {
                minPrice = minP;
                minPriceId = extractIdFromApiItem(cheapestItem);
            }
        }

        const sameItemInStep2 = step2Items.find(i => (i.token || '').includes(`[ID:${info.id}]`) || (i.name || '').includes(info.id));
        const finalLastDeal = sameItemInStep2 ? sameItemInStep2.price : step1LastDeal;
        const finalLastDealId = sameItemInStep2 ? extractIdFromApiItem(sameItemInStep2) : step1LastDealId;

        return {
            minPrice,
            minPriceId,
            lastDeal: finalLastDeal,
            lastDealId: finalLastDealId,
            totalCount: step2Items.length,
            cid: fetchedCid,
            baseid: fetchedBaseid,
            info
        };
    }

    function renderAttrCheckboxList(attrs) {
        const container = document.getElementById('php-attr-list');
        if (!container) return;

        container.innerHTML = '';
        if (!attrs || attrs.length === 0) {
            container.innerHTML = '<div style="color:#94a3b8;font-size:11px;">无识别词缀</div>';
            return;
        }

        attrs.forEach((attr, idx) => {
            const row = document.createElement('div');
            row.className = 'php-attr-item-row';

            row.innerHTML = `
                <div class="php-attr-left">
                    <input type="checkbox" class="php-attr-cb" value="${idx}" checked />
                    <span class="php-attr-name" title="${attr.rawText || attr.name}">${attr.name}</span>
                </div>
                <div class="php-attr-inputs">
                    <input type="text" class="php-attr-num-input php-attr-min" placeholder="Min" value="${attr.m || ''}" />
                    <input type="text" class="php-attr-num-input php-attr-max" placeholder="Max" value="${attr.m2 || ''}" />
                </div>
            `;

            row.querySelector('.php-attr-cb').addEventListener('change', triggerAttrPriceQuery);
            row.querySelector('.php-attr-min').addEventListener('change', triggerAttrPriceQuery);
            row.querySelector('.php-attr-max').addEventListener('change', triggerAttrPriceQuery);

            container.appendChild(row);
        });
    }

    // 更新价格显示与计算建议价格（使用配置项公式）
    function updatePriceDisplay(minPrice, minPriceId, lastDeal, lastDealId, totalCount, infoId) {
        const minPriceEl = document.getElementById('php-min-price');
        const suggestPriceEl = document.getElementById('php-suggest-price');
        const lastDealEl = document.getElementById('php-last-deal');

        if (minPrice && minPrice > 0) {
            minPriceEl.innerHTML = `$${minPrice} <span style="color:#64748b;font-size:11px;">[ID:${minPriceId || 'N/A'}]</span>`;

            // 使用配置项中的公式计算建议价格
            try {
                const cfg = getConfig();
                const formulaFn = new Function('price', 'return ' + cfg.suggestFormula + ';');
                const calculated = formulaFn(minPrice);
                const suggestPrice = Number(calculated).toFixed(2);
                suggestPriceEl.innerHTML = `￥${suggestPrice}`;
            } catch (e) {
                console.error('[比价助手] 建议价格公式计算出错:', e);
                suggestPriceEl.innerHTML = `ERR`;
            }
        } else {
            minPriceEl.innerHTML = '无挂牌';
            suggestPriceEl.innerHTML = '--';
        }

        if (lastDeal) {
            lastDealEl.innerHTML = `$${lastDeal} <span style="color:#64748b;font-size:11px;">[ID:${lastDealId || infoId}]</span>`;
        } else {
            lastDealEl.innerHTML = '前台无此件';
        }
    }

    async function triggerAttrPriceQuery() {
        const currentTr = getCurrentActiveTr();
        const info = parseTrInfo(currentTr);
        if (!info) return;

        const selectedAttrs = getSelectedAttrsFromUI(info.attrs);
        const statusEl = document.getElementById('php-status');
        if (statusEl) statusEl.innerText = '按选定属性重新比价...';

        try {
            const res = await fetchPriceForInfo(info, selectedAttrs);
            currentMinPrice = res.minPrice;

            updatePriceDisplay(res.minPrice, res.minPriceId, res.lastDeal, res.lastDealId, res.totalCount, info.id);
            if (statusEl) statusEl.innerText = '查询成功（共 ' + res.totalCount + ' 件）';
        } catch (err) {
            if (statusEl) statusEl.innerText = typeof err === 'string' ? err : '查询出错';
        }
    }

    async function updateSingleView() {
        if (isCollapsed) return;

        const { rows, isCheckedMode } = getTargetRows();
        const currentTr = getCurrentActiveTr();
        const info = parseTrInfo(currentTr);

        const statusEl = document.getElementById('php-status');
        const detectedEl = document.getElementById('php-detected-title');
        const pageIndicator = document.getElementById('php-page-indicator');

        if (!info) {
            if (detectedEl) detectedEl.innerText = '未检测到有效商品';
            if (statusEl) statusEl.innerText = '请勾选或点击表格行';
            if (pageIndicator) pageIndicator.innerText = '0 / 0';
            renderAttrCheckboxList([]);
            lastRenderedInfoId = null;
            return;
        }

        highlightCurrentRow(currentTr);

        const prefix = isCheckedMode ? '已勾选 ' : '全表 ';
        if (pageIndicator) {
            pageIndicator.innerText = prefix + (checkedIndex + 1) + ' / ' + rows.length;
        }

        if (detectedEl) detectedEl.innerText = info.name + ' [ID:' + info.id + ']';

        if (lastRenderedInfoId !== info.id) {
            lastRenderedInfoId = info.id;
            renderAttrCheckboxList(info.attrs);
        }

        const selectedAttrs = getSelectedAttrsFromUI(info.attrs);
        if (statusEl) statusEl.innerText = '正在探针 ID 并匹配分类...';

        try {
            const res = await fetchPriceForInfo(info, selectedAttrs);
            currentMinPrice = res.minPrice;

            updatePriceDisplay(res.minPrice, res.minPriceId, res.lastDeal, res.lastDealId, res.totalCount, info.id);
            if (statusEl) statusEl.innerText = '查询成功（同属性前台共 ' + res.totalCount + ' 件）';
        } catch (err) {
            if (statusEl) statusEl.innerText = typeof err === 'string' ? err : '查询出错';
        }
    }

    function applyPriceToTr(tr, price) {
        if (!tr || !price || price <= 0) return false;
        const input = tr.querySelector('input[type="number"], input.form-control, td input');
        if (input) {
            input.value = price;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('blur', { bubbles: true }));
            return true;
        }
        return false;
    }

    async function batchProcessAll() {
        const { rows, isCheckedMode } = getTargetRows();
        if (rows.length === 0) return;

        if (!isCheckedMode) {
            if (!confirm('当前未勾选特定行，是否批量查询全表 ' + rows.length + ' 件商品并自动填价？')) {
                return;
            }
        }

        const cfg = getConfig();
        const statusEl = document.getElementById('php-status');

        for (let i = 0; i < rows.length; i++) {
            checkedIndex = i;
            const tr = rows[i];
            const info = parseTrInfo(tr);

            if (!info) continue;

            highlightCurrentRow(tr);
            if (statusEl) statusEl.innerText = '批量处理中 (' + (i + 1) + '/' + rows.length + ')...';

            try {
                const res = await fetchPriceForInfo(info);
                if (res.minPrice > 0) {
                    applyPriceToTr(tr, res.minPrice);
                }
            } catch (e) {
                console.error('[比价助手 批量比价失败]', e);
            }

            await new Promise(r => setTimeout(r, cfg.batchDelay));
        }

        if (statusEl) statusEl.innerText = '✅ 批量更新完成！';
        updateSingleView();
    }

    function createConfigModal() {
        if (document.getElementById('price-helper-config-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'price-helper-config-modal';

        const css = `
            #price-helper-config-modal {
                display: none;
                position: fixed !important;
                top: 0 !important; left: 0 !important;
                width: 100vw !important; height: 100vh !important;
                background: rgba(0, 0, 0, 0.4) !important;
                z-index: 1000000000 !important;
                align-items: center !important;
                justify-content: center !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
            #price-helper-config-modal.show { display: flex !important; }
            .php-modal-content {
                background: #ffffff !important;
                width: 540px !important;
                max-width: 90vw !important;
                padding: 20px !important;
                border-radius: 8px !important;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
                display: flex;
                flex-direction: column;
                max-height: 85vh;
            }
            .php-modal-header { font-size: 16px; font-weight: bold; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            .php-tabs { display: flex; gap: 4px; border-bottom: 2px solid #e2e8f0; margin-bottom: 14px; overflow-x: auto; }
            .php-tab-btn { padding: 6px 10px; border: none; background: none; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap; }
            .php-tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; }
            .php-tab-content { display: none; flex: 1; overflow-y: auto; padding-right: 4px; }
            .php-tab-content.active { display: block; }
            .php-form-group { margin-bottom: 12px; }
            .php-form-group label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
            .php-form-group input, .php-form-group textarea { width: 100%; padding: 6px 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; font-family: monospace; }
            .php-form-group textarea { height: 230px; resize: vertical; line-height: 1.4; }
            .php-modal-actions { margin-top: 14px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 12px; }
            .php-modal-btn-group { display: flex; gap: 8px; }
            .php-modal-btn { padding: 6px 14px; font-size: 12px; border-radius: 4px; border: none; cursor: pointer; }
            .php-btn-save { background: #2563eb; color: white; }
            .php-btn-cancel { background: #e2e8f0; color: #475569; }
            .php-btn-reset { background: #ef4444; color: white; }
        `;

        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        modal.appendChild(styleEl);

        const container = document.createElement('div');
        container.className = 'php-modal-content';
        container.innerHTML = `
            <div class="php-modal-header">
                <span>⚙️ 助手参数与全字典配置</span>
                <span id="php-cfg-close" style="cursor:pointer;color:#94a3b8;">✖</span>
            </div>
            <div class="php-tabs">
                <button class="php-tab-btn active" data-tab="tab-base">⚙️ 基础参数</button>
                <button class="php-tab-btn" data-tab="tab-tmethod">🏷️ 探针大类 (TMETHOD)</button>
                <button class="php-tab-btn" data-tab="tab-affix">✨ 词缀字典 (Affixes)</button>
            </div>
            <div class="php-tab-content active" id="tab-base">
                <div class="php-form-group">
                    <label>前台 API 接口 URL:</label>
                    <input type="text" id="cfg-apiEndpoint" />
                </div>
                <div class="php-form-group">
                    <label>游戏标识 (gamesort):</label>
                    <input type="text" id="cfg-gameSort" />
                </div>
                <div class="php-form-group">
                    <label>服务器名称 (servername):</label>
                    <input type="text" id="cfg-serverName" />
                </div>
                <div class="php-form-group">
                    <label>建议价格计算公式 (可用变量 price):</label>
                    <input type="text" id="cfg-suggestFormula" />
                </div>
                <div class="php-form-group">
                    <label>压价优惠金额 (元):</label>
                    <input type="number" step="0.1" id="cfg-beatPriceAmount" />
                </div>
                <div class="php-form-group">
                    <label>批量请求间隔 (毫秒):</label>
                    <input type="number" id="cfg-batchDelay" />
                </div>
            </div>
            <div class="php-tab-content" id="tab-tmethod">
                <div class="php-form-group">
                    <label>常用探针大类映射 (JSON 格式):</label>
                    <textarea id="cfg-tmethodMap"></textarea>
                </div>
            </div>
            <div class="php-tab-content" id="tab-affix">
                <div class="php-form-group">
                    <label>词缀匹配字典 (JSON 格式):</label>
                    <textarea id="cfg-affixKeywords"></textarea>
                </div>
            </div>
            <div class="php-modal-actions">
                <button class="php-modal-btn php-btn-reset" id="php-cfg-reset">🔄 重置恢复默认</button>
                <div class="php-modal-btn-group">
                    <button class="php-modal-btn php-btn-cancel" id="php-cfg-cancel">取消</button>
                    <button class="php-modal-btn php-btn-save" id="php-cfg-save">保存配置</button>
                </div>
            </div>
        `;

        modal.appendChild(container);
        document.body.appendChild(modal);

        modal.querySelectorAll('.php-tab-btn').forEach(btn => {
            btn.onclick = () => {
                modal.querySelectorAll('.php-tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.php-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                modal.querySelector('#' + btn.dataset.tab).classList.add('active');
            };
        });

        const closeModal = () => modal.classList.remove('show');
        document.getElementById('php-cfg-close').onclick = closeModal;
        document.getElementById('php-cfg-cancel').onclick = closeModal;

        document.getElementById('php-cfg-reset').onclick = () => {
            if (confirm('⚠️ 确定要清空已保存的配置，并还原为默认设置吗？')) {
                resetAllConfigsToDefault();
                closeModal();
                updateSingleView();
                alert('✅ 已恢复默认配置！');
            }
        };

        document.getElementById('php-cfg-save').onclick = () => {
            try {
                const tmethodRaw = document.getElementById('cfg-tmethodMap').value;
                const affixRaw = document.getElementById('cfg-affixKeywords').value;
                JSON.parse(tmethodRaw);
                JSON.parse(affixRaw);

                GM_setValue('cfg_apiEndpoint', document.getElementById('cfg-apiEndpoint').value.trim());
                GM_setValue('cfg_gameSort', document.getElementById('cfg-gameSort').value.trim());
                GM_setValue('cfg_serverName', document.getElementById('cfg-serverName').value.trim());
                GM_setValue('cfg_suggestFormula', document.getElementById('cfg-suggestFormula').value.trim());
                GM_setValue('cfg_beatPriceAmount', document.getElementById('cfg-beatPriceAmount').value);
                GM_setValue('cfg_batchDelay', document.getElementById('cfg-batchDelay').value);
                GM_setValue('cfg_tmethodMap', tmethodRaw);
                GM_setValue('cfg_affixKeywords', affixRaw);

                closeModal();
                updateSingleView();
                alert('✅ 所有配置已保存并生效！');
            } catch (err) {
                alert('❌ 保存失败：请输入正确的配置格式！\n错误信息：' + err.message);
            }
        };
    }

    function openConfigModal() {
        createConfigModal();
        const cfg = getConfig();
        document.getElementById('cfg-apiEndpoint').value = cfg.apiEndpoint;
        document.getElementById('cfg-gameSort').value = cfg.gameSort;
        document.getElementById('cfg-serverName').value = cfg.serverName;
        document.getElementById('cfg-suggestFormula').value = cfg.suggestFormula;
        document.getElementById('cfg-beatPriceAmount').value = cfg.beatPriceAmount;
        document.getElementById('cfg-batchDelay').value = cfg.batchDelay;
        document.getElementById('cfg-tmethodMap').value = JSON.stringify(getTmethodMap(), null, 2);
        document.getElementById('cfg-affixKeywords').value = JSON.stringify(getAffixKeywords(), null, 2);
        document.getElementById('price-helper-config-modal').classList.add('show');
    }

    function createWidget() {
        if (document.getElementById('price-helper-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'price-helper-panel';

        const cssStyle = `
            #price-helper-panel {
                position: fixed !important;
                bottom: 25px !important;
                right: 25px !important;
                width: 320px !important;
                background: #ffffff !important;
                border: 1px solid #e4e7ed !important;
                box-shadow: 0 4px 16px rgba(0,0,0,0.25) !important;
                border-radius: 10px !important;
                padding: 14px !important;
                z-index: 999999999 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 13px !important;
                color: #333 !important;
                transition: all 0.25s ease-in-out !important;
            }
            #price-helper-panel.collapsed {
                width: 44px !important;
                height: 44px !important;
                padding: 0 !important;
                border-radius: 50% !important;
                overflow: hidden !important;
                cursor: pointer !important;
                background: #2563eb !important;
                border: none !important;
                box-shadow: 0 4px 12px rgba(37,99,235,0.4) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            #price-helper-panel.collapsed .php-body { display: none !important; }
            #price-helper-panel.collapsed .php-collapsed-btn { display: flex !important; }
            .php-collapsed-btn { display: none; color: white; font-size: 18px; font-weight: bold; user-select: none; }
            .php-title { font-weight: bold; margin-bottom: 8px; font-size: 14px; color: #1f2937; display: flex; justify-content: space-between; align-items: center; }
            .php-controls { display: flex; gap: 8px; align-items: center; }
            .php-icon-btn { cursor: pointer; color: #64748b; font-size: 14px; transition: color 0.2s; }
            .php-icon-btn:hover { color: #2563eb; }
            .php-pager { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; margin-bottom: 8px; }
            .php-page-btn { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; padding: 2px 8px; font-size: 12px; font-weight: bold; color: #334155; }
            .php-page-btn:hover { background: #f1f5f9; color: #0f172a; }
            #php-page-indicator { font-size: 12px; font-weight: 600; color: #475569; }
            .php-row { display: flex; justify-content: space-between; margin: 6px 0; align-items: center; }
            .php-price { font-weight: bold; color: #e11d48; text-align: right; }
            .php-suggest-price { font-weight: bold; color: #059669; text-align: right; }
            .php-item { font-size: 12px; color: #4b5563; background: #f3f4f6; padding: 6px 8px; border-radius: 4px; margin-bottom: 8px; word-break: break-all; display: flex; align-items: center; gap: 6px; }
            .php-attr-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; max-height: 150px; overflow-y: auto; }
            .php-attr-header { font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 6px; display: flex; justify-content: space-between; }
            .php-attr-item-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; font-size: 11px; color: #334155; margin-bottom: 4px; }
            .php-attr-left { display: flex; align-items: center; gap: 4px; overflow: hidden; flex: 1; }
            .php-attr-cb { cursor: pointer; margin: 0; flex-shrink: 0; }
            .php-attr-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px; }
            .php-attr-inputs { display: flex; gap: 3px; flex-shrink: 0; }
            .php-attr-num-input { width: 38px !important; padding: 1px 3px !important; font-size: 11px !important; border: 1px solid #cbd5e1 !important; border-radius: 3px !important; text-align: center !important; background: #ffffff !important; color: #0f172a !important; }
            .php-btn-group { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .php-btn { padding: 6px 0; border: none; background: #2563eb; color: white; border-radius: 4px; cursor: pointer; font-size: 12px; text-align: center; }
            .php-btn:hover { background: #1d4ed8; }
            .php-btn-sub { background: #059669; }
            .php-btn-sub:hover { background: #047857; }
            .php-btn-batch { background: #7c3aed; grid-column: span 2; font-weight: bold; }
            .php-btn-batch:hover { background: #6d28d9; }
            #php-status { font-size: 11px; color: #6b7280; margin-top: 6px; }
        `;

        const styleEl = document.createElement('style');
        styleEl.textContent = cssStyle;
        panel.appendChild(styleEl);

        const container = document.createElement('div');
        container.style.width = '100%';
        container.innerHTML = `
            <div class="php-collapsed-btn" id="php-expand-btn" title="点击展开比价助手">💰</div>
            <div class="php-body">
                <div class="php-title">
                    <span>🔥 实时比价助手</span>
                    <div class="php-controls">
                        <span class="php-icon-btn" id="php-config-btn" title="打开设置">⚙️</span>
                        <span class="php-icon-btn" id="php-refresh" title="刷新当前">🔄</span>
                        <span class="php-icon-btn" id="php-toggle-collapse" title="收起隐藏">➖</span>
                    </div>
                </div>
                <div class="php-pager">
                    <button class="php-page-btn" id="btn-prev-item">◀ 上一件</button>
                    <span id="php-page-indicator">0 / 0</span>
                    <button class="php-page-btn" id="btn-next-item">下一件 ▶</button>
                </div>

                <div class="php-item">
                    <input type="checkbox" id="php-matchname-cb" title="勾选则作为 matchname 参数传递" style="cursor:pointer;" />
                    <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="辨识商品">名称: <b id="php-detected-title">检测中...</b></span>
                </div>

                <div class="php-attr-box">
                    <div class="php-attr-header">
                        <span>当前装备属性：</span>
                        <span>最小值 / 最大值</span>
                    </div>
                    <div id="php-attr-list"></div>
                </div>

                <div class="php-row">
                    <span>前台同名最低价：</span>
                    <span class="php-price" id="php-min-price">--</span>
                </div>
                <div class="php-row">
                    <span>💡 建议价格：</span>
                    <span class="php-suggest-price" id="php-suggest-price">--</span>
                </div>
                <div class="php-row">
                    <span>本件前台挂牌价：</span>
                    <span class="php-price" id="php-last-deal">--</span>
                </div>
                <div id="php-status">面板就绪</div>
                <div class="php-btn-group">
                    <button class="php-btn" id="btn-apply-min">填充当前行最低价</button>
                    <button class="php-btn php-btn-sub" id="btn-apply-beat">最低价压价</button>
                    <button class="php-btn php-btn-batch" id="btn-apply-batch">⚡ 批量查询并自动填充</button>
                </div>
            </div>
        `;

        panel.appendChild(container);
        (document.body || document.documentElement).appendChild(panel);

        const toggleCollapse = () => {
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                panel.classList.add('collapsed');
            } else {
                panel.classList.remove('collapsed');
                updateSingleView();
            }
        };

        document.getElementById('php-toggle-collapse').onclick = toggleCollapse;
        document.getElementById('php-expand-btn').onclick = toggleCollapse;
        document.getElementById('php-refresh').onclick = updateSingleView;
        document.getElementById('php-config-btn').onclick = openConfigModal;

        document.getElementById('php-matchname-cb').addEventListener('change', updateSingleView);

        document.getElementById('btn-prev-item').onclick = () => {
            const { rows } = getTargetRows();
            if (rows.length === 0) return;
            checkedIndex = (checkedIndex - 1 + rows.length) % rows.length;
            updateSingleView();
        };

        document.getElementById('btn-next-item').onclick = () => {
            const { rows } = getTargetRows();
            if (rows.length === 0) return;
            checkedIndex = (checkedIndex + 1) % rows.length;
            updateSingleView();
        };

        document.getElementById('btn-apply-min').onclick = () => {
            if (applyPriceToTr(getCurrentActiveTr(), currentMinPrice)) {
                document.getElementById('php-status').innerText = '已填入当前行！';
            }
        };

        document.getElementById('btn-apply-beat').onclick = () => {
            const beatVal = getConfig().beatPriceAmount;
            const price = currentMinPrice > beatVal ? currentMinPrice - beatVal : currentMinPrice;
            if (applyPriceToTr(getCurrentActiveTr(), price)) {
                document.getElementById('php-status').innerText = '已填入当前行 ($' + price + ')！';
            }
        };

        document.getElementById('btn-apply-batch').onclick = batchProcessAll;
    }

    function bindEvents() {
        if (typeof GM_registerMenuCommand !== 'undefined') {
            GM_registerMenuCommand('⚙️ 打开参数与字典配置页', openConfigModal);
        }

        document.addEventListener('click', (e) => {
            const tr = e.target.closest('tbody tr');
            if (tr && parseTrInfo(tr)) {
                const { rows } = getTargetRows();
                const idx = rows.indexOf(tr);
                if (idx !== -1) {
                    checkedIndex = idx;
                }
                updateSingleView();
            }
        }, true);

        document.addEventListener('change', (e) => {
            if (e.target && e.target.type === 'checkbox' && !e.target.closest('#price-helper-panel')) {
                checkedIndex = 0;
                setTimeout(updateSingleView, 50);
            }
        }, true);
    }

    function init() {
        createWidget();
        createConfigModal();
        bindEvents();
        updateSingleView();
        setInterval(createWidget, 1000);
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        window.addEventListener('DOMContentLoaded', init);
    }
})();