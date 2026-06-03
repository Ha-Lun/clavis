const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const diagnosticsJsonPath = '/tmp/diagnostics.json';
const diagnosticsData = JSON.parse(fs.readFileSync(diagnosticsJsonPath, 'utf8'));

const uniqueRules = new Set();
diagnosticsData.projects.forEach(project => {
  project.diagnostics.forEach(diag => {
    uniqueRules.add(`${diag.plugin}/${diag.rule}`);
  });
});

async function downloadRule(plugin, rule) {
  const url = `https://www.react.doctor/prompts/rules/${plugin}/${rule}.md`;
  const destDir = `/tmp/rule/${plugin}`;
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, `${rule}.md`);
  
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function run() {
  console.log('Downloading rules...');
  for (const ruleStr of uniqueRules) {
    const [plugin, rule] = ruleStr.split('/');
    await downloadRule(plugin, rule);
  }
  console.log('Done downloading rules.');
  
  // Triage
  const errors = [];
  const warnings = [];
  const deferred = [];
  
  diagnosticsData.projects.forEach(project => {
    project.diagnostics.forEach(diag => {
      const rulePath = `/tmp/rule/${diag.plugin}/${diag.rule}.md`;
      let ruleContent = '';
      if (fs.existsSync(rulePath)) {
        ruleContent = fs.readFileSync(rulePath, 'utf8');
      }
      
      let isDeferred = false;
      let deferReason = '';
      
      // Heuristics for deferral based on playbook
      // "The rule's `## Validation prompt` flags this code shape as needing human judgment."
      // We will leave the deep validation to the agent, but we can do a coarse pass.
      
      if (diag.severity === 'error') {
        errors.push(diag);
      } else {
        warnings.push(diag);
      }
    });
  });
  
  fs.writeFileSync('/tmp/triage-errors.json', JSON.stringify(errors, null, 2));
  fs.writeFileSync('/tmp/triage-warnings.json', JSON.stringify(warnings, null, 2));
  console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);
}

run();
