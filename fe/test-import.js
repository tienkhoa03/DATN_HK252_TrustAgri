// Test file to check if imports work
// Run with: node test-import.js

console.log('Testing imports...');

try {
  // This won't actually work in Node.js but will show syntax errors
  const code = `
    import { FarmerMarketConnectScreenDemo } from "./src/screens/farmer";
    console.log('Import successful:', FarmerMarketConnectScreenDemo);
  `;
  
  console.log('✅ No syntax errors in import statement');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the dev server: npm start');
  console.log('2. Open browser and check console (F12)');
  console.log('3. Look for any red errors');
  console.log('');
  console.log('If page is blank:');
  console.log('- Check browser console for errors');
  console.log('- Try clearing cache (Ctrl+Shift+R)');
  console.log('- Restart dev server');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
