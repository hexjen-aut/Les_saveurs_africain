import React from "react";
import ReactDOM from "react-dom/client";
import ClientApp from "./ClientApp.jsx";
import AdminApp from "./AdminApp.jsx";

function Root() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminApp /> : <ClientApp />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
