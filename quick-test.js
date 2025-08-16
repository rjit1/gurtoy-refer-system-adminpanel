// Quick test to verify applications are working
const http = require('http')

async function testEndpoint(url, name) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      console.log(`✅ ${name}: Status ${response.statusCode}`)
      resolve(true)
    })
    
    request.on('error', (error) => {
      console.log(`❌ ${name}: ${error.message}`)
      resolve(false)
    })
    
    request.setTimeout(5000, () => {
      console.log(`⏰ ${name}: Timeout`)
      request.destroy()
      resolve(false)
    })
  })
}

async function runQuickTests() {
  console.log('🚀 Quick Application Test')
  console.log('=' .repeat(40))
  
  const tests = [
    { url: 'http://localhost:3000', name: 'Main Website' },
    { url: 'http://localhost:3001', name: 'Admin Panel' },
    { url: 'http://localhost:3000/login', name: 'Main Login' },
    { url: 'http://localhost:3001/login', name: 'Admin Login' }
  ]
  
  let passed = 0
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.name)
    if (result) passed++
  }
  
  console.log('=' .repeat(40))
  console.log(`Results: ${passed}/${tests.length} endpoints accessible`)
  
  if (passed === tests.length) {
    console.log('🎉 All applications are running correctly!')
  } else {
    console.log('⚠️  Some applications may not be running. Please check:')
    console.log('   • npm run dev in E:/gurtoy-refer')
    console.log('   • npm run dev in E:/gurtoy-refer/admin-panel')
  }
}

runQuickTests()
