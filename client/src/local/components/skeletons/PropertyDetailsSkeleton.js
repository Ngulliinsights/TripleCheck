"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyDetailsSkeleton = PropertyDetailsSkeleton;
var react_1 = require("react");
var card_1 = require("../ui/card");
var skeleton_1 = require("../ui/skeleton");
/**
 * Loading skeleton for property details page
 * Provides a consistent loading experience while property data is being fetched
 */
function PropertyDetailsSkeleton() {
    return (<div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <skeleton_1.Skeleton className="h-8 w-3/4"/>
            <skeleton_1.Skeleton className="h-4 w-1/2"/>
          </div>
          <div className="text-right space-y-2">
            <skeleton_1.Skeleton className="h-8 w-32"/>
            <skeleton_1.Skeleton className="h-6 w-20"/>
          </div>
        </div>

        {/* Features */}
        <div className="flex gap-4">
          <skeleton_1.Skeleton className="h-4 w-20"/>
          <skeleton_1.Skeleton className="h-4 w-20"/>
          <skeleton_1.Skeleton className="h-4 w-24"/>
          <skeleton_1.Skeleton className="h-4 w-28"/>
        </div>
      </div>

      {/* Image Gallery */}
      <card_1.Card>
        <card_1.CardContent className="p-0">
          <skeleton_1.Skeleton className="aspect-video w-full"/>
        </card_1.CardContent>
      </card_1.Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <card_1.Card>
            <card_1.CardHeader>
              <skeleton_1.Skeleton className="h-6 w-32"/>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-2">
              <skeleton_1.Skeleton className="h-4 w-full"/>
              <skeleton_1.Skeleton className="h-4 w-full"/>
              <skeleton_1.Skeleton className="h-4 w-3/4"/>
            </card_1.CardContent>
          </card_1.Card>

          {/* Features */}
          <card_1.Card>
            <card_1.CardHeader>
              <skeleton_1.Skeleton className="h-6 w-40"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map(function (_, i) { return (<div key={i} className="flex items-center gap-2">
                    <skeleton_1.Skeleton className="w-2 h-2 rounded-full"/>
                    <skeleton_1.Skeleton className="h-4 w-20"/>
                  </div>); })}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Photo Management */}
          <card_1.Card>
            <card_1.CardHeader>
              <skeleton_1.Skeleton className="h-6 w-36"/>
            </card_1.CardHeader>
            <card_1.CardContent>
              <skeleton_1.Skeleton className="h-10 w-full"/>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Agent */}
          <card_1.Card>
            <card_1.CardHeader>
              <skeleton_1.Skeleton className="h-6 w-32"/>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <skeleton_1.Skeleton className="w-12 h-12 rounded-full"/>
                <div className="space-y-2">
                  <skeleton_1.Skeleton className="h-4 w-24"/>
                  <skeleton_1.Skeleton className="h-3 w-20"/>
                </div>
              </div>
              <div className="space-y-2">
                <skeleton_1.Skeleton className="h-10 w-full"/>
                <skeleton_1.Skeleton className="h-10 w-full"/>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Property Stats */}
          <card_1.Card>
            <card_1.CardHeader>
              <skeleton_1.Skeleton className="h-6 w-36"/>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-3">
              {Array.from({ length: 4 }).map(function (_, i) { return (<div key={i} className="flex justify-between">
                  <skeleton_1.Skeleton className="h-4 w-20"/>
                  <skeleton_1.Skeleton className="h-4 w-16"/>
                </div>); })}
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
exports.default = PropertyDetailsSkeleton;
