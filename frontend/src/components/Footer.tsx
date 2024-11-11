import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">PayView</h3>
            <p className="text-sm">Secure and simple online payments for everyone.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
              <li><a href="/payment" className="hover:text-white transition-colors">Make Payment</a></li>
              <li><a href="/mypayments" className="hover:text-white transition-colors">View Payments</a></li>
              <li><a href="/edit" className="hover:text-white transition-colors">Profile</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="/dashboard#contact" className="hover:text-white transition-colors">Contact Form</a></li>
            </ul>
          </div>
        </div>
        <Link to="/employeelogin">
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-center cursor-pointer">
            <p>&copy; {new Date().getFullYear()} PayView Payment Portal. All rights reserved.</p>
          </div>
        </Link>
      </div>
    </footer>
  )
}