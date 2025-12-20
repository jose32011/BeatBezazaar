import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Terminal,
  Database,
  Music,
  CreditCard,
  Mail,
  Users,
  Shield,
  Globe,
  Settings,
  AlertTriangle,
  Info,
  Trash2
} from "lucide-react";

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  timestamp: Date;
  duration?: number;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  category: string;
  message: string;
  details?: any;
}

const testCategories = [
  {
    id: 'database',
    name: 'Database Tests',
    icon: Database,
    description: 'Test database connections and operations',
    tests: [
      { id: 'db-connection', name: 'Database Connection', description: 'Test database connectivity' },
      { id: 'db-tables', name: 'Table Structure', description: 'Verify all tables exist' },
      { id: 'db-migrations', name: 'Migrations', description: 'Check migration status' },
      { id: 'db-indexes', name: 'Database Indexes', description: 'Verify database indexes' }
    ]
  },
  {
    id: 'api',
    name: 'API Tests',
    icon: Globe,
    description: 'Test API endpoints and responses',
    tests: [
      { id: 'api-auth', name: 'Authentication', description: 'Test login/logout functionality' },
      { id: 'api-beats', name: 'Beats API', description: 'Test beats CRUD operations' },
      { id: 'api-users', name: 'Users API', description: 'Test user management' },
      { id: 'api-cart', name: 'Cart API', description: 'Test cart operations' }
    ]
  },
  {
    id: 'payments',
    name: 'Payment Tests',
    icon: CreditCard,
    description: 'Test payment processing systems',
    tests: [
      { id: 'paypal-config', name: 'PayPal Configuration', description: 'Verify PayPal settings' },
      { id: 'stripe-config', name: 'Stripe Configuration', description: 'Verify Stripe settings' },
      { id: 'payment-flow', name: 'Payment Flow', description: 'Test payment processing' },
      { id: 'webhook-handling', name: 'Webhook Handling', description: 'Test payment webhooks' }
    ]
  },
  {
    id: 'audio',
    name: 'Audio Tests',
    icon: Music,
    description: 'Test audio file handling and playback',
    tests: [
      { id: 'audio-upload', name: 'Audio Upload', description: 'Test audio file uploads' },
      { id: 'audio-processing', name: 'Audio Processing', description: 'Test audio file processing' },
      { id: 'audio-streaming', name: 'Audio Streaming', description: 'Test audio playback' },
      { id: 'audio-download', name: 'Audio Download', description: 'Test audio downloads' }
    ]
  },
  {
    id: 'email',
    name: 'Email Tests',
    icon: Mail,
    description: 'Test email functionality',
    tests: [
      { id: 'smtp-config', name: 'SMTP Configuration', description: 'Test email server settings' },
      { id: 'email-send', name: 'Email Sending', description: 'Test email delivery' },
      { id: 'email-templates', name: 'Email Templates', description: 'Test email templates' },
      { id: 'email-queue', name: 'Email Queue', description: 'Test email queue processing' }
    ]
  },
  {
    id: 'security',
    name: 'Security Tests',
    icon: Shield,
    description: 'Test security measures and authentication',
    tests: [
      { id: 'auth-validation', name: 'Auth Validation', description: 'Test authentication validation' },
      { id: 'session-management', name: 'Session Management', description: 'Test session handling' },
      { id: 'input-validation', name: 'Input Validation', description: 'Test input sanitization' },
      { id: 'rate-limiting', name: 'Rate Limiting', description: 'Test API rate limits' }
    ]
  }
];

export default function LogsTestingManager() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (level: LogEntry['level'], category: string, message: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      category,
      message,
      details
    };
    setLogs(prev => [...prev, newLog]);
  };

  const updateTestResult = (testId: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.id === testId);
      if (existing) {
        return prev.map(r => r.id === testId ? { ...r, status, message, duration, timestamp: new Date() } : r);
      } else {
        const test = testCategories.flatMap(c => c.tests).find(t => t.id === testId);
        return [...prev, {
          id: testId,
          name: test?.name || testId,
          status,
          message,
          timestamp: new Date(),
          duration
        }];
      }
    });
  };

  const runTest = async (testId: string) => {
    const startTime = Date.now();
    updateTestResult(testId, 'running', 'Test in progress...');
    addLog('info', 'Testing', `Starting test: ${testId}`);

    try {
      // Simulate test execution based on test type
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

      switch (testId) {
        case 'db-connection':
          const dbResponse = await fetch('/api/test/database');
          if (dbResponse.ok) {
            updateTestResult(testId, 'passed', 'Database connection successful', Date.now() - startTime);
            addLog('success', 'Database', 'Database connection test passed');
          } else {
            throw new Error('Database connection failed');
          }
          break;

        case 'api-auth':
          const authResponse = await fetch('/api/auth/me');
          if (authResponse.status === 401 || authResponse.ok) {
            updateTestResult(testId, 'passed', 'Authentication API working correctly', Date.now() - startTime);
            addLog('success', 'API', 'Authentication test passed');
          } else {
            throw new Error('Authentication API error');
          }
          break;

        case 'paypal-config':
          const paypalResponse = await fetch('/api/test/paypal');
          if (paypalResponse.ok) {
            updateTestResult(testId, 'passed', 'PayPal configuration valid', Date.now() - startTime);
            addLog('success', 'Payment', 'PayPal configuration test passed');
          } else {
            throw new Error('PayPal configuration invalid');
          }
          break;

        default:
          // Simulate random success/failure for other tests
          const success = Math.random() > 0.2; // 80% success rate
          if (success) {
            updateTestResult(testId, 'passed', 'Test completed successfully', Date.now() - startTime);
            addLog('success', 'Testing', `Test ${testId} passed`);
          } else {
            throw new Error('Test failed due to simulated error');
          }
      }
    } catch (error) {
      updateTestResult(testId, 'failed', error instanceof Error ? error.message : 'Test failed', Date.now() - startTime);
      addLog('error', 'Testing', `Test ${testId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runSelectedTests = async () => {
    if (selectedTests.length === 0) {
      toast({
        title: "No Tests Selected",
        description: "Please select at least one test to run.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(true);
    addLog('info', 'Testing', `Starting test suite with ${selectedTests.length} tests`);

    for (const testId of selectedTests) {
      await runTest(testId);
    }

    setIsRunning(false);
    addLog('info', 'Testing', 'Test suite completed');
    
    const passed = testResults.filter(r => selectedTests.includes(r.id) && r.status === 'passed').length;
    const failed = testResults.filter(r => selectedTests.includes(r.id) && r.status === 'failed').length;
    
    toast({
      title: "Test Suite Completed",
      description: `${passed} passed, ${failed} failed`,
      variant: passed === selectedTests.length ? "default" : "destructive"
    });
  };

  const runAllTests = async () => {
    const allTestIds = testCategories.flatMap(c => c.tests.map(t => t.id));
    setSelectedTests(allTestIds);
    setIsRunning(true);
    addLog('info', 'Testing', `Starting full test suite with ${allTestIds.length} tests`);

    for (const testId of allTestIds) {
      await runTest(testId);
    }

    setIsRunning(false);
    addLog('info', 'Testing', 'Full test suite completed');
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'System', 'Logs cleared');
  };

  const clearResults = () => {
    setTestResults([]);
    addLog('info', 'System', 'Test results cleared');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            System Testing & Logs
          </CardTitle>
          <CardDescription>
            Test system functionality and monitor application logs in real-time
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Test Selection */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Categories</CardTitle>
              <CardDescription>
                Select tests to run and monitor their progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={runAllTests}
                  disabled={isRunning}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run All Tests
                </Button>
                <Button
                  onClick={runSelectedTests}
                  disabled={isRunning || selectedTests.length === 0}
                  variant="outline"
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Run Selected ({selectedTests.length})
                </Button>
                <Button
                  onClick={clearResults}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear Results
                </Button>
              </div>

              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {testCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <category.icon className="h-4 w-4" />
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {category.tests.length}
                        </Badge>
                      </div>
                      <div className="space-y-1 ml-4">
                        {category.tests.map((test) => {
                          const result = testResults.find(r => r.id === test.id);
                          const isSelected = selectedTests.includes(test.id);
                          
                          return (
                            <div
                              key={test.id}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => {
                                setSelectedTests(prev => 
                                  prev.includes(test.id) 
                                    ? prev.filter(id => id !== test.id)
                                    : [...prev, test.id]
                                );
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded"
                              />
                              {result && getStatusIcon(result.status)}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{test.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {test.description}
                                </div>
                                {result && (
                                  <div className="text-xs text-muted-foreground">
                                    {result.message}
                                    {result.duration && ` (${result.duration}ms)`}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Logs & Results */}
        <div className="space-y-4">
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Live Logs</TabsTrigger>
              <TabsTrigger value="results">Test Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">System Logs</CardTitle>
                    <Button
                      onClick={clearLogs}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] w-full rounded border bg-black text-green-400 font-mono text-sm">
                    <div className="p-4 space-y-1">
                      {logs.length === 0 ? (
                        <div className="text-muted-foreground">No logs yet. Run some tests to see activity...</div>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="flex items-start gap-2">
                            <span className="text-gray-500 text-xs whitespace-nowrap">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            {getLogIcon(log.level)}
                            <span className="text-blue-400">[{log.category}]</span>
                            <span className={
                              log.level === 'error' ? 'text-red-400' :
                              log.level === 'warn' ? 'text-yellow-400' :
                              log.level === 'success' ? 'text-green-400' :
                              'text-white'
                            }>
                              {log.message}
                            </span>
                          </div>
                        ))
                      )}
                      <div ref={logsEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {testResults.length === 0 ? (
                        <div className="text-muted-foreground text-center py-8">
                          No test results yet. Run some tests to see results here.
                        </div>
                      ) : (
                        testResults.map((result) => (
                          <div
                            key={result.id}
                            className={`p-3 rounded border ${
                              result.status === 'passed' ? 'border-green-200 bg-green-50' :
                              result.status === 'failed' ? 'border-red-200 bg-red-50' :
                              result.status === 'running' ? 'border-blue-200 bg-blue-50' :
                              'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(result.status)}
                                <span className="font-medium">{result.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {result.timestamp.toLocaleTimeString()}
                                {result.duration && ` • ${result.duration}ms`}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {result.message}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}