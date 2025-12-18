const DatabaseConnectionTest = require('./database.test');
const ConfigValidationTest = require('./config.test');
const AuthSecurityTest = require('./auth.test');
const LoggerPerformanceTest = require('./logger.test');
const BangladeshFeaturesTest = require('./bangladesh-features.test');
const ErrorHandlingTest = require('./error-handling.test');
const ServiceInitializationTest = require('./service-initialization.test');
const HealthCheckTest = require('./health-check.test');
const GracefulShutdownTest = require('./graceful-shutdown.test');

// Comprehensive Test Runner for All Service Layer Fixes
class ComprehensiveTestRunner {
  constructor() {
    this.testSuites = [
      { name: 'Database Connection Management', class: DatabaseConnectionTest, critical: true },
      { name: 'Configuration Validation', class: ConfigValidationTest, critical: true },
      { name: 'Authentication Security', class: AuthSecurityTest, critical: true },
      { name: 'Logger Performance', class: LoggerPerformanceTest, critical: true },
      { name: 'Bangladesh-Specific Features', class: BangladeshFeaturesTest, critical: true },
      { name: 'Error Handling & Graceful Degradation', class: ErrorHandlingTest, critical: true },
      { name: 'Service Initialization', class: ServiceInitializationTest, critical: true },
      { name: 'Health Check Endpoints', class: HealthCheckTest, critical: true },
      { name: 'Graceful Shutdown Procedures', class: GracefulShutdownTest, critical: true }
    ];
    
    this.overallResults = {
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      suites: [],
      startTime: null,
      endTime: null,
      duration: null,
      successRate: 0,
      criticalFailures: 0,
      recommendations: []
    };
  }

  async runAllTests() {
    console.log('🚀 STARTING COMPREHENSIVE SERVICE LAYER TESTING');
    console.log('==================================================');
    console.log('Testing all implemented improvements for Smart Technologies Bangladesh B2C Website\n');
    
    this.overallResults.startTime = new Date();
    
    // Run each test suite
    for (const suite of this.testSuites) {
      console.log(`\n📋 Running ${suite.name} Tests...`);
      console.log('─'.repeat(50));
      
      try {
        const testInstance = new suite.class();
        const suiteResults = await testInstance.runAllTests();
        
        // Add suite results to overall results
        this.overallResults.suites.push({
          name: suite.name,
          critical: suite.critical,
          ...suiteResults,
          successRate: (suiteResults.passed / suiteResults.total) * 100
        });
        
        // Update overall counters
        this.overallResults.totalTests += suiteResults.total;
        this.overallResults.totalPassed += suiteResults.passed;
        this.overallResults.totalFailed += suiteResults.failed;
        
        // Track critical failures
        if (suite.critical && suiteResults.failed > 0) {
          this.overallResults.criticalFailures += suiteResults.failed;
        }
        
        console.log(`✅ ${suite.name} Tests Completed: ${suiteResults.passed}/${suiteResults.total} passed (${((suiteResults.passed / suiteResults.total) * 100).toFixed(1)}%)`);
        
      } catch (error) {
        console.error(`❌ ${suite.name} Tests Failed: ${error.message}`);
        
        // Add failed suite results
        this.overallResults.suites.push({
          name: suite.name,
          critical: suite.critical,
          total: 0,
          passed: 0,
          failed: 1,
          details: [{
            test: suite.name,
            status: 'FAILED',
            message: error.message
          }],
          successRate: 0
        });
        
        this.overallResults.totalTests += 1;
        this.overallResults.totalFailed += 1;
        
        if (suite.critical) {
          this.overallResults.criticalFailures += 1;
        }
      }
    }
    
    this.overallResults.endTime = new Date();
    this.overallResults.duration = this.overallResults.endTime - this.overallResults.startTime;
    this.overallResults.successRate = (this.overallResults.totalPassed / this.overallResults.totalTests) * 100;
    
    // Generate recommendations
    this.generateRecommendations();
    
    // Generate final report
    this.generateFinalReport();
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Analyze results and generate recommendations
    for (const suite of this.overallResults.suites) {
      if (suite.successRate < 100 && suite.critical) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Critical Failure',
          suite: suite.name,
          recommendation: `Address critical failures in ${suite.name} immediately as these impact system stability and security`,
          details: suite.details.filter(d => d.status === 'FAILED').map(d => d.message)
        });
      } else if (suite.successRate < 90) {
        recommendations.push({
          priority: 'MEDIUM',
          category: 'Performance Issue',
          suite: suite.name,
          recommendation: `Improve ${suite.name} test coverage and fix failing tests to enhance system reliability`,
          details: suite.details.filter(d => d.status === 'FAILED').map(d => d.message)
        });
      } else if (suite.successRate < 100) {
        recommendations.push({
          priority: 'LOW',
          category: 'Minor Issue',
          suite: suite.name,
          recommendation: `Review and fix remaining test failures in ${suite.name} for optimal performance`,
          details: suite.details.filter(d => d.status === 'FAILED').map(d => d.message)
        });
      }
    }
    
    // Add specific recommendations based on failure patterns
    const databaseSuite = this.overallResults.suites.find(s => s.name === 'Database Connection Management');
    const authSuite = this.overallResults.suites.find(s => s.name === 'Authentication Security');
    const loggerSuite = this.overallResults.suites.find(s => s.name === 'Logger Performance');
    
    if (databaseSuite && databaseSuite.failed > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database Reliability',
        suite: 'Database Connection Management',
        recommendation: 'Review database connection pooling and retry mechanisms to ensure high availability',
        details: ['Connection failures can lead to service downtime and poor user experience']
      });
    }
    
    if (authSuite && authSuite.failed > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security',
        suite: 'Authentication Security',
        recommendation: 'Address authentication security issues immediately to prevent unauthorized access',
        details: ['Security vulnerabilities can lead to data breaches and system compromise']
      });
    }
    
    if (loggerSuite && loggerSuite.failed > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Monitoring',
        suite: 'Logger Performance',
        recommendation: 'Optimize logger configuration for better performance and debugging capabilities',
        details: ['Poor logging performance can impact system monitoring and troubleshooting']
      });
    }
    
    this.overallResults.recommendations = recommendations;
  }

  generateFinalReport() {
    console.log('\n');
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('================================');
    console.log(`Test Duration: ${this.overallResults.duration}ms`);
    console.log(`Total Test Suites: ${this.testSuites.length}`);
    console.log(`Total Tests: ${this.overallResults.totalTests}`);
    console.log(`Total Passed: ${this.overallResults.totalPassed}`);
    console.log(`Total Failed: ${this.overallResults.totalFailed}`);
    console.log(`Overall Success Rate: ${this.overallResults.successRate.toFixed(2)}%`);
    console.log(`Critical Failures: ${this.overallResults.criticalFailures}`);
    
    // Suite summary
    console.log('\n📋 Test Suite Summary:');
    console.log('─'.repeat(50));
    for (const suite of this.overallResults.suites) {
      const status = suite.successRate === 100 ? '✅' : 
                   suite.successRate >= 90 ? '⚠️' : 
                   suite.successRate >= 70 ? '❌' : '💀';
      
      console.log(`${status} ${suite.name}:`);
      console.log(`   Tests: ${suite.passed}/${suite.total}`);
      console.log(`   Success Rate: ${suite.successRate.toFixed(1)}%`);
      console.log(`   Critical: ${suite.critical ? 'Yes' : 'No'}`);
      
      if (suite.failed > 0) {
        console.log(`   Failed Tests: ${suite.failed}`);
        console.log('   Failure Details:');
        suite.details.filter(d => d.status === 'FAILED').forEach((detail, index) => {
          console.log(`     ${index + 1}. ${detail.test}: ${detail.message}`);
        });
      }
      console.log('');
    }
    
    // Recommendations
    if (this.overallResults.recommendations.length > 0) {
      console.log('🔧 Recommendations:');
      console.log('─'.repeat(50));
      
      const highPriority = this.overallResults.recommendations.filter(r => r.priority === 'HIGH');
      const mediumPriority = this.overallResults.recommendations.filter(r => r.priority === 'MEDIUM');
      const lowPriority = this.overallResults.recommendations.filter(r => r.priority === 'LOW');
      
      if (highPriority.length > 0) {
        console.log('🚨 HIGH PRIORITY:');
        highPriority.forEach(rec => {
          console.log(`   • ${rec.recommendation}`);
          console.log(`     Category: ${rec.category}`);
          console.log(`     Suite: ${rec.suite}`);
        });
      }
      
      if (mediumPriority.length > 0) {
        console.log('⚠️ MEDIUM PRIORITY:');
        mediumPriority.forEach(rec => {
          console.log(`   • ${rec.recommendation}`);
          console.log(`     Category: ${rec.category}`);
          console.log(`     Suite: ${rec.suite}`);
        });
      }
      
      if (lowPriority.length > 0) {
        console.log('💡 LOW PRIORITY:');
        lowPriority.forEach(rec => {
          console.log(`   • ${rec.recommendation}`);
          console.log(`     Category: ${rec.category}`);
          console.log(`     Suite: ${rec.suite}`);
        });
      }
    }
    
    // Final assessment
    console.log('\n🎯 Final Assessment:');
    console.log('─'.repeat(50));
    
    if (this.overallResults.successRate >= 95) {
      console.log('✅ EXCELLENT: All service layer fixes are working optimally');
      console.log('   System is ready for production deployment');
    } else if (this.overallResults.successRate >= 90) {
      console.log('✅ GOOD: Most service layer fixes are working well');
      console.log('   Minor issues exist but system is stable');
    } else if (this.overallResults.successRate >= 80) {
      console.log('⚠️ FAIR: Some service layer fixes need attention');
      console.log('   System has several issues that should be addressed');
    } else if (this.overallResults.successRate >= 70) {
      console.log('❌ POOR: Many service layer fixes are failing');
      console.log('   System requires significant improvements before production');
    } else {
      console.log('💀 CRITICAL: Most service layer fixes are failing');
      console.log('   System is not ready for production deployment');
    }
    
    if (this.overallResults.criticalFailures > 0) {
      console.log(`🚨 CRITICAL ISSUES: ${this.overallResults.criticalFailures} critical test failures detected`);
      console.log('   Immediate action required for system stability and security');
    }
    
    // Production readiness
    const isProductionReady = this.overallResults.successRate >= 90 && this.overallResults.criticalFailures === 0;
    console.log(`\n🏭 Production Readiness: ${isProductionReady ? 'READY' : 'NOT READY'}`);
    
    if (isProductionReady) {
      console.log('✅ All critical systems tested and validated');
      console.log('   Bangladesh-specific features working correctly');
      console.log('   Security measures properly implemented');
      console.log('   Error handling and graceful degradation functional');
      console.log('   Performance optimizations effective');
    } else {
      console.log('❌ System requires additional work before production deployment');
      console.log('   Address critical failures and improve test coverage');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('END OF COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
  }

  generateJSONReport() {
    const report = {
      summary: {
        testDuration: this.overallResults.duration,
        totalSuites: this.testSuites.length,
        totalTests: this.overallResults.totalTests,
        totalPassed: this.overallResults.totalPassed,
        totalFailed: this.overallResults.totalFailed,
        successRate: this.overallResults.successRate,
        criticalFailures: this.overallResults.criticalFailures,
        productionReady: this.overallResults.successRate >= 90 && this.overallResults.criticalFailures === 0,
        timestamp: new Date().toISOString()
      },
      suites: this.overallResults.suites,
      recommendations: this.overallResults.recommendations
    };
    
    return report;
  }

  saveReportToFile() {
    const fs = require('fs');
    const path = require('path');
    
    const report = this.generateJSONReport();
    const reportPath = path.join(__dirname, 'test-report.json');
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed test report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`❌ Failed to save report: ${error.message}`);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  
  runner.runAllTests()
    .then(() => {
      runner.saveReportToFile();
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;