import { Link } from "react-router-dom";
import { Sprout } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer-new">
      <div className="ft-container">
        {/* Top Row */}
        <div className="ft-top">
          {/* Left: Brand */}
          <div className="ft-brand">
            <div className="ft-logo">
              <Sprout size={24} color="#2ECC71" />
            </div>
            <div className="ft-brand-text">
              <h3>Nông sản Việt</h3>
              <p>Nông sản tươi ngon & minh bạch mỗi ngày</p>
            </div>
          </div>

          {/* Center: Links */}
          <div className="ft-links">
            <Link to="/">Về chúng tôi</Link>
            <Link to="/">Sản phẩm</Link>
            <Link to="/">Chính sách</Link>
            <Link to="/">Hỗ trợ</Link>
            <span className="ft-hotline">Hotline: <strong>1800 6868</strong></span>
          </div>

          {/* Right: Socials */}
          <div className="ft-socials">
            <a href="#" className="social-icon">f</a>
            <a href="#" className="social-icon">d</a>
            <a href="#" className="social-icon zalo">Zalo</a>
          </div>
        </div>

        {/* Divider */}
        <div className="ft-divider"></div>

        {/* Bottom Row */}
        <div className="ft-bottom">
          <p className="ft-copyright">© 2026 Nông Sản Việt. Giữ trọn sự tươi ngon cho mọi nhà.</p>
          
          <div className="ft-payments">
            <span className="pay-badge momo">MoMo</span>
            <span className="pay-badge vnpay">VNPAY</span>
            <span className="pay-badge visa">💳</span>
            <span className="pay-badge cod">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
