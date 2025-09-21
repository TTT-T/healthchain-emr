const { getAllDoctors } = require('./dist/controllers/doctorsController.js');
const { databaseManager } = require('./dist/database/connection.js');

async function debugController() {
  try {
    console.log('🔍 Initializing database...');
    await databaseManager.initialize();
    console.log('✅ Database initialized');
    
    // Mock request and response objects
    const mockReq = {
      query: {
        page: 1,
        limit: 100,
        is_available: true
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log('📡 Response Status:', code);
          if (code === 200) {
            console.log('📡 Response Data Count:', data.data?.length || 0);
            console.log('📡 Sample Doctor:', data.data?.[0]);
          } else {
            console.log('📡 Error Response:', data);
          }
          return { status: code, data };
        }
      })
    };
    
    console.log('🔍 Testing getAllDoctors controller...');
    await getAllDoctors(mockReq, mockRes);
    
    console.log('✅ Controller test completed');
  } catch (error) {
    console.error('❌ Controller test failed:', error.message);
    console.error('❌ Error stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

debugController();
