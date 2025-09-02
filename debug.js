// Debug script to check localStorage values affecting table display
// Run this in browser console to diagnose the 3-row issue

console.log('🔍 Pipeline Dashboard Debug Info');
console.log('================================');

// Check table display settings
const tablePageSize = localStorage.getItem('ui:tablePageSize');
const searchTerm = localStorage.getItem('ui:search');
const sortKey = localStorage.getItem('ui:sortKey');
const sortOrder = localStorage.getItem('ui:sortOrder');

console.log('📊 Table Display Settings:');
console.log('  Page Size:', tablePageSize || 'default (50)');
console.log('  Search Term:', searchTerm || 'none');
console.log('  Sort Key:', sortKey || 'default (start_utc)');
console.log('  Sort Order:', sortOrder || 'default (desc)');

// Check API parameters
const apiLimit = localStorage.getItem('api:limit');
const apiOffset = localStorage.getItem('api:offset');
const apiAllData = localStorage.getItem('api:allData');

console.log('\n🌐 API Parameters:');
console.log('  Limit:', apiLimit || 'default (10000)');
console.log('  Offset:', apiOffset || 'default (0)');
console.log('  All Data:', apiAllData || 'default (true)');

// Check environment
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const apiEndpoint = import.meta.env.VITE_API_ENDPOINT_PATH;

console.log('\n⚙️ Environment:');
console.log('  API Base URL:', apiBaseUrl || '/pipeline-service');
console.log('  API Endpoint:', apiEndpoint || '/get_pipeline_info?limit=10000&offset=0&all_data=true');

// Instructions
console.log('\n💡 If you see unexpected values above, try:');
console.log('  localStorage.clear(); // Clear all settings');
console.log('  location.reload(); // Reload the page');

// Check if we're in the right environment
console.log('\n📍 Current URL:', window.location.href);
console.log('📍 Expected API URL should be similar to:');
console.log('  ', (apiBaseUrl || window.location.origin + '/pipeline-service') + (apiEndpoint || '/get_pipeline_info?limit=10000&offset=0&all_data=true'));