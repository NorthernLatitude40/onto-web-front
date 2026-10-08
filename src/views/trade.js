// ==UserScript==
// @name         后台上架自动比价与一键填价助手(可收起隐藏版)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  支持面板收起/展开，精准识别太古星星(g:1)，匹配词缀字典并实现一键/批量填价（适配两级 API 分类参数）
// @match        *://*.game7power.com/*
// @match        *://game7power.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @connect      www.aoeah.com
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const FRONTEND_API = 'https://www.aoeah.com/api/goods';
    let currentMinPrice = 0;
    let checkedIndex = 0;
    let isCollapsed = false;

    // --- 1. 词缀关键字映射字典 ---
    const d4AffixKeywords = {
        // 基础属性 (Core Stats)
        'Maximum Life':                         { key: 'maximum_life', value: 'Maximum Life' },
        'Willpower':                            { key: 'willpower', value: 'Willpower' },
        'Strength':                             { key: 'strength', value: 'Strength' },
        'Dexterity':                            { key: 'dexterity', value: 'Dexterity' },
        'Intelligence':                         { key: 'intelligence', value: 'Intelligence' },

        // 伤害与倍率 (Damage & Multipliers)
        'Weapon Damage':                        { key: 'weapon_damage', value: 'Weapon Damage' },
        'x Critical Strike Damage Multiplier':  { key: 'crit_damage_mult', value: 'x Critical Strike Damage Multiplier' },
        'Critical Strike Damage':               { key: 'crit_damage', value: 'Critical Strike Damage' },
        'Critical Strike Chance':               { key: 'crit_chance', value: 'Critical Strike Chance' },
        'Overpower Damage':                     { key: 'overpower_damage', value: 'Overpower Damage' },
        'Vulnerable Damage':                    { key: 'vulnerable_damage', value: 'Vulnerable Damage' },
        'Attack Speed':                         { key: 'attack_speed', value: 'Attack Speed' },
        'Cooldown Reduction':                   { key: 'cooldown_reduction', value: 'Bul-Kathos\' Pride: Ancient Skill Cooldown Reduction' },
        'Resource Cost Reduction':              { key: 'resource_cost_reduction', value: 'Resource Cost Reduction' },

        'Up a chance Become Berserking':                    { key: 'up_a_chance_become_berserking', value: 'Berserker\'s Crucible:Lucky Hit: Up a  chance Become Berserking' },

        // 防御与抗性 (Defense & Resistances)
        'Armor':                                { key: 'armor', value: 'Armor' },
        'Damage Reduction':                     { key: 'damage_reduction', value: 'Berserker\'s Crucible: Damage Reduction while Berserking' },
        'All Resistances':                      { key: 'all_resistances', value: 'All Resistances' },
        'Fire Resistance':                      { key: 'fire_resistance', value: 'Fire Resistance' },
        'Cold Resistance':                      { key: 'cold_resistance', value: 'Cold Resistance' },
        'Lightning Resistance':                 { key: 'lightning_resistance', value: 'Lightning Resistance' },
        'Poison Resistance':                    { key: 'poison_resistance', value: 'Poison Resistance' },
        'Shadow Resistance':                    { key: 'shadow_resistance', value: 'Shadow Resistance' }
    };

    // --- 2. 两级分类/部位映射字典 ---
    // 第一级大类 (tmethod)
    const TMETHOD_MAP = {
        'Lair Boss Keys':           '113',
        'Resplendent Spark':        '306',
        'Horadric Cube Materials':  '268',
        'Legendary':                '500', // 装备/传奇类基础分类
        'Rare Items':               '600',
        'Unique Items':             '601',
        'Annihilus':             '601',
        'Talisman':                 '700',
        'Full 7 Of Set Charms':     '800',
        'Runewords':                '22',
        'Runes':                    '21',
        'Unique (Full Affixes)':    '20',
        'Charms & Set Bonuses':     '301',
        'Full Roll Aspect':         '19',
        'Crafting Mythic Runes':    '23',
        'Mythic Unique (Boost)':    '155',
        'Gems & Horadric Gems':     '10',
        'Hot Sale Carry Run':       '305',
        'Junk For Salvage':         '13',
        'Materials (Face To Face)': '30'
    };

    // 第二级部位/类型 (tmethod2)
    const TMETHOD2_MAP = {
        'All':                '',
        'Amulet':             '216',
        'Axe':                '200',
        'Boots':              '217',
        'Bow':                '202',
        'Charm':              '267',
        'Chest Armor':        '218',
        'Crossbow':           '203',
        'Dagger':             '204',
        'Flail':              '256',
        'Focus':              '205',
        'Glaive':             '239',
        'Gloves':             '219',
        'Helm':               '220',
        'Horadric Seal':      '266',
        'Mace':               '206',
        'Other':              '9999',
        'Pants':              '221',
        'Polearm':            '208',
        'Quarterstaff':       '238',
        'Ring':               '222',
        'Scythe':             '209',
        'Shield':             '211',
        'Staff':              '212',
         'Sword':              '213',
         'Totem':              '223',
         'Two-Handed Axe':              '201',
         'Two-Handed Mace':              '207',
         'Two-Handed Scythe':              '210',
         'Two-Handed Sword':              '214',
         'Wand':              '215',

    };

    // 匹配词缀名称的辅助函数
    function matchAffixName(rawText) {
        // 清理文字前缀（如太古符号、加号、数字等）
        const cleanText = rawText.replace(/^[\s\*\u2605\u2733\+\d\,\.\%]+/, '').trim();

        // 遍历字典进行关键字精准或包含匹配
        for (const keyword in d4AffixKeywords) {
            if (cleanText.includes(keyword)) {
                return d4AffixKeywords[keyword].value; // 返回标准化词缀名称
            }
        }
        return cleanText; // 若未命中字典，回退使用清洗后的原始文本
    }

    // --- 3. 从 <tr> 解析商品数据 ---
    function parseTrInfo(tr) {
        if (!tr) return null;

        const nameCell = tr.querySelector('td:nth-child(3)');
        if (!nameCell) return null;

        const text = nameCell.innerText || '';
        const m = text.match(/^(.+?)\s*\[ID:(\d+)\]/m);
        if (!m) return null;

        const name = m[1].trim();

        const id = m[2];

        // 部位/分类单元格
        const slotCell = tr.querySelector('td:nth-child(4)');
        const slotName = slotCell ? slotCell.innerText.trim() : '';

        // 判断大类 (tmethod)：如果商品名字中包含 Unique，则归为 Unique Items，否则默认为 Legendary (600)
        let tmethod = '600';
        if (name.includes('Unique')) {
            tmethod = TMETHOD_MAP['Unique Items'] || '602';
        } else if (TMETHOD_MAP[name]) {
            tmethod = TMETHOD_MAP[name];
        }

        // 部位 (tmethod2)
        const tmethod2 = TMETHOD2_MAP[slotName] || '';

        const affixEls = tr.querySelectorAll('span[class*="affix_"], .ps-2 div');
        const attrs = [];

        affixEls.forEach(el => {
            const attrText = el.innerText.trim();
            if (!attrText) return;

            const isGreater = (el.classList.contains('affix_1') || el.querySelector('.affix_1')) ? '1' : '';

            // 使用 d4AffixKeywords 进行匹配
            const finalAffixName = matchAffixName(attrText);

            if (finalAffixName && !attrs.some(a => a.name === finalAffixName)) {
                attrs.push({
                    name: finalAffixName,
                    m: '',  // 最小值预留
                    m2: '', // 最大值预留
                    isGreater: isGreater
                });
            }
        });

        return { tr, name, id, slotName, tmethod, tmethod2, attrs };
    }

    // --- 4. 获取目标行 ---
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

    // --- 5. 核心 API 动态查询 ---
    function fetchPriceForInfo(info) {
        return new Promise((resolve, reject) => {
            if (!info) return reject('无商品数据');

            const params = new URLSearchParams({
                gamesort: 'D4',
                type: 'Items',
                servername: 'D4 SC Season',
                tmethod: info.tmethod || '600',
                tmethod2: info.tmethod2 || '',
                searchname: '',
                pagesize: '30',
                page: '1',
                ajaxtime: performance.now().toString(),
                matchname: ''
            });

            // 动态挂载属性数组参数
            info.attrs.forEach((attrObj, i) => {
                params.append(`attr[${i}][a]`, attrObj.name);
                params.append(`attr[${i}][m]`, attrObj.m || '');
                params.append(`attr[${i}][m2]`, attrObj.m2 || '');
                if (attrObj.isGreater) {
                    params.append(`attr[${i}][g]`, attrObj.isGreater);
                }
            });

            console.log(`[比价助手 API 请求] ID:${info.id} | ${info.name}`, {
                url: FRONTEND_API,
                rawParams: params.toString(),
                paramObject: Object.fromEntries(params.entries())
            });

            GM_xmlhttpRequest({
                method: 'POST',
                url: FRONTEND_API,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                data: params.toString(),
                onload: function (response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        const items = data.items || [];
                        const prices = items.map(i => parseFloat(i.price)).filter(p => p > 0);
                        const minPrice = prices.length ? Math.min(...prices) : 0;
                        const sameItem = items.find(i => (i.token || '').includes(`[ID:${info.id}]`) || (i.name || '').includes(info.id));

                        resolve({
                            minPrice,
                            lastDeal: sameItem ? sameItem.price : null,
                            totalCount: items.length,
                            info
                        });
                    } catch (e) {
                        reject('解析价格失败');
                    }
                },
                onerror: function () {
                    reject('网络请求失败');
                }
            });
        });
    }

    // --- 6. 刷新浮窗面板视图 ---
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
            return;
        }

        highlightCurrentRow(currentTr);

        const prefix = isCheckedMode ? '已勾选 ' : '全表 ';
        if (pageIndicator) {
            pageIndicator.innerText = prefix + (checkedIndex + 1) + ' / ' + rows.length;
        }

        if (detectedEl) detectedEl.innerText = info.name + ' [ID:' + info.id + ']';
        if (statusEl) statusEl.innerText = '正在查询 [' + info.slotName + '] 价格...';

        try {
            const res = await fetchPriceForInfo(info);
            currentMinPrice = res.minPrice;

            document.getElementById('php-min-price').innerText = res.minPrice ? '￥' + res.minPrice : '无挂牌';
            document.getElementById('php-last-deal').innerText = res.lastDeal ? '￥' + res.lastDeal : '前台无此件';
            if (statusEl) statusEl.innerText = '查询成功（同属性前台共 ' + res.totalCount + ' 件）';
        } catch (err) {
            if (statusEl) statusEl.innerText = typeof err === 'string' ? err : '查询出错';
        }
    }

    // --- 7. 填价逻辑 ---
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

    // --- 8. 批量处理逻辑 ---
    async function batchProcessAll() {
        const { rows, isCheckedMode } = getTargetRows();

        if (rows.length === 0) return;

        if (!isCheckedMode) {
            if (!confirm('当前未勾选特定行，是否批量查询全表 ' + rows.length + ' 件商品并自动填价？')) {
                return;
            }
        }

        const statusEl = document.getElementById('php-status');

        for (let i = 0; i < rows.length; i++) {
            checkedIndex = i;
            const tr = rows[i];
            const info = parseTrInfo(tr);

            if (!info) continue;

            highlightCurrentRow(tr);
            if (statusEl) statusEl.innerText = '批量处理中 (' + (i + 1) + '/' + rows.length + '): ID ' + info.id + '...';

            try {
                const res = await fetchPriceForInfo(info);
                if (res.minPrice > 0) {
                    applyPriceToTr(tr, res.minPrice);
                }
            } catch (e) {
                console.error('[批量比价失败] 行 ' + (i + 1) + ':', e);
            }

            await new Promise(r => setTimeout(r, 600));
        }

        if (statusEl) statusEl.innerText = '✅ 批量更新完成！共处理 ' + rows.length + ' 项';
        updateSingleView();
    }

    // --- 9. 构建 UI 悬浮面板 ---
    function createWidget() {
        if (document.getElementById('price-helper-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'price-helper-panel';

        const cssStyle = `
            #price-helper-panel {
                position: fixed !important;
                bottom: 25px !important;
                right: 25px !important;
                width: 290px !important;
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

            .php-collapsed-btn {
                display: none;
                color: white;
                font-size: 18px;
                font-weight: bold;
                user-select: none;
            }

            .php-title { font-weight: bold; margin-bottom: 8px; font-size: 14px; color: #1f2937; display: flex; justify-content: space-between; align-items: center; }
            .php-controls { display: flex; gap: 8px; align-items: center; }
            .php-icon-btn { cursor: pointer; color: #64748b; font-size: 14px; transition: color 0.2s; }
            .php-icon-btn:hover { color: #2563eb; }
            .php-pager { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; margin-bottom: 8px; }
            .php-page-btn { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; padding: 2px 8px; font-size: 12px; font-weight: bold; color: #334155; }
            .php-page-btn:hover { background: #f1f5f9; color: #0f172a; }
            #php-page-indicator { font-size: 12px; font-weight: 600; color: #475569; }
            .php-row { display: flex; justify-content: space-between; margin: 6px 0; }
            .php-price { font-weight: bold; color: #e11d48; }
            .php-item { font-size: 12px; color: #4b5563; background: #f3f4f6; padding: 6px 8px; border-radius: 4px; margin-bottom: 8px; word-break: break-all; }
            .php-btn-group { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
            .php-btn {
                padding: 6px 0;
                border: none;
                background: #2563eb;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                text-align: center;
                transition: background 0.2s;
            }
            .php-btn:hover { background: #1d4ed8; }
            .php-btn-sub { background: #059669; }
            .php-btn-sub:hover { background: #047857; }
            .php-btn-batch { background: #7c3aed; grid-column: span 2; font-weight: bold; }
            .php-btn-batch:hover { background: #6d28d9; }
            #php-status { font-size: 11px; color: #6b7280; margin-top: 6px; }
        `;

        panel.innerHTML = '<style>' + cssStyle + '</style>' +
            '<div class="php-collapsed-btn" id="php-expand-btn" title="点击展开比价助手">💰</div>' +
            '<div class="php-body">' +
                '<div class="php-title">' +
                    '<span>💰 实时比价助手</span>' +
                    '<div class="php-controls">' +
                        '<span class="php-icon-btn" id="php-refresh" title="刷新当前">🔄</span>' +
                        '<span class="php-icon-btn" id="php-toggle-collapse" title="收起隐藏">➖</span>' +
                    '</div>' +
                '</div>' +
                '<div class="php-pager">' +
                    '<button class="php-page-btn" id="btn-prev-item">◀ 上一件</button>' +
                    '<span id="php-page-indicator">0 / 0</span>' +
                    '<button class="php-page-btn" id="btn-next-item">下一件 ▶</button>' +
                '</div>' +
                '<div class="php-item">辨识商品：<b id="php-detected-title">检测中...</b></div>' +
                '<div class="php-row">' +
                    '<span>前台同名最低价：</span>' +
                    '<span class="php-price" id="php-min-price">--</span>' +
                '</div>' +
                '<div class="php-row">' +
                    '<span>本件前台挂牌价：</span>' +
                    '<span class="php-price" id="php-last-deal">--</span>' +
                '</div>' +
                '<div id="php-status">面板就绪</div>' +
                '<div class="php-btn-group">' +
                    '<button class="php-btn" id="btn-apply-min">填充当前行最低价</button>' +
                    '<button class="php-btn php-btn-sub" id="btn-apply-beat">最低价 -1</button>' +
                    '<button class="php-btn php-btn-batch" id="btn-apply-batch">⚡ 批量查询并自动填充</button>' +
                '</div>' +
            '</div>';

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
            const price = currentMinPrice > 1 ? currentMinPrice - 1 : currentMinPrice;
            if (applyPriceToTr(getCurrentActiveTr(), price)) {
                document.getElementById('php-status').innerText = '已填入当前行 (￥' + price + ')！';
            }
        };

        document.getElementById('btn-apply-batch').onclick = batchProcessAll;
    }

    // --- 10. 全局事件监听 ---
    function bindEvents() {
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
            if (e.target && e.target.type === 'checkbox') {
                checkedIndex = 0;
                setTimeout(updateSingleView, 50);
            }
        }, true);
    }

    function init() {
        createWidget();
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