"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsDashboard = AnalyticsDashboard;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var recharts_1 = require("recharts");
var card_1 = require("../../local/components/ui/card");
function AnalyticsDashboard(_a) {
    var data = _a.data, _b = _a.isLoading, isLoading = _b === void 0 ? false : _b;
    if (isLoading) {
        return (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {__spreadArray([], Array(8), true).map(function (_, i) { return (<card_1.Card key={i} className="animate-pulse">
            <card_1.CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </card_1.CardContent>
          </card_1.Card>); })}
      </div>);
    }
    var MetricCard = function (_a) {
        var title = _a.title, value = _a.value, change = _a.change, Icon = _a.icon, trend = _a.trend;
        return (<card_1.Card>
      <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <card_1.CardTitle className="text-sm font-medium">{title}</card_1.CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground"/>
      </card_1.CardHeader>
      <card_1.CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {trend === 'up' ? (<lucide_react_1.TrendingUp className="h-3 w-3 text-green-500 mr-1"/>) : (<lucide_react_1.TrendingDown className="h-3 w-3 text-red-500 mr-1"/>)}
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(change)}%
          </span>
          <span className="ml-1">from last month</span>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
    };
    return (<div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Users" value={data.totalUsers.toLocaleString()} change={data.userGrowth} icon={lucide_react_1.Users} trend={data.userGrowth >= 0 ? 'up' : 'down'}/>
        <MetricCard title="Total Properties" value={data.totalProperties.toLocaleString()} change={data.propertyGrowth} icon={lucide_react_1.Home} trend={data.propertyGrowth >= 0 ? 'up' : 'down'}/>
        <MetricCard title="Verifications" value={data.totalVerifications.toLocaleString()} change={data.verificationRate} icon={lucide_react_1.Shield} trend={data.verificationRate >= 0 ? 'up' : 'down'}/>
        <MetricCard title="Messages" value={data.totalMessages.toLocaleString()} change={data.responseRate} icon={lucide_react_1.MessageSquare} trend={data.responseRate >= 0 ? 'up' : 'down'}/>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Growth Chart */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Monthly Growth</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <recharts_1.ResponsiveContainer width="100%" height={300}>
              <recharts_1.LineChart data={data.monthlyData}>
                <recharts_1.CartesianGrid strokeDasharray="3 3"/>
                <recharts_1.XAxis dataKey="month"/>
                <recharts_1.YAxis />
                <recharts_1.Tooltip />
                <recharts_1.Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Users"/>
                <recharts_1.Line type="monotone" dataKey="properties" stroke="#10b981" strokeWidth={2} name="Properties"/>
                <recharts_1.Line type="monotone" dataKey="verifications" stroke="#f59e0b" strokeWidth={2} name="Verifications"/>
              </recharts_1.LineChart>
            </recharts_1.ResponsiveContainer>
          </card_1.CardContent>
        </card_1.Card>

        {/* Property Types Distribution */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Property Types</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <recharts_1.ResponsiveContainer width="100%" height={300}>
              <recharts_1.PieChart>
                <recharts_1.Pie data={data.propertyTypes} cx="50%" cy="50%" labelLine={false} label={function (_a) {
        var name = _a.name, percent = _a.percent;
        return "".concat(name, " ").concat(((percent || 0) * 100).toFixed(0), "%");
    }} outerRadius={80} fill="#8884d8" dataKey="value">
                  {data.propertyTypes.map(function (entry, index) { return (<recharts_1.Cell key={"cell-".concat(index)} fill={entry.color}/>); })}
                </recharts_1.Pie>
                <recharts_1.Tooltip />
              </recharts_1.PieChart>
            </recharts_1.ResponsiveContainer>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Trust Score Distribution */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Trust Score Distribution</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <recharts_1.ResponsiveContainer width="100%" height={300}>
            <recharts_1.BarChart data={data.trustScoreDistribution}>
              <recharts_1.CartesianGrid strokeDasharray="3 3"/>
              <recharts_1.XAxis dataKey="range"/>
              <recharts_1.YAxis />
              <recharts_1.Tooltip />
              <recharts_1.Bar dataKey="count" fill="#3b82f6"/>
            </recharts_1.BarChart>
          </recharts_1.ResponsiveContainer>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
