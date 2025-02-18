'use client'
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">BE MY GUEST</h3>
            <p className="text-gray-400 text-lg">
              Creating innovative solutions for tomorrow's challenges.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Quick Links</h3>
            <ul className="space-y-3 text-gray-400 text-lg">
              {['About Us', "About", "Features"].map((item) => (
                <li key={item}>
                  <a className="hover:text-white transition-colors duration-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Legal</h3>
            <ul className="space-y-3 text-gray-400 text-lg">
              {['Privacy Policy', 'Terms of Use', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <a className="hover:text-white transition-colors duration-300">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">Follow Us</h3>
            <div className="flex space-x-6">
              {[
                { icon: FaFacebook, color: "#3b5998" },
                { icon: FaTwitter, color: "#1da1f2" },
                { icon: FaInstagram, color: "#e1306c" },
                { icon: FaLinkedin, color: "#0077b5" },
              ].map((SocialIcon, index) => (
                <a
                  key={index}
                  className="cursor-pointer p-3 rounded-full hover:bg-gray-900 transition-all duration-300"
                  style={{ color: SocialIcon.color }}
                >
                  <SocialIcon.icon size={28} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-12" />

        {/* Copyright */}
        <div className="text-center text-gray-400 text-lg">
          <p>
            © {new Date().getFullYear()} Your Company. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;