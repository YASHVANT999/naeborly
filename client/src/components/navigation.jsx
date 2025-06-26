import { Link, useLocation } from "wouter";
import { Handshake, LogOut, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const authData = useAuth();
  const { user, isAuthenticated, logout, isLoggingOut } = authData;
  
  console.log('Navigation authData:', {
    isAuthenticated: authData.isAuthenticated,
    hasUser: !!authData.user,
    hasLogout: typeof authData.logout === 'function',
    isLoading: authData.isLoading
  });

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Handshake className="text-white text-sm" size={16} />
            </div>
            <span className="text-xl font-bold text-gray-900">Naeborly</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                className={location === "/" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}
              >
                Home
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <>
                {/* Show dashboard based on user role */}
                {user?.role === 'sales_rep' && (
                  <Link href="/sales-dashboard">
                    <Button
                      variant={location === "/sales-dashboard" ? "default" : "ghost"}
                      className={location === "/sales-dashboard" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}
                    >
                      Sales Dashboard
                    </Button>
                  </Link>
                )}
                
                {user?.role === 'decision_maker' && (
                  <Link href="/decision-dashboard">
                    <Button
                      variant={location === "/decision-dashboard" ? "default" : "ghost"}
                      className={location === "/decision-dashboard" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}
                    >
                      Decision Dashboard
                    </Button>
                  </Link>
                )}
                
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button
                      variant={location === "/admin" ? "default" : "ghost"}
                      className={location === "/admin" ? "bg-red-600 hover:bg-red-700" : "text-gray-600 hover:text-red-600"}
                    >
                      Admin Panel
                    </Button>
                  </Link>
                )}
                
                {user?.role === 'enterprise_admin' && (
                  <Link href="/enterprise-admin">
                    <Button
                      variant={location === "/enterprise-admin" ? "default" : "ghost"}
                      className={location === "/enterprise-admin" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}
                    >
                      Enterprise Admin
                    </Button>
                  </Link>
                )}

                {/* User dropdown menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User size={16} />
                      <span className="text-gray-700">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-gray-600">
                      {user?.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-600 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.preventDefault();
                        // Direct logout implementation
                        localStorage.removeItem('naeborly_token');
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.replace('/');
                      }}
                      className="text-red-600 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? "Signing out..." : "Sign out"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Show Sign In button when not authenticated */
              <Link href="/login">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <Handshake className="text-white text-sm" size={16} />
                    </div>
                    <span className="text-xl font-bold text-gray-900">Naeborly</span>
                  </SheetTitle>
                  <SheetDescription>
                    Navigation menu
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 flex flex-col space-y-4">
                  <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={location === "/" ? "default" : "ghost"}
                      className={`w-full justify-start ${location === "/" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}`}
                    >
                      Home
                    </Button>
                  </Link>
                  
                  {isAuthenticated ? (
                    <>
                      {/* Show dashboard based on user role */}
                      {user?.role === 'sales_rep' && (
                        <Link href="/sales-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant={location === "/sales-dashboard" ? "default" : "ghost"}
                            className={`w-full justify-start ${location === "/sales-dashboard" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}`}
                          >
                            Sales Dashboard
                          </Button>
                        </Link>
                      )}
                      
                      {user?.role === 'decision_maker' && (
                        <Link href="/decision-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant={location === "/decision-dashboard" ? "default" : "ghost"}
                            className={`w-full justify-start ${location === "/decision-dashboard" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}`}
                          >
                            Decision Dashboard
                          </Button>
                        </Link>
                      )}
                      
                      {user?.role === 'admin' && (
                        <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant={location === "/admin" ? "default" : "ghost"}
                            className={`w-full justify-start ${location === "/admin" ? "bg-red-600 hover:bg-red-700" : "text-gray-600 hover:text-red-600"}`}
                          >
                            Admin Panel
                          </Button>
                        </Link>
                      )}
                      
                      {user?.role === 'enterprise_admin' && (
                        <Link href="/enterprise-admin" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button
                            variant={location === "/enterprise-admin" ? "default" : "ghost"}
                            className={`w-full justify-start ${location === "/enterprise-admin" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-600 hover:text-blue-600"}`}
                          >
                            Enterprise Admin
                          </Button>
                        </Link>
                      )}

                      {/* User info and logout */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                            <p className="text-xs text-gray-400 capitalize">
                              {user?.role?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            localStorage.removeItem('naeborly_token');
                            localStorage.clear();
                            sessionStorage.clear();
                            setIsMobileMenuOpen(false);
                            window.location.replace('/');
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          {isLoggingOut ? "Signing out..." : "Sign out"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* Show Sign In button when not authenticated */
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
