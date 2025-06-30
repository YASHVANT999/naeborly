import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Users, 
  Calendar, 
  Plus, 
  TrendingUp,
  Lock,
  CalendarPlus,
  Loader2,
  User,
  Clock,
  Menu,
  Search,
  MapPin,
  Star,
  Crown,
  BarChart3,
  Settings,
  HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CalendarBooking from "@/components/CalendarBooking";
import FlagsBadge from "@/components/FlagsBadge";
import SuspensionAlert from "@/components/SuspensionAlert";
import BookingModal from "@/components/BookingModal";

export default function SalesDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedDecisionMaker, setSelectedDecisionMaker] = useState(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedCompanySize, setSelectedCompanySize] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedEngagement, setSelectedEngagement] = useState('');

  // Fetch sales rep's invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['/api/sales-rep/invitations'],
    enabled: !!user?.id
  });

  // Fetch sales rep's calls
  const { data: calls = [], isLoading: callsLoading } = useQuery({
    queryKey: ['/api/sales-rep/calls'],
    enabled: !!user?.id
  });

  // Fetch sales rep's metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/sales-rep/metrics'],
    enabled: !!user?.id
  });

  // Fetch suspension status
  const { data: suspensionStatus } = useQuery({
    queryKey: ['/api/sales-rep/suspension-status'],
    retry: false
  });

  // New queries for credit system
  const { data: creditsData, isLoading: creditsLoading } = useQuery({
    queryKey: ['/api/sales-rep/credits']
  });

  const { data: databaseAccess, isLoading: databaseAccessLoading } = useQuery({
    queryKey: ['/api/sales-rep/database-access']
  });

  const hasAccess = databaseAccess?.hasAccess;

  const { data: gatedDMs, isLoading: gatedDMsLoading, error: gatedDMsError } = useQuery({
    queryKey: ['/api/sales-rep/available-dms-gated'],
    enabled: hasAccess,
    retry: 3,
    refetchOnWindowFocus: false
  });

  // Debug logging
  console.log('Gated DMs Debug:', {
    hasAccess,
    gatedDMsLoading,
    gatedDMs,
    gatedDMsError,
    dmsLength: gatedDMs?.dms?.length
  });

  // Force show DM list for debugging
  const shouldShowDMList = true;
  
  // Calculate total credits from API data
  const totalCredits = creditsData?.credits?.reduce((sum, credit) => sum + (credit.amount || 0), 0) || 0;

  const simulateAcceptanceMutation = useMutation({
    mutationFn: async () => {
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/invitations'] });
      toast({
        title: "Database Unlocked!",
        description: "You can now browse decision makers",
      });
    }
  });

  const simulateOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/simulate/dm-onboarding-complete', {
        method: 'POST',
        body: JSON.stringify({
          dmEmail: 'dm@techize.com',
          repId: user?.id || user?._id
        })
      });
      return response;
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/credits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/database-access'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/available-dms-gated'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/metrics'] });
      toast({
        title: "Success!",
        description: data.message || "DM onboarding completed and credit awarded!",
      });
    },
    onError: (error) => {
      console.error('Onboarding simulation error:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to simulate onboarding completion",
        variant: "destructive",
      });
    }
  });

  // Booking modal handlers
  const handleOpenBookingModal = (decisionMaker) => {
    setSelectedDecisionMaker(decisionMaker);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    setSelectedDecisionMaker(null);
  };

  const handleBookingConfirm = async (bookingData) => {
    try {
      // Here you would make an API call to book the call
      // For now, we'll just show a success message
      toast({
        title: "Call Booked Successfully!",
        description: `Your call with ${bookingData.decisionMaker.name} is scheduled for ${bookingData.formattedDateTime}`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/calls'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-rep/metrics'] });
      
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Unable to book the call. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter functions
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedIndustry('');
    setSelectedCompanySize('');
    setSelectedRating('');
    setSelectedEngagement('');
  };

  const filteredDMs = gatedDMs?.dms ? gatedDMs.dms.filter(dm => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        dm.name?.toLowerCase().includes(searchLower) ||
        dm.company?.toLowerCase().includes(searchLower) ||
        dm.jobTitle?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Industry filter
    if (selectedIndustry && selectedIndustry !== 'Industry') {
      if (dm.industry !== selectedIndustry) return false;
    }

    // Company size filter (mock data - would come from actual DM data)
    if (selectedCompanySize && selectedCompanySize !== 'Company Size') {
      // This would be based on actual company size data
      // For now, we'll use a mock implementation
    }

    // Rating filter (using engagement score as proxy)
    if (selectedRating && selectedRating !== 'Rating') {
      const ratingThreshold = parseFloat(selectedRating.replace('+', '')) * 20; // Convert rating to percentage
      if (dm.engagementScore < ratingThreshold) return false;
    }

    // Engagement filter
    if (selectedEngagement && selectedEngagement !== 'Engagement') {
      const engagementThreshold = parseFloat(selectedEngagement.replace('%+', ''));
      if (dm.engagementScore < engagementThreshold) return false;
    }

    return true;
  }) : [];

  // Get unique industries for filter dropdown
  const availableIndustries = [...new Set(gatedDMs?.dms?.map(dm => dm.industry).filter(Boolean))];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPackageDisplayName = (packageType) => {
    const packageNames = {
      'free': 'Free • 1 DM/month',
      'pro': 'Pro • 10 DM/month',
      'pro-team': 'Pro Team • 50 DM/month',
      'enterprise': 'Enterprise • 500 DM/month'
    };
    return packageNames[packageType] || 'Free • 1 DM/month';
  };

  if (!user || metricsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const databaseUnlocked = metrics?.databaseUnlocked || false;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Rep Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                {getPackageDisplayName(user?.packageType)}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                {metrics?.standing === 'good' ? 'Good Standing' : 'Standing: ' + metrics?.standing}
              </Badge>
              <FlagsBadge />
              <div className="hidden sm:flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/analytics'}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/profile'}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </div>
              <div className="sm:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Call Credits</p>
                  <p className="text-2xl font-bold">{metrics?.callCredits || 0}</p>
                  <p className="text-blue-100 text-xs">this month</p>
                </div>
                <Phone className="text-blue-200 w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">DM Invitations</p>
                  <p className="text-2xl font-bold">{metrics?.dmInvitations || 0}/{metrics?.maxDmInvitations || 1}</p>
                </div>
                <Users className="text-green-200 w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Upcoming Calls</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.upcomingCalls || 0}</p>
                </div>
                <Calendar className="text-gray-400 w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Accepted Invitations</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.acceptedInvitations || 0}</p>
                </div>
                <Plus className="text-gray-400 w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.successRate ? `${metrics.successRate}%` : '-'}</p>
                </div>
                <TrendingUp className="text-gray-400 w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Database Access Section */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {!hasAccess ? (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center">
                    <Lock className="text-blue-500 mr-3 w-5 h-5" />
                    Database Access Locked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="text-gray-400 w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Waiting for DM Acceptance</h3>
                    <p className="text-gray-600 mb-6">
                      At least one of your invited decision makers must accept to unlock the database.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Invitation Status:</h4>
                      
                      <div className="space-y-3">
                        {invitations.length > 0 ? invitations.map((invitation) => (
                          <div key={invitation._id || invitation.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                invitation.status === 'accepted' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {getInitials(invitation.decisionMakerName || invitation.name || 'DM')}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{invitation.decisionMakerName || invitation.name || 'Decision Maker'}</p>
                                <p className="text-sm text-gray-500">{invitation.decisionMakerEmail || invitation.email || 'email@example.com'}</p>
                              </div>
                            </div>
                            {getStatusBadge(invitation.status)}
                          </div>
                        )) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500">No invitations sent yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button 
                        onClick={() => simulateAcceptanceMutation.mutate()}
                        disabled={simulateAcceptanceMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 w-full"
                      >
                        {simulateAcceptanceMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Simulating...
                          </>
                        ) : (
                          "Simulate DM Acceptance (Demo)"
                        )}
                      </Button>
                      
                      <Button 
                        onClick={() => simulateOnboardingMutation.mutate()}
                        disabled={simulateOnboardingMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 w-full"
                      >
                        {simulateOnboardingMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Completing...
                          </>
                        ) : (
                          "Complete DM Onboarding (Award Credit)"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4">
                  {/* Header with Search and Filters */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-600 text-sm font-medium">
                          {filteredDMs.length} of {gatedDMs?.dms?.length || 0} Decision Makers
                          {(searchTerm || selectedIndustry || selectedRating || selectedEngagement) && ' (filtered)'}
                        </span>
                      </div>
                      <button 
                        onClick={clearAllFilters}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        <span>Clear Filters</span>
                      </button>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, company, or title..."
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>
                    
                    {/* Filter Dropdowns */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <select 
                        value={selectedIndustry} 
                        onChange={(e) => setSelectedIndustry(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      >
                        <option value="">Industry</option>
                        {availableIndustries.map(industry => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                      <select 
                        value={selectedCompanySize} 
                        onChange={(e) => setSelectedCompanySize(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      >
                        <option value="">Company Size</option>
                        <option value="1-50">1-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-1000">201-1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                      <select 
                        value={selectedRating} 
                        onChange={(e) => setSelectedRating(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      >
                        <option value="">Rating</option>
                        <option value="4.5+">4.5+</option>
                        <option value="4.0+">4.0+</option>
                        <option value="3.5+">3.5+</option>
                      </select>
                      <select 
                        value={selectedEngagement} 
                        onChange={(e) => setSelectedEngagement(e.target.value)}
                        className="bg-white border border-gray-300 text-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      >
                        <option value="">Engagement</option>
                        <option value="90+">90%+</option>
                        <option value="80+">80%+</option>
                        <option value="70+">70%+</option>
                      </select>
                    </div>
                  </div>

                  {gatedDMsLoading ? (
                    <div className="text-center py-6">
                      <Loader2 className="animate-spin h-6 w-6 mx-auto mb-3 text-blue-500" />
                      <p className="text-gray-600">Loading decision makers...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredDMs && Array.isArray(filteredDMs) && filteredDMs.length > 0 ? 
                       filteredDMs.slice(0, 6).map((dm) => (
                        <div key={dm.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                          {/* Status Indicators */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-gray-500">3 calls available</span>
                            </div>
                          </div>
                          
                          {/* Title and Company */}
                          <div className="mb-2">
                            <h3 className="text-gray-900 font-semibold text-base mb-1">
                              {dm.jobTitle || dm.name || 'Chief Revenue Officer'}
                            </h3>
                            <p className="text-blue-600 text-sm font-medium">{dm.company}</p>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-center text-gray-600 text-sm mb-2">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>San Francisco, CA</span>
                          </div>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                              {dm.industry}
                            </span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                              201-1000
                            </span>
                          </div>
                          
                          {/* Rating and Engagement */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-500 mr-1 fill-current" />
                                <span className="text-gray-900 font-medium">4.8</span>
                              </div>
                              <span className="text-green-600 text-sm font-medium">{dm.engagementScore}% engagement</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${dm.engagementScore}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-3 rounded-lg text-sm transition-colors font-medium">
                              View Contact
                            </button>
                            <button 
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm transition-colors font-medium"
                              onClick={() => handleOpenBookingModal(dm)}
                            >
                              Request Call
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-full text-center py-6">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-gray-400" />
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-2">No Decision Makers Available</h3>
                          <p className="text-gray-600 text-sm">Check back later for new opportunities</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 order-1 lg:order-2">
            {/* Package Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-gray-900">Package Status</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Current Plan</span>
                  <Badge className="bg-purple-100 text-purple-700">Premium</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Call Credits</span>
                    <span className="text-gray-900 font-medium">{metrics?.callCredits || 0}/{metrics?.maxCallCredits || 500}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${metrics?.maxCallCredits ? ((metrics?.callCredits || 0) / metrics.maxCallCredits) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Email Credits</span>
                    <span className="text-gray-900 font-medium">25/50</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
            
            {/* Your Active DMs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-gray-900">Your Active DMs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {calls && calls.length > 0 ? calls.slice(0, 3).map((call) => (
                  <div key={call.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-900 font-medium text-sm">
                          {call.decisionMakerName || 'Sarah Chen'}
                        </span>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">upcoming</Badge>
                      </div>
                      <div className="text-gray-600 text-xs">TechCorp Inc</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(call.scheduledAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })} • {new Date(call.scheduledAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="w-2 h-2 bg-green-500 rounded-full mb-1"></div>
                      <div className="text-green-600 text-xs font-medium">92%</div>
                    </div>
                  </div>
                )) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900 font-medium text-sm">Sarah Chen</span>
                          <Badge className="bg-blue-100 text-blue-700 text-xs">upcoming</Badge>
                        </div>
                        <div className="text-gray-600 text-xs">TechCorp Inc</div>
                        <div className="text-gray-500 text-xs">Today • 2:00 PM</div>
                      </div>
                      <div className="text-right">
                        <div className="w-2 h-2 bg-green-500 rounded-full mb-1"></div>
                        <div className="text-green-600 text-xs font-medium">92%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900 font-medium text-sm">Mike Rodriguez</span>
                          <Badge className="bg-green-100 text-green-700 text-xs">completed</Badge>
                        </div>
                        <div className="text-gray-600 text-xs">DataFlow Solutions</div>
                        <div className="text-gray-500 text-xs">Yesterday</div>
                      </div>
                      <div className="text-right">
                        <div className="w-2 h-2 bg-green-500 rounded-full mb-1"></div>
                        <div className="text-green-600 text-xs font-medium">78%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-900 font-medium text-sm">Emily Johnson</span>
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs">booked</Badge>
                        </div>
                        <div className="text-gray-600 text-xs">InnovatePlus</div>
                        <div className="text-gray-500 text-xs">Tomorrow • 10:00 AM</div>
                      </div>
                      <div className="text-right">
                        <div className="w-2 h-2 bg-gray-400 rounded-full mb-1"></div>
                        <div className="text-gray-500 text-xs">--</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline"
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  onClick={() => window.location.href = '/analytics'}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
                <Button 
                  variant="outline"
                  className="w-full justify-start border-gray-300 hover:bg-gray-50"
                  onClick={() => window.location.href = '/help'}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        decisionMaker={selectedDecisionMaker}
        onConfirm={handleBookingConfirm}
      />
    </div>
  );
}
