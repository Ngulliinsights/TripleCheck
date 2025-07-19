import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Upload, User, Database, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function TestFunctionalityPage() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const updateTestResult = (name: string, status: 'success' | 'error', message: string, details?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.details = details;
        return [...prev];
      } else {
        return [...prev, { name, status, message, details }];
      }
    });
  };

  const testHealthCheck = async () => {
    try {
      const response = await apiRequest('GET', '/api/health');
      updateTestResult('Health Check', 'success', 'Server is healthy', response);
    } catch (error) {
      updateTestResult('Health Check', 'error', `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testAuthentication = async () => {
    const testCredentials = [
      { username: 'demo_user', password: 'password123' },
      { username: 'test_user', password: 'test123' },
      { username: 'admin', password: 'admin123' }
    ];

    for (const creds of testCredentials) {
      try {
        const response = await apiRequest('POST', '/api/auth/login', creds);
        if (response.success) {
          updateTestResult(`Login: ${creds.username}`, 'success', 'Login successful', response.data);
          
          // Test session validation
          try {
            const meResponse = await apiRequest('GET', '/api/auth/me');
            updateTestResult(`Session: ${creds.username}`, 'success', 'Session valid', meResponse.data);
          } catch (sessionError) {
            updateTestResult(`Session: ${creds.username}`, 'error', `Session validation failed: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}`);
          }
        } else {
          updateTestResult(`Login: ${creds.username}`, 'error', response.message || 'Login failed');
        }
      } catch (error) {
        updateTestResult(`Login: ${creds.username}`, 'error', `Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const testPropertyRetrieval = async () => {
    try {
      const response = await apiRequest('GET', '/api/properties');
      if (response.success) {
        updateTestResult('Property Retrieval', 'success', `Retrieved ${response.data.totalCount} properties`, response.data);
      } else {
        updateTestResult('Property Retrieval', 'error', response.message || 'Property retrieval failed');
      }
    } catch (error) {
      updateTestResult('Property Retrieval', 'error', `Property retrieval error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDocumentUpload = async () => {
    if (!selectedFile) {
      updateTestResult('Document Upload', 'error', 'No file selected for upload');
      return;
    }

    try {
      // First ensure we're logged in
      await apiRequest('POST', '/api/auth/login', { username: 'demo_user', password: 'password123' });
      
      const formData = new FormData();
      formData.append('documents', selectedFile);
      formData.append('documentTypes', 'Property Document');

      const response = await fetch('/api/properties/20004/verify-documents', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        updateTestResult('Document Upload', 'success', 'Document uploaded and verified successfully', result.result);
      } else {
        updateTestResult('Document Upload', 'error', result.error || result.message || 'Upload failed', result);
      }
    } catch (error) {
      updateTestResult('Document Upload', 'error', `Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    toast({
      title: "Running Tests",
      description: "Testing all functionality...",
    });

    await testHealthCheck();
    await testAuthentication();
    await testPropertyRetrieval();
    if (selectedFile) {
      await testDocumentUpload();
    }

    setIsRunning(false);
    
    const successCount = testResults.filter(r => r.status === 'success').length;
    const totalCount = testResults.length;
    
    toast({
      title: "Tests Completed",
      description: `${successCount}/${totalCount} tests passed`,
      variant: successCount === totalCount ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Functionality Test Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive testing of authentication, document upload, and API functionality
          </p>
        </div>

        {/* Test Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Test Credentials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">Demo User</div>
                <div className="text-sm text-gray-600">Username: demo_user</div>
                <div className="text-sm text-gray-600">Password: password123</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">Test User</div>
                <div className="text-sm text-gray-600">Username: test_user</div>
                <div className="text-sm text-gray-600">Password: test123</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">Admin User</div>
                <div className="text-sm text-gray-600">Username: admin</div>
                <div className="text-sm text-gray-600">Password: admin123</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Document Upload Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-file">Select a test file to upload</Label>
                <Input
                  id="test-file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                />
              </div>
              {selectedFile && (
                <div className="text-sm text-gray-600">
                  Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Button onClick={runAllTests} disabled={isRunning} size="lg">
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button onClick={testHealthCheck} variant="outline" disabled={isRunning}>
                <Database className="w-4 h-4 mr-2" />
                Test Health
              </Button>
              <Button onClick={testAuthentication} variant="outline" disabled={isRunning}>
                <User className="w-4 h-4 mr-2" />
                Test Auth
              </Button>
              <Button onClick={testDocumentUpload} variant="outline" disabled={isRunning || !selectedFile}>
                <Shield className="w-4 h-4 mr-2" />
                Test Upload
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.name}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                      {result.details && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}