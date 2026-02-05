import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Test individual components to isolate the crash
const testComponents = async () => {
  console.log('🧪 Starting Navigation Crash Test...');
  
  // Test 1: Test Logo component
  try {
    console.log('Testing Logo component...');
    const { Logo } = await import('@shared/components/ui/logo');
    const logoElement = React.createElement(Logo, { size: 'md' });
    console.log('✅ Logo component loaded successfully');
  } catch (error) {
    console.error('❌ Logo component failed:', error);
  }

  // Test 2: Test Wordmark component
  try {
    console.log('Testing Wordmark component...');
    const { Wordmark } = await import('@shared/components/ui/wordmark');
    const wordmarkElement = React.createElement(Wordmark, { size: 'md' });
    console.log('✅ Wordmark component loaded successfully');
  } catch (error) {
    console.error('❌ Wordmark component failed:', error);
  }

  // Test 3: Test Button component
  try {
    console.log('Testing Button component...');
    const { Button } = await import('@shared/components/ui/button');
    const buttonElement = React.createElement(Button, {}, 'Test Button');
    console.log('✅ Button component loaded successfully');
  } catch (error) {
    console.error('❌ Button component failed:', error);
  }

  // Test 4: Test useAccessibility hook
  try {
    console.log('Testing useAccessibility hook...');
    const { useAccessibility } = await import('@shared/hooks/useAccessibility');
    console.log('✅ useAccessibility hook loaded successfully');
  } catch (error) {
    console.error('❌ useAccessibility hook failed:', error);
  }

  // Test 5: Test cn utility
  try {
    console.log('Testing cn utility...');
    const { cn } = await import('@shared/lib/utils');
    const result = cn('test', 'class');
    console.log('✅ cn utility loaded successfully, result:', result);
  } catch (error) {
    console.error('❌ cn utility failed:', error);
  }

  // Test 6: Test MobileNav component
  try {
    console.log('Testing MobileNav component...');
    const { MobileNav } = await import('../MobileNav');
    const mobileNavElement = React.createElement(MobileNav);
    console.log('✅ MobileNav component loaded successfully');
  } catch (error) {
    console.error('❌ MobileNav component failed:', error);
  }

  // Test 7: Test Navigation component
  try {
    console.log('Testing Navigation component...');
    const { Navigation } = await import('../../layout/Navigation');
    const navigationElement = React.createElement(Navigation);
    console.log('✅ Navigation component loaded successfully');
  } catch (error) {
    console.error('❌ Navigation component failed:', error);
  }

  // Test 8: Test full render
  try {
    console.log('Testing full render...');
    const { Navigation } = await import('../../layout/Navigation');
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    const root = createRoot(container);
    const app = React.createElement(
      BrowserRouter,
      {},
      React.createElement(Navigation)
    );
    
    root.render(app);
    console.log('✅ Full render successful');
    
    // Cleanup
    setTimeout(() => {
      root.unmount();
      document.body.removeChild(container);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Full render failed:', error);
  }

  console.log('🏁 Navigation Crash Test completed');
};

// Export for use in tests or manual execution
export { testComponents };

// Auto-run if this file is imported directly
if (typeof window !== 'undefined') {
  testComponents();
}