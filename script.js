/* ============================================================
   SCRIPT.JS — Jay Desai Portfolio
   
   This file does 3 things:
     1. Toggle cards open/closed and switch tabs
     2. Send user input to the backend and print the result
     3. Load source code files from the backend
   
   All code runs on the backend.
   ============================================================ */

/* ─── STEP 1: Set your backend URL ───────────────────────────
   
   Local development:  const BACKEND_URL = 'http://localhost:8080';
   After deploying:    const BACKEND_URL = 'https://your-app.onrender.com';
   Not set up yet:     const BACKEND_URL = null;
   
   ──────────────────────────────────────────────────────────── */
const BACKEND_URL = 'https://portfolio-api-ikdk.onrender.com';


/* ─── HELPER: find the project card and its ID ───────────────
   Every project card has data-project="poker" (or compiler, etc.)
   This walks up the DOM from any element inside the card to find it.
   ──────────────────────────────────────────────────────────── */
function getCard(el) {
  return el.closest('.project-card');
}

function getProjectId(el) {
  return getCard(el).dataset.project;
}


/* ─── TOGGLE: open/close a project card ──────────────────────
   Called when you click the project header.
   ──────────────────────────────────────────────────────────── */
function toggle(headerEl) {
  getCard(headerEl).classList.toggle('open');
}


/* ─── SWITCH TAB: show run / source / readme panel ───────────
   Called when you click a tab. Hides all panels, shows the one
   matching the panelName. Also loads source files if needed.
   ──────────────────────────────────────────────────────────── */
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


/* ─── ESCAPE HTML: prevents <script> injection in output ───── */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


/* ─── PRINT: append a line to a terminal output ──────────────
   outEl = the .t-out div inside a terminal
   ──────────────────────────────────────────────────────────── */
function print(outEl, html) {
  outEl.innerHTML += html + '\n';
  outEl.scrollTop = outEl.scrollHeight;
}


/* ─── RUN: send input to the backend, print the result ───────
   Called when you press Enter or click "run ↵" in a terminal.
   
   How it works:
     1. Finds the project ID from data-project on the card
     2. POSTs to BACKEND_URL/api/run/{id} with the input
     3. Prints the response in the terminal
   ──────────────────────────────────────────────────────────── */
async function run(el) {
  // Find the terminal elements
  var card   = getCard(el);
  var id     = card.dataset.project;
  var input  = card.querySelector('.t-input input');
  var output = card.querySelector('.t-out');
  var text   = input.value.trim();

  // Don't run if empty
  if (!text) return;

  // Show what the user typed
  print(output, '<span class="t-dim">$ ' + esc(text) + '</span>');
  input.value = '';

  // Check if backend is set up
  if (!BACKEND_URL) {
    print(output, '<span class="t-red">⚠ Set BACKEND_URL in script.js first</span>');
    return;
  }

  // Show "running..." while we wait
  print(output, '<span class="t-dim">  running...</span>');

  try {
    // Send the input to the backend
    var res = await fetch(BACKEND_URL + '/api/run/' + id, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: text })
    });
    var data = await res.json();

    // Remove the "running..." line
    output.innerHTML = output.innerHTML.replace(/<span class="t-dim">  running\.\.\.<\/span>\n?/, '');

    // Print the result (green for output, red for errors)
    if (data.error) {
      print(output, '<span class="t-red">' + esc(data.error) + '</span>');
    } else {
      print(output, '<span class="t-green">' + esc(data.output) + '</span>');
    }
  } catch (err) {
    // Remove the "running..." line
    output.innerHTML = output.innerHTML.replace(/<span class="t-dim">  running\.\.\.<\/span>\n?/, '');

    // This usually means the server is asleep (Render free tier cold start)
    print(output, '<span class="t-yellow">⏳ Server waking up (~30s). Try again.</span>');
  }
}


/* ─── LOAD SOURCE FILES: fetch file list from backend ────────
   Called when you click the "{ } source" tab.
   Fetches the list of files, then auto-loads the first one.
   ──────────────────────────────────────────────────────────── */
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


/* ─── VIEW FILE: fetch and display one source file ───────────
   Called when you click a filename in the source tab.
   ──────────────────────────────────────────────────────────── */
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