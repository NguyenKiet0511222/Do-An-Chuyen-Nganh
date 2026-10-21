import { Component } from "react";

/**
 * Lưới an toàn: 1 trang lỗi lúc render chỉ hiện thông báo, không làm trắng cả ứng dụng.
 * resetKey đổi (App.jsx truyền đường dẫn hiện tại) thì tự thoát trạng thái lỗi — không dùng key để khỏi dựng lại cả layout.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error, info) {
    console.error("Lỗi hiển thị trang:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 520, margin: "80px auto", padding: 24, textAlign: "center", fontFamily: "inherit" }}>
        <h2 style={{ fontSize: 20, marginBottom: 8, color: "#0f172a" }}>Đã có lỗi khi hiển thị trang này</h2>
        <p style={{ color: "#64748b", marginBottom: 20 }}>Bạn thử tải lại trang. Nếu vẫn lỗi, hãy báo cho nhóm phát triển.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#059669", color: "#fff", fontWeight: 600, cursor: "pointer" }}
        >
          Tải lại trang
        </button>
      </div>
    );
  }
}
