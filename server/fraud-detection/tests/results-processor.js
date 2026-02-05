module.exports = (results) => {
  // Custom test results processor
  const summary = {
    totalTests: results.numTotalTests,
    passedTests: results.numPassedTests,
    failedTests: results.numFailedTests,
    pendingTests: results.numPendingTests,
    totalTime: results.testResults.reduce((acc, result) => acc + result.perfStats.end - result.perfStats.start, 0),
    success: results.success
  };

  // Log summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   Total: ${summary.totalTests}`);
  console.log(`   Passed: ${summary.passedTests} ✅`);
  console.log(`   Failed: ${summary.failedTests} ${summary.failedTests > 0 ? '❌' : ''}`);
  console.log(`   Pending: ${summary.pendingTests}`);
  console.log(`   Duration: ${summary.totalTime}ms`);
  console.log(`   Success: ${summary.success ? 'Yes ✅' : 'No ❌'}`);

  // Performance analysis
  const slowTests = results.testResults
    .filter(result => (result.perfStats.end - result.perfStats.start) > 5000)
    .map(result => ({
      file: result.testFilePath.split('/').pop(),
      duration: result.perfStats.end - result.perfStats.start
    }));

  if (slowTests.length > 0) {
    console.log('\n⚠️  Slow Tests (>5s):');
    slowTests.forEach(test => {
      console.log(`   ${test.file}: ${test.duration}ms`);
    });
  }

  // Coverage summary (if available)
  if (results.coverageMap) {
    const coverage = results.coverageMap.getCoverageSummary();
    console.log('\n📈 Coverage Summary:');
    console.log(`   Lines: ${coverage.lines.pct}%`);
    console.log(`   Functions: ${coverage.functions.pct}%`);
    console.log(`   Branches: ${coverage.branches.pct}%`);
    console.log(`   Statements: ${coverage.statements.pct}%`);
  }

  return results;
};