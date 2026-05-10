/* Jeff's Roofing CRM — localStorage-backed lead management */

const CRM = (() => {
  const KEY = 'jeffs_roofing_leads';
  const PASS_KEY = 'jeffs_roofing_authed';
  const ADMIN_PASS = 'roofing2024'; // change this in production

  const getLeads = () => JSON.parse(localStorage.getItem(KEY) || '[]');
  const saveLeads = (leads) => localStorage.setItem(KEY, JSON.stringify(leads));

  const generateId = () => 'L' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase();

  const STATUS_COLORS = {
    'New':       { bg: '#dbeafe', text: '#1e40af' },
    'Contacted': { bg: '#fef3c7', text: '#92400e' },
    'Quoted':    { bg: '#ede9fe', text: '#5b21b6' },
    'Scheduled': { bg: '#d1fae5', text: '#065f46' },
    'Won':       { bg: '#d1fae5', text: '#065f46' },
    'Lost':      { bg: '#fee2e2', text: '#991b1b' },
    'On Hold':   { bg: '#f3f4f6', text: '#374151' },
  };

  const SERVICES = ['Roof Replacement','Storm/Hail Damage','Leak Repair','Gutters','Commercial','Maintenance','Inspection','Other'];
  const SOURCES  = ['Google Search','Google Ads','Referral','Neighbor','Facebook','Door Hanger','Yard Sign','Other'];

  function isAuthed() {
    return sessionStorage.getItem(PASS_KEY) === '1';
  }

  function login(pass) {
    if (pass === ADMIN_PASS) {
      sessionStorage.setItem(PASS_KEY, '1');
      return true;
    }
    return false;
  }

  function logout() {
    sessionStorage.removeItem(PASS_KEY);
    window.location.href = 'index.html';
  }

  function addLead(data) {
    const leads = getLeads();
    const lead = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'New',
      ...data
    };
    leads.unshift(lead);
    saveLeads(leads);
    return lead;
  }

  function updateLead(id, data) {
    const leads = getLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx === -1) return null;
    leads[idx] = { ...leads[idx], ...data, updatedAt: new Date().toISOString() };
    saveLeads(leads);
    return leads[idx];
  }

  function deleteLead(id) {
    const leads = getLeads().filter(l => l.id !== id);
    saveLeads(leads);
  }

  function getLead(id) {
    return getLeads().find(l => l.id === id) || null;
  }

  function getStats() {
    const leads = getLeads();
    const stats = { total: leads.length, new: 0, contacted: 0, quoted: 0, won: 0, lost: 0, revenue: 0 };
    leads.forEach(l => {
      if (l.status === 'New') stats.new++;
      else if (l.status === 'Contacted') stats.contacted++;
      else if (l.status === 'Quoted') stats.quoted++;
      else if (l.status === 'Won') { stats.won++; stats.revenue += parseFloat(l.jobValue || 0); }
      else if (l.status === 'Lost') stats.lost++;
    });
    return stats;
  }

  function exportCSV() {
    const leads = getLeads();
    const headers = ['ID','Name','Phone','Email','Address','Service','Source','Status','Job Value','Notes','Created','Updated'];
    const rows = leads.map(l => [
      l.id, l.name || '', l.phone || '', l.email || '', l.address || '',
      l.service || '', l.source || '', l.status || '', l.jobValue || '',
      (l.notes || '').replace(/,/g,'·'),
      new Date(l.createdAt).toLocaleDateString(),
      new Date(l.updatedAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
  }

  function statusBadge(status) {
    const c = STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151' };
    return `<span style="background:${c.bg};color:${c.text};padding:3px 10px;border-radius:12px;font-size:0.78rem;font-weight:700">${status}</span>`;
  }

  function seedDemoData() {
    if (getLeads().length > 0) return;
    const demos = [
      { name:'Karen Mitchell', phone:'(720) 555-1234', email:'karen.m@email.com', address:'4521 Oak Ave, Highlands Ranch, CO', service:'Roof Replacement', source:'Google Search', status:'Quoted', jobValue:'12500', notes:'Large 2-story home, needs full tear-off. GAF Timberline preferred.', createdAt: new Date(Date.now()-5*86400000).toISOString() },
      { name:'James Thornton', phone:'(303) 555-8822', email:'jthornton@gmail.com', address:'892 Birch St, Parker, CO', service:'Storm/Hail Damage', source:'Referral', status:'Won', jobValue:'9800', notes:'Insurance claim filed with State Farm. Job completed.', createdAt: new Date(Date.now()-12*86400000).toISOString() },
      { name:'Priya Patel', phone:'(720) 555-3301', email:'priya.p@work.com', address:'1105 Maple Dr, Lakewood, CO', service:'Leak Repair', source:'Google Ads', status:'Contacted', jobValue:'', notes:'Active leak in master bedroom ceiling. Contacted to schedule inspection.', createdAt: new Date(Date.now()-2*86400000).toISOString() },
      { name:'Robert Chen', phone:'(303) 555-7744', email:'rob.chen@email.com', address:'2240 Pine Rd, Aurora, CO', service:'Gutters', source:'Yard Sign', status:'New', jobValue:'', notes:'Wants seamless aluminum gutters, full house.', createdAt: new Date(Date.now()-1*86400000).toISOString() },
      { name:'Sandra Williams', phone:'(720) 555-6612', email:'swilliams@mail.com', address:'3317 Cedar Ln, Centennial, CO', service:'Maintenance', source:'Referral', status:'Scheduled', jobValue:'450', notes:'Annual inspection scheduled for next Tuesday.', createdAt: new Date(Date.now()-3*86400000).toISOString() },
      { name:'Metro Storage LLC', phone:'(303) 555-9900', email:'ops@metrostorage.com', address:'800 Commerce Blvd, Denver, CO', service:'Commercial', source:'Google Search', status:'Quoted', jobValue:'28000', notes:'30,000 sqft TPO flat roof. Getting multiple bids.', createdAt: new Date(Date.now()-8*86400000).toISOString() },
    ];
    const leads = demos.map((d,i) => ({
      id: 'L' + (Date.now() - i*1000).toString(36).toUpperCase(),
      updatedAt: d.createdAt,
      ...d
    }));
    saveLeads(leads);
  }

  return { getLeads, addLead, updateLead, deleteLead, getLead, getStats, exportCSV,
           isAuthed, login, logout, formatDate, statusBadge, SERVICES, SOURCES,
           STATUS_COLORS, generateId, seedDemoData };
})();
