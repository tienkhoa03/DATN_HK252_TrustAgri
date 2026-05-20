import React, { useState } from "react";
import { Box, Page, Text, Button } from "zmp-ui";

// STEP 1: Test without any farmer imports
// If this works, the issue is with farmer imports

// Uncomment these one by one to find which import fails:
// import { FarmerDashboardScreenDemo } from "../screens/farmer";
// import { FarmerProcessScreenDemo } from "../screens/farmer";
// import { FarmerMarketConnectScreenDemo } from "../screens/farmer";

function HomePage() {
  console.log('🟢 HomePage rendering - Step by step test');
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  console.log('🟢 State initialized:', activeDemo);

  return (
    <Page className="flex flex-col items-center justify-center p-4 bg-gray-50">
      <Box className="w-full max-w-md space-y-4">
        <Text.Title size="xLarge" className="text-center mb-6">
          🌾 STEP-BY-STEP TEST
        </Text.Title>
        
        <Text className="text-center text-gray-600 mb-4">
          ✅ If you see this, basic rendering works!
        </Text>

        <Box className="mt-8 p-4 bg-white rounded-lg shadow">
          <Text.Title size="small" className="mb-4">
            📱 Test Status
          </Text.Title>
          
          <div className="space-y-2">
            <Text size="small">✅ React: Working</Text>
            <Text size="small">✅ zmp-ui: Working</Text>
            <Text size="small">✅ State: Working</Text>
            <Text size="small">⏳ Farmer imports: Not tested yet</Text>
          </div>

          <div className="mt-4">
            <Text.Title size="small" className="mb-2">
              Next Steps:
            </Text.Title>
            <Text size="small" className="text-gray-600">
              1. If you see this page, basic setup works
              <br />
              2. Check console for any errors
              <br />
              3. Uncomment imports one by one in code
              <br />
              4. Find which import causes the issue
            </Text>
          </div>

          <Button
            fullWidth
            onClick={() => {
              console.log('🟢 Button clicked!');
              alert('Button works! Check console for logs.');
            }}
            className="mt-4"
          >
            Test Button
          </Button>
        </Box>

        <Box className="mt-4 p-4 bg-white rounded-lg shadow">
          <Text.Title size="small" className="mb-2">
            📝 Console Output:
          </Text.Title>
          <Text size="small" className="text-gray-600">
            Open DevTools (F12) → Console tab
            <br />
            Look for messages starting with 🟢
          </Text>
        </Box>
      </Box>
    </Page>
  );
}

export default HomePage;
