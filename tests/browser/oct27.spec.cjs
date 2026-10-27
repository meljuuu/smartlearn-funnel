const {test,expect}=require('@playwright/test');
const live={previewMode:false,leadEndpoint:'/api/leads',privacyUrl:'https://example.invalid/privacy',bookingUrl:'',bookingEmail:'sales@smartlearn.ca'};
test('an outdated adapter fails visibly and cannot produce success',async({page})=>{
 await page.route('**/assets/config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.SMARTLEARN_CONFIG=${JSON.stringify(live)}`}));
 await page.route('**/api/leads',r=>r.fulfill({status:503,json:{ok:false,code:'adapter_update_required'}}));
 await page.goto('/');await page.locator('#business').fill('Synthetic Business');await page.locator('#challenge').fill('Copying invoices');await page.locator('#next-step').click();await page.locator('#name').fill('Synthetic Contact');await page.locator('#email').fill('test@example.invalid');await page.locator('#consent').check();await page.locator('#submit-button').click();
 await expect(page.locator('#form-errors')).toContainText('adapter needs an update');await expect(page.locator('#check-status')).toBeVisible();await expect(page).not.toHaveURL(/thank-you/);
});
test('generic minimal form accepts other businesses, optional routing and normal email providers',async({page})=>{
 await page.route('**/assets/config.js',r=>r.fulfill({contentType:'application/javascript',body:`window.SMARTLEARN_CONFIG=${JSON.stringify(live)}`}));
 let captured;const id='b60c0ab8-6081-4496-9b1c-9c95d7a66b8b';await page.route('**/api/leads',r=>{const body=r.request().postDataJSON();if(!body.action)captured=body;return r.fulfill({json:{ok:true,state:'captured',leadId:id}});});
 await page.goto('/?concept=repeated-entry&utm_content=creative-2&utm_source=facebook');
 await page.locator('#business').fill('Example Bookkeeping');await page.locator('#challenge').fill('Copying customer details into invoices.');
 await expect(page.locator('.optional-routing')).not.toHaveAttribute('open','');
 await page.locator('#business').press('Enter');await expect(page.locator('#name')).toBeFocused();
 await page.locator('#name').fill('Synthetic Contact');await page.locator('#email').fill('valid.email@gmail.com');await page.locator('#consent').check();await page.locator('#submit-button').click();
 await expect(page).toHaveURL(/thank-you/);expect(captured.team_size).toBe('');expect(captured.business_type).toBe('');expect(captured.service_area).toBe('');expect(captured.phone).toBe('');expect(captured.attribution).toEqual({utm_content:'creative-2',utm_source:'facebook',concept:'repeated-entry'});
});
test('three allowlisted concepts change only constant copy; unknown concepts fall back safely',async({page})=>{
 for(const [concept,heading] of [['evening-paperwork','The jobs are finished.'],['repeated-entry','One customer.'],['customer-updates','One customer update.'],['<script>alert(1)</script>','The jobs are finished.']]){await page.goto('/?concept='+encodeURIComponent(concept));await expect(page.locator('h1')).toContainText(heading);await expect(page.locator('main')).not.toContainText('home-service');await expect(page.locator('.hero-photo')).toHaveAttribute('src','assets/admin-desk-1200.jpg');await expect(page.locator('[data-preview]').first()).toBeVisible();}
});
test('optional invalid headcount opens its disclosure and textarea Enter inserts a new line',async({page})=>{
 await page.goto('/');await page.locator('#business').fill('Example Business');await page.locator('#challenge').fill('Copying quotes');await page.locator('#challenge').press('Enter');await expect(page.locator('#challenge')).toBeFocused();await expect(page.locator('[data-step="1"]')).toBeVisible();
 await page.locator('.optional-routing summary').click();await page.locator('#team').fill('0');await page.locator('.optional-routing summary').click();await page.locator('#next-step').click();await expect(page.locator('#team')).toBeFocused();await expect(page.locator('.optional-routing')).toHaveAttribute('open','');
});
