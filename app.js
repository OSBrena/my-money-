const KEY="mymoney_v1";
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{
  digital:0,cash:0,hidden:false,theme:"light",
  transactions:[],goals:[],categories:["Alimentação","Compras","Transporte","Lazer","Casa","Educação","Tecnologia","Viagem","Outros"]
};
let wallet="total", view="wallet";
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const money=n=>state.hidden?"••••••":`$ ${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const total=()=>state.digital+state.cash;
function save(){localStorage.setItem(KEY,JSON.stringify(state)); render()}
function currentBalance(){return wallet==="digital"?state.digital:wallet==="cash"?state.cash:total()}
function walletName(){return wallet==="digital"?"Carteira Digital":wallet==="cash"?"Carteira Física":"Carteira Total"}
function render(){
 document.body.classList.toggle("dark",state.theme==="dark");
 $("#pageTitle").textContent=walletName();
 $("#balance").textContent=money(currentBalance());
 $("#split").textContent=wallet==="total"?`Digital ${money(state.digital)}  ·  Física ${money(state.cash)}`:"";
 $$(".wallet-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.wallet===wallet));
 $$(".bottom-btn").forEach(b=>b.classList.toggle("active",b.dataset.nav===view));
 if(view==="wallet") renderWallet(); else if(view==="statement") renderStatement(); else if(view==="goals") renderGoals(); else renderSettings();
}
function relevant(){
 return state.transactions.filter(t=>wallet==="total"||t.wallet===wallet);
}
function renderWallet(){
 const ts=relevant().slice(-5).reverse();
 $("#content").innerHTML=`<div class="card">
 <div class="section-title">Últimos movimentos</div>
 ${ts.length?ts.map(tx=>row(tx)).join(""):`<div class="empty">Nenhum lançamento ainda.</div>`}
 </div>`;
}
function row(t){
 return `<div class="row"><div><b>${esc(t.title||"Sem descrição")}</b><div class="muted">${esc(t.category||"Outros")} · ${t.date}</div></div><div class="amount ${t.type==="in"?"in":"out"}">${t.type==="in"?"+":"−"} ${money(t.amount)}</div></div>`;
}
function renderStatement(){
 const ts=relevant().slice().reverse();
 $("#content").innerHTML=`<div class="card"><div class="section-title">Extrato</div>
 <input id="search" placeholder="🔎 Pesquisar no extrato" style="width:100%;border:1px solid #ddd;border-radius:14px;padding:12px;margin-bottom:8px">
 <div id="list">${ts.length?ts.map(row).join(""):`<div class="empty">Nenhum lançamento.</div>`}</div></div>`;
 $("#search").oninput=e=>{$("#list").innerHTML=ts.filter(t=>(t.title+" "+t.category).toLowerCase().includes(e.target.value.toLowerCase())).map(row).join("")||`<div class="empty">Nenhum resultado.</div>`}
}
function renderGoals(){
 $("#content").innerHTML=`<div class="card"><div class="section-title">Metas</div>${state.goals.length?state.goals.map(g=>{let p=Math.min(100,(g.current/g.target)*100);return `<div class="row"><div><b>${esc(g.name)}</b><div class="muted">${money(g.current)} de ${money(g.target)} · ${p.toFixed(0)}%</div></div></div>`}).join(""):`<div class="empty">Nenhuma meta criada.</div>`}</div>`;
}
function renderSettings(){
 $("#content").innerHTML=`<div class="card"><div class="section-title">Configurações</div>
 <div class="row"><div><b>🎨 Tema</b><div class="muted">Light / Midnight</div></div><button class="icon-btn" id="themeBtn">↻</button></div>
 <div class="row"><div><b>👁️ Saldo</b><div class="muted">Ocultar ou mostrar valores</div></div><button class="icon-btn" id="hide2">◉</button></div>
 <div class="row"><div><b>🏷️ Categorias</b><div class="muted">${state.categories.length} categorias</div></div><button class="icon-btn" id="catBtn">＋</button></div>
 <div class="row"><div><b>💵 Moeda</b><div class="muted">USD principal · BRL opcional</div></div></div>
 </div>`;
 $("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";save()};
 $("#hide2").onclick=()=>{state.hidden=!state.hidden;save()};
 $("#catBtn").onclick=addCategory;
}
function addCategory(){const c=prompt("Nova categoria:");if(c&&c.trim()){state.categories.push(c.trim());save()}}
function openPlus(){
 $("#sheet").innerHTML=`<h2>O que você deseja fazer?</h2>
 <button class="menu-btn" data-act="in">💰 Adicionar saldo</button>
 <button class="menu-btn" data-act="out">💸 Adicionar gasto</button>
 <button class="menu-btn" data-act="transfer">🔄 Transferir</button>
 <button class="cancel" id="close">Cancelar</button>`;
 $("#modal").classList.add("show");$("#close").onclick=closeModal;
 $$(".menu-btn").forEach(b=>b.onclick=()=>b.dataset.act==="transfer"?transferForm():form(b.dataset.act));
}
function form(type){
 const isIn=type==="in";
 $("#sheet").innerHTML=`<h2>${isIn?"💰 Adicionar saldo":"💸 Adicionar gasto"}</h2><div class="form">
 <label>Valor</label><input id="amount" type="number" step="0.01" placeholder="0,00">
 <label>Carteira</label><select id="wallet">${wallet==="total"?'<option value="digital">Digital</option><option value="cash">Física</option>':`<option value="${wallet}">${wallet==="digital"?"Digital":"Física"}</option>`}</select>
 ${!isIn?`<label>Categoria</label><select id="category">${state.categories.map(c=>`<option>${esc(c)}</option>`).join("")}</select>`:""}
 <label>${isIn?"De onde veio?":"Onde/O que foi?"}</label><input id="title" placeholder="${isIn?"Ex.: Mesada":"Ex.: McDonald's"}">
 <label>Data</label><input id="date" type="date" value="${new Date().toISOString().slice(0,10)}">
 <label>Nota (opcional)</label><textarea id="note" rows="2" placeholder="Opcional"></textarea>
 <button class="primary" id="confirm">${isIn?"Adicionar saldo":"Adicionar gasto"}</button><button class="cancel" id="back">Voltar</button></div>`;
 $("#back").onclick=openPlus;
 $("#confirm").onclick=()=>{
   const amount=Number($("#amount").value); if(!amount||amount<=0)return alert("Digite um valor válido.");
   const w=$("#wallet").value; const tx={id:Date.now(),amount,wallet:w,type,title:$("#title").value.trim()||"Sem descrição",category:isIn?"Entrada":$("#category").value,date:$("#date").value,note:$("#note").value.trim()};
   if(w==="digital")state.digital+=isIn?amount:-amount;else state.cash+=isIn?amount:-amount;
   state.transactions.push(tx);save();closeModal();
 };
}
function transferForm(){
 $("#sheet").innerHTML=`<h2>🔄 Transferir</h2><div class="form">
 <label>De</label><select id="from"><option value="digital">Digital</option><option value="cash">Física</option></select>
 <label>Para</label><select id="to"><option value="cash">Física</option><option value="digital">Digital</option></select>
 <label>Valor</label><input id="amount" type="number" step="0.01" placeholder="0,00">
 <label>Data</label><input id="date" type="date" value="${new Date().toISOString().slice(0,10)}">
 <button class="primary" id="confirm">Transferir</button><button class="cancel" id="back">Voltar</button></div>`;
 $("#back").onclick=openPlus;
 $("#confirm").onclick=()=>{
  const from=$("#from").value,to=$("#to").value,a=Number($("#amount").value);
  if(from===to||!a||a<=0)return alert("Confira as carteiras e o valor.");
  if((from==="digital"?state.digital:state.cash)<a)return alert("Saldo insuficiente.");
  if(from==="digital"){state.digital-=a;state.cash+=a}else{state.cash-=a;state.digital+=a}
  state.transactions.push({id:Date.now(),amount:a,wallet:"transfer",type:"transfer",title:`${from==="digital"?"Digital":"Física"} → ${to==="digital"?"Digital":"Física"}`,category:"Transferência",date:$("#date").value});
  save();closeModal();
 }
}
function closeModal(){$("#modal").classList.remove("show")}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$("#plusBtn").onclick=openPlus;$("#modal").onclick=e=>{if(e.target.id==="modal")closeModal()};
$("#hideBtn").onclick=()=>{state.hidden=!state.hidden;save()};
$$(".wallet-tabs button").forEach(b=>b.onclick=()=>{wallet=b.dataset.wallet;view="wallet";render()});
$$(".quick-actions button").forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});
$$(".bottom-btn").forEach(b=>b.onclick=()=>{view=b.dataset.nav;render()});
render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
