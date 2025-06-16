import { Link, useLocation } from "wouter";
import { Handshake, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
              <Handshake className="text-white text-sm" size={16} />
            </div>
            <span className="text-xl font-bold text-gray-900">Naeberly</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                className={location === "/" ? "bg-purple-600 hover:bg-purple-700" : "text-gray-600 hover:text-purple-600"}
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
                      className={location === "/sales-dashboard" ? "bg-purple-600 hover:bg-purple-700" : "text-gray-600 hover:text-purple-600"}
                    >
                      Sales Dashboard
                    </Button>
                  </Link>
                )}
                
                {user?.role === 'decision_maker' && (
                  <Link href="/decision-dashboard">
                    <Button
                      variant={location === "/decision-dashboard" ? "default" : "ghost"}
                      className={location === "/decision-dashboard" ? "bg-purple-600 hover:bg-purple-700" : "text-gray-600 hover:text-purple-600"}
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
                      onClick={logout}
                      disabled={isLoggingOut}
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
                <Button className="bg-purple-600 text-white hover:bg-purple-700">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
