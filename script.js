/* 
   This file does 3 things:
     1. Toggle cards open/closed and switch tabs
     2. Send user input to the backend and print the result
     3. Load source code files from the backend
   
   All code runs on the backend.
 */

/* STEP 1: Backend URL — auto-detects local vs deployed.
   file:// = local dev → localhost:8080
   http(s):// = deployed → production Render URL
   To override: set window.BACKEND_OVERRIDE before this script loads.
 */
const BACKEND_URL = (typeof window !== 'undefined' && window.BACKEND_OVERRIDE)
  ? window.BACKEND_OVERRIDE
  : (window.location.protocol === 'file:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080'
      : 'https://portfolio-api-ar69.onrender.com');

/*  HELPER: find the project card and its ID 
   Every project card has data-project="poker" (or compiler, etc.)
   This walks up the DOM from any element inside the card to find it.
 */
function getCard(el) {
  return el.closest('.project-card');
}

/* TOGGLE: open/close a project card 
   Called when you click the project header.
*/
function toggle(headerEl) {
  getCard(headerEl).classList.toggle('open');
}


/* SWITCH TAB: show run / source / readme panel 
   Called when you click a tab. Hides all panels, shows the one
   matching the panelName. Also loads source files if needed.
*/
function switchTab(tabEl, panelName) {
  var card = getCard(tabEl);

  // Deactivate all tabs and panels in this card
  card.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  card.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });

  // Activate the clicked tab and matching panel
  tabEl.classList.add('active');
  card.querySelector('[data-panel="' + panelName + '"]').classList.add('active');

  // If switching to source tab, load the file list from the backend
  if (panelName === 'source') {
    loadSourceFiles(card);
  }
}


/* ESCAPE HTML: prevents <script> injection in output */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ANSI→HTML: convert ANSI escape codes to colored <span> elements.
   Only used for Haskell game output — never on user input. */
function ansiToHtml(raw) {
  if (raw == null) return '';
  var colorMap = {
    '30':'#555555','31':'#e06c75','32':'#98c379','33':'#e5c07b',
    '34':'#61afef','35':'#c678dd','36':'#56b6c2','37':'#abb2bf',
    '90':'#5c6370','91':'#ff7b7b','92':'#b5f0a0','93':'#ffe08a',
    '94':'#88c0ff','95':'#e0a0ff','96':'#88e0f0','97':'#ffffff',
    '1': null, '2': null
  };
  var html = raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var spanOpen = false;
  html = html.replace(/\x1b\[([0-9;]*)m/g, function(_, params) {
    // Only handle single-parameter codes; strip compound or unknown sequences
    if (params.indexOf(';') !== -1) return '';
    var code = params;
    if (code === '0') {
      if (spanOpen) { spanOpen = false; return '</span>'; }
      return '';
    }
    var color = colorMap[code];
    if (!color) return '';
    var close = spanOpen ? '</span>' : '';
    spanOpen = true;
    return close + '<span style="color:' + color + '">';
  });
  if (spanOpen) html += '</span>';
  return html;
}

/* PRINT HTML: like print(), but sets innerHTML instead of textContent.
   Only use this for trusted backend output that may contain ANSI-converted spans. */
function printHtml(outEl, html) {
  var line = document.createElement('div');
  line.className = 't-line';
  line.innerHTML = html;
  outEl.appendChild(line);
  outEl.scrollTop = outEl.scrollHeight;
  return line;
}

/* GENERATION BAR: shows an animated progress bar in the terminal output
   while a new game is being generated. Returns a cleanup function. */
function showGenerationBar(outEl, projectId) {
  var labels = {
    dungeon: 'generating dungeon...',
    wordle:  'initializing wordle...'
  };
  var label = labels[projectId] || 'loading...';

  var container = document.createElement('div');
  container.className = 't-line gen-bar-line';

  var track = document.createElement('div');
  track.className = 'gen-bar-track';
  var fill = document.createElement('div');
  fill.className = 'gen-bar-fill';
  track.appendChild(fill);

  var text = document.createElement('span');
  text.className = 'gen-bar-label';
  text.textContent = ' ' + label;

  container.appendChild(track);
  container.appendChild(text);
  outEl.appendChild(container);
  outEl.scrollTop = outEl.scrollHeight;

  var pct = 10, dir = 1;
  var anim = setInterval(function() {
    pct += dir * 3;
    if (pct >= 90) dir = -1;
    if (pct <= 10) dir = 1;
    fill.style.width = pct + '%';
  }, 60);

  return function cleanup() {
    clearInterval(anim);
    if (container.parentNode) container.parentNode.removeChild(container);
  };
}

/* PRINT: append a line to a terminal output 
   outEl    — the .t-out div inside a terminal
   text     — plain text (not HTML) to display
   cls      — optional extra class like "t-green" for coloring

   Uses textContent + createElement (not innerHTML) so:
   (1) existing content is never rebuilt from a string
   (2) newline characters in `text` are preserved as real newlines
       and rendered as line breaks by the .t-line { white-space: pre-wrap } rule.
 */
function print(outEl, text, cls) {
  var line = document.createElement('div');
  line.className = 't-line' + (cls ? ' ' + cls : '');
  line.textContent = text;
  outEl.appendChild(line);
  outEl.scrollTop = outEl.scrollHeight;
  return line; // so callers can remove it later (for "running...")
}


/*  RUN: send input to the backend, print the result
   Called when you press Enter or click "run ↵" in a terminal.

   How it works:
     1. Finds the project ID from data-project on the card
     2. POSTs to BACKEND_URL/api/run/{id} with the input
     3. Prints the response in the terminal
*/
async function run(el) {
  var card   = getCard(el);
  var id     = card.dataset.project;
  var input  = card.querySelector('.t-input input');
  var output = card.querySelector('.t-out');
  var text   = input.value.trim();

  if (!text) return;

  if (text.toLowerCase() === 'clear') {
    output.innerHTML = '';
    input.value = '';
    return;
  }

  print(output, '$ ' + text, 't-dim');
  input.value = '';

  if (!BACKEND_URL) {
    print(output, '⚠ Set BACKEND_URL in script.js first', 't-red');
    return;
  }

  var isGenCmd = (id === 'dungeon' || id === 'wordle') &&
                 text.toLowerCase() === 'reset';

  var btn     = card.querySelector('.t-input button');
  var cleanup = null;
  var runningLine = null;

  if (isGenCmd) {
    input.disabled = true;
    btn.disabled = true;
    cleanup = showGenerationBar(output, id);
  } else {
    runningLine = print(output, '  running...', 't-dim');
  }

  try {
    var res = await fetch(BACKEND_URL + '/api/run/' + id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text })
    });
    var data = await res.json();

    if (cleanup) { cleanup(); input.disabled = false; btn.disabled = false; }
    if (runningLine && runningLine.parentNode) runningLine.parentNode.removeChild(runningLine);

    if (data.error) {
      print(output, data.error, 't-red');
    } else if (id === 'dungeon' || id === 'wordle') {
      printHtml(output, ansiToHtml(data.output));
    } else {
      print(output, data.output, 't-green');
    }
  } catch (err) {
    if (cleanup) { cleanup(); input.disabled = false; btn.disabled = false; }
    if (runningLine && runningLine.parentNode) runningLine.parentNode.removeChild(runningLine);
    print(output, '⏳ Server waking up (~30s). Try again.', 't-yellow');
  }
}


/* LOAD SOURCE FILES: fetch file list from backend
   Called when you click the "{ } source" tab.
   Fetches the list of files, then auto-loads the first one.
*/
async function loadSourceFiles(card) {
  var listEl = card.querySelector('.src-filelist');
  var codeEl = card.querySelector('.src-code');
  var id     = card.dataset.project;

  // Only fetch once per card (don't re-fetch every time you switch tabs)
  if (listEl.dataset.loaded) return;
  listEl.dataset.loaded = 'true';

  if (!BACKEND_URL) {
    codeEl.textContent = '// Set BACKEND_URL in script.js';
    return;
  }

  try {
    // Ask the backend for the list of source files in this project
    var res  = await fetch(BACKEND_URL + '/api/source/' + id);
    var data = await res.json();

    if (!data.files || data.files.length === 0) {
      listEl.innerHTML = '<span class="t-dim">no source files found</span>';
      return;
    }

    // Build clickable file list
    listEl.innerHTML = data.files.map(function(f) {
      return '<a class="src-file" href="#" onclick="viewFile(event, this)">' + esc(f) + '</a>';
    }).join('');

    // Auto-load the first file
    viewFile(null, listEl.querySelector('.src-file'));
  } catch (err) {
    codeEl.textContent = '// Could not load files';
  }
}


/* VIEW FILE: fetch and display one source fil
    Called when you click a filename in the source tab.
*/
async function viewFile(event, linkEl) {
  if (event) event.preventDefault();

  var card     = getCard(linkEl);
  var id       = card.dataset.project;
  var codeEl   = card.querySelector('.src-code');
  var listEl   = card.querySelector('.src-filelist');
  var filepath = linkEl.textContent;

  // Highlight the active file
  listEl.querySelectorAll('.src-file').forEach(function(a) { a.classList.remove('active'); });
  linkEl.classList.add('active');

  codeEl.textContent = 'loading...';

  try {
    var res  = await fetch(BACKEND_URL + '/api/source/' + id + '/' + filepath);
    var data = await res.json();

    if (data.binary) {
      codeEl.textContent = '[binary file: ' + data.name + ', ' + (data.size / 1024).toFixed(1) + ' KB]';
    } else {
      codeEl.textContent = data.content;
    }
  } catch (err) {
    codeEl.textContent = '// Could not load file';
  }
}

/* -- WalletTracker card ---------------------------------------------------- */
(function () {
  var addrInput = document.getElementById('cc-addr');
  if (!addrInput) return;
  addrInput.addEventListener('input', function () {
    var isEvm = /^0x[a-fA-F0-9]{40}$/.test(this.value.trim());
    var pick = document.getElementById('cc-evm-pick');
    pick.style.display = isEvm ? 'flex' : 'none';
  });
})();

(function resetInteractiveGamesOnLoad() {
  if (!BACKEND_URL) return;
  ['wordle', 'dungeon'].forEach(function(id) {
    fetch(BACKEND_URL + '/api/run/' + id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'reset' })
    }).catch(function(){});
  });
})();

function ccPickChain(btn) {
  document.querySelectorAll('.cc-echain').forEach(function (b) {
    b.style.borderColor = '#1f2133';
    b.style.background = 'none';
    b.style.color = '#6b7094';
  });
  btn.style.borderColor = '#6c8ef7';
  btn.style.background = '#6c8ef720';
  btn.style.color = '#6c8ef7';
}

function ccDetectChain(addr) {
  if (/^bc1[a-z0-9]{25,62}$/i.test(addr)) return 'btc';
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) return 'evm';
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) return 'sol';
  if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr)) return 'btc';
  if (/^addr1[a-z0-9]{50,}$/.test(addr)) return 'ada';
  return null;
}

async function ccLookup() {
  var addr = (document.getElementById('cc-addr').value || '').trim();
  if (!addr) return;
  var detected = ccDetectChain(addr);
  if (!detected) {
    document.getElementById('cc-status').textContent = '⚠ Unrecognized address format';
    return;
  }
  var activeBtn = document.querySelector('.cc-echain[style*="#6c8ef7"]');
  var chain = detected === 'evm' ? (activeBtn ? activeBtn.dataset.ec : 'eth') : detected;
  document.getElementById('cc-status').innerHTML = 'Fetching ' + chain.toUpperCase() + ' history…<br>' +
    '<span style="font-size:10px;color:#3a3d5c">First load may take 30–60s (scanning full history)</span>';
  document.getElementById('cc-results').style.display = 'none';
  document.getElementById('cc-open-link').style.display = 'none';
  try {
    var resp = await fetch(BACKEND_URL + '/api/crypto/wallet/' + chain + '/' + addr,
      { signal: AbortSignal.timeout(120000) });
    if (!resp.ok) {
      var e = await ccReadJson(resp);
      throw new Error((e && e.error) || resp.statusText || ('HTTP ' + resp.status));
    }
    var data = await resp.json();
    var s = data.aggregateSummary || data.summary || {};
    var totalValue = data.totalValue != null ? data.totalValue : s.currentValue;
    var txCount = Array.isArray(data.transactions) ? data.transactions.length : 0;
    var tokenCount = Array.isArray(data.tokens) ? data.tokens.length : 0;
    var ticker = { btc:'BTC', eth:'ETH', base:'ETH', bnb:'BNB', sol:'SOL', ada:'ADA' }[chain] || chain.toUpperCase();
    var dashboardUrl = './crypto-check/index.html?backend=' + encodeURIComponent(BACKEND_URL) +
      '&address=' + encodeURIComponent(addr);
    function f(n) { return n == null ? '—' : '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function fp(n) { return (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    document.getElementById('cc-results').innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:8px;margin-bottom:12px">' +
      ccCard('Portfolio Value', f(totalValue), '#7db7ff', 'Native balance plus priced tokens over the tracking threshold') +
      ccCard('Net P&L', fp(s.allTimeReturn || 0), (s.allTimeReturn || 0) >= 0 ? '#6cf2a3' : '#ff6b7d', 'Current value plus withdrawals minus deposits') +
      ccCard('FIFO Open P&L', fp(s.unrealizedFIFO || 0), (s.unrealizedFIFO || 0) >= 0 ? '#6cf2a3' : '#ff6b7d', 'Paper gain on open position (FIFO)') +
      ccCard('Net Invested', f(s.netAtRisk), '#d8c46a', 'Deposits minus withdrawals') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:7px;font-size:11px;color:#a9c8bd;line-height:1.55;margin-bottom:10px">' +
      ccDetail('Balance', ccFmtBalance(data.balance, ticker)) +
      ccDetail('Transactions', txCount + ' scanned') +
      ccDetail('Tokens', tokenCount ? tokenCount + ' detected' : 'native only') +
      ccDetail('Break-even', f(s.breakEvenPrice)) +
      ccDetail('Avg cost', f(s.avgBuyPrice)) +
      ccDetail('Deposited / Withdrawn', f(s.totalDeposited) + ' / ' + f(s.totalWithdrawn)) +
      '</div>' +
      '<div style="font-size:10px;color:#3a3d5c;margin-top:4px;font-family:\'JetBrains Mono\',monospace">' +
      addr.slice(0, 10) + '…' + addr.slice(-6) +
      '</div>';
    document.getElementById('cc-results').style.display = 'block';
    document.getElementById('cc-open-link').style.display = 'block';
    document.querySelector('#cc-open-link a').href = dashboardUrl;
    document.getElementById('cc-status').textContent = '';
  } catch (err) {
    document.getElementById('cc-status').textContent = '⚠ ' + err.message;
  }
}

async function ccReadJson(resp) {
  try {
    return await resp.json();
  } catch (err) {
    console.warn('CryptoCheck card received non-JSON backend response: ' + err.message);
    return null;
  }
}

function ccCard(label, val, color, tip) {
  return '<div style="background:linear-gradient(180deg,#111c1a,#0b1110);border:1px solid #19332e;border-radius:7px;padding:10px" title="' + tip + '">' +
    '<div style="font-size:9px;color:#638277;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px">' + label + '</div>' +
    '<div style="font-size:14px;font-weight:700;color:' + color + '">' + val + '</div></div>';
}

function ccDetail(label, val) {
  return '<div style="border:1px solid #19332e;background:#07100e;border-radius:6px;padding:7px 9px">' +
    '<span style="display:block;color:#638277;font-size:9px;text-transform:uppercase;letter-spacing:.45px">' + label + '</span>' +
    '<span style="display:block;margin-top:2px;color:#edfdf7;font-weight:600">' + val + '</span></div>';
}

function ccFmtBalance(balance, ticker) {
  var n = Number(balance);
  if (!isFinite(n)) return '—';
  var dec = n < 0.01 ? 6 : n < 1 ? 4 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + ' ' + ticker;
}
