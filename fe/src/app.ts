// ZaUI stylesheet
import "zmp-ui/zaui.css";
// Tailwind stylesheet
import "@/css/tailwind.scss";
// Your stylesheet
import "@/css/app.scss";

// React core
import React from "react";
import { createRoot } from "react-dom/client";

// Mount the app
import Layout from "@/components/layout";

// Expose app configuration
import appConfig from "../app-config.json";

// NFR-R02: kích hoạt đồng bộ hàng đợi care-log offline khi mạng phục hồi.
import { initCareLogAutoSync } from "@/services/careLogAutoSync";

if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig as any;
}

initCareLogAutoSync();

const root = createRoot(document.getElementById("app")!);
root.render(React.createElement(Layout));
