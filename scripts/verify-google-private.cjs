// Private stdin transport for the Windows installed-key helper. Never print input.
const {bridge}=require('../server/gateway.cjs');
const {verifyAdapter}=require('../server/verify-google.cjs');
(async()=>{let raw='';for await(const chunk of process.stdin)raw+=chunk;const settings=JSON.parse(raw);raw='';
 if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(settings.APPS_SCRIPT_URL||'')||(settings.APPS_SCRIPT_SECRET||'').length<32)throw Error('Installed signing configuration unavailable.');
 const send=(action,payload)=>bridge(action,payload,settings);
 const statusIndex=process.argv.indexOf('--status');
 if(statusIndex>=0){const id=process.argv[statusIndex+1];if(!require('../shared/core.cjs').uuid.test(id||''))throw Error('Supply an opaque request UUID after --status.');console.log(JSON.stringify(await send('status',{lead:{request_id:id},clientKey:'synthetic-verification'})));return;}
 console.log(JSON.stringify(await verifyAdapter(send,process.argv.includes('--capture'))));
})().catch(error=>{console.error('Verification failed:',error.message);if(error.requestId)console.error('Reconcile this opaque request ID before another test:',error.requestId);process.exitCode=1;});
