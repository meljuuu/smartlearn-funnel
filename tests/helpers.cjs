const { randomUUID, createHash, createHmac } = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');
function lead(overrides = {}) {
  return { request_id: randomUUID(), business_name: 'Test Plumbing', business_type: 'Plumbing', service_area: 'Other', team_size: '1', main_challenge: 'Paperwork and repeated data entry', full_name: 'Test Person', email: 'test@example.invalid', phone: '', contact_consent: true, attribution: { utm_source: 'test', ad_id: '123' }, ...overrides };
}
const headers = ['Date received', 'Source', 'Meta lead ID', 'Name', 'Business name', 'Email', 'Phone', 'Business type', 'City/service area', 'Team size', 'Main administrative challenge', 'Assigned person', 'Status', 'Next follow-up date', 'Call date/time', 'Attendance', 'Outcome', 'Notes'];
function scriptHarness() {
  let locked = false;
  const writes = [], sent = [];
  class Sheet {
    constructor(name, rows = []) { this.name = name; this.rows = rows; this.maxColumns = 26; this.maxRows = 1000; }
    getLastColumn() { return Math.max(0, ...this.rows.map(r => r.length)); }
    getLastRow() { return this.rows.length; }
    getMaxColumns() { return this.maxColumns; }
    getMaxRows() { return this.maxRows; }
    insertRowsAfter(at, count) { this.maxRows += count; }
    insertColumnsAfter(at, count) { this.maxColumns += count; }
    setFrozenRows() {}
    getRange(row, col, nr = 1, nc = 1) {
      return {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => this.rows[row + i - 1]?.[col + j - 1] ?? '')),
        getValue: () => this.rows[row - 1]?.[col - 1] ?? '',
        setValue: value => this.getRange(row, col).setValues([[value]]),
        setValues: values => {
          if (!locked) throw new Error('Write without script lock');
          writes.push({ sheet: this.name, row, col, values });
          for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) {
            this.rows[row + i - 1] ||= [];
            const v = values[i][j];
            this.rows[row + i - 1][col + j - 1] = typeof v === 'string' && /^'[\s]*[=+\-@]/.test(v) ? v.slice(1) : v;
          }
        }
      };
    }
  }
  const sheets = new Map([['Leads & Discovery Calls', new Sheet('Leads & Discovery Calls', [headers.slice()])]]);
  const book = { getSheetByName: name => sheets.get(name), insertSheet: name => { const s = new Sheet(name); sheets.set(name, s); return s; } };
  const props = { SPREADSHEET_ID: 'test-sheet', LEADS_SHEET_NAME: 'Leads & Discovery Calls', APPS_SCRIPT_SECRET: 'test-only-signing-secret-at-least-32-characters', CAPTURE_ENABLED: 'true', EVENTS_ENABLED: 'true' };
  function createLock() {
    let held = false;
    return { waitLock() { if (locked) throw new Error('busy'); locked = held = true; }, tryLock() { if (locked) return false; locked = held = true; return true; }, releaseLock() { if (held) locked = false; held = false; }, hasLock: () => held };
  }
  const lock = createLock();
  const context = vm.createContext({
    console, Intl, Date,
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => props[key] || null, setProperty: (key, value) => { props[key] = value; } }) },
    SpreadsheetApp: { openById: () => book, flush() {} },
    LockService: { getScriptLock: createLock },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'authorized@example.invalid' }) },
    GmailApp: { getAliases: () => [], sendEmail: (...args) => { sent.push(args); if (props.failMail) throw new Error('Simulated uncertain delivery'); } },
    Utilities: { getUuid: randomUUID, DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (algorithm, text) => [...createHash('sha256').update(text).digest()],
      computeHmacSha256Signature: (text, secret) => [...createHmac('sha256', secret).update(text).digest()],
      formatDate: (date, timeZone) => new Intl.DateTimeFormat('en-CA', { timeZone }).format(date)
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ text, setMimeType() { return this; } }) }
  });
  const source = fs.readFileSync('shared/core.cjs', 'utf8') + '\n' + fs.readFileSync('apps-script/SmartLearn.gs', 'utf8');
  vm.runInContext(source, context);
  context.initializeSmartLearn();
  function post(data, mutate = value => value) {
    const timestamp = Date.now(), raw = JSON.stringify(data);
    const signature = createHmac('sha256', props.APPS_SCRIPT_SECRET).update(`${timestamp}.${raw}`).digest('hex');
    return JSON.parse(context.doPost({ postData: { contents: JSON.stringify(mutate({ timestamp, data: raw, signature })) } }).text);
  }
  return { context, post, props, sheets, sent, writes, lock, restart: () => vm.runInContext(source, context) };
}
module.exports = { lead, scriptHarness, headers };
