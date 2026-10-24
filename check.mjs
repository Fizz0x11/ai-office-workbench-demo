import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const nodes = new Map();
const listeners = new Map();
function node(id) {
  if (!nodes.has(id)) nodes.set(id, {innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){}});
  return nodes.get(id);
}
const document = {getElementById:node,querySelector:()=>node('inbox-count'),querySelectorAll:()=>[],addEventListener(type,handler){listeners.set(type,handler);}};
const ctx = vm.createContext({document,window:{scrollTo(){}},setTimeout:(fn,ms)=>setTimeout(fn,Math.min(ms,2)),setInterval(){},clearTimeout,structuredClone,Intl,Date,console});
vm.runInContext(readFileSync(new URL('./dist/app.js',import.meta.url),'utf8'),ctx);
assert.match(node('content').innerHTML,/所有数据均为虚构样例/);
assert.match(node('content').innerHTML,/现在乱在哪/);
assert.match(node('content').innerHTML,/错了会怎样/);
assert.match(node('content').innerHTML,/工作台做什么/);
assert.equal(vm.runInContext('state.knowledge.length',ctx),3);
assert.equal(vm.runInContext('state.inbox.length',ctx),6);
const click=dataset=>listeners.get('click')({target:{closest:()=>({dataset})}});
click({action:'duplicate'});
assert.equal(vm.runInContext('analyze(0).duplicates',ctx),2);
click({action:'reset'});
assert.equal(vm.runInContext('analyze(0).duplicates',ctx),1);
click({action:'new-inbox'});
assert.equal(vm.runInContext('state.inbox.length',ctx),7);
click({action:'pain-sim'});
assert.match(node('content').innerHTML,/未经核对：好的，下周三见/);
click({action:'step-demo'});
assert.equal(vm.runInContext('state.phase',ctx),0);
assert.match(node('content').innerHTML,/观众看：原来信息散在几处/);
for(let i=0;i<4;i++)click({action:'next-step'});
assert.equal(vm.runInContext('state.phase',ctx),4);
assert.match(node('content').innerHTML,/刚才发生了什么/);
assert.equal(vm.runInContext('analyze(2).duplicates',ctx),1);
assert.match(vm.runInContext('analyze(2).bullets[0]',ctx),/本周合计 18 项；上周 15 项/);
vm.runInContext('state.raw[2] = state.raw[2].replace("资料整理,6,4","资料整理,7,4")',ctx);
assert.match(vm.runInContext('analyze(2).bullets[0]',ctx),/本周合计 19 项/);
vm.runInContext('state.raw[2] = sampleRaw[2]',ctx);
assert.match(vm.runInContext('analyze(1).exception',ctx),/缺少负责人/);
vm.runInContext('state.raw[1] = state.raw[1].replaceAll("更新演示脚本","更新演示脚本，负责人：小周")',ctx);
assert.doesNotMatch(vm.runInContext('analyze(1).exception',ctx),/缺少负责人/);
assert.equal(vm.runInContext('analyze(1).riskDetected',ctx),false);
vm.runInContext('state.raw[1] = sampleRaw[1]',ctx);
await vm.runInContext('run()',ctx);
assert.equal(vm.runInContext('state.phase',ctx),4);
vm.runInContext('state.reviewed = true; approve()',ctx);
assert.equal(vm.runInContext('state.outputs.length',ctx),1);
assert.equal(vm.runInContext('state.knowledge.length',ctx),4);
vm.runInContext('switchView("knowledge")',ctx);
assert.match(node('content').innerHTML,/交付复盘/);
console.log('Demo check passed: data changes, dedup, exception, review, delivery, knowledge.');

if (process.env.DEMO_PASSWORD) {
  const authNodes = new Map();
  const authNode = id => {
    if (!authNodes.has(id)) authNodes.set(id, {hidden:false,textContent:'',value:'',focus(){},reset(){this.elements.username.value='';this.elements.password.value='';},addEventListener(type,handler){this[type]=handler}});
    return authNodes.get(id);
  };
  const form = authNode('login-form');
  form.elements = {username:{value:'demo',focus(){}},password:{value:process.env.DEMO_PASSWORD,focus(){}}};
  const authContext = vm.createContext({document:{getElementById:authNode},crypto:webcrypto,TextEncoder,Uint8Array,Array});
  vm.runInContext(readFileSync(new URL('./dist/auth.js',import.meta.url),'utf8'),authContext);
  await form.submit({preventDefault(){}});
  assert.equal(authNode('workbench').hidden,false);
  assert.equal(authNode('login-screen').hidden,true);
  authNode('logout-button').click();
  assert.equal(authNode('workbench').hidden,true);
  form.elements.username.value='demo';
  form.elements.password.value='wrong-password';
  await form.submit({preventDefault(){}});
  assert.match(authNode('login-error').textContent,/不正确/);
  console.log('Demo login check passed: valid password, logout, invalid password.');
}
