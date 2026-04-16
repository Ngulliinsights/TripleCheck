"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGuidance = PaymentGuidance;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("./ui/alert");
var badge_1 = require("./ui/badge");
var card_1 = require("./ui/card");
var paymentMethods = [
    {
        name: 'M-Pesa',
        description: 'Mobile money payment system',
        icon: lucide_react_1.CreditCard,
        suitableFor: [
            'Service fees (verification, listings)',
            'Small consultation fees',
            'Tour bookings',
            'Document authentication'
        ],
        notSuitableFor: [
            'Property purchases',
            'Property deposits',
            'Rent payments above KES 10,000',
            'Large service packages'
        ],
        warnings: [
            'Payments are irreversible',
            'No dispute resolution mechanism',
            'Limited to registered M-Pesa users'
        ],
        maxRecommendedAmount: 10000,
        color: 'yellow'
    },
    {
        name: 'Bank Transfer',
        description: 'Direct bank-to-bank transfer',
        icon: lucide_react_1.Building,
        suitableFor: [
            'Property purchases',
            'Large deposits',
            'High-value services',
            'Escrow transactions'
        ],
        advantages: [
            'Reversible with proper documentation',
            'Bank dispute resolution available',
            'Higher transaction limits',
            'Better audit trail'
        ],
        color: 'green'
    },
    {
        name: 'Escrow Service',
        description: 'Third-party secured payment holding',
        icon: lucide_react_1.Shield,
        suitableFor: [
            'Property purchases',
            'Large transactions',
            'International buyers',
            'High-risk transactions'
        ],
        advantages: [
            'Maximum security for both parties',
            'Professional dispute resolution',
            'Legal protection',
            'Conditional release of funds'
        ],
        color: 'blue'
    }
];
function PaymentGuidance(_a) {
    var _b = _a.transactionType, transactionType = _b === void 0 ? 'general' : _b, amount = _a.amount, _c = _a.showWarning, showWarning = _c === void 0 ? true : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    var getRecommendedMethods = function () {
        if (transactionType === 'property' || (amount && amount > 10000)) {
            return paymentMethods.filter(function (method) { return method.name !== 'M-Pesa'; });
        }
        return paymentMethods;
    };
    var recommendedMethods = getRecommendedMethods();
    return (<div className={"space-y-4 ".concat(className)}>
      {/* Critical Warning for Property Transactions */}
      {(transactionType === 'property' || (amount && amount > 10000)) && showWarning && (<alert_1.Alert className="border-red-200 bg-red-50">
          <lucide_react_1.AlertTriangle className="h-4 w-4 text-red-600"/>
          <alert_1.AlertTitle className="text-red-800">Important: Property Purchase Payments</alert_1.AlertTitle>
          <alert_1.AlertDescription className="text-red-700">
            For property purchases, deposits, or large transactions, use bank transfers or escrow services. 
            M-Pesa payments cannot be reversed and offer no dispute resolution.
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Payment Methods Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendedMethods.map(function (method) {
            var Icon = method.icon;
            var isRecommended = transactionType === 'service' ? method.name === 'M-Pesa' : method.name !== 'M-Pesa';
            return (<card_1.Card key={method.name} className={"relative ".concat(isRecommended ? 'ring-2 ring-green-200' : '')}>
              {isRecommended && (<badge_1.Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                  Recommended
                </badge_1.Badge>)}
              
              <card_1.CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className={"h-5 w-5 ".concat(method.color === 'green' ? 'text-green-600' :
                    method.color === 'yellow' ? 'text-yellow-600' :
                        'text-blue-600')}/>
                  <card_1.CardTitle className="text-lg">{method.name}</card_1.CardTitle>
                </div>
                <card_1.CardDescription>{method.description}</card_1.CardDescription>
              </card_1.CardHeader>
              
              <card_1.CardContent className="space-y-3">
                {/* Suitable For */}
                <div>
                  <h4 className="font-medium text-sm text-green-700 mb-2 flex items-center gap-1">
                    <lucide_react_1.CheckCircle className="h-3 w-3"/>
                    Suitable For:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {method.suitableFor.map(function (item, index) { return (<li key={index} className="flex items-start gap-1">
                        <span className="text-green-500 mt-1">•</span>
                        {item}
                      </li>); })}
                  </ul>
                </div>

                {/* Not Suitable For */}
                {method.notSuitableFor && (<div>
                    <h4 className="font-medium text-sm text-red-700 mb-2 flex items-center gap-1">
                      <lucide_react_1.XCircle className="h-3 w-3"/>
                      Not Suitable For:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {method.notSuitableFor.map(function (item, index) { return (<li key={index} className="flex items-start gap-1">
                          <span className="text-red-500 mt-1">•</span>
                          {item}
                        </li>); })}
                    </ul>
                  </div>)}

                {/* Advantages */}
                {method.advantages && (<div>
                    <h4 className="font-medium text-sm text-blue-700 mb-2">Advantages:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {method.advantages.map(function (item, index) { return (<li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          {item}
                        </li>); })}
                    </ul>
                  </div>)}

                {/* Warnings */}
                {method.warnings && (<div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                    <h4 className="font-medium text-sm text-yellow-800 mb-1 flex items-center gap-1">
                      <lucide_react_1.AlertTriangle className="h-3 w-3"/>
                      Important Warnings:
                    </h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {method.warnings.map(function (item, index) { return (<li key={index} className="flex items-start gap-1">
                          <span className="text-yellow-600 mt-1">•</span>
                          {item}
                        </li>); })}
                    </ul>
                  </div>)}

                {/* Max Amount */}
                {method.maxRecommendedAmount && (<div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Max recommended: KES {method.maxRecommendedAmount.toLocaleString()}
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>);
        })}
      </div>

      {/* General Recommendation */}
      <alert_1.Alert className="border-blue-200 bg-blue-50">
        <lucide_react_1.Shield className="h-4 w-4 text-blue-600"/>
        <alert_1.AlertTitle className="text-blue-800">Payment Recommendation</alert_1.AlertTitle>
        <alert_1.AlertDescription className="text-blue-700">
          {transactionType === 'property' || (amount && amount > 10000)
            ? 'For your security, we strongly recommend using bank transfers or escrow services for this transaction.'
            : 'Use M-Pesa only for service fees under KES 10,000. For property transactions, always use bank transfers or escrow services.'}
        </alert_1.AlertDescription>
      </alert_1.Alert>
    </div>);
}
exports.default = PaymentGuidance;
