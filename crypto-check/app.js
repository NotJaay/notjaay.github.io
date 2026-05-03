'use strict';

var backendParam = new URLSearchParams(location.search).get('backend');
var addressParam = new URLSearchParams(location.search).get('address');
var BACKEND = backendParam || ((location.protocol === 'file:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1')
  ? 'http://localhost:8080'
  : 'https://portfolio-api-ar69.onrender.com');

/**
 * @typedef {'in'|'out'} CryptoTxType
 *
 * @typedef {Object} CryptoTransaction
 * @property {string} hash
 * @property {CryptoTxType} type
 * @property {string} amount
 * @property {number} timestamp Unix seconds.
 * @property {string=} from
 * @property {string=} to
 * @property {number} priceAtTime
 * @property {number} valueAtTime
 *
 * @typedef {Object} FIFOResult
 * @property {Array<Object>} openLots
 * @property {Array<Object>} closedLots
 * @property {number} totalRealized
 * @property {number=} totalDeposited
 * @property {number=} totalWithdrawn
 *
 * @typedef {Object} WAVGResult
 * @property {number} avgCost
 * @property {number} totalRealized
 * @property {number=} remainingUnits
 * @property {number=} remainingCost
 * @property {number=} totalDeposited
 * @property {number=} totalWithdrawn
 *
 * @typedef {Object} AssetSummary
 * @property {number} currentValue
 * @property {number} totalDeposited
 * @property {number} totalWithdrawn
 * @property {number} netAtRisk
 * @property {number} unrealizedFIFO
 * @property {number} unrealizedWAVG
 * @property {number} realizedFIFO
 * @property {number} realizedWAVG
 * @property {number} breakEvenPrice
 * @property {number} avgBuyPrice
 * @property {number} houseMoney
 * @property {number} allTimeReturn
 *
 * @typedef {Object} CryptoAsset
 * @property {boolean=} isNative
 * @property {string} chain
 * @property {string} symbol
 * @property {string=} name
 * @property {string|null=} contractAddress
 * @property {string|number} balance
 * @property {number} currentPrice
 * @property {number|null=} priceChange24h
 * @property {number} currentValue
 * @property {CryptoTransaction[]=} transactions
 * @property {FIFOResult=} fifo
 * @property {WAVGResult=} wavg
 * @property {AssetSummary=} summary
 * @property {boolean=} hasPriceData
 *
 * @typedef {Object} WalletData
 * @property {string} address
 * @property {string} chain
 * @property {string|number} balance
 * @property {number} currentPrice
 * @property {number|null=} priceChange24h
 * @property {number} totalValue
 * @property {CryptoTransaction[]} transactions
 * @property {FIFOResult} fifo
 * @property {WAVGResult} wavg
 * @property {AssetSummary} summary
 * @property {CryptoAsset[]} tokens
 * @property {CryptoAsset[]=} allAssets
 * @property {CryptoAsset[]=} _nativeAssets
 * @property {boolean=} partial
 * @property {Object.<string,string>=} errorsByChain
 * @property {Array<{source?: string, message: string}|string>=} warnings
 *
 * @typedef {Object} WalletState
 * @property {string} id
 * @property {string} name
 * @property {string} chain
 * @property {string} address
 * @property {WalletData|null} data
 *
 * @typedef {Object} AssetSelection
 * @property {string=} key
 * @property {boolean} isNative
 * @property {string} symbol
 * @property {string} ticker
 * @property {string} chain
 * @property {string} color
 * @property {string} icon
 * @property {string|number} balance
 * @property {number} currentPrice
 * @property {WalletData|CryptoAsset} data
 */

/* ── Demo data ──────────────────────────────────────────────────────────── */
var DEMO = {
  address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
  chain:   'eth',
  balance: '1.847',
  currentPrice: 3265,
  totalValue: 28340,
  transactions: [
    { type:'in',  amount:'3.333', priceAtTime:1500,  valueAtTime:5000,  timestamp:1615680000, hash:'0xabc123def456abc123def456abc123def456abc1' },
    { type:'in',  amount:'2.703', priceAtTime:3700,  valueAtTime:10000, timestamp:1635900000, hash:'0xdef456abc123def456abc123def456abc123def4' },
    { type:'in',  amount:'4.117', priceAtTime:2000,  valueAtTime:8234,  timestamp:1655600000, hash:'0x890abcdef123456890abcdef123456890abcdef1' },
    { type:'out', amount:'2.857', priceAtTime:4200,  valueAtTime:12000, timestamp:1705000000, hash:'0xfedcba9876543210fedcba9876543210fedcba98' }
  ],
  fifo: {
    openLots: [
      { amount:0.476, originalAmount:3.333, costBasis:714,   priceAtTime:1500, timestamp:1615680000 },
      { amount:2.703, originalAmount:2.703, costBasis:10000, priceAtTime:3700, timestamp:1635900000 },
      { amount:4.117, originalAmount:4.117, costBasis:8234,  priceAtTime:2000, timestamp:1655600000 }
    ],
    closedLots: [{ buyTimestamp:1615680000, sellTimestamp:1705000000, amount:2.857, costBasis:4286, proceeds:12000, gain:7714 }],
    totalRealized: 7714
  },
  wavg:    { avgCost:2288, totalRealized:5464 },
  summary: { currentValue:6028, totalDeposited:23234, totalWithdrawn:12000, netAtRisk:11234,
             unrealizedFIFO:4873, unrealizedWAVG:7124, realizedFIFO:7714, realizedWAVG:5464,
             breakEvenPrice:2597, avgBuyPrice:2288, houseMoney:7714, allTimeReturn:4794 },
  tokens: [
    { symbol:'USDC', name:'USD Coin', contractAddress:'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      balance:8500, currentPrice:1.00, currentValue:8500,
      transactions:[
        { type:'in', amount:'10000', priceAtTime:1.00, valueAtTime:10000, timestamp:1635900000, hash:'0xusdc1' },
        { type:'out', amount:'1500', priceAtTime:1.00, valueAtTime:1500, timestamp:1655600000, hash:'0xusdc2' }
      ],
      fifo:{ openLots:[{ amount:8500, originalAmount:10000, costBasis:8500, priceAtTime:1.00, timestamp:1635900000 }], closedLots:[], totalRealized:0 },
      wavg:{ avgCost:1.00, totalRealized:0 },
      summary:{ currentValue:8500, totalDeposited:10000, totalWithdrawn:1500, netAtRisk:8500,
                unrealizedFIFO:0, unrealizedWAVG:0, realizedFIFO:0, realizedWAVG:0,
                breakEvenPrice:1.00, avgBuyPrice:1.00, houseMoney:0, allTimeReturn:0 }
    },
    { symbol:'LINK', name:'Chainlink', contractAddress:'0x514910771af9ca656af840dff83e8264ecf986ca',
      balance:450, currentPrice:14.20, currentValue:6390,
      transactions:[
        { type:'in', amount:'500', priceAtTime:8.50, valueAtTime:4250, timestamp:1635900000, hash:'0xlink1' },
        { type:'out', amount:'50', priceAtTime:18.00, valueAtTime:900, timestamp:1705000000, hash:'0xlink2' }
      ],
      fifo:{ openLots:[{ amount:450, originalAmount:500, costBasis:3825, priceAtTime:8.50, timestamp:1635900000 }], closedLots:[{ gain:475 }], totalRealized:475 },
      wavg:{ avgCost:8.50, totalRealized:475 },
      summary:{ currentValue:6390, totalDeposited:4250, totalWithdrawn:900, netAtRisk:3350,
                unrealizedFIFO:2565, unrealizedWAVG:2565, realizedFIFO:475, realizedWAVG:475,
                breakEvenPrice:8.50, avgBuyPrice:8.50, houseMoney:475, allTimeReturn:3040 }
    },
    { symbol:'UNI', name:'Uniswap', contractAddress:'0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      balance:200, currentPrice:7.30, currentValue:1460,
      transactions:[
        { type:'in', amount:'200', priceAtTime:22.00, valueAtTime:4400, timestamp:1627000000, hash:'0xuni1' }
      ],
      fifo:{ openLots:[{ amount:200, originalAmount:200, costBasis:4400, priceAtTime:22.00, timestamp:1627000000 }], closedLots:[], totalRealized:0 },
      wavg:{ avgCost:22.00, totalRealized:0 },
      summary:{ currentValue:1460, totalDeposited:4400, totalWithdrawn:0, netAtRisk:4400,
                unrealizedFIFO:-2940, unrealizedWAVG:-2940, realizedFIFO:0, realizedWAVG:0,
                breakEvenPrice:22.00, avgBuyPrice:22.00, houseMoney:0, allTimeReturn:-2940 }
    }
  ]
};

/* ── State ──────────────────────────────────────────────────────────────── */
/** @type {{ wallets: WalletState[], activeWalletId: string|null, isDemo: boolean }} */
var state   = { wallets: [], activeWalletId: null, isDemo: true };
/** @type {AssetSelection|null} */
var _sel    = null;
var _pnlMode = 'fifo';
var _txFilter = 'all';
var _txSort = 'date-desc';
var _chart  = null;
var _chartRange = 'all';

var COIN_COLORS  = { btc:'#f59e0b', eth:'#6c8ef7', base:'#0ea5e9', bnb:'#f59e0b', sol:'#a78bfa', ada:'#22d3ee' };
var COIN_SYMBOLS = { btc:'₿', eth:'Ξ', base:'⬡', bnb:'⬢', sol:'◎', ada:'₳' };
var COIN_NAMES   = { btc:'Bitcoin', eth:'Ethereum', base:'Ethereum (Base)', bnb:'BNB', sol:'Solana', ada:'Cardano' };
var NATIVE_TICKERS = { btc:'BTC', eth:'ETH', base:'ETH', bnb:'BNB', sol:'SOL', ada:'ADA' };
var EXPLORER     = { btc:'https://mempool.space/tx/', eth:'https://etherscan.io/tx/',
                     base:'https://basescan.org/tx/', bnb:'https://bscscan.com/tx/',
                     sol:'https://solscan.io/tx/', ada:'https://cardanoscan.io/transaction/' };

/* ── Formatters ─────────────────────────────────────────────────────────── */
function fmt(n, dec) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dec||2, maximumFractionDigits: dec||2 });
}
function fmtPnl(n) {
  if (n == null || isNaN(n)) return '—';
  return (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
}
function fmtPct(n, dec)  { return n == null ? '' : (n >= 0 ? '+' : '') + n.toFixed(dec||1) + '%'; }
function fmtBal(n, sym) {
  if (n == null || isNaN(n)) return '—';
  var dec = n < 0.01 ? 6 : n < 1 ? 4 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (sym ? ' ' + sym : '');
}
function fmtDate(ts) { return new Date(ts*1000).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }); }
function trunc(s, pre, suf) { return s ? s.slice(0, pre||6) + '…' + s.slice(-(suf||4)) : ''; }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function safeText(s, fallback) {
  return String(s || fallback || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
function finiteNumber(n, fallback) {
  var v = typeof n === 'number' ? n : Number(n);
  return isFinite(v) ? v : (fallback || 0);
}
function asArray(value) { return Array.isArray(value) ? value : []; }
function normalizeTx(tx) {
  if (!tx || (tx.type !== 'in' && tx.type !== 'out')) return null;
  var amount = finiteNumber(tx.amount, 0);
  var timestamp = Math.floor(finiteNumber(tx.timestamp, 0));
  if (amount <= 0 || timestamp <= 0) return null;
  var priceAtTime = finiteNumber(tx.priceAtTime, 0);
  var valueAtTime = finiteNumber(tx.valueAtTime, priceAtTime * amount);
  return {
    hash: String(tx.hash || ''),
    type: tx.type,
    amount: String(amount),
    timestamp: timestamp,
    from: String(tx.from || ''),
    to: String(tx.to || ''),
    priceAtTime: priceAtTime,
    valueAtTime: valueAtTime || priceAtTime * amount,
    assetSymbol: tx.assetSymbol ? String(tx.assetSymbol) : ''
  };
}
function normalizeTxs(txs) { return asArray(txs).map(normalizeTx).filter(Boolean); }
function normalizeLots(lots) {
  return asArray(lots).map(function(lot) {
    return {
      amount: finiteNumber(lot && lot.amount, 0),
      originalAmount: finiteNumber(lot && lot.originalAmount, finiteNumber(lot && lot.amount, 0)),
      costBasis: finiteNumber(lot && lot.costBasis, 0),
      priceAtTime: finiteNumber(lot && lot.priceAtTime, 0),
      timestamp: Math.floor(finiteNumber(lot && lot.timestamp, lot && lot.buyTimestamp)),
      hash: String(lot && (lot.hash || lot.buyHash) || ''),
      buyTimestamp: Math.floor(finiteNumber(lot && lot.buyTimestamp, lot && lot.timestamp)),
      sellTimestamp: Math.floor(finiteNumber(lot && lot.sellTimestamp, 0)),
      buyHash: String(lot && lot.buyHash || ''),
      sellHash: String(lot && lot.sellHash || ''),
      proceeds: finiteNumber(lot && lot.proceeds, 0),
      gain: finiteNumber(lot && lot.gain, 0)
    };
  });
}
function normalizeAccounting(acct) {
  var fifo = acct && acct.fifo || {};
  var wavg = acct && acct.wavg || {};
  var summary = acct && acct.summary || {};
  return {
    fifo: {
      openLots: normalizeLots(fifo.openLots),
      closedLots: normalizeLots(fifo.closedLots),
      totalRealized: finiteNumber(fifo.totalRealized, 0),
      totalDeposited: finiteNumber(fifo.totalDeposited, 0),
      totalWithdrawn: finiteNumber(fifo.totalWithdrawn, 0)
    },
    wavg: {
      avgCost: finiteNumber(wavg.avgCost, 0),
      remainingUnits: finiteNumber(wavg.remainingUnits, 0),
      remainingCost: finiteNumber(wavg.remainingCost, 0),
      totalRealized: finiteNumber(wavg.totalRealized, 0),
      totalDeposited: finiteNumber(wavg.totalDeposited, 0),
      totalWithdrawn: finiteNumber(wavg.totalWithdrawn, 0)
    },
    summary: {
      currentValue: finiteNumber(summary.currentValue, 0),
      totalDeposited: finiteNumber(summary.totalDeposited, 0),
      totalWithdrawn: finiteNumber(summary.totalWithdrawn, 0),
      netAtRisk: finiteNumber(summary.netAtRisk, 0),
      unrealizedFIFO: finiteNumber(summary.unrealizedFIFO, 0),
      unrealizedWAVG: finiteNumber(summary.unrealizedWAVG, 0),
      realizedFIFO: finiteNumber(summary.realizedFIFO, 0),
      realizedWAVG: finiteNumber(summary.realizedWAVG, 0),
      breakEvenPrice: finiteNumber(summary.breakEvenPrice, 0),
      avgBuyPrice: finiteNumber(summary.avgBuyPrice, 0),
      houseMoney: finiteNumber(summary.houseMoney, 0),
      allTimeReturn: finiteNumber(summary.allTimeReturn, 0)
    }
  };
}
function normalizeAsset(raw, fallbackChain) {
  if (!raw) return null;
  var acct = normalizeAccounting(raw);
  var balance = finiteNumber(raw.balance, 0);
  return {
    isNative: !!raw.isNative,
    chain: safeText(raw.chain, fallbackChain || 'eth').toLowerCase(),
    symbol: safeText(raw.symbol, raw.isNative ? (fallbackChain || 'ETH') : 'TOKEN').toUpperCase(),
    name: safeText(raw.name, raw.symbol || 'Token'),
    contractAddress: raw.contractAddress || null,
    balance: balance,
    currentPrice: finiteNumber(raw.currentPrice, 0),
    priceChange24h: raw.priceChange24h == null ? null : finiteNumber(raw.priceChange24h, 0),
    currentValue: finiteNumber(raw.currentValue, acct.summary.currentValue),
    transactions: normalizeTxs(raw.transactions),
    fifo: acct.fifo,
    wavg: acct.wavg,
    summary: acct.summary,
    hasPriceData: raw.hasPriceData !== false,
    priceWarning: raw.priceWarning || null
  };
}
function normalizeWalletData(raw, fallbackChain) {
  var acct = normalizeAccounting(raw || {});
  var chain = safeText(raw && raw.chain, fallbackChain || 'eth').toLowerCase();
  var tokens = asArray(raw && raw.tokens).map(function(t){ return normalizeAsset(t, chain); }).filter(Boolean);
  var nativeAssets = asArray(raw && raw._nativeAssets).map(function(a){ return normalizeAsset(a, a && a.chain || chain); }).filter(Boolean);
  var allAssets = asArray(raw && raw.allAssets).map(function(a){ return normalizeAsset(a, a && a.chain || chain); }).filter(Boolean);
  return {
    address: String(raw && raw.address || ''),
    chain: chain,
    balance: String(raw && raw.balance != null ? raw.balance : '0'),
    currentPrice: finiteNumber(raw && raw.currentPrice, 0),
    priceChange24h: !raw || raw.priceChange24h == null ? null : finiteNumber(raw.priceChange24h, 0),
    transactions: normalizeTxs(raw && raw.transactions),
    fifo: acct.fifo,
    wavg: acct.wavg,
    summary: acct.summary,
    tokens: tokens,
    _nativeAssets: nativeAssets,
    allAssets: allAssets.length ? allAssets : nativeAssets.concat(tokens),
    totalValue: finiteNumber(raw && raw.totalValue, acct.summary.currentValue + tokens.reduce(function(s,t){ return s + t.currentValue; }, 0)),
    aggregateSummary: raw && raw.aggregateSummary ? normalizeAccounting({ summary: raw.aggregateSummary }).summary : null,
    partial: !!(raw && raw.partial),
    errorsByChain: raw && raw.errorsByChain || {},
    warnings: asArray(raw && raw.warnings)
  };
}
function nativeTicker(chain) { return NATIVE_TICKERS[chain] || String(chain || '').toUpperCase(); }
function activeWallet() {
  return state.wallets.find(function (w) { return w.id === state.activeWalletId; }) || null;
}
function setDisplay(id, display) { document.getElementById(id).style.display = display; }
function hideViews(ids) { ids.forEach(function (id) { setDisplay(id, 'none'); }); }

/* ── Chain detection ────────────────────────────────────────────────────── */
function detectChain(addr) {
  addr = addr.trim();
  if (/^bc1[a-z0-9]{25,62}$/i.test(addr)) return 'btc';
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'evm';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return 'sol';
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) return 'btc';
  if (/^addr1[a-z0-9]{50,}$/.test(addr)) return 'ada';
  return null;
}

/* ── Input wiring ───────────────────────────────────────────────────────── */
['addr-input','wallet-name-input'].forEach(function (id) {
  document.getElementById(id).addEventListener('keydown', function (e) { if (e.key==='Enter') handleLookup(); });
});

/* ── Lookup & loading ───────────────────────────────────────────────────── */
async function handleLookup() {
  var addr = document.getElementById('addr-input').value.trim();
  var name = document.getElementById('wallet-name-input').value.trim() || trunc(addr, 6, 4);
  if (!addr) return;
  var detected = detectChain(addr);
  if (!detected) { showError('Unrecognized address format. Supports BTC · ETH (0x…) · SOL · ADA (addr1…)'); return; }

  // A 0x address is scanned across the configured EVM chains.
  var chain = detected === 'evm' ? 'evm-all' : detected;
  var existing = state.wallets.find(function (w) { return w.address === addr && w.chain === chain; });
  if (existing) { selectWallet(existing.id); return; }
  var id = Date.now().toString();
  state.wallets.push({ id:id, name:name, chain:chain, address:addr, data:null });
  state.isDemo = false;
  _sel = null;
  renderSidebar();
  selectWallet(id);
  await loadWallet(state.wallets[state.wallets.length - 1]);
}
function showAddWallet() { document.getElementById('addr-input').focus(); }

/**
 * Normalize /api/crypto/portfolio/evm into the same shape used by single-chain wallets.
 * @param {Object} raw
 * @returns {WalletData}
 */
function normalizeEvmPortfolioData(raw) {
  raw = raw || {};
  var allAssets = asArray(raw && raw.allAssets);
  return normalizeWalletData({
    address:   raw.address,
    chain:     'evm-all',
    totalValue: raw.totalValue,
    tokens:    allAssets.filter(function(a){ return !a.isNative; }),
    _nativeAssets: allAssets.filter(function(a){ return a.isNative; }),
    allAssets: allAssets,
    summary:   raw.aggregateSummary,
    partial:   !!raw.partial,
    errorsByChain: raw.errorsByChain || {},
    warnings:  raw.warnings || [],
    balance:   '0',
    currentPrice: 0,
    transactions: [],
    fifo: { openLots:[], closedLots:[], totalRealized:0 },
    wavg: { avgCost:0, totalRealized:0 }
  }, 'evm-all');
}

/**
 * @param {WalletState} wallet
 * @returns {Promise<void>}
 */
async function loadWallet(wallet) {
  var isEvmAll = wallet.chain === 'evm-all';
  var loadMsg = isEvmAll
    ? 'Scanning Ethereum · fetching balances, transfers, and priced assets…'
    : 'Scanning ' + wallet.chain.toUpperCase() + ' · fetching all assets…';
  showLoading(loadMsg);
  try {
    var url = isEvmAll
      ? BACKEND + '/api/crypto/portfolio/evm/' + wallet.address
      : BACKEND + '/api/crypto/wallet/' + wallet.chain + '/' + wallet.address;
    var resp = await fetch(url, { signal: AbortSignal.timeout(180000) });
    if (!resp.ok) {
      var e = await safeJson(resp);
      throw new Error((e && e.error) || resp.statusText || ('HTTP ' + resp.status));
    }
    var raw = await resp.json();
    wallet.data = isEvmAll ? normalizeEvmPortfolioData(raw) : normalizeWalletData(raw, wallet.chain);
    _sel = makeWalletSel(wallet.data);
    renderSidebar();
    renderDashboard();
  } catch (e) {
    showError('Failed to load: ' + e.message);
    state.wallets = state.wallets.filter(function (w) { return w.id !== wallet.id; });
    if (!state.wallets.length) { state.isDemo = true; _sel = null; }
    renderSidebar();
    if (state.isDemo) renderDashboard();
  }
}
async function safeJson(resp) {
  try {
    return await resp.json();
  } catch (e) {
    console.warn('Backend returned non-JSON response: ' + e.message);
    return null;
  }
}

/**
 * @param {WalletData} data
 * @returns {AssetSelection}
 */
function makeNativeSel(data) {
  if (data.chain === 'evm-all') {
    var first = (data._nativeAssets || data.allAssets || []).find(function(a){ return a.isNative && parseFloat(a.balance||'0') > 0; });
    if (first) return makeAssetSel(first);
    return { isNative:true, symbol:'Portfolio', ticker:'ALL', chain:'evm-all',
             color:'#6c8ef7', icon:'◈', balance:0, currentPrice:0, data: data };
  }
  return { isNative:true, symbol: COIN_NAMES[data.chain]||data.chain.toUpperCase(),
           ticker: nativeTicker(data.chain),
           chain: data.chain, color: COIN_COLORS[data.chain]||'#6c8ef7',
           icon: COIN_SYMBOLS[data.chain]||'?',
           balance: parseFloat(data.balance), currentPrice: data.currentPrice,
           data: data };
}
function makeWalletSel(data) {
  var aggregate = data.aggregateSummary || data.summary || {};
  var symbolByChain = { eth:'ETH', btc:'BTC', sol:'SOL', ada:'ADA', base:'ETH', bnb:'BNB' };
  var txs = [];
  (data.transactions || []).forEach(function(tx) {
    txs.push(Object.assign({ assetSymbol: symbolByChain[data.chain] || nativeTicker(data.chain) }, tx));
  });
  (data.tokens || []).forEach(function(token) {
    (token.transactions || []).forEach(function(tx) {
      txs.push(Object.assign({ assetSymbol: token.symbol || 'TOKEN' }, tx));
    });
  });
  return {
    key: 'wallet:' + data.chain,
    isWallet: true,
    isNative: false,
    symbol: 'Wallet',
    ticker: 'ALL',
    chain: data.chain,
    color: '#5fe4d0',
    icon: '∑',
    balance: 0,
    currentPrice: 0,
    data: {
      summary: aggregate,
      fifo: { openLots: [], closedLots: [], totalRealized: aggregate.realizedFIFO || 0 },
      wavg: { avgCost: 0, totalRealized: aggregate.realizedWAVG || 0 },
      transactions: txs.sort(function(a, b) { return b.timestamp - a.timestamp; }),
      currentPrice: 0
    }
  };
}
/**
 * @param {CryptoAsset} asset
 * @returns {AssetSelection}
 */
function makeAssetSel(asset) {
  var isNative = asset.isNative;
  return {
    key: (isNative ? 'native' : 'token') + ':' + asset.chain + ':' + (asset.contractAddress || asset.symbol || ''),
    isNative: isNative,
    symbol: isNative ? (COIN_NAMES[asset.chain]||asset.chain.toUpperCase()) : safeText(asset.name, asset.symbol),
    ticker: isNative ? nativeTicker(asset.chain) : safeText(asset.symbol, 'TOKEN'),
    chain: asset.chain,
    color: isNative ? (COIN_COLORS[asset.chain]||'#6c8ef7') : '#8b8fa8',
    icon: isNative ? (COIN_SYMBOLS[asset.chain]||'?') : (asset.symbol||'?').slice(0,3),
    balance: isNative ? parseFloat(asset.balance||'0') : (asset.balance||0),
    currentPrice: asset.currentPrice||0,
    data: asset
  };
}
/**
 * @param {CryptoAsset} token
 * @param {string} chain
 * @returns {AssetSelection}
 */
function makeTokenSel(token, chain) {
  return { key:'token:' + chain + ':' + (token.contractAddress || token.symbol || ''),
           isNative:false, symbol:safeText(token.name, token.symbol), ticker:safeText(token.symbol, 'TOKEN'),
           chain:chain, color: tokenColor(token.symbol), icon: (token.symbol||'?').slice(0,3),
           balance: token.balance, currentPrice: token.currentPrice,
           hasPriceData: token.hasPriceData !== false,
           data: token };
}

function selectWallet(id) {
  state.activeWalletId = id;
  document.querySelectorAll('.wallet-item').forEach(function (el) {
    el.classList.toggle('active', el.dataset.wid === id);
  });
  var w = activeWallet();
  if (w && w.data) _sel = makeWalletSel(w.data);
  renderDashboard();
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
function renderSidebar() {
  var list = document.getElementById('wallet-list');
  list.innerHTML = '';
  state.wallets.forEach(function (w) {
    var val = w.data ? fmt(w.data.totalValue) : '<span style="color:var(--dim)">Scanning…</span>';
    var el  = document.createElement('div');
    el.className = 'wallet-item' + (state.activeWalletId === w.id ? ' active' : '');
    el.dataset.wid = w.id;
    el.innerHTML =
      '<div class="wi-name">' + esc(w.name) + '</div>' +
      '<div class="wi-addr">' + trunc(w.address) + '</div>' +
      '<div class="wi-chain">' + w.chain.toUpperCase() + '</div>' +
      '<div class="wi-val">' + val + '</div>';
    el.onclick = function () { selectWallet(w.id); };
    list.appendChild(el);
  });
  var loaded = state.wallets.filter(function (w) { return w.data; });
  if (loaded.length > 1) {
    var total = loaded.reduce(function (s, w) { return s + w.data.totalValue; }, 0);
    var pnl   = loaded.reduce(function (s, w) { return s + w.data.summary.allTimeReturn; }, 0);
    document.getElementById('sidebar-total').style.display = 'block';
    document.getElementById('st-total-val').textContent = fmt(total);
    var p = document.getElementById('st-total-pnl');
    p.textContent = fmtPnl(pnl) + ' all-time';
    p.className = 'st-pnl ' + (pnl >= 0 ? 'c-green' : 'c-red');
  } else {
    document.getElementById('sidebar-total').style.display = 'none';
  }
}

/* ── View helpers ───────────────────────────────────────────────────────── */
function showLoading(msg) {
  hideViews(['empty-state','error-state','dashboard']);
  document.getElementById('loading-msg').textContent = msg||'Loading…';
  setDisplay('loading-state', 'flex');
}
function showError(msg) {
  hideViews(['loading-state','dashboard','empty-state']);
  document.getElementById('error-msg').textContent = msg;
  setDisplay('error-state', 'flex');
}
function showDashboard() {
  hideViews(['loading-state','empty-state','error-state']);
  setDisplay('dashboard', 'block');
}

function getWalletData() {
  if (state.isDemo) return DEMO;
  var w = activeWallet();
  return w && w.data ? w.data : null;
}
function getChain() {
  if (state.isDemo) return 'eth';
  var w = activeWallet();
  return w ? w.chain : 'eth';
}

/* ── Dashboard ──────────────────────────────────────────────────────────── */
function renderDashboard() {
  var walletData = getWalletData();
  if (!walletData) { document.getElementById('dashboard').style.display='none'; return; }

  if (!_sel) _sel = state.isDemo ? makeWalletSel(DEMO) : makeWalletSel(walletData);

  var titleEl = document.getElementById('topbar-title');
  if (state.isDemo) {
    titleEl.innerHTML = 'WalletTracker &nbsp;<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#fbbf2420;color:#fbbf24;border:1px solid #fbbf2440">DEMO</span>';
  } else {
    var activeW = activeWallet() || {};
    var chainLabel = activeW.chain === 'evm-all' ? 'ETH' : (activeW.chain||'').toUpperCase();
    titleEl.textContent = (activeW.name||'Wallet') + ' · ' + chainLabel;
  }

  var banner = document.getElementById('demo-banner');
  if (banner) banner.style.display = state.isDemo ? 'flex' : 'none';
  renderDataWarnings(walletData);

  showDashboard();
  renderStatStrip(walletData, state.isDemo);
  renderChart(walletData);
  renderHoldings(walletData, getChain(), state.isDemo);
  renderRightPanels(_sel, state.isDemo);
}

function renderDataWarnings(data) {
  var box = document.getElementById('data-warnings');
  if (!box) return;
  var warnings = (data && data.warnings ? data.warnings.slice() : []);
  if (data && data.partial) {
    var failed = Object.keys(data.errorsByChain || {}).map(function(c){ return c.toUpperCase(); }).join(', ');
    warnings.unshift({ message: failed ? 'Partial scan: ' + failed + ' unavailable.' : 'Partial scan: one or more networks unavailable.' });
  }
  if (!warnings.length) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  box.style.display = 'flex';
  box.innerHTML = warnings.slice(0, 4).map(function(w) {
    return '<span class="warn-pill">' + esc(w.message || String(w)) + '</span>';
  }).join('');
}

/* ── Stat strip — aggregate across ALL assets ───────────────────────────── */
function renderStatStrip(data, isDemo) {
  var s      = data.aggregateSummary || data.summary || {};
  var isMulti = data.chain === 'evm-all';

  var totalVal, totalUnreal, totalReal, totalDeposit, totalWithdraw, totalReturn, assetCount;

  if (isMulti) {
    var allAssets = data.allAssets || [];
    totalVal      = data.totalValue || 0;
    var pricedAssets = allAssets.filter(function(a){ return a.hasPriceData !== false; });
    totalUnreal   = pricedAssets.reduce(function(sum,a){ return sum+((a.summary||{}).unrealizedFIFO||0); }, 0);
    totalReal     = pricedAssets.reduce(function(sum,a){ return sum+((a.summary||{}).realizedFIFO||0); }, 0);
    totalDeposit  = pricedAssets.reduce(function(sum,a){ return sum+((a.summary||{}).totalDeposited||0); }, 0);
    totalWithdraw = pricedAssets.reduce(function(sum,a){ return sum+((a.summary||{}).totalWithdrawn||0); }, 0);
    totalReturn   = pricedAssets.reduce(function(sum,a){ return sum+((a.summary||{}).allTimeReturn||0); }, 0);
    assetCount    = allAssets.length;
  } else {
    var tokens    = data.tokens || [];
    totalVal      = data.totalValue || s.currentValue || 0;
    totalUnreal   = s.unrealizedFIFO || 0;
    totalReal     = s.realizedFIFO || 0;
    totalDeposit  = s.totalDeposited || 0;
    totalWithdraw = s.totalWithdrawn || 0;
    totalReturn   = s.allTimeReturn || 0;
    assetCount    = 1 + tokens.length;
  }
  var netInvested = totalDeposit - totalWithdraw;
  var pct = totalDeposit > 0 ? (totalReturn / totalDeposit) * 100 : 0;

  var cards = [
    { label:'Total Portfolio', val:fmt(totalVal), sub:assetCount+' asset'+(assetCount!==1?'s':''), cls:'c-blue',
      tip:'Formula: sum of each asset balance × current market price.' },
    { label:'Net P&L', val:fmtPnl(totalReturn), sub:fmtPct(pct)+' on deposits', cls:totalReturn>=0?'c-green':'c-red',
      tip:'Formula: current wallet value + USD value withdrawn - USD value deposited. This is the headline wallet-performance number.' },
    { label:'FIFO Open P&L', val:fmtPnl(totalUnreal), sub:'cost-basis view', cls:totalUnreal>=0?'c-green':'c-red',
      tip:'Formula: current value of remaining lots - FIFO cost basis of remaining lots. Useful for tax/cost-basis review, not the headline lifetime P&L.' },
    { label:'Total Deposited', val:fmt(totalDeposit), sub:'all inbound value (USD)', cls:'c-cyan',
      tip:'Formula: sum of every inbound transfer amount × historical USD price at transfer time.' },
    { label:'Total Withdrawn', val:fmt(totalWithdraw), sub:'all outbound value (USD)', cls:'c-red',
      tip:'Formula: sum of every outbound transfer amount × historical USD price at transfer time.' },
    { label:'Net Invested', val:fmt(netInvested), sub:'deposits - withdrawals', cls:netInvested>=0?'c-yellow':'c-purple',
      tip:'Formula: total deposited - total withdrawn. This approximates capital still at risk before market movement.' }
  ];

  document.getElementById('stat-strip').innerHTML = cards.map(function (c) {
    return '<div class="stat-card' + (isDemo?' demo-card':'') + '" data-tip="'+esc(c.tip)+'">' +
      '<div class="sc-label">' + c.label + '</div>' +
      '<div class="sc-val ' + c.cls + (isDemo?' demo-val':'') + '">' + c.val + '</div>' +
      '<div class="sc-sub">' + c.sub + '</div></div>';
  }).join('');
}

/* ── Holdings table — one row per asset ─────────────────────────────────── */
function tokenColor(sym) {
  var s = (sym||'').toUpperCase();
  // Stablecoins — must match STABLECOINS list in server.js
  if (['USDC','USDT','DAI','BUSD','TUSD','FRAX','LUSD','PYUSD','USDP',
       'GUSD','CRVUSD','FDUSD','USDD','SUSD','MUSD','CUSD','EURS'].includes(s)) return '#22d3ee';
  if (['WETH','STETH','RETH','CBETH','FRXETH'].includes(s)) return '#6c8ef7';
  if (['WBTC'].includes(s)) return '#f59e0b';
  if (['LINK'].includes(s)) return '#2563eb';
  if (['UNI'].includes(s)) return '#ff007a';
  if (['AAVE'].includes(s)) return '#9b51e0';
  if (['MATIC','POL'].includes(s)) return '#8b5cf6';
  return '#6b7280';
}

function renderHoldings(data, chain, isDemo) {
  var isMulti = data.chain === 'evm-all';
  var totalVal = data.totalValue || (data.summary && data.summary.currentValue) || 0;

  function pnlBadge(v, pct, hasPriceData) {
    if (!hasPriceData) return '<span style="font-size:10px;color:var(--muted)">—</span>';
    var cl = v >= 0 ? 'badge-g' : 'badge-r';
    return '<span class="badge '+cl+'">' + fmtPnl(v) + (isFinite(pct) && Math.abs(pct)>0.05 ? '&nbsp;'+fmtPct(pct):'') + '</span>';
  }
  function allocBar(val, total, color) {
    var pct = total > 0 ? Math.min(100, (val/total)*100) : 0;
    return '<div class="alloc-bar"><div class="alloc-fill" style="width:'+pct+'%;background:'+color+'"></div></div>' +
           '<div style="font-size:9px;color:var(--muted);margin-top:2px">'+pct.toFixed(1)+'%</div>';
  }
  function chainBadge(c) {
    var labels = { eth:'ETH', base:'BASE', bnb:'BNB', btc:'BTC', sol:'SOL', ada:'ADA' };
    var key = (labels[c] ? c : '').toLowerCase();
    return '<span class="chain-badge b-'+(key||'eth')+'">' + (labels[c] || (c||'').toUpperCase()) + '</span>';
  }
  function priceCell(price, change24h) {
    if (price == null || !isFinite(price) || price === 0) return '—';
    var p = fmt(price);
    if (change24h == null || !isFinite(change24h)) return p;
    var cls = change24h >= 0 ? 'up' : 'down';
    var sign = change24h >= 0 ? '+' : '';
    return '<div class="price-cell">' +
             '<span>' + p + '</span>' +
             '<span class="price-change '+cls+'">' + sign + change24h.toFixed(2) + '%</span>' +
           '</div>';
  }

  var rows = [];
  var assetList = isMulti ? (data.allAssets || []) : null;

  if (isMulti) {
    assetList.forEach(function(asset) {
      var isNative = asset.isNative;
      var s = asset.summary || {};
      var color = isNative ? (COIN_COLORS[asset.chain]||'#6c8ef7') : tokenColor(asset.symbol);
      var icon  = isNative ? (COIN_SYMBOLS[asset.chain]||'?') : (asset.symbol||'?').slice(0,3);
      var name  = isNative ? (COIN_NAMES[asset.chain]||asset.chain.toUpperCase()) : safeText(asset.name, asset.symbol);
      var tick  = isNative ? nativeTicker(asset.chain) : safeText(asset.symbol, 'TOKEN');
      var bal   = isNative ? parseFloat(asset.balance||'0') : (asset.balance||0);
      var hasPD = asset.hasPriceData !== false;
      var pct   = hasPD && s.totalDeposited > 0 ? (s.allTimeReturn/s.totalDeposited)*100 : 0;
      rows.push({
        isNative: isNative, icon: icon, iconColor: color,
        name: name, badge: chainBadge(asset.chain), ticker: tick, chain: asset.chain,
        balance: fmtBal(bal, tick),
        price: priceCell(asset.currentPrice, asset.priceChange24h),
        value: fmt(asset.currentValue || 0),
        avgCost: hasPD && s.avgBuyPrice ? (fmt(s.avgBuyPrice)+' <span style="font-size:9px;color:var(--muted)">wavg</span>') : '—',
        fifoBasis: hasPD && s.breakEvenPrice ? (fmt(s.breakEvenPrice)+' <span style="font-size:9px;color:var(--muted)">fifo</span>') : '—',
        breakeven: hasPD && s.breakEvenPrice ? fmt(s.breakEvenPrice) : '—',
        pnlBadge: pnlBadge(s.allTimeReturn||0, pct, hasPD),
        alloc: allocBar(asset.currentValue||0, totalVal, color),
        key: (asset.isNative ? 'native' : 'token') + ':' + asset.chain + ':' + (asset.contractAddress || tick),
        rawData: makeAssetSel(asset),
        hasPriceData: hasPD
      });
    });
  } else {
    var ns = data.summary || {};
    var nativeColor  = COIN_COLORS[chain]  || '#6c8ef7';
    var nativePct    = ns.totalDeposited > 0 ? (ns.allTimeReturn/ns.totalDeposited)*100 : 0;
    rows.push({
      isNative: true, icon: COIN_SYMBOLS[chain]||'?', iconColor: nativeColor,
      name: COIN_NAMES[chain]||chain.toUpperCase(), ticker: chain.toUpperCase(), chain: chain,
      balance: fmtBal(parseFloat(data.balance||'0'), chain.toUpperCase()),
      price: priceCell(data.currentPrice||0, data.priceChange24h),
      value: fmt(ns.currentValue||0),
      avgCost: fmt(ns.avgBuyPrice)+' <span style="font-size:9px;color:var(--muted)">wavg</span>',
      fifoBasis: fmt(ns.breakEvenPrice)+' <span style="font-size:9px;color:var(--muted)">fifo</span>',
      breakeven: fmt(ns.breakEvenPrice||0),
      pnlBadge: pnlBadge(ns.allTimeReturn||0, nativePct, true),
      alloc: allocBar(ns.currentValue||0, totalVal, nativeColor),
      rawData: makeNativeSel(data),
      key: 'native:' + chain,
      hasPriceData: true
    });
    (data.tokens||[]).forEach(function(tok) {
      var ts = tok.summary || {};
      var hasPD = tok.hasPriceData !== false;
      var tColor = tokenColor(tok.symbol);
      var tpct   = hasPD && ts.totalDeposited > 0 ? (ts.allTimeReturn/ts.totalDeposited)*100 : 0;
      rows.push({
        isNative: false, icon: (tok.symbol||'?').slice(0,3), iconColor: tColor,
        name: safeText(tok.name, tok.symbol), ticker: safeText(tok.symbol, 'TOKEN'), chain: chain,
        balance: fmtBal(tok.balance, tok.symbol),
        price: priceCell(tok.currentPrice, tok.priceChange24h),
        value: tok.currentValue ? fmt(tok.currentValue) : '—',
        avgCost: hasPD && ts.avgBuyPrice ? (fmt(ts.avgBuyPrice)+' <span style="font-size:9px;color:var(--muted)">wavg</span>') : '—',
        fifoBasis: hasPD && ts.breakEvenPrice ? (fmt(ts.breakEvenPrice)+' <span style="font-size:9px;color:var(--muted)">fifo</span>') : '—',
        breakeven: hasPD && ts.breakEvenPrice ? fmt(ts.breakEvenPrice) : '—',
        pnlBadge: pnlBadge(ts.allTimeReturn||0, tpct, hasPD),
        alloc: allocBar(tok.currentValue||0, totalVal, tColor),
        rawData: makeTokenSel(tok, chain),
        key: 'token:' + chain + ':' + (tok.contractAddress || tok.symbol),
        hasPriceData: hasPD
      });
    });
  }

  var table = '<table class="holdings-table"><thead><tr>' +
    '<th data-tip="Asset name and network">Asset</th>' +
    '<th data-tip="Units held in this wallet">Balance</th>' +
    '<th data-tip="Current market price in USD">Price</th>' +
    '<th data-tip="Balance × current price">Value</th>' +
    '<th data-tip="Weighted average of all your buy prices — total USD spent ÷ total units acquired">Avg Cost</th>' +
    '<th data-tip="Average cost of remaining lots using FIFO (first-in first-out) lot matching">FIFO Basis</th>' +
    '<th data-tip="Price must reach this for your remaining position to break even">Break-even</th>' +
    '<th data-tip="Cash-flow P&L: current value plus withdrawals minus deposits">Net P&L</th>' +
    '<th data-tip="Percentage of total portfolio value">Allocation</th>' +
    '</tr></thead><tbody>';

  rows.forEach(function(row, idx) {
    var isSelected = _sel && (
      (_sel.key && row.key === _sel.key) ||
      (!_sel.key && row.isNative && _sel.isNative && row.chain === _sel.chain) ||
      (!_sel.key && !row.isNative && !_sel.isNative && _sel.ticker === row.ticker && row.chain === _sel.chain)
    );
    table += '<tr class="asset-row' + (isSelected?' selected':'') + (isDemo?' demo-row':'') +
             '" style="--asset-color:'+row.iconColor+'" onclick="selectAsset(' + idx + ')">' +
      '<td><div class="coin-info">' +
        '<div class="coin-icon" style="background:'+row.iconColor+'22;color:'+row.iconColor+';font-size:10px">'+row.icon+'</div>' +
        '<div><div class="coin-name">'+esc(row.name)+(row.badge||'')+'</div><div class="coin-chain">'+row.ticker+'</div></div>' +
      '</div></td>' +
      '<td class="'+(isDemo?'demo-val':'')+'">'+row.balance+'</td>' +
      '<td class="'+(isDemo?'demo-val':'')+'">'+row.price+'</td>' +
      '<td style="font-weight:600" class="c-blue '+(isDemo?'demo-val':'')+'">'+row.value+'</td>' +
      '<td class="'+(isDemo?'demo-val':'')+'">'+row.avgCost+'</td>' +
      '<td class="'+(isDemo?'demo-val':'')+'">'+row.fifoBasis+'</td>' +
      '<td class="c-yellow '+(isDemo?'demo-val':'')+'">'+row.breakeven+'</td>' +
      '<td class="'+(isDemo?'demo-val':'')+'">'+row.pnlBadge+'</td>' +
      '<td>'+row.alloc+'</td>' +
      '</tr>';
  });

  table += '</tbody></table>';

  window._holdingRows = rows;

  document.getElementById('holdings-body').innerHTML = table;
}

/* ── Portfolio value chart ──────────────────────────────────────────────── */
// Approximates historical value from transaction-day prices, then uses live price for today's point.
function buildPortfolioSeries(data) {
  if (!data) return [];
  var assets = [];
  var isMulti = data.chain === 'evm-all';

  if (isMulti) {
    (data.allAssets || []).forEach(function(a) {
      if (!a.transactions || !a.transactions.length) return;
      assets.push({
        key: a.symbol + ':' + (a.chain||''),
        txs: a.transactions,
        currentBalance: parseFloat(a.balance != null ? a.balance : (a.isNative ? a.balance : a.balance||0)) || (a.balance || 0),
        currentPrice: a.currentPrice || 0
      });
    });
  } else {
    if (data.transactions && data.transactions.length) {
      assets.push({
        key: 'native', txs: data.transactions,
        currentBalance: parseFloat(data.balance || '0') || 0,
        currentPrice: data.currentPrice || 0,
        currentValue: (data.summary && data.summary.currentValue) || 0
      });
    }
    (data.tokens || []).forEach(function(tok) {
      if (!tok.transactions || !tok.transactions.length) return;
      assets.push({
        key: tok.symbol, txs: tok.transactions,
        currentBalance: tok.balance || 0,
        currentPrice: tok.currentPrice || 0,
        currentValue: tok.currentValue || 0
      });
    });
  }
  if (!assets.length) return [];

  var perAsset = assets.map(function(a) {
    var sorted = a.txs.slice().sort(function(x, y){ return x.timestamp - y.timestamp; });
    var bal = 0;
    var pts = [];
    sorted.forEach(function(tx) {
      var amt = parseFloat(tx.amount) || 0;
      bal += (tx.type === 'in' ? amt : -amt);
      if (bal < 0) bal = 0;
      pts.push({ ts: tx.timestamp, balance: bal, price: tx.priceAtTime || a.currentPrice || 0 });
    });
    return { key: a.key, points: pts, currentBalance: a.currentBalance, currentPrice: a.currentPrice, currentValue: a.currentValue };
  });

  var allDates = {};
  var flowByDate = {};
  perAsset.forEach(function(a) {
    a.points.forEach(function(p) {
      var d = new Date(p.ts * 1000);
      var dk = d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
      allDates[dk] = true;
    });
  });
  assets.forEach(function(asset) {
    (asset.txs || []).forEach(function(tx) {
      var d = new Date(tx.timestamp * 1000);
      var dk = d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');
      flowByDate[dk] = (flowByDate[dk] || 0) + (tx.type === 'in' ? (tx.valueAtTime || 0) : -(tx.valueAtTime || 0));
      allDates[dk] = true;
    });
  });
  var sortedDates = Object.keys(allDates).sort();
  var cumulativeInvested = 0;

  var series = sortedDates.map(function(dk) {
    cumulativeInvested += flowByDate[dk] || 0;
    var endTs = Math.floor(new Date(dk + 'T23:59:59Z').getTime() / 1000);
    var total = 0;
    perAsset.forEach(function(a) {
      var latest = null;
      for (var i = a.points.length - 1; i >= 0; i--) {
        if (a.points[i].ts <= endTs) { latest = a.points[i]; break; }
      }
      if (!latest) return;
      total += latest.balance * (latest.price || 0);
    });
    return { date: dk, value: total, netInvested: cumulativeInvested };
  }).filter(function(p){ return p.value > 0 || p.netInvested > 0; });

  var currentTotal = 0;
  perAsset.forEach(function(a) {
    currentTotal += a.currentValue != null ? a.currentValue : ((a.currentBalance || 0) * (a.currentPrice || 0));
  });
  if (currentTotal > 0) {
    var now = new Date();
    var today = now.getUTCFullYear()+'-'+String(now.getUTCMonth()+1).padStart(2,'0')+'-'+String(now.getUTCDate()).padStart(2,'0');
    if (!series.length || series[series.length-1].date !== today) {
      series.push({ date: today, value: currentTotal, netInvested: cumulativeInvested });
    } else {
      series[series.length-1].value = currentTotal;
      series[series.length-1].netInvested = cumulativeInvested;
    }
  }
  if (series.length === 1 && currentTotal > 0) {
    var first = series[0];
    series.unshift({ date: first.date, value: Math.max(0, first.netInvested), netInvested: Math.max(0, first.netInvested) });
  }
  return series;
}

function setChartRange(range) {
  _chartRange = range;
  document.getElementById('chart-range-1y').classList.toggle('active-pill', range === '1y');
  document.getElementById('chart-range-all').classList.toggle('active-pill', range === 'all');
  var d = getWalletData();
  if (d) renderChart(d);
}

function fmtChartCurrency(v) {
  var abs = Math.abs(v);
  if (abs >= 1e9) return '$' + (v/1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return '$' + (v/1e3).toFixed(1) + 'K';
  return '$' + v.toFixed(0);
}

function renderChart(data) {
  var panel = document.getElementById('chart-panel');
  if (!panel || typeof Chart === 'undefined') return;

  var series = buildPortfolioSeries(data);

  if (_chartRange === '1y' && series.length > 1) {
    var cutoff = Date.now() - 365 * 86400 * 1000;
    series = series.filter(function(p) {
      return new Date(p.date + 'T00:00:00Z').getTime() >= cutoff;
    });
  }

  if (series.length < 2) {
    panel.style.display = 'block';
    var wrap = panel.querySelector('.chart-canvas-wrap');
    wrap.innerHTML = '<div class="chart-empty">Not enough transaction history to chart portfolio value yet.</div>';
    if (_chart) { try { _chart.destroy(); } catch(e){} _chart = null; }
    return;
  }

  panel.style.display = 'block';
  // Re-create canvas if it was replaced by empty state
  var wrap = panel.querySelector('.chart-canvas-wrap');
  if (!wrap.querySelector('canvas')) {
    wrap.innerHTML = '<canvas id="portfolio-chart" height="140"></canvas>';
  }
  var canvas = document.getElementById('portfolio-chart');
  var ctx = canvas.getContext('2d');

  var grad = ctx.createLinearGradient(0, 0, 0, canvas.height || 280);
  grad.addColorStop(0, 'rgba(124, 158, 248, 0.32)');
  grad.addColorStop(1, 'rgba(124, 158, 248, 0.00)');

  var labels = series.map(function(p){ return p.date; });
  var values = series.map(function(p){ return p.value; });
  var invested = series.map(function(p){ return p.netInvested; });

  if (_chart) { try { _chart.destroy(); } catch(e){} _chart = null; }
  _chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Wallet value',
        data: values,
        borderColor: '#7c9ef8',
        backgroundColor: grad,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#7c9ef8',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }, {
        label: 'Net invested',
        data: invested,
        borderColor: '#fbc144',
        backgroundColor: 'rgba(251, 193, 68, 0.04)',
        borderWidth: 1.5,
        borderDash: [6, 5],
        fill: false,
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#fbc144',
        pointHoverBorderColor: '#080910',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: '#a8aece', boxWidth: 10, boxHeight: 2, usePointStyle: true, font: { size: 11, family: 'Inter' } }
        },
        tooltip: {
          backgroundColor: '#0f1018',
          borderColor: '#1e2035',
          borderWidth: 1,
          titleColor: '#a8aece',
          bodyColor: '#dde1f5',
          padding: 10,
          displayColors: false,
          callbacks: {
            title: function(items) {
              var d = new Date(items[0].label + 'T00:00:00Z');
              return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
            },
            label: function(item) {
              return item.dataset.label + ': $' + Number(item.parsed.y).toLocaleString('en-US', { maximumFractionDigits: 2 });
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: '#5c6080',
            font: { size: 10, family: 'Inter' },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 7,
            callback: function(_, idx) {
              var dk = labels[idx];
              if (!dk) return '';
              var d = new Date(dk + 'T00:00:00Z');
              return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '");
            }
          }
        },
        y: {
          grid: { color: '#1e2035', drawBorder: false, borderDash: [3, 4] },
          ticks: {
            color: '#5c6080',
            font: { size: 10, family: 'Inter' },
            maxTicksLimit: 5,
            callback: function(v) { return fmtChartCurrency(v); }
          }
        }
      }
    }
  });
}

/* ── Select asset from holdings table ──────────────────────────────────── */
function selectAsset(idx) {
  var row = window._holdingRows && window._holdingRows[idx];
  if (!row) return;
  _sel = row.rawData;
  renderRightPanels(_sel, state.isDemo);
  // Re-highlight selected row
  document.querySelectorAll('.asset-row').forEach(function(r, i) {
    r.classList.toggle('selected', i === idx);
  });
}

/* ── Right panels — shows selected asset ────────────────────────────────── */
function renderRightPanels(sel, isDemo) {
  if (!sel) return;
  var data    = sel.data;
  var summary = data.summary || {};
  var fifo    = data.fifo    || {};
  var txs     = data.transactions || [];
  var chain   = sel.chain;

  renderFlow(summary, isDemo);
  renderPnL(summary, fifo, data.wavg || {}, sel.ticker + ' — P&L Summary', isDemo);
  renderLots(fifo.openLots || [], data.currentPrice || 0, isDemo);
  renderTxHistory(txs, chain, fifo.closedLots || [], sel.ticker, isDemo);
}

/* ── Capital flow ───────────────────────────────────────────────────────── */
function renderFlow(s, isDemo) {
  var retPct = s.totalDeposited > 0 ? (s.allTimeReturn/s.totalDeposited)*100 : 0;
  document.getElementById('flow-body').innerHTML = '<div class="flow-grid">' +
    fc('Total Deposited',    'All inbound txs, in USD at price when received',        fmt(s.totalDeposited),'all inbound txs','c-cyan',  isDemo) +
    fc('Total Withdrawn',   'All outbound txs, in USD at price when sent',            fmt(s.totalWithdrawn),'all outbound txs','c-red',   isDemo) +
    fc('Net Capital at Risk','Deposited minus withdrawn — money still in the market', fmt(s.netAtRisk),     'deposits − withdrawals','c-yellow',isDemo) +
    fc('Net P&L',   'Current value + withdrawn value − deposited value',
       fmtPnl(s.allTimeReturn)+'<span style="font-size:10px;color:var(--muted)"> ('+fmtPct(retPct)+')</span>',
       'value + withdrawals − deposits', s.allTimeReturn>=0?'c-green':'c-red', isDemo) +
    '</div>';
}
function fc(label, tip, val, sub, cls, isDemo) {
  return '<div class="flow-cell" data-tip="'+esc(tip)+'">' +
    '<div class="flow-label">'+label+'</div>' +
    '<div class="flow-val '+cls+(isDemo?' demo-val':'')+'">'+val+'</div>' +
    '<div class="flow-sub">'+sub+'</div></div>';
}

/* ── P&L summary ────────────────────────────────────────────────────────── */
function togglePnlMode() {
  _pnlMode = _pnlMode === 'fifo' ? 'wavg' : 'fifo';
  document.getElementById('pnl-toggle').textContent = _pnlMode.toUpperCase() + ' ▾';
  var d = getWalletData();
  if (d && _sel) renderPnL(_sel.data.summary, _sel.data.fifo || {}, _sel.data.wavg || {}, _sel.ticker + ' — P&L Summary', state.isDemo);
}

function renderPnL(s, fifo, wavg, title, isDemo) {
  document.getElementById('pnl-title').textContent = title || 'P&L Summary';
  var isF     = _pnlMode === 'fifo';
  var realized = isF ? s.realizedFIFO : s.realizedWAVG;
  var rows = [
    { k:'Net P&L', v:fmtPnl(s.allTimeReturn), c:s.allTimeReturn>=0?'c-green':'c-red',
      tip:'Wallet performance for this asset: current value plus withdrawals minus deposits' },
    { k:'Realized P&L ('+(isF?'FIFO':'WAVG')+')', v:fmtPnl(realized), c:realized>=0?'c-green':'c-red',
      tip: isF ? 'Profit from completed sells using FIFO — earliest lots sold first'
               : 'Profit from completed sells using weighted-average cost basis' },
    { k:'Unrealized P&L',   v:fmtPnl(s.unrealizedFIFO),  c:s.unrealizedFIFO>=0?'c-green':'c-red',
      tip:'Paper gain on remaining holdings vs FIFO cost basis at the current price' },
    { k:'Avg Buy Price',    v:fmt(s.avgBuyPrice),           c:'c-blue',
      tip:'Weighted average price paid per unit across all buys: total spent ÷ total acquired' },
    { k:'Break-even Price', v:fmt(s.breakEvenPrice),        c:'c-yellow',
      tip:'Price must reach this for your remaining FIFO position to break even' },
    { k:'Total Invested',   v:fmt(s.totalDeposited),        c:'',
      tip:'Total USD value of all inbound transactions for this asset' },
    { k:'Total Withdrawn',  v:fmt(s.totalWithdrawn),        c:'c-red',
      tip:'Total USD value of all outbound transactions for this asset' },
    { k:'Net at Risk',      v:fmt(s.netAtRisk),             c:'c-yellow',
      tip:'Total deposited minus withdrawn — capital still actively deployed in this asset' },
    { k:'House Money',      v:fmt(s.houseMoney),            c:'c-purple',
      tip:'How much of your remaining cost basis is covered by realized gains — effectively free exposure' }
  ];
  document.getElementById('pnl-body').innerHTML = rows.map(function (r) {
    return '<div class="pnl-row" data-tip="'+esc(r.tip)+'">' +
      '<span class="pnl-key">'+r.k+'</span>' +
      '<span class="'+r.c+(isDemo?' demo-val':'')+'" style="font-weight:600">'+r.v+'</span></div>';
  }).join('');
}

/* ── Lot table ──────────────────────────────────────────────────────────── */
function renderLots(lots, currentPrice, isDemo) {
  if (!lots || !lots.length) {
    document.getElementById('lots-body').innerHTML =
      '<div style="padding:16px;color:var(--muted);font-size:12px">No open lots for this asset.</div>';
    return;
  }
  document.getElementById('lots-body').innerHTML = lots.map(function (lot, i) {
    var pct      = lot.originalAmount > 0 ? Math.min(100, (lot.amount/lot.originalAmount)*100) : 100;
    var lotUnreal = lot.amount * (currentPrice - lot.priceAtTime);
    return '<div class="lot-row">' +
      '<div class="lot-header">' +
        '<div><strong>Lot '+(i+1)+'</strong>&nbsp;&nbsp;' +
        '<span class="'+(isDemo?'demo-val':'')+'">'+lot.amount.toFixed(6)+' remaining</span></div>' +
        '<div class="'+(lotUnreal>=0?'c-green':'c-red')+(isDemo?' demo-val':'')+'">'+fmtPnl(lotUnreal)+'</div>' +
      '</div>' +
      '<div class="lot-meta '+(isDemo?'demo-meta':'')+'">Bought '+fmtDate(lot.timestamp)+
        ' @ '+fmt(lot.priceAtTime)+' · cost basis '+fmt(lot.costBasis)+'</div>' +
      '<div class="lot-bar-wrap"><div class="lot-bar-fill" style="width:'+pct+'%"></div></div>' +
    '</div>';
  }).join('');
}

/* ── Transaction history ────────────────────────────────────────────────── */
function filterTx(f) {
  _txFilter = f;
  if (_sel) renderTxHistory(_sel.data.transactions||[], _sel.chain, (_sel.data.fifo||{}).closedLots||[], _sel.ticker, state.isDemo);
}
function sortTx(sortKey) {
  _txSort = sortKey;
  if (_sel) renderTxHistory(_sel.data.transactions||[], _sel.chain, (_sel.data.fifo||{}).closedLots||[], _sel.ticker, state.isDemo);
}

function txSortValue(tx) {
  return Math.abs(finiteNumber(tx.valueAtTime, (tx.priceAtTime || 0) * (parseFloat(tx.amount) || 0)));
}

function renderTxHistory(txs, chain, closedLots, ticker, isDemo) {
  var filtered = (txs||[]).filter(function (tx) { return _txFilter==='all' || tx.type===_txFilter; });
  filtered.sort(function(a, b) {
    if (_txSort === 'value-desc') return txSortValue(b) - txSortValue(a);
    if (_txSort === 'value-asc') return txSortValue(a) - txSortValue(b);
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
  if (!filtered.length) {
    document.getElementById('tx-body').innerHTML =
      '<div style="padding:16px;color:var(--muted);font-size:12px">No transactions found for this asset.</div>';
    return;
  }
  document.getElementById('tx-body').innerHTML = filtered.map(function (tx) {
    var isIn    = tx.type === 'in';
    var amt     = parseFloat(tx.amount);
    var matchedLots = !isIn ? (closedLots||[]).filter(function (l) {
      return (l.sellHash && tx.hash && l.sellHash === tx.hash) ||
        (!l.sellHash && Math.abs(l.sellTimestamp-tx.timestamp)<120);
    }) : [];
    var costBasis = matchedLots.reduce(function(s, l){ return s + (l.costBasis || 0); }, 0);
    var proceeds = matchedLots.reduce(function(s, l){ return s + (l.proceeds || 0); }, 0) || (isIn ? 0 : tx.valueAtTime || 0);
    var fifoGain = matchedLots.reduce(function(s, l){ return s + (l.gain || 0); }, 0);
    var direction = isIn ? 'DEPOSIT / BUY' : 'WITHDRAW / SELL';
    var value = tx.valueAtTime || ((tx.priceAtTime || 0) * amt);
    var rowTicker = (tx.assetSymbol || ticker || '').toUpperCase();
    return '<div class="tx-row" data-tip="'+esc('Historical price and USD value are based on available daily market data for the transfer date. FIFO gain is matched by transaction hash when possible.')+'">' +
      '<div class="tx-icon '+(isIn?'tx-in':'tx-out')+'">'+(isIn?'↑':'↓')+'</div>' +
      '<div class="tx-body">' +
        '<div class="tx-title '+(isDemo?'demo-val':'')+'">'+
          direction+' '+fmtBal(amt)+' '+rowTicker+
        '</div>' +
        '<div class="tx-meta">' +
          (isDemo
            ? '<span style="color:var(--dim)">'+trunc(tx.hash,10,6)+'</span>'
            : '<a href="'+(EXPLORER[chain]||'#')+tx.hash+'" target="_blank" style="color:var(--muted);text-decoration:none">'+trunc(tx.hash,10,6)+'</a>') +
          ' · '+fmtDate(tx.timestamp)+
        '</div>' +
        '<div class="tx-detail-grid">' +
          '<span>Price <b>'+fmt(tx.priceAtTime||0)+'</b></span>' +
          '<span>Value <b>'+fmt(value)+'</b></span>' +
          '<span>From <b>'+trunc(tx.from||'',6,4)+'</b></span>' +
          '<span>To <b>'+trunc(tx.to||'',6,4)+'</b></span>' +
          (!isIn ? '<span>FIFO cost <b>'+fmt(costBasis)+'</b></span><span>Proceeds <b>'+fmt(proceeds)+'</b></span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="tx-right">' +
        '<div class="'+(isIn?'c-cyan':'c-red')+(isDemo?' demo-val':'')+'">'+(isIn?'+':'-')+fmt(value)+'</div>' +
        (!isIn && matchedLots.length ? '<div class="tx-gain '+(fifoGain>=0?'c-green':'c-red')+(isDemo?' demo-val':'')+'">'+fmtPnl(fifoGain)+' FIFO gain</div>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

/* ── CSV exports ────────────────────────────────────────────────────────── */
function exportHoldingsCSV() {
  var d = getWalletData();
  if (!d || state.isDemo) return;
  var rows = [['Asset','Symbol','Chain','Balance','Price','Value','Deposited','Withdrawn','NetPnL','AvgCost_WAVG','BreakEven_FIFO','OpenPnL_FIFO','RealizedPnL_FIFO']];
  var assets = [];
  if (d.chain === 'evm-all') {
    assets = d.allAssets || [];
  } else {
    var chain = getChain();
    assets.push({
      name: COIN_NAMES[chain] || chain.toUpperCase(),
      symbol: chain.toUpperCase(),
      chain: chain,
      balance: d.balance,
      currentPrice: d.currentPrice,
      currentValue: d.summary && d.summary.currentValue,
      summary: d.summary || {}
    });
    (d.tokens || []).forEach(function(t) { assets.push(Object.assign({ chain: chain }, t)); });
  }
  assets.forEach(function(a) {
    var s = a.summary || {};
    rows.push([
      safeText(a.name, a.symbol),
      safeText(a.symbol, ''),
      a.chain || '',
      a.balance,
      a.currentPrice,
      a.currentValue,
      s.totalDeposited,
      s.totalWithdrawn,
      s.allTimeReturn,
      s.avgBuyPrice,
      s.breakEvenPrice,
      s.unrealizedFIFO,
      s.realizedFIFO
    ]);
  });
  downloadCSV('holdings.csv', rows);
}
function exportTxCSV() {
  if (!_sel || state.isDemo) return;
  var lots = ((_sel.data || {}).fifo || {}).closedLots || [];
  var rows = [['Type','Amount','Asset','PriceAtTime','ValueAtTime','CostBasis_FIFO','Proceeds_FIFO','Gain_FIFO','Date','Timestamp','TxHash','From','To']];
  (_sel.data.transactions||[]).forEach(function (tx) {
    var matchedLots = tx.type === 'out' ? lots.filter(function(l) {
      return (l.sellHash && tx.hash && l.sellHash === tx.hash) ||
        (!l.sellHash && Math.abs(l.sellTimestamp - tx.timestamp) < 120);
    }) : [];
    var costBasis = matchedLots.reduce(function(s, l){ return s + (l.costBasis || 0); }, 0);
    var proceeds = matchedLots.reduce(function(s, l){ return s + (l.proceeds || 0); }, 0);
    var gain = matchedLots.reduce(function(s, l){ return s + (l.gain || 0); }, 0);
    rows.push([
      tx.type,
      tx.amount,
      _sel.ticker,
      tx.priceAtTime,
      tx.valueAtTime,
      costBasis || '',
      proceeds || '',
      gain || '',
      fmtDate(tx.timestamp),
      tx.timestamp,
      tx.hash,
      tx.from || '',
      tx.to || ''
    ]);
  });
  downloadCSV('transactions-' + _sel.ticker + '.csv', rows);
}
function downloadCSV(name, rows) {
  var csv = rows.map(function (r) {
    return r.map(function (v) { return '"' + String(v).replace(/"/g,'""') + '"'; }).join(',');
  }).join('\n');
  var a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = name;
  a.click();
}

/* ── Init ───────────────────────────────────────────────────────────────── */
renderDashboard();
if (addressParam) {
  document.getElementById('addr-input').value = addressParam;
  handleLookup();
}
