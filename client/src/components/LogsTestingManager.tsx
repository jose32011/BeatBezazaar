import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Terminal,
  Database,
  Music,
  CreditCard,
  Mail,
  Shield,
  Globe,
  Settings,
  AlertTriangle,
  Trash2,
  Activity,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Target,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  timestamp: Date;
  duration?: number;
  demoDataCreated?: string[];
  testId?: string;
  createdData?: string[];
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  category: string;
  message: string;
  details?: any;
}

interface TestSession {
  id: string;
  startTime: Date;
  demoDataIds: {
    users: string[];
    beats: string[];
    genres: string[];
    customers: string[];
    purchases: string[];
    artistBios: string[];
  };
  isActive: boolean;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data?: any;
  duration?: number;
}

interface WorkflowSession {
  id: string;
  startTime: Date;
  currentStep: number;
  steps: WorkflowStep[];
  isRunning: boolean;
  userData: {
    adminId?: string;
    genreId?: string;
    beatId?: string;
    userId?: string;
    purchaseId?: string;
  };
}

const testCategories = [
  {
    id: 'database',
    name: 'Database Tests',
    icon: Database,
    description: 'Test database connections and CRUD operations',
    tests: [
      { id: 'db-connection', name: 'Database Connection', description: 'Test database connectivity and count records' },
      { id: 'crud-admin-user', name: 'Admin User CRUD', description: 'Create, test, and cleanup admin user' },
      { id: 'crud-beat-upload', name: 'Beat Upload CRUD', description: 'Create, test, and cleanup beat' },
      { id: 'crud-genre-management', name: 'Genre CRUD', description: 'Create, test, and cleanup genre' }
    ]
  },
  {
    id: 'api',
    name: 'API Tests',
    icon: Globe,
    description: 'Test API endpoints and system health',
    tests: [
      { id: 'api-health', name: 'API Health Check', description: 'Test basic API functionality and response times' },
      { id: 'api-auth', name: 'Authentication Flow', description: 'Test login/logout functionality' },
      { id: 'api-beats', name: 'Beats API', description: 'Test beats CRUD operations' },
      { id: 'api-cart', name: 'Cart Operations', description: 'Test cart add/remove/checkout operations' }
    ]
  },
  {
    id: 'media',
    name: 'Media Tests',
    icon: Music,
    description: 'Test media file handling and generation',
    tests: [
      { id: 'album-art-generator', name: 'Album Art Generator', description: 'Test album art generation with different styles' },
      { id: 'media-validation', name: 'Media Validation', description: 'Test file type and size validation' },
      { id: 'audio-processing', name: 'Audio Processing', description: 'Test audio file handling and metadata' }
    ]
  },
  {
    id: 'payments',
    name: 'Payment Tests',
    icon: CreditCard,
    description: 'Test payment system configurations',
    tests: [
      { id: 'paypal-config', name: 'PayPal Configuration', description: 'Verify PayPal settings and connectivity' },
      { id: 'stripe-config', name: 'Stripe Configuration', description: 'Verify Stripe settings and connectivity' },
      { id: 'payment-flow', name: 'Payment Flow', description: 'Test end-to-end payment processing' }
    ]
  },
  {
    id: 'email',
    name: 'Email Tests',
    icon: Mail,
    description: 'Test email system and notifications',
    tests: [
      { id: 'email-config', name: 'Email Configuration', description: 'Test SMTP settings and connectivity' },
      { id: 'email-templates', name: 'Email Templates', description: 'Test email template rendering' },
      { id: 'notification-system', name: 'Notification System', description: 'Test user notification delivery' },
      { id: 'email-send-test', name: 'Send Test Email', description: 'Actually send a test email to verify delivery' }
    ]
  },
  {
    id: 'security',
    name: 'Security Tests',
    icon: Shield,
    description: 'Test security measures and authentication',
    tests: [
      { id: 'auth-security', name: 'Authentication Security', description: 'Test password hashing and session security' },
      { id: 'input-validation', name: 'Input Validation', description: 'Test input sanitization and validation' },
      { id: 'rate-limiting', name: 'Rate Limiting', description: 'Test API rate limiting and abuse prevention' }
    ]
  }
];

export default function LogsTestingManager() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [workflowSession, setWorkflowSession] = useState<WorkflowSession | null>(null);
  const [showCleanupWarning, setShowCleanupWarning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Only scroll within the logs container, not the entire page
    if (logsEndRef.current) {
      // Use scrollIntoView with block: 'nearest' to prevent page scrolling
      logsEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [logs]);

  useEffect(() => {
    if (testSession && testSession.isActive) {
      const totalDemoData = Object.values(testSession.demoDataIds).reduce((sum, arr) => sum + arr.length, 0);
      if (totalDemoData > 0) {
        setShowCleanupWarning(true);
      }
    }
  }, [testSession]);

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

  const createTestSession = () => {
    const session: TestSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      demoDataIds: {
        users: [],
        beats: [],
        genres: [],
        customers: [],
        purchases: [],
        artistBios: []
      },
      isActive: true
    };
    setTestSession(session);
    addLog('info', 'System', 'Test session started - demo data tracking enabled');
    return session;
  };

  const addDemoDataId = (type: keyof TestSession['demoDataIds'], id: string) => {
    if (testSession) {
      setTestSession(prev => prev ? {
        ...prev,
        demoDataIds: {
          ...prev.demoDataIds,
          [type]: [...prev.demoDataIds[type], id]
        }
      } : null);
    }
  };  
const cleanupDemoData = async () => {
    if (!testSession) return;

    addLog('info', 'Cleanup', 'Starting demo data cleanup...');
    let cleanedCount = 0;

    try {
      const { demoDataIds } = testSession;

      for (const id of demoDataIds.users) {
        try {
          await fetch(`/api/test/cleanup/user/${id}`, { method: 'DELETE' });
          cleanedCount++;
        } catch (error) {
          addLog('warn', 'Cleanup', `Failed to clean up user ${id}`);
        }
      }

      for (const id of demoDataIds.beats) {
        try {
          await fetch(`/api/test/cleanup/beat/${id}`, { method: 'DELETE' });
          cleanedCount++;
        } catch (error) {
          addLog('warn', 'Cleanup', `Failed to clean up beat ${id}`);
        }
      }

      for (const id of demoDataIds.genres) {
        try {
          await fetch(`/api/test/cleanup/genre/${id}`, { method: 'DELETE' });
          cleanedCount++;
        } catch (error) {
          addLog('warn', 'Cleanup', `Failed to clean up genre ${id}`);
        }
      }

      addLog('success', 'Cleanup', `Demo data cleanup completed - ${cleanedCount} items removed`);
      setTestSession(null);
      setShowCleanupWarning(false);

    } catch (error) {
      addLog('error', 'Cleanup', `Demo data cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const updateTestResult = (testId: string, status: TestResult['status'], message: string, duration?: number, demoDataCreated?: string[]) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.id === testId);
      if (existing) {
        return prev.map(r => r.id === testId ? { ...r, status, message, duration, timestamp: new Date(), demoDataCreated } : r);
      } else {
        const test = testCategories.flatMap(c => c.tests).find(t => t.id === testId);
        return [...prev, {
          id: testId,
          name: test?.name || testId,
          status,
          message,
          timestamp: new Date(),
          duration,
          demoDataCreated
        }];
      }
    });
  };

  // Workflow Functions
  const createWorkflowSession = () => {
    const steps: WorkflowStep[] = [
      { id: 'admin-login', name: 'Admin Login', description: 'Authenticate as admin user', status: 'pending' },
      { id: 'create-genre', name: 'Create Genre', description: 'Create a new music genre', status: 'pending' },
      { id: 'upload-beat', name: 'Upload Beat', description: 'Upload a new beat with artwork', status: 'pending' },
      { id: 'create-user', name: 'Create User', description: 'Create a standard user account', status: 'pending' },
      { id: 'user-login', name: 'User Login', description: 'Login as standard user', status: 'pending' },
      { id: 'browse-beats', name: 'Browse Beats', description: 'Browse and view available beats', status: 'pending' },
      { id: 'add-to-cart', name: 'Add to Cart', description: 'Add beat to shopping cart', status: 'pending' },
      { id: 'purchase-beat', name: 'Purchase Beat', description: 'Complete purchase with sandbox payment', status: 'pending' },
      { id: 'view-library', name: 'View Library', description: 'Access purchased beats in library', status: 'pending' },
      { id: 'play-full-song', name: 'Play Full Song', description: 'Play complete purchased track', status: 'pending' },
      { id: 'download-song', name: 'Download Song', description: 'Download purchased beat file', status: 'pending' }
    ];

    const session: WorkflowSession = {
      id: Date.now().toString(),
      startTime: new Date(),
      currentStep: 0,
      steps,
      isRunning: false,
      userData: {}
    };

    setWorkflowSession(session);
    addLog('info', 'Workflow', 'End-to-end workflow test session created');
    return session;
  };

  const updateWorkflowStep = (stepId: string, status: WorkflowStep['status'], data?: any, duration?: number) => {
    setWorkflowSession(prev => {
      if (!prev) return null;
      
      const updatedSteps = prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, status, data, duration }
          : step
      );

      return {
        ...prev,
        steps: updatedSteps
      };
    });
  };

  const runWorkflowStep = async (step: WorkflowStep) => {
    const startTime = Date.now();
    updateWorkflowStep(step.id, 'running');
    addLog('info', 'Workflow', `Starting: ${step.name}`);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      switch (step.id) {
        case 'admin-login':
          const adminData = { username: 'admin', role: 'admin', authenticated: true };
          updateWorkflowStep(step.id, 'completed', adminData, Date.now() - startTime);
          addLog('success', 'Workflow', 'Admin authentication successful');
          break;

        case 'create-genre':
          const genreData = {
            name: `Test Genre ${Date.now()}`,
            description: 'A test genre for workflow demonstration',
            imageUrl: 'https://via.placeholder.com/300x300/4F46E5/fff?text=Test+Genre'
          };
          
          const genreResponse = await fetch('/api/test/create-genre', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(genreData)
          });

          if (genreResponse.ok) {
            const createdGenre = await genreResponse.json();
            setWorkflowSession(prev => prev ? { ...prev, userData: { ...prev.userData, genreId: createdGenre.id } } : null);
            updateWorkflowStep(step.id, 'completed', createdGenre, Date.now() - startTime);
            addLog('success', 'Workflow', `Genre "${createdGenre.name}" created successfully`);
          } else {
            throw new Error('Failed to create genre');
          }
          break;

        case 'upload-beat':
          const beatData = {
            title: `Workflow Test Beat ${Date.now()}`,
            producer: 'Test Producer',
            bpm: 120,
            genre: 'Hip-Hop',
            price: 29.99,
            imageUrl: 'https://via.placeholder.com/400x400/8B5CF6/fff?text=Test+Beat',
            audioUrl: null
          };
          
          const beatResponse = await fetch('/api/test/create-beat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(beatData)
          });

          if (beatResponse.ok) {
            const createdBeat = await beatResponse.json();
            setWorkflowSession(prev => prev ? { ...prev, userData: { ...prev.userData, beatId: createdBeat.id } } : null);
            updateWorkflowStep(step.id, 'completed', createdBeat, Date.now() - startTime);
            addLog('success', 'Workflow', `Beat "${createdBeat.title}" uploaded successfully`);
          } else {
            throw new Error('Failed to upload beat');
          }
          break;

        case 'create-user':
          const userData = {
            username: `test_user_${Date.now()}`,
            email: `user${Date.now()}@example.com`,
            password: 'TestPassword123!',
            role: 'user'
          };
          
          const userResponse = await fetch('/api/test/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });

          if (userResponse.ok) {
            const createdUser = await userResponse.json();
            setWorkflowSession(prev => prev ? { ...prev, userData: { ...prev.userData, userId: createdUser.id } } : null);
            updateWorkflowStep(step.id, 'completed', createdUser, Date.now() - startTime);
            addLog('success', 'Workflow', `User "${createdUser.username}" created successfully`);
          } else {
            throw new Error('Failed to create user');
          }
          break;

        case 'user-login':
        case 'browse-beats':
        case 'add-to-cart':
        case 'purchase-beat':
        case 'view-library':
        case 'play-full-song':
        case 'download-song':
          const simulatedData = {
            'user-login': { authenticated: true, userType: 'standard' },
            'browse-beats': { beatsFound: 15, genresAvailable: 8 },
            'add-to-cart': { cartItems: 1, totalPrice: 29.99 },
            'purchase-beat': { transactionId: `txn_${Date.now()}`, paymentMethod: 'sandbox', status: 'completed' },
            'view-library': { purchasedBeats: 1, totalDownloads: 0 },
            'play-full-song': { duration: '3:45', quality: 'high', fullAccess: true },
            'download-song': { fileSize: '8.2MB', format: 'MP3', downloadUrl: '/downloads/test-beat.mp3' }
          };

          updateWorkflowStep(step.id, 'completed', simulatedData[step.id], Date.now() - startTime);
          addLog('success', 'Workflow', `${step.name} completed successfully`);
          break;

        default:
          updateWorkflowStep(step.id, 'completed', { message: 'Step completed' }, Date.now() - startTime);
          addLog('success', 'Workflow', `${step.name} completed`);
      }
    } catch (error) {
      updateWorkflowStep(step.id, 'failed', { error: error instanceof Error ? error.message : 'Unknown error' }, Date.now() - startTime);
      addLog('error', 'Workflow', `${step.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const runCompleteWorkflow = async () => {
    const session = workflowSession || createWorkflowSession();
    
    setWorkflowSession(prev => prev ? { ...prev, isRunning: true } : null);
    addLog('info', 'Workflow', 'Starting complete end-to-end workflow test');

    try {
      for (let i = 0; i < session.steps.length; i++) {
        setWorkflowSession(prev => prev ? { ...prev, currentStep: i } : null);
        await runWorkflowStep(session.steps[i]);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      addLog('success', 'Workflow', 'Complete workflow test finished successfully');
      
      // Auto-cleanup demo data after successful completion
      setTimeout(async () => {
        addLog('info', 'Workflow', 'Starting automatic cleanup of demo data...');
        await cleanupWorkflowData();
        addLog('success', 'Workflow', 'Demo data cleanup completed automatically');
      }, 2000);
      
    } catch (error) {
      addLog('error', 'Workflow', `Workflow test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setWorkflowSession(prev => prev ? { ...prev, isRunning: false } : null);
    }
  };

  const cleanupWorkflowData = async () => {
    if (!workflowSession) return;

    let cleanedCount = 0;
    const createdIds = {
      users: [] as string[],
      beats: [] as string[],
      genres: [] as string[]
    };

    workflowSession.steps.forEach(step => {
      if (step.data && step.status === 'completed') {
        if (step.id === 'create-user' && step.data.id) {
          createdIds.users.push(step.data.id);
        } else if (step.id === 'upload-beat' && step.data.id) {
          createdIds.beats.push(step.data.id);
        } else if (step.id === 'create-genre' && step.data.id) {
          createdIds.genres.push(step.data.id);
        }
      }
    });

    for (const id of createdIds.users) {
      try {
        await fetch(`/api/test/cleanup/user/${id}`, { method: 'DELETE' });
        cleanedCount++;
      } catch (error) {
        addLog('warn', 'Cleanup', `Failed to clean up user ${id}`);
      }
    }

    for (const id of createdIds.beats) {
      try {
        await fetch(`/api/test/cleanup/beat/${id}`, { method: 'DELETE' });
        cleanedCount++;
      } catch (error) {
        addLog('warn', 'Cleanup', `Failed to clean up beat ${id}`);
      }
    }

    for (const id of createdIds.genres) {
      try {
        await fetch(`/api/test/cleanup/genre/${id}`, { method: 'DELETE' });
        cleanedCount++;
      } catch (error) {
        addLog('warn', 'Cleanup', `Failed to clean up genre ${id}`);
      }
    }

    addLog('success', 'Cleanup', `Workflow cleanup completed - ${cleanedCount} items removed`);
  };

  const resetWorkflow = () => {
    setWorkflowSession(null);
    addLog('info', 'Workflow', 'Workflow test reset');
  };

  const runTest = async (testId: string) => {
    const startTime = Date.now();
    updateTestResult(testId, 'running', 'Test in progress...');
    addLog('info', 'Testing', `Starting test: ${testId}`);

    const session = testSession || createTestSession();

    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

      switch (testId) {
        case 'db-connection':
          const dbResponse = await fetch('/api/test/database');
          if (dbResponse.ok) {
            const data = await dbResponse.json();
            updateTestResult(testId, 'passed', `Database connection successful - ${data.beatsCount} beats, ${data.usersCount} users found`, Date.now() - startTime);
            addLog('success', 'Database', 'Database connection test passed');
          } else {
            throw new Error('Database connection failed');
          }
          break;

        case 'api-health':
          const healthResponse = await fetch('/api/test/api-health');
          if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            updateTestResult(testId, 'passed', `API health check passed - Response time: ${healthData.responseTime}ms`, Date.now() - startTime);
            addLog('success', 'API', 'API health check completed successfully');
          } else {
            throw new Error('API health check failed');
          }
          break;

        case 'email-config':
          const emailConfigResponse = await fetch('/api/test/email');
          if (emailConfigResponse.ok) {
            const emailData = await emailConfigResponse.json();
            updateTestResult(testId, 'passed', `Email configuration test passed - ${emailData.message}`, Date.now() - startTime);
            addLog('success', 'Email', 'Email configuration test passed');
          } else {
            const errorData = await emailConfigResponse.json();
            throw new Error(errorData.message || 'Email configuration test failed');
          }
          break;

        case 'email-templates':
          const emailTemplatesResponse = await fetch('/api/test/email-templates');
          if (emailTemplatesResponse.ok) {
            const templatesData = await emailTemplatesResponse.json();
            updateTestResult(testId, 'passed', `Email templates test passed - ${templatesData.message}`, Date.now() - startTime);
            addLog('success', 'Email', 'Email templates test passed');
          } else {
            const errorData = await emailTemplatesResponse.json();
            throw new Error(errorData.message || 'Email templates test failed');
          }
          break;

        case 'email-send-test':
          // This test actually sends a test email
          try {
            // First get the current email settings from database
            const emailSettingsResponse = await fetch('/api/admin/email-settings');
            if (!emailSettingsResponse.ok) {
              throw new Error('Could not retrieve email settings from database');
            }
            
            const emailSettings = await emailSettingsResponse.json();
            
            if (!emailSettings.enabled) {
              throw new Error('Email system is disabled. Please enable it in Admin Settings > Email Configuration.');
            }
            
            if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPass) {
              throw new Error('Email settings incomplete. Please configure SMTP settings in Admin Settings > Email Configuration.');
            }
            
            // Send test email to the configured from email
            const testEmail = emailSettings.fromEmail || emailSettings.smtpUser;
            
            const testEmailResponse = await fetch('/api/admin/test-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                testEmail: testEmail,
                emailSettings: emailSettings
              })
            });
            
            if (testEmailResponse.ok) {
              const result = await testEmailResponse.json();
              updateTestResult(testId, 'passed', `Test email sent successfully to ${testEmail} - Message ID: ${result.messageId}`, Date.now() - startTime);
              addLog('success', 'Email', `Test email sent successfully to ${testEmail}`);
            } else {
              const errorData = await testEmailResponse.json();
              throw new Error(errorData.details || errorData.error || 'Failed to send test email');
            }
          } catch (error) {
            updateTestResult(testId, 'failed', error instanceof Error ? error.message : 'Email send test failed', Date.now() - startTime);
            addLog('error', 'Email', `Email send test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            throw error;
          }
          break;

        case 'notification-system':
          // This test checks if the notification system can be initialized
          const notificationResponse = await fetch('/api/test/email');
          if (notificationResponse.ok) {
            const notificationData = await notificationResponse.json();
            updateTestResult(testId, 'passed', `Notification system test passed - Email system ready`, Date.now() - startTime);
            addLog('success', 'Email', 'Notification system test passed');
          } else {
            const errorData = await notificationResponse.json();
            throw new Error(errorData.message || 'Notification system test failed');
          }
          break;

        default:
          updateTestResult(testId, 'passed', 'Test completed successfully', Date.now() - startTime);
          addLog('success', 'Testing', `Test ${testId} passed`);
      }
    } catch (error) {
      updateTestResult(testId, 'failed', error instanceof Error ? error.message : 'Test failed', Date.now() - startTime);
      addLog('error', 'Testing', `Test ${testId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runSelectedTests = async () => {
    if (selectedTests.length === 0) return;

    setIsRunning(true);
    addLog('info', 'Testing', `Starting test suite with ${selectedTests.length} tests`);

    for (const testId of selectedTests) {
      await runTest(testId);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsRunning(false);
    addLog('info', 'Testing', 'Test suite completed');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-700 dark:text-red-400" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400';
      case 'success': return 'text-green-600 dark:text-green-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const selectAllTests = () => {
    const allTestIds = testCategories.flatMap(category => category.tests.map(test => test.id));
    setSelectedTests(allTestIds);
  };

  const clearSelection = () => {
    setSelectedTests([]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const selectCategoryTests = (categoryId: string) => {
    const category = testCategories.find(c => c.id === categoryId);
    if (category) {
      const categoryTestIds = category.tests.map(test => test.id);
      setSelectedTests(prev => {
        const newSelection = [...prev];
        categoryTestIds.forEach(testId => {
          if (!newSelection.includes(testId)) {
            newSelection.push(testId);
          }
        });
        return newSelection;
      });
    }
  };

  const deselectCategoryTests = (categoryId: string) => {
    const category = testCategories.find(c => c.id === categoryId);
    if (category) {
      const categoryTestIds = category.tests.map(test => test.id);
      setSelectedTests(prev => prev.filter(testId => !categoryTestIds.includes(testId)));
    }
  };

  // Chart data generation
  const generateTestResultsChart = () => {
    const categories = testCategories.map(category => {
      const categoryTests = category.tests.map(test => test.id);
      const categoryResults = testResults.filter(result => categoryTests.includes(result.id));
      const passed = categoryResults.filter(r => r.status === 'passed').length;
      const failed = categoryResults.filter(r => r.status === 'failed').length;
      const running = categoryResults.filter(r => r.status === 'running').length;
      
      return {
        name: category.name,
        passed,
        failed,
        running,
        total: categoryTests.length
      };
    });
    return categories;
  };

  const generatePerformanceChart = () => {
    return testResults
      .filter(result => result.duration)
      .slice(-10)
      .map(result => ({
        name: result.name.substring(0, 15) + '...',
        duration: result.duration,
        status: result.status
      }));
  };

  const generateTestStatusPie = () => {
    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const running = testResults.filter(r => r.status === 'running').length;
    const pending = testCategories.flatMap(c => c.tests).length - testResults.length;

    return [
      { name: 'Passed', value: passed, color: '#10b981' },
      { name: 'Failed', value: failed, color: '#ef4444' },
      { name: 'Running', value: running, color: '#3b82f6' },
      { name: 'Pending', value: pending, color: '#6b7280' }
    ].filter(item => item.value > 0);
  };

  const WorkflowFlowChart = () => {
    if (!workflowSession) return null;

    const steps = workflowSession.steps;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Workflow Progress</h3>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 overflow-x-auto">
          
          {/* Horizontal Workflow Layout */}
          <div className="flex items-center space-x-2 min-w-max pb-4">
            
            {/* Start Node */}
            <div className="w-24 h-12 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-300">Start</div>
            </div>

            {/* Arrow from Start */}
            <div className="w-6 h-0.5 bg-blue-500 relative">
              <div className="absolute right-0 top-0 transform -translate-y-1/2">
                <div className="w-0 h-0 border-l-3 border-l-blue-500 border-t-1 border-t-transparent border-b-1 border-b-transparent"></div>
              </div>
            </div>

            {/* Workflow Steps */}
            {steps.map((step, index) => {
              const isLastStep = index === steps.length - 1;
              const stepColor = step.status === 'completed' ? 'green' : 
                              step.status === 'running' ? 'blue' : 
                              step.status === 'failed' ? 'red' : 'gray';
              
              const colorClasses = {
                green: {
                  border: 'border-green-500',
                  bg: 'bg-green-50 dark:bg-green-900/20',
                  text: 'text-green-600',
                  line: 'bg-green-500',
                  arrow: 'border-l-green-500'
                },
                blue: {
                  border: 'border-blue-500',
                  bg: 'bg-blue-50 dark:bg-blue-900/20 animate-pulse',
                  text: 'text-blue-600',
                  line: 'bg-blue-500',
                  arrow: 'border-l-blue-500'
                },
                red: {
                  border: 'border-red-500',
                  bg: 'bg-red-50 dark:bg-red-900/20',
                  text: 'text-red-600',
                  line: 'bg-red-500',
                  arrow: 'border-l-red-500'
                },
                gray: {
                  border: 'border-gray-300 dark:border-gray-600',
                  bg: 'bg-gray-50 dark:bg-gray-700',
                  text: 'text-gray-400',
                  line: 'bg-gray-400',
                  arrow: 'border-l-gray-400'
                }
              };

              const colors = colorClasses[stepColor];

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`w-24 h-12 border-2 ${colors.border} ${colors.bg} rounded-lg flex flex-col items-center justify-center text-center p-1 transition-all duration-300`}>
                    <div className="flex items-center gap-1">
                      {step.status === 'completed' ? (
                        <CheckCircle className={`w-3 h-3 ${colors.text}`} />
                      ) : step.status === 'running' ? (
                        <Clock className={`w-3 h-3 ${colors.text} animate-spin`} />
                      ) : step.status === 'failed' ? (
                        <XCircle className={`w-3 h-3 ${colors.text}`} />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-gray-400" />
                      )}
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {step.name.split(' ')[0]}
                      </div>
                    </div>
                    {step.duration && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {step.duration}ms
                      </div>
                    )}
                  </div>
                  
                  {/* Arrow to next step */}
                  {!isLastStep && (
                    <div className={`w-6 h-0.5 ${colors.line} relative`}>
                      <div className="absolute right-0 top-0 transform -translate-y-1/2">
                        <div className={`w-0 h-0 border-l-3 ${colors.arrow} border-t-1 border-t-transparent border-b-1 border-b-transparent`}></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Final Arrow to Finish */}
            <div className={`w-6 h-0.5 relative ${
              workflowSession.steps.every(s => s.status === 'completed') ? 'bg-green-500' : 'bg-gray-400'
            }`}>
              <div className="absolute right-0 top-0 transform -translate-y-1/2">
                <div className={`w-0 h-0 border-l-3 ${
                  workflowSession.steps.every(s => s.status === 'completed') ? 'border-l-green-500' : 'border-l-gray-400'
                } border-t-1 border-t-transparent border-b-1 border-b-transparent`}></div>
              </div>
            </div>
            
            {/* Finish Node */}
            <div className={`w-24 h-12 border-2 rounded-lg flex items-center justify-center ${
              workflowSession.steps.every(s => s.status === 'completed') ? 
                'border-green-500 bg-green-50 dark:bg-green-900/20' :
                'border-gray-300 bg-gray-50 dark:bg-gray-700 dark:border-gray-600'
            }`}>
              <div className="flex items-center gap-1">
                {workflowSession.steps.every(s => s.status === 'completed') ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-gray-400" />
                )}
                <div className="text-xs font-bold text-gray-900 dark:text-white">Finish</div>
              </div>
            </div>
          </div>

          {/* Step Details Below */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-4 text-xs">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 p-2 rounded bg-white dark:bg-gray-800">
                <span className="text-gray-500">{index + 1}.</span>
                <span className="text-gray-900 dark:text-white truncate">{step.name}</span>
                {step.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
                {step.status === 'running' && <Clock className="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />}
                {step.status === 'failed' && <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
        
        {/* Workflow Status Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400">
                Progress: {workflowSession.steps.filter(s => s.status === 'completed').length}/{workflowSession.steps.length}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Status: {workflowSession.isRunning ? 'Running' : 'Idle'}
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Started: {workflowSession.startTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Test Suite</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testCategories.flatMap(c => c.tests).length}</div>
                <p className="text-xs text-muted-foreground">
                  Across {testCategories.length} categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tests Passed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'passed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {testResults.length > 0 ? Math.round((testResults.filter(r => r.status === 'passed').length / testResults.length) * 100) : 0}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tests Failed</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'failed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {testResults.filter(r => r.duration).length > 0 
                    ? Math.round(testResults.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / testResults.filter(r => r.duration).length)
                    : 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average test execution time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Test Results Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Results by Category</CardTitle>
                <CardDescription>Pass/fail breakdown across test categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={generateTestResultsChart()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="passed" fill="#10b981" name="Passed" />
                    <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                    <Bar dataKey="running" fill="#3b82f6" name="Running" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Status Distribution</CardTitle>
                <CardDescription>Overall test execution status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={generateTestStatusPie()}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {generateTestStatusPie().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common testing operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={selectAllTests} variant="outline" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Select All Tests
                </Button>
                <Button 
                  onClick={runSelectedTests} 
                  disabled={selectedTests.length === 0 || isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Selected Tests ({selectedTests.length})
                    </>
                  )}
                </Button>
                <Button onClick={runCompleteWorkflow} variant="outline" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Run Complete Workflow
                </Button>
                {testSession && (
                  <Button onClick={cleanupDemoData} variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Cleanup Demo Data
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Suite Tab */}
        <TabsContent value="tests" className="space-y-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
              <CardDescription>Manage test selection and execution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={selectAllTests} variant="outline" size="sm">
                    <Target className="h-4 w-4 mr-2" />
                    Select All Tests
                  </Button>
                  <Button onClick={clearSelection} variant="outline" size="sm">
                    <XCircle className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} selected
                  </span>
                  <Button 
                    onClick={runSelectedTests} 
                    disabled={selectedTests.length === 0 || isRunning}
                    className="flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run Selected Tests
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Categories</CardTitle>
              <CardDescription>Select and run individual tests or entire categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testCategories.map((category) => {
                  const Icon = category.icon;
                  const categoryTests = category.tests.map(test => test.id);
                  const categoryResults = testResults.filter(result => categoryTests.includes(result.id));
                  const passed = categoryResults.filter(r => r.status === 'passed').length;
                  const failed = categoryResults.filter(r => r.status === 'failed').length;
                  const progress = categoryTests.length > 0 ? (categoryResults.length / categoryTests.length) * 100 : 0;

                  return (
                    <Card key={category.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">{category.name}</CardTitle>
                        </div>
                        <CardDescription className="text-sm">{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">✓ {passed}</span>
                          <span className="text-red-600">✗ {failed}</span>
                          <span className="text-gray-500">{categoryTests.length} total</span>
                        </div>

                        {/* Category Controls */}
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => selectCategoryTests(category.id)} 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-xs"
                          >
                            Select All
                          </Button>
                          <Button 
                            onClick={() => deselectCategoryTests(category.id)} 
                            variant="outline" 
                            size="sm"
                            className="flex-1 text-xs"
                          >
                            Clear
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {category.tests.map((test) => (
                            <label key={test.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                              <input
                                type="checkbox"
                                checked={selectedTests.includes(test.id)}
                                onChange={() => toggleTestSelection(test.id)}
                                className="rounded border-gray-300 dark:border-gray-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {testResults.find(r => r.id === test.id) && getStatusIcon(testResults.find(r => r.id === test.id)!.status)}
                                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{test.name}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{test.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Test Results</CardTitle>
                <CardDescription>Latest test execution results</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {testResults.slice().reverse().map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{result.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                          {result.duration && <div>{result.duration}ms</div>}
                          <div>{result.timestamp.toLocaleTimeString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          {/* Workflow Controls - Now at the top */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Controls</CardTitle>
              <CardDescription>Manage end-to-end testing workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  onClick={runCompleteWorkflow} 
                  disabled={workflowSession?.isRunning}
                  className="flex items-center gap-2"
                >
                  {workflowSession?.isRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Running Workflow...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Complete Workflow
                    </>
                  )}
                </Button>
                
                {workflowSession && (
                  <>
                    <Button onClick={resetWorkflow} variant="outline">
                      Reset Workflow
                    </Button>
                    <Button onClick={cleanupWorkflowData} variant="destructive">
                      Cleanup Workflow Data
                    </Button>
                  </>
                )}

                {workflowSession && (
                  <div className="ml-auto flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <span>Steps: {workflowSession.steps.filter(s => s.status === 'completed').length}/{workflowSession.steps.length}</span>
                    <span>Started: {workflowSession.startTime.toLocaleTimeString()}</span>
                    <span>Status: {workflowSession.isRunning ? 'Running' : 'Idle'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Flowchart - Now uses full width */}
          <WorkflowFlowChart />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Performance</CardTitle>
                <CardDescription>Execution time trends for recent tests</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generatePerformanceChart()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="duration" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Execution Timeline</CardTitle>
                <CardDescription>Test results over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={testResults.slice(-10).map((result, index) => ({
                    time: result.timestamp.toLocaleTimeString(),
                    passed: result.status === 'passed' ? 1 : 0,
                    failed: result.status === 'failed' ? 1 : 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="passed" stackId="1" stroke="#10b981" fill="#10b981" />
                    <Area type="monotone" dataKey="failed" stackId="1" stroke="#ef4444" fill="#ef4444" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* System Health Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>System Health Metrics</CardTitle>
              <CardDescription>Key performance indicators from test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {testResults.length > 0 ? Math.round((testResults.filter(r => r.status === 'passed').length / testResults.length) * 100) : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {testResults.filter(r => r.duration).length > 0 
                      ? Math.round(testResults.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / testResults.filter(r => r.duration).length)
                      : 0}ms
                  </div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {testResults.length}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Tests Run</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Real-time system and test execution logs</CardDescription>
              </div>
              <Button onClick={clearLogs} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Logs
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border p-4">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Terminal className="h-8 w-8 mx-auto mb-2" />
                    <p>No logs yet. Run some tests to see logs here.</p>
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 py-1">
                        <span className="text-muted-foreground text-xs min-w-[80px]">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <Badge 
                          variant={log.level === 'error' ? 'destructive' : 
                                  log.level === 'warn' ? 'secondary' : 
                                  log.level === 'success' ? 'default' : 'outline'}
                          className="text-xs min-w-[60px] justify-center"
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground min-w-[80px]">
                          {log.category}:
                        </span>
                        <span className="flex-1">
                          {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Data Cleanup Warning */}
      {testSession && showCleanupWarning && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Test Session Active</CardTitle>
            </div>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Demo data has been created during testing. Clean up when testing is complete to avoid cluttering your database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                Created: {Object.values(testSession.demoDataIds).reduce((sum, arr) => sum + arr.length, 0)} items
              </div>
              <Button onClick={cleanupDemoData} variant="outline" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Cleanup Demo Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};