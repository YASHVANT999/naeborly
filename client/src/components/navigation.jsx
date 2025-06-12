import { Link, useLocation } from "wouter";
import { Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();

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
            <Link href="/sales-dashboard">
              <Button
                variant={location === "/sales-dashboard" ? "default" : "ghost"}
                className={location === "/sales-dashboard" ? "bg-purple-600 hover:bg-purple-700" : "text-gray-600 hover:text-purple-600"}
              >
                Sales Dashboard
              </Button>
            </Link>
            <Link href="/decision-dashboard">
              <Button
                variant={location === "/decision-dashboard" ? "default" : "ghost"}
                className={location === "/decision-dashboard" ? "bg-purple-600 hover:bg-purple-700" : "text-gray-600 hover:text-purple-600"}
              >
                Decision Maker
              </Button>
            </Link>
            <Link href="/signup/personal">
              <Button className="bg-purple-600 text-white hover:bg-purple-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
