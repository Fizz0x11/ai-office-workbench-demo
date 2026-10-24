const scenarios = [
  {
    name: '晨间收件分拣', icon: '✉', subtitle: '邮件与群消息 → 今日三件事',
    goal: '从多渠道消息中找出今天必须处理的事项，并起草回复。',
    source: '3 封邮件 · 2 条群消息 · 1 条随手记',
    output: '今日工作清单', type: '任务清单',
    agents: '收件助手 · 分类助手 · 回复助手'
  },
  {
    name: '会后跟进闭环', icon: '◉', subtitle: '录音与聊天 → 纪要、待办、跟进',
    goal: '把会议材料整理成可确认的纪要和责任清单。',
    source: '3 段模拟转写 · 2 条会后消息',
    output: '周例会纪要', type: '会议纪要',
    agents: '转写助手 · 纪要助手 · 待办助手'
  },
  {
    name: '数据到周报', icon: '▥', subtitle: '表格与文档 → 洞察、图表、汇报',
    goal: '清洗样例业务数据，产出带依据的三条结论和汇报提纲。',
    source: '1 张模拟表格 · 6 行样例记录',
    output: '运营周报初稿', type: '数据周报',
    agents: '表格助手 · 分析助手 · 汇报助手'
  }
];

const stories = [
  {problem:'早上同时打开邮箱、群聊和随手记，任务散在三个地方。',pain:'重复提醒占注意力；“下周三”这类模糊日期容易被误当成确定承诺。',solution:'统一收件、去重归类，先给人看待确认项，再生成今日清单。',manual:'翻消息 → 自己记 → 反复确认',workbench:'收件 → 去重 → 分类 → 人工确认'},
  {problem:'会开完后，决定、待办和会后补充消息分散在不同材料里。',pain:'同一句话出现两遍；有待办却没有负责人，纪要发出后仍没人跟进。',solution:'把转写和聊天合并，抽出决议、待办和责任人，缺项留给人确认。',manual:'听录音 → 翻聊天 → 写纪要',workbench:'合并材料 → 抽待办 → 复核责任人'},
  {problem:'周报数字在表格里，说明散在文档中，汇报时很难快速说清重点。',pain:'重复行会抬高总数；空值和计算口径若不核查，结论可能出错。',solution:'清洗表格、重算汇总，生成带数字的结论，保留数据口径供人核对。',manual:'删重 → 手算 → 写结论',workbench:'去重 → 统计 → 异常提醒 → 出周报'}
];
const painExamples = [
  {headline:'一句“下周三”，就可能变成错误承诺。',bad:'未经核对：好的，下周三见。',good:'工作台提醒：日期不明确，先请客户确认具体日期。'},
  {headline:'纪要写了待办，却没人负责，事情照样落空。',bad:'未经核对：更新脚本，已安排。',good:'工作台提醒：这个待办还没有负责人。'},
  {headline:'重复行算进周报，数字看着漂亮却是错的。',bad:'未经清洗：本周 21 项。',good:'工作台去重后：本周 18 项，并标记空值。'}
];
const sampleRaw = [
  '邮件｜客户问：下周三能否安排产品演示？\n群聊｜请今天确认会议室和参会人\n邮件｜请今天完成周报数字核对\n随手记｜本周整理共享资料夹\n群聊｜请今天确认会议室和参会人\n邮件｜请同事补充常见问答',
  '转写｜决定：本周先整理试用反馈\n转写｜待办：周二前汇总5条反馈，负责人：小林\n会后聊天｜待办：周四前更新演示脚本\n会后聊天｜待办：周四前更新演示脚本\n转写｜下次会议先检查未完成事项',
  '事项,本周,上周\n资料整理,6,4\n会后跟进,4,3\n报表制作,5,5\n其他,3,3\n其他,3,3\n备注,0,'
];
const archiveSamples = [
  {title:'会议纪要样例｜跨组周例会',description:'决议、待办、未决事项已整理；负责人待确认。',scenario:1},
  {title:'数据周报样例｜服务事项',description:'从虚构表格生成三条结论，并标出重复行。',scenario:2},
  {title:'今日清单样例｜多渠道收件',description:'邮件与群消息统一分拣，保留模糊日期提醒。',scenario:0}
];
const seedKnowledge = [
  {scenario:0,title:'收件分拣｜模糊时间口径',description:'“下周三”需要确认具体日期后才能写进回复。',exception:'先标为待确认，不自动承诺。'},
  {scenario:1,title:'会议纪要｜责任人缺失',description:'待办只有截止时间时，先确认负责人。',exception:'未确认的责任人不写成已分配。'},
  {scenario:2,title:'数据周报｜重复行',description:'统计前先按原始记录去重，再核对合计。',exception:'保留清洗记录和数字口径。'}
];

const initialInbox = [
  {id:1,icon:'✉',title:'确认下周演示日期',detail:'客户问：下周三能否安排产品演示？',source:'邮件',category:'今天做',time:'09:12'},
  {id:2,icon:'☏',title:'确认会议室和参会人',detail:'请今天确认会议室和参会人。',source:'群聊',category:'今天做',time:'09:08'},
  {id:3,icon:'✉',title:'完成周报数字核对',detail:'请今天完成周报数字核对。',source:'邮件',category:'今天做',time:'08:55'},
  {id:4,icon:'▤',title:'整理共享资料夹',detail:'本周整理共享资料夹。',source:'随手记',category:'本周做',time:'昨天'},
  {id:5,icon:'☏',title:'会议室提醒（重复）',detail:'请今天确认会议室和参会人。',source:'群聊',category:'今天做',time:'昨天'},
  {id:6,icon:'✉',title:'补充常见问答',detail:'请同事补充常见问答。',source:'邮件',category:'别人做',time:'昨天'}
];
const state = {view:'dashboard',scenario:0,phase:-1,running:false,manual:false,painOpen:false,reviewed:false,returned:false,filter:'全部',inbox:structuredClone(initialInbox),knowledge:structuredClone(seedKnowledge),outputs:[],selectedInbox:null,standards:[true,true,true],raw:[...sampleRaw],analysis:null,tour:0};
const labels={dashboard:'总览与演示',inbox:'收件箱',assets:'素材库',templates:'模板与标准',outputs:'输出区',knowledge:'知识库'};
const content=document.getElementById('content');
let runId=0,toastTimer;

function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function notify(message){const t=document.getElementById('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600);}
function updateClock(){document.getElementById('clock').textContent=new Intl.DateTimeFormat('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Shanghai'}).format(new Date());}
function pageHead(kicker,title,description,actions=''){return `<div class="page-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${actions?`<div class="head-actions">${actions}</div>`:''}</div>`;}
function badge(text,kind=''){return `<span class="pill ${kind}">${esc(text)}</span>`;}
function analyze(index, raw=state.raw[index]) {
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const unique=[...new Set(lines.map(x=>x.replace(/\s+/g,' ')))];
  const header=index===2 && unique[0]?.startsWith('事项,')?unique.shift():null;
  const duplicates=lines.length-unique.length-(header?1:0);
  let bullets=[],exception='未发现明显缺项；交付前仍请核对原始材料。',metrics={},riskDetected=false;
  const short=x=>x.replace(/^[^｜]+｜/,'');
  if(index===0){
    const today=unique.filter(x=>/今天|紧急/.test(x));
    const delegated=unique.filter(x=>/同事|转交/.test(x));
    const week=unique.filter(x=>!today.includes(x)&&!delegated.includes(x));
    bullets=[`今天做（${today.length}）：${today.map(short).join('；')||'暂无'}`,`本周处理（${week.length}）：${week.map(short).join('；')||'暂无'}`,`转给同事（${delegated.length}）：${delegated.map(short).join('；')||'暂无'}`];
    metrics={today:today.length,week:week.length,delegated:delegated.length};
    if(unique.some(x=>/下周三|尽快|近期/.test(x))){exception='发现“下周三”等模糊时间；回复前请确认具体日期。';riskDetected=true;}
  }else if(index===1){
    const decisions=unique.filter(x=>/决定|决议/.test(x));
    const tasks=unique.filter(x=>/待办/.test(x));
    const follow=unique.filter(x=>!decisions.includes(x)&&!tasks.includes(x));
    bullets=[`决议：${decisions.map(short).join('；')||'待补充'}`,`待办：${tasks.map(short).join('；')||'待补充'}`,`后续：${follow.map(short).join('；')||'待补充'}`];
    metrics={decisions:decisions.length,tasks:tasks.length,follow:follow.length};
    if(tasks.some(x=>!/负责人[:：]/.test(x))){exception='有待办缺少负责人；请先确认归属，再发纪要。';riskDetected=true;}
  }else{
    const parsed=unique.map(x=>x.split(',').map(y=>y.trim()));
    const valid=parsed.filter(x=>x.length>=3&&Number.isFinite(Number(x[1]))&&x[2]!==''&&Number.isFinite(Number(x[2])));
    const invalid=parsed.length-valid.length;
    const current=valid.reduce((n,x)=>n+Number(x[1]),0);
    const previous=valid.reduce((n,x)=>n+Number(x[2]),0);
    const leader=[...valid].sort((a,b)=>Number(b[1])-Number(a[1]))[0];
    bullets=[`本周合计 ${current} 项；上周 ${previous} 项；变化 ${previous?(((current-previous)/previous)*100).toFixed(0)+'%':'待核对'}。`,`本周最高项：${leader?`${leader[0]} ${leader[1]} 项`:'暂无有效数据'}。`,`清洗记录：去重 ${duplicates} 行，待核对 ${invalid} 行。`];
    metrics={current,previous,invalid};
    if(invalid){exception=`发现 ${invalid} 行空值或格式不完整；发布前请核对原始表格。`;riskDetected=true;}
  }
  return {lines,unique,duplicates,bullets,exception,metrics,riskDetected,rawCount:lines.length,cleanCount:unique.length,stageNotes:[`接收 ${lines.length} 条原始记录`,`删除 ${duplicates} 条重复记录，保留 ${unique.length} 条`,`按场景生成结构化要点`,riskDetected?'标记人工复核项':'未发现明显缺项',`形成可下载成果与知识记录`]};
}
function render(){document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.view===state.view));document.getElementById('breadcrumb').textContent=labels[state.view];const count=document.querySelector('.nav-item[data-view="inbox"] em');if(count)count.textContent=state.inbox.length;content.innerHTML=({dashboard:renderDashboard,inbox:renderInbox,assets:renderAssets,templates:renderTemplates,outputs:renderOutputs,knowledge:renderKnowledge})[state.view]();}
function renderDashboard(){
  const s=scenarios[state.scenario],story=stories[state.scenario],pain=painExamples[state.scenario];
  const a=state.analysis||analyze(state.scenario),complete=state.phase>=4;
  const output=state.outputs.find(o=>o.scenario===state.scenario);
  const guide=[['看见问题',story.problem],['体会痛点',story.pain],['看工作台解法',story.solution]][state.tour];
  const stage=state.inspect??state.phase;
  return `
${pageHead('90 秒互动体验','先看一处差错，怎样变成一份靠谱成果','观众只需看三件事：漏项被找出、风险被拦住、成果能交付。所有数据均为虚构样例。',`<button class="btn" data-action="step-demo" ${state.running?'disabled':''}>▷ 单步讲解</button><button class="btn btn-primary" data-action="run" ${state.running?'disabled':''}>▶ ${state.running?'演示进行中':'自动播放'}</button>`)}
<section class="hero hero-with-mascot"><div class="hero-copy"><div class="hero-kicker">小办 · 你的演示引导员</div><h2>不是多做几张表。<br>是少漏一件事，少答错一句话。</h2><p>亲眼看它发现重复、拦住风险，最后交出一份可用成果。</p><button class="btn btn-primary hero-button" data-action="pain-sim">⚡ 看看最容易出错的一步</button></div><img class="mascot" src="mascot.png" alt="卡通文档助手小办举起一只手，邀请你开始演示"><div class="mascot-bubble"><b>${guide[0]}</b><span>${guide[1]}</span></div></section>
<div class="section-title"><h2>小白先看这三个点</h2><p>点击切换讲解</p></div>
<div class="story-grid">${[['01','现在乱在哪',story.problem],['02','错了会怎样',pain.headline],['03','工作台做什么',story.solution]].map((x,i)=>`<button class="story-card ${state.tour===i?'selected':''}" data-action="tour" data-index="${i}"><span class="story-no">${x[0]}</span><b>${x[1]}</b><p>${x[2]}</p></button>`).join('')}</div>
<section class="pain-wall ${state.painOpen?'opened':''}" id="pain-wall"><div class="pain-lead"><span>⚠ 最容易被忽略的风险</span><strong>${pain.headline}</strong><button class="btn btn-sm" data-action="pain-sim">${state.painOpen?'收起对照':'模拟出错瞬间 →'}</button></div>${state.painOpen?`<div class="pain-comparison"><div class="pain-bad"><small>没核对就发出</small><b>✕ ${pain.bad}</b></div><div class="pain-good"><small>工作台先拦下</small><b>✓ ${pain.good}</b></div></div>`:''}</section>
<div class="section-title"><h2>选一个场景，亲手试</h2><p>改动材料，结果会跟着变化</p></div>
<div class="scenario-grid">${scenarios.map((x,i)=>`<button class="scenario-card ${i===state.scenario?'selected':''}" data-action="scenario" data-index="${i}"><span class="scenario-icon">${x.icon}</span><strong>${x.name}</strong><p>${x.subtitle}</p>${i===state.scenario?'<span class="selected-tick">✓</span>':''}</button>`).join('')}</div>
<section class="input-lab" id="experience"><div class="lab-head"><div><span class="eyebrow">TRY IT YOURSELF</span><h2>① 给它一堆杂乱材料</h2><p>每行一条。试试添加重复项，或改一个数字。</p></div><div class="head-actions"><button class="btn btn-sm" data-action="duplicate">＋ 加重复项</button><button class="btn btn-sm" data-action="restore-input">恢复样例</button></div></div><div class="lab-grid"><div><label class="field-label" for="raw-input">虚构原始材料 · 可编辑</label><textarea id="raw-input" spellcheck="false">${esc(state.raw[state.scenario])}</textarea><small class="input-hint" id="input-hint">这堆材料里有 ${a.duplicates} 条重复项。你也可以自己改一条。</small></div><div class="lab-explain"><div class="lab-icon">${s.icon}</div><b>${s.name}</b><p>${s.goal}</p><div class="lab-chips"><span>${a.rawCount} 条输入</span><span>${a.duplicates} 条重复</span></div><button class="btn btn-primary" data-action="step-demo" ${state.running?'disabled':''}>▷ 一步一步看</button><button class="btn" data-action="run" ${state.running?'disabled':''}>▶ 自动播放</button></div></div></section>
${complete?`<section class="impact-summary ${output?'delivered':''}" role="status"><div><small>${output?'已交付 · 演示效果':'刚才发生了什么'}</small><strong>${a.duplicates} 条重复被清掉，${a.riskDetected?'1 处风险被拦住':'待核对项已补全'}，${s.output}已生成。</strong></div><button class="btn btn-sm" data-action="rework">↻ 改一条，再看结果变化</button></section>`:''}
<div class="work-grid ${state.running||state.manual?'is-running':''}" id="demo-work"><section class="panel"><div class="panel-head"><strong>② 一次只看一个变化</strong><small>${state.running?'正在聚焦第 '+(state.phase+1)+' 环':state.manual?'单步讲解中':complete?'点环节可回看':'等待开始'}</small></div><div class="panel-body"><div class="pipeline">${['收进来','去重复','派出去','拦风险','出成果'].map((n,i)=>`<button class="stage ${state.phase>i?'done':state.phase===i?'active':''} ${stage===i?'inspected':''}" data-action="inspect" data-index="${i}" ${state.phase<i?'disabled':''} aria-label="查看第 ${i+1} 环：${n}"><span class="stage-icon">${state.phase>i?'✓':['↓','≋','♧','!','↗'][i]}</span><b>${n}</b></button>`).join('')}</div><div class="progress"><div style="width:${state.phase<0?0:(state.phase+1)*20}%"></div></div>${stage>=0?renderStageEvidence(stage,a):`<div class="stage-placeholder"><strong>点“单步讲解”或“自动播放”</strong><span>这里会放大每一环最值得看的变化。</span></div>`}${state.manual&&state.phase<4?`<button class="btn btn-primary next-stage" data-action="next-step">下一环：${['去重复','派出去','拦风险','出成果'][state.phase]} →</button>`:''}<details class="process-details"><summary>查看完整处理记录</summary>${a.stageNotes.slice(0,Math.max(0,state.phase+1)).map((x,i)=>`<div>${i+1}. ${esc(x)}</div>`).join('')}</details></div></section>
<section class="panel preview"><div class="panel-head"><strong>③ 最后拿到什么</strong><small>${complete?'一份能交给人的成果':'运行后出现'}</small></div>${complete?`<div class="doc-preview"><div class="doc-top">${badge(s.type)}${badge(output?'已交付':'待你确认',output?'ok':'warn')}</div><h3>${s.output}</h3><div class="result-tiles">${renderResultTiles(a)}</div><div class="exception-note"><b>请你拍板：</b>${esc(a.exception)}</div><details class="result-details"><summary>展开完整成果</summary><ul>${a.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details><label class="inline-check"><input type="checkbox" id="review-check" ${state.reviewed?'checked':''} ${output?'disabled':''}> 我已核对例外与数字</label><span class="note">本地规则演示；不连接真实 AI 或业务系统。</span></div><div class="review-box">${output?`<button class="btn btn-sm" data-action="download">↓ 下载成果</button><button class="btn btn-sm" data-view="knowledge">查看沉淀 →</button>`:`<button class="btn btn-sm" data-action="rework">↻ 回去修改</button><button class="btn btn-primary btn-sm" data-action="approve" ${state.reviewed?'':'disabled'}>✓ 确认交付</button>`}</div>`:`<div class="preview-empty"><img src="mascot.png" alt="" width="92"><b>每一步完成，成果就更近一点</b><span>最后由你确认后交付</span></div>`}</section></div>
<div class="lower-grid"><section class="panel"><div class="panel-head"><strong>五个抽屉 · 点开有数据</strong><small>从输入到沉淀</small></div><div class="panel-body">${[['inbox','收件箱','任务分类和派活','▤'],['assets','素材库','样例邮件、转写、表格','▧'],['templates','模板与标准','格式与验收清单','⌘'],['outputs','输出区','历史样例与新成果','◩'],['knowledge','知识库','经验和例外可检索','◇']].map(x=>`<button class="list-row" data-view="${x[0]}" style="width:100%;border-left:0;border-right:0;border-top:0;background:none;text-align:left"><span class="row-icon">${x[3]}</span><span class="row-main"><b>${x[1]}</b><small>${x[2]}</small></span><span class="row-end">→</span></button>`).join('')}</div></section><section class="panel"><div class="panel-head"><strong>讲解时，观众只要记住</strong></div><div class="panel-body"><div class="list-row"><span class="row-icon">1</span><span class="row-main"><b>机器找出重复和漏项</b></span></div><div class="list-row"><span class="row-icon">2</span><span class="row-main"><b>人只确认风险</b></span></div><div class="list-row"><span class="row-icon">3</span><span class="row-main"><b>成果留下，下次还能用</b></span></div></div></section></div>`;
}

function renderResultTiles(a){
  const m=a.metrics;
  const tiles=state.scenario===0?[[m.today,'今天做'],[m.week,'本周处理'],[m.delegated,'转给同事']]:state.scenario===1?[[m.decisions,'条决议'],[m.tasks,'项待办'],[m.follow,'条后续']]:[[m.current,'本周项数'],[a.duplicates,'重复已删'],[m.invalid,'待核对行']];
  return tiles.map(([number,label])=>`<div><strong>${number}</strong><span>${label}</span></div>`).join('');
}
function renderStageEvidence(stage,a){
  const focus=['先把材料收进来',a.duplicates?'重复提醒，立刻折叠':'没有重复，继续处理',['杂事变成清单','议题变成待办','数字变成结论'][state.scenario],a.riskDetected?'风险在发出前拦住':'缺项补齐，提醒消失','成果已经就位'][stage];
  const cue=['观众看：原来信息散在几处',a.duplicates?'观众看：重复项少了几条':'观众看：没有重复就不乱删','观众看：材料变成可执行的结构',a.riskDetected?'观众看：哪一句不能直接发':'观众看：补齐后提醒会消失','观众看：最终拿到了什么'][stage];
  let visual='';
  if(stage===0){const sources=[['✉ 邮件','☏ 群聊','▤ 随手记'],['◉ 会议转写','☏ 会后聊天'],['▥ 业务表格']][state.scenario];visual=`<div class="focus-number">${a.rawCount}<small>条材料</small></div><div class="focus-source">${sources.map(x=>`<span>${x}</span>`).join('')}</div>`;}
  if(stage===1)visual=`<div class="focus-equation"><span>${a.rawCount}<small>原始</small></span><b>→</b><span>${a.cleanCount}<small>保留</small></span></div><div class="focus-badge">✦ ${a.duplicates} 条重复已折叠</div>`;
  if(stage===2)visual=`<div class="focus-tiles">${renderResultTiles(a)}</div><div class="focus-badge">✦ 不再靠记忆分配</div>`;
  if(stage===3)visual=`<div class="focus-alert">${a.riskDetected?'!':'✓'}</div><div class="focus-risk">${esc(a.exception)}</div>`;
  if(stage===4)visual=`<div class="focus-document">▤</div><div class="focus-output">${esc(scenarios[state.scenario].output)}</div>`;
  return `<div class="stage-focus tone-${stage} ${stage===3&&!a.riskDetected?'cleared':''}" role="status" aria-live="polite"><div class="focus-kicker">环节 ${stage+1} / 5 · 现在只看这件事</div><h3>${focus}</h3><div class="focus-visual">${visual}</div><div class="focus-cue">${cue}</div></div>`;
}

function renderInbox(){const categories=['全部','今天做','本周做','别人做','不做'];const rows=state.inbox.filter(x=>state.filter==='全部'||x.category===state.filter);return `${pageHead('01 / INBOX','所有新活，先收进一个地方','演示：分类、派活、标记优先级。点击任务可切换归类。',`<button class="btn btn-primary" data-action="new-inbox">＋ 模拟收到新邮件</button>`)}<div class="stat-strip">${[['待处理',state.inbox.length,'条样例输入'],['今天做',state.inbox.filter(x=>x.category==='今天做').length,'件优先事项'],['本周做',state.inbox.filter(x=>x.category==='本周做').length,'件计划事项'],['已交付',state.outputs.length,'份演示成果']].map(x=>`<div class="stat-card"><small>${x[0]}</small><strong>${x[1]}</strong><span>${x[2]}</span></div>`).join('')}</div><section class="list-panel"><div class="filters">${categories.map(x=>`<button class="chip ${state.filter===x?'active':''}" data-action="filter" data-value="${x}">${x}</button>`).join('')}</div>${rows.length?rows.map(x=>`<div class="item"><span class="item-icon">${x.icon}</span><div class="item-content"><b>${esc(x.title)}</b><p>${esc(x.detail)}</p></div><div class="item-meta">${badge(x.category,x.category==='今天做'?'warn':'')}<small>${x.time}</small><button class="btn btn-sm" data-action="inbox-detail" data-id="${x.id}">处理</button></div></div>`).join(''):'<div class="empty-state">当前分类没有事项</div>'}</section>${state.selectedInbox?renderInboxDetail():''}`;}
function renderInboxDetail(){const x=state.inbox.find(v=>v.id===state.selectedInbox);if(!x)return '';return `<div class="section-title"><h2>处理事项：${esc(x.title)}</h2><button class="btn btn-sm" data-action="close-detail">关闭</button></div><section class="detail-card"><p>${esc(x.detail)} 来源：${x.source}。选择归类后，任务清单会同步更新。</p><div class="head-actions">${['今天做','本周做','别人做','不做'].map(c=>`<button class="btn btn-sm ${c===x.category?'btn-dark':''}" data-action="classify" data-id="${x.id}" data-category="${c}">${c}</button>`).join('')}<button class="btn btn-primary btn-sm" data-action="feed-inbox" data-id="${x.id}">放入演示流水线 →</button></div></section>`;}
function renderAssets(){return `${pageHead('02 / ASSETS','素材库','先看清 AI 读到什么。展开每份材料，或带入演示台运行。')}<div class="detail-grid">${scenarios.map((s,i)=>`<section class="detail-card asset-card"><span class="pill">虚构素材 ${String(i+1).padStart(2,'0')}</span><h3>${s.icon} ${['多渠道收件样例','会议转写与聊天样例','服务数据表样例'][i]}</h3><p>${s.source}</p><details><summary>查看原始内容</summary><pre>${esc(state.raw[i])}</pre></details><button class="btn btn-sm" data-action="asset-scenario" data-index="${i}">带入演示台 →</button></section>`).join('')}</div>`;}
function renderTemplates(){return `${pageHead('03 / STANDARDS','模板与验收标准','标准写清楚，AI 才知道什么叫完成。可勾选验收项，体验交付门槛。')}<div class="detail-grid"><section class="detail-card"><span class="pill">模板 01</span><h3>会议纪要模板</h3><ul><li>一句话结论</li><li>已确认决策与依据</li><li>待办、负责人、截止时间</li><li>未决事项与下次检查点</li></ul><details><summary>查看填好后的例子</summary><p>决议：本周先整理试用反馈。待办：周二前汇总 5 条反馈，负责人小林。待确认：更新演示脚本的负责人。</p></details></section><section class="detail-card"><span class="pill">模板 02</span><h3>数据周报模板</h3><ul><li>三条结论，每条附数字</li><li>异常项与可能原因</li><li>口径、数据来源、时间范围</li><li>下周建议与待核对项</li></ul><details><summary>查看填好后的例子</summary><p>本周 18 项、上周 15 项。资料整理 6 项，为本周最多。统计前去重 1 行，另有 1 行空值待核对。</p></details></section><section class="detail-card"><span class="pill">模板 03</span><h3>回复草稿模板</h3><ul><li>先确认对方需求</li><li>给出明确下一步</li><li>不确定的时间与承诺先标记</li></ul><details><summary>查看填好后的例子</summary><p>已收到演示安排需求。我们先确认参会名单和具体日期，再回复最终时间。</p></details></section><section class="detail-card"><span class="pill warn">可交互验收清单</span><h3>交付前要过三关</h3>${['结论能追溯到原始材料','日期、责任人和数字已经核对','敏感信息已脱敏'].map((x,i)=>`<label class="inline-check"><input type="checkbox" data-action="standard" data-index="${i}" ${state.standards[i]?'checked':''}> ${x}</label>`).join('')}<p>${state.standards.every(Boolean)?'✓ 当前样例满足交付标准。':'有未通过项。回到演示台确认交付时，会收到提醒。'}</p></section></div>`;}
function renderOutputs(){return `${pageHead('04 / OUTPUTS','输出区','这里已有三份虚构归档样例。现场新生成的成果也会出现在顶部。')}<div class="section-title"><h2>本次演示新成果</h2><p>${state.outputs.length} 份</p></div><section class="list-panel">${state.outputs.length?state.outputs.map(o=>`<div class="item"><span class="item-icon">◩</span><div class="item-content"><b>${esc(o.title)}</b><p>${esc(o.description)}</p></div><div class="item-meta">${badge('已交付','ok')}<button class="btn btn-sm" data-action="open-output" data-index="${o.scenario}">查看</button><button class="btn btn-sm" data-action="download-index" data-index="${o.scenario}">↓ 下载</button></div></div>`).join(''):'<div class="empty-state">你生成的成果会出现在这里。下方已有三份历史样例可看。</div>'}</section><div class="section-title"><h2>历史演示样例</h2><p>点击展开正文</p></div><div class="detail-grid">${archiveSamples.map(x=>`<section class="detail-card"><span class="pill">虚构归档</span><h3>${x.title}</h3><p>${x.description}</p><details><summary>展开成果正文</summary><ul>${analyze(x.scenario,sampleRaw[x.scenario]).bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></details><button class="btn btn-sm" data-action="asset-scenario" data-index="${x.scenario}">重新演示这条流程 →</button></section>`).join('')}</div>`;}
function renderKnowledge(){return `${pageHead('05 / KNOWLEDGE','知识库','三条虚构经验已备好；每次新交付，也会自动增加可检索记录。',`<input class="search" id="kb-search" type="search" placeholder="试搜：日期、责任人、重复行" value="${esc(state.query||'')}">`)}<section class="list-panel" id="kb-results">${knowledgeRows()}</section>`;}
function knowledgeRows(){const q=(state.query||'').trim().toLowerCase();const rows=state.knowledge.filter(x=>(x.title+x.description+x.exception).toLowerCase().includes(q));return rows.length?rows.map(x=>`<div class="item"><span class="item-icon">◇</span><div class="item-content"><b>${esc(x.title)}</b><p>${esc(x.description)} · 复盘：${esc(x.exception)}</p></div>${badge('可检索','ok')}</div>`).join(''):'<div class="empty-state">没有匹配记录。试搜“日期”“负责人”或“重复行”。</div>';}

function switchView(view){if(!labels[view])return;state.view=view;render();window.scrollTo({top:0,behavior:'smooth'});}
function selectScenario(index){runId++;state.scenario=index;state.phase=-1;state.inspect=null;state.analysis=null;state.running=false;state.manual=false;state.reviewed=false;state.returned=false;state.tour=0;state.painOpen=false;render();}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function run(auto=true){
  if(state.running)return;
  const id=++runId;
  state.running=auto;state.manual=!auto;state.phase=0;state.inspect=0;state.reviewed=false;state.returned=false;
  state.analysis=analyze(state.scenario);
  state.outputs=state.outputs.filter(x=>x.scenario!==state.scenario);
  state.knowledge=state.knowledge.filter(x=>!x.generated||x.scenario!==state.scenario);
  render();
  document.getElementById('demo-work')?.scrollIntoView?.({behavior:'smooth',block:'center'});
  if(!auto)return;
  for(let i=1;i<5;i++){
    await pause(1700);
    if(id!==runId)return;
    state.phase=i;state.inspect=i;render();
  }
  state.running=false;render();notify('演示完成。请核对例外，再确认交付。');
}
function advanceStep(){
  if(!state.manual||state.phase>=4)return;
  state.phase++;state.inspect=state.phase;
  if(state.phase===4){state.manual=false;notify('五步完成。看右侧成果，再决定是否交付。');}
  render();
}
function approve(){
  if(!state.reviewed||state.phase<4||!state.analysis)return;
  if(!state.standards.every(Boolean)){notify('验收清单有未通过项，请先到“模板与标准”检查。');return;}
  const s=scenarios[state.scenario],a=state.analysis;
  state.outputs.push({scenario:state.scenario,title:s.output,description:`${s.name} · ${a.rawCount} 条输入，去重 ${a.duplicates} 条`,bullets:[...a.bullets],exception:a.exception});
  state.knowledge.push({scenario:state.scenario,title:`${s.name}｜本次交付复盘`,description:a.bullets[0],exception:a.exception,generated:true});
  render();notify('交付成功。输出区与知识库都增加了新记录。');
}
function rework(){
  if(state.phase<4)return;
  state.phase=-1;state.inspect=null;state.manual=false;state.reviewed=false;state.returned=true;
  render();document.getElementById('raw-input')?.focus();
  notify('请修改原始材料，然后重新运行。');
}
function download(index=state.scenario){
  const s=scenarios[index],o=state.outputs.find(x=>x.scenario===index);
  const a=o||analyze(index);
  const textContent=`${s.output}\n\n${a.bullets.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n人工复核：${a.exception}\n\n（虚构演示数据）`;
  const url=URL.createObjectURL(new Blob([textContent],{type:'text/plain;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=`${s.output}-演示样例.txt`;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function newInbox(){
  if(state.inbox.some(x=>x.id===7)){notify('演示邮件已加入收件箱。');return;}
  state.inbox.unshift({id:7,icon:'✉',title:'请汇总下周培训准备事项',detail:'示例同事希望收到一份精简的培训准备清单。',source:'邮件',category:'今天做',time:'刚刚'});
  render();notify('收到一封模拟邮件，已加入“今天做”。');
}

document.addEventListener('click',event=>{
  const el=event.target.closest('[data-view],[data-action]');if(!el)return;
  if(el.dataset.view){switchView(el.dataset.view);return;}
  const action=el.dataset.action,index=Number(el.dataset.index);
  if(action==='scenario')selectScenario(index);
  else if(action==='run')run();
  else if(action==='step-demo')run(false);
  else if(action==='next-step')advanceStep();
  else if(action==='pain-sim'){state.painOpen=!state.painOpen;render();document.getElementById('pain-wall')?.scrollIntoView?.({behavior:'smooth',block:'center'});}
  else if(action==='reset'){state.raw[state.scenario]=sampleRaw[state.scenario];selectScenario(state.scenario);notify('当前场景已恢复初始样例。');}
  else if(action==='tour'){state.tour=index;render();}
  else if(action==='tour-next'){if(state.tour<2){state.tour++;render();}else document.getElementById('experience')?.scrollIntoView({behavior:'smooth',block:'start'});}
  else if(action==='duplicate'){
    const rows=state.raw[state.scenario].split(/\r?\n/).filter(Boolean);
    const source=rows[state.scenario===2?1:0];
    if(source){state.raw[state.scenario]+=`\n${source}`;state.phase=-1;state.analysis=null;state.manual=false;render();notify('已添加重复项。运行后查看清洗结果。');}
  }
  else if(action==='restore-input'){state.raw[state.scenario]=sampleRaw[state.scenario];state.phase=-1;state.analysis=null;state.manual=false;render();notify('已恢复样例输入。');}
  else if(action==='inspect'){if(index<=state.phase){state.inspect=index;render();}}
  else if(action==='approve')approve();
  else if(action==='rework')rework();
  else if(action==='download')download();
  else if(action==='download-index')download(index);
  else if(action==='open-output'){
    const o=state.outputs.find(x=>x.scenario===index);if(!o)return;
    state.scenario=index;state.analysis={...analyze(index),bullets:o.bullets,exception:o.exception};state.phase=4;state.inspect=4;state.reviewed=true;switchView('dashboard');
  }
  else if(action==='filter'){state.filter=el.dataset.value;render();}
  else if(action==='new-inbox')newInbox();
  else if(action==='inbox-detail'){state.selectedInbox=Number(el.dataset.id);render();}
  else if(action==='close-detail'){state.selectedInbox=null;render();}
  else if(action==='classify'){
    const item=state.inbox.find(x=>x.id===Number(el.dataset.id));
    if(item){item.category=el.dataset.category;render();notify(`已归入“${item.category}”。`);}
  }
  else if(action==='feed-inbox'){
    const item=state.inbox.find(x=>x.id===Number(el.dataset.id));if(!item)return;
    state.raw[0]+=`\n${item.source}｜${item.detail}`;selectScenario(0);switchView('dashboard');notify('事项已送入收件分拣演示。');
  }
  else if(action==='asset-scenario'){selectScenario(index);switchView('dashboard');}
});
document.addEventListener('change',event=>{
  if(event.target.id==='review-check'){state.reviewed=event.target.checked;render();}
  else if(event.target.dataset.action==='standard'){state.standards[Number(event.target.dataset.index)]=event.target.checked;render();}
});
document.addEventListener('input',event=>{
  if(event.target.id==='kb-search'){state.query=event.target.value;document.getElementById('kb-results').innerHTML=knowledgeRows();}
  if(event.target.id==='raw-input'){
    state.raw[state.scenario]=event.target.value;
    state.phase=-1;state.analysis=null;state.inspect=null;state.manual=false;state.reviewed=false;
    document.getElementById('input-hint').textContent='材料已修改。点击“单步讲解”或“自动播放”查看新结果。';
  }
});
updateClock();setInterval(updateClock,60000);render();
