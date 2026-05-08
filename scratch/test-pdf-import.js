async function run() {
  const imported = await import('pdf-parse');
  console.log("imported:", imported);
  console.log("imported.default:", imported.default);
  
  const req = require('pdf-parse');
  console.log("req:", typeof req);
}
run();
