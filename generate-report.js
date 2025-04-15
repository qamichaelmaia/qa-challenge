const reporter = require('k6-html-reporter');
const options = {
  jsonFile: 'results.json',
  output: 'report.html',
};

reporter.generateSummaryReport(options);
