import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Users, 
  Calendar, 
  Clock, 
  Handshake, 
  ArrowRight, 
  AlertTriangle,
  Loader2,
  Shield,
  Star,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

export default function DMInviteLanding() {
  const [, params] = useRoute('/invite/:token');
  const [, setLocation] = useLocation();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accepting, setAccepting] = useState(false);

  const token = params?.token;

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(`/api/invitations/validate/${token}`);
      
      if (response.valid) {
        setInvitation(response.invitation);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to validate invitation. Please check the link and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      setAccepting(true);
      
      // Update invitation status
      await apiRequest(`/api/invitations/${invitation.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' })
      });

      // Redirect to onboarding flow (T&C → Calendar → Dashboard)
      setLocation('/signup/decision-maker/personal-info');
    } catch (error) {
      setError('Failed to accept invitation. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    try {
      // Update invitation status
      await apiRequest(`/api/invitations/${invitation.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'declined' })
      });

      // Show decline message and redirect
      setError('You have declined this invitation.');
      setTimeout(() => {
        setLocation('/');
      }, 3000);
    } catch (error) {
      setError('Failed to decline invitation. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Validating your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="mr-2" size={24} />
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/')}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Invitation Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl font-bold flex items-center">
                  <Users className="mr-3" size={28} />
                  You're Invited to Join Naeborly!
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Invitation Details */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Hello {invitation?.decisionMakerName}!
                    </h2>
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 text-sm font-semibold">
                      DECISION MAKER
                    </Badge>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          <span className="text-blue-600">{invitation?.salesRepName}</span> from{' '}
                          <span className="font-semibold">{invitation?.salesRepCompany}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          has invited you to connect on our professional networking platform
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg">What happens when you join:</h3>
                    
                    <div className="grid gap-4">
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1">
                          <CheckCircle className="text-green-600" size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Schedule Professional Calls</h4>
                          <p className="text-sm text-gray-600">Connect with verified sales representatives for meaningful business conversations</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-1">
                          <Calendar className="text-purple-600" size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Calendar Integration</h4>
                          <p className="text-sm text-gray-600">Seamlessly sync with Google Calendar for easy scheduling and reminders</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
                          <Shield className="text-blue-600" size={16} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Quality Assurance</h4>
                          <p className="text-sm text-gray-600">Rate and provide feedback to maintain high-quality interactions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleAcceptInvitation}
                      disabled={accepting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200"
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          Accept Invitation
                          <ArrowRight className="ml-2" size={18} />
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleDeclineInvitation}
                      disabled={accepting}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-6"
                    >
                      Decline
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    By accepting, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Sidebar */}
          <div className="space-y-6">
            {/* Platform Benefits */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Star className="text-yellow-500 mr-2" size={20} />
                  Platform Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span>Verified sales representatives</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span>Secure and professional environment</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span>Feedback and rating system</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span>Google Calendar integration</span>
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="text-green-500 mr-2" size={16} />
                  <span>Quality assurance monitoring</span>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="text-blue-500 mr-2" size={20} />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-600 font-semibold text-xs">
                    1
                  </div>
                  <span>Accept invitation</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-gray-600 font-semibold text-xs">
                    2
                  </div>
                  <span>Complete profile setup</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-gray-600 font-semibold text-xs">
                    3
                  </div>
                  <span>Connect your calendar</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-gray-600 font-semibold text-xs">
                    4
                  </div>
                  <span>Access your dashboard</span>
                </div>
              </CardContent>
            </Card>

            {/* Time Estimate */}
            <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Clock className="mx-auto mb-2 text-green-600" size={24} />
                <p className="text-sm font-medium text-green-800">Setup takes just 3-5 minutes</p>
                <p className="text-xs text-green-600 mt-1">Get started with professional networking today</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}