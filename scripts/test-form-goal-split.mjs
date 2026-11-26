import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const cookie = readFileSync(new URL('../src/components/CookieConsent.astro',import.meta.url),'utf8').match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const callback = readFileSync(new URL('../src/scripts/case-callback.mjs',import.meta.url),'utf8').replaceAll('export ','');
function setup(consent='accepted', result='mail_sent', pending=false){
 const listeners=new Map(), google=[],yandex=[],events=[];let calls=0,release;
 const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{hidden:true,disabled:false,dataset:{},textContent:'',focus(){},addEventListener(t,fn){listeners.set(s+':'+t,fn);}});return nodes.get(s);};
 const root=node('root');root.dataset={yandexId:'123',googleId:'G-TEST123'};root.querySelector=node;
 const form=node('form');form.querySelector=node;form.reportValidity=()=>true;form.reset=()=>{};
 const values={contact:'PRIVATE_CONTACT',comment:'PRIVATE_COMMENT',privacy_consent:'1'};
 const document={querySelector:s=>s.includes('consent')?root:node('settings'),createElement:()=>({}),head:{appendChild(){}},addEventListener(t,fn){listeners.set('doc:'+t,fn);},dispatchEvent(e){events.push(e);listeners.get('doc:'+e.type)?.(e);}};
 const context=vm.createContext({document,window:{ym:(...a)=>yandex.push(a),gtag:(...a)=>google.push(a),location:{reload(){}}},location:{origin:'https://example.test',pathname:'/cases/locapp/'},localStorage:{getItem:()=>consent,setItem(){}},Date,AbortSignal,Error,CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail;}},FormData:class{constructor(){this.v=new Map(Object.entries(values));}get(k){return this.v.get(k);}set(k,v){this.v.set(k,v);}},fetch:async()=>{calls++;if(pending)await new Promise(r=>release=r);return {ok:true,status:200,json:async()=>({status:result})};}});
 vm.runInContext(cookie,context);vm.runInContext(callback,context);context.form=form;vm.runInContext('bindCaseCallback(form)',context);
 return {google,yandex,events,submit:()=>listeners.get('form:submit')({preventDefault(){}}),release:()=>release(),calls:()=>calls,fire:detail=>document.dispatchEvent({type:'maria:form-success',detail})};
}
const count=(s,name)=>s.google.filter(a=>a[0]==='event'&&a[1]===name).length;
test('shared callback success reports only the site goal, once, without customer data',async()=>{const s=setup();await s.submit();assert.equal(count(s,'site_form_success'),1);assert.equal(count(s,'practicum_form_success'),0);assert.equal(s.yandex.filter(a=>a[1]==='reachGoal'&&a[2]==='site_form_success').length,1);assert.equal(s.events.length,1);assert.doesNotMatch(JSON.stringify([s.google,s.yandex,s.events]),/PRIVATE_CONTACT|PRIVATE_COMMENT/);});
test('practicum success reports only its own goal and sanitizes tariff',()=>{const s=setup();s.fire({service:'codex_practicum',tariff:'PRIVATE_CONTACT',contact:'PRIVATE_CONTACT'});assert.equal(count(s,'practicum_form_success'),1);assert.equal(count(s,'site_form_success'),0);assert.doesNotMatch(JSON.stringify([s.google,s.yandex]),/PRIVATE_CONTACT/);});
for(const consent of [null,'declined'])test('no success goals without analytics permission: '+consent,async()=>{const s=setup(consent);await s.submit();s.fire({service:'codex_practicum',tariff:'Базовый'});assert.equal(s.google.length,0);assert.equal(s.yandex.length,0);});
for(const status of ['validation_failed','mail_failed','spam'])test('no common goal on '+status,async()=>{const s=setup('accepted',status);await s.submit();assert.equal(count(s,'site_form_success'),0);assert.equal(s.events.length,0);});
test('pending double click does not duplicate a confirmed goal',async()=>{const s=setup('accepted','mail_sent',true);const first=s.submit();await s.submit();assert.equal(s.calls(),1);assert.equal(count(s,'site_form_success'),0);s.release();await first;assert.equal(count(s,'site_form_success'),1);});
