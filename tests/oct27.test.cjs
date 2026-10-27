const {test}=require('node:test'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const core=require('../shared/core.cjs'),{lead,scriptHarness}=require('./helpers.cjs'),{verifyAdapter}=require('../server/verify-google.cjs');
test('minimal generic inquiry saves optional routing/headcount as blank and preserves free-text task',()=>{
 const h=scriptHarness(),data=lead({business_type:'',service_area:'',team_size:'',main_challenge:'Copy job updates from email into quotes and invoices.',email:'valid.address@gmail.com'});
 assert.deepEqual(core.validateLead(data).errors,{});const first=h.post({action:'capture',lead:data,clientKey:'minimal'});assert.equal(first.ok,true);
 assert.equal(h.post({action:'capture',lead:data,clientKey:'minimal'}).leadId,first.leadId);
 const sheet=h.sheets.get('Leads & Discovery Calls');assert.equal(sheet.rows.length,2);assert.equal(sheet.rows[1][9],'');assert.equal(sheet.rows[1][10],data.main_challenge);assert.equal(sheet.rows[0].length,30);
 for(const patch of [{main_challenge:''},{main_challenge:'x'.repeat(1001)},{main_challenge:'hidden\u0000value'},{team_size:'0'},{team_size:'1.5'},{team_size:'-1'}])assert(Object.keys(core.validateLead({...data,...patch}).errors).length>0);
});
test('concept allowlist preserves all UTM values, uses existing Notes and protects formula cells',()=>{
 for(const concept of core.concepts){const h=scriptHarness(),data=lead({main_challenge:'=IMPORTXML("fictional")',attribution:{concept,utm_content:'original-creative',utm_source:'facebook'}});assert.equal(h.post({action:'capture',lead:data,clientKey:'concept'}).ok,true);const row=h.sheets.get('Leads & Discovery Calls').rows[1];assert.equal(row[17],'Website concept: '+concept);assert.equal(row[25],'original-creative');assert.ok(h.writes.some(w=>w.values.some(cells=>cells.includes("'=IMPORTXML(\"fictional\")"))));}
 assert.equal(core.validateLead(lead({attribution:{concept:'forged',password:'ignore'}})).value.attribution.concept,undefined);
});
test('legacy canonical payload hash remains unchanged across the generic form update',()=>{
 const data=lead({request_id:'b60c0ab8-6081-4496-9b1c-9c95d7a66b8b'}),canonical=core.validateLead(data).value;
 // Golden hash from the deployed October 26 validator, not recalculated by this test.
 assert.equal(createHash('sha256').update(JSON.stringify(canonical)).digest('hex'),'87abe05990a6050afdf5f5b2deede3bf3ec3892a6ce90554db9012408b90cbed');
 const h=scriptHarness(),first=h.post({action:'capture',lead:data,clientKey:'legacy'});assert.equal(h.post({action:'capture',lead:data,clientKey:'legacy'}).leadId,first.leadId);
});
test('integration verification refuses the old adapter before making a synthetic append',async()=>{
 let calls=0;await assert.rejects(verifyAdapter(async()=>{calls++;return{ok:true,schema:'ready'};},true),/Update the existing Apps Script/);assert.equal(calls,1);
});
test('revised public API uses a versioned capture action that the old adapter cannot append',async()=>{
 const h=scriptHarness(),env={FUNNEL_MODE:'live',CAPTURE_ENABLED:'true',PRIVACY_POLICY_URL:'https://example.invalid/privacy',ALLOWED_ORIGINS:'https://example.invalid',APPS_SCRIPT_URL:'https://script.google.com/macros/s/test/exec',APPS_SCRIPT_SECRET:h.props.APPS_SCRIPT_SECRET};
 let action;const fetcher=async(url,options)=>{action=JSON.parse(JSON.parse(options.body).data).action;return{ok:true,json:async()=>({ok:false,code:'validation'})};};
 const res={setHeader(){},end(raw){this.body=JSON.parse(raw);}};await require('../api/leads.js').createHandler(env,fetcher)({method:'POST',headers:{origin:'https://example.invalid','content-type':'application/json'},body:lead()},res);
 assert.equal(action,'capture_v2');assert.equal(res.statusCode,503);assert.equal(res.body.code,'adapter_update_required');assert.equal(h.sheets.get('Leads & Discovery Calls').rows.length,1);
});
test('owner notification has a deduplicated copy while acknowledgment and development tests do not',()=>{
 const h=scriptHarness();Object.assign(h.props,{EMAIL_ENABLED:'true',SENDER_EMAIL:'authorized@example.invalid',REPLY_TO_EMAIL:'reply@example.invalid',OWNER_NOTIFICATION_EMAILS:'sales@example.invalid',OWNER_NOTIFICATION_CC:'info@example.invalid,info@example.invalid,sales@example.invalid',BOOKING_URL:'https://example.invalid/book'});
 h.post({action:'capture',lead:lead(),clientKey:'copy'});h.context.processSmartLearnNotifications();h.context.processSmartLearnNotifications();
 const owner=h.sent.find(x=>x[0]==='sales@example.invalid'),ack=h.sent.find(x=>x[0]==='test@example.invalid');assert.equal(owner[3].cc,'info@example.invalid');assert.equal(ack[3].cc,undefined);assert.equal(h.sent.length,2);
 const dev=scriptHarness();Object.assign(dev.props,{SENDER_EMAIL:'authorized@example.invalid',REPLY_TO_EMAIL:'reply@example.invalid',OWNER_NOTIFICATION_CC:'info@example.invalid',TEST_EMAIL:'approved-test@example.invalid',TEST_EMAIL_ENABLED:'true'});dev.context.sendSmartLearnTestMessages();assert.ok(dev.sent.every(x=>x[0]==='approved-test@example.invalid'&&!x[3].cc));
});
