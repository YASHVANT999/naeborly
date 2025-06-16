import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, XCircle, Info, Clock, TrendingUp, TrendingDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const flagColors = {
  green: {
    bg: "bg-green-100",
    border: "border-green-300",
    text: "text-green-800",
    icon: CheckCircle,
    status: "Good Standing",
    description: "No compliance issues detected"
  },
  amber: {
    bg: "bg-amber-100", 
    border: "border-amber-300",
    text: "text-amber-800",
    icon: AlertTriangle,
    status: "Warning",
    description: "Attention required - potential issues detected"
  },
  red: {
    bg: "bg-red-100",
    border: "border-red-300", 
    text: "text-red-800",
    icon: XCircle,
    status: "At Risk",
    description: "Immediate action required - suspension risk"
  }
};

export default function TrafficLightIndicator({ 
  flag = 'green', 
  reason = '', 
  severity = 'low',
  metrics = {},
  history = [],
  userType = 'sales_rep',
  userName = '',
  compact = false,
  showDetails = true
}) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const flagConfig = flagColors[flag] || flagColors.green;
  const IconComponent = flagConfig.icon;

  const getMetricTrend = (metric, value) => {
    // Simple trend logic - in real system would compare with historical data
    if (metric === 'complianceScore') {
      return value >= 80 ? 'up' : value >= 60 ? 'stable' : 'down';
    }
    if (metric === 'missedFollowups' || metric === 'invalidLeads') {
      return value === 0 ? 'up' : value <= 2 ? 'stable' : 'down';
    }
    return 'stable';
  };

  const formatMetricName = (metric) => {
    const names = {
      missedFollowups: 'Missed Follow-ups',
      invalidLeads: 'Invalid Leads',
      complianceScore: 'Compliance Score',
      callsScheduled: 'Calls Scheduled',
      callsCompleted: 'Calls Completed',
      invitationsSent: 'Invitations Sent',
      invitationsAccepted: 'Invitations Accepted',
      responseTime: 'Response Time (hours)'
    };
    return names[metric] || metric;
  };

  const getActionItems = () => {
    const actions = [];
    
    if (flag === 'red') {
      actions.push("Contact your supervisor immediately");
      actions.push("Review and address compliance violations");
      if (metrics.missedFollowups > 3) actions.push("Follow up on pending leads");
      if (metrics.complianceScore < 50) actions.push("Complete compliance training");
    } else if (flag === 'amber') {
      if (metrics.missedFollowups > 0) actions.push("Follow up on missed opportunities");
      if (metrics.complianceScore < 70) actions.push("Improve lead quality and response times");
      actions.push("Monitor your performance metrics closely");
    } else {
      actions.push("Continue maintaining excellent standards");
      actions.push("Keep up the good work!");
    }
    
    return actions;
  };

  const getRiskImpact = () => {
    if (flag === 'red') {
      return userType === 'sales_rep' 
        ? "Account suspension risk within 7 days if issues persist"
        : "Platform access may be restricted pending review";
    } else if (flag === 'amber') {
      return userType === 'sales_rep'
        ? "Performance review required if metrics don't improve within 14 days"
        : "Response required within 5 business days";
    }
    return "No immediate action required - continue current practices";
  };

  if (compact) {
    return (
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 w-8 p-0 rounded-full border-2",
              flagConfig.bg,
              flagConfig.border
            )}
          >
            <IconComponent className={cn("h-4 w-4", flagConfig.text)} />
          </Button>
        </DialogTrigger>
        {showDetails && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <IconComponent className={cn("h-5 w-5", flagConfig.text)} />
                <span>Status: {flagConfig.status}</span>
              </DialogTitle>
              <DialogDescription>
                {userName && `${userName} - `}{flagConfig.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {reason && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Current Issue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{reason}</p>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{getRiskImpact()}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recommended Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {getActionItems().map((action, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        )}
      </Dialog>
    );
  }

  return (
    <Card className={cn("border-2", flagConfig.border, flagConfig.bg)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconComponent className={cn("h-5 w-5", flagConfig.text)} />
            <span className={flagConfig.text}>Suspension Risk Status</span>
          </div>
          <Badge className={cn(flagConfig.bg, flagConfig.text, "border-current")}>
            {flagConfig.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          {flagConfig.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {reason && (
          <div className="p-3 bg-white/50 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Current Issue</p>
                <p className="text-sm text-gray-600">{reason}</p>
              </div>
            </div>
          </div>
        )}
        
        {Object.keys(metrics).length > 0 && showDetails && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Performance Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(metrics).map(([key, value]) => {
                const trend = getMetricTrend(key, value);
                const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Clock;
                const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
                
                return (
                  <div key={key} className="bg-white/50 p-2 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{formatMetricName(key)}</span>
                      <TrendIcon className={cn("h-3 w-3", trendColor)} />
                    </div>
                    <p className="text-sm font-medium">
                      {typeof value === 'number' ? 
                        (key === 'complianceScore' ? `${value}%` : value) : 
                        value
                      }
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Impact Assessment</h4>
          <p className="text-sm text-gray-600">{getRiskImpact()}</p>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recommended Actions</h4>
          <ul className="text-sm space-y-1">
            {getActionItems().map((action, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {showDetails && (
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                View History & Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detailed Flag History & Metrics</DialogTitle>
                <DialogDescription>
                  Complete timeline and performance analysis
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {history.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Recent History</h4>
                    <div className="space-y-2">
                      {history.slice(0, 5).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              entry.newFlag === 'green' ? 'bg-green-500' :
                              entry.newFlag === 'amber' ? 'bg-amber-500' : 'bg-red-500'
                            )} />
                            <span className="text-sm">{entry.reason}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Performance Breakdown</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(metrics).map(([key, value]) => (
                      <Card key={key}>
                        <CardContent className="p-3">
                          <p className="text-xs text-gray-600">{formatMetricName(key)}</p>
                          <p className="text-lg font-semibold">
                            {typeof value === 'number' ? 
                              (key === 'complianceScore' ? `${value}%` : value) : 
                              value
                            }
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}