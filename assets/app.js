(() => {
 'use strict';
 const cfg=window.SMARTLEARN_CONFIG||{};
 const https=(value)=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
 const live=cfg.previewMode===false&&https(cfg.leadEndpoint)&&https(cfg.privacyUrl);
 document.querySelectorAll('[data-preview]').forEach(el=>el.hidden=live);
 const form=document.querySelector('#discovery-form');
 if(form){
  const steps=[...form.querySelectorAll('[data-step]')],errors=form.querySelector('#form-errors');
  const show=(n)=>{steps.forEach((el,i)=>el.hidden=i!==n-1);document.querySelector('#step-label').textContent=`Step ${n} of 2`;document.querySelector('#progress').style.width=`${n*50}%`;errors.hidden=true;steps[n-1].querySelector('input,select')?.focus();};
  const validate=(step)=>{const invalid=[...step.querySelectorAll('[required]')].filter(el=>!el.checkValidity());step.querySelectorAll('[required]').forEach(el=>el.setAttribute('aria-invalid',String(!el.checkValidity())));if(invalid.length){errors.textContent='Please complete the required fields and check your email address.';errors.hidden=false;invalid[0].focus();return false;}errors.hidden=true;return true;};
  document.querySelector('#next-step').addEventListener('click',()=>{if(validate(steps[0]))show(2);});
  document.querySelector('#previous-step').addEventListener('click',()=>show(1));
  form.addEventListener('submit',async(event)=>{
   event.preventDefault();if(!validate(steps[0])){show(1);validate(steps[0]);return;}if(steps[1].hidden){show(2);return;}if(!validate(steps[1]))return;
   if(form.elements.website_url.value)return;
   if(!live){form.reset();location.assign('thank-you.html?mode=preview');return;}
   const button=document.querySelector('#submit-button');button.disabled=true;button.textContent='Sending your request…';
   const data=Object.fromEntries(new FormData(form).entries());delete data.website_url;data.contact_consent=true;
   form.dataset.requestId||=crypto.randomUUID();data.request_id=form.dataset.requestId;data.source='smartlearn_discovery_funnel';data.submitted_at=new Date().toISOString();
   const source=new URLSearchParams(location.search);data.attribution={};for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])if(source.has(key))data.attribution[key]=source.get(key).slice(0,200);
   try{const response=await fetch(cfg.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});const body=await response.json();if(!response.ok||body.ok!==true||!body.leadId)throw new Error('Unconfirmed submission');form.reset();location.assign('thank-you.html?mode=received');}
   catch{errors.textContent=`We couldn’t confirm that your request was received. Please contact ${cfg.bookingEmail||'info@smartlearn.ca'} before trying again.`;errors.hidden=false;errors.focus();button.disabled=false;button.textContent='Request my free discovery call ↗';}
  });
  const privacy=document.querySelector('#privacy-link'),dialog=document.querySelector('#privacy-dialog');
  if(https(cfg.privacyUrl)){privacy.href=cfg.privacyUrl;privacy.target='_blank';privacy.rel='noopener';}else privacy.addEventListener('click',e=>{e.preventDefault();dialog.showModal();});
  document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 }
 const thank=document.querySelector('#thank-content');
 if(thank){
  const received=live&&new URLSearchParams(location.search).get('mode')==='received';
  document.querySelector('#thank-title').textContent=received?'Thanks for your inquiry.':'Here’s the next step.';
  document.querySelector('#thank-description').textContent=received?'Your request was submitted. Choose a time below if booking is available, or contact the team to arrange your discovery call.':'This is a preview of the booking handoff. No inquiry has been sent and no appointment has been booked.';
  document.querySelector('#request-status').textContent=received?'INQUIRY SUBMITTED · CALL TIME NOT YET CONFIRMED':'PREVIEW COMPLETE · NO INFORMATION SENT';
  const booking=document.querySelector('#booking-button');if(https(cfg.bookingUrl)){booking.href=cfg.bookingUrl;booking.hidden=false;}else document.querySelector('#booking-note').hidden=false;
 }
})();
