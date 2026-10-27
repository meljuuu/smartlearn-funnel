/* Exact allowlist: a concept changes copy and attribution, never capture/booking state. */
(() => {
  const concepts = {
    'evening-paperwork': { heading: "The jobs are finished.<br><span>The paperwork isn’t.</span>", pain: 'Quotes to send. Customers waiting for updates. Invoices to follow up. The same details entered into different systems.', title: 'The jobs are finished. The paperwork isn’t. | SmartLearn' },
    'repeated-entry': { heading: 'One customer.<br><span>The same details, again.</span>', pain: 'From inquiry to quote to invoice, the same information gets copied into different systems. Let’s talk about one task you’d like to simplify.', title: 'Reduce repeated data entry | SmartLearn' },
    'customer-updates': { heading: 'One customer update.<br><span>Too many calls.</span>', pain: 'A schedule change. A missing job detail. Another call to check what’s happening. Explore a clearer way to manage updates and follow-ups.', title: 'Simplify customer updates | SmartLearn' }
  };
  const requested = new URLSearchParams(location.search).get('concept');
  const concept = Object.hasOwn(concepts, requested) ? requested : 'evening-paperwork';
  window.SMARTLEARN_CAMPAIGN = Object.freeze({ concept });
  const copy = concepts[concept], heading = document.querySelector('#hero-title'), pain = document.querySelector('#hero-pain');
  if (heading) heading.innerHTML = copy.heading; // Only constant, source-controlled markup.
  if (pain) pain.textContent = copy.pain;
  if (heading) document.title = copy.title;
})();
