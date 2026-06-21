const findingForm = document.getElementById('finding-form');
const findingsTableContainer = document.getElementById('findingsTableContainer');
const exportJsonButton = document.getElementById('exportJson');
const downloadJsonButton = document.getElementById('downloadJson');
const downloadMarkdownButton = document.getElementById('downloadMarkdown');
const copySummaryButton = document.getElementById('copySummary');
const clearAllButton = document.getElementById('clearAll');
const exportOutput = document.getElementById('exportOutput');
const reportPreview = document.getElementById('reportPreview');
const metricFindings = document.getElementById('metric-findings');
const metricPhases = document.getElementById('metric-phases');
const metricStatus = document.getElementById('metric-status');
const headerExportButton = document.querySelector('.primary-button');

let findings = [];
let savedState = null;

// Logo panel toggle (show only when logo is clicked/touched)
const logoBrand = document.querySelector('.logo-brand');
const logoPanel = document.getElementById('logoPanel');

if (logoBrand && logoPanel) {
  logoBrand.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = logoPanel.classList.toggle('open');
    logoPanel.setAttribute('aria-hidden', (!isOpen).toString());
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!logoPanel.classList.contains('open')) return;
    if (!logoPanel.contains(e.target) && !logoBrand.contains(e.target)) {
      logoPanel.classList.remove('open');
      logoPanel.setAttribute('aria-hidden', 'true');
    }
  });

  // Close with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoPanel.classList.contains('open')) {
      logoPanel.classList.remove('open');
      logoPanel.setAttribute('aria-hidden', 'true');
    }
  });
}

// How-to button inside logo panel: scroll to the guide
const logoHowToBtn = document.getElementById('logoHowTo');
if (logoHowToBtn) {
  logoHowToBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const guide = document.getElementById('how-to-use');
    if (guide) guide.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (logoPanel) {
      logoPanel.classList.remove('open');
      logoPanel.setAttribute('aria-hidden', 'true');
    }
  });
}

function renderFindings() {
  if (!findings.length) {
    findingsTableContainer.innerHTML = '<p class="empty">No findings added yet.</p>';
  } else {
    const rows = findings.map((finding, index) => {
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${finding.title}</td>
        <td>${finding.location}</td>
        <td>${finding.severity}</td>
        <td>${finding.notes}</td>
        <td><button type="button" class="small-button" data-index="${index}">Remove</button></td>
      </tr>
    `;
    }).join('');

    findingsTableContainer.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Location</th>
            <th>Severity</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  updateMetrics();
}

function getReportData() {
  return {
    authorization: document.getElementById('authSigned').value,
    scope: document.getElementById('scope').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    tester: document.getElementById('tester').value,
    dataHandling: document.getElementById('dataHandling').value,
    riskRating: document.getElementById('riskRating').value,
    execSummary: document.getElementById('execSummary').value,
    techSummary: document.getElementById('techSummary').value,
    phases: {
      planning: document.getElementById('phase1').checked,
      reconnaissance: document.getElementById('phase2').checked,
      discovery: document.getElementById('phase3').checked,
      crawling: document.getElementById('phase4').checked,
      vulnerability: document.getElementById('phase5').checked,
      exploitation: document.getElementById('phase6').checked,
      postExploitation: document.getElementById('phase7').checked,
      remediation: document.getElementById('phase8').checked
    },
    findings,
    evidenceNotes: document.getElementById('evidenceNotes').value,
    generatedAt: new Date().toISOString()
  };
}

function saveData() {
  const state = {
    findings,
    authorization: document.getElementById('authSigned').value,
    scope: document.getElementById('scope').value,
    startDate: document.getElementById('startDate').value,
    endDate: document.getElementById('endDate').value,
    tester: document.getElementById('tester').value,
    dataHandling: document.getElementById('dataHandling').value,
    riskRating: document.getElementById('riskRating').value,
    execSummary: document.getElementById('execSummary').value,
    techSummary: document.getElementById('techSummary').value,
    evidenceNotes: document.getElementById('evidenceNotes').value,
    phases: {
      planning: document.getElementById('phase1').checked,
      reconnaissance: document.getElementById('phase2').checked,
      discovery: document.getElementById('phase3').checked,
      crawling: document.getElementById('phase4').checked,
      vulnerability: document.getElementById('phase5').checked,
      exploitation: document.getElementById('phase6').checked,
      postExploitation: document.getElementById('phase7').checked,
      remediation: document.getElementById('phase8').checked
    }
  };
  window.localStorage.setItem('cyethPentestState', JSON.stringify(state));
}

function loadState() {
  const raw = window.localStorage.getItem('cyethPentestState');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to load saved state:', error);
    return null;
  }
}

function applySavedState(state) {
  if (!state) {
    return;
  }

  findings = Array.isArray(state.findings) ? state.findings : [];
  document.getElementById('authSigned').value = state.authorization || '';
  document.getElementById('scope').value = state.scope || '';
  document.getElementById('startDate').value = state.startDate || '';
  document.getElementById('endDate').value = state.endDate || '';
  document.getElementById('tester').value = state.tester || '';
  document.getElementById('dataHandling').value = state.dataHandling || '';
  document.getElementById('riskRating').value = state.riskRating || 'Low';
  document.getElementById('execSummary').value = state.execSummary || '';
  document.getElementById('techSummary').value = state.techSummary || '';
  document.getElementById('evidenceNotes').value = state.evidenceNotes || '';

  if (state.phases) {
    document.getElementById('phase1').checked = !!state.phases.planning;
    document.getElementById('phase2').checked = !!state.phases.reconnaissance;
    document.getElementById('phase3').checked = !!state.phases.discovery;
    document.getElementById('phase4').checked = !!state.phases.crawling;
    document.getElementById('phase5').checked = !!state.phases.vulnerability;
    document.getElementById('phase6').checked = !!state.phases.exploitation;
    document.getElementById('phase7').checked = !!state.phases.postExploitation;
    document.getElementById('phase8').checked = !!state.phases.remediation;
  }
}

function downloadData(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function countCompletedPhases(phases) {
  return Object.values(phases).filter(Boolean).length;
}

function updateMetrics() {
  const data = getReportData();
  metricFindings.textContent = findings.length;
  metricPhases.textContent = `${countCompletedPhases(data.phases)} / 8`;
  metricStatus.textContent = findings.length ? 'Draft' : 'Empty';
}

function generateMarkdownReport() {
  const data = getReportData();
  const findingsMd = data.findings.map((finding, index) => {
    return `### ${index + 1}. ${finding.title}\n
- Location: ${finding.location}\n- Severity: ${finding.severity}\n- Notes: ${finding.notes}\n`;
  }).join('\n');

  return `# Cyeth Hacking Pentest Report\n\n` +
    `**Authorization:** ${data.authorization}\n\n` +
    `**Scope:** ${data.scope}\n\n` +
    `**Tester:** ${data.tester}\n\n` +
    `**Risk rating:** ${data.riskRating}\n\n` +
    `## Executive Summary\n${data.execSummary || 'No executive summary provided.'}\n\n` +
    `## Technical Summary\n${data.techSummary || 'No technical summary provided.'}\n\n` +
    `**Test window:** ${data.startDate} to ${data.endDate}\n\n` +
    `**Data handling:** ${data.dataHandling}\n\n` +
    `## Phases completed\n` +
    `- Planning & scoping: ${data.phases.planning ? 'Yes' : 'No'}\n` +
    `- Reconnaissance: ${data.phases.reconnaissance ? 'Yes' : 'No'}\n` +
    `- Active discovery: ${data.phases.discovery ? 'Yes' : 'No'}\n` +
    `- Web discovery & crawling: ${data.phases.crawling ? 'Yes' : 'No'}\n` +
    `- Vulnerability identification: ${data.phases.vulnerability ? 'Yes' : 'No'}\n` +
    `- Controlled exploitation: ${data.phases.exploitation ? 'Yes' : 'No'}\n` +
    `- Post-exploitation analysis: ${data.phases.postExploitation ? 'Yes' : 'No'}\n` +
    `- Remediation verification: ${data.phases.remediation ? 'Yes' : 'No'}\n\n` +
    `## Findings\n\n${findingsMd || 'No findings recorded yet.'}\n\n` +
    `## Evidence notes\n${data.evidenceNotes || 'None provided.'}\n`;
}

function updatePreview(content) {
  reportPreview.innerHTML = `<pre>${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
}

function clearAllData() {
  findings = [];
  findingForm.reset();
  document.getElementById('evidenceNotes').value = '';
  document.getElementById('authSigned').value = '';
  document.getElementById('scope').value = '';
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('tester').value = '';
  document.getElementById('dataHandling').value = '';
  document.getElementById('phase1').checked = false;
  document.getElementById('phase2').checked = false;
  document.getElementById('phase3').checked = false;
  document.getElementById('phase4').checked = false;
  document.getElementById('phase5').checked = false;
  document.getElementById('phase6').checked = false;
  document.getElementById('phase7').checked = false;
  document.getElementById('phase8').checked = false;
  window.localStorage.removeItem('cyethPentestState');
  saveData();
  renderFindings();
  updatePreview('Cleared all report data.');
}

findingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('findingTitle').value.trim();
  const location = document.getElementById('findingLocation').value.trim();
  const severity = document.getElementById('findingSeverity').value;
  const notes = document.getElementById('findingNotes').value.trim();

  if (!title || !location) {
    return;
  }

  findings.push({ title, location, severity, notes });
  saveData();
  findingForm.reset();
  renderFindings();
});

findingsTableContainer.addEventListener('click', (event) => {
  if (!event.target.matches('.small-button')) {
    return;
  }

  const index = Number(event.target.dataset.index);
  if (!Number.isNaN(index)) {
    findings.splice(index, 1);
    saveData();
    renderFindings();
  }
});

exportJsonButton.addEventListener('click', () => {
  const data = getReportData();
  const json = JSON.stringify(data, null, 2);
  exportOutput.textContent = json;
  updatePreview(json);
});

downloadJsonButton.addEventListener('click', () => {
  const data = getReportData();
  const json = JSON.stringify(data, null, 2);
  downloadData('cyeth-pentest-report.json', json, 'application/json');
});

downloadMarkdownButton.addEventListener('click', () => {
  const markdown = generateMarkdownReport();
  downloadData('cyeth-pentest-report.md', markdown, 'text/markdown');
});

copySummaryButton.addEventListener('click', () => {
  const data = getReportData();
  const summary = [
    `Authorization: ${data.authorization}`,
    `Scope: ${data.scope}`,
    `Tester: ${data.tester}`,
    `Start: ${data.startDate}`,
    `End: ${data.endDate}`,
    `Findings count: ${data.findings.length}`,
    `Evidence notes: ${data.evidenceNotes}`
  ].join('\n');

  navigator.clipboard.writeText(summary).then(() => {
    alert('Report summary copied to clipboard');
  }).catch(() => {
    alert('Unable to copy summary.');
  });
});

clearAllButton.addEventListener('click', () => {
  if (confirm('Clear all saved data and findings?')) {
    clearAllData();
  }
});

headerExportButton.addEventListener('click', () => {
  exportJsonButton.click();
});


savedState = loadState();
applySavedState(savedState);
renderFindings();
updatePreview('Use the buttons above to generate a JSON or markdown report preview.');

const persistFields = document.querySelectorAll('input, textarea, select');
persistFields.forEach((field) => {
  field.addEventListener('change', saveData);
});
