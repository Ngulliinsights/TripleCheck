"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptedImagesStep = AdaptedImagesStep;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../../../../local/components/ui/badge");
var button_1 = require("../../../../local/components/ui/button");
function AdaptedImagesStep(_a) {
    var _b, _c, _d, _e, _f, _g;
    var data = _a.data, onUpdate = _a.onUpdate, onValidation = _a.onValidation;
    // Validate step whenever data changes
    (0, react_1.useEffect)(function () {
        var _a, _b;
        var isValid = (((_a = data.images) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0 || (((_b = data.imageUrls) === null || _b === void 0 ? void 0 : _b.length) || 0) > 0;
        onValidation === null || onValidation === void 0 ? void 0 : onValidation(isValid);
    }, [data.images, data.imageUrls, onValidation]);
    return (<div className="space-y-6">
      <div className="space-y-4">
        <h4 className="font-medium">Property Photos *</h4>
        <p className="text-sm text-muted-foreground">
          Upload high-quality photos of your property. The first photo will be used as the main image.
        </p>
        
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <lucide_react_1.Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
          <p className="text-muted-foreground mb-4">
            Drag and drop photos here, or click to browse
          </p>
          <button_1.Button variant="outline">
            <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
            Choose Photos
          </button_1.Button>
        </div>

        {(((_b = data.images) === null || _b === void 0 ? void 0 : _b.length) || 0) > 0 && (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(_c = data.images) === null || _c === void 0 ? void 0 : _c.map(function (image, index) { return (<div key={index} className="relative">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <lucide_react_1.Camera className="h-8 w-8 text-muted-foreground"/>
                </div>
                {index === 0 && (<badge_1.Badge className="absolute top-2 left-2 text-xs">Main</badge_1.Badge>)}
              </div>); })}
          </div>)}

        {(((_d = data.imageUrls) === null || _d === void 0 ? void 0 : _d.length) || 0) > 0 && (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(_e = data.imageUrls) === null || _e === void 0 ? void 0 : _e.map(function (url, index) { return (<div key={index} className="relative">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  <img src={url} alt={"Property ".concat(index + 1)} className="w-full h-full object-cover"/>
                </div>
                {index === 0 && (<badge_1.Badge className="absolute top-2 left-2 text-xs">Main</badge_1.Badge>)}
              </div>); })}
          </div>)}
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Additional Media</h4>
        <p className="text-sm text-muted-foreground">
          Upload videos, floor plans, or other relevant documents.
        </p>
        
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
          <lucide_react_1.FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2"/>
          <button_1.Button variant="outline" size="sm">
            <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
            Upload Files
          </button_1.Button>
        </div>

        {(((_f = data.documents) === null || _f === void 0 ? void 0 : _f.length) || 0) > 0 && (<div className="space-y-2">
            <h5 className="font-medium text-sm">Uploaded Documents</h5>
            <div className="space-y-1">
              {(_g = data.documents) === null || _g === void 0 ? void 0 : _g.map(function (doc, index) { return (<div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <lucide_react_1.FileText className="h-4 w-4"/>
                  <span className="text-sm">{doc.name}</span>
                </div>); })}
            </div>
          </div>)}
      </div>
    </div>);
}
