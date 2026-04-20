import React, { useState } from "react";
import { Box, Page, Text, Button } from "zmp-ui";

// Debug version - test without imports first
function HomePage() {
  console.log('HomePage component rendering...');
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  console.log('activeDemo state:', activeDemo);

  // Test basic rendering first
  return (
    <Page className="flex flex-col items-center justify-center p-4 bg-gray-50">
      <Box className="w-full max-w-md space-y-4">
        <Text.Title size="xLarge" className="text-center mb-6">
          🌾 DEBUG: Zalo Mini App - Nông nghiệp
        </Text.Title>
        
        <Text className="text-center text-gray-600 mb-4">
          If you see this, basic rendering works!
        </Text>

        <Box className="mt-8 p-4 bg-white rounded-lg shadow">
          <Text.Title size="small" className="mb-4">
            📱 Test Buttons
          </Text.Title>
          
          <Button
            fullWidth
            onClick={() => {
              console.log('Button clicked!');
              alert('Button works!');
            }}
            className="mb-2"
          >
            Test Button - Click Me
          </Button>
        </Box>

        <Box className="mt-4 p-4 bg-white rounded-lg shadow">
          <Text.Title size="small" className="mb-2">
            📝 Debug Info:
          </Text.Title>
          <Text size="small" className="text-gray-600">
            Active Demo: {activeDemo || 'none'}
          </Text>
          <Text size="small" className="text-gray-600">
            Timestamp: {new Date().toLocaleTimeString()}
          </Text>
        </Box>
      </Box>
    </Page>
  );
}

export default HomePage;
