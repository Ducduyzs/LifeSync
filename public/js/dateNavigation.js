function ymd(d){const z=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`}
function fmtTitle(d){return `My Day – ${d.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric",year:"numeric"})}`}
function fmtTime(v){if(!v)return "";const d=new Date(v);if(Number.isNaN(d.getTime()))return "";return d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}

document.addEventListener("DOMContentLoaded",()=>{
  const prevBtn=document.getElementById("prevDate");
  const nextBtn=document.getElementById("nextDate");
  const todayBtn=document.getElementById("todayBtn");
  const titleEl=document.getElementById("dateTitle");
  const listEl=document.getElementById("taskList");

  let current=new Date();
  const today=new Date();

  async function load(){
    titleEl.textContent=fmtTitle(current);
    if(ymd(current)===ymd(today)) todayBtn.classList.add("active"); else todayBtn.classList.remove("active");
    listEl.innerHTML=`<div class="text-gray-500">Loading...</div>`;
    try{
      const r=await fetch(`/tasks/list?date=${ymd(current)}`);
      const j=await r.json();
      if(!j.success){listEl.innerHTML=`<div class="text-gray-500">No data</div>`;return;}
      if(!j.tasks || j.tasks.length===0){listEl.innerHTML=`<p class="text-gray-500">No tasks for this day 🌤</p>`;return;}
      const html=j.tasks.map(t=>{
        const start=fmtTime(t.start_time);
        const end=fmtTime(t.end_time);
        const tag=t.tag_title?`<span class="bg-pink-100 text-pink-600 px-2 py-1 rounded-lg text-xs">#${t.tag_title}</span>`:"";
        const pri=t.priority?`<span class="text-yellow-500"><i class="bi bi-star-fill"></i> ${t.priority}</span>`:"";
        const time=(start||end)?`<span><i class="bi bi-clock"></i> ${start}–${end}</span>`:"";
        return `
          <div class="task-item flex justify-between items-center bg-white rounded-2xl shadow p-4 border border-pink-100">
            <div class="flex items-center gap-3">
              <input type="checkbox" ${t.is_done?"checked":""}/>
              <span class="font-medium">${t.title||""}</span>
            </div>
            <div class="flex items-center gap-4 text-gray-600 text-sm">
              ${time}${tag?` ${tag}`:""}${pri?` ${pri}`:""}
            </div>
          </div>`;
      }).join("");
      listEl.innerHTML=html;
    }catch(e){
      listEl.innerHTML=`<div class="text-gray-500">Failed to load</div>`;
    }
  }

  prevBtn?.addEventListener("click",()=>{current.setDate(current.getDate()-1);load();});
  nextBtn?.addEventListener("click",()=>{current.setDate(current.getDate()+1);load();});
  todayBtn?.addEventListener("click",()=>{current=new Date();load();});

  document.addEventListener("taskAdded",()=>load());

  load();
});
