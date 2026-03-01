"use client";

import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";

export function JsonViewer({ data }: { data: unknown }) {
  return (
    <JsonView
      src={data}
      theme="vscode"
      collapseStringsAfterLength={80}
      collapsed={2}
      enableClipboard
    />
  );
}
