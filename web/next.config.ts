import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Unity WebGL default .unityweb mappings (if you build with .unityweb)
      {
        source: "/unity/Build/:path*.data.unityweb",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Content-Encoding", value: "br" },
        ],
      },
      {
        source: "/unity/Build/:path*.wasm.unityweb",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Content-Encoding", value: "br" },
        ],
      },
      {
        source: "/unity/Build/:path*.framework.js.unityweb",
        headers: [
          { key: "Content-Type", value: "application/javascript" },
          { key: "Content-Encoding", value: "br" },
        ],
      },
      // Unity WebGL Brotli .br mappings (if you build with .br files)
      {
        source: "/unity/Build/:path*.data.br",
        headers: [
          { key: "Content-Type", value: "application/octet-stream" },
          { key: "Content-Encoding", value: "br" },
        ],
      },
      {
        source: "/unity/Build/:path*.wasm.br",
        headers: [
          { key: "Content-Type", value: "application/wasm" },
          { key: "Content-Encoding", value: "br" },
        ],
      },
      {
        source: "/unity/Build/:path*.framework.js.br",
        headers: [
          { key: "Content-Type", value: "application/javascript" },
          { key: "Content-Encoding", value: "br" },
        ],
      },
      // Enable cross-origin isolation for Unity on the /game page
      {
        source: "/game",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Origin-Agent-Cluster", value: "?1" },
        ],
      },
      // Mark Unity assets as same-origin resources (helps with COEP)
      {
        source: "/unity/:path*",
        headers: [
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
