"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptedPricingStep = AdaptedPricingStep;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var input_1 = require("../../../../local/components/ui/input");
var label_1 = require("../../../../local/components/ui/label");
var card_1 = require("../../../../local/components/ui/card");
function AdaptedPricingStep(_a) {
    var data = _a.data, onUpdate = _a.onUpdate, onValidation = _a.onValidation;
    // Validate step whenever data changes
    (0, react_1.useEffect)(function () {
        var isValid = data.price > 0;
        onValidation === null || onValidation === void 0 ? void 0 : onValidation(isValid);
    }, [data.price, onValidation]);
    return (<div className="space-y-6">
      <div className="space-y-2">
        <label_1.Label htmlFor="price">Price (KSH) *</label_1.Label>
        <div className="relative">
          <lucide_react_1.DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input_1.Input id="price" type="number" placeholder="e.g., 15000000" value={data.price || ''} onChange={function (e) { return onUpdate({ price: Number(e.target.value) || 0 }); }} className="pl-10"/>
        </div>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="priceType">Listing Type</label_1.Label>
        <select id="priceType" value={data.priceType} onChange={function (e) { return onUpdate({ priceType: e.target.value }); }} className="w-full p-2 border border-input rounded-md bg-background">
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2 text-lg">
              <lucide_react_1.TrendingUp className="h-5 w-5"/>
              Market Insights
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Average price in this area: KSH 12,500,000
              </p>
              <p className="text-sm text-muted-foreground">
                Price per sqm: KSH 83,333
              </p>
              <p className="text-sm text-green-600">
                Your price is competitive ✓
              </p>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2 text-lg">
              <lucide_react_1.BarChart3 className="h-5 w-5"/>
              Pricing Tips
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Research similar properties in your area</li>
              <li>• Consider recent market trends</li>
              <li>• Factor in unique property features</li>
              <li>• Be open to reasonable negotiations</li>
            </ul>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Pricing Strategy</h4>
        <p className="text-sm text-blue-800">
          Based on your property details and market data, your pricing appears to be in line with similar properties. 
          Consider highlighting unique features to justify premium pricing.
        </p>
      </div>
    </div>);
}
