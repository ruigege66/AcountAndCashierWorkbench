const fs=require('fs'),vm=require('vm');
(async()=>{
const REAL=JSON.parse(fs.readFileSync('data/_api_samples.json','utf8'));
const ctx={PAGES:{dashboard:async()=>'x'},console,localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},
  S:{filters:{},actor:''},
  api:async(u)=>{const base=u.split('?')[0]; for(const k in REAL){ if(k.startsWith(base+'|')||k===base) return REAL[k]; } return {};},
  toast:()=>{},confirm:()=>true,esc:s=>String(s??''),table:()=>'<table></table>',$:id=>({innerHTML:'',files:[]}),
  document:{querySelectorAll:()=>[],querySelector:()=>null,getElementById:id=>({innerHTML:'',files:[]})},
  today:()=>'2026-11-08', thisMonth:()=>'2026-11',
  go:()=>{},setTimeout:()=>0,window:{open:()=>{}},Chart:function(){},destroyCharts:()=>{},
  fetch:async(u)=>({ok:true,json:async()=>({})})};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('public/js/pages_work.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('public/js/pages_v28.js','utf8'),ctx);
const pages=['dashboard','work_1','work_2','work_3','work_4','work_5','work_6','work_7','work_8','work_9','work_10','work_11',
  'graph_map','seven_center','role_center','competency_center','advanced_center','legal_center','audit_center','reg_center','macro_center'];
let bad=0;
for(const p of pages){
  try{
    const h=await ctx.PAGES[p]();
    const zh=(h.match(/[\u4e00-\u9fa5]/g)||[]).length;
    const badToken=/undefined|NaN|\{\s*"|\[object Object\]|is not a function/.test(h);
    console.log((badToken?'✗':'✓'),p.padEnd(18),'输出',String(h.length).padStart(6),'字符 | 中文',String(zh).padStart(4),'| 坏标记',badToken?'有':'无');
    if(badToken||zh<10){bad++;console.log('   片段:',h.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,120));}
  }catch(e){console.log('✗',p,'抛错:',e.message.slice(0,100));bad++;}
}
console.log('不合格页面:',bad);process.exitCode=bad?1:0;
})();