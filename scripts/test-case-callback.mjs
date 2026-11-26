import test from 'node:test';
import assert from 'node:assert/strict';
import { sendCallback, makeCallbackFields } from '../src/scripts/case-callback.mjs';
test('success requires server mail_sent',async()=>{await sendCallback(new FormData(),async()=>({ok:true,status:200,json:async()=>({status:'mail_sent'})}));});
for(const status of ['validation_failed','mail_failed','spam']) test('does not report '+status+' as sent',async()=>{await assert.rejects(sendCallback(new FormData(),async()=>({ok:true,status:200,json:async()=>({status})})));});
test('rate limit is shown as failure',async()=>{await assert.rejects(sendCallback(new FormData(),async()=>({ok:false,status:429})),/Слишком много/);});
test('network failure is not treated as success',async()=>{await assert.rejects(sendCallback(new FormData(),async()=>{throw new Error('network');}));});
test('payload accepts contact choice, optional comment and requires consent',()=>{
 const Native=globalThis.FormData;
 try{globalThis.FormData=class {constructor(form){this.values=new Map(Object.entries(form));}get(k){return this.values.get(k);}set(k,v){this.values.set(k,v);}};
 const values={contact:' @example ',comment:' Нужна помощь с запуском ',privacy_consent:'1'};
 assert.throws(()=>makeCallbackFields({...values,privacy_consent:''},1,'https://example.test/cases/a/'),/согласие/);
 assert.throws(()=>makeCallbackFields({...values,contact:'  '},1,'https://example.test/cases/a/'),/контакт/);
 for(const contact of ['@example','test@example.test','+7 999 123-45-67','https://example.test/profile']){
 const fields=makeCallbackFields({...values,contact},1,'https://example.test/cases/a/');
 assert.equal(fields.get('your-phone'),contact);
 assert.equal(fields.get('your-name'),'Имя не указано');
 assert.match(fields.get('textarea'),/Комментарий: Нужна помощь с запуском/);
 assert.match(fields.get('textarea'),/cases\/a\//);
 assert.equal(fields.get('privacy_consent_version'),'2026-11-25');
 }
 const fields=makeCallbackFields({...values,comment:''},1,'https://example.test/cases/a/');
 assert.doesNotMatch(fields.get('textarea'),/Комментарий:/);
 }finally{globalThis.FormData=Native;}
});
