(function(){'use strict';
// ═══════════════════════════════════════════════════════
// RESONANCE — Indicator engine
// ═══════════════════════════════════════════════════════

// ── MATH UTILS ──────────────────────────────────────────
function rng32(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const N2=(v,d=50)=>(!isFinite(v)||isNaN(v))?d:v;


// ── PRICE DATA GENERATION ────────────────────────────────
function ss(t){return t*t*(3-2*t);}
function buildPrice(wp,n,rand,vol){
  const op=[],cl=[],hi=[],lo=[],vl=[];
  let lp=wp[0].v;
  for(let i=0;i<n;i++){
    const x=i/(n-1);
    let p0=wp[0],p1=wp[wp.length-1];
    for(let j=0;j<wp.length-1;j++){if(wp[j].x<=x&&wp[j+1].x>=x){p0=wp[j];p1=wp[j+1];break;}}
    const t=(x-p0.x)/(p1.x-p0.x+1e-9);
    const tgt=Math.log(p0.v)+(Math.log(p1.v)-Math.log(p0.v))*ss(t);
    const logP=Math.log(lp)+(tgt-Math.log(lp))*0.09+(rand()-0.5)*vol;
    const c=Math.exp(logP);
    const o=lp*(1+(rand()-0.5)*vol*0.6);
    const range=Math.abs(c-o)*(0.4+rand()*1.2)+c*vol*0.2;
    cl.push(c); op.push(o);
    hi.push(Math.max(o,c)+range*rand()*0.8);
    lo.push(Math.min(o,c)-range*rand()*0.6);
    vl.push(400000+rand()*2500000);
    lp=c;
  }
  return{op,cl,hi,lo,vl};
}

// ── ASSET CONFIGS — 15 assets ────────────────────────────
const ASSETS={
  SPY:{lbl:'SPDR S&P 500 ETF',cat:'US Index',catC:'#6baaff',seed:42,
    wp:{'1W':{n:200,vol:.018,p:[{x:0,v:350},{x:.17,v:476},{x:.31,v:340},{x:.44,v:368},{x:.52,v:342},{x:.68,v:475},{x:.82,v:447},{x:1,v:518}]},
        '5D':{n:160,vol:.022,p:[{x:0,v:368},{x:.15,v:438},{x:.28,v:350},{x:.50,v:400},{x:.68,v:458},{x:.82,v:440},{x:1,v:504}]},
        'D':{n:220,vol:.010,p:[{x:0,v:420},{x:.13,v:454},{x:.24,v:408},{x:.40,v:432},{x:.56,v:458},{x:.70,v:440},{x:.86,v:474},{x:1,v:508}]}}},
  QQQ:{lbl:'Invesco Nasdaq 100 ETF',cat:'US Index',catC:'#6baaff',seed:77,
    wp:{'1W':{n:200,vol:.025,p:[{x:0,v:278},{x:.16,v:398},{x:.30,v:258},{x:.47,v:308},{x:.55,v:272},{x:.71,v:428},{x:.83,v:388},{x:1,v:468}]},
        '5D':{n:160,vol:.030,p:[{x:0,v:298},{x:.18,v:378},{x:.32,v:288},{x:.52,v:358},{x:.68,v:418},{x:.82,v:398},{x:1,v:453}]},
        'D':{n:220,vol:.014,p:[{x:0,v:348},{x:.14,v:388},{x:.25,v:352},{x:.42,v:378},{x:.60,v:408},{x:.72,v:388},{x:.88,v:428},{x:1,v:458}]}}},
  AAPL:{lbl:'Apple Inc.',cat:'US Equity',catC:'#a8ff78',seed:55,
    wp:{'1W':{n:200,vol:.020,p:[{x:0,v:124},{x:.15,v:164},{x:.28,v:128},{x:.45,v:143},{x:.55,v:133},{x:.70,v:174},{x:.85,v:159},{x:1,v:188}]},
        '5D':{n:160,vol:.024,p:[{x:0,v:138},{x:.20,v:166},{x:.35,v:146},{x:.55,v:160},{x:.70,v:176},{x:.85,v:166},{x:1,v:183}]},
        'D':{n:220,vol:.011,p:[{x:0,v:153},{x:.15,v:166},{x:.28,v:156},{x:.45,v:170},{x:.62,v:178},{x:.78,v:170},{x:.90,v:180},{x:1,v:186}]}}},
  NVDA:{lbl:'NVIDIA Corporation',cat:'US Equity',catC:'#a8ff78',seed:33,
    wp:{'1W':{n:200,vol:.045,p:[{x:0,v:118},{x:.12,v:318},{x:.20,v:138},{x:.35,v:248},{x:.48,v:138},{x:.60,v:478},{x:.75,v:618},{x:.88,v:492},{x:1,v:798}]},
        '5D':{n:160,vol:.050,p:[{x:0,v:278},{x:.18,v:438},{x:.32,v:298},{x:.50,v:548},{x:.68,v:678},{x:.82,v:598},{x:1,v:778}]},
        'D':{n:220,vol:.025,p:[{x:0,v:448},{x:.14,v:578},{x:.25,v:468},{x:.42,v:638},{x:.60,v:718},{x:.72,v:678},{x:.88,v:738},{x:1,v:798}]}}},
  MSFT:{lbl:'Microsoft Corporation',cat:'US Equity',catC:'#a8ff78',seed:88,
    wp:{'1W':{n:200,vol:.020,p:[{x:0,v:208},{x:.15,v:298},{x:.28,v:228},{x:.45,v:258},{x:.55,v:238},{x:.70,v:358},{x:.85,v:393},{x:1,v:418}]},
        '5D':{n:160,vol:.024,p:[{x:0,v:243},{x:.20,v:318},{x:.35,v:268},{x:.55,v:338},{x:.70,v:388},{x:.85,v:403},{x:1,v:413}]},
        'D':{n:220,vol:.012,p:[{x:0,v:358},{x:.15,v:388},{x:.28,v:368},{x:.45,v:398},{x:.62,v:413},{x:.78,v:403},{x:.90,v:416},{x:1,v:423}]}}},
  TSLA:{lbl:'Tesla Inc.',cat:'US Equity',catC:'#a8ff78',seed:66,
    wp:{'1W':{n:200,vol:.055,p:[{x:0,v:278},{x:.12,v:378},{x:.20,v:178},{x:.35,v:248},{x:.48,v:158},{x:.60,v:198},{x:.75,v:278},{x:.88,v:198},{x:1,v:248}]},
        '5D':{n:160,vol:.060,p:[{x:0,v:198},{x:.18,v:288},{x:.32,v:158},{x:.50,v:198},{x:.68,v:258},{x:.82,v:213},{x:1,v:243}]},
        'D':{n:220,vol:.030,p:[{x:0,v:183},{x:.15,v:223},{x:.28,v:188},{x:.45,v:208},{x:.62,v:238},{x:.78,v:213},{x:.90,v:233},{x:1,v:246}]}}},
  AMZN:{lbl:'Amazon.com Inc.',cat:'US Equity',catC:'#a8ff78',seed:44,
    wp:{'1W':{n:200,vol:.030,p:[{x:0,v:113},{x:.15,v:173},{x:.28,v:86},{x:.45,v:98},{x:.55,v:90},{x:.70,v:148},{x:.85,v:166},{x:1,v:188}]},
        '5D':{n:160,vol:.035,p:[{x:0,v:93},{x:.20,v:138},{x:.35,v:96},{x:.55,v:126},{x:.70,v:156},{x:.85,v:168},{x:1,v:184}]},
        'D':{n:220,vol:.018,p:[{x:0,v:153},{x:.15,v:170},{x:.28,v:156},{x:.45,v:168},{x:.62,v:178},{x:.78,v:172},{x:.90,v:181},{x:1,v:186}]}}},
  BTC:{lbl:'Bitcoin / US Dollar',cat:'Crypto',catC:'#ffd878',seed:99,
    wp:{'1W':{n:200,vol:.065,p:[{x:0,v:29800},{x:.15,v:67800},{x:.30,v:16800},{x:.50,v:29800},{x:.62,v:24800},{x:.72,v:47800},{x:.85,v:41800},{x:1,v:69800}]},
        '5D':{n:160,vol:.075,p:[{x:0,v:25800},{x:.18,v:44800},{x:.32,v:21800},{x:.52,v:34800},{x:.68,v:51800},{x:.82,v:43800},{x:1,v:64800}]},
        'D':{n:220,vol:.035,p:[{x:0,v:37800},{x:.14,v:47800},{x:.25,v:38800},{x:.42,v:43800},{x:.60,v:51800},{x:.72,v:45800},{x:.88,v:57800},{x:1,v:66800}]}}},
  ETH:{lbl:'Ethereum / US Dollar',cat:'Crypto',catC:'#ffd878',seed:111,
    wp:{'1W':{n:200,vol:.075,p:[{x:0,v:1798},{x:.14,v:4798},{x:.28,v:1098},{x:.45,v:1598},{x:.55,v:1198},{x:.70,v:3498},{x:.83,v:2998},{x:1,v:3998}]},
        '5D':{n:160,vol:.082,p:[{x:0,v:1498},{x:.18,v:3198},{x:.32,v:1198},{x:.52,v:2198},{x:.68,v:3398},{x:.82,v:2798},{x:1,v:3798}]},
        'D':{n:220,vol:.040,p:[{x:0,v:2198},{x:.15,v:2998},{x:.28,v:2298},{x:.45,v:2698},{x:.62,v:3198},{x:.78,v:2798},{x:.90,v:3398},{x:1,v:3898}]}}},
  SOL:{lbl:'Solana / US Dollar',cat:'Crypto',catC:'#ffd878',seed:222,
    wp:{'1W':{n:200,vol:.090,p:[{x:0,v:28},{x:.12,v:258},{x:.22,v:11},{x:.40,v:28},{x:.52,v:15},{x:.65,v:98},{x:.78,v:73},{x:.90,v:148},{x:1,v:198}]},
        '5D':{n:160,vol:.095,p:[{x:0,v:18},{x:.18,v:118},{x:.32,v:16},{x:.52,v:53},{x:.68,v:138},{x:.82,v:98},{x:1,v:188}]},
        'D':{n:220,vol:.050,p:[{x:0,v:78},{x:.15,v:138},{x:.28,v:88},{x:.45,v:118},{x:.62,v:163},{x:.78,v:138},{x:.90,v:178},{x:1,v:196}]}}},
  GLD:{lbl:'SPDR Gold Shares ETF',cat:'Commodity',catC:'#ffd878',seed:13,
    wp:{'1W':{n:200,vol:.012,p:[{x:0,v:159},{x:.20,v:188},{x:.35,v:153},{x:.52,v:168},{x:.65,v:183},{x:.80,v:176},{x:1,v:223}]},
        '5D':{n:160,vol:.014,p:[{x:0,v:166},{x:.22,v:193},{x:.38,v:160},{x:.55,v:176},{x:.70,v:186},{x:.85,v:180},{x:1,v:216}]},
        'D':{n:220,vol:.007,p:[{x:0,v:173},{x:.15,v:190},{x:.30,v:176},{x:.45,v:186},{x:.62,v:198},{x:.78,v:192},{x:.90,v:208},{x:1,v:218}]}}},
  SLV:{lbl:'iShares Silver ETF',cat:'Commodity',catC:'#ffd878',seed:14,
    wp:{'1W':{n:200,vol:.025,p:[{x:0,v:17},{x:.18,v:26},{x:.32,v:15},{x:.50,v:19},{x:.65,v:22},{x:.80,v:20},{x:1,v:28}]},
        '5D':{n:160,vol:.028,p:[{x:0,v:18},{x:.22,v:25},{x:.38,v:16},{x:.55,v:21},{x:.72,v:24},{x:.85,v:22},{x:1,v:27}]},
        'D':{n:220,vol:.015,p:[{x:0,v:22},{x:.15,v:25},{x:.30,v:21},{x:.45,v:24},{x:.62,v:26},{x:.78,v:24},{x:.90,v:27},{x:1,v:28}]}}},
  USO:{lbl:'US Oil Fund ETF',cat:'Commodity',catC:'#ffd878',seed:15,
    wp:{'1W':{n:200,vol:.030,p:[{x:0,v:54},{x:.15,v:79},{x:.28,v:49},{x:.45,v:64},{x:.60,v:71},{x:.75,v:67},{x:.90,v:77},{x:1,v:71}]},
        '5D':{n:160,vol:.035,p:[{x:0,v:59},{x:.20,v:77},{x:.35,v:55},{x:.55,v:67},{x:.70,v:73},{x:.85,v:69},{x:1,v:72}]},
        'D':{n:220,vol:.018,p:[{x:0,v:67},{x:.15,v:75},{x:.30,v:63},{x:.45,v:71},{x:.62,v:75},{x:.78,v:70},{x:.90,v:73},{x:1,v:71}]}}},
  TLT:{lbl:'20+ Year Treasury Bond ETF',cat:'Bond',catC:'#ff9bd0',seed:16,
    wp:{'1W':{n:200,vol:.015,p:[{x:0,v:144},{x:.15,v:129},{x:.30,v:109},{x:.50,v:94},{x:.65,v:87},{x:.78,v:91},{x:.90,v:99},{x:1,v:97}]},
        '5D':{n:160,vol:.018,p:[{x:0,v:119},{x:.22,v:104},{x:.38,v:91},{x:.55,v:95},{x:.72,v:101},{x:.85,v:97},{x:1,v:96}]},
        'D':{n:220,vol:.009,p:[{x:0,v:97},{x:.15,v:93},{x:.30,v:91},{x:.45,v:95},{x:.62,v:99},{x:.78,v:96},{x:.90,v:98},{x:1,v:97}]}}},
  DXY:{lbl:'US Dollar Index',cat:'Forex',catC:'#ff9bd0',seed:17,
    wp:{'1W':{n:200,vol:.008,p:[{x:0,v:91},{x:.15,v:95},{x:.30,v:104},{x:.50,v:113},{x:.65,v:109},{x:.78,v:105},{x:.90,v:103},{x:1,v:104}]},
        '5D':{n:160,vol:.010,p:[{x:0,v:99},{x:.22,v:107},{x:.38,v:111},{x:.55,v:107},{x:.72,v:104},{x:.85,v:103},{x:1,v:105}]},
        'D':{n:220,vol:.005,p:[{x:0,v:101},{x:.15,v:105},{x:.30,v:103},{x:.45,v:105},{x:.62,v:103},{x:.78,v:104},{x:.90,v:105},{x:1,v:104}]}}}
};

// ── ASSET BUTTON INIT ───────────────────────────────────
(function(){
  const row=document.getElementById('asset-row');
  if(!row)return;
  Object.keys(ASSETS).forEach(k=>{
    const b=document.createElement('button');
    b.className='abt'+(k==='SPY'?' act':'');
    b.dataset.a=k; b.textContent=k;
    b.onclick=()=>setAsset(k);
    row.appendChild(b);
  });
})();


// ═══════════════════════════════════════════════════════
// CHART ENGINE
// ═══════════════════════════════════════════════════════
let pCtx,oCtx,cW,pH=300,oH=220,dpr=1;
let curA='SPY',curTf='1W',curPx=null,curRes=null;
let animProg=0,mAlpha=0,animId=null;
let vpStart=null,vpEnd=null,isPan=false,panStartX=0,panStartVpS=0,panStartVpE=0;
let hoverBar=null;
let focusComp=null;
const PAD={top:22,bot:18,L:54,R:58};
const CORE_COMP_KEYS=new Set(['rsiSc','macdSc','obvSc','maSc','devSc']);
const LESSER_COMP_KEYS=new Set(['stochSc','wprSc','cciSc','bbSc','momSc','divSc']);

const scoreCol=s=>s<=10?'#4ADE80':s<=20?'#22C55E':s<=35?'#38BDF8':s<=65?'#E2E8F0':s<=80?'#FB923C':s<=90?'#EF4444':'#EC4899';
function isCoreComp(key){return CORE_COMP_KEYS.has(key);}
function isLesserComp(key){return LESSER_COMP_KEYS.has(key);}
function componentVisible(key){
  if(!isLesserComp(key))return true;
  const master=document.getElementById('tog-comp-lines');
  const item=document.getElementById('ctog-'+key);
  return (!master||master.checked!==false)&&(!item||item.checked!==false);
}
function setFocusComponent(key){
  focusComp=focusComp===key?null:key;
  document.querySelectorAll('.cj-focus-btn').forEach(b=>{
    const active=b.dataset.comp===focusComp;
    b.classList.toggle('active',active);
    b.setAttribute('aria-pressed',active?'true':'false');
  });
  redraw();
}

function initCanvases(){
  const pxC=document.getElementById('px-c'),oscC=document.getElementById('osc-c');
  if(!pxC||!oscC)return;
  dpr=window.devicePixelRatio||1;
  cW=Math.max(300,oscC.parentElement.clientWidth);
  function setup(c,h){c.width=cW*dpr;c.height=h*dpr;c.style.width=cW+'px';c.style.height=h+'px';const x=c.getContext('2d');x.scale(dpr,dpr);return x;}
  pCtx=setup(pxC,pH);
  oCtx=setup(oscC,oH);
}

function getVP(n){const vs=vpStart!==null?Math.max(0,vpStart):0;const ve=vpEnd!==null?Math.min(n-1,vpEnd):n-1;return{vs,ve};}
function bX(i,n){const{vs,ve}=getVP(n);return PAD.L+((i-vs)/Math.max(1,ve-vs))*(cW-PAD.L-PAD.R);}
function sY(v){return PAD.top+(oH-PAD.top-PAD.bot)*(1-(v+5)/110);}
function pY(v,lo,hi){return PAD.top+(pH-PAD.top-PAD.bot)*(1-(v-lo)/(hi-lo+1e-9));}

// ── PRICE CHART
function drawPrice(prog){
  if(!curPx||!pCtx)return;
  const{op,cl,hi,lo,vl}=curPx,n=cl.length,drawn=Math.max(2,Math.floor(n*prog));
  const{vs,ve}=getVP(n);
  const visEnd=Math.min(ve,drawn-1);
  pCtx.clearRect(0,0,cW,pH);
  pCtx.fillStyle='#01020a';pCtx.fillRect(0,0,cW,pH);
  const priceH=pH*0.74,volTop=pH*0.79,volH=pH-PAD.bot-volTop;
  // price range from visible bars
  let loP=Infinity,hiP=-Infinity;
  for(let i=vs;i<=visEnd;i++){if(lo[i]<loP)loP=lo[i];if(hi[i]>hiP)hiP=hi[i];}
  if(!isFinite(loP)){loP=Math.min(...lo.slice(0,drawn));hiP=Math.max(...hi.slice(0,drawn));}
  loP*=0.997;hiP*=1.003;
  const py=v=>PAD.top+(priceH-PAD.top)*(1-(v-loP)/(hiP-loP+1e-9));
  const bw=Math.max(1.2,(cW-PAD.L-PAD.R)/Math.max(1,ve-vs+1)*0.65);
  const maxV=Math.max(...vl.slice(0,drawn+1).filter(isFinite),1);
  const chk=id=>{const el=document.getElementById(id);return !el||el.checked!==false;};

  // Y-axis price labels + grid
  pCtx.font='8px IBM Plex Mono,monospace';pCtx.textAlign='right';
  const steps=5,pStep=(hiP-loP)/steps;
  for(let k=0;k<=steps;k++){
    const p=loP+k*pStep,y=py(p);
    const lbl=curA==='BTC'?'$'+(p/1000).toFixed(0)+'k':curA==='SOL'||curA==='ETH'?'$'+p.toFixed(0):'$'+p.toFixed(0);
    pCtx.fillStyle='#1e1e28';pCtx.fillText(lbl,PAD.L-3,y+3);
    pCtx.strokeStyle='#0d0e1a';pCtx.lineWidth=0.4;pCtx.setLineDash([2,6]);
    pCtx.beginPath();pCtx.moveTo(PAD.L,y);pCtx.lineTo(cW-PAD.R,y);pCtx.stroke();
  }
  pCtx.setLineDash([]);

  // Volume bars
  if(chk('tog-vol')){
    for(let i=vs;i<=visEnd;i++){
      const x=bX(i,n),bull=cl[i]>=op[i];
      pCtx.fillStyle=bull?'#26A69A33':'#EF535033';
      const vh=(vl[i]/maxV)*volH;
      pCtx.fillRect(x-bw/2,volTop+volH-vh,bw,vh);
    }
    pCtx.fillStyle='#1a1a28';pCtx.font='7px IBM Plex Mono,monospace';pCtx.textAlign='left';
    pCtx.fillText('VOL',PAD.L+2,volTop+8);
  }

  // Moving averages (drawn before candles so candles sit on top)
  if(chk('tog-mas')&&curRes&&curRes.mas&&drawn>50){
    const m=curRes.mas;
    const drawMALine=(vals,color,lw,alpha)=>{
      if(!vals)return;
      pCtx.save();pCtx.strokeStyle=color;pCtx.lineWidth=lw;pCtx.globalAlpha=alpha;pCtx.lineJoin='round';
      pCtx.beginPath();let f=true;
      for(let i=vs;i<=visEnd;i++){
        if(!isFinite(vals[i]))continue;
        const yv=py(vals[i]);
        if(yv<PAD.top-2||yv>priceH+2){f=true;continue;}
        const xv=bX(i,n);
        f?(pCtx.moveTo(xv,yv),f=false):pCtx.lineTo(xv,yv);
      }
      pCtx.stroke();pCtx.restore();
    };
    // EMA20/SMA50 fill
    pCtx.save();
    pCtx.beginPath();let ff=true;
    for(let i=vs;i<=visEnd;i++){if(!isFinite(m.e20[i]))continue;const xv=bX(i,n),yv=py(m.e20[i]);ff?(pCtx.moveTo(xv,yv),ff=false):pCtx.lineTo(xv,yv);}
    for(let i=visEnd;i>=vs;i--){if(!isFinite(m.s50[i]))continue;pCtx.lineTo(bX(i,n),py(m.s50[i]));}
    pCtx.closePath();pCtx.fillStyle='rgba(34,197,94,0.06)';pCtx.fill();pCtx.restore();
    drawMALine(m.e20,'#22C55E',1.2,0.65);
    drawMALine(m.s50,'#16A34A',1.0,0.50);
    drawMALine(m.s200,'#F59E0B',1.6,0.75);
    // MA legend
    pCtx.font='8px IBM Plex Mono,monospace';pCtx.textAlign='left';
    const legY=priceH+12;
    pCtx.fillStyle='#22C55E55';pCtx.fillText('▬ EMA20  ',PAD.L,legY);
    pCtx.fillStyle='#16A34A55';pCtx.fillText('▬ SMA50  ',PAD.L+60,legY);
    pCtx.fillStyle='#F59E0B55';pCtx.fillText('▬ SMA200',PAD.L+120,legY);
  }

  // Candlesticks
  for(let i=vs;i<=visEnd;i++){
    const x=bX(i,n),bull=cl[i]>=op[i],col=bull?'#26A69A':'#EF5350';
    pCtx.strokeStyle=col;pCtx.lineWidth=Math.max(0.7,bw*0.12);
    pCtx.beginPath();pCtx.moveTo(x,py(hi[i]));pCtx.lineTo(x,py(lo[i]));pCtx.stroke();
    const bodyT=Math.min(py(op[i]),py(cl[i])),bodyB=Math.max(py(op[i]),py(cl[i]));
    pCtx.fillStyle=col;
    pCtx.fillRect(x-bw/2,bodyT,bw,Math.max(1,bodyB-bodyT));
  }

  // Current price tag in right margin
  if(visEnd>=drawn-1&&drawn>=n){
    const last=cl[n-1],ly=py(last);
    const lbl=curA==='BTC'?'$'+(last/1000).toFixed(1)+'k':curA==='SOL'||curA==='ETH'?'$'+last.toFixed(0):'$'+last.toFixed(2);
    const col2=cl[n-1]>=op[n-1]?'#26A69A':'#EF5350';
    pCtx.font='bold 9px IBM Plex Mono,monospace';
    // Dashed line to margin
    pCtx.strokeStyle=col2+'55';pCtx.lineWidth=0.5;pCtx.setLineDash([3,3]);
    pCtx.beginPath();pCtx.moveTo(PAD.L,ly);pCtx.lineTo(cW-PAD.R+1,ly);pCtx.stroke();
    pCtx.setLineDash([]);
    // Price pill in right margin
    pCtx.fillStyle=col2+'ee';pCtx.fillRect(cW-PAD.R+2,ly-9,PAD.R-4,17);
    pCtx.fillStyle='#01020a';pCtx.textAlign='left';pCtx.fillText(lbl,cW-PAD.R+5,ly+4);
  }

  // Hover crosshair
  if(hoverBar!==null&&hoverBar>=vs&&hoverBar<=visEnd){
    const hx=bX(hoverBar,n);
    pCtx.save();pCtx.strokeStyle='rgba(255,255,255,0.13)';pCtx.lineWidth=1;pCtx.setLineDash([]);
    pCtx.beginPath();pCtx.moveTo(hx,PAD.top);pCtx.lineTo(hx,priceH);pCtx.stroke();
    if(isFinite(cl[hoverBar])){
      const hy=py(cl[hoverBar]);
      pCtx.strokeStyle='rgba(255,255,255,0.07)';
      pCtx.beginPath();pCtx.moveTo(PAD.L,hy);pCtx.lineTo(cW-PAD.R,hy);pCtx.stroke();
      // Dot at close
      const col=cl[hoverBar]>=op[hoverBar]?'#26A69A':'#EF5350';
      pCtx.fillStyle=col;pCtx.beginPath();pCtx.arc(hx,hy,3,0,Math.PI*2);pCtx.fill();
    }
    pCtx.restore();
  }

  pCtx.fillStyle='#252535';pCtx.font='9px IBM Plex Mono,monospace';pCtx.textAlign='left';
  pCtx.fillText(curA+' · '+(ASSETS[curA]?ASSETS[curA].lbl:'')+'  ·  Price',PAD.L+4,13);
}
function drawOsc(prog,mAlp){
  if(!curRes||!oCtx)return;
  oCtx.clearRect(0,0,cW,oH);
  oCtx.fillStyle='#01020a';oCtx.fillRect(0,0,cW,oH);
  const{resonance,comp}=curRes,n=resonance.length,drawn=Math.max(2,Math.floor(n*prog));
  const{vs,ve}=getVP(n);
  const visEnd=Math.min(ve,drawn-1);
  const chk=id=>{const el=document.getElementById(id);return !el||el.checked!==false;};

  // Zone backgrounds (per visible bar)
  if(chk('tog-zones')){
    for(let i=vs;i<=visEnd;i++){
      const s=N2(resonance[i]),x=bX(i,n),x2=bX(Math.min(i+1,n-1),n);
      let col='rgba(2,6,23,0.7)';
      if(s<=10)col='rgba(20,83,45,0.30)';
      else if(s<=20)col='rgba(49,46,129,0.26)';
      else if(s>=90)col='rgba(69,10,10,0.30)';
      else if(s>=80)col='rgba(67,20,7,0.26)';
      oCtx.fillStyle=col;
      oCtx.fillRect(x,PAD.top,x2-x+1,oH-PAD.top-PAD.bot);
    }
  }

  // MACD histogram overlay (subtle, centered on 50)
  if(chk('tog-macd-hist')&&curRes.raw&&curRes.raw.hist){
    const hist=curRes.raw.hist;
    const validH=hist.slice(vs,visEnd+1).filter(v=>isFinite(v));
    if(validH.length>1){
      const maxAbs=Math.max(...validH.map(Math.abs))*1.05;
      const midY=sY(50);
      const halfH=(sY(0)-sY(100))*0.26;
      const bwH=Math.max(0.5,(cW-PAD.L-PAD.R)/Math.max(1,ve-vs+1)*0.58);
      for(let i=vs;i<=visEnd;i++){
        if(!isFinite(hist[i]))continue;
        const x=bX(i,n),normH=hist[i]/maxAbs*halfH;
        const y=midY-normH;
        oCtx.fillStyle=hist[i]>=0?'rgba(38,166,154,0.22)':'rgba(239,83,80,0.22)';
        oCtx.fillRect(x-bwH/2,Math.min(y,midY),bwH,Math.max(0.5,Math.abs(normH)));
      }
    }
  }

  // Reference lines — always shown
  function hLine(score,col,lw,dash,labelText,labelCol){
    const y=sY(score);
    oCtx.save();oCtx.strokeStyle=col;oCtx.lineWidth=lw||0.6;
    if(dash)oCtx.setLineDash(dash);
    oCtx.beginPath();oCtx.moveTo(PAD.L,y);oCtx.lineTo(cW-PAD.R,y);oCtx.stroke();oCtx.restore();
    oCtx.fillStyle='#252535';oCtx.font='8px IBM Plex Mono,monospace';oCtx.textAlign='right';
    oCtx.fillText(score,PAD.L-4,y+3);
    if(labelText){
      oCtx.fillStyle=labelCol||col;oCtx.font='7px IBM Plex Mono,monospace';oCtx.textAlign='left';
      oCtx.globalAlpha=0.5;oCtx.fillText(labelText,cW-PAD.R+2,y+3);oCtx.globalAlpha=1;
    }
  }
  hLine(100,'#00BCD4',0.7,null,'100',null);
  hLine(80,'#00BCD4',0.7,[3,4],'SELL',null);
  hLine(50,'rgba(90,90,110,0.4)',0.5,[2,6],'50',null);
  hLine(20,'#9C27B0',0.8,null,'BUY','#9C27B0');
  hLine(0,'#9C27B0',0.7,null,'0',null);

  // Component lines
  const COMP_COLS={rsiSc:'#E040FB',stochSc:'#00BCD4',wprSc:'#FF5252',cciSc:'#FF9800',bbSc:'#FFEB3B',macdSc:'#2196F3',momSc:'#26C6DA',obvSc:'#66BB6A',maSc:'#4CAF50',devSc:'#AB47BC',divSc:'#F06292'};
  if(comp){
    Object.entries(comp).forEach(([key,vals])=>{
      if(!componentVisible(key))return;
      const hi=hoverBar!==null;
      const focused=focusComp===key;
      oCtx.save();
      oCtx.strokeStyle=COMP_COLS[key]||'#fff';
      oCtx.lineWidth=focused?1.8:(hi?1.1:0.75);
      oCtx.globalAlpha=focused?0.92:(hi?0.60:0.28);
      oCtx.lineJoin='round';
      oCtx.beginPath();
      let first=true;
      for(let i=vs;i<=visEnd;i++){
        const v=N2(vals[i]),x=bX(i,n),y=sY(v);
        first?(oCtx.moveTo(x,y),first=false):oCtx.lineTo(x,y);
      }
      oCtx.stroke();oCtx.restore();
    });
  }

  // Resonance Score line
  for(let i=Math.max(vs,1);i<=visEnd;i++){
    const sv=N2(resonance[i]),pv=N2(resonance[i-1]);
    oCtx.strokeStyle=scoreCol(sv);oCtx.lineWidth=2.4;oCtx.globalAlpha=.95;
    oCtx.lineJoin='round';oCtx.lineCap='round';
    oCtx.beginPath();oCtx.moveTo(bX(i-1,n),sY(pv));oCtx.lineTo(bX(i,n),sY(sv));oCtx.stroke();
    oCtx.globalAlpha=1;
  }

  // Current value label
  if(visEnd>=drawn-1&&drawn>=n){
    const last=N2(resonance[n-1]),lx=bX(n-1,n),ly=sY(last),col=scoreCol(last);
    oCtx.font='bold 10px IBM Plex Mono,monospace';
    const lbl=last.toFixed(1),tw=oCtx.measureText(lbl).width+8;
    oCtx.fillStyle=col+'22';oCtx.fillRect(lx+2,ly-8,tw,16);
    oCtx.fillStyle=col;oCtx.textAlign='left';oCtx.fillText(lbl,lx+6,ly+4);
  }

  if(mAlp>0&&chk('tog-markers'))drawMarkers(resonance,n,mAlp);

  // Hover crosshair + dots on component lines
  if(hoverBar!==null&&hoverBar>=vs&&hoverBar<=visEnd){
    const hx=bX(hoverBar,n);
    oCtx.strokeStyle='rgba(255,255,255,0.13)';oCtx.lineWidth=1;oCtx.setLineDash([]);
    oCtx.beginPath();oCtx.moveTo(hx,PAD.top);oCtx.lineTo(hx,oH-PAD.bot);oCtx.stroke();
    // Resonance Score dot
    if(isFinite(resonance[hoverBar])){
      const hy=sY(N2(resonance[hoverBar])),col=scoreCol(N2(resonance[hoverBar]));
      oCtx.fillStyle=col;oCtx.beginPath();oCtx.arc(hx,hy,4.5,0,Math.PI*2);oCtx.fill();
    }
    // Component dots
    if(comp){
      Object.entries(comp).forEach(([key,vals])=>{
        if(!componentVisible(key)||!isFinite(vals[hoverBar]))return;
        oCtx.fillStyle=COMP_COLS[key]||'#fff';
        oCtx.globalAlpha=0.85;
        oCtx.beginPath();oCtx.arc(hx,sY(N2(vals[hoverBar])),2.5,0,Math.PI*2);oCtx.fill();
        oCtx.globalAlpha=1;
      });
    }
  }

  oCtx.fillStyle='#1e1e28';oCtx.font='9px IBM Plex Mono,monospace';oCtx.textAlign='left';
  oCtx.fillText('Resonance  ·  '+curA+'  ·  '+curTf,PAD.L+4,14);
}
function drawMarkers(resonance,n,alpha){
  oCtx.save();oCtx.globalAlpha=alpha;
  const{vs,ve}=getVP(n);
  let inB=false,inS=false;
  for(let i=Math.max(vs,1);i<=ve;i++){
    const s=N2(resonance[i]),p=N2(resonance[i-1]),x=bX(i,n);
    if(p>=20&&s<20&&!inB&&s>10){inB=true;oCtx.fillStyle='#22C55E';oCtx.font='13px serif';oCtx.textAlign='center';oCtx.fillText('▲',x,sY(s)+15);}
    if(s>=20)inB=false;
    if(p>=10&&s<10){oCtx.fillStyle='#4ADE80';oCtx.font='16px serif';oCtx.textAlign='center';oCtx.fillText('◆',x,sY(s)+17);}
    if(p<=80&&s>80&&!inS&&s<90){inS=true;oCtx.fillStyle='#EF4444';oCtx.font='13px serif';oCtx.textAlign='center';oCtx.fillText('▼',x,sY(s)-5);}
    if(s<=80)inS=false;
    if(p<=90&&s>90){oCtx.fillStyle='#EC4899';oCtx.font='16px serif';oCtx.textAlign='center';oCtx.fillText('◆',x,sY(s)-7);}
  }
  oCtx.restore();
}
// ── DATE AXIS
function drawDateAxis(){
  const ax=document.getElementById('date-axis');
  if(!ax)return;
  ax.innerHTML='';ax.style.position='relative';
  if(!curRes)return;
  const n=curRes.resonance.length;
  const{vs,ve}=getVP(n);
  const steps=6;
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for(let k=0;k<=steps;k++){
    const i=Math.round(vs+k/steps*(ve-vs));
    if(i>=n)continue;
    let lbl='';
    if(curPx&&curPx.timestamps&&curPx.timestamps[i]){
      const d=new Date(curPx.timestamps[i]*1000);
      lbl=MONTHS[d.getMonth()]+"'"+String(d.getFullYear()).slice(2);
    } else {
      const synth={'1W':['2020','2021','2022','2023','2024'],'5D':['2022','2023','2024'],'D':['Jan','Apr','Jul','Oct','Jan']};
      const arr=synth[curTf]||[];
      if(arr.length)lbl=arr[Math.round(k/(steps)*Math.max(0,arr.length-1))]||'';
    }
    if(!lbl)continue;
    const x=bX(i,n);
    const el=document.createElement('span');
    el.textContent=lbl;
    el.style.cssText='position:absolute;font-size:9px;color:#1e1e28;letter-spacing:.05em;transform:translateX(-50%);left:'+x+'px;top:4px;font-family:IBM Plex Mono,monospace;pointer-events:none';
    ax.appendChild(el);
  }
}
// ── ANIMATION
function startAnim(){
  if(animId){cancelAnimationFrame(animId);animId=null;}
  animProg=0;mAlpha=0;
  let frame=0;
  function tick(){
    frame++;
    animProg=Math.min(1,frame/85);
    if(animProg>=1)mAlpha=Math.min(1,mAlpha+0.055);
    drawPrice(animProg);drawOsc(animProg,mAlpha);
    if(animProg<1||mAlpha<1)animId=requestAnimationFrame(tick);
    else{animId=null;updateScoreStrip();drawDateAxis();}
  }
  animId=requestAnimationFrame(tick);
}

function redraw(){drawPrice(animProg);drawOsc(animProg,mAlpha);}

// ── HOVER TOOLTIPS + CROSSHAIR
const COMP_NAME={rsiSc:'RSI',devSc:'MA Deviation',maSc:'MA Grid',obvSc:'OBV',macdSc:'MACD',divSc:'Divergence',stochSc:'Stochastic',wprSc:'WPR',cciSc:'CCI',bbSc:'Bollinger %B',momSc:'Momentum'};
const COMP_COLS_TIP={rsiSc:'#E040FB',stochSc:'#00BCD4',wprSc:'#FF5252',cciSc:'#FF9800',bbSc:'#FFEB3B',macdSc:'#2196F3',momSc:'#26C6DA',obvSc:'#66BB6A',maSc:'#4CAF50',devSc:'#AB47BC',divSc:'#F06292'};
const TIP_MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getBarDateFull(i){
  if(curPx&&curPx.timestamps&&curPx.timestamps[i]){
    const d=new Date(curPx.timestamps[i]*1000);
    return TIP_MONTHS[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();
  }
  return 'Bar '+(i+1);
}

function updateHoverTooltips(){
  if(hoverBar===null||!curRes||!curPx)return;
  const i=hoverBar,n=curRes.resonance.length;
  if(i<0||i>=n)return;
  const dt=getBarDateFull(i);
  const chk=id=>{const el=document.getElementById(id);return !el||el.checked!==false;};

  // Price chart tooltip
  const px_tip=document.getElementById('px-tip');
  if(px_tip&&i<curPx.cl.length&&isFinite(curPx.cl[i])){
    const cl=curPx.cl[i],op=curPx.op[i],hi=curPx.hi[i],lo=curPx.lo[i];
    const bull=cl>=op;
    const fmt=v=>curA==='BTC'?'$'+(v/1000).toFixed(2)+'k':curA==='SOL'||curA==='ETH'?'$'+v.toFixed(1):'$'+v.toFixed(2);
    const col=bull?'#26A69A':'#EF5350';
    let html='<div style="font-size:9px;color:#444;margin-bottom:5px;letter-spacing:.04em">'+dt+'</div>';
    html+='<div style="font-size:13px;font-weight:700;color:'+col+';margin-bottom:6px">'+fmt(cl)+'</div>';
    html+='<div style="display:grid;grid-template-columns:auto 1fr;gap:2px 8px;font-size:9px">';
    html+='<span style="color:#333">O</span><span style="color:#777">'+fmt(op)+'</span>';
    html+='<span style="color:#333">H</span><span style="color:#4CAF5088">'+fmt(hi)+'</span>';
    html+='<span style="color:#333">L</span><span style="color:#EF535088">'+fmt(lo)+'</span>';
    html+='<span style="color:#333">C</span><span style="color:'+col+'">'+fmt(cl)+'</span>';
    if(chk('tog-mas')&&curRes.mas){
      if(isFinite(curRes.mas.e20[i]))html+='<span style="color:#22C55E44">EMA20</span><span style="color:#22C55E99">'+fmt(curRes.mas.e20[i])+'</span>';
      if(isFinite(curRes.mas.s50[i]))html+='<span style="color:#16A34A44">SMA50</span><span style="color:#16A34A99">'+fmt(curRes.mas.s50[i])+'</span>';
      if(isFinite(curRes.mas.s200[i]))html+='<span style="color:#F59E0B44">SMA200</span><span style="color:#F59E0B99">'+fmt(curRes.mas.s200[i])+'</span>';
    }
    html+='</div>';
    const pxC=document.getElementById('px-c');
    const x=pxC?bX(i,n):cW/2;
    const leftPos=x>cW*0.62?x-190:x+12;
    px_tip.innerHTML=html;
    px_tip.style.cssText='display:block;left:'+leftPos+'px;top:26px';
  }

  // Oscillator tooltip
  const osc_tip=document.getElementById('osc-tip');
  if(osc_tip&&isFinite(curRes.resonance[i])){
    const score=N2(curRes.resonance[i]);
    const col=scoreCol(score);
    let zone='Neutral';
    if(score<=10)zone='Lifetime Buy';else if(score<=20)zone='Buy Zone';else if(score>=90)zone='Lifetime Sell';else if(score>=80)zone='Sell Zone';
    let html='<div style="font-size:9px;color:#444;margin-bottom:4px;letter-spacing:.04em">'+dt+'</div>';
    html+='<div style="font-size:17px;font-weight:700;color:'+col+';line-height:1">'+score.toFixed(1)+'</div>';
    html+='<div style="font-size:9px;color:'+col+'88;margin-bottom:7px;text-transform:uppercase;letter-spacing:.08em">'+zone+'</div>';
    if(curRes.comp){
      html+='<div style="display:flex;flex-direction:column;gap:2px">';
      Object.entries(curRes.comp).forEach(([k,v])=>{
        if(!isCoreComp(k)||!isFinite(v[i]))return;
        const c2=COMP_COLS_TIP[k]||'#888',nm=COMP_NAME[k]||k;
        html+='<div style="display:flex;justify-content:space-between;gap:10px;font-size:9px"><span style="color:'+c2+'77">'+nm+'</span><span style="color:'+c2+'">'+N2(v[i]).toFixed(0)+'</span></div>';
      });
      html+='</div>';
    }
    const oscC=document.getElementById('osc-c');
    const x=oscC?bX(i,n):cW/2;
    const leftPos=x>cW*0.62?x-185:x+12;
    osc_tip.innerHTML=html;
    osc_tip.style.cssText='display:block;left:'+leftPos+'px;top:26px';
  }
}

function hideTooltips(){
  const a=document.getElementById('px-tip');if(a)a.style.display='none';
  const b=document.getElementById('osc-tip');if(b)b.style.display='none';
}

// ── PAN / ZOOM + HOVER INIT
function initHoverAndPan(){
  const pxC=document.getElementById('px-c');
  const oscC=document.getElementById('osc-c');
  if(!pxC||!oscC)return;

  function barFromX(mx,n){
    const{vs,ve}=getVP(n);
    const frac=(mx-PAD.L)/Math.max(1,cW-PAD.L-PAD.R);
    return Math.max(vs,Math.min(ve,Math.round(vs+frac*(ve-vs))));
  }

  function onHoverMove(e,canvas){
    if(isPan)return;
    if(!curRes||animProg<1){return;}
    const n=curRes.resonance.length;
    const rect=canvas.getBoundingClientRect();
    const mx=(e.clientX-rect.left);
    hoverBar=barFromX(mx,n);
    drawPrice(animProg);drawOsc(animProg,mAlpha);
    updateHoverTooltips();
  }

  pxC.addEventListener('mousemove',e=>onHoverMove(e,pxC));
  oscC.addEventListener('mousemove',e=>onHoverMove(e,oscC));
  pxC.addEventListener('mouseleave',()=>{hoverBar=null;drawPrice(animProg);drawOsc(animProg,mAlpha);hideTooltips();});
  oscC.addEventListener('mouseleave',()=>{hoverBar=null;drawPrice(animProg);drawOsc(animProg,mAlpha);hideTooltips();});

  // Pan (drag on price chart)
  pxC.addEventListener('mousedown',e=>{
    if(!curRes)return;
    const n=curRes.resonance.length;
    isPan=true;panStartX=e.clientX;
    panStartVpS=vpStart!==null?vpStart:0;
    panStartVpE=vpEnd!==null?vpEnd:n-1;
    pxC.style.cursor='grabbing';
  });
  const onPanMove=e=>{
    if(!isPan||!curRes)return;
    const n=curRes.resonance.length;
    const{vs,ve}=getVP(n);
    const visible=ve-vs+1;
    const pxPerBar=(cW-PAD.L-PAD.R)/Math.max(1,visible);
    const dBars=Math.round((e.clientX-panStartX)/pxPerBar*-1);
    let newVs=panStartVpS+dBars,newVe=panStartVpE+dBars;
    if(newVs<0){newVe-=newVs;newVs=0;}
    if(newVe>=n){newVs-=(newVe-n+1);newVe=n-1;}
    vpStart=Math.max(0,newVs);vpEnd=Math.min(n-1,newVe);
    drawPrice(animProg);drawOsc(animProg,mAlpha);drawDateAxis();updateResetBtn();
  };
  const onPanEnd=()=>{isPan=false;if(pxC)pxC.style.cursor='crosshair';};
  window.addEventListener('mousemove',onPanMove);
  window.addEventListener('mouseup',onPanEnd);

  // Scroll wheel zoom (price chart)
  pxC.addEventListener('wheel',e=>{
    if(!curRes)return;
    e.preventDefault();
    const n=curRes.resonance.length;
    const{vs,ve}=getVP(n);
    const visible=ve-vs+1;
    const factor=e.deltaY>0?1.18:1/1.18;
    const newVisible=Math.min(n,Math.max(8,Math.round(visible*factor)));
    const rect=pxC.getBoundingClientRect();
    const mx=e.clientX-rect.left;
    const frac=Math.max(0,Math.min(1,(mx-PAD.L)/Math.max(1,cW-PAD.L-PAD.R)));
    const pivot=Math.round(vs+frac*(ve-vs));
    let newVs=Math.round(pivot-frac*newVisible);
    let newVe=newVs+newVisible-1;
    if(newVs<0){newVe-=newVs;newVs=0;}
    if(newVe>=n){newVs-=(newVe-n+1);newVe=n-1;}
    vpStart=Math.max(0,newVs);vpEnd=Math.min(n-1,newVe);
    if(vpStart===0&&vpEnd===n-1){vpStart=null;vpEnd=null;}
    drawPrice(animProg);drawOsc(animProg,mAlpha);drawDateAxis();updateResetBtn();
  },{passive:false});
}

function resetViewport(){
  vpStart=null;vpEnd=null;
  drawPrice(animProg);drawOsc(animProg,mAlpha);drawDateAxis();updateResetBtn();
}
function updateResetBtn(){
  const b=document.getElementById('cj-resetvp');
  if(!b)return;
  b.style.display=(vpStart!==null||vpEnd!==null)?'inline-block':'none';
}
window.resetViewport=resetViewport;

function updateScoreStrip(){
  if(!curRes)return;
  const resonanceSc=curRes.resonance;
  const valid=resonanceSc.filter(v=>isFinite(v));
  const last=N2(valid[valid.length-1]),prev=N2(valid[valid.length-2]);
  const col=scoreCol(last);
  const dir=last>prev+0.3?'↑ Rising':last<prev-0.3?'↓ Falling':'→ Stable';
  let zone='Neutral',zoneDesc='Score is in the mid-range. No extreme reading across the 11 signals.';
  if(last<=10){zone='Lifetime Buy';zoneDesc='Extreme undervaluation. 7–8 of 11 signals simultaneously at historic lows. Rarest zone — coincides with major cycle bottoms.';}
  else if(last<=20){zone='Buy Zone';zoneDesc='Significant undervaluation. Multiple signals in extreme territory simultaneously. The confluence multiplier is active.';}
  else if(last>=90){zone='Lifetime Sell';zoneDesc='Peak overvaluation. 7–8 signals simultaneously at historic highs. Historically coincides with major cycle tops.';}
  else if(last>=80){zone='Sell Zone';zoneDesc='Significant overvaluation. Multiple signals in overbought territory. Historically precedes major corrections.';}
  const sv=document.getElementById('s-val');if(sv){sv.textContent=last.toFixed(1);sv.style.color=col;}
  const sa=document.getElementById('s-asset');if(sa)sa.textContent=curA;
  const st=document.getElementById('s-tf');if(st)st.textContent=curTf;
  const dEl=document.getElementById('s-dir');if(dEl){dEl.textContent=dir;dEl.style.cssText='color:'+col+';background:'+col+'18;padding:2px 8px;border-radius:2px;font-size:10px;font-weight:500';}
  const szEl=document.getElementById('s-zone');if(szEl){szEl.textContent=zone;szEl.style.color=col;}
  const sdEl=document.getElementById('s-desc');if(sdEl)sdEl.textContent=zoneDesc;
}

// ═══════════════════════════════════════════════════════
// COMPONENT DEFINITIONS
// ═══════════════════════════════════════════════════════
const COMP_DEFS=[
  {key:'rsiSc',raw:'rsiRaw',nm:'RSI',sub:'Relative Strength Index · 14 period',col:'#E040FB',
   draw:'oscillator',lo:0,hi:100,refs:[{v:70,c:'#EF444433'},{v:50,c:'#33333344'},{v:30,c:'#22C55E33'}],
   reason:'Momentum foundation — measures the velocity of price change over 14 periods. Extreme readings trigger the confluence multiplier.',
   desc:'Measures price momentum on a 0–100 scale. Below 30 = oversold territory contributing to the buy zone. Above 70 = overbought territory contributing to the sell zone.'},
  {key:'stochSc',raw:'stochK',nm:'Stochastic',sub:'K/D oscillator · 14/3/3',col:'#00BCD4',
   draw:'oscillator',lo:0,hi:100,refs:[{v:80,c:'#EF444433'},{v:50,c:'#33333344'},{v:20,c:'#22C55E33'}],
   reason:'Short-cycle momentum — catches fast exhaustion and recovery inside the broader macro structure.',
   desc:'Measures where price closes within its recent high-low range. Below 20 = oversold. Above 80 = overbought.'},
  {key:'wprSc',raw:'wprRaw',nm:'Williams %R',sub:'Range exhaustion · 14 period',col:'#FF5252',
   draw:'oscillator',lo:0,hi:100,refs:[{v:85,c:'#EF444433'},{v:50,c:'#33333344'},{v:15,c:'#22C55E33'}],
   reason:'Fast exhaustion detector — useful for confirming when price is pinned near the edge of its recent range.',
   desc:'Williams %R converted to a 0-100 display scale. Low readings show downside exhaustion; high readings show upside exhaustion.'},
  {key:'cciSc',raw:'cciRaw',nm:'CCI',sub:'Commodity Channel Index · normalized',col:'#FF9800',
   draw:'cci',lo:null,hi:null,refs:[{v:0,c:'#33333355'}],
   reason:'Mean-reversion pressure — measures how far typical price has moved away from its statistical mean.',
   desc:'CCI measures deviation from typical price. The backend normalizes it against the asset history before it enters the display series.'},
  {key:'bbSc',raw:'bbPct',nm:'Bollinger %B',sub:'Position inside Bollinger Bands · 20/2',col:'#FFEB3B',
   draw:'pctb',lo:null,hi:null,refs:[],
   reason:'Volatility envelope signal — shows whether price is stretched to the upper or lower statistical band.',
   desc:'Shows where price sits inside its Bollinger Band envelope. Near 0 = lower band pressure. Near 1 = upper band pressure.'},
  {key:'macdSc',raw:'hist',nm:'MACD',sub:'12/26/9 histogram · normalized',col:'#2196F3',
   draw:'macd',lo:null,hi:null,refs:[],
   reason:'Directional momentum confirmation — captures the rate of change of momentum, useful for confirming trend strength and detecting early-stage reversals.',
   desc:'MACD histogram (12/26/9) normalized against its historical range. Positive histogram means improving momentum; negative means weakening momentum.'},
  {key:'momSc',raw:'rocRaw',nm:'Momentum',sub:'Rate of Change · 14 period',col:'#26C6DA',
   draw:'mom',lo:null,hi:null,refs:[],
   reason:'Velocity signal — captures raw price acceleration and deceleration before slower trend tools respond.',
   desc:'Rate of Change measures percentage price movement over the lookback window. Positive values show upside momentum; negative values show downside momentum.'},
  {key:'obvSc',raw:'obvV',nm:'OBV',sub:'On-Balance Volume · EMA21 comparison',col:'#66BB6A',
   draw:'obv',lo:null,hi:null,refs:[],
   reason:'Volume intelligence — OBV captures institutional accumulation and distribution before it shows in price. One of the strongest leading signals at cycle extremes.',
   desc:'Compares OBV to its 21-period EMA. When OBV is above its EMA, buying pressure dominates (score > 50). Sustained distribution pulls the score lower.'},
  {key:'maSc',raw:'maGrid',nm:'MA Grid',sub:'EMA20 · SMA50 · SMA100 · SMA200 alignment',col:'#4CAF50',
   draw:'magrid',lo:null,hi:null,refs:[],
   reason:'Trend structure signal — cleanly measures bull/bear alignment across four different timeframe lookbacks simultaneously.',
   desc:'Scores 0, 25, 50, 75, or 100 based on how many of 4 key MAs price is trading above. Score 100 = full bull structure. Score 0 = full bear structure.'},
  {key:'devSc',raw:'devR',nm:'MA Deviation',sub:'Price distance from long-term mean · normalized',col:'#AB47BC',
   draw:'deviation',lo:null,hi:null,refs:[{v:0,c:'#33333355'}],
   reason:'Highest structural weight — captures how far price has stretched from its long-term mean. The most reliable macro-cycle predictor across any liquid asset.',
   desc:'Measures how far price has stretched from its 200-period SMA, normalized against the asset\'s own history. Score near 100 = overextended above mean. Score near 0 = underextended below mean.'},
  {key:'divSc',raw:'rsiRaw',nm:'RSI Divergence',sub:'Persistent pivot divergence detection',col:'#F06292',
   draw:'persistent',lo:0,hi:100,refs:[{v:65,c:'#EF444433'},{v:50,c:'#33333344'},{v:35,c:'#22C55E33'}],
   reason:'Divergence detection — when price makes a new extreme but RSI fails to confirm, it signals weakening momentum that pure oscillators miss.',
   desc:'Detects RSI divergence: price makes a new high/low while RSI fails to confirm. Signals persist with ~98.5% retention per bar so a confirmed divergence stays active for multiple bars.'},
];

// Edit panel component toggles
(function(){
  const ct=document.getElementById('comp-toggles');
  if(!ct)return;
  COMP_DEFS.filter(d=>isLesserComp(d.key)).forEach(d=>{
    const row=document.createElement('div');row.className='edit-row';
    row.innerHTML='<input type="checkbox" class="edit-chk" id="ctog-'+d.key+'" checked onchange="redraw()"><div class="edit-dot" style="background:'+d.col+'"></div><span class="edit-name" style="color:'+d.col+'">'+d.nm+'</span><button type="button" class="cj-focus-btn" data-comp="'+d.key+'" aria-pressed="false" title="Highlight '+d.nm+'" onclick="setFocusComponent(\''+d.key+'\')"><span class="cj-focus-dot"></span><span>focus</span></button>';
    ct.appendChild(row);
  });
})();

// ── COMPONENT MINI CHART
function drawCompMini(canvas,def,compData,rawData){
  const dpr2=window.devicePixelRatio||1,w=canvas.offsetWidth||180,h=48;
  canvas.width=w*dpr2;canvas.height=h*dpr2;canvas.style.width=w+'px';canvas.style.height=h+'px';
  const c=canvas.getContext('2d');c.scale(dpr2,dpr2);
  c.fillStyle='#040510';c.fillRect(0,0,w,h);
  const n=(compData||[]).length||1;
  const P=5;const dW=w-P*2,dH=h-P*2;

  if(def.draw==='oscillator'||def.draw==='persistent'){
    def.refs.forEach(r=>{const y=P+dH*(1-r.v/100);c.strokeStyle=r.c;c.lineWidth=0.6;c.setLineDash([2,4]);c.beginPath();c.moveTo(P,y);c.lineTo(w-P,y);c.stroke();});c.setLineDash([]);
    const g=c.createLinearGradient(0,P,0,h-P);g.addColorStop(0,def.col+'25');g.addColorStop(1,def.col+'06');
    c.fillStyle=g;c.beginPath();
    compData.forEach((v,i)=>{if(isNaN(v))return;const x=P+(i/(n-1))*dW,y=P+dH*(1-v/100);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});
    c.lineTo(w-P,h-P);c.lineTo(P,h-P);c.closePath();c.fill();
    c.strokeStyle=def.col;c.lineWidth=1.4;c.lineJoin='round';c.beginPath();
    compData.forEach((v,i)=>{if(isNaN(v))return;const x=P+(i/(n-1))*dW,y=P+dH*(1-v/100);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();
  } else if(def.draw==='cci'){
    const valid=(rawData||[]).filter(v=>isFinite(v));if(valid.length<2)return;
    const am=Math.max(...valid.map(Math.abs))*1.05;
    const sy=v=>P+dH*(1-(v+am)/(am*2));const zero=sy(0);
    c.strokeStyle='#333';c.lineWidth=0.5;c.setLineDash([2,5]);c.beginPath();c.moveTo(P,zero);c.lineTo(w-P,zero);c.stroke();c.setLineDash([]);
    const g=c.createLinearGradient(0,P,0,h-P);g.addColorStop(0,'#EF444418');g.addColorStop(0.5,'#FF980010');g.addColorStop(1,'#22C55E18');c.fillStyle=g;
    c.beginPath();(rawData||[]).forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);if(i===0){c.moveTo(x,zero);c.lineTo(x,y);}else c.lineTo(x,y);});
    c.lineTo(P+(n-1)/(n-1)*dW,zero);c.closePath();c.fill();
    c.strokeStyle=def.col;c.lineWidth=1.3;c.lineJoin='round';c.beginPath();
    (rawData||[]).forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();
  } else if(def.draw==='pctb'){
    const data=(rawData||[]);
    [1,0.5,0].forEach(v=>{const y=P+dH*(1-v);c.strokeStyle=v===0.5?'#33333344':'#22222266';c.lineWidth=0.5;c.setLineDash([2,4]);c.beginPath();c.moveTo(P,y);c.lineTo(w-P,y);c.stroke();});c.setLineDash([]);
    c.fillStyle='#EF444410';c.fillRect(P,P,dW,dH*0.1);
    c.fillStyle='#22C55E10';c.fillRect(P,P+dH*0.9,dW,dH*0.1);
    c.strokeStyle=def.col;c.lineWidth=1.3;c.lineJoin='round';c.beginPath();
    data.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=P+dH*(1-clamp(v,-.1,1.1));if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();
  } else if(def.draw==='macd'){
    const hist=rawData||[];const valid=hist.filter(v=>isFinite(v));if(valid.length<2)return;
    const am=Math.max(...valid.map(Math.abs))*1.05;const sy=v=>P+dH*(1-(v+am)/(am*2));const zero=sy(0);
    c.strokeStyle='#333';c.lineWidth=0.5;c.setLineDash([2,5]);c.beginPath();c.moveTo(P,zero);c.lineTo(w-P,zero);c.stroke();c.setLineDash([]);
    const bw=Math.max(1,(dW/n)*0.65);
    hist.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);c.fillStyle=v>=0?'#26A69A55':'#EF535055';c.fillRect(x-bw/2,Math.min(y,zero),bw,Math.abs(y-zero));});
    c.strokeStyle=def.col;c.lineWidth=1.2;c.lineJoin='round';c.beginPath();
    compData.forEach((v,i)=>{if(isNaN(v))return;const x=P+(i/(n-1))*dW,y=P+dH*(1-v/100);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();
  } else if(def.draw==='mom'){
    const roc=rawData||[];const valid=roc.filter(v=>isFinite(v));if(valid.length<2)return;
    const am=Math.max(...valid.map(Math.abs))*1.05;const sy=v=>P+dH*(1-(v+am)/(am*2));const zero=sy(0);
    c.strokeStyle='#333';c.lineWidth=0.5;c.setLineDash([2,5]);c.beginPath();c.moveTo(P,zero);c.lineTo(w-P,zero);c.stroke();c.setLineDash([]);
    const bw=Math.max(1,(dW/n)*0.65);
    roc.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);c.fillStyle=v>=0?'#26C6DA44':'#FF525244';c.fillRect(x-bw/2,Math.min(y,zero),bw,Math.abs(y-zero));});
    c.strokeStyle=def.col;c.lineWidth=1;c.lineJoin='round';c.beginPath();
    roc.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();
  } else if(def.draw==='obv'){
    const obv=rawData||[];const valid=obv.filter(v=>isFinite(v));if(valid.length<2)return;
    const lo2=Math.min(...valid),hi2=Math.max(...valid);const sy=v=>P+dH*(1-(v-lo2)/(hi2-lo2+1e-9));
    const g=c.createLinearGradient(0,P,0,h-P);g.addColorStop(0,def.col+'22');g.addColorStop(1,def.col+'05');c.fillStyle=g;
    c.beginPath();obv.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});
    c.lineTo(w-P,h-P);c.lineTo(P,h-P);c.closePath();c.fill();
    c.strokeStyle=def.col;c.lineWidth=1.3;c.lineJoin='round';c.beginPath();
    obv.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();
  } else if(def.draw==='magrid'){
    const grid=rawData||[];
    [[0,25,'#EF444414'],[25,50,'#FB923C10'],[50,75,'#38BDF80a'],[75,100,'#22C55E12']].forEach(([lo2,hi2,col])=>{
      c.fillStyle=col;c.fillRect(P,P+dH*(1-hi2/100),dW,dH*(hi2-lo2)/100);});
    [25,50,75].forEach(v=>{const y=P+dH*(1-v/100);c.strokeStyle='#1e1e2a';c.lineWidth=0.5;c.setLineDash([2,5]);c.beginPath();c.moveTo(P,y);c.lineTo(w-P,y);c.stroke();});c.setLineDash([]);
    c.strokeStyle=def.col;c.lineWidth=2;c.lineJoin='miter';c.lineCap='square';c.beginPath();
    let prev=null;
    grid.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=P+dH*(1-v/100);
      if(prev===null){c.moveTo(x,y);}else{c.lineTo(x,prev);c.lineTo(x,y);}prev=y;});c.stroke();
    grid.forEach((v,i)=>{if(!isFinite(v)||i%8!==0)return;const x=P+(i/(n-1))*dW,y=P+dH*(1-v/100);
      const dotCol=v<=25?'#EF4444':v<=50?'#FB923C':v<=75?'#38BDF8':'#22C55E';
      c.fillStyle=dotCol;c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();});
  } else if(def.draw==='deviation'){
    const dev=rawData||[];const valid=dev.filter(v=>isFinite(v));if(valid.length<2)return;
    const am=Math.max(...valid.map(Math.abs))*1.05;const sy=v=>P+dH*(1-(v+am)/(am*2));const zero=sy(0);
    c.strokeStyle='#333';c.lineWidth=0.5;c.setLineDash([2,5]);c.beginPath();c.moveTo(P,zero);c.lineTo(w-P,zero);c.stroke();c.setLineDash([]);
    const g=c.createLinearGradient(0,P,0,h-P);g.addColorStop(0,'#EF444418');g.addColorStop(0.5,'#AB47BC10');g.addColorStop(1,'#22C55E18');
    c.beginPath();dev.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);if(i===0){c.moveTo(x,zero);c.lineTo(x,y);}else c.lineTo(x,y);});
    c.lineTo(P+(n-1)/(n-1)*dW,zero);c.closePath();c.fillStyle=g;c.fill();
    c.strokeStyle=def.col;c.lineWidth=1.4;c.lineJoin='round';c.beginPath();
    dev.forEach((v,i)=>{if(!isFinite(v))return;const x=P+(i/(n-1))*dW,y=sy(v);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);});c.stroke();
  }
}

function renderComponents(){
  const grid=document.getElementById('comp-grid');if(!grid)return;
  grid.innerHTML='';
  if(!curRes)return;
  const{comp,raw}=curRes;
  const displayDefs=COMP_DEFS.filter(def=>isCoreComp(def.key));
  displayDefs.forEach((def,idx)=>{
    const last=N2((comp[def.key]||[]).filter(v=>isFinite(v)).pop());
    const col=scoreCol(last);
    const interp=last<=25?'Low (Bullish)':last>=75?'High (Bearish)':'Neutral';
    const cell=document.createElement('div');cell.className='comp-cell';
    cell.innerHTML='<div class="comp-head"><div style="display:flex;align-items:center"><div class="comp-dot" style="background:'+def.col+'"></div><div class="comp-nm">'+def.nm+'</div></div></div>'
      +'<div class="comp-sub">'+def.sub+'</div>'
      +'<div style="font-size:9px;color:#2a2a3a;line-height:1.55;padding:4px 14px 5px;font-style:italic">'+(def.reason||'')+'</div>'
      +'<canvas class="cmini" id="cm'+idx+'"></canvas>'
      +'<div class="comp-val"><span class="comp-cur" style="color:'+col+'">'+last.toFixed(0)+'</span><span class="comp-interp" style="color:'+col+'">'+interp+'</span></div>'
      +'<div class="comp-desc">'+def.desc+'</div>';
    grid.appendChild(cell);
  });
  requestAnimationFrame(()=>{
    displayDefs.forEach((def,idx)=>{
      const canvas=document.getElementById('cm'+idx);if(!canvas)return;
      drawCompMini(canvas,def,curRes.comp[def.key]||[],curRes.raw[def.raw]||[]);
    });
  });
}

// ═══════════════════════════════════════════════════════
// SNAPSHOT — current reading, breakdown, stats, zone guide
// ═══════════════════════════════════════════════════════
function renderSignals(){
  const root=document.getElementById('snapshot-root');
  if(!root)return;

  if(!curRes||!curRes.resonance){
    root.innerHTML='<div style="padding:28px 22px;font-size:11px;color:#2a2a3a">Open the indicator tab first to load data, then return here.</div>';
    return;
  }

  const resonance=curRes.resonance;
  const comp=curRes.comp||{};
  const valid=resonance.filter(v=>isFinite(v));
  const last=N2(valid[valid.length-1]);
  const prev=N2(valid[valid.length-2]);
  const col=scoreCol(last);
  const dir=last>prev+0.3?'↑ Rising':last<prev-0.3?'↓ Falling':'→ Stable';
  let zone='Neutral',zoneSub='Signals are mixed or moderate across the composite.';
  if(last<=10){zone='Lifetime Buy';zoneSub='The rarest extreme. Most signals simultaneously at historic undervaluation levels. Confluence multiplier fully active.';}
  else if(last<=20){zone='Buy Zone';zoneSub='Significant undervaluation across multiple independent signals. Confluence multiplier active — this is not a weak signal.';}
  else if(last>=90){zone='Lifetime Sell';zoneSub='The rarest extreme. Most signals simultaneously at historic overvaluation levels. Historically coincides with major cycle tops.';}
  else if(last>=80){zone='Sell Zone';zoneSub='Significant overvaluation across multiple signals. Confluence multiplier active. Historically precedes material corrections.';}

  // ── HEADER: big score display
  let html='<div style="display:flex;align-items:stretch;gap:0;border-bottom:1px solid #0d0e18">';
  // Left: score
  html+='<div style="padding:28px 28px 24px;flex:1">';
  html+='<div style="font-size:9px;color:#333;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px">'+curA+' · '+curTf+' · Resonance Score</div>';
  html+='<div style="font-size:54px;font-weight:700;line-height:1;letter-spacing:-.04em;color:'+col+';font-variant-numeric:tabular-nums">'+last.toFixed(1)+'</div>';
  html+='<div style="margin-top:10px;display:flex;align-items:center;gap:8px">';
  html+='<span style="font-size:11px;color:'+col+';padding:3px 10px;background:'+col+'14;border-radius:2px;font-weight:600">'+zone+'</span>';
  html+='<span style="font-size:11px;color:'+col+'88">'+dir+'</span>';
  html+='</div>';
  html+='<div style="font-size:11px;color:#3a3a4a;margin-top:10px;line-height:1.7;max-width:420px">'+zoneSub+'</div>';
  html+='</div>';
  // Right: zone scale visual
  html+='<div style="width:5px;display:flex;flex-direction:column;flex-shrink:0">';
  const zones=[['#4ADE80',10],['#22C55E',20],['#1a1a2a',80],['#FB923C',90],['#EC4899',100]];
  zones.forEach(([c,end],i)=>{
    const start=i===0?0:zones[i-1][1];
    const pct=(end-start);
    const isCurrent=last>=start&&last<=end;
    html+='<div style="flex:'+pct+';background:'+c+(isCurrent?'':'18')+';transition:all .3s"></div>';
  });
  html+='</div>';
  html+='</div>';

  // ── SIGNAL BREAKDOWN
  const COMP_INFO={
    rsiSc:{nm:'RSI',sub:'Momentum oscillator',col:'#E040FB'},
    macdSc:{nm:'MACD',sub:'Directional momentum',col:'#2196F3'},
    obvSc:{nm:'OBV',sub:'Volume pressure',col:'#66BB6A'},
    maSc:{nm:'MA Grid',sub:'Trend structure alignment',col:'#4CAF50'},
    devSc:{nm:'MA Deviation',sub:'Long-term mean stretch',col:'#AB47BC'},
  };

  html+='<div style="padding:16px 22px 10px;font-size:10px;color:#333;text-transform:uppercase;letter-spacing:.12em;border-bottom:1px solid #0d0e18">Signal Breakdown — Current Bar</div>';
  html+='<div style="background:#080910">';

  Object.entries(COMP_INFO).forEach(([key,info])=>{
    const vals=comp[key]||[];
    const v=N2(vals.filter(x=>isFinite(x)).pop(),50);
    const vc=scoreCol(v);
    const interp=v<=20?'Extreme Low':v<=35?'Low':v<=65?'Neutral':v<=80?'High':'Extreme High';
    const barPct=Math.round(v);
    const barCol=v<=20?'#22C55E':v>=80?'#EF4444':'#555';
    html+='<div style="display:flex;align-items:center;gap:12px;padding:9px 22px;border-bottom:1px solid #0a0b14">';
    // Color dot + name
    html+='<div style="width:7px;height:7px;border-radius:50%;background:'+info.col+';flex-shrink:0"></div>';
    html+='<div style="width:120px;flex-shrink:0">';
    html+='<div style="font-size:11px;color:#888">'+info.nm+'</div>';
    html+='<div style="font-size:9px;color:#252535;margin-top:1px">'+info.sub+'</div>';
    html+='</div>';
    // Bar
    html+='<div style="flex:1;height:4px;background:#111;border-radius:2px;overflow:hidden">';
    html+='<div style="width:'+barPct+'%;height:100%;background:'+barCol+';border-radius:2px;transition:width .4s ease"></div>';
    html+='</div>';
    // Value + label
    html+='<div style="width:70px;text-align:right;flex-shrink:0">';
    html+='<span style="font-size:12px;font-weight:600;color:'+vc+'">'+v.toFixed(0)+'</span>';
    html+='<span style="font-size:9px;color:'+vc+'66;margin-left:5px">'+interp+'</span>';
    html+='</div>';
    html+='</div>';
  });
  html+='</div>';

  // ── HISTORICAL STATS
  let minScore=Infinity,maxScore=-Infinity;
  let buyCount=0,sellCount=0,inB=false,inS=false;
  for(let i=1;i<resonance.length;i++){
    const sv=N2(resonance[i]),pv=N2(resonance[i-1]);
    if(isFinite(resonance[i])){if(sv<minScore)minScore=sv;if(sv>maxScore)maxScore=sv;}
    if(pv>=20&&sv<20&&!inB){buyCount++;inB=true;}if(sv>=20)inB=false;
    if(pv<=80&&sv>80&&!inS){sellCount++;inS=true;}if(sv<=80)inS=false;
  }

  html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#111;border-top:1px solid #0d0e18;border-bottom:1px solid #0d0e18">';
  const stat=(label,value,c)=>'<div style="background:#080910;padding:14px 16px;text-align:center">'
    +'<div style="font-size:16px;font-weight:700;color:'+(c||'#e8e8e8')+';font-variant-numeric:tabular-nums;letter-spacing:-.02em">'+value+'</div>'
    +'<div style="font-size:9px;color:#333;text-transform:uppercase;letter-spacing:.1em;margin-top:3px">'+label+'</div>'
    +'</div>';
  html+=stat('Resonance Score',last.toFixed(1),col);
  html+=stat('Period Low',isFinite(minScore)?minScore.toFixed(1):'—','#22C55E88');
  html+=stat('Period High',isFinite(maxScore)?maxScore.toFixed(1):'—','#EF444488');
  html+=stat('Buy → Sell',buyCount+' → '+sellCount,'#888');
  html+='</div>';

  // ── ZONE REFERENCE GUIDE
  html+='<div style="padding:14px 22px 8px;font-size:10px;color:#333;text-transform:uppercase;letter-spacing:.12em">Zone Reference</div>';
  html+='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#111;border-top:1px solid #0a0b14">';
  const zoneGuide=[
    {range:'0 – 10',name:'Lifetime Buy',col:'#4ADE80',desc:'Historic extreme undervaluation. All major signals simultaneously at cycle lows. Once per cycle.'},
    {range:'10 – 20',name:'Buy Zone',col:'#22C55E',desc:'Strong undervaluation. Multiple signals in oversold territory. Confluence multiplier active.'},
    {range:'20 – 80',name:'Neutral',col:'#444',desc:'No extreme reading. Signals are mixed. Not an actionable zone — where most of market history lives.'},
    {range:'80 – 90',name:'Sell Zone',col:'#FB923C',desc:'Strong overvaluation. Multiple signals in overbought territory. Confluence multiplier active.'},
    {range:'90 – 100',name:'Lifetime Sell',col:'#EC4899',desc:'Historic extreme overvaluation. All major signals at cycle highs. Historically marks generational tops.'},
  ];
  zoneGuide.forEach(z=>{
    const isCur=(last<=10&&z.range==='0 – 10')||(last>10&&last<=20&&z.range==='10 – 20')||(last>20&&last<80&&z.range==='20 – 80')||(last>=80&&last<90&&z.range==='80 – 90')||(last>=90&&z.range==='90 – 100');
    html+='<div style="background:'+(isCur?'#0e0f1a':'#080910')+';padding:12px 12px;border-right:1px solid #0d0e18;border-bottom:none">';
    if(isCur)html+='<div style="font-size:7px;color:'+z.col+';text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">▶ Current</div>';
    html+='<div style="font-size:12px;font-weight:600;color:'+z.col+';margin-bottom:2px">'+z.range+'</div>';
    html+='<div style="font-size:9px;color:'+z.col+'88;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">'+z.name+'</div>';
    html+='<div style="font-size:9px;color:#252535;line-height:1.55">'+z.desc+'</div>';
    html+='</div>';
  });
  html+='</div>';

  root.innerHTML=html;
}

// ═══════════════════════════════════════════════════════
// BACKEND INTEGRATION
// ═══════════════════════════════════════════════════════
const YF_TICKER={BTC:'BTC-USD',ETH:'ETH-USD',SOL:'SOL-USD'};
const TF_MAP={'D':{interval:'1d',range:'1y'},'5D':{interval:'5d',range:'3y'},'1W':{interval:'1wk',range:'5y'}};
let isLiveData=false;

function updateLiveBadge(){
  const b=document.getElementById('cj-live');
  if(!b)return;
  if(isLiveData){b.textContent='● LIVE';b.style.cssText='font-size:9px;color:#22C55E;border:1px solid #22C55E33;padding:2px 7px;border-radius:2px;letter-spacing:.06em';}
  else{b.textContent='~ SIMULATED';b.style.cssText='font-size:9px;color:#444;border:1px solid #1c1c2c;padding:2px 7px;border-radius:2px;letter-spacing:.06em';}
}

async function loadData(){
  const cfg=ASSETS[curA],rand=rng32(cfg.seed);
  const tfCfg=cfg.wp[curTf];
  const tfMap=TF_MAP[curTf]||TF_MAP['1W'];
  try{
    const yfTicker=YF_TICKER[curA]||curA;
    const resp=await fetch(BACKEND_URL+'/api/market/'+yfTicker+'?interval='+tfMap.interval+'&range='+tfMap.range,{signal:AbortSignal.timeout(6000)});
    if(!resp.ok)throw new Error('HTTP '+resp.status);
    const d=await resp.json();
    if(d.fallback||!d.timestamps||!d.close)throw new Error('no data');
    const valid=d.close.map((v,i)=>v!==null&&d.open[i]!==null&&d.high[i]!==null&&d.low[i]!==null);
    curPx={timestamps:d.timestamps.filter((_,i)=>valid[i]),op:d.open.filter((_,i)=>valid[i]),hi:d.high.filter((_,i)=>valid[i]),lo:d.low.filter((_,i)=>valid[i]),cl:d.close.filter((_,i)=>valid[i]),vl:d.volume.filter((_,i)=>valid[i]).map(v=>v||0)};
    isLiveData=true;
  }catch(e){
    const{op,cl,hi,lo,vl}=buildPrice(tfCfg.p,tfCfg.n,rand,tfCfg.vol);
    curPx={op,hi,lo,cl,vl,timestamps:null};
    isLiveData=false;
  }
  try{
    const resp2=await fetch(BACKEND_URL+'/api/resonance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({close:curPx.cl,high:curPx.hi,low:curPx.lo,volume:curPx.vl,open:curPx.op}),signal:AbortSignal.timeout(8000)});
    if(!resp2.ok)throw new Error('failed');
    const cjd=await resp2.json();
    curRes={resonance:cjd.crown,comp:cjd.comp||{},raw:cjd.raw||{},mas:cjd.mas||{},vl:cjd.vl||curPx.vl};
  }catch(e){
    curRes=null;
    console.error('Resonance backend unavailable',e);
  }
  updateLiveBadge();
}

// ═══════════════════════════════════════════════════════
// UI CONTROLS
// ═══════════════════════════════════════════════════════
function setAsset(a){curA=a;document.querySelectorAll('.abt').forEach(b=>b.classList.toggle('act',b.dataset.a===a));loadData().then(()=>{initCanvases();startAnim();});}
function setTf(tf){curTf=tf;document.querySelectorAll('.tbt').forEach(b=>b.classList.toggle('act',b.dataset.tf===tf));loadData().then(()=>{initCanvases();startAnim();});}
function replayAnim(){startAnim();}
function toggleEdit(){const p=document.getElementById('edit-panel');if(!p)return;p.classList.toggle('show');const t=document.getElementById('edit-tog');if(t)t.classList.toggle('active',p.classList.contains('show'));}
function showTab(nm){
  ['ind','comp','res','about'].forEach(t=>{
    const tb=document.getElementById('t-'+t);const pb=document.getElementById('p-'+t);
    if(tb)tb.classList.toggle('active',t===nm);
    if(pb)pb.classList.toggle('active',t===nm);
  });
  if(nm==='comp')renderComponents();
  if(nm==='res')renderSignals();
  if(nm==='ind'&&!animId){initCanvases();if(curRes){drawPrice(animProg);drawOsc(animProg,mAlpha);}}
}
function toggleCard(){
  const c=document.getElementById('cj');if(!c)return;
  c.classList.toggle('open');
  if(c.classList.contains('open'))setTimeout(()=>{initCanvases();initHoverAndPan();loadData().then(startAnim);},30);
}
window.toggleCard=toggleCard;
window.showTab=showTab;
window.toggleEdit=toggleEdit;
window.replayAnim=replayAnim;
window.redraw=redraw;
window.setTf=setTf;
window.setFocusComponent=setFocusComponent;

let rsT;
window.addEventListener('resize',()=>{
  clearTimeout(rsT);rsT=setTimeout(()=>{
    const c=document.getElementById('cj');
    if(!c||!c.classList.contains('open'))return;
    const pi=document.getElementById('p-ind');
    if(pi&&pi.classList.contains('active')){
      initCanvases();if(curRes){drawPrice(animProg);drawOsc(animProg,mAlpha);}
    }
  },150);
});

})();
