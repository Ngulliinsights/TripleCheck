import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Smartphone, 
  Building2,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Phone,
  User,
  Receipt,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react'
import React, { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '../../shared/components/ui/alert'
import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Input } from '../../shared/components/ui/input'
import { Progress } from '../../shared/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { useToast } from '../../shared/hooks/use-toast'

interface PaymentMethod {
  id: string;
  type: 'mpesa' | 'bank_transfer' | 'card' | 'crypto';
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  fees: {
    fixed: number;
    percentage: number;
  };
  processingTime: string;
  available: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: Date;
  completedAt?: Date;
  reference: string;
  fees: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mpesa',
    type: 'mpesa',
    name: 'M-Pesa',
    icon: Smartphone,
    description: 'Pay with M-Pesa mobile money',
    fees: { fixed: 0, percentage: 1.5 },
    processingTime: 'Instant',
    available: true
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    icon: Building2,
    description: 'Direct bank transfer',
    fees: { fixed: 50, percentage: 0 },
    processingTime: '1-3 business days',
    available: true
  },
  {
    id: 'card',
    type: 'card',
    name: 'Credit/Debit Card',
    icon: CreditCard,
    description: 'Pay with Visa or Mastercard',
    fees: { fixed: 0, percentage: 2.9 },
    processingTime: 'Instant',
    available: false
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn-001',
    amount: 2500,
    currency: 'KES',
    method: 'M-Pesa',
    status: 'completed',
    description: 'Land verification service',
    createdAt: new Date('2024-01-20T10:30:00'),
    completedAt: new Date('2024-01-20T10:31:00'),
    reference: 'MP240120001',
    fees: 37.5
  },
  {
    id: 'txn-002',
    amount: 5000,
    currency: 'KES',
    method: 'Bank Transfer',
    status: 'processing',
    description: 'Document authentication service',
    createdAt: new Date('2024-01-20T14:15:00'),
    reference: 'BT240120002',
    fees: 50
  }
];

const STATUS_CONFIG = {
  pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
};

export function PaymentSystemInterface() {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [selectedTab, setSelectedTab] = useState('payment');

  const calculateFees = (amount: number, method: PaymentMethod) => {
    return method.fees.fixed + (amount * method.fees.percentage / 100);
  };

  const handlePayment = async () => {
    if (!selectedMethod || !paymentAmount) {
      toast({
        title: "Missing Information",
        description: "Please select a payment method and enter an amount.",
        variant: "destructive"
      });
      return;
    }

    if (selectedMethod.type === 'mpesa' && !phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your M-Pesa phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      const amount = parseFloat(paymentAmount);
      const fees = calculateFees(amount, selectedMethod);
      
      const newTransaction: Transaction = {
        id: `txn-${Date.now()}`,
        amount,
        currency: 'KES',
        method: selectedMethod.name,
        status: 'processing',
        description: 'Land verification service',
        createdAt: new Date(),
        reference: `${selectedMethod.type.toUpperCase()}${Date.now()}`,
        fees
      };

      setTransactions(prev => [newTransaction, ...prev]);

      // Simulate processing delay
      setTimeout(() => {
        setTransactions(prev => prev.map(txn => 
          txn.id === newTransaction.id 
            ? { ...txn, status: 'completed', completedAt: new Date() }
            : txn
        ));
        
        toast({
          title: "Payment Successful",
          description: `Payment of KES ${amount.toLocaleString()} completed successfully.`,
        });
      }, 3000);

      toast({
        title: "Payment Initiated",
        description: `Processing payment of KES ${amount.toLocaleString()} via ${selectedMethod.name}.`,
      });

      // Reset form
      setPaymentAmount('');
      setPhoneNumber('');
      setSelectedMethod(null);

    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing your payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getStatusIcon = (status: Transaction['status']) => {
    const config = STATUS_CONFIG[status];
    return config.icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment System</h2>
          <p className="text-gray-600">
            Manage payments and transactions for verification services
          </p>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.status === 'processing').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>
            Process payments and manage transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payment">Make Payment</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            </TabsList>

            <TabsContent value="payment" className="space-y-6">
              {/* Payment Amount */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Amount (KES)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Service Type
                    </label>
                    <Select defaultValue="land_verification">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="land_verification">Land Verification</SelectItem>
                        <SelectItem value="document_auth">Document Authentication</SelectItem>
                        <SelectItem value="fraud_detection">Fraud Detection</SelectItem>
                        <SelectItem value="expert_consultation">Expert Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedMethod?.id === method.id;
                      const fees = paymentAmount ? calculateFees(parseFloat(paymentAmount) || 0, method) : 0;

                      return (
                        <Card 
                          key={method.id}
                          className={`cursor-pointer transition-all duration-200 ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                          } ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => method.available && setSelectedMethod(method)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-lg ${
                                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                                }`}>
                                  <Icon className={`h-6 w-6 ${
                                    isSelected ? 'text-blue-600' : 'text-gray-600'
                                  }`} />
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                    <span>{method.name}</span>
                                    {!method.available && (
                                      <Badge variant="outline" className="text-xs">
                                        Coming Soon
                                      </Badge>
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-600">{method.description}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                    <span>Processing: {method.processingTime}</span>
                                    {paymentAmount && (
                                      <span>Fees: KES {fees.toFixed(2)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* M-Pesa Phone Number */}
              {selectedMethod?.type === 'mpesa' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">M-Pesa Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="tel"
                          placeholder="254712345678"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your M-Pesa registered phone number
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Summary */}
              {selectedMethod && paymentAmount && (
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">KES {parseFloat(paymentAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fees:</span>
                        <span className="font-medium">KES {calculateFees(parseFloat(paymentAmount), selectedMethod).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>KES {(parseFloat(paymentAmount) + calculateFees(parseFloat(paymentAmount), selectedMethod)).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handlePayment}
                  disabled={!selectedMethod || !paymentAmount || isProcessing}
                  className="min-w-[150px]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Pay Securely
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const StatusIcon = getStatusIcon(transaction.status);
                  const statusConfig = STATUS_CONFIG[transaction.status];

                  return (
                    <Card key={transaction.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${statusConfig.color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </h4>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{transaction.method}</span>
                                <span>Ref: {transaction.reference}</span>
                                <span>{transaction.createdAt.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={statusConfig.color}>
                              {transaction.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="methods" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Secure Payment Processing</AlertTitle>
                <AlertDescription>
                  All payments are processed securely through encrypted channels. 
                  We support multiple payment methods for your convenience.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  
                  return (
                    <Card key={method.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <Icon className="h-6 w-6 text-gray-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{method.name}</h4>
                              <Badge variant={method.available ? "default" : "outline"}>
                                {method.available ? "Available" : "Coming Soon"}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 mb-3">{method.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Processing Time:</span>
                                <div className="font-medium">{method.processingTime}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Fees:</span>
                                <div className="font-medium">
                                  {method.fees.fixed > 0 && `KES ${method.fees.fixed} + `}
                                  {method.fees.percentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSystemInterface;