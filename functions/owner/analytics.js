import { unavailable } from "../_shared/access.js";

function safe(value) {
  return /^[A-Za-z0-9._:-]{1,160}$/.test(String(value || "")) ? String(value) : "";
}

export async function onRequestGet({ request, env }) {
  if (env.ANALYTICS_DASHBOARD_ENABLED !== "true") return unavailable();
  const url = new URL(request.url);
  const hosts = new Set(String(env.ANALYTICS_OWNER_HOSTS || "").split(",").map(value => value.trim().toLowerCase()).filter(Boolean));
  if (!hosts.has(url.host.toLowerCase())) return unavailable();

  const config = {
    apiKey: safe(env.FIREBASE_API_KEY),
    authDomain: safe(env.FIREBASE_AUTH_DOMAIN),
    projectId: safe(env.FIREBASE_PROJECT_ID),
    appId: safe(env.FIREBASE_APP_ID),
  };
  const configured = Object.values(config).every(Boolean);
  const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Workbench notes — Trikzik Labs</title>
  <style>
    :root{color-scheme:dark;--ink:#f6f0df;--muted:#9fb0a8;--green:#38dc7e;--amber:#f3cb77;--panel:#07110f;--line:#52645c}*{box-sizing:border-box}
    body{margin:0;background:#020807;color:var(--ink);font:16px/1.5 system-ui}main{width:min(1120px,calc(100% - 30px));margin:auto;padding:42px 0}
    h1{color:var(--green);font-size:clamp(2rem,7vw,4rem);margin:0}.bar,.toolbar,.cards,.health{display:flex;gap:12px;flex-wrap:wrap}.bar{justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:20px}
    .toolbar{align-items:end;margin:20px 0}.toolbar label{display:grid;gap:4px}.toolbar span,.eyebrow{color:var(--muted);font-size:.7rem;text-transform:uppercase;letter-spacing:.1em}
    button,select{min-height:42px;padding:9px 12px;border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--ink);font:inherit}button:not(:disabled){cursor:pointer}button:not(:disabled):hover,button:not(:disabled):focus-visible,select:focus-visible{border-color:var(--green);outline:2px solid transparent}button:disabled,select:disabled{opacity:.45}
    .notice{margin:16px 0;padding:12px;border:1px solid var(--amber);border-radius:8px;background:#1b1609;color:#f8df9d}.health{margin:16px 0}.health div{flex:1 1 180px;padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--panel)}.health strong{display:block;margin-top:3px}
    .cards{margin:18px 0}.card{flex:1 1 200px;text-align:left;padding:16px;border:1px solid var(--line);border-radius:10px;background:var(--panel)}.card strong{display:block;color:var(--green);font-size:2rem}.card small{display:block;color:var(--muted)}.card.active{border-color:var(--green);box-shadow:inset 3px 0 var(--green)}
    .table-wrap{overflow:auto;border:1px solid var(--line);border-radius:10px}table{width:100%;border-collapse:collapse;min-width:820px}th,td{text-align:left;padding:10px;border-bottom:1px solid #25342d}td:nth-child(n+3),th:nth-child(n+3){text-align:right}.empty{text-align:center!important;color:var(--muted);padding:28px}
    .muted{color:var(--muted)}#status{min-height:1.5em}.feedback{color:var(--green)}@media(max-width:650px){.bar{align-items:start;flex-direction:column}.toolbar>*{flex:1 1 145px}.toolbar button,.toolbar select{width:100%}}
  </style>
</head>
<body>
<main>
  <div class="bar"><div><p class="muted">Private owner view</p><h1>Workbench notes</h1></div><div><button id="login">Sign in with Google</button> <button id="logout" hidden>Sign out</button></div></div>
  <p id="status" role="status" class="muted">${configured ? "Sign in to open the notebook." : "Firebase web configuration is not complete."}</p>
  <p class="notice" id="test-notice">TEST NOTEBOOK — labeled fixtures only. This is not live visitor traffic.</p>
  <section class="health" aria-label="Data health">
    <div><span class="eyebrow">Context</span><strong id="health-context">LOCKED</strong></div>
    <div><span class="eyebrow">Collection</span><strong id="health-collection">OFF</strong></div>
    <div><span class="eyebrow">Last event bucket</span><strong id="health-last">NONE</strong></div>
    <div><span class="eyebrow">Query</span><strong id="health-query">WAITING</strong></div>
  </section>
  <div class="toolbar" aria-label="Notebook controls">
    <label><span>Time window</span><select id="range" disabled><option value="24h">24 hours</option><option value="7d" selected>7 days</option><option value="30d">30 days</option><option value="90d">90 days</option></select></label>
    <label><span>Experiment</span><select id="experiment-filter" disabled><option value="">All experiments</option></select></label>
    <button id="refresh" type="button" disabled>Refresh notebook</button>
    <button id="export" type="button" disabled>Export visible rows</button>
    <button id="clear-filter" type="button" disabled>Show all event types</button>
  </div>
  <section class="cards" aria-label="Metric filters">
    <button class="card" type="button" data-event="experiment_open" disabled><strong id="opens">—</strong>Experiment opens<small id="opens-compare">No prior comparison</small></button>
    <button class="card" type="button" data-event="first_interaction" disabled><strong id="starts">—</strong>First interactions<small id="starts-compare">No prior comparison</small></button>
    <button class="card" type="button" data-event="engaged_30s" disabled><strong id="engaged">—</strong>Engaged signals<small id="engaged-compare">No prior comparison</small></button>
    <button class="card" type="button" data-event="support_click" disabled><strong id="support">—</strong>Support clicks<small id="support-compare">No prior comparison</small></button>
  </section>
  <div class="table-wrap"><table><thead><tr><th>Experiment / event</th><th>Source / release</th><th>Current</th><th>Prior</th><th>Change</th></tr></thead><tbody id="rows"><tr><td class="empty" colspan="5">Sign in to query the test notebook.</td></tr></tbody></table></div>
</main>
<script type="module">
  import{initializeApp}from"https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
  import{getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
  const cfg=${JSON.stringify(config)},ready=${configured};
  const status=document.querySelector("#status"),range=document.querySelector("#range"),experimentFilter=document.querySelector("#experiment-filter"),login=document.querySelector("#login"),logout=document.querySelector("#logout"),refresh=document.querySelector("#refresh"),exportButton=document.querySelector("#export"),clearFilter=document.querySelector("#clear-filter"),rowsBody=document.querySelector("#rows"),cards=[...document.querySelectorAll(".card")],number=new Intl.NumberFormat();
  const labels={site:"Trikzik Labs",moon:"Moon Snail",star:"Starfall",dungeon:"Dungeon Reset",brain:"Brain in a Jar",scribble:"Scribble Engine",traffic:"Traffic With No Excuse",jelly:"Jelly Bench",mirror:"Mirror Mischief"};
  let auth,user,currentRows=[],priorRows=[],eventFilter=null,lastContext="test",generatedAt=null;
  function key(row){return[row.event,row.experiment,row.source,row.format,row.release].join("|")}
  function total(rows,event){return rows.filter(row=>row.event===event).reduce((sum,row)=>sum+row.total,0)}
  function comparison(event){const current=total(currentRows,event),prior=total(priorRows,event),delta=current-prior;if(!current&&!prior)return"No change from prior period";if(!prior)return"+"+number.format(delta)+"; no prior events";const percent=Math.round(delta/prior*100);return(delta>=0?"+":"")+number.format(delta)+" ("+(percent>=0?"+":"")+percent+"%) vs prior"}
  function changeLabel(current,prior){const delta=current-prior;if(!current&&!prior)return"0";if(!prior)return"+"+number.format(delta)+" / no prior";return(delta>=0?"+":"")+number.format(delta)+" ("+((delta/prior*100)>=0?"+":"")+Math.round(delta/prior*100)+"%)"}
  function setSignedIn(active){range.disabled=!active;experimentFilter.disabled=!active;refresh.disabled=!active;cards.forEach(card=>card.disabled=!active);if(!active){exportButton.disabled=true;clearFilter.disabled=true}}
  function visibleRows(){return currentRows.filter(row=>(!eventFilter||row.event===eventFilter)&&(!experimentFilter.value||row.experiment===experimentFilter.value))}
  function syncExperiments(){const selected=experimentFilter.value,values=[...new Set(currentRows.map(row=>row.experiment))].sort();experimentFilter.replaceChildren(new Option("All experiments",""),...values.map(value=>new Option(labels[value]||value,value)));if(values.includes(selected))experimentFilter.value=selected}
  function render(){
    const metricIds={experiment_open:["opens","opens-compare"],first_interaction:["starts","starts-compare"],engaged_30s:["engaged","engaged-compare"],support_click:["support","support-compare"]};
    Object.entries(metricIds).forEach(([event,[valueId,compareId]])=>{document.querySelector("#"+valueId).textContent=number.format(total(currentRows,event));document.querySelector("#"+compareId).textContent=comparison(event)});
    cards.forEach(card=>{const active=card.dataset.event===eventFilter;card.classList.toggle("active",active);card.setAttribute("aria-pressed",String(active))});
    clearFilter.disabled=!eventFilter;const visible=visibleRows();exportButton.disabled=!visible.length;
    if(!visible.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=5;td.className="empty";td.textContent=currentRows.length?"No test rows match these filters.":"No aggregate test events in this window.";tr.append(td);rowsBody.replaceChildren(tr);return}
    const priorMap=new Map(priorRows.map(row=>[key(row),row.total]));
    rowsBody.replaceChildren(...visible.map(row=>{const prior=priorMap.get(key(row))||0,tr=document.createElement("tr");const values=[(labels[row.experiment]||row.experiment)+" / "+row.event.replaceAll("_"," "),row.source+" / "+row.release,number.format(row.total),number.format(prior),changeLabel(row.total,prior)];values.forEach(value=>{const td=document.createElement("td");td.textContent=value;tr.append(td)});return tr}))
  }
  async function api(path){const token=await user.getIdToken();const response=await fetch(path,{headers:{Authorization:"Bearer "+token}});if(!response.ok)throw new Error(String(response.status));return response.json()}
  async function load(){
    if(!user)return;status.className="muted";status.textContent="Refreshing the test notebook…";refresh.disabled=true;document.querySelector("#health-query").textContent="RUNNING";
    try{const who=await api("/owner/api/whoami");if(!who.pinned){setSignedIn(false);status.textContent="Verified UID: "+who.uid+". Pin this exact UID as FIREBASE_OWNER_UID before analytics access.";return}
      const data=await api("/owner/api/analytics?range="+encodeURIComponent(range.value));currentRows=data.current.rows;priorRows=data.prior.rows;lastContext=data.context;generatedAt=data.generatedAt;syncExperiments();document.querySelector("#health-context").textContent=data.context.toUpperCase();document.querySelector("#health-collection").textContent=data.health.collectionEnabled?"ON":"OFF";document.querySelector("#health-last").textContent=data.health.lastEventAt?new Date(data.health.lastEventAt).toLocaleString():"NONE";document.querySelector("#health-query").textContent="OK";render();status.className=currentRows.length?"feedback":"muted";status.textContent=currentRows.length?"Loaded "+currentRows.length+" aggregate fixture rows. Updated "+new Date(data.generatedAt).toLocaleString():"Test database has no rows in this window. Refresh completed; zero is the measured result."
    }catch{document.querySelector("#health-query").textContent="ERROR";status.className="muted";status.textContent="Notebook request failed. Authentication or the test database is unavailable."}finally{if(user)refresh.disabled=false}
  }
  cards.forEach(card=>card.addEventListener("click",()=>{eventFilter=eventFilter===card.dataset.event?null:card.dataset.event;render();status.textContent=eventFilter?"Filtered to "+card.childNodes[1].textContent.trim()+".":"Showing all event types."}));
  clearFilter.addEventListener("click",()=>{eventFilter=null;render();status.textContent="Showing all event types."});experimentFilter.addEventListener("change",()=>{render();status.textContent=experimentFilter.value?"Filtered to "+(labels[experimentFilter.value]||experimentFilter.value)+".":"Showing all experiments."});refresh.addEventListener("click",load);range.addEventListener("change",load);
  function csvCell(value){let text=String(value??"");if(/^[\\t\\r\\n ]*[=+\\-@]/.test(text))text="'"+text;return'"'+text.replaceAll('"','""')+'"'}
  exportButton.addEventListener("click",()=>{const visible=visibleRows();if(!visible.length)return;const priorMap=new Map(priorRows.map(row=>[key(row),row.total])),cells=[["experiment","event","source","format","release","current_count","prior_count","generated_at"],...visible.map(row=>[row.experiment,row.event,row.source,row.format,row.release,row.total,priorMap.get(key(row))||0,generatedAt])],csv=cells.map(line=>line.map(csvCell).join(",")).join("\\r\\n"),href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),anchor=document.createElement("a");anchor.href=href;anchor.download="trikzik-"+lastContext+"-fixture-analytics.csv";anchor.click();setTimeout(()=>URL.revokeObjectURL(href),0);status.textContent="Exported "+visible.length+" visible aggregate rows."});
  if(ready){auth=getAuth(initializeApp(cfg));login.onclick=async()=>{status.textContent="Opening Google sign-in.";try{await signInWithPopup(auth,new GoogleAuthProvider())}catch{status.textContent="Google sign-in could not start. Reload and try again."}};logout.onclick=()=>signOut(auth);onAuthStateChanged(auth,value=>{user=value;login.hidden=!!value;logout.hidden=!value;setSignedIn(Boolean(value));if(value)load();else{currentRows=[];priorRows=[];eventFilter=null;render();document.querySelector("#health-context").textContent="LOCKED";document.querySelector("#health-last").textContent="NONE";document.querySelector("#health-query").textContent="WAITING";status.textContent="Sign in to open the notebook."}})}else login.disabled=true;
</script>
</body></html>`;
  return new Response(page, { headers: {
    "cache-control": "private, no-store",
    "content-security-policy": "default-src 'none'; script-src 'unsafe-inline' https://www.gstatic.com https://apis.google.com; style-src 'unsafe-inline'; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com; frame-src https://accounts.google.com https://trikzik-owner-auth.firebaseapp.com; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "content-type": "text/html; charset=utf-8",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  }});
}

export function onRequest() {
  return new Response("Method not allowed", { status: 405, headers: { "cache-control": "no-store" } });
}
